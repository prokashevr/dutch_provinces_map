const STORAGE_KEY = 'dutchProvincesMap_v1';

export function loadVisited() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return {};
        const saved = JSON.parse(raw);
        if (saved && saved.visited && typeof saved.visited === 'object') {
            return saved.visited;
        }
        return {};
    } catch (e) {
        return {};
    }
}

export function saveVisited(visited) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ visited }));
    } catch (e) { /* quota or private mode — ignore */ }
}
