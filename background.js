// Background service worker for IMBD Shortener extension
// Handles update checking and notifications

// Extension ID - you'll need to replace this with your actual extension ID from Chrome Web Store
const EXTENSION_ID = chrome.runtime.id;

// Update check interval (check every 24 hours)
const UPDATE_CHECK_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Initialize the background service worker
chrome.runtime.onInstalled.addListener((details) => {
    console.log('Extension installed/updated:', details.reason);

    if (details.reason === 'install') {
        // First time installation
        scheduleUpdateCheck();
        showWelcomeNotification();
    } else if (details.reason === 'update') {
        // Extension updated
        showUpdateNotification();
    }
});

// Handle extension startup
chrome.runtime.onStartup.addListener(() => {
    console.log('Extension started');
    scheduleUpdateCheck();
});

// Schedule periodic update checks
function scheduleUpdateCheck() {
    // Check for updates immediately
    checkForUpdates();

    // Set up periodic checking
    setInterval(checkForUpdates, UPDATE_CHECK_INTERVAL);
}

// Check for updates from Chrome Web Store
async function checkForUpdates() {
    try {
        console.log('Checking for updates...');

        // Get current version
        const currentVersion = chrome.runtime.getManifest().version;

        // Check if we should check for updates (avoid checking too frequently)
        const lastCheck = await getLastUpdateCheck();
        const now = Date.now();

        if (lastCheck && (now - lastCheck) < UPDATE_CHECK_INTERVAL) {
            console.log('Skipping update check - too soon since last check');
            return;
        }

        // Store the current check time
        await setLastUpdateCheck(now);

        // Use Chrome's built-in update checking
        const updateAvailable = await checkChromeWebStoreUpdate();

        if (updateAvailable) {
            console.log('Update available!');
            showUpdateAvailableNotification();
        } else {
            console.log('No updates available');
        }

    } catch (error) {
        console.error('Error checking for updates:', error);
    }
}

// Check Chrome Web Store for updates
async function checkChromeWebStoreUpdate() {
    try {
        // This is a simplified approach - Chrome handles most update checking automatically
        // We can check if there's a pending update
        return new Promise((resolve) => {
            chrome.runtime.requestUpdateCheck((status, details) => {
                console.log('Update check status:', status, details);

                if (status === 'update_available') {
                    resolve(true);
                } else if (status === 'no_update') {
                    resolve(false);
                } else {
                    // Throttled or other status
                    resolve(false);
                }
            });
        });
    } catch (error) {
        console.error('Error in Chrome update check:', error);
        return false;
    }
}

// Show notification when update is available
function showUpdateAvailableNotification() {
    const notificationOptions = {
        type: 'basic',
        iconUrl: 'icon48.png',
        title: 'IMBD Shortener Update Available',
        message: 'A new version is available. Click to update.',
        requireInteraction: true,
        buttons: [
            {
                title: 'Update Now',
                iconUrl: 'icon16.png'
            },
            {
                title: 'Later',
                iconUrl: 'icon16.png'
            }
        ]
    };

    chrome.notifications.create('update-available', notificationOptions, (notificationId) => {
        if (chrome.runtime.lastError) {
            console.error('Error creating notification:', chrome.runtime.lastError);
        } else {
            console.log('Update notification created:', notificationId);
        }
    });
}

// Show welcome notification for new installations
function showWelcomeNotification() {
    const notificationOptions = {
        type: 'basic',
        iconUrl: 'icon48.png',
        title: 'Welcome to IMBD Shortener!',
        message: 'Your extension has been installed successfully. Start shortening URLs now!',
        requireInteraction: false
    };

    chrome.notifications.create('welcome', notificationOptions, (notificationId) => {
        if (chrome.runtime.lastError) {
            console.error('Error creating welcome notification:', chrome.runtime.lastError);
        }
    });
}

// Show update notification when extension is updated
function showUpdateNotification() {
    const manifest = chrome.runtime.getManifest();
    const notificationOptions = {
        type: 'basic',
        iconUrl: 'icon48.png',
        title: 'IMBD Shortener Updated',
        message: `Updated to version ${manifest.version}. New features and improvements are available!`,
        requireInteraction: false
    };

    chrome.notifications.create('updated', notificationOptions, (notificationId) => {
        if (chrome.runtime.lastError) {
            console.error('Error creating update notification:', chrome.runtime.lastError);
        }
    });
}

// Handle notification clicks
chrome.notifications.onClicked.addListener((notificationId) => {
    console.log('Notification clicked:', notificationId);

    if (notificationId === 'update-available') {
        // Open the extension's update page or Chrome Web Store
        chrome.tabs.create({
            url: `https://chrome.google.com/webstore/detail/${EXTENSION_ID}`
        });
    }
});

// Handle notification button clicks
chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
    console.log('Notification button clicked:', notificationId, buttonIndex);

    if (notificationId === 'update-available') {
        if (buttonIndex === 0) {
            // "Update Now" button clicked
            chrome.tabs.create({
                url: `https://chrome.google.com/webstore/detail/${EXTENSION_ID}`
            });
        }
        // "Later" button - just close the notification
        chrome.notifications.clear(notificationId);
    }
});

// Storage functions for update checking
async function getLastUpdateCheck() {
    try {
        const result = await chrome.storage.local.get('lastUpdateCheck');
        return result.lastUpdateCheck || null;
    } catch (error) {
        console.error('Error getting last update check:', error);
        return null;
    }
}

async function setLastUpdateCheck(timestamp) {
    try {
        await chrome.storage.local.set({ lastUpdateCheck: timestamp });
    } catch (error) {
        console.error('Error setting last update check:', error);
    }
}

// Handle messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'checkForUpdates') {
        checkForUpdates().then(() => {
            sendResponse({ success: true });
        });
        return true; // Keep the message channel open for async response
    }

    if (request.action === 'getVersion') {
        const manifest = chrome.runtime.getManifest();
        sendResponse({ version: manifest.version });
    }
});

// Listen for extension update events
chrome.runtime.onUpdateAvailable.addListener((details) => {
    console.log('Update available:', details);
    showUpdateAvailableNotification();
});

// Handle extension update completion
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'update') {
        console.log('Extension updated to version:', chrome.runtime.getManifest().version);
        showUpdateNotification();
    }
});
