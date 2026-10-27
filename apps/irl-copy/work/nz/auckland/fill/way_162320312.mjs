// A 1980s concrete-frame office block on the Auckland ridge: precast white piers and string courses, light-grey spandrels,
// tinted blue glazing in a 3-block bay rhythm, a stone-capped cornice, a shopfront ground storey with a recessed door,
// and a plant room on the roof. The lidar roof is median-smoothed and snapped to 4-block storey lines, so every tier
// and roof lands on a storey and the massing reads as clean stepped tiers (the tower top 44, podium and wings lower).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const FILL = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${FILL}/way_162320312.cells.json`, "utf8"));   // [x, z, ground, roof]

const W = 36, H = 60, D = 39;
const g = new Voxels([W, H, D]);
const put = (x, y, z, block, state) => { if (x >= 0 && y >= 0 && z >= 0 && x < W && y < H && z < D) g.set(x, y, z, block, state); };
const has = (x, y, z) => g.get(x, y, z) !== null;

// --- the footprint: per cell, the lidar roof median-smoothed (3x3) and snapped to storey lines (4 blocks) ---
const raw = new Map(cells.map(([x, z, gr, r]) => [`${x},${z}`, { x, z, g: gr, r }]));
const at = (x, z) => raw.get(`${x},${z}`);
const median = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const c = at(x + dx, z + dz); if (c) v.push(c.r); }
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const cs = cells.map(([x, z, gr]) => {
  const L0 = 4 * Math.ceil(gr / 4);                             // first storey line above the lowest ground under the cell
  const top = Math.max(4 * Math.round(median(x, z) / 4), L0 + 4); // roof, snapped to a storey line
  return { x, z, g: gr, L0, top };
});
const byXZ = new Map(cs.map((c) => [`${c.x},${c.z}`, c]));
const cell = (x, z) => byXZ.get(`${x},${z}`);
const DIRS = [[-1, 0, "west", "x"], [1, 0, "east", "x"], [0, -1, "north", "z"], [0, 1, "south", "z"]];

// The envelope: a cell is shell if a neighbour is outside the footprint or sits lower (the face of a setback or wing).
// Shell cells are solid full-height columns (the facade); the rest are interior: plinth, floor slabs, roof, air between.
for (const c of cs) {
  c.exposed = DIRS.filter(([dx, dz]) => { const n = cell(c.x + dx, c.z + dz); return !n || n.top < c.top; });
  c.boundary = c.exposed.length > 0;
  const x = c.exposed.find(([, , , a]) => a === "x");
  c.axis = x ? "x" : "z";                                         // the wall the facade reads on (runs along z for x faces)
  c.idx = c.axis === "x" ? c.z : c.x;                             // bay index along that wall
  c.pier = c.idx % 3 === 0;
}

// The entrance: a pane bay on the street-level ground storey, on a face to the outside, low and well-seated.
let ent = null;
for (const c of cs) {
  if (!c.boundary || c.pier || c.L0 > 4) continue;
  for (const [dx, dz, name, axis] of DIRS) {
    if (axis !== c.axis || cell(c.x + dx, c.z + dz)) continue;   // outward on the cell's own facade axis
    const score = c.L0 * 100 - c.top;
    if (!ent || score < ent.score) ent = { c, name, dx, dz, score };
  }
}
if (ent) ent.c.door = ent;

const PANE = (axis) => ({ block: "light_blue_stained_glass_pane", state: axis === "x"
  ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
  : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" } });
const DOOR = (facing, half) => ({ block: "dark_oak_door", state: { facing, half, hinge: "left", open: "false", powered: "false" } });

// The facade column at height y: base course, storey lines, window bays, string courses, cornice.
const facade = (c, y) => {
  if (y === c.top - 1) return { block: "smooth_stone" };                       // cornice cap
  const ground = y < c.L0 + 4, o = y % 4;
  if (c.door && ground && (y === c.L0 + 1 || y === c.L0 + 2)) return DOOR(c.door.name, y === c.L0 + 1 ? "lower" : "upper");
  if (o === 0) return { block: ground ? "polished_andesite" : "light_gray_concrete" };   // base course / spandrel
  if (o === 3) return { block: "white_concrete" };                                          // string course
  if (c.pier) return { block: "white_concrete" };
  return ground ? { block: "light_blue_stained_glass" } : PANE(c.axis);       // shopfront glass / office glazing
};

// --- build ---
for (const c of cs) {
  const { x, z, L0, top: T } = c;
  const plinth = Math.min(L0, T);
  for (let y = 0; y < plinth; y++) put(x, y, z, "polished_andesite");
  if (c.boundary) {
    for (let y = plinth; y < T; y++) { const f = facade(c, y); put(x, y, z, f.block, f.state); }
    put(x, T, z, "white_concrete");                                              // parapet on the roof edge
  } else {
    for (let y = L0; y <= T - 4; y += 4) put(x, y, z, "light_gray_concrete");   // floor slab per storey
    put(x, T - 1, z, "stone");                                                   // roof
  }
}

// Warm light behind some windows and in the entrance hall (interior air, standing on a floor below it).
for (const c of cs) {
  if (!c.boundary) continue;
  for (const [dx, dz] of c.exposed) {
    if (cell(c.x + dx, c.z + dz)) continue;                      // only the face to the outside
    const ix = c.x - dx, iz = c.z - dz, inner = cell(ix, iz);
    if (!inner || inner.boundary) continue;
    for (let y = c.L0 + 1; y < c.top - 1; y++) {
      if (c.pier || (y % 4 !== 1 && y % 4 !== 2)) continue;
      if (c.door && y >= c.L0 + 1 && y <= c.L0 + 2) continue;
      if (((c.x * 7 + c.z * 3 + y * 5) % 4) !== 0) continue;     // about one window in four
      if (!has(ix, y - 1, iz) || has(ix, y, iz)) continue;
      put(ix, y, iz, "glowstone");
    }
  }
  if (c.door && c.door.c === c) {
    const inward = { west: [1, 0], east: [-1, 0], north: [0, 1], south: [0, -1] }[c.door.name];
    const ix = c.x + inward[0], iz = c.z + inward[1], y = c.L0 + 1;
    if (cell(ix, iz) && !cell(ix, iz).boundary && has(ix, c.L0, iz)) put(ix, y, iz, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// Roof: a plant room on the top tier's centre (solid, banded, with a lightning rod), and AC units on the lower roofs.
const maxT = Math.max(...cs.map((c) => c.top));
const top = cs.filter((c) => c.top === maxT);
const cx = Math.round(top.reduce((s, c) => s + c.x, 0) / top.length), cz = Math.round(top.reduce((s, c) => s + c.z, 0) / top.length);
const box = new Set();
for (let x = cx - 4; x <= cx + 3; x++) for (let z = cz - 4; z <= cz + 3; z++) {
  const c = cell(x, z);
  if (!c || c.top !== maxT) continue;
  box.add(`${x},${z}`);
  const ring = x === cx - 4 || x === cx + 3 || z === cz - 4 || z === cz + 3;
  for (let y = maxT; y < maxT + 4; y++) {
    if (!ring) put(x, y, z, "light_gray_concrete");
    else if ((y === maxT + 1 || y === maxT + 2) && ((x + z) % 2 === 0)) put(x, y, z, "light_blue_stained_glass_pane", { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" });
    else put(x, y, z, "white_concrete");
  }
  put(x, maxT + 4, z, "smooth_stone");
}
put(cx, maxT + 5, cz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
for (const c of cs) {
  if (c.boundary || box.has(`${c.x},${c.z}`)) continue;
  if ((c.x * 5 + c.z * 3) % 17 === 0) put(c.x, c.top, c.z, "iron_block");           // AC units on the roofs
}

// --- report, then save ---
const out = g.save(`${FILL}/way_162320312.nbt`);
const shell = cs.filter((c) => c.boundary).length;
console.log(`cells ${cs.length} shell ${shell} interior ${cs.length - shell} tiers ${[...new Set(cs.map((c) => c.top))].sort((a, b) => a - b).join(",")}`);
console.log(`entrance ${ent ? `${ent.c.x},${ent.c.z} facing ${ent.name} (L0 ${ent.c.L0})` : "none"}; plant room ${cx},${cz} top ${maxT}`);
console.log(`saved blocks ${out.blocks} palette ${out.palette}`);
