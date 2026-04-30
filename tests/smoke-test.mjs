#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const docs = join(root, 'docs');

const PROVINCE_IDS = [
    'friesland',
    'groningen',
    'drenthe',
    'overijssel',
    'flevoland',
    'noord-holland',
    'zuid-holland',
    'utrecht',
    'gelderland',
    'zeeland',
    'noord-brabant',
    'limburg',
];

const failures = [];

function check(label, ok, detail) {
    if (ok) {
        console.log(`  ok   ${label}`);
    } else {
        console.log(`  FAIL ${label}${detail ? ` — ${detail}` : ''}`);
        failures.push(label);
    }
}

function read(path) {
    return readFileSync(path, 'utf8');
}

console.log('Files exist');
const files = {
    'docs/index.html':    join(docs, 'index.html'),
    'docs/app.js':        join(docs, 'app.js'),
    'docs/sw.js':         join(docs, 'sw.js'),
    'docs/manifest.json': join(docs, 'manifest.json'),
    'docs/provinces.js':  join(docs, 'provinces.js'),
    'docs/storage.js':    join(docs, 'storage.js'),
};
for (const [label, path] of Object.entries(files)) {
    check(label, existsSync(path));
}

const indexHtml = existsSync(files['docs/index.html']) ? read(files['docs/index.html']) : '';
const provincesJs = existsSync(files['docs/provinces.js']) ? read(files['docs/provinces.js']) : '';
const swJs = existsSync(files['docs/sw.js']) ? read(files['docs/sw.js']) : '';

console.log('\nindex.html DOM IDs');
for (const id of ['map', 'count', 'progressBar', 'provinceList', 'undoBtn', 'resetBtn', 'tooltip', 'status']) {
    check(`id="${id}"`, indexHtml.includes(`id="${id}"`));
}

console.log('\nindex.html asset references');
for (const ref of ['styles.css', 'app.js', 'manifest.json']) {
    check(`references ${ref}`, indexHtml.includes(ref));
}
check(
    'loads app.js as a module',
    /<script\s+type="module"\s+src="app\.js"/.test(indexHtml),
);

console.log('\nProvince ID contract (provinces.js + index.html)');
for (const id of PROVINCE_IDS) {
    check(`provinces.js has '${id}'`, provincesJs.includes(`'${id}'`));
    check(`index.html has data-province="${id}"`, indexHtml.includes(`data-province="${id}"`));
}

console.log('\nsw.js shell asset references');
for (const ref of ['./index.html', './styles.css', './app.js', './manifest.json', './provinces.js', './storage.js']) {
    check(`sw.js references ${ref}`, swJs.includes(ref));
}

console.log('');
if (failures.length === 0) {
    console.log(`All checks passed.`);
    process.exit(0);
} else {
    console.log(`${failures.length} check(s) failed.`);
    process.exit(1);
}
