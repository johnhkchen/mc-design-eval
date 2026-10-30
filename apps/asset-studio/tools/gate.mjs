#!/usr/bin/env node
// The quality gate: every stage both sides agreed on, on any build, one line a file, one exit code.
//   contract  check-asset.mjs (version, blocks, points of interest, light where mobs spawn, the stair walk)
//   relief    relief.mjs (facade depth and detail; skipped for parts and yard tiles)
//   interior  interior.mjs over the client's floorplan.py (for anything with beds)
//   support   support.mjs (no block hanging in the air: each reaches the ground by faces or edges; skipped for parts)
// Thresholds come from quality.json. An asset's `relief_faces` (in its JSON) names the faces relief applies to. Metadata is the .json beside each .nbt (a variant's comes from its base).
//   node tools/gate.mjs <file.nbt | dir>... [--json] [--no-relief] [--no-interior] [--faces south,north,...]
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, basename } from "node:path";
import { check } from "./check-asset.mjs";
import { relief } from "./relief.mjs";
import { interior } from "./interior.mjs";
import { support } from "./support.mjs";

const Q = existsSync(new URL("../quality.json", import.meta.url)) ? JSON.parse(readFileSync(new URL("../quality.json", import.meta.url), "utf8")) : {};
const argv = process.argv.slice(2), opt = (k, d) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : d);
const walk = (p) => (statSync(p).isDirectory() ? readdirSync(p).flatMap((f) => walk(join(p, f))) : p.endsWith(".nbt") ? [p] : []);
const files = argv.filter((a, i) => !a.startsWith("--") && !argv[i - 1]?.startsWith("--")).flatMap(walk);
const readJson = (p) => (existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : null);
const metaOf = (f) => {
  const m = readJson(f.replace(/\.nbt$/, ".json"));
  if (!m || !m.base || m.footprint) return m;
  const b = readJson(f.replace(/[^/]*$/, m.base.split("/").pop() + ".json"));
  return b ? { ...b, id: m.id, palette: m.palette } : m;
};
const R = Q.relief || {}, faces = opt("--faces", R.faces || "south,north,east,west").split(",");
const rows = [];
for (const f of files) {
  const meta = metaOf(f), isPart = meta?.kind === "part" || meta?.slot === "part", row = { file: basename(f), ok: true, stages: {} };
  const c = check(f, meta); row.stages.contract = { ok: c.ok, errors: c.errors };
  // an asset may name the faces relief applies to (`relief_faces`): a wall piece's two long faces, [] for open ground
  const fFaces = Array.isArray(meta?.relief_faces) ? meta.relief_faces : faces;
  if (!isPart && !argv.includes("--no-relief") && fFaces.length) {
    const r = relief(f), party = new Set(meta?.party_faces || []);
    const bad = fFaces.filter((k) => !party.has(k) && (r[k].relief < (R.min_relief ?? 0.3) || r[k].detail < (R.min_detail ?? 0.2)));
    row.stages.relief = { ok: !bad.length, errors: bad.map((k) => `${k} relief ${r[k].relief} detail ${r[k].detail}`), faces: r };
  }
  if (!isPart && (meta?.beds || []).length && !argv.includes("--no-interior")) {
    try { const i = interior(f); row.stages.interior = { ok: i.ok, errors: i.fails }; }
    catch (e) { row.stages.interior = { ok: false, errors: [`floorplan.py failed: ${e.message.split("\n")[0]}`] }; }
  }
  if (!isPart) { const s = support(f); row.stages.support = { ok: s.ok, errors: s.loose.length ? [`${s.loose.length} loose: ${s.loose.slice(0, 6).map((l) => `${l.block}@${l.at.join(",")}`).join(" ")}`] : [] }; }
  row.ok = Object.values(row.stages).every((s) => s.ok);
  rows.push(row);
}
if (argv.includes("--json")) console.log(JSON.stringify(rows, null, 2));
else for (const r of rows) {
  console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.file}  ${Object.entries(r.stages).map(([k, s]) => `${k} ${s.ok ? "ok" : "FAIL"}`).join(", ")}`);
  for (const [k, s] of Object.entries(r.stages)) for (const e of s.errors) console.log(`  ${k}: ${e}`);
}
process.exit(rows.every((r) => r.ok) ? 0 : 1);
