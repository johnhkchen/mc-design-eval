#!/usr/bin/env node
// Deterministic lints for a beautify pass. No judge, no model.
//
//   node check.mjs <before.nbt> [after.nbt] [--protect extra.json]
//
// With one file: census + flat fields + circulation (use on the input to plan).
// With two: also FUNCTION checks — the after-build must keep every functional cell of the before-build:
//   protected   redstone-family components + the block each one rests on, identical block+state
//   keepClear   the cell above each dust/repeater/comparator stays air (a solid block there can cut or
//               re-route the line)
//   extra       optional --protect JSON: {"protect": [[x,y,z],...], "keepClear": [[x,y,z],...]}
// It also flags NEW functional blocks next to the old circuit (decor buttons/plates/lamps can interfere).
// Exit code 1 if a protected/keepClear cell was violated or circulation was lost.
import { readFileSync } from "node:fs";
import { loadStructure } from "./nbt.mjs";

const FUNCTIONAL = /redstone|repeater|comparator|lever|_button|observer|piston|hopper|dropper|dispenser|redstone_lamp|target|daylight_detector|rail|note_block|tripwire|pressure_plate|sculk_sensor|trapped_chest|lectern|crafter/;
const LINE = /redstone_wire|repeater|comparator/;
// Things a player walks through.
const PASSABLE = /air$|carpet|redstone_wire|rail|pressure_plate|torch|_button|lever|flower|grass$|fern|sapling|snow$|vine|ladder|sign|banner|tripwire|moss_carpet|candle$/;

const k = (p) => p.join(",");

function isFunctional(b) {
  return FUNCTIONAL.test(b) && !/redstone_block$|redstone_ore/.test(b) ? true : /redstone_block$/.test(b);
}

export function functionalSpec(grid) {
  const protect = new Map(), keepClear = new Set();
  for (const c of grid.voxels()) {
    if (!isFunctional(c.block)) continue;
    protect.set(k(c.pos), c);
    const [x, y, z] = c.pos;
    const below = grid.get(x, y - 1, z);
    if (below && !grid.isAir(x, y - 1, z)) protect.set(k(below.pos), below);
    if (LINE.test(c.block) && grid.inBounds(x, y + 1, z)) keepClear.add(k([x, y + 1, z]));
  }
  for (const p of keepClear) if (protect.has(p)) keepClear.delete(p);
  return { protect, keepClear };
}

const sameState = (a, b) => JSON.stringify(Object.entries(a || {}).sort()) === JSON.stringify(Object.entries(b || {}).sort());

/** Largest coplanar same-block exposed surfaces (the "big blank wall" detector). */
export function flatFields(grid, top = 5) {
  // Out-of-bounds counts as open (exterior faces matter), except below the base (it sits on the ground).
  const open = (x, y, z) => (y < 0 ? false : !grid.inBounds(x, y, z) || PASSABLE.test(grid.blockAt(x, y, z)));
  const dirs = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
  const names = ["+x", "-x", "+y(floor/top)", "-y(ceiling/underside)", "+z", "-z"];
  const seen = new Set();
  const fields = [];
  for (const c of grid.voxels()) {
    if (PASSABLE.test(c.block)) continue;
    dirs.forEach((d, di) => {
      const id = di + "|" + k(c.pos);
      if (seen.has(id)) return;
      const [x, y, z] = c.pos;
      if (!open(x + d[0], y + d[1], z + d[2])) return;
      // flood within the plane perpendicular to d
      const axes = [0, 1, 2].filter((a) => d[a] === 0);
      const stack = [c.pos], cells = [];
      seen.add(id);
      while (stack.length) {
        const p = stack.pop();
        cells.push(p);
        for (const a of axes) for (const s of [-1, 1]) {
          const q = [...p]; q[a] += s;
          const qid = di + "|" + k(q);
          if (seen.has(qid) || !grid.inBounds(...q)) continue;
          const qc = grid.get(...q);
          if (!qc || qc.block !== c.block || !sameState(qc.state, c.state)) continue;
          if (!open(q[0] + d[0], q[1] + d[1], q[2] + d[2])) continue;
          seen.add(qid);
          stack.push(q);
        }
      }
      if (cells.length >= 6) {
        const lo = [0, 1, 2].map((i) => Math.min(...cells.map((p) => p[i])));
        const hi = [0, 1, 2].map((i) => Math.max(...cells.map((p) => p[i])));
        fields.push({ area: cells.length, face: names[di], block: c.block, from: lo, to: hi });
      }
    });
  }
  return fields.sort((a, b) => b.area - a.area).slice(0, top);
}

/** Can a player walk from one end of the long horizontal axis to the other? Also the narrowest clear width. */
export function circulation(grid) {
  const [sx, sy, sz] = grid.size;
  const longZ = sz >= sx;
  const open = (x, y, z) => grid.inBounds(x, y, z) && PASSABLE.test(grid.blockAt(x, y, z));
  const stand = (x, y, z) => open(x, y, z) && open(x, y + 1, z) && grid.inBounds(x, y - 1, z) && !open(x, y - 1, z);
  const L = longZ ? sz : sx, W = longZ ? sx : sz;
  const at = (l, w) => (longZ ? [w, l] : [l, w]);
  const start = [];
  for (let w = 0; w < W; w++) for (let y = 1; y < sy - 1; y++) { const [x, z] = at(0, w); if (stand(x, y, z)) start.push([x, y, z]); }
  const seen = new Set(start.map(k));
  const q = [...start];
  let reached = false;
  while (q.length) {
    const [x, y, z] = q.shift();
    if ((longZ ? z : x) === L - 1) reached = true;
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) for (const dy of [0, 1, -1]) {
      const n = [x + dx, y + dy, z + dz];
      if (seen.has(k(n)) || !stand(...n)) continue;
      if (dy === 1 && !open(x, y + 2, z)) continue; // headroom to step up
      seen.add(k(n));
      q.push(n);
    }
  }
  let minWidth = Infinity;
  for (let l = 0; l < L; l++) {
    let w = 0;
    for (let ww = 0; ww < W; ww++) { const [x, z] = at(l, ww); for (let y = 1; y < sy - 1; y++) if (stand(x, y, z)) { w++; break; } }
    minWidth = Math.min(minWidth, w);
  }
  return { endToEnd: reached, minClearWidth: minWidth === Infinity ? 0 : minWidth, axis: longZ ? "z" : "x" };
}

async function main() {
  const args = process.argv.slice(2);
  const files = args.filter((a, i) => !a.startsWith("--") && args[i - 1] !== "--protect");
  const pi = args.indexOf("--protect");
  const before = await loadStructure(files[0]);
  const report = { size: before.size, blocks: before.voxels().length, census: before.census().slice(0, 12), flatFields: flatFields(before), circulation: circulation(before) };
  if (files[1]) {
    const after = await loadStructure(files[1]);
    const { protect, keepClear } = functionalSpec(before);
    if (pi >= 0) {
      const extra = JSON.parse(readFileSync(args[pi + 1], "utf8"));
      for (const p of extra.protect || []) { const c = before.get(...p); if (c) protect.set(k(p), c); }
      for (const p of extra.keepClear || []) keepClear.add(k(p));
    }
    const violations = [];
    for (const [pk, c] of protect) {
      const a = after.get(...c.pos);
      if (!a || a.block !== c.block || !sameState(a.state, c.state)) violations.push({ pos: c.pos, kind: "protected", was: c.block, now: a?.block ?? "(unset)" });
    }
    for (const pk of keepClear) {
      const p = pk.split(",").map(Number);
      if (!after.isAir(...p)) violations.push({ pos: p, kind: "keepClear", now: after.blockAt(...p) });
    }
    const near = (p) => [...protect.values()].some((c) => Math.abs(c.pos[0] - p[0]) + Math.abs(c.pos[1] - p[1]) + Math.abs(c.pos[2] - p[2]) <= 1);
    const newFunctional = after.voxels().filter((c) => isFunctional(c.block) && !protect.has(k(c.pos)) && near(c.pos)).map((c) => ({ pos: c.pos, block: c.block }));
    const circ = circulation(after);
    const changed = [...after].filter((c) => { const b = before.get(...c.pos); return !b || b.block !== c.block || !sameState(b.state, c.state); }).length;
    Object.assign(report, {
      after: { size: after.size, blocks: after.voxels().length, distinctBlocks: after.census().length, census: after.census().slice(0, 16), flatFields: flatFields(after), circulation: circ },
      function: { protectedCells: protect.size, keepClearCells: keepClear.size, violations, newFunctionalNearCircuit: newFunctional },
      changedCells: changed,
      ok: violations.length === 0 && (!report.circulation.endToEnd || circ.endToEnd),
    });
  }
  console.log(JSON.stringify(report, null, 1));
  if (report.ok === false) process.exit(1);
}

if (import.meta.url === `file://${process.argv[1]}`) main().catch((e) => { console.error(e.stack || e.message); process.exit(1); });
