// ACG Pathways Campus, Eden Terrace side of Mt Eden: a late-1980s concrete-frame tertiary block. A seven-storey podium
// (lidar roof 29) with a three-storey wing on the low side (12), a tower stepping back to 33 and a crown at 40, the
// roofs snapped to those four tiers. Storeys are 4 blocks: floor slabs at y = 3, 7, 11, ... Dark basalt base, white
// concrete piers and frames, blue-tinted glass, a concrete storey line at every slab; glowing windows, roof plant.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_293020882.cells.json`, "utf8"));   // [x, z, ground, roof]
const g = new Voxels([41, 52, 60]);

const key = (x, z) => `${x},${z}`;
const tier = (r) => (r <= 16 ? 12 : r <= 29 ? 29 : r <= 33 ? 33 : 40);   // the lidar's roofs as four flat tiers
const cell = new Map(cells.map(([x, z, gr, r]) => [key(x, z), { gr, r: tier(r) }]));
const has = (x, z) => cell.has(key(x, z));
const DIRS = [["N", 0, -1], ["S", 0, 1], ["E", 1, 0], ["W", -1, 0]];
// the footprint's outer walls (for the street-side door)
const outward = (x, z) => DIRS.filter(([, dx, dz]) => !has(x + dx, z + dz)).map(([d]) => d);
// the faces that show: the outer walls, and the walls a setback leaves standing above the tier beside it
const faces = (x, z) => {
  const r = cell.get(key(x, z)).r;
  return DIRS.filter(([, dx, dz]) => !has(x + dx, z + dz) || cell.get(key(x + dx, z + dz)).r < r).map(([d]) => d);
};
const FLOOR = (y) => y % 4 === 3;                 // storey lines
const COLUMN = (x, z) => x % 6 === 0 && z % 6 === 0;   // the frame's interior columns, every 6 blocks
const INWARD = { N: [0, 1], S: [0, -1], E: [-1, 0], W: [1, 0] };
const FACING = { N: "south", S: "north", E: "west", W: "east" };   // a door's facing turns it to face out

// The entrance: the street-side wall (the lowest ground) near its middle.
let door = null;
for (const [k, { gr }] of cell) {
  const [x, z] = k.split(",").map(Number), o = outward(x, z);
  if (!o.length || !(o.includes("N") || o.includes("S"))) continue;
  const score = gr * 4 + Math.abs(x - 20) * 0.5;
  if (!door || score < door.score) door = { x, z, gr, out: o.includes("N") ? "N" : "S", score };
}

for (const [k, { gr, r }] of cell) {
  const [x, z] = k.split(",").map(Number);
  const o = faces(x, z), edge = o.length > 0;
  const ns = o.includes("N") || o.includes("S"), ew = o.includes("E") || o.includes("W");
  const idx = ns ? x : z;                          // position along the facade
  const pier = (ns && ew) || idx % 3 === 0;        // corners and every third cell: the frame
  const bay = Math.floor(idx / 3);
  const isDoor = door && door.x === x && door.z === z;

  for (let y = 0; y < r; y++) {
    const roof = y === r - 1, floor = FLOOR(y) && !roof;
    // the foundation below ground; a solid podium under the interior
    if (y < gr) { g.set(x, y, z, "stone_bricks"); continue; }
    if (!edge && y < 3) { g.set(x, y, z, "deepslate_bricks"); continue; }
    if (roof) { g.set(x, y, z, edge ? "smooth_stone" : "light_gray_concrete"); continue; }
    if (!edge) { if (floor || COLUMN(x, z)) g.set(x, y, z, COLUMN(x, z) ? "white_concrete" : "light_gray_concrete"); continue; }
    if (y === r - 2 && !floor) { g.set(x, y, z, "polished_andesite"); continue; }   // cornice under the parapet
    if (isDoor && (y === gr || y === gr + 1)) {
      g.set(x, y, z, "oak_door", { facing: FACING[door.out], half: y === gr ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (floor) { g.set(x, y, z, "light_gray_concrete"); continue; }                    // storey line (spandrel)
    if (y < gr + 3) { g.set(x, y, z, "deepslate_bricks"); continue; }                  // base course
    if (pier) g.set(x, y, z, "white_concrete");
    else g.set(x, y, z, bay % 4 === 0 ? "cyan_stained_glass" : "light_blue_stained_glass");
  }
}

// Warm light behind some glazed bays: a glowstone on the floor inside, seen through the glass.
for (const [k, { gr, r }] of cell) {
  const [x, z] = k.split(",").map(Number), o = faces(x, z);
  if (!o.length) continue;
  const ns = o.includes("N") || o.includes("S"), ew = o.includes("E") || o.includes("W");
  const idx = ns ? x : z;
  if ((ns && ew) || idx % 3 === 0) continue;
  const bay = Math.floor(idx / 3), [dx, dz] = INWARD[o[0]], ix = x + dx, iz = z + dz;
  if (!has(ix, iz) || faces(ix, iz).length || COLUMN(ix, iz)) continue;
  for (let y = gr + 4; y < r - 2; y++) {
    if (!FLOOR(y - 1) || (bay + Math.floor(y / 4)) % 3 !== 0) continue;
    if (y > cell.get(key(ix, iz)).r - 2) continue;
    g.set(ix, y, iz, "glowstone");
  }
}

// Roof plant: two 3x3 boxes of concrete with an iron grille on the crown, well apart.
const crown = (x, z) => [-1, 0, 1].every((dx) => [-1, 0, 1].every((dz) => {
  const c = cell.get(key(x + dx, z + dz)); return c && c.r === 40 && !faces(x + dx, z + dz).length;
}));
const boxes = [];
for (const [k] of cell) {
  const [x, z] = k.split(",").map(Number);
  if (!crown(x, z) || boxes.some(([bx, bz]) => Math.hypot(bx - x, bz - z) < 10)) continue;
  boxes.push([x, z]);
  if (boxes.length === 2) break;
}
for (const [bx, bz] of boxes) for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
  g.set(bx + dx, 40, bz + dz, "light_gray_concrete");
  g.set(bx + dx, 41, bz + dz, "light_gray_concrete");
  g.set(bx + dx, 42, bz + dz, "iron_bars", { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" });
}

// Every solid block must reach the ground through solid blocks (no hanging storeys, no floating glass).
const [X, Y, Z] = g.size, seen = new Uint8Array(X * Y * Z), q = [];
const idxOf = (x, y, z) => (z * Y + y) * X + x;
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) if (g.val(x, 0, z)) { seen[idxOf(x, 0, z)] = 1; q.push([x, 0, z]); }
while (q.length) {
  const [x, y, z] = q.pop();
  for (const [dx, dy, dz] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) {
    const nx = x + dx, ny = y + dy, nz = z + dz;
    if (!g.inBounds(nx, ny, nz) || seen[idxOf(nx, ny, nz)] || !g.val(nx, ny, nz)) continue;
    seen[idxOf(nx, ny, nz)] = 1; q.push([nx, ny, nz]);
  }
}
let floating = 0;
for (let z = 0; z < Z; z++) for (let y = 0; y < Y; y++) for (let x = 0; x < X; x++) if (g.val(x, y, z) && !seen[idxOf(x, y, z)]) floating++;
if (floating) console.warn(`${floating} solid blocks not connected to the ground`);

const out = g.save(`${DIR}/way_293020882.nbt`);
console.log(`way_293020882: ${out.blocks} blocks, ${out.palette} palette entries, door at ${door.x},${door.z}, crown boxes ${JSON.stringify(boxes)}`);
