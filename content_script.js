// Content Script – listens for copy events and sends HTML + text to side panel

document.addEventListener('copy', () => {
    // Small delay so the clipboard is populated before we read the selection
    setTimeout(() => {
        const selection = window.getSelection();
        if (!selection || selection.isCollapsed) return;

        const range = selection.getRangeAt(0);
        const container = document.createElement('div');
        container.appendChild(range.cloneContents());
        const html = container.innerHTML;
        const text = selection.toString();

        if (!text.trim()) return;

        chrome.runtime.sendMessage({
            type: 'COPY_EVENT',
            payload: { html, text }
        });
    }, 50);
});
