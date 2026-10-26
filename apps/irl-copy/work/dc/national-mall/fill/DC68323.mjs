// DC68323: 1233 20th St NW, a Commercial-Office-Large block (Dupont Circle / Foggy Bottom). Read from the lidar
// record: a 12-block stone podium (three storeys over a shopfront ground floor) under a 14-block tower that steps
// back to a 13 tier on the north-east, with a small stone lobby drum on the east edge and a mechanical penthouse
// on the tower. Materials are the DC office stock of its era: pale limestone-look calcite in storey bands, tinted
// glass, dark gravel roofs. Every column is solid from y 0 to its roof, so nothing hangs. Windows are tinted panes
// backed by a one-cell air gap (some lit by glowstone); the rest of the mass is solid core, and each storey's
// spandrel row is the floor slab.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC68323.cells.json`, "utf8"));
const X = 19, Y = 26, Z = 22;

// Footprint: each cell's ground g and T, its top solid row (roof above y 0 minus one). Lidar noise on the
// south-west corner (roofs 2 and 3 among 12s) is smoothed to the podium tier; the 4 on the east edge is the lobby.
const fp = new Map();
for (const [x, z, g, r] of cells) fp.set(`${x},${z}`, { g, T: (r === 2 || r === 3 ? 12 : r) - 1 });

const K = (x, y, z) => `${x},${y},${z}`;
const solid = (x, y, z) => { const c = fp.get(`${x},${z}`); return !!c && y >= 0 && y <= c.T; };
// open air a voxel can be reached through: anything above the ground that is not solid (the ground itself is not open)
const open = (x, y, z) => y >= 0 && !solid(x, y, z);
const DIRS = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
const HDIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// depth of every solid voxel from the outside: 1 = skin (touches air), 2 = one cell in, and so on
const depth = new Map();
let frontier = [];
for (const [k, { T }] of fp) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y <= T; y++) {
    if (DIRS.some(([dx, dy, dz]) => open(x + dx, y + dy, z + dz))) { depth.set(K(x, y, z), 1); frontier.push([x, y, z]); }
  }
}
while (frontier.length) {
  const next = [];
  for (const [x, y, z] of frontier) {
    const d = depth.get(K(x, y, z));
    for (const [dx, dy, dz] of DIRS) {
      const a = x + dx, b = y + dy, c = z + dz;
      if (solid(a, b, c) && !depth.has(K(a, b, c))) { depth.set(K(a, b, c), d + 1); next.push([a, b, c]); }
    }
  }
  frontier = next;
}
const D = (x, y, z) => depth.get(K(x, y, z)) ?? 0;

// storey bands by absolute height: plinth at the ground, shopfront to y 2, spandrel (floor line) at 3, 4, 7, 10, 13
const rowOf = (y, g) => (y === g ? "plinth" : y < 3 ? "shop" : y === 3 ? "spandrel" : (y - 4) % 3 === 0 ? "spandrel" : "win");
const sidesOf = (x, y, z) => HDIRS.filter(([dx, dz]) => open(x + dx, y, z + dz));

// pass 1: the air gap behind each glass cell (a window or shopfront that is not a pier), some lit
const gap = new Map();      // key of an air-gap cell -> "air" | "glowstone"
const glass = new Map();    // key of a facade glass cell -> { block, state }
for (const [k, { g, T }] of fp) {
  const [x, z] = k.split(",").map(Number);
  for (let y = g; y < T; y++) {
    if (D(x, y, z) !== 1) continue;
    const sides = sidesOf(x, y, z);
    if (sides.length !== 1) continue;
    const row = rowOf(y, g);
    if (row !== "win" && row !== "shop") continue;
    const [dx, dz] = sides[0];
    const c = dx ? z : x;
    if (c % 3 === 0) continue;                       // piers every third column
    const ix = x - dx, iz = z - dz;
    if (D(ix, y, iz) !== 2) continue;
    const lit = row === "win" && (x * 7 + y * 5 + z * 3) % 9 === 0;
    gap.set(K(ix, y, iz), lit ? "glowstone" : "air");
    glass.set(K(x, y, z), row === "shop"
      ? { block: "glass" }
      : { block: "light_blue_stained_glass_pane", state: dx ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
                                                         : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" } });
  }
}

const out = new Voxels([X, Y, Z]);
// pass 2: the mass
for (const [k, { g, T }] of fp) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y <= T; y++) {
    const key = K(x, y, z);
    if (gap.get(key) === "air") continue;
    if (gap.get(key) === "glowstone") { out.set(x, y, z, "glowstone"); continue; }
    if (y < g) { out.set(x, y, z, "stone"); continue; }                         // foundation under the sloping ground
    if (y === T) {                                                              // roof: cornice at the edge, dark gravel inside
      out.set(x, y, z, sidesOf(x, y, z).length ? "smooth_quartz" : "gray_concrete");
      continue;
    }
    const d = D(x, y, z);
    if (d !== 1) { out.set(x, y, z, "stone"); continue; }                       // solid core and floor slabs
    const sides = sidesOf(x, y, z), row = rowOf(y, g);
    if (sides.length >= 2) { out.set(x, y, z, row === "plinth" ? "polished_granite" : "smooth_quartz"); continue; }   // corner pilasters
    if (row === "plinth") { out.set(x, y, z, "polished_granite"); continue; }
    if (row === "spandrel") { out.set(x, y, z, "smooth_quartz"); continue; }
    const gl = glass.get(key);
    if (gl) { out.set(x, y, z, gl.block, gl.state); continue; }
    const [dx] = sides[0] ?? [0];
    const c = dx ? z : x;
    out.set(x, y, z, c % 3 === 0 && row === "shop" ? "smooth_quartz" : "calcite");
  }
}

// entrance on the south (lowest) side: a double door between shopfront glass, a dark lintel, two hanging lanterns
for (const x of [8, 9]) {
  for (let y = 0; y <= 1; y++) out.set(x, y, 20, "air");                            // the lobby behind the doors
  out.set(x, 0, 21, "dark_oak_door", { facing: "south", half: "lower", hinge: x === 8 ? "left" : "right", open: "false", powered: "false" });
  out.set(x, 1, 21, "dark_oak_door", { facing: "south", half: "upper", hinge: x === 8 ? "left" : "right", open: "false", powered: "false" });
  out.set(x, 2, 21, "lantern", { hanging: "true", waterlogged: "false" });
}
for (let x = 7; x <= 10; x++) out.set(x, 3, 21, "dark_oak_slab", { type: "top", waterlogged: "false" });

// tower penthouse on the 14 core (x 5-8, z 10-13), HVAC plant on the podium roof, lanterns on the penthouse corners
for (let x = 5; x <= 8; x++) for (let z = 10; z <= 13; z++) for (let y = 14; y <= 16; y++)
  out.set(x, y, z, y === 16 ? "smooth_quartz" : "calcite");
for (const [x, z] of [[5, 10], [8, 10], [5, 13], [8, 13]]) out.set(x, 17, z, "lantern", { hanging: "false", waterlogged: "false" });
for (const x0 of [3, 12]) for (let x = x0; x < x0 + 2; x++) for (let z = 18; z <= 19; z++) for (let y = 12; y <= 13; y++)
  out.set(x, y, z, "smooth_stone");

// check: every block above the ground has something under it (or is a door, lantern or slab on a block)
const floatingAt = [];
for (let z = 0; z < Z; z++) for (let y = 1; y < Y; y++) for (let x = 0; x < X; x++) {
  const here = out.get(x, y, z);
  // a block with air under it is fine only if a neighbour holds it (a floor slab over a gap, a canopy on a wall)
  const held = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => out.get(x + dx, y, z + dz));
  if (here && !out.get(x, y - 1, z) && !held && !["lantern", "dark_oak_door", "dark_oak_slab"].some((b) => here.block.endsWith(b))) floatingAt.push([x, y, z, here.block]);
}
const floating = floatingAt.length;
if (floating) console.log(JSON.stringify(floatingAt.slice(0, 20)));

const stats = out.save(`${DIR}/DC68323.nbt`);
console.log(JSON.stringify({ size: [X, Y, Z], ...stats, floating, airGap: gap.size, glass: glass.size }));
