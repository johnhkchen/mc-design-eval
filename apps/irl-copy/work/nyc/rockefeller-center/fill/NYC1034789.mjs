// 39 West 54th Street: a 1920 commercial & office block, seven storeys of brick on a stone-banded
// 3-block storey rhythm, a south-facing street front with a shopfront and entrance, a 3-storey north wing,
// a lower south wing on the uphill ground, and a setback tower on the west side with a penthouse.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const HERE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${HERE}/NYC1034789.cells.json`, "utf8"));   // [x, z, ground, roof]

const WALL = "bricks", STONE = "smooth_stone", BASE = "polished_andesite", CAP = "stone_bricks";
const GLASS = "glass_pane", FLOOR = "oak_planks", LIGHT = "glowstone", CHIMNEY = "bricks";

// Lidar roof -> clean tiers, storeys of 3 blocks: north wing 10 (3 storeys), body 21 (7), south wing 18 (6),
// tower 24 on the west side (8). Roof 0 is the lidar's no-building notch on the east side.
function tierTop(x, z, r) {
  if (r === 0) return 0;
  if (z >= 19 && x >= 1) return 18;                  // south wing, lidar 17 on the higher ground
  if (r <= 11) return 10;                            // north wing, lidar 10-11
  if (x <= 1 && z >= 9 && z <= 18) return 24;        // setback tower, lidar 22-23 on its west edge
  return 21;                                         // main body, lidar 19-23
}

const col = new Map();                               // "x,z" -> { g, t }
for (const [x, z, g, r] of cells) col.set(`${x},${z}`, { g, t: tierTop(x, z, r) });
const top = (x, z) => col.get(`${x},${z}`)?.t ?? 0;  // 0 where the footprint has no building
const gnd = (x, z) => col.get(`${x},${z}`)?.g ?? 0;

// A face is exposed at height y when the neighbour beside it has no block there (missing, or lower than y).
function faces(x, z, y) {
  return {
    n: top(x, z - 1) <= y, s: top(x, z + 1) <= y,
    w: top(x - 1, z) <= y, e: top(x + 1, z) <= y,
  };
}
const exposed = (f) => f.n || f.s || f.w || f.e;

const v = new Voxels([6, 35, 21]);

for (const [key, { g, t }] of col) {
  const [x, z] = key.split(",").map(Number);
  const gr = gnd(x, z);
  for (let y = 0; y < t; y++) {
    if (y < gr) { v.set(x, y, z, BASE); continue; }          // foundation up to this cell's ground
    if (y === t - 1) { v.set(x, y, z, CAP); continue; }      // roof / parapet course
    const f = faces(x, z, y);
    if (!exposed(f)) { if (y % 3 === 0) v.set(x, y, z, FLOOR); continue; }   // interior: floor slab per storey, air between
    if (y === 0) { v.set(x, y, z, BASE); continue; }         // base course
    if (y % 3 === 0) { v.set(x, y, z, STONE); continue; }    // storey band
    // Facade grid: street and north/south faces take a pier at each end (x 0 and 5); east/west faces take a
    // pier every third block along z. Corners take the pier. Everything else is glass with air behind.
    const pier = ((f.n || f.s) && (x === 0 || x === 5)) || ((f.w || f.e) && z % 3 === 0);
    v.set(x, y, z, pier ? WALL : GLASS);
  }
}

// Warm light behind some glass: a glowstone on the floor just inside the window, on the storey's first row.
for (const [key, { t }] of col) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 1; y < t - 1; y++) {
    if (y % 3 !== 1) continue;
    const f = faces(x, z, y);
    if (!exposed(f) || !((x * 5 + z * 3 + y) % 4 === 0)) continue;
    const ix = f.w ? x + 1 : f.e ? x - 1 : x;
    const iz = f.n ? z + 1 : f.s ? z - 1 : z;
    if (ix === x && iz === z) continue;
    if (exposed(faces(ix, iz, y)) || top(ix, iz) <= y) continue;
    v.set(ix, y, iz, LIGHT);
  }
}

// Street entrance on the south face (uphill side): a door in the second block of the shopfront.
v.set(2, 1, 20, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: false, powered: false });
v.set(2, 2, 20, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: false, powered: false });
v.set(2, 3, 20, "chiseled_stone_bricks");                  // keystone over the door

// Roof equipment: two brick chimneys on the body, and a penthouse on the tower's roof.
v.set(2, 21, 4, CHIMNEY); v.set(2, 22, 4, CHIMNEY); v.set(2, 23, 4, STONE);
v.set(4, 21, 15, CHIMNEY); v.set(4, 22, 15, CHIMNEY); v.set(4, 23, 15, STONE);
for (const x of [0, 1]) for (const z of [12, 13]) {
  v.set(x, 24, z, WALL); v.set(x, 25, z, WALL); v.set(x, 26, z, CAP);
}

const out = `${HERE}/NYC1034789.nbt`;
const { blocks, palette } = v.save(out);
console.log(`wrote ${out}: ${blocks} blocks, palette ${palette}`);
