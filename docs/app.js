const STORAGE_KEY = 'dutchProvincesMap_v1';

const PROVINCES = [
    { id: 'friesland',      name: 'Friesland' },
    { id: 'groningen',      name: 'Groningen' },
    { id: 'drenthe',        name: 'Drenthe' },
    { id: 'overijssel',     name: 'Overijssel' },
    { id: 'flevoland',      name: 'Flevoland' },
    { id: 'noord-holland',  name: 'Noord-Holland' },
    { id: 'zuid-holland',   name: 'Zuid-Holland' },
    { id: 'utrecht',        name: 'Utrecht' },
    { id: 'gelderland',     name: 'Gelderland' },
    { id: 'zeeland',        name: 'Zeeland' },
    { id: 'noord-brabant',  name: 'Noord-Brabant' },
    { id: 'limburg',        name: 'Limburg' },
];

const TOTAL = PROVINCES.length;

let state = {
    visited: {},          // { friesland: true, ... }
    lastAction: null      // { id, prevValue } for one-level undo
};

let statusTimer = null;
let tooltipTimer = null;

/* ───────── Persistence ───────── */

function loadState() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const saved = JSON.parse(raw);
            if (saved && saved.visited) {
                state.visited = saved.visited;
            }
        }
    } catch (e) { /* corrupt or unavailable storage — ignore */ }
}

function saveState() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ visited: state.visited }));
    } catch (e) { /* quota or private mode — ignore */ }
}

/* ───────── Render ───────── */

function visitedCount() {
    return Object.values(state.visited).filter(Boolean).length;
}

function render() {
    const count = visitedCount();
    document.getElementById('count').textContent = count;
    document.getElementById('progressBar').style.width = `${(count / TOTAL) * 100}%`;

    PROVINCES.forEach(p => {
        const path = document.querySelector(`.province[data-province="${p.id}"]`);
        const item = document.querySelector(`.pv-item[data-province="${p.id}"]`);
        const isVisited = !!state.visited[p.id];
        if (path) path.classList.toggle('visited', isVisited);
        if (item) item.classList.toggle('is-visited', isVisited);
    });

    document.getElementById('undoBtn').disabled = !state.lastAction;
}

function buildList() {
    const ul = document.getElementById('provinceList');
    ul.innerHTML = PROVINCES
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
    const province = PROVINCES.find(p => p.id === id);
    if (!province) return;

    state.lastAction = { id, prevValue: !!state.visited[id] };
    state.visited[id] = !state.visited[id];

    saveState();
    render();
    popPath(id);

    if (navigator.vibrate) navigator.vibrate(state.visited[id] ? 18 : 10);

    if (visitedCount() === TOTAL) {
        if (navigator.vibrate) navigator.vibrate([30, 20, 30, 20, 60]);
        showStatus('All 12 provinces visited 🇳🇱', 'success', 2400);
    } else if (source !== 'list') {
        showTooltip(`${province.name} ${state.visited[id] ? '✓' : ''}`.trim());
    }
}

function undoLast() {
    if (!state.lastAction) return;
    const { id, prevValue } = state.lastAction;
    state.visited[id] = prevValue;
    state.lastAction = null;
    saveState();
    render();
    showStatus('Undone');
}

function resetAll() {
    if (!confirm('Reset all visited provinces?')) return;
    state.visited = {};
    state.lastAction = null;
    saveState();
    render();
    showStatus('Reset');
}

function popPath(id) {
    const path = document.querySelector(`.province[data-province="${id}"]`);
    if (!path) return;
    path.classList.remove('pop');
    void path.getBBox();
    path.classList.add('pop');
    path.addEventListener('animationend', () => path.classList.remove('pop'), { once: true });
}

/* ───────── Tooltip + status toast ───────── */

function showTooltip(text) {
    const el = document.getElementById('tooltip');
    el.textContent = text;
    el.classList.add('show');
    clearTimeout(tooltipTimer);
    tooltipTimer = setTimeout(() => el.classList.remove('show'), 1100);
}

function showStatus(text, kind = '', ms = 1400) {
    const el = document.getElementById('status');
    el.textContent = text;
    el.classList.remove('success', 'error');
    if (kind) el.classList.add(kind);
    el.classList.add('show');
    clearTimeout(statusTimer);
    statusTimer = setTimeout(() => el.classList.remove('show'), ms);
}

/* ───────── Wiring ───────── */

function bindEvents() {
    const map = document.getElementById('map');
    map.addEventListener('click', (e) => {
        const path = e.target.closest('[data-province]');
        if (!path) return;
        toggleProvince(path.dataset.province, 'map');
    });

    map.addEventListener('mousemove', (e) => {
        const path = e.target.closest('[data-province]');
        if (!path) return;
        const name = path.dataset.name || path.dataset.province;
        showTooltip(name);
    });

    map.addEventListener('mouseleave', () => {
        document.getElementById('tooltip').classList.remove('show');
    });

    const list = document.getElementById('provinceList');
    list.addEventListener('click', (e) => {
        const item = e.target.closest('.pv-item');
        if (!item) return;
        toggleProvince(item.dataset.province, 'list');
    });

    document.getElementById('undoBtn').addEventListener('click', undoLast);
    document.getElementById('resetBtn').addEventListener('click', resetAll);
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

loadState();
buildList();
bindEvents();
render();
registerSW();
