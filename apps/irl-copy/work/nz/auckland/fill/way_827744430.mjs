// Way 827744430: a two-storey Edwardian brick shop block (red brick on a stone base, cream storey line and cornice,
// glazed shopfronts and a timber door on the street face) with a one-storey wing to the west, where the ground falls
// away. Lidar roof heights are smoothed into two flat tiers: 8 blocks up (two storeys) and 6 (the wing).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const raw = JSON.parse(readFileSync(`${DIR}/way_827744430.cells.json`, "utf8"));

// top = the last solid row of the wall: 7 for the two-storey block (roof surface at 8), 5 for the wing (surface at 6)
const cells = new Map();
for (const [x, z, g, r] of raw) cells.set(`${x},${z}`, { x, z, g, top: r >= 7 ? 7 : 5 });
const at = (x, z) => cells.get(`${x},${z}`);
const DIRS = { E: [1, 0], W: [-1, 0], N: [0, -1], S: [0, 1] };
const OPP = { E: "W", W: "E", N: "S", S: "N" };
const key = (x, y, z) => `${x},${y},${z}`;

// The side a cell shows at row y: "ext" for open air beyond the footprint (wins over anything), "step" for the flank of
// a lower neighbour above its roof. Null where the row is inside the building.
function face(c, y) {
  let step = null;
  for (const d of ["E", "W", "N", "S"]) {
    const [dx, dz] = DIRS[d];
    const n = at(c.x + dx, c.z + dz);
    if (!n) return { d, kind: "ext" };
    if (!step && n.top < c.top && y > n.top) step = { d, kind: "step" };
  }
  return step;
}

// The cell inside a window, if it is interior at row y: the air gap behind the glass goes there.
function gapFor(c, y, d) {
  const [dx, dz] = DIRS[OPP[d]];
  const n = at(c.x + dx, c.z + dz);
  return n && y >= n.g && y <= n.top && !face(n, y) ? n : null;
}

const paneState = (d) =>
  d === "E" || d === "W"
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const doorState = (half) => ({ facing: "east", half, hinge: "left", open: "false", powered: "false" });

// The skin of an exposed row: base course, a shopfront under a timber lintel, a storey line, glazed bays with brick
// piers every third cell along the face, and a cornice on top. Single-storey wing: glazed bays and a cornice.
function skin(c, y, d) {
  const u = d === "E" || d === "W" ? c.z : c.x;
  const pier = u % 3 === 0;
  if (y === c.g || y === c.top) return { block: "stone_bricks" };
  if (c.top === 7 && y <= 2) return pier ? { block: "bricks" } : { block: "glass", gap: true };
  if (c.top === 7 && (y === 3 || y === 4)) return { block: "smooth_stone" };
  if (pier) return { block: "bricks" };
  return { block: "glass_pane", state: paneState(d), gap: true };
}

const g = new Voxels([21, 20, 12]);
const air = new Set(), lights = new Map(), plan = [];

for (const c of cells.values()) {
  for (let y = 0; y <= c.top; y++) {
    if (y < c.g) { plan.push([c.x, y, c.z, "cobblestone"]); continue; }   // foundation down to the lowest ground
    const f = face(c, y);
    if (!f) { plan.push([c.x, y, c.z, y === c.top ? "deepslate_tiles" : "bricks"]); continue; }   // solid interior, roof covering on top
    let s;
    if (c.x === 19 && c.z === 10 && (y === 1 || y === 2)) s = { block: "dark_oak_door", state: doorState(y === 1 ? "lower" : "upper"), gap: true };
    else if (c.x === 19 && y === 3 && c.z >= 9) s = { block: "dark_oak_slab", state: { type: "bottom", waterlogged: "false" } };   // canopy over the entrance
    else s = skin(c, y, f.d);
    plan.push([c.x, y, c.z, s.block, s.state]);
    if (!s.gap) continue;
    const n = gapFor(c, y, f.d);
    if (!n) continue;
    air.add(key(n.x, y, n.z));
    if (s.block === "glass" && y === 1 && (c.x + 2 * c.z) % 6 === 0) lights.set(key(n.x, y, n.z), "glowstone");
    if (s.block === "glass_pane" && y === 5 && (5 * c.x + 3 * c.z) % 7 === 0) lights.set(key(n.x, y, n.z), "shroomlight");
  }
}

for (const [x, y, z, block, state] of plan) if (!air.has(key(x, y, z))) g.set(x, y, z, block, state);
for (const [k, block] of lights) { const [x, y, z] = k.split(",").map(Number); g.set(x, y, z, block); }

// A continuous stone coping on the cornice of every street-facing cell (a flat parapet, not battlements)
for (const c of cells.values()) {
  const f = face(c, c.top + 1);
  if (f?.kind === "ext") g.set(c.x, c.top + 1, c.z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// Roof plant on the two-storey roof: a 2x2 air-handling box and a brick flue
for (const [x, z] of [[11, 5], [12, 5], [11, 6], [12, 6]]) for (const y of [8, 9]) g.set(x, y, z, "smooth_stone");
for (const y of [8, 9, 10]) g.set(14, y, 6, "bricks");

console.log(g.save(`${DIR}/way_827744430.nbt`));
