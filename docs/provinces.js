export const PROVINCES = [
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

export const TOTAL_PROVINCES = PROVINCES.length;

export function isKnownProvince(id) {
    return PROVINCES.some(p => p.id === id);
}

export function getProvinceName(id) {
    return PROVINCES.find(p => p.id === id)?.name || id;
}
