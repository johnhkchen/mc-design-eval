import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// The Cairo: a 1894 Romanesque Revival apartment block in red brick with pale terracotta bands, a stone plinth and
// cornice, and a taller pavilion on its west side. Storeys are 2 blocks (a string course and a window row), the
// ground floor 3, and the lidar roof (19 to 22) is smoothed by a 3x3 median into the same tiers.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC56566.cells.json`, "utf8"));

const W = 15, D = 14, H = 34;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const raw = new Map();
for (const [x, z, ground, roof] of cells) raw.set(key(x, z), { ground, roof });
const inF = (x, z) => raw.has(key(x, z));

// ---- roof tiers: 3x3 median of the footprint's lidar roof heights ----
const roof = new Map();
for (const [k, c] of raw) {
  const [x, z] = k.split(",").map(Number);
  const vals = [];
  for (let dx = -1; dx <= 1; dx++)
    for (let dz = -1; dz <= 1; dz++) {
      const o = raw.get(key(x + dx, z + dz));
      if (o) vals.push(o.roof);
    }
  vals.sort((a, b) => a - b);
  roof.set(k, vals[Math.floor(vals.length / 2)]);
}
const R = (x, z) => roof.get(key(x, z));

// ---- geometry helpers ----
const DIRS = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };
const FACES = Object.keys(DIRS);
// solid building cell: on the footprint, above the plinth (y 0), below its own roof
const solid = (x, y, z) => inF(x, z) && y >= 1 && y < R(x, z);
const exposed = (x, y, z) => FACES.filter((f) => !solid(x + DIRS[f][0], y, z + DIRS[f][1]));

// storey rows: 1 = base course, 2 = ground windows, 3 = ground lintel, then from 4 a string course on every even row
// (also the floor slab) with a window row above it on every odd row, the cornice at roof-2, the parapet at roof-1
const slabRow = (y, r) => y === 1 || (y >= 4 && y <= r - 3 && (y - 4) % 2 === 0);

const GLASS = "glass_pane";
const BRICK = "bricks";
const PIER = "stone_bricks";
const BAND = "smooth_sandstone";
const FLOOR = "smooth_stone";
const PLINTH = "polished_granite";
const CORNICE = "stone_brick_stairs";

// ---- pass 1: plinth, floors, shell ----
const glazed = []; // { x, y, z, inner } for glowstone behind a few windows
for (const [k] of raw) {
  const [x, z] = k.split(",").map(Number);
  const r = R(x, z);
  g.set(x, 0, z, PLINTH);
  for (let y = 1; y < r; y++) {
    const faces = exposed(x, y, z);
    if (!faces.length) {
      // interior: a floor slab per storey and the roof deck, otherwise air
      if (y === r - 2 || slabRow(y, r)) g.set(x, y, z, FLOOR);
      continue;
    }
    const corner = faces.length > 1;
    const alongZ = faces.includes("north") || faces.includes("south");
    const p = alongZ ? x : z; // position along the wall, for the pier rhythm
    const pier = corner || p % 3 === 0;
    if (y === r - 1) { g.set(x, y, z, PIER); continue; }                    // parapet
    if (y === r - 2) {                                                       // cornice
      if (corner) g.set(x, y, z, PIER);
      else g.set(x, y, z, CORNICE, { facing: faces[0], half: "top", shape: "straight", waterlogged: "false" });
      continue;
    }
    if (y === 1) { g.set(x, y, z, PIER); continue; }                         // base course
    if (y === 3 || slabRow(y, r)) { g.set(x, y, z, BAND); continue; }        // lintel and string courses
    // window rows: y 2 and odd rows from 5
    if (pier) { g.set(x, y, z, corner ? PIER : BRICK); continue; }
    const along = alongZ
      ? { north: "false", south: "false", east: "true", west: "true" }
      : { north: "true", south: "true", east: "false", west: "false" };
    g.set(x, y, z, GLASS, { ...along, waterlogged: "false" });
    const [dx, dz] = DIRS[faces[0]];
    glazed.push({ x, y, z, ix: x - dx, iz: z - dz });
  }
}

// ---- entrance: a door set in the south face (z = 13), with stone surround ----
const doorState = (half) => ({ facing: "south", half, hinge: "left", open: "false", powered: "false" });
g.set(6, 1, 13, "oak_door", doorState("lower"));
g.set(6, 2, 13, "oak_door", doorState("upper"));
g.set(5, 2, 13, PIER);
g.set(7, 2, 13, PIER);

// ---- warm light behind some windows, in the air gap ----
let lamps = 0;
for (const { x, y, z, ix, iz } of glazed) {
  if (!solid(ix, y, iz) || exposed(ix, y, iz).length) continue; // the cell behind must be interior air
  if ((x * 3 + y * 5 + z) % 13 !== 0) continue;
  g.set(ix, y, iz, "glowstone");
  lamps++;
}

// ---- roof: chimney stacks on the tower, posts at its corners ----
const tower = [...raw.keys()].map((k) => k.split(",").map(Number)).filter(([x, z]) => R(x, z) === 22);
const towerInner = tower.filter(([x, z]) => exposed(x, 21, z).length === 0);
for (const [x, z] of towerInner.filter(([x, z]) => (x === 4 || x === 5) && z === 9)) {
  g.set(x, 21, z, BRICK);
  g.set(x, 22, z, BRICK);
}
for (const [x, z] of tower) {
  if (exposed(x, 21, z).length > 1) {
    g.set(x, 22, z, "stone_brick_wall", { up: "true", north: "none", south: "none", east: "none", west: "none", waterlogged: "false" });
  }
}

const out = `${DIR}/DC56566.nbt`;
const stats = g.save(out);
console.log(`DC56566: ${stats.blocks} blocks, ${stats.palette} palette entries, ${lamps} lamps -> ${out}`);
