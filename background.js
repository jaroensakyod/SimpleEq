// Service Worker – relay between content script and side panel

let sidePanelPort = null;

// Side panel connects here on startup
chrome.runtime.onConnect.addListener((port) => {
    if (port.name === 'sidepanel') {
        sidePanelPort = port;
        port.onDisconnect.addListener(() => { sidePanelPort = null; });
    }
});

// Forward COPY_EVENT from content script → side panel
chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'COPY_EVENT' && sidePanelPort) {
        try { sidePanelPort.postMessage(message); } catch (_) { }
    }
});

// Open side panel when user clicks the extension icon
chrome.action.onClicked.addListener((tab) => {
    chrome.sidePanel.open({ tabId: tab.id });
});

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
