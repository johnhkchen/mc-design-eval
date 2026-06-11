#!/usr/bin/env node
// Thin CLI over the style-pack contract (T-124-01): schema gate + semantic validation, findings
// printed, non-zero exit on errors. Usage: node scripts/validate-pack.mjs packs/rustic.json
import { readFileSync } from "node:fs";

import { parseStylePack, validateStylePack } from "../src/pack/style-pack.mjs";

const path = process.argv[2];
if (!path) {
  console.error("usage: node scripts/validate-pack.mjs <pack.json>");
  process.exit(2);
}

const parsed = parseStylePack(readFileSync(path, "utf8"));
if (!parsed.ok) {
  console.error(`SCHEMA FAIL (${parsed.code}):`);
  for (const e of parsed.errors) console.error(e);
  process.exit(1);
}

const { ok, findings } = validateStylePack(parsed.pack);
for (const f of findings) console.log(`${f.level.toUpperCase()} at ${f.where}: ${f.msg}`);
console.log(`${parsed.pack.style}: schema OK, semantic ${ok ? "OK" : "FAIL"} (${findings.length} finding(s))`);
process.exit(ok ? 0 : 1);
