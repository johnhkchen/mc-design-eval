#!/usr/bin/env node
// Interior check: runs the shared floor-plan tool (py/floorplan.py, the client's) on a structure and holds its numbers
// to the thresholds in interiors.md v0.1. Prints one line a file; exit 1 if any threshold fails.
//   node tools/interior.mjs <file.nbt>... [--plans dir]
import { execFileSync } from "node:child_process";
import { basename } from "node:path";
const FP = new URL("./py/floorplan.py", import.meta.url).pathname;
import { readFileSync, existsSync } from "node:fs";
const Q = existsSync(new URL("../quality.json", import.meta.url)) ? JSON.parse(readFileSync(new URL("../quality.json", import.meta.url), "utf8")).interior : {};
const T = { circulation: Q.circulation || [0.15, 0.45], idle: Q.idle_max ?? 0.45, walk: Q.walk_max ?? 2.0, perBed: Q.floor_per_bed || [4, 8.5],
  leastWidth: Q.least_width?.room ?? 3, passageWidth: Q.least_width?.passage ?? 2, clear: Q.clear_height_min ?? 3 };
export function interior(file, plans) {
  const out = execFileSync("python3", ["-I", FP, file, "--json", ...(plans ? ["--out", plans] : [])], { encoding: "utf8" });
  const d = JSON.parse(out)[0], fails = [], notes = [];
  if (d.unreached?.length) fails.push(`${d.unreached.length} unreached`);
  if (d.made_beds < d.beds) fails.push(`made beds ${d.made_beds}/${d.beds}`);
  if (d.through_rooms) fails.push(`through rooms ${d.through_rooms}`);
  // null: no storey with two rooms or more, so nothing to judge (floorplan.py rev 9, thread 0008)
  if (d.circulation_share != null && (d.circulation_share < T.circulation[0] || d.circulation_share > T.circulation[1])) fails.push(`circulation ${d.circulation_share}`);
  if (d.idle_share >= T.idle) fails.push(`idle ${d.idle_share}`);
  if (d.walk >= T.walk) fails.push(`walk ${d.walk}`);
  if (d.beds && (d.floor_per_bed < T.perBed[0] || d.floor_per_bed > T.perBed[1])) fails.push(`floor a bed ${d.floor_per_bed}`);
  for (const s of d.per_storey) for (const r of s.rooms) {
    if (r.use === "stair") continue;
    const min = r.use === "passage" || r.use === "landing" ? T.passageWidth : T.leastWidth;
    // least width is a note, not a band (agreed in thread 0008): a reviewer sees it, the gate doesn't fail on it
    if (r.least_width < min) notes.push(`storey ${s.feet_y} ${r.use} least width ${r.least_width}`);
    if (r.clear_height < T.clear) fails.push(`storey ${s.feet_y} ${r.use} clear height ${r.clear_height}`);
  }
  return { file: basename(file), ok: !fails.length, fails, notes, d };
}
if (import.meta.url === `file://${process.argv[1]}`) {
  const argv = process.argv.slice(2), plans = argv.includes("--plans") ? argv[argv.indexOf("--plans") + 1] : null;
  const files = argv.filter((a, i) => a.endsWith(".nbt") && argv[i - 1] !== "--plans");
  let ok = true;
  for (const f of files) {
    const r = interior(f, plans); ok &&= r.ok;
    const d = r.d;
    console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.file}  beds ${d.made_beds}/${d.beds} made, through ${d.through_rooms}, circ ${d.circulation_share}, idle ${d.idle_share}, walk ${d.walk}, floor/bed ${d.floor_per_bed}${r.fails.length ? "  <- " + r.fails.join("; ") : ""}`);
  }
  process.exit(ok ? 0 : 1);
}
