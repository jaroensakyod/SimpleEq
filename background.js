// Service Worker – relay between content script and side panel

let sidePanelPort = null;
let lastCopyEventPayload = null;
let lastCopyEventAt = 0;

// Side panel connects here on startup
chrome.runtime.onConnect.addListener((port) => {
    if (port.name === 'sidepanel') {
        sidePanelPort = port;

        if (lastCopyEventPayload && lastCopyEventAt > 0) {
            try {
                sidePanelPort.postMessage({
                    type: 'COPY_EVENT',
                    payload: lastCopyEventPayload,
                    createdAt: lastCopyEventAt,
                    replay: true,
                });
            } catch (_) { }
        }

        port.onDisconnect.addListener(() => { sidePanelPort = null; });
    }
});

// Forward COPY_EVENT from content script → side panel
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'GET_LAST_COPY_EVENT') {
        sendResponse({
            ok: true,
            payload: lastCopyEventPayload,
            createdAt: lastCopyEventAt,
        });
        return;
    }

    if (message.type === 'COPY_EVENT' && sidePanelPort) {
        lastCopyEventPayload = message.payload || null;
        lastCopyEventAt = Date.now();

        try { sidePanelPort.postMessage(message); } catch (_) { }
        sendResponse({ ok: true });
        return;
    }

    if (message.type === 'COPY_EVENT') {
        lastCopyEventPayload = message.payload || null;
        lastCopyEventAt = Date.now();
        sendResponse({ ok: true });
        return;
    }
});

// Open side panel when user clicks the extension icon
chrome.action.onClicked.addListener((tab) => {
    chrome.sidePanel.open({ tabId: tab.id });
});

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
