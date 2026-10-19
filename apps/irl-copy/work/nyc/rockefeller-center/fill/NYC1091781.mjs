// 32 West 48th Street (2022): a glass-and-stone commercial and office block of the newest Midtown kind. A polished
// granite base with shopfronts and a dark marquee over the entrance, then floors of cyan curtain-wall glass between
// iron mullions, with a pale spandrel at each floor line and a parapet cap. The roof heights are median-smoothed over
// the footprint's 5x5 (a one-cell lidar sliver on the west edge is noise, not a tower) and snapped to 3-block storeys,
// so the massing steps in cleanly; the wings at the east and the low pavilion read as lower tiers. The shell is a
// one-block wall ring with a solid floor slab per storey, a solid cap, and an air gap behind the glass; warm lanterns
// stand inside some windows, and a mechanical penthouse sits on the tallest tier.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const FILL = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${FILL}/NYC1091781.cells.json`, "utf8"));   // [x, z, ground, roof]
const SIZE = [17, 126, 53];
const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];

const k2 = (x, z) => `${x},${z}`;
const raw = new Map(cells.map(([x, z, g, r]) => [k2(x, z), { g, r }]));
const inFp = (x, z) => raw.has(k2(x, z));

// Smoothed roof per footprint cell: the median over the footprint's 5x5, snapped to 3-block storeys, at least one storey.
const S = new Map();
for (const [key, { g, r }] of raw) {
  const [x, z] = key.split(",").map(Number);
  const vals = [];
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) if (inFp(x + dx, z + dz)) vals.push(raw.get(k2(x + dx, z + dz)).r);
  vals.sort((a, b) => a - b);
  const med = vals[Math.floor(vals.length / 2)];
  S.set(key, { g, H: Math.max(g + 3, Math.round(med / 3) * 3) });
}
// Second pass: a 3x3 median of the storey counts, so a single cell can't notch a tier's edge.
const tiers = new Map();
for (const [key, { g, H }] of S) {
  const [x, z] = key.split(",").map(Number);
  const vals = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (S.has(k2(x + dx, z + dz))) vals.push(S.get(k2(x + dx, z + dz)).H);
  vals.sort((a, b) => a - b);
  tiers.set(key, { g, H: Math.max(g + 3, vals[Math.floor(vals.length / 2)]) });
}
for (const [key, v] of tiers) S.set(key, v);
const cell = (x, z) => S.get(k2(x, z));
const occ = (x, z, y) => { const c = cell(x, z); return !!c && y >= c.g && y < c.H; };
const outward = (x, z, y) => DIRS.filter(([dx, dz]) => !occ(x + dx, z + dz, y));   // faces that look outside at this height

const g = new Voxels(SIZE);
const put = (x, y, z, block, state) => { if (y >= 0 && y < SIZE[1]) g.set(x, y, z, block, state); };

// Foundation, then the shell cell by cell: base course, floor lines, glass between iron mullions, parapet cap.
for (const [key, { g: gr, H }] of S) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < gr; y++) put(x, y, z, "polished_granite");
  const cap = H - 1 - gr;                                  // the parapet / roof row, relative to the ground
  for (let y = gr; y < H; y++) {
    const rel = y - gr;
    if (rel === cap) { put(x, y, z, "polished_andesite"); continue; }
    const outs = outward(x, z, y);
    if (!outs.length) { if (rel % 3 === 0) put(x, y, z, "stone"); continue; }   // interior: a floor slab per storey
    if (rel % 3 === 0) { put(x, y, z, rel === 0 ? "polished_granite" : "light_gray_concrete"); continue; }   // base / spandrel
    const [dx] = outs[0];
    const u = dx ? z : x;
    if (u % 3 === 0) { put(x, y, z, "iron_block"); continue; }                      // mullion
    put(x, y, z, rel < 3 ? "light_blue_stained_glass" : "cyan_stained_glass");     // storey 0 shopfront, then curtain wall
  }
}

// Entrance on the footprint's southmost row: a glass door under a dark marquee, a lantern hanging in the lobby.
const zMax = Math.max(...cells.map(([, z]) => z));
const rowX = cells.filter(([, z]) => z === zMax).map(([x]) => x).sort((a, b) => a - b);
const EX = rowX[Math.floor(rowX.length / 2)];
const gE = cell(EX, zMax).g;
put(EX, gE, zMax, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
put(EX, gE + 1, zMax, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
for (const x of [EX - 1, EX, EX + 1]) put(x, gE + 3, zMax, "black_concrete");
put(EX, gE + 2, zMax - 1, "lantern", { hanging: "true" });

// Warm lanterns standing just inside some windows, on each storey's floor slab.
for (const [key, { g: gr, H }] of S) {
  const [x, z] = key.split(",").map(Number);
  const cap = H - 1 - gr;
  for (let k = 0; 3 * k + 1 < cap; k++) {
    const rel = 3 * k + 1, y = gr + rel;
    const outs = outward(x, z, y);
    if (!outs.length || (x + z + k) % 4 !== 0) continue;
    const [dx, dz] = outs[0];
    const u = dx ? z : x;
    if (u % 3 === 0) continue;                                       // not a window
    const ix = x - dx, iz = z - dz;
    if (!occ(ix, iz, y) || outward(ix, iz, y).length) continue;      // the cell inside, clear of the walls
    put(ix, y, iz, "lantern", { hanging: "false" });
  }
}

// Mechanical penthouse on the tallest tier, set back three cells from every edge of it.
const Hmax = Math.max(...[...S.values()].map((v) => v.H));
const tops = [...S].filter(([, v]) => v.H === Hmax).map(([k]) => k.split(",").map(Number));
const topSet = new Set(tops.map(([x, z]) => k2(x, z)));
let penthouse = 0;
for (const [x, z] of tops) {
  let inset = true;
  for (let dz = -3; dz <= 3 && inset; dz++) for (let dx = -3; dx <= 3; dx++) if (!topSet.has(k2(x + dx, z + dz))) { inset = false; break; }
  if (!inset) continue;
  penthouse++;
  for (let y = Hmax; y < Hmax + 2; y++) put(x, y, z, "light_gray_concrete");
}

const stats = g.save(`${FILL}/NYC1091781.nbt`);
console.log({ footprint: cells.length, Hmax, penthouseCells: penthouse, entrance: [EX, zMax], ...stats });
