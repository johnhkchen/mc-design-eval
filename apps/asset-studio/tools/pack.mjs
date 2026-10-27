#!/usr/bin/env node
// Pack a delivery: every file under a bundle folder (laid out in the client's repo paths) into <batch>.zip with a
// manifest.json (protocol v0.2): path, kind, sha256, and the structure id where there is one.
//
//   node tools/pack.mjs <bundle dir> <batch name> [--thread 0001] [--out dir] [--only path-prefix,...]
import { readdirSync, statSync, readFileSync, writeFileSync, mkdirSync, rmSync, cpSync } from "node:fs";
import { join, relative, dirname, resolve } from "node:path";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";

const argv = process.argv.slice(2), opt = (k, d) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : d);
const [bundle, batch] = argv.filter((a, i) => !a.startsWith("--") && !argv[i - 1]?.startsWith("--"));
if (!bundle || !batch) { console.error("pack.mjs <bundle dir> <batch name> [--thread id] [--out dir] [--only prefixes]"); process.exit(1); }
const only = opt("--only", "").split(",").filter(Boolean), out = resolve(opt("--out", "."));

const walk = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
const kindOf = (p) => {
  if (p.endsWith("manifest.json")) return null;
  if (/\/structure\/.*\/part\/.*\.nbt$/.test(p)) return "part";
  if (/\/structure\/.*\.nbt$/.test(p)) return "structure";
  if (/\/structure\/.*\.json$/.test(p)) return "meta";
  if (/\/town_kits\//.test(p)) return "kit_rules";
  if (/\/town_rules\//.test(p)) return "town_rules";
  if (/\/town_layouts\/|layout\.geojson$/.test(p)) return "layout";
  if (/palettes\.json$/.test(p)) return "palette";
  if (/style\.md$/.test(p)) return "style";
  if (/assets-src\/concept\//.test(p)) return p.endsWith(".md") ? "notes" : "concept";
  if (/notes\.md$/.test(p)) return "notes";
  if (/\.(jpe?g|png)$/.test(p)) return "preview";
  if (/^tools\/|^scripts\//.test(p)) return "tool";
  return "file";
};
const files = walk(bundle).map((f) => relative(bundle, f)).filter((p) => !only.length || only.some((o) => p.startsWith(o)))
  .filter((p) => kindOf(p)).sort();
const manifest = { batch, thread: opt("--thread"), made: new Date().toISOString(), files: files.map((p) => {
  const buf = readFileSync(join(bundle, p)), e = { path: p, kind: kindOf(p), sha256: createHash("sha256").update(buf).digest("hex"), bytes: buf.length };
  const m = p.match(/data\/enterprise\/structure\/(.+)\.nbt$/);
  if (m) e.id = `enterprise:${m[1]}`;
  return e;
}) };

// zip from a staging copy so the zip holds exactly the listed files plus the manifest
const stage = join(tmpdir(), `pack-${batch}-${process.pid}`);
rmSync(stage, { recursive: true, force: true });
for (const p of files) { mkdirSync(dirname(join(stage, p)), { recursive: true }); cpSync(join(bundle, p), join(stage, p)); }
writeFileSync(join(stage, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
mkdirSync(out, { recursive: true });
const zip = join(out, `${batch}.zip`);
rmSync(zip, { force: true });
execFileSync("zip", ["-qr", zip, "."], { cwd: stage });
writeFileSync(join(out, `${batch}-manifest.json`), JSON.stringify(manifest, null, 2) + "\n");
rmSync(stage, { recursive: true, force: true });
console.log(`${zip}: ${files.length} files`);
