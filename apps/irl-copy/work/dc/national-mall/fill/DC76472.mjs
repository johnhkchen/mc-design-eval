// 1515 14th St NW: a brick multi-storey warehouse with a stone base and cornice, a shopfront at street level on the
// front (z = 0) face, and a four-storey tower on the body's north-west part. Roof heights come from lidar, smoothed
// into four flat tiers (12 tower, 10 body, 8 wing, 2 corner shop). Shell only: exterior walls, a floor slab per storey,
// a roof deck; the inside is air. Storeys are 3 blocks: a stone course at the base of each, two rows of windows, and a
// cornice on each tier's top row.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC76472.cells.json`, "utf8"));

const X = 13, Z = 15, Y = 24;
const fp = new Map();
for (const [x, z, ground, roof] of cells) fp.set(`${x},${z}`, { ground, raw: roof });

// lidar roof -> flat tiers
const tier = (raw) => (raw >= 11 ? 12 : raw >= 9 ? 10 : raw >= 5 ? 8 : 2);
const inFP = (x, z) => fp.has(`${x},${z}`);
const H = (x, z) => (inFP(x, z) ? tier(fp.get(`${x},${z}`).raw) : 0);
const GROUND = (x, z) => fp.get(`${x},${z}`).ground;

// a face is exposed at height y when the neighbour on that side is lower than y (or outside the footprint)
const exposed = (x, z, y) => ({ px: H(x - 1, z) <= y || H(x + 1, z) <= y, pz: H(x, z - 1) <= y || H(x, z + 1) <= y });
const isFacade = (x, z, y) => { const e = exposed(x, z, y); return e.px || e.pz; };

const DOOR = [5, 0];                                 // entrance on the z = 0 (street) face
const isDoor = (x, z) => x === DOOR[0] && z === DOOR[1];

const g = new Voxels([X, Y, Z]);

for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  if (!inFP(x, z)) continue;
  const h = H(x, z), ground = GROUND(x, z);
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone_bricks");        // foundation up to lidar ground
  for (let y = ground; y < h; y++) {
    const e = exposed(x, z, y), face = e.px || e.pz;
    if (y === h - 1) { g.set(x, y, z, face ? "stone_bricks" : "gravel"); continue; }   // cornice / roof deck
    if (!face) { if (y % 3 === 0) g.set(x, y, z, "smooth_stone"); continue; }                  // floor slab, else air
    if (isDoor(x, z) && y === 0) { g.set(x, y, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" }); continue; }
    if (isDoor(x, z) && y === 1) { g.set(x, y, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" }); continue; }
    if (isDoor(x, z) && y === 2) { g.set(x, y, z, "stone_bricks"); continue; }                  // door lintel
    if (y === 0 || y % 3 === 0) { g.set(x, y, z, "stone_bricks"); continue; }                  // base and storey courses
    const glass = (x + z) % 3 !== 0 && !(e.px && e.pz);                                        // 2 glass, 1 pier
    if (!glass) { g.set(x, y, z, "bricks"); continue; }
    if (e.pz) g.set(x, y, z, "glass_pane", { east: "true", west: "true", north: "false", south: "false" });
    else g.set(x, y, z, "glass_pane", { east: "false", west: "false", north: "true", south: "true" });
  }
}

// warm light: glowstone on the inside of some windows, one per window pair in the first window row of each storey
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  if (!inFP(x, z)) continue;
  for (const y of [4, 7, 10]) {
    if (y >= H(x, z) - 1 || !isFacade(x, z, y)) continue;
    if ((x * 7 + z * 11 + y) % 9 !== 0) continue;
    const e = exposed(x, z, y);
    if (e.px && e.pz) continue;
    const dx = e.px ? (H(x - 1, z) <= y ? 1 : -1) : 0, dz = e.pz ? (H(x, z - 1) <= y ? 1 : -1) : 0;
    const nx = x + dx, nz = z + dz;
    if (!inFP(nx, nz) || isFacade(nx, nz, y) || y >= H(nx, nz) - 1) continue;
    g.set(nx, y, nz, "glowstone");
  }
}

// entrance lantern inside the lobby, on the slab
g.set(DOOR[0], 1, DOOR[1] + 1, "lantern", { hanging: "false" });

// roof plant on the tower: two small units standing on the roof deck
g.set(6, 12, 4, "stone_bricks"); g.set(6, 13, 4, "stone_bricks");
g.set(7, 12, 2, "stone_brick_slab", { type: "bottom", waterlogged: "false" });

const out = g.save(`${DIR}/DC76472.nbt`);
console.log(JSON.stringify(out));
