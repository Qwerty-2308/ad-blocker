// Popup JavaScript
document.addEventListener('DOMContentLoaded', async () => {
  const toggleSwitch = document.getElementById('toggleSwitch');
  const statusIndicator = document.getElementById('statusIndicator');
  const statusText = document.getElementById('statusText');
  const adsBlockedElement = document.getElementById('adsBlocked');
  const sitesProtectedElement = document.getElementById('sitesProtected');
  const refreshBtn = document.getElementById('refreshBtn');
  const resetBtn = document.getElementById('resetBtn');

  // Load saved state
  const loadState = async () => {
    const result = await chrome.storage.sync.get(['enabled', 'adsBlocked', 'sitesProtected']);
    const enabled = result.enabled !== undefined ? result.enabled : true;
    const adsBlocked = result.adsBlocked || 0;
    const sitesProtected = result.sitesProtected || 0;

    toggleSwitch.checked = enabled;
    updateStatus(enabled);
    adsBlockedElement.textContent = adsBlocked.toLocaleString();
    sitesProtectedElement.textContent = sitesProtected.toLocaleString();
  };

  // Update status display
  const updateStatus = (enabled) => {
    if (enabled) {
      statusIndicator.classList.remove('inactive');
      statusText.textContent = 'Active';
    } else {
      statusIndicator.classList.add('inactive');
      statusText.textContent = 'Inactive';
    }
  };

  // Toggle ad blocking
  toggleSwitch.addEventListener('change', async (e) => {
    const enabled = e.target.checked;
    await chrome.storage.sync.set({ enabled });
    updateStatus(enabled);

    // Send message to background script
    chrome.runtime.sendMessage({ action: 'toggle', enabled });

    // Reload current tab to apply changes
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      chrome.tabs.reload(tab.id);
    }
  });

  // Refresh stats
  refreshBtn.addEventListener('click', async () => {
    await loadState();

    // Get current tab stats
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      chrome.tabs.sendMessage(tab.id, { action: 'getStats' }, (response) => {
        if (response && chrome.runtime.lastError === undefined) {
          updateStats(response.adsBlocked, response.sitesProtected);
        }
      });
    }
  });

  // Reset stats
  resetBtn.addEventListener('click', async () => {
    if (confirm('Are you sure you want to reset all statistics?')) {
      await chrome.storage.sync.set({ adsBlocked: 0, sitesProtected: 0 });
      adsBlockedElement.textContent = '0';
      sitesProtectedElement.textContent = '0';
    }
  });

  // Update stats display
  const updateStats = (adsBlocked, sitesProtected) => {
    if (adsBlocked !== undefined) {
      adsBlockedElement.textContent = adsBlocked.toLocaleString();
    }
    if (sitesProtected !== undefined) {
      sitesProtectedElement.textContent = sitesProtected.toLocaleString();
    }
  };

  // Listen for stats updates
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'updateStats') {
      updateStats(message.adsBlocked, message.sitesProtected);
    }
  });

  // Initialize
  loadState();
});

