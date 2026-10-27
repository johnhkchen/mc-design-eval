// A 1970s concrete-frame office block on a sloped site, read from the lidar record: a 27 x 17 footprint whose ground
// rises 5 blocks to the east and whose roof runs from 34 to 46 blocks. Storeys are 4 blocks on a datum at y 5 (the
// highest ground under the footprint), so every floor, setback and roof sits on the course below it. The facade is one
// block deep with an air gap behind the glass; a solid core carries the floors that the walls do not reach.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_292861508.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_292861508.nbt";

const SIZE = [27, 59, 17];
const DATUM = 5;                       // ground-floor slab: the highest ground under the footprint is 5
const STOREY = 4;
const TOP_MAX = DATUM + STOREY * 10;   // 45: the tallest tier (parapet 46, coping 47 - the lidar's 46-47)

const WALLS = new Set(["light_gray_concrete", "gray_concrete", "stone_bricks", "chiseled_stone_bricks", "stone",
  "smooth_stone", "dark_oak_planks", "light_blue_stained_glass_pane"]);

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const K = (x, z) => `${x},${z}`;
const cell = new Map();
for (const [x, z, ground, roof] of cells) cell.set(K(x, z), { x, z, ground, roof });
const at = (x, z) => cell.get(K(x, z));
const all = [...cell.values()];

// edge cells face outward on one axis (corners on two); u is the coordinate along the facade for bays
for (const c of all) {
  const xm = !at(c.x - 1, c.z), xp = !at(c.x + 1, c.z), zm = !at(c.x, c.z - 1), zp = !at(c.x, c.z + 1);
  c.edge = xm || xp || zm || zp;
  c.corner = (xm || xp) && (zm || zp);
  c.out = c.corner ? [0, 0] : [xm ? -1 : xp ? 1 : 0, zm ? -1 : zp ? 1 : 0];
  c.u = c.out[0] !== 0 ? c.z : c.x;
}

// depth in from the edge: 0 = facade, 1 = the air gap behind it, 2+ = the core
const depth = new Map();
const q = [];
for (const c of all) if (c.edge) { depth.set(K(c.x, c.z), 0); q.push(c); }
for (let i = 0; i < q.length; i++) {
  const c = q[i], d = depth.get(K(c.x, c.z));
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const n = at(c.x + dx, c.z + dz);
    if (n && !depth.has(K(n.x, n.z))) { depth.set(K(n.x, n.z), d + 1); q.push(n); }
  }
}
const depthOf = (c) => depth.get(K(c.x, c.z));

// lidar roof -> clean tiers: a 3x3 median kills the noise (a few cells read roof 1 under 40), then snap to the datum
const median = (a) => { const s = [...a].sort((p, r) => p - r); return s[Math.floor(s.length / 2)]; };
for (const c of all) {
  const near = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const n = at(c.x + dx, c.z + dz); if (n) near.push(n.roof); }
  const k = Math.round((median(near) - DATUM) / STOREY);
  c.top = Math.min(TOP_MAX, Math.max(DATUM + STOREY, DATUM + STOREY * k));
}

// the entrance: the middle of the low (street-level) facade, on a flat edge cell
const doorCands = all.filter((c) => c.edge && !c.corner && c.ground <= 1).sort((a, b) => a.u - b.u);
const door = doorCands[Math.floor(doorCands.length / 2)];
const FACING = { "-1,0": "west", "1,0": "east", "0,-1": "north", "0,1": "south" };

const B = new Map();
const K3 = (x, y, z) => `${x},${y},${z}`;
const put = (x, y, z, name, state) => B.set(K3(x, y, z), { name, state });
const at3 = (x, y, z) => B.get(K3(x, y, z));

for (const c of all) {
  const { x, z, ground, top } = c, d = depthOf(c);
  // fill to the ground, then the plinth to the datum (a base course on the street side)
  for (let y = 0; y < ground; y++) put(x, y, z, "stone");
  for (let y = ground; y < DATUM; y++) put(x, y, z, c.edge ? (y === DATUM - 1 ? "chiseled_stone_bricks" : "stone_bricks") : "stone");
  // the core: solid up to the roof; everything else floored at each datum, with air between
  for (let y = DATUM; y < top; y++) {
    const r = (y - DATUM) % STOREY;
    if (d >= 2) { put(x, y, z, "light_gray_concrete"); continue; }
    if (r === 0) { put(x, y, z, "light_gray_concrete"); continue; }     // floor slab
    if (!c.edge) continue;                                              // the air gap behind the glass
    if (r === 3) { put(x, y, z, "light_gray_concrete"); continue; }     // head band
    const ground1 = y < DATUM + STOREY;
    if (c.corner || c.u % 4 === 0) { put(x, y, z, ground1 ? "dark_oak_planks" : "gray_concrete"); continue; }
    put(x, y, z, "light_blue_stained_glass_pane");
  }
  // the roof slab, and on the edge a parapet with a coping
  put(x, top, z, "smooth_stone");
  if (c.edge && d !== undefined) {
    put(x, top + 1, z, "light_gray_concrete");
    put(x, top + 2, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}

// the entrance: two-high door on the street side, a transom of glass above it
{
  const { x, z } = door;
  put(x, DATUM, z, "dark_oak_door", { facing: FACING[door.out.join(",")], half: "lower", hinge: "left", open: "false", powered: "false" });
  put(x, DATUM + 1, z, "dark_oak_door", { facing: FACING[door.out.join(",")], half: "upper", hinge: "left", open: "false", powered: "false" });
  put(x, DATUM + 2, z, "light_blue_stained_glass_pane");
}

// warm light behind some of the glass: a lantern (or a shroomlight) on the floor of the air gap
for (const c of all) {
  if (!c.edge || c.corner || c === door || depthOf(c) !== 0) continue;
  const inner = at(c.x - c.out[0], c.z - c.out[1]);
  if (!inner || depthOf(inner) !== 1) continue;
  for (let s = 0; s < 6; s++) {
    const y = DATUM + STOREY * s + 1;
    if (!at3(c.x, y, c.z) || at3(c.x, y, c.z).name !== "light_blue_stained_glass_pane") continue;
    const h = (c.x * 7 + c.z * 13 + s * 5) % 9;
    if (h === 0) put(inner.x, y, inner.z, "lantern", { hanging: "false", waterlogged: "false" });
    else if (h === 4) put(inner.x, y, inner.z, "shroomlight");
  }
}

// roof plant: a small block of lift and plant room on the tallest tier, near the middle of it
{
  const tall = all.filter((c) => c.top === TOP_MAX && depthOf(c) >= 2);
  const cx = tall.reduce((s, c) => s + c.x, 0) / tall.length, cz = tall.reduce((s, c) => s + c.z, 0) / tall.length;
  for (const c of tall) {
    if (Math.abs(c.x - cx) > 2 || Math.abs(c.z - cz) > 2) continue;
    put(c.x, TOP_MAX + 1, c.z, "gray_concrete");
    put(c.x, TOP_MAX + 2, c.z, "gray_concrete");
    put(c.x, TOP_MAX + 3, c.z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}

// panes connect to the walls beside them (never to the lamps or the door)
const conn = (x, y, z, dir) => {
  const n = { e: [1, 0], w: [-1, 0], n: [0, -1], s: [0, 1] }[dir];
  const b = at3(x + n[0], y, z + n[1]);
  return b && WALLS.has(b.name) ? "true" : "false";
};

const g = new Voxels(SIZE);
let count = 0;
for (const [k, { name, state }] of B) {
  const [x, y, z] = k.split(",").map(Number);
  if (name === "light_blue_stained_glass_pane") {
    g.set(x, y, z, name, { north: conn(x, y, z, "n"), east: conn(x, y, z, "e"), south: conn(x, y, z, "s"), west: conn(x, y, z, "w"), waterlogged: "false" });
  } else g.set(x, y, z, name, state);
  count++;
}

// sanity: nothing floats (every block above y 0 has a block under it)
const floating = [...B.keys()].filter((k) => {
  const [x, y, z] = k.split(",").map(Number);
  return y > 0 && !at3(x, y - 1, z);
});
const byDepth = {};
for (const k of floating) { const [x, y, z] = k.split(",").map(Number); const d = depth.get(K(x, z)); const t = (y - DATUM) % STOREY === 0 || y === at(x, z)?.top ? "slab" : "other"; byDepth[`d${d}-${t}`] = (byDepth[`d${d}-${t}`] || 0) + 1; }
const res = g.save(OUT);
console.log(JSON.stringify({ blocks: count, palette: res.palette, footprint: all.length, door: [door.x, door.z], floating: floating.length, byDepth }));
