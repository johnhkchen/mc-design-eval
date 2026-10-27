// A 1970s-80s concrete office block on the slope below Mt Eden: a plinth on the lidar ground, a stepped tower of
// storeys on a 4-block grid (floor lines at y = 1 + 4n), grey roof membrane, white concrete piers and spandrels,
// blue glazing in aluminium-style bays, a lobby entrance under a canopy, and a plant room on the tower roof.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_162320045.cells.json`, "utf8"));
const SIZE = [58, 59, 61];
const k = (x, z) => `${x},${z}`;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const FACING = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };

// Storeys: the lidar roof (above y 0) rounded to whole 4-block storeys, a 3x3 median over the footprint twice to
// take out the noise, and at least one full storey above each column's own ground.
let cur = new Map();
for (const [x, z, g, roof] of cells) cur.set(k(x, z), { x, z, g, n: Math.round((roof - 1) / 4) });
for (let pass = 0; pass < 2; pass++) {
  const next = new Map();
  for (const c of cur.values()) {
    const vals = [];
    for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const o = cur.get(k(c.x + dx, c.z + dz)); if (o) vals.push(o.n); }
    vals.sort((a, b) => a - b);
    next.set(k(c.x, c.z), { ...c, n: vals[vals.length >> 1] });
  }
  cur = next;
}
for (const c of cur.values()) {
  c.N = Math.max(2, c.n, Math.ceil((c.g + 3) / 4));
  c.top = 1 + 4 * c.N;                 // roof membrane row; floor lines sit at y % 4 == 1
  c.base = Math.max(c.g, 1);           // first block above the foundation (the base course)
}
const at = (x, z) => cur.get(k(x, z));
// a face of this column at row y is exposed when its neighbour is off the footprint or its roof is lower
const exposed = (c, y) => DIRS.some(([dx, dz]) => { const o = at(c.x + dx, c.z + dz); return !o || y > o.top; });

const B = new Map();
const put = (x, y, z, block, state) => B.set(`${x},${y},${z}`, { x, y, z, block, state });
const has = (x, y, z) => B.has(`${x},${y},${z}`);

for (const c of cur.values()) {
  const { x, z, base, top } = c;
  for (let y = 0; y < base; y++) put(x, y, z, "stone_bricks");                       // foundation to the ground
  for (let y = base; y < top; y++) {
    const per = exposed(c, y);
    if (per && y === base) { put(x, y, z, "polished_andesite"); continue; }           // base course
    if (y % 4 === 1) { put(x, y, z, "light_gray_concrete"); continue; }              // floor slab, the whole footprint
    if (!per) continue;                                                              // interior air
    if (y % 4 === 0) { put(x, y, z, "white_concrete"); continue; }                   // spandrel
    if ((x + z) % 4 === 0) { put(x, y, z, "white_concrete"); continue; }             // pier between bays
    put(x, y, z, y < base + 4 ? "cyan_stained_glass_pane" : "light_blue_stained_glass_pane");
  }
  put(x, top, z, "gray_concrete");                                                    // roof membrane
  if (exposed(c, top + 1)) put(x, top + 1, z, "white_concrete");                      // parapet on the roof edge
}

// The entrance: the lowest facade cell on the street side, a double-height door, a canopy over it.
const outward = (c) => DIRS.find(([dx, dz]) => !at(c.x + dx, c.z + dz));
const facades = [...cur.values()].filter((c) => outward(c));
facades.sort((a, b) => a.base - b.base || (b.x + b.z) - (a.x + a.z));
const ent = facades[0], [ox, oz] = outward(ent), facing = FACING[`${ox},${oz}`];
const along = ox ? [[0, -1], [0, 0], [0, 1]] : [[-1, 0], [0, 0], [1, 0]];
for (const [dx, dz] of along) {
  const x = ent.x + dx, z = ent.z + dz;
  if (!at(x, z)) continue;
  put(x, ent.base + 3, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });   // canopy
}
put(ent.x, ent.base + 1, ent.z, "iron_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
put(ent.x, ent.base + 2, ent.z, "iron_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });

// Warm light: a glowstone just inside some lit bays, lanterns hanging from a few ceilings.
for (const c of cur.values()) {
  for (let y = c.base; y < c.top; y++) {
    if (y % 4 !== 2 && y % 4 !== 3) continue;
    if (!exposed(c, y) || !(B.has(`${c.x},${y},${c.z}`))) continue;
    if (((c.x * 7 + c.z * 3 + y) % 11) !== 0) continue;
    for (const [dx, dz] of DIRS) {
      const o = at(c.x + dx, c.z + dz);
      if (o && !exposed(o, y) && y >= o.base && y < o.top && !has(o.x, y, o.z) && y % 4 !== 1) {
        put(o.x, y, o.z, "glowstone"); break;
      }
    }
  }
  for (let y = c.base + 1; y < c.top - 1; y++) {
    if (y % 4 !== 0 || exposed(c, y) || has(c.x, y, c.z)) continue;
    if (((c.x * 5 + c.z * 13 + y) % 17) === 0) put(c.x, y, c.z, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

// Roof plant: a solid plant room on the tower's roof, around the middle of the top tier.
const maxTop = Math.max(...[...cur.values()].map((c) => c.top));
const tier = [...cur.values()].filter((c) => c.top === maxTop);
const cx = Math.round(tier.reduce((s, c) => s + c.x, 0) / tier.length), cz = Math.round(tier.reduce((s, c) => s + c.z, 0) / tier.length);
for (let dx = -2; dx <= 2; dx++) for (let dz = -1; dz <= 1; dz++) {
  const c = at(cx + dx, cz + dz);
  if (!c || c.top !== maxTop) continue;
  put(c.x, maxTop + 1, c.z, "light_gray_concrete"); put(c.x, maxTop + 2, c.z, "light_gray_concrete");
  put(c.x, maxTop + 3, c.z, "gray_concrete");
}

// Glass panes connect to their neighbours in the four directions.
const solidAt = (x, y, z) => has(x, y, z);
for (const b of B.values()) {
  if (!b.block.endsWith("_glass_pane")) continue;
  const conn = (dx, dz) => (solidAt(b.x + dx, b.y, b.z + dz) ? "true" : "false");
  b.state = { north: conn(0, -1), south: conn(0, 1), east: conn(1, 0), west: conn(-1, 0), waterlogged: "false" };
}

// Check: every block rests on or against something (no hanging blocks except lanterns), inside the footprint.
let hanging = 0;
for (const b of B.values()) {
  if (b.y === 0 || b.block === "lantern") continue;
  const supported = solidAt(b.x, b.y - 1, b.z) || DIRS.some(([dx, dz]) => solidAt(b.x + dx, b.y, b.z + dz));
  if (!supported) hanging++;
}

const g = new Voxels(SIZE);
for (const b of B.values()) g.set(b.x, b.y, b.z, b.block, b.state);
const out = g.save(`${DIR}/way_162320045.nbt`);
console.log(JSON.stringify({ blocks: out.blocks, palette: out.palette, hanging, top: maxTop, entrance: [ent.x, ent.base, ent.z, facing] }));
