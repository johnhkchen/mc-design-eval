// A four-storey interwar brick-and-plaster block (1920s-30s) on Mt Eden's volcanic slope: a basalt base course and
// plinth, cream plaster walls, quartz pilasters between 2-wide glass bays, string courses at every 4-block storey,
// a basalt cornice and parapet, shopfronts and a door on the ground floor, lit windows, and a plant room on the roof.
// Lidar roofs are smoothed into three tiers (16 for the main block, 12 for a stepped bay, 5 for the low wings).
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_1227709058.cells.json`, "utf8"));   // [x, z, ground, roof] per footprint cell
const W = 34, D = 42, H = 29;
const g = new Voxels([W, H, D]);

const fp = new Map();                                       // z * W + x -> { ground, roof }
for (const [x, z, ground, roof] of cells) fp.set(z * W + x, { ground, roof });
const inFP = (x, z) => x >= 0 && z >= 0 && x < W && z < D && fp.has(z * W + x);

// lidar roof -> a flat tier: the main block (roof 14-16) to 16, the 8-13 bay to 12, the one-storey wings to 5
const tierOf = (r) => (r >= 14 ? 16 : r >= 8 ? 12 : 5);
const DIRS = { W: [-1, 0], E: [1, 0], N: [0, -1], S: [0, 1] };
const outward = (x, z) => Object.keys(DIRS).filter((k) => !inFP(x + DIRS[k][0], z + DIRS[k][1]));
const deep = (x, z) => [-1, 0, 1].every((dx) => [-1, 0, 1].every((dz) => inFP(x + dx, z + dz)));

// the entrance: the west face cell nearest the middle of the tall block, on a full-height run
let door = null;
for (const [x, z, , r] of cells) {
  const o = outward(x, z);
  if (o.length !== 1 || o[0] !== "W" || tierOf(r) !== 16) continue;
  if (!door || Math.abs(z - 21) < Math.abs(door.z - 21)) door = { x, z };
}
if (!door) throw new Error("no west entrance cell");

const paneState = (o) => (o.includes("N") || o.includes("S")
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });

const pockets = [];                                         // [x, y, z, lit]: the air behind each glass bay
const doorCells = [];

for (const [x, z, ground, roof] of cells) {
  const T = tierOf(roof), o = outward(x, z), facade = o.length > 0, corner = o.length >= 2;
  const along = o.includes("W") || o.includes("E") ? z : x;   // position along the wall
  for (let y = 0; y <= T; y++) {
    let blk = "smooth_quartz", st;
    if (y === T) { if (!facade) continue; }                               // parapet cap on the outline only
    else if (y === T - 1) blk = facade ? "polished_andesite" : "light_gray_concrete";   // cornice / roof membrane
    else if (y === 0) blk = "polished_andesite";                          // base course and foundation
    else if (facade) {
      const b = 4 * Math.floor(y / 4), rr = y - b;
      if (rr === 0) { blk = "stone_brick_slab"; st = { type: "bottom" }; }      // string course
      else if (rr === 3) blk = b === 0 ? "stone_bricks" : "smooth_quartz";     // spandrel, ground-floor fascia
      else if (corner || along % 3 === 0) { blk = "quartz_pillar"; st = { axis: "y" }; }   // pilasters
      else {
        blk = "light_blue_stained_glass_pane"; st = paneState(o);
        const [dx, dz] = DIRS[o[0]];
        pockets.push([x - dx, y, z - dz, ((x * 7 + y * 13 + z * 31) % 6) === 0, x, z, o[0]]);
      }
    }
    g.set(x, y, z, blk, st);
  }
  if (roof >= 14 && door && x === door.x && z === door.z) doorCells.push([x, z]);
}

// the air gap behind each glass bay (or a glowstone lamp in some), then the door and its vestibule
for (const [ix, y, iz, lit] of pockets) {
  if (!inFP(ix, iz)) continue;
  g.set(ix, y, iz, lit ? "glowstone" : "air");
}
for (const [x, z] of doorCells) {
  g.set(x, 1, z, "oak_door", { facing: "west", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(x, 2, z, "oak_door", { facing: "west", half: "upper", hinge: "left", open: "false", powered: "false" });
  for (const y of [1, 2]) g.set(x + 1, y, z, "air");
  g.set(x + 1, 0, z, "polished_andesite");
}
// the vestibule's door opens onto the air behind the glass line: the lintel course stays solid above it

// the roof plant room: a set-in block on the main tier, all of it on the footprint and clear of the outline
const PR = { x0: 12, x1: 19, z0: 16, z1: 23 };
for (let z = PR.z0; z <= PR.z1; z++) for (let x = PR.x0; x <= PR.x1; x++) {
  if (!deep(x, z)) throw new Error(`plant room cell ${x},${z} is not clear of the outline`);
  for (let y = 16; y <= 19; y++) g.set(x, y, z, "smooth_quartz");
  g.set(x, 20, z, "light_gray_concrete");
}
// plant-room louvres on its south face: glass with an air gap behind, in two bays
for (let x = PR.x0 + 2; x <= PR.x1 - 2; x += 3) for (const y of [17, 18]) {
  g.set(x, y, PR.z1, "light_blue_stained_glass_pane", paneState(["S"])); g.set(x, y, PR.z1 - 1, "air");
}

// roof units: 2 x 1 x 2 boxes on the main roof, clear of the plant room and the outline
for (const [x0, z0] of [[24, 29], [28, 29], [24, 33], [9, 30]]) {
  if (!deep(x0, z0) || !deep(x0 + 1, z0 + 1)) continue;
  for (let dz = 0; dz < 2; dz++) for (let dx = 0; dx < 2; dx++) g.set(x0 + dx, 16, z0 + dz, "smooth_stone");
}

const out = g.save(`${DIR}/way_1227709058.nbt`);
console.log(`way_1227709058: ${out.blocks} blocks, palette ${out.palette}`);
