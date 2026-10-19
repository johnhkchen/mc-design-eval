// DC70899: Commercial-Office-Large, 441 4th St NW (Judiciary Square), as a 1.21.1 module.
// Read from the record: a mid-century to 1970s office block of white-faced concrete piers and light spandrels, the
// usual Judiciary Square mix of podium, wings and one stepped tower. Storeys are 2 blocks (a window row over a
// spandrel row, about 4.8 m real at 0.42 blocks/m), so the 16- and 18-block roofs are 7 and 8 storeys over a base.
// The lidar roof (3x3 median over the footprint) is snapped to four flat tiers: 1 (paving), 3 (podium), 12 (wings),
// 16 (block), 18 (tower core). Each column is solid from y 0 up to its tier, with floor slabs on even rows, so
// every storey, setback and roof stands on what is below it. The interior is air behind the glass on the odd rows.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC70899.cells.json`, "utf8"));   // [x, z, ground, roof]
const OUT = `${DIR}/DC70899.nbt`;

const key = (x, z) => `${x},${z}`;
const raw = new Map(cells.map(([x, z, g, r]) => [key(x, z), { x, z, g, r }]));

// Smoothed roof: median of the footprint cells in the 3x3 around each cell, then snapped to a flat tier.
const medianRoof = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const n = raw.get(key(x + dx, z + dz)); if (n) v.push(n.r); }
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const tier = (h) => (h <= 2 ? 1 : h <= 4 ? 3 : h <= 14 ? 12 : h <= 17 ? 16 : 18);

const F = new Map();
for (const c of raw.values()) F.set(key(c.x, c.z), { ...c, T: Math.max(tier(medianRoof(c.x, c.z)), c.g) });
const at = (x, z) => F.get(key(x, z));

// Faces of this cell that look out at row y: off the footprint, or beside a neighbour whose top is below y (a setback).
const DIRS = [["E", 1, 0], ["W", -1, 0], ["S", 0, 1], ["N", 0, -1]];
const exposed = (c, y) => DIRS.filter(([, dx, dz]) => { const n = at(c.x + dx, c.z + dz); return !n || y >= n.T; }).map(([f]) => f);

// Palette
const WALL = "white_concrete";          // piers, corners, the face of the block
const SPANDREL = "light_gray_concrete"; // the floor line between window rows
const BASE = "stone_bricks";            // foundation, plinth and the cornice
const FILL = "stone";                   // interior floor slabs (no interior is shown)
const ROOF = "smooth_stone";            // the roof membrane under the cornice row
const GLASS = "light_blue_stained_glass_pane";
const CANOPY = "stone_brick_slab";
const DOOR = "dark_oak_door";
const LAMP = "glowstone";
const AC = "iron_block";
const PENT = "light_gray_concrete";

const g = new Voxels([24, 21, 52]);
const put = (x, y, z, b, s) => g.set(x, y, z, b, s);

// A pane joins its neighbours along the face it sits in, so it renders as a run of glass, not as posts.
const pane = (face) => (face === "E" || face === "W"
  ? { north: "true", south: "true", east: "false", west: "false" }
  : { north: "false", south: "false", east: "true", west: "true" });
// One block of a facade's window row: a pier every third block, glass between.
const facadeBlock = (face, idx) => (idx % 3 === 0 ? [WALL] : [GLASS, pane(face)]);

// Body: every cell from y 0 up to its tier.
for (const c of F.values()) {
  for (let y = 0; y < c.T; y++) {
    const sides = exposed(c, y);
    if (y < c.g) { put(c.x, y, c.z, sides.length ? BASE : FILL); continue; }     // foundation under the lower ground
    if (y === c.T - 1) { put(c.x, y, c.z, sides.length ? BASE : ROOF); continue; } // cornice on the outside, membrane inside
    if (y === c.g) { put(c.x, y, c.z, sides.length ? BASE : FILL); continue; }     // plinth course
    if (y % 2 === 0) { put(c.x, y, c.z, sides.length > 1 ? WALL : sides.length ? SPANDREL : FILL); continue; } // floor line
    if (!sides.length) continue;                                                 // air behind the glass
    if (sides.length > 1) { put(c.x, y, c.z, WALL); continue; }                  // corner pier
    const face = sides[0];
    const idx = face === "E" || face === "W" ? c.z : c.x;
    put(c.x, y, c.z, ...facadeBlock(face, idx));
  }
}

// Entrance: a pair of doors on the east face, under a canopy band at the first window row.
for (const z of [24, 25]) {
  const hinge = z === 24 ? "left" : "right";
  put(23, 1, z, DOOR, { facing: "east", half: "lower", hinge, open: "false", powered: "false" });
  put(23, 2, z, DOOR, { facing: "east", half: "upper", hinge, open: "false", powered: "false" });
}
for (let z = 23; z <= 26; z++) {
  put(23, 3, z, CANOPY, { type: "top" });
  if (at(22, z)) put(22, 3, z, CANOPY, { type: "top" });   // the lobby ceiling behind the canopy
}

// Warm light: some windows on the first two storeys and the lower wings have a lit room behind the glass.
for (const c of F.values()) {
  for (let y = 1; y < c.T - 1; y += 2) {
    const sides = exposed(c, y);
    if (sides.length !== 1 || y <= c.g) continue;
    const face = sides[0];
    const idx = face === "E" || face === "W" ? c.z : c.x;
    if (idx % 3 === 0 || (idx + y) % 4 !== 1) continue;
    const [dx, dz] = { E: [-1, 0], W: [1, 0], S: [0, -1], N: [0, 1] }[face];
    const ix = c.x + dx, iz = c.z + dz;
    if (!at(ix, iz) || g.get(ix, y, iz) || !g.get(ix, y - 1, iz)) continue;
    put(ix, y, iz, (y + idx) % 8 === 1 ? "shroomlight" : LAMP);
  }
}

// Roof: a stepped penthouse on the tower core, and two air-handling units on the east wing.
for (let x = 14; x <= 19; x++) for (let z = 8; z <= 13; z++) {
  const onW = x === 14 || x === 19, onN = z === 8 || z === 13;
  put(x, 19, z, BASE);                                   // cornice course
  if (onW && onN) put(x, 18, z, WALL);                   // corner pier
  else if (onW) put(x, 18, z, ...facadeBlock(x === 14 ? "W" : "E", z));
  else if (onN) put(x, 18, z, ...facadeBlock(z === 8 ? "N" : "S", x));
  else put(x, 18, z, PENT);                              // plant room behind the glazed walls
}
for (const [x, z] of [[6, 8], [7, 8], [6, 9], [7, 9], [6, 14], [7, 14], [6, 15], [7, 15]]) put(x, 12, z, AC);

const res = g.save(OUT);
console.log(`DC70899.nbt: ${res.blocks} blocks, ${res.palette} palette entries`);
