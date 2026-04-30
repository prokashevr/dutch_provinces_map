import { PROVINCES, TOTAL_PROVINCES, isKnownProvince, getProvinceName } from './provinces.js';
import { loadVisited, saveVisited } from './storage.js';

function getRequiredElement(id) {
    const el = document.getElementById(id);
    if (!el) throw new Error(`Required element #${id} is missing from the DOM`);
    return el;
}

const elements = {
    map:          getRequiredElement('map'),
    count:        getRequiredElement('count'),
    progressBar:  getRequiredElement('progressBar'),
    provinceList: getRequiredElement('provinceList'),
    undoBtn:      getRequiredElement('undoBtn'),
    resetBtn:     getRequiredElement('resetBtn'),
    tooltip:      getRequiredElement('tooltip'),
    status:       getRequiredElement('status'),
};

const provinceElements = new Map();

let state = {
    visited: loadVisited(),
    lastAction: null      // { id, prevValue } for one-level undo
};

let statusTimer = null;
let tooltipTimer = null;

function cacheProvinceElements() {
    provinceElements.clear();
    for (const p of PROVINCES) {
        provinceElements.set(p.id, {
            path: elements.map.querySelector(`.province[data-province="${p.id}"]`),
            item: elements.provinceList.querySelector(`.pv-item[data-province="${p.id}"]`),
        });
    }
}

/* ───────── Render ───────── */

function visitedCount() {
    return Object.values(state.visited).filter(Boolean).length;
}

function render() {
    const count = visitedCount();
    elements.count.textContent = count;
    elements.progressBar.style.width = `${(count / TOTAL_PROVINCES) * 100}%`;

    PROVINCES.forEach(p => {
        const refs = provinceElements.get(p.id);
        if (!refs) return;
        const isVisited = !!state.visited[p.id];
        if (refs.path) refs.path.classList.toggle('visited', isVisited);
        if (refs.item) refs.item.classList.toggle('is-visited', isVisited);
    });

    elements.undoBtn.disabled = !state.lastAction;
}

function buildList() {
    elements.provinceList.innerHTML = PROVINCES
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(p => `
            <li class="pv-item" data-province="${p.id}">
                <span class="pv-dot" aria-hidden="true"></span>
                <span class="pv-name">${p.name}</span>
            </li>
        `).join('');
}

/* ───────── Interaction ───────── */

function toggleProvince(id, source) {
    if (!isKnownProvince(id)) return;

    state.lastAction = { id, prevValue: !!state.visited[id] };
    state.visited[id] = !state.visited[id];

    saveVisited(state.visited);
    render();
    popPath(id);

    if (navigator.vibrate) navigator.vibrate(state.visited[id] ? 18 : 10);

    if (visitedCount() === TOTAL_PROVINCES) {
        if (navigator.vibrate) navigator.vibrate([30, 20, 30, 20, 60]);
        showStatus('All 12 provinces visited 🇳🇱', 'success', 2400);
    } else if (source !== 'list') {
        showTooltip(`${getProvinceName(id)} ${state.visited[id] ? '✓' : ''}`.trim());
    }
}

function undoLast() {
    if (!state.lastAction) return;
    const { id, prevValue } = state.lastAction;
    state.visited[id] = prevValue;
    state.lastAction = null;
    saveVisited(state.visited);
    render();
    showStatus('Undone');
}

function resetAll() {
    if (!confirm('Reset all visited provinces?')) return;
    state.visited = {};
    state.lastAction = null;
    saveVisited(state.visited);
    render();
    showStatus('Reset');
}

function popPath(id) {
    const path = provinceElements.get(id)?.path;
    if (!path) return;
    path.classList.remove('pop');
    void path.getBBox();
    path.classList.add('pop');
    path.addEventListener('animationend', () => path.classList.remove('pop'), { once: true });
}

/* ───────── Tooltip + status toast ───────── */

function showTooltip(text) {
    elements.tooltip.textContent = text;
    elements.tooltip.classList.add('show');
    clearTimeout(tooltipTimer);
    tooltipTimer = setTimeout(() => elements.tooltip.classList.remove('show'), 1100);
}

function showStatus(text, kind = '', ms = 1400) {
    elements.status.textContent = text;
    elements.status.classList.remove('success', 'error');
    if (kind) elements.status.classList.add(kind);
    elements.status.classList.add('show');
    clearTimeout(statusTimer);
    statusTimer = setTimeout(() => elements.status.classList.remove('show'), ms);
}

/* ───────── Wiring ───────── */

function bindEvents() {
    elements.map.addEventListener('click', (e) => {
        const path = e.target.closest('[data-province]');
        if (!path) return;
        toggleProvince(path.dataset.province, 'map');
    });

    elements.map.addEventListener('mousemove', (e) => {
        const path = e.target.closest('[data-province]');
        if (!path) return;
        const name = path.dataset.name || path.dataset.province;
        showTooltip(name);
    });

    elements.map.addEventListener('mouseleave', () => {
        elements.tooltip.classList.remove('show');
    });

    elements.provinceList.addEventListener('click', (e) => {
        const item = e.target.closest('.pv-item');
        if (!item) return;
        toggleProvince(item.dataset.province, 'list');
    });

    elements.undoBtn.addEventListener('click', undoLast);
    elements.resetBtn.addEventListener('click', resetAll);
}

function registerSW() {
    if (!('serviceWorker' in navigator)) return;
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').catch(err => {
            console.warn('SW registration failed:', err);
        });
    });
}

/* ───────── Init ───────── */

buildList();
cacheProvinceElements();
bindEvents();
render();
registerSW();
