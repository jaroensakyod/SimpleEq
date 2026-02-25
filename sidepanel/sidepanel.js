/* ================================================================
   sidepanel.js  –  Equation Renderer Chrome Extension (Side Panel)
   ================================================================ */

/* ----------------------------------------------------------------
   1.  DOM refs
   ---------------------------------------------------------------- */
const box1 = document.getElementById('box1');
const box2 = document.getElementById('box2');
const convertBtn = document.getElementById('convertBtn');
const renderBtn = document.getElementById('renderBtn');
const clearBox1 = document.getElementById('clearBox1');
const clearBox2 = document.getElementById('clearBox2');
const tableTag = document.getElementById('tableTag');
const autoBadge = document.getElementById('autoBadge');
const memberBadge = document.getElementById('memberBadge');
const upgradeBtn = document.getElementById('upgradeBtn');
const box3Wrapper = document.getElementById('box3Wrapper');
const box3 = document.getElementById('box3');
const copyResultBtn = document.getElementById('copyResultBtn');

const HUB_BASE_URL = localStorage.getItem('simpleEqHubBaseUrl') || 'http://localhost:3000';
const USER_STATUS_ENDPOINT = `${HUB_BASE_URL}/api/v1/user/status`;

/* ----------------------------------------------------------------
   2.  State
   ---------------------------------------------------------------- */
let originalText = '';
let originalHtml = '';
let latexText = '';
let hasTable = false;
let isEmpty = true;
let upgradeLink = '';

function renderMemberState(state, link = '', note = '') {
    memberBadge.classList.remove('pro', 'free', 'error');

    if (state === 'PRO') {
        memberBadge.textContent = '✅ PRO';
        memberBadge.classList.add('pro');
        upgradeBtn.style.display = 'none';
        upgradeLink = '';
        return;
    }

    if (state === 'FREE') {
        memberBadge.textContent = '🆓 FREE';
        memberBadge.classList.add('free');
        upgradeLink = link || '';
        upgradeBtn.style.display = upgradeLink ? '' : 'none';
        return;
    }

    memberBadge.textContent = note ? `⚠️ ${note}` : '⚠️ Status unavailable';
    memberBadge.classList.add('error');
    upgradeBtn.style.display = 'none';
    upgradeLink = '';
}

async function syncMemberStatusFromHub() {
    try {
        const response = await fetch(USER_STATUS_ENDPOINT, {
            method: 'GET',
            credentials: 'include',
            cache: 'no-store',
            headers: { Accept: 'application/json' },
        });

        const payload = await response.json();

        if (!response.ok) {
            if (payload?.code === 'ORIGIN_NOT_ALLOWED') {
                renderMemberState('ERROR', '', 'Origin not allowed');
                return;
            }
            renderMemberState('ERROR');
            return;
        }

        if (payload?.status === 'PRO') {
            renderMemberState('PRO');
            return;
        }

        renderMemberState('FREE', payload?.link || '');
    } catch (e) {
        renderMemberState('ERROR');
    }
}

/* ----------------------------------------------------------------
   3.  Helpers – innerHtml → plain text (preserve table / list)
   ---------------------------------------------------------------- */
function innerHtmlToPlainText(el) {
    const parts = [];
    const olCounterStack = [];

    function walk(node) {
        if (node.nodeType === Node.TEXT_NODE) { parts.push(node.textContent || ''); return; }
        const elem = node;
        const tag = elem.tagName?.toLowerCase();

        if (tag === 'table') {
            elem.querySelectorAll('tr').forEach((row) => {
                const cells = Array.from(row.querySelectorAll('td,th'));
                cells.forEach((cell, i) => {
                    if (i > 0) parts.push('\t');
                    parts.push((cell.textContent || '').replace(/\n+/g, ' ').trim());
                });
                parts.push('\n');
            });
            parts.push('\n'); return;
        }
        if (tag === 'br') { parts.push('\n'); return; }
        if (tag === 'ol') {
            const startVal = parseInt((elem).getAttribute('start') || '1', 10);
            olCounterStack.push(startVal - 1);
            node.childNodes.forEach(walk);
            olCounterStack.pop(); return;
        }
        if (tag === 'ul') {
            olCounterStack.push(-1);
            node.childNodes.forEach(walk);
            olCounterStack.pop(); return;
        }
        if (tag === 'li') {
            const level = olCounterStack.length;
            if (level > 0) {
                const counter = olCounterStack[level - 1];
                if (counter === -1) {
                    parts.push('• ');
                } else {
                    const valAttr = elem.getAttribute('value');
                    if (valAttr) olCounterStack[level - 1] = parseInt(valAttr, 10);
                    else olCounterStack[level - 1]++;
                    parts.push(`${olCounterStack[level - 1]}. `);
                }
            }
            node.childNodes.forEach(walk);
            parts.push('\n'); return;
        }
        node.childNodes.forEach(walk);
        if (['p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tag)) parts.push('\n');
    }

    el.childNodes.forEach(walk);
    return parts.join('').replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n{3,}/g, '\n\n').trimEnd();
}

/* ----------------------------------------------------------------
   4.  Helpers – textToLatex (port from converters.ts)
   ---------------------------------------------------------------- */
function convertSymbols(s) {
    let r = s;
    r = r.replace(/<=>|⇌/g, '\\rightleftharpoons');
    r = r.replace(/->|→/g, '\\rightarrow');
    r = r.replace(/×/g, '\\times');
    r = r.replace(/÷/g, '\\div');
    r = r.replace(/([A-Za-z0-9]+)\/([A-Za-z0-9]+)/g, '\\frac{$1}{$2}');
    r = r.replace(/([A-Za-z)])(\d+)/g, '$1_{$2}');
    return r;
}

function convertLineToLatex(line) {
    if (/\$/.test(line)) return line;
    return line.replace(
        /([A-Za-z0-9().*^_+\-\/=<>→⇌\\]+(?:\s*[=+\-*\/^_×÷→⇌<>]\s*[A-Za-z0-9().*^_+\-\/=<>→⇌\\]+)+|[A-Za-z]+\d[A-Za-z0-9()_]*|[A-Za-z]\([^)]+\)\d*|\d+\/\d+)/g,
        (match) => {
            if (/^\d+$/.test(match.trim())) return match;
            if (/^[a-zA-Z]$/.test(match.trim())) return match;
            return `$${convertSymbols(match.trim())}$`;
        }
    );
}

function textToLatex(input) {
    const normalized = input.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    return normalized.split('\n').map(convertLineToLatex).join('\n');
}

/* ----------------------------------------------------------------
   5.  Helpers – KaTeX rendering (wait for katex to load)
   ---------------------------------------------------------------- */
function renderKatex(text, container) {
    if (typeof katex === 'undefined') {
        container.textContent = 'กำลังโหลด KaTeX...';
        setTimeout(() => renderKatex(text, container), 200);
        return;
    }
    container.innerHTML = '';
    const lines = text.split('\n');
    for (const line of lines) {
        if (!line.trim()) { container.appendChild(document.createElement('br')); continue; }

        // display math $$...$$
        const displayMatch = line.match(/^\$\$(.+)\$\$$/);
        if (displayMatch) {
            const div = document.createElement('div');
            div.className = 'katex-display';
            try { katex.render(displayMatch[1], div, { displayMode: true, throwOnError: false }); }
            catch (e) { div.textContent = displayMatch[1]; }
            container.appendChild(div);
            continue;
        }

        // inline math with mixed text
        const p = document.createElement('p');
        p.style.margin = '2px 0';
        const parts = line.split(/(\$[^$\n]+\$)/g);
        for (const part of parts) {
            const m = part.match(/^\$([^$]+)\$$/);
            if (m) {
                const span = document.createElement('span');
                try { katex.render(m[1], span, { displayMode: false, throwOnError: false }); }
                catch (e) { span.textContent = part; }
                p.appendChild(span);
            } else {
                p.appendChild(document.createTextNode(part));
            }
        }
        container.appendChild(p);
    }
}

function renderWordHtml(html, container) {
    // Clean MSO styles, then walk DOM nodes and apply KaTeX to text with $...$
    const wrapper = document.createElement('div');
    wrapper.innerHTML = html;

    // remove mso / word XML namespaced stuff — keep structure
    wrapper.querySelectorAll('[style]').forEach(el => el.removeAttribute('style'));
    wrapper.querySelectorAll('[class]').forEach(el => el.removeAttribute('class'));

    // walk text nodes and render inline katex
    function walkAndRender(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent || '';
            if (!/\$/.test(text)) return;
            const span = document.createElement('span');
            const dollarRe = /(\$\$[^$]+\$\$|\$[^$\n]+\$)/g;
            const parts = text.split(dollarRe);
            const matchDm = (s) => s.match(/^\$\$([^$]+)\$\$$/);
            const matchIm = (s) => s.match(/^\$([^$]+)\$$/);
            for (const p of parts) {
                const dm = matchDm(p);
                const im = matchIm(p);
                if (dm) {
                    const d = document.createElement('div');
                    try { katex.render(dm[1], d, { displayMode: true, throwOnError: false }); }
                    catch (e) { d.textContent = p; }
                    span.appendChild(d);
                } else if (im) {
                    const s = document.createElement('span');
                    try { katex.render(im[1], s, { displayMode: false, throwOnError: false }); }
                    catch (e) { s.textContent = p; }
                    span.appendChild(s);
                } else {
                    span.appendChild(document.createTextNode(p));
                }
            }
            node.replaceWith(span);
            return;
        }
        Array.from(node.childNodes).forEach(walkAndRender);
    }

    walkAndRender(wrapper);
    container.innerHTML = '';
    container.appendChild(wrapper);
}

/* ----------------------------------------------------------------
   6.  UI Sync
   ---------------------------------------------------------------- */
function syncState() {
    isEmpty = !box1.textContent.trim() && !box1.innerHTML.includes('<img');
    hasTable = box1.querySelector('table') !== null;
    originalHtml = box1.innerHTML;
    originalText = innerHtmlToPlainText(box1);
    latexText = box2.value;

    clearBox1.disabled = isEmpty;
    clearBox2.disabled = !latexText.trim();
    convertBtn.disabled = isEmpty;
    tableTag.style.display = hasTable ? '' : 'none';

    const canRender = hasTable ? !!originalHtml : !!latexText.trim();
    renderBtn.disabled = !canRender;
}

/* ----------------------------------------------------------------
   7.  Event Listeners
   ---------------------------------------------------------------- */
box1.addEventListener('input', syncState);
box1.addEventListener('paste', () => setTimeout(syncState, 0));
box1.addEventListener('keyup', syncState);
box2.addEventListener('input', syncState);
box2.addEventListener('paste', () => setTimeout(syncState, 0));

convertBtn.addEventListener('click', () => {
    const result = textToLatex(originalText);
    box2.value = result;
    latexText = result;
    syncState();
    convertBtn.textContent = '✅ แปลงเรียบร้อยแล้ว';
    convertBtn.classList.add('success');
    setTimeout(() => {
        convertBtn.textContent = '🔄 แปลงเป็น LaTeX →';
        convertBtn.classList.remove('success');
    }, 2000);
});

renderBtn.addEventListener('click', () => {
    box3Wrapper.style.display = '';
    if (hasTable && originalHtml) {
        renderWordHtml(originalHtml, box3);
    } else {
        renderKatex(box2.value, box3);
    }
});

clearBox1.addEventListener('click', () => {
    box1.innerHTML = '';
    originalText = ''; originalHtml = ''; hasTable = false;
    box3Wrapper.style.display = 'none';
    syncState();
});

clearBox2.addEventListener('click', () => {
    box2.value = ''; latexText = '';
    box3Wrapper.style.display = 'none';
    syncState();
});

copyResultBtn.addEventListener('click', () => {
    const sel = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(box3);
    sel.removeAllRanges();
    sel.addRange(range);
    document.execCommand('copy');
    sel.removeAllRanges();
    copyResultBtn.textContent = '✅ คัดลอกแล้ว';
    copyResultBtn.classList.add('success');
    setTimeout(() => {
        copyResultBtn.textContent = '📋 คัดลอก';
        copyResultBtn.classList.remove('success');
    }, 2500);
});

upgradeBtn.addEventListener('click', () => {
    if (!upgradeLink) return;
    window.open(upgradeLink, '_blank', 'noopener,noreferrer');
});

/* ----------------------------------------------------------------
   8.  Connect to background via Port → receive COPY_EVENT
        (In MV3, side panels must use long-lived ports to receive
         forwarded messages from the background service worker.)
   ---------------------------------------------------------------- */
function connectToBackground() {
    try {
        const port = chrome.runtime.connect({ name: 'sidepanel' });

        port.onMessage.addListener((message) => {
            if (message.type !== 'COPY_EVENT') return;
            const { html, text } = message.payload;
            if (!text || !text.trim()) return;

            // Populate Box 1 with copied HTML (preserves tables, lists, bold)
            box1.innerHTML = html || text;

            // Flash "Auto" badge
            autoBadge.style.display = '';
            setTimeout(() => { autoBadge.style.display = 'none'; }, 2500);

            syncState();
            box1.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });

        // Reconnect if the service worker restarts (MV3 service workers are ephemeral)
        port.onDisconnect.addListener(() => {
            setTimeout(connectToBackground, 1000);
        });
    } catch (e) {
        // Retry after a short delay if connect fails during startup
        setTimeout(connectToBackground, 1000);
    }
}

connectToBackground();

syncMemberStatusFromHub();

document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        syncMemberStatusFromHub();
    }
});

/* Initial sync */
syncState();
