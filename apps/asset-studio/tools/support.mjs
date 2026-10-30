#!/usr/bin/env node
// Support census: blocks that hang in the air. Every block must reach the ground (the lowest layer) through other
// blocks that touch it by a face or an edge (an edge is how a stair roof or a leaning log steps); a block touching the
// rest only by a corner, or by nothing, floats in game. Fluids don't carry anything; a lily pad rides its water.
//   node tools/support.mjs <file.nbt>... [--json]
import { readFileSync } from "node:fs";
import { basename } from "node:path";
import { readNbt } from "./relief.mjs";

const N18 = [];
for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (let dz = -1; dz <= 1; dz++) { const s = Math.abs(dx) + Math.abs(dy) + Math.abs(dz); if (s === 1 || s === 2) N18.push([dx, dy, dz]); }
const SKIP = /^(air|cave_air|structure_void|light|water|lava|bubble_column)$/;

export function support(file) {
  const r = readNbt(readFileSync(file)), pal = (r.palette || r.palettes[0]).map((p) => p.Name.replace(/^minecraft:/, ""));
  const all = new Map(r.blocks.map((b) => [b.pos.join(","), pal[b.state]]));
  const at = new Map([...all].filter(([k, n]) => !SKIP.test(n) && !(n === "lily_pad" && /water/.test(all.get(k.replace(/^(-?\d+),(-?\d+)/, (_, x, y) => `${x},${y - 1}`)) || ""))));
  if (!at.size) return { ok: true, loose: [] };
  const minY = Math.min(...[...at.keys()].map((k) => +k.split(",")[1])), seen = new Set(), q = [];
  for (const k of at.keys()) if (+k.split(",")[1] === minY) { seen.add(k); q.push(k); }
  while (q.length) {
    const [x, y, z] = q.pop().split(",").map(Number);
    for (const [dx, dy, dz] of N18) { const n = `${x + dx},${y + dy},${z + dz}`; if (at.has(n) && !seen.has(n)) { seen.add(n); q.push(n); } }
  }
  const loose = [...at].filter(([k]) => !seen.has(k)).map(([k, n]) => ({ at: k.split(",").map(Number), block: n }));
  return { ok: !loose.length, loose };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const files = process.argv.slice(2).filter((a) => !a.startsWith("--")), rows = files.map((f) => ({ file: basename(f), ...support(f) }));
  if (process.argv.includes("--json")) console.log(JSON.stringify(rows, null, 2));
  else for (const r of rows) console.log(`${r.ok ? "ok  " : "FAIL"}  ${r.file}  ${r.loose.length} loose${r.loose.length ? ": " + r.loose.slice(0, 6).map((l) => `${l.block}@${l.at.join(",")}`).join(" ") : ""}`);
  process.exit(rows.every((r) => r.ok) ? 0 : 1);
}
