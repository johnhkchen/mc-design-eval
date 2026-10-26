// FR245184529: a 1900 annex, two storeys of pale stone-render on a grey plinth, under a steep slate mansard that
// takes the lidar roof (23 blocks, 15 on the low wing). Storeys are 5 blocks, so the walls stand to y = floor + 10 and
// the mansard climbs 3 blocks at its first ring, then 2 per ring (a steep lower slope, then a flatter top). Every cell is one solid
// column from y 0 up to its top, so each floor, tier and roof stands on what is below. The facade is a one-cell skin:
// glass panes in a 3-bay rhythm (a pier every third cell) with one air cell behind each pane, lit with glowstone in
// some; the string course and lintel rows are the floor slabs. Dormers are flush panes in the mansard's first ring.
// The entrance is on the south face (the grid's edge leaves no room for a projecting canopy, so the door sits under a
// stone lintel). Two brick chimneys stand on the mansard.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill";
const cells = JSON.parse(readFileSync(`${DIR}/FR245184529.cells.json`, "utf8"));

const W = 15, H = 39, D = 10;
const WALL = 10;      // two storeys of 5 blocks above the floor
const RISE = 3;       // mansard: the first ring inward climbs 3 blocks, then 2 per ring (flatter top, no spire)
const DOOR = "1,9";   // the south face's street-side cell

const fp = new Map();                                  // "x,z" -> cell
for (const [x, z, g, r] of cells) fp.set(`${x},${z}`, { x, z, g, r, B: g, d: Infinity, T: 0 });
const at = (x, z) => fp.get(`${x},${z}`);
const NEI = [["north", 0, -1], ["south", 0, 1], ["west", -1, 0], ["east", 1, 0]];
const OPP = { north: "south", south: "north", west: "east", east: "west" };
const solid = (x, y, z) => { const c = at(x, z); return !!c && y >= 0 && y < c.T; };
const exposed = (x, y, z) => NEI.filter(([, dx, dz]) => !solid(x + dx, y, z + dz)).map(([n]) => n);
const alongOf = (face, x, z) => (face === "north" || face === "south" ? x : z);

// Inset from the outline: edge cells are d 0, the next ring d 1, and so on (breadth-first over the footprint).
const queue = [];
for (const c of fp.values()) if (NEI.some(([, dx, dz]) => !at(c.x + dx, c.z + dz))) { c.d = 0; queue.push(c); }
for (let i = 0; i < queue.length; i++) {
  const c = queue[i];
  for (const [, dx, dz] of NEI) { const n = at(c.x + dx, c.z + dz); if (n && n.d > c.d + 1) { n.d = c.d + 1; queue.push(n); } }
}

// Tops: the edge walls stop at the wall height, unless the lidar says a low wing (its roof within 6 of the wall top),
// which then stands full height. Inner rings climb RISE per ring up to the lidar roof: the mansard.
for (const c of fp.values()) {
  const wallTop = c.B + WALL;
  if (c.d === 0) c.T = c.r - wallTop > 6 ? wallTop : c.r;
  else c.T = Math.min(c.r, wallTop + RISE + 2 * (c.d - 1));
}

// Paint: the windows, door and lamps, decided on the massing above, go in an override map.
// A value of null is an air cell (the gap behind a pane); an object is a block with its state.
const over = new Map();
const key = (x, y, z) => `${x},${y},${z}`;
const pane = (face) => (face === "north" || face === "south"
  ? { east: "true", west: "true", north: "false", south: "false" }
  : { north: "true", south: "true", east: "false", west: "false" });

// Facade: rows 1-3 (ground storey) and 6-8 (upper storey). Glass on a cell that faces one way and is not a pier
// (every third cell along the face); the cell behind it is air, unless it is a lamp (glowstone in every fourth bay).
let bay = 0;
for (const c of fp.values()) {
  if (c.d !== 0 || `${c.x},${c.z}` === DOOR) continue;
  for (const rel of [1, 2, 3, 6, 7, 8]) {
    const y = c.B + rel;
    if (y >= c.T) continue;
    const ex = exposed(c.x, y, c.z);
    if (ex.length !== 1) continue;
    const face = ex[0];
    if (alongOf(face, c.x, c.z) % 3 === 0) continue;             // pier
    const [, dx, dz] = NEI.find(([n]) => n === OPP[face]);
    const ix = c.x + dx, iz = c.z + dz;
    if (!solid(ix, y, iz) || exposed(ix, y, iz).length || !solid(ix + dx, y, iz + dz)) continue;
    over.set(key(c.x, y, c.z), { b: "glass_pane", s: pane(face) });
    bay++;
    over.set(key(ix, y, iz), rel === 2 && bay % 4 === 0 ? { b: "glowstone" } : null);
  }
}

// Dormers: the mansard's first ring (d 1), in its two rows above the cornice, flush panes on the outward faces.
for (const c of fp.values()) {
  if (c.d !== 1) continue;
  for (const rel of [WALL + 1, WALL + 2]) {
    const y = c.B + rel;
    if (y >= c.T) continue;
    const ex = exposed(c.x, y, c.z);
    if (ex.length !== 1 || alongOf(ex[0], c.x, c.z) % 3 === 0) continue;
    over.set(key(c.x, y, c.z), { b: "glass_pane", s: pane(ex[0]) });
  }
}

// Entrance: a door in the south face (two blocks, lower and upper), a stone lintel over it.
const door = at(...DOOR.split(",").map(Number));
if (door) {
  const st = (half) => ({ facing: "south", half, hinge: "left", open: "false", powered: "false" });
  over.set(key(door.x, door.B + 1, door.z), { b: "oak_door", s: st("lower") });
  over.set(key(door.x, door.B + 2, door.z), { b: "oak_door", s: st("upper") });
  over.set(key(door.x, door.B + 3, door.z), { b: "smooth_stone" });
}

// Block for a solid cell at y, from its storey (plinth, floor bands, render, cornice, slate).
const matAt = (c, y) => {
  const rel = y - c.B;
  if (rel <= 0) return { b: "stone_bricks" };                    // plinth and base course
  if (rel < WALL) return { b: rel === 4 || rel === 5 || rel === 9 ? "smooth_stone" : "white_concrete" };
  if (rel === WALL) return { b: "smooth_stone" };                // cornice line
  return { b: "deepslate_tiles" };                               // mansard slate
};

const out = new Voxels([W, H, D]);
for (const c of fp.values()) {
  for (let y = 0; y < c.T; y++) {
    const o = over.has(key(c.x, y, c.z)) ? over.get(key(c.x, y, c.z)) : matAt(c, y);
    if (o) out.set(c.x, y, c.z, o.b, o.s);
  }
}

// Two chimney stacks on the mansard, each a brick column standing on its own roof cell.
const chimneyAt = (xt) => [...fp.values()].filter((c) => c.d >= 2)
  .sort((a, b) => Math.abs(a.x - xt) - Math.abs(b.x - xt) || b.T - a.T)[0];
for (const xt of [4, 11]) {
  const c = chimneyAt(xt);
  if (!c) continue;
  for (let y = c.T; y < c.T + 3; y++) out.set(c.x, y, c.z, "bricks");
  out.set(c.x, c.T + 3, c.z, "smooth_stone_slab");
}

console.log(out.save(`${DIR}/FR245184529.nbt`));
