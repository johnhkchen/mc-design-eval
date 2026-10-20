// Part "Dusk lighting and grounds" (all plots, built last): the lit-window pattern, shop glow behind every L1 window,
// lanterns at every door, and azalea planters in the Inn courtyard. Windows and doors are read from the grid the
// earlier parts built (glass_pane on ring 1, dark_oak_door lower halves), so this part follows whatever they laid.
// Module-space coordinates throughout: plot-local x + plot offset, z and y unchanged.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { ringOf, groundAt, windowLit, shopGlow, doorLantern, azaleaPlanter } from "../vocab.mjs";

const site = JSON.parse(readFileSync(fileURLToPath(new URL("../site.json", import.meta.url)), "utf8"));

// offset, storey floors from plan.md FLOORS, and the L1 shop floor (its windows get shopGlow, always lit).
const PLOTS = [
  { key: "inn", offset: 0, floors: [4, 9, 14, 19, 24], shop: 9 },
  { key: "stewart", offset: 65, floors: [3, 9, 14, 19, 24, 29, 34, 39, 44, 49, 54, 59, 64], shop: 3 },
  { key: "palihotel", offset: 133, floors: [0, 3, 9, 14, 19, 24], shop: 3 },
  { key: "fix", offset: 196, floors: [1, 8, 15, 22, 29], shop: 1 },
  { key: "hahn", offset: 265, floors: [1, 4, 10, 15], shop: 4 },
  { key: "pikeSt", offset: 326, floors: [2, 10], shop: 2 },
];

const DIR4 = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };

function plotOf(p) {
  const S = site.plots[p.key];
  const ground = S.ground.map((r) => r.map((v) => (v === "." || v == null ? null : Number(v))));
  const plot = { footprint: S.footprint, ground };
  return { plot, rings: ringOf(plot), top: S.top, G: (x, z) => groundAt(plot, x, z) };
}

// The floor a y belongs to: the highest storey floor at or below y-1 (a window's glass starts one above its floor).
const floorFor = (floors, y) => floors.filter((f) => f <= y - 1).pop() ?? (y - 1);

// Windows of one plot: glass_pane on ring 1, grouped per tread line and storey, split into runs of at most 3 cells.
function windowsOf(g, p, P) {
  const lines = new Map();   // "face|line|floor" -> Set of along-coordinates (local)
  for (const [k, { ring, faceDir }] of P.rings) {
    if (ring !== 1 || !DIR4[faceDir]) continue;
    const [x, z] = k.split(",").map(Number);
    const vertical = faceDir === "north" || faceDir === "south";
    const line = vertical ? z : x, along = vertical ? x : z;
    for (let y = 1; y <= P.top; y++) {
      const c = g.get(p.offset + x, y, z);
      if (!c || c.block !== "minecraft:glass_pane") continue;
      const F = floorFor(p.floors, y);
      const key = `${faceDir}|${line}|${F}`;
      if (!lines.has(key)) lines.set(key, new Set());
      lines.get(key).add(along);
    }
  }
  const out = [];
  for (const [key, set] of lines) {
    const [faceDir, lineS, Fs] = key.split("|");
    const F = Number(Fs), line = Number(lineS);
    const vertical = faceDir === "north" || faceDir === "south";
    const sorted = [...set].sort((a, b) => a - b);
    const runs = [];
    for (const a of sorted) {
      const last = runs[runs.length - 1];
      if (last && last[last.length - 1] === a - 1) last.push(a); else runs.push([a]);
    }
    let n = 0;
    for (const run of runs) {
      for (let i = 0; i < run.length; i += 3) {
        const part = run.slice(i, i + 3);
        // module-space cells: plot-local x gets the plot offset, z is unchanged
        const cells = part.map((a) => (vertical ? [p.offset + a, line] : [p.offset + line, a]));
        out.push({ face: faceDir, cells, floor: F, h: 3, n: n++, s: p.floors.indexOf(F) });
      }
    }
  }
  return out;
}

function doorsOf(g, p, P) {
  const doors = [];
  for (const [k, { ring, faceDir }] of P.rings) {
    if (ring !== 1 || !DIR4[faceDir]) continue;
    const [x, z] = k.split(",").map(Number);
    for (let y = 0; y <= P.top; y++) {
      const c = g.get(p.offset + x, y, z);
      if (!c || c.block !== "minecraft:dark_oak_door" || c.state?.half !== "lower") continue;
      const vertical = faceDir === "north" || faceDir === "south";
      // the lower-coordinate cell of the 2-wide door is the one with no door neighbour on its low side
      const [dx, dz] = vertical ? [-1, 0] : [0, -1];
      const low = g.get(p.offset + x + dx, y, z + dz);
      if (low && low.block === "minecraft:dark_oak_door") continue;
      doors.push({ x: p.offset + x, z, y, face: faceDir });
    }
  }
  return doors;
}

export function build(g) {
  for (const p of PLOTS) {
    const P = plotOf(p);
    const wins = windowsOf(g, p, P);
    let seq = 0;
    for (const w of wins) {
      w.seq = seq++;
      if (w.floor === p.shop) {
        const [mx, mz] = w.cells[Math.floor((w.cells.length - 1) / 2)];
        shopGlow(g, { x: mx, z: mz, floor: w.floor, face: w.face });
      } else {
        windowLit(g, w);
      }
    }
    for (const d of doorsOf(g, p, P)) doorLantern(g, d, { mode: "post" });
    if (p.key === "inn") {
      // Courtyard planters on the paved floor (y9): the rim and soil sit at y10, on the floor.
      for (const [x, z] of [[26, 20], [35, 20], [26, 31], [35, 31]]) azaleaPlanter(g, [x, 10, z]);
      // Two lamp posts on the paved floor: dark oak fence to y11, a standing lantern on top at y12.
      for (const [x, z] of [[29, 23], [32, 28]]) {
        const air = (y) => !g.get(x, y, z) || /(^|_)air$/.test(g.get(x, y, z).block);
        if (air(10) && air(11) && air(12)) {
          g.set(x, 10, z, "dark_oak_fence");
          g.set(x, 11, z, "dark_oak_fence");
          g.set(x, 12, z, "lantern", { hanging: "false", waterlogged: "false" });
        }
      }
    }
  }
}
