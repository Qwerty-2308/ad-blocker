// Background Service Worker
chrome.runtime.onInstalled.addListener(async () => {
  console.log('Ad Blocker extension installed');

  // Initialize default settings
  chrome.storage.sync.get(['enabled', 'adsBlocked', 'sitesProtected'], (result) => {
    if (result.enabled === undefined) {
      chrome.storage.sync.set({ enabled: true });
    }
    if (result.adsBlocked === undefined) {
      chrome.storage.sync.set({ adsBlocked: 0 });
    }
    if (result.sitesProtected === undefined) {
      chrome.storage.sync.set({ sitesProtected: 0 });
    }
  });

  // Initialize dynamic rules
  try {
    // Get existing rules
    const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
    const ruleIds = existingRules.map(rule => rule.id);

    // Remove existing rules if any (rules are loaded from rules.json via manifest)
    if (ruleIds.length > 0) {
      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: ruleIds
      });
    }
  } catch (err) {
    console.log('Error initializing rules:', err);
  }
});

// Listen for messages from popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'toggle') {
    chrome.storage.sync.set({ enabled: message.enabled });
    sendResponse({ success: true });
  } else if (message.action === 'blockAd') {
    // Increment blocked ads count
    chrome.storage.sync.get(['adsBlocked'], (result) => {
      const count = (result.adsBlocked || 0) + 1;
      chrome.storage.sync.set({ adsBlocked: count });

      // Notify popup if open
      chrome.runtime.sendMessage({
        action: 'updateStats',
        adsBlocked: count
      }).catch(() => {
        // Popup might not be open, ignore error
      });
    });
    sendResponse({ success: true });
  } else if (message.action === 'siteProtected') {
    // Track protected sites
    chrome.storage.sync.get(['sitesProtected'], (result) => {
      const count = (result.sitesProtected || 0) + 1;
      chrome.storage.sync.set({ sitesProtected: count });
    });
    sendResponse({ success: true });
  }
});
