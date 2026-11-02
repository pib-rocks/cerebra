#!/usr/bin/env node
/**
 * Every asset path written in the app has to resolve to a file in src/assets.
 *
 * The movement tabs were blank for a while because `joint-configuration.ts` still asked for
 * /joint-control/background/*.png after the folder became assets/movement/background. Nothing
 * failed: the <img> simply loaded with naturalWidth 0, the touch points had no picture to sit on
 * and the sliders never appeared.
 *
 * Run: node scripts/check-asset-references.mjs
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const SRC = join(ROOT, "src");
const ASSETS = join(SRC, "assets");

/** Paths assembled at runtime (template strings) cannot be checked and are skipped. */
const SKIP = /["'`][^"'`]*\$\{/;

function walk(dir, out = []) {
    for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        if (statSync(full).isDirectory()) walk(full, out);
        else if (/\.(ts|html|scss)$/.test(entry) && !/\.spec\.ts$/.test(entry)) out.push(full);
    }
    return out;
}

/**
 * Two shapes count: a path through assets ("assets/foo/bar.png", "../../assets/foo.png") and an
 * app-absolute asset path ("/movement/background/head_background.png") - the tab backgrounds are
 * stored that way and prefixed with "../../../assets" in the template, which is exactly how the
 * stale /joint-control path slipped through.
 */
const REFERENCE =
    /["'`]((?:\.\.\/)*\/?assets\/[A-Za-z0-9_\-./]+\.(?:png|svg|jpg|jpeg|gif|webp))["'`]|["'`](\/[A-Za-z0-9_\-./]+\.(?:png|svg|jpg|jpeg|gif|webp))["'`]/g;

const files = walk(SRC);
const problems = [];
let checked = 0;

for (const file of files) {
    const text = readFileSync(file, "utf8");
    for (const line of text.split("\n")) {
        if (SKIP.test(line)) continue;
        for (const match of line.matchAll(REFERENCE)) {
            const path = match[1] ?? match[2];
            // "../assets/x", "assets/x" and "/movement/background/x" all land in src/assets.
            const clean = path.replace(/^(?:\.\.\/)+/, "").replace(/^\//, "");
            const onDisk = join(ASSETS, clean.replace(/^assets\//, ""));
            checked += 1;
            if (!statSync(onDisk, { throwIfNoEntry: false })) {
                problems.push(`${relative(ROOT, file)}: ${path} -> ${relative(ROOT, onDisk)} fehlt`);
            }
        }
    }
}

if (problems.length) {
    console.error(`Asset references ohne Datei (${problems.length}):`);
    for (const problem of problems) console.error(`  ${problem}`);
    process.exit(1);
}

console.log(`Asset references ok (${checked} geprüft, ${files.length} Dateien).`);
