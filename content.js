// Content Script for Ad Blocking
(function () {
  'use strict';

  let adsBlocked = 0;
  let isEnabled = true;

  // Load settings
  chrome.storage.sync.get(['enabled'], (result) => {
    isEnabled = result.enabled !== undefined ? result.enabled : true;
    if (isEnabled) {
      startBlocking();
    }
  });

  // Listen for enable/disable changes
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.enabled) {
      isEnabled = changes.enabled.newValue;
      if (isEnabled) {
        startBlocking();
      } else {
        stopBlocking();
      }
    }
  });

  // Listen for messages
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'getStats') {
      sendResponse({ adsBlocked, sitesProtected: 1 });
    }
  });

  function startBlocking() {
    if (!isEnabled) return;

    // Check if we're on YouTube
    const isYouTube = window.location.hostname.includes('youtube.com') ||
      window.location.hostname.includes('youtu.be');

    if (isYouTube) {
      startYouTubeAdBlocking();
    }

    // Block common ad selectors - expanded list for better detection
    const adSelectors = [
      // Generic ad classes
      '[class*="ad-"]',
      '[class*="-ad"]',
      '[class*="ad_"]',
      '[class*="_ad"]',
      '[class*="advertisement"]',
      '[id*="ad-"]',
      '[id*="-ad"]',
      '[id*="ad_"]',
      '[id*="_ad"]',
      '[id*="advertisement"]',

      // Specific ad services
      '.google-ad',
      '.adsbygoogle',
      '.ad-container',
      '.ad-wrapper',
      '.ad-banner',
      '.ad-slot',
      '.ad-unit',
      '.sponsored',
      '.promoted',
      '.promotion',
      '[data-ad]',
      '[data-advertisement]',

      // Ad iframes
      'iframe[src*="doubleclick"]',
      'iframe[src*="googlesyndication"]',
      'iframe[src*="adservice"]',
      'iframe[src*="/ads/"]',
      'iframe[src*="advertising"]',

      // Common ad containers
      '[class*="banner"]',
      '[class*="promo"]',
      '[id*="banner"]',
      '[id*="promo"]',
      'aside[class*="ad"]',
      'div[class*="sponsor"]',
    ];

    // MutationObserver to block dynamically loaded ads
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === 1) { // Element node
            // Check if node matches ad selectors (immediate block)
            for (const selector of adSelectors) {
              try {
                if (node.matches && node.matches(selector)) {
                  coverUpAd(node);
                  continue;
                }
                // Check children
                const matches = node.querySelectorAll(selector);
                matches.forEach((match) => coverUpAd(match));
              } catch (e) {
                // Invalid selector, skip
              }
            }

            // Check for ad-like URLs in iframes and scripts
            if (node.tagName === 'IFRAME' || node.tagName === 'SCRIPT') {
              const src = node.src || node.getAttribute('src') || '';
              if (isAdUrl(src)) {
                coverUpAd(node);
                continue;
              }
            }
          }
        }
      }
    });

    // Start observing
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });

    // Block existing ads on page load
    setTimeout(() => {
      // Block obvious ads
      for (const selector of adSelectors) {
        try {
          document.querySelectorAll(selector).forEach((element) => {
            coverUpAd(element);
          });
        } catch (e) {
          // Invalid selector
        }
      }
    }, 1000);

    // Notify background that site is protected
    chrome.runtime.sendMessage({ action: 'siteProtected' });
  }

  function stopBlocking() {
    // Remove any blocking that was applied
    // In a real implementation, you'd track what was blocked and restore it
  }

  function coverUpAd(element, reason = '') {
    if (!element || element.dataset.adBlocked) return;

    try {
      element.dataset.adBlocked = 'true';

      // Get the background color from the document body or parent element
      function getBackgroundColor(el) {
        // Try to get background from parent element first
        let parent = el.parentElement;
        while (parent && parent !== document.body) {
          const bgColor = window.getComputedStyle(parent).backgroundColor;
          if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
            return bgColor;
          }
          parent = parent.parentElement;
        }

        // Fallback to body background
        const bodyBg = window.getComputedStyle(document.body).backgroundColor;
        if (bodyBg && bodyBg !== 'rgba(0, 0, 0, 0)' && bodyBg !== 'transparent') {
          return bodyBg;
        }

        // Final fallback to white (common default)
        return '#ffffff';
      }

      const backgroundColor = getBackgroundColor(element);

      // Hide all child content
      const children = element.querySelectorAll('*');
      children.forEach(child => {
        child.style.display = 'none';
        child.style.visibility = 'hidden';
        child.style.opacity = '0';
      });

      // Stop media elements
      element.querySelectorAll('iframe, video, audio, embed, object').forEach(media => {
        media.src = '';
        media.srcset = '';
        media.remove();
      });

      // Clear inner content but preserve structure to maintain layout
      element.innerHTML = '';

      // Set background color to match page background
      element.style.backgroundColor = backgroundColor;
      element.style.backgroundImage = 'none';
      element.style.background = backgroundColor;

      // Ensure element maintains its dimensions
      const rect = element.getBoundingClientRect();
      if (rect.height > 0) {
        element.style.minHeight = rect.height + 'px';
      }
      if (rect.width > 0) {
        element.style.minWidth = rect.width + 'px';
      }

      // Remove any borders or visible styling that might indicate an ad
      element.style.border = 'none';
      element.style.outline = 'none';
      element.style.boxShadow = 'none';

      // Make sure it's not clickable
      element.style.pointerEvents = 'none';
      element.style.cursor = 'default';

      // Ensure content is hidden
      element.style.color = backgroundColor; // Make text same color as background
      element.style.overflow = 'hidden';

      adsBlocked++;
      chrome.runtime.sendMessage({ action: 'blockAd' });
    } catch (error) {
      console.error('Error covering ad:', error);
      // Fallback: just hide the element
      element.style.display = 'none';
      element.style.visibility = 'hidden';
      adsBlocked++;
      chrome.runtime.sendMessage({ action: 'blockAd' });
    }
  }

  // Legacy function name for compatibility
  function blockElement(element) {
    coverUpAd(element);
  }

  function isAdUrl(url) {
    const adDomains = [
      'doubleclick.net',
      'googlesyndication.com',
      'googleadservices.com',
      'adservice.google',
      'adbrite.com',
      'advertising.com',
      'adnxs.com',
      'adsrvr.org',
      'adtechus.com',
      'amazon-adsystem.com',
      'facebook.com/ads',
      'outbrain.com',
      'taboola.com',
      // YouTube ad domains
      'youtube.com/pagead',
      'youtube.com/api/stats/ads',
      'youtube.com/get_video_info',
      'googleads.g.doubleclick.net',
      'youtube.com/ads',
      'youtube.com/ad',
      'googlevideo.com/pagead',
      'youtube.com/ptracking',
      'youtube.com/pagead/conversion',
    ];

    return adDomains.some(domain => url.includes(domain));
  }

  // YouTube-specific ad blocking
  function startYouTubeAdBlocking() {
    console.log('YouTube ad blocking activated');

    // Function to skip YouTube ads
    function skipYouTubeAd() {
      // Multiple selectors for the skip button (YouTube changes these frequently)
      const skipButtonSelectors = [
        'button.ytp-ad-skip-button',
        'button.ytp-ad-skip-button-modern',
        '.ytp-ad-skip-button',
        '.ytp-ad-skip-button-modern',
        'button[class*="skip"]',
        'button[aria-label*="Skip"]',
        'button[aria-label*="skip"]',
        '.ytp-skip-ad-button',
        'button.ytp-skip-ad-button',
        // More generic selectors
        'button[data-title-no-tooltip="Skip ad"]',
        'button[data-title-no-tooltip="Skip"]',
        '.ytp-ad-skip-button-container button',
        '.ytp-ad-overlay-close-button',
        '.ytp-ad-overlay-close-container button'
      ];

      for (const selector of skipButtonSelectors) {
        try {
          const skipButton = document.querySelector(selector);
          if (skipButton && skipButton.offsetParent !== null) {
            // Button is visible
            skipButton.click();
            console.log('YouTube ad skipped!');
            adsBlocked++;
            chrome.runtime.sendMessage({ action: 'blockAd' });
            return true;
          }
        } catch (e) {
          // Continue to next selector
        }
      }

      // Also try to find skip button by text content
      const buttons = document.querySelectorAll('button');
      for (const button of buttons) {
        const text = button.textContent?.toLowerCase() || '';
        const ariaLabel = button.getAttribute('aria-label')?.toLowerCase() || '';
        if ((text.includes('skip') || ariaLabel.includes('skip')) &&
          button.offsetParent !== null) {
          try {
            button.click();
            console.log('YouTube ad skipped via text match!');
            adsBlocked++;
            chrome.runtime.sendMessage({ action: 'blockAd' });
            return true;
          } catch (e) {
            // Continue
          }
        }
      }

      return false;
    }

    // Function to block YouTube ad overlays
    function blockYouTubeAdOverlays() {
      const adOverlaySelectors = [
        '.ytp-ad-overlay-container',
        '.ytp-ad-overlay',
        '.ytp-ad-text',
        '.ytp-ad-module',
        '.ad-container',
        '.ad-div',
        '.video-ads',
        '.ytp-ad-module',
        '[class*="ad-overlay"]',
        '[id*="ad-overlay"]',
        '.companion-ad',
        '.ytp-companion-ad'
      ];

      adOverlaySelectors.forEach(selector => {
        try {
          document.querySelectorAll(selector).forEach(element => {
            if (element && !element.dataset.adBlocked) {
              coverUpAd(element);
            }
          });
        } catch (e) {
          // Invalid selector
        }
      });
    }

    // Function to detect and handle YouTube video ads
    function handleYouTubeVideoAds() {
      // Check if video player is showing an ad
      const video = document.querySelector('video');
      if (!video) return;

      // Check for ad indicators in the player
      const player = document.querySelector('.html5-video-player');
      if (player) {
        // Check if ad is playing by looking for ad-related classes
        const hasAdClass = player.classList.toString().includes('ad') ||
          player.classList.toString().includes('ad-showing') ||
          document.querySelector('.ytp-ad-player-overlay') !== null;

        if (hasAdClass) {
          // Try to skip the ad
          skipYouTubeAd();
        }
      }

      // Check for ad overlay on video
      const adOverlay = document.querySelector('.ytp-ad-overlay-container');
      if (adOverlay && adOverlay.offsetParent !== null) {
        // Try to close the overlay
        const closeButton = adOverlay.querySelector('button, .ytp-ad-overlay-close-button');
        if (closeButton) {
          closeButton.click();
        } else {
          coverUpAd(adOverlay);
        }
      }
    }

    // Continuously monitor for YouTube ads
    const youtubeAdObserver = new MutationObserver(() => {
      skipYouTubeAd();
      blockYouTubeAdOverlays();
      handleYouTubeVideoAds();
    });

    // Start observing YouTube player area
    const playerContainer = document.querySelector('#movie_player, .html5-video-player, #player');
    if (playerContainer) {
      youtubeAdObserver.observe(playerContainer, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'style']
      });
    }

    // Also observe the entire document for ad elements
    youtubeAdObserver.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Try to skip ads immediately and periodically
    const skipInterval = setInterval(() => {
      if (!isEnabled) {
        clearInterval(skipInterval);
        return;
      }
      skipYouTubeAd();
      blockYouTubeAdOverlays();
      handleYouTubeVideoAds();
    }, 500); // Check every 500ms

    // Listen for video events
    const video = document.querySelector('video');
    if (video) {
      video.addEventListener('play', () => {
        setTimeout(() => {
          skipYouTubeAd();
          handleYouTubeVideoAds();
        }, 1000);
      });

      video.addEventListener('timeupdate', () => {
        // Check periodically while video is playing
        if (Math.random() < 0.1) { // 10% chance to check on each timeupdate
          skipYouTubeAd();
        }
      });
    }

    // Initial check
    setTimeout(() => {
      skipYouTubeAd();
      blockYouTubeAdOverlays();
      handleYouTubeVideoAds();
    }, 1000);
  }

  // Block requests using fetch and XMLHttpRequest interception
  if (isEnabled) {
    // Intercept fetch
    const originalFetch = window.fetch;
    window.fetch = function (...args) {
      const url = args[0];
      if (typeof url === 'string' && isAdUrl(url)) {
        return Promise.reject(new Error('Blocked by ad blocker'));
      }
      return originalFetch.apply(this, args);
    };

    // Intercept XMLHttpRequest
    const originalOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function (method, url, ...rest) {
      if (isAdUrl(url)) {
        throw new Error('Blocked by ad blocker');
      }
      return originalOpen.apply(this, [method, url, ...rest]);
    };
  }
})();

