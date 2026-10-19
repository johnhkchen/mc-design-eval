// 109 West 45 Street, the Saint James Hotel, 1900: a Renaissance Revival hotel in the Midtown manner, 14 storeys
// (lidar roof 43 blocks over the front, 40 over a rear wing one storey down). A granite and stone base (lobby on the
// street, the entrance a double dark-oak door flanked by a lantern and a granite pier), a brick shaft with a calcite
// storey band every third row and granite piers every third column, a calcite cornice and a stone parapet on the lidar
// 45 edge. The side walls are blank brick (party walls on a Midtown lot). Lidar 45 cells become penthouse bulkheads
// (the one over the rear wing is a water tower on a plinth). The mass is hollow above grade: an air gap behind every
// pane and a floor slab per storey, nothing hanging in the air. Warm glowstone sits behind some panes on the first row
// of each storey, where the floor below holds it.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1022641.cells.json`, "utf8"));
const X = 18, Y = 56, Z = 24;

const cell = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inFoot = (x, z) => cell.has(`${x},${z}`);
const groundAt = (x, z) => cell.get(`${x},${z}`).ground;

// Roof tiers (block heights above y 0), smoothed from the lidar into flat tiers: the front body at 43 (lidar 43), a rear
// wing at 40 one storey down (lidar 40-41), and 45 bulkheads where the lidar reads 44-45 (a penthouse over the rear wing
// and two stair or lift towers on the body).
const roofAt = (x, z) => {
  if (!inFoot(x, z)) return 0;
  if ((x >= 10 && x <= 13 && z >= 16 && z <= 19) || (x >= 11 && x <= 13 && z >= 9 && z <= 10) || (x >= 6 && x <= 9 && z >= 12 && z <= 13)) return 45;
  if (z <= 14 || (z === 15 && x >= 6)) return 43;
  return 40;
};

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };   // N = low z = the 45th Street frontage; W/E = party walls
// A cell is open on a side when it is outside the footprint or its roof is at or below the height in question.
const open = (x, y, z) => !inFoot(x, z) || roofAt(x, z) <= y;
const faceOf = (x, y, z) => {
  for (const d of ["N", "S", "W", "E"]) { const [dx, dz] = DIRS[d]; if (open(x + dx, y, z + dz)) return d; }
  return null;
};
const onPerimeter = (x, z, top) => [[0, -1], [0, 1], [-1, 0], [1, 0]].some(([dx, dz]) => !inFoot(x + dx, z + dz) || roofAt(x + dx, z + dz) < top);

const NS = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };   // pane on a face along x
const EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };   // pane on a face along z
const lit = (u, y, k) => (u * 5 + y * 7 + k * 3) % 11 === 0 && y % 3 === 1;                       // sparse, first row of a storey

const cols = [...cell.keys()].map((k) => k.split(",").map(Number));
const g = new Voxels([X, Y, Z]);
const lights = [];

// 1. Shell, one column at a time: a stone foundation to each cell's ground, a base course at y 0, the facade on every
// exposed face, a calcite cap on the roof's edge, floor slabs at each storey line, and air behind the glass.
for (const [x, z] of cols) {
  const ground = groundAt(x, z), top = roofAt(x, z);
  for (let y = 0; y < top; y++) {
    if (y < ground) { g.set(x, y, z, "stone_bricks"); continue; }                  // foundation under the slope
    const d = faceOf(x, y, z);
    if (y === 0) { g.set(x, y, z, "stone_bricks"); continue; }                     // base course
    if (y === top - 1) { g.set(x, y, z, d ? "calcite" : "smooth_stone"); continue; }   // roof cap / cornice
    if (!d) { if (y % 3 === 0) g.set(x, y, z, "stone_bricks"); continue; }         // floor slab, or air behind the glass
    if (y % 3 === 0) { g.set(x, y, z, "calcite"); continue; }                     // storey band
    const u = d === "N" || d === "S" ? x : z;                                      // position along the face
    const pier = u % 3 === 0;
    if (d === "N" && z === 0 && (x === 8 || x === 9) && (y === 1 || y === 2)) {  // the double entrance
      g.set(x, y, z, "dark_oak_door", { facing: "south", half: y === 1 ? "lower" : "upper", hinge: x === 8 ? "left" : "right", open: "false", powered: "false" });
      continue;
    }
    if (d === "N" && z === 0 && (x === 7 || x === 10) && (y === 1 || y === 2)) {  // the entrance surround: granite posts, a lantern at the foot
      if (x === 7 && y === 1) g.set(x, y, z, "lantern", { hanging: "false", waterlogged: "false" });
      else g.set(x, y, z, "polished_granite");
      continue;
    }
    if (d === "W" || d === "E") { g.set(x, y, z, "bricks"); continue; }            // party wall: blank brick
    if (pier) { g.set(x, y, z, y < 6 ? "polished_granite" : "bricks"); continue; }
    g.set(x, y, z, "glass_pane", d === "N" ? NS : d === "S" ? NS : EW);
    const k = d === "N" ? 0 : 1, [dx, dz] = DIRS[d];
    if (lit(u, y, k) && inFoot(x - dx, z - dz) === true) lights.push([x - dx, y, z - dz]);   // the room behind, one block in
  }
}

// 2. The parapet: the lidar's 45 edge on the 43 body, a stone course and a calcite cap on the perimeter.
for (const [x, z] of cols) {
  if (roofAt(x, z) !== 43 || !onPerimeter(x, z, 43)) continue;
  g.set(x, 43, z, "stone_bricks");
  g.set(x, 44, z, "calcite");
}

// 3. Warm light behind the glass (only on the first row of a storey, where the slab below holds it).
for (const [x, y, z] of lights) g.set(x, y, z, "glowstone");

// 4. Roof plant: a water tower on a stone plinth on the rear wing's roof, a 3 x 3 tank with a slab cap.
for (let x = 14; x <= 16; x++) for (let z = 20; z <= 22; z++) {
  g.set(x, 40, z, "stone_bricks"); g.set(x, 41, z, "stone_bricks");
  for (let y = 42; y <= 44; y++) g.set(x, y, z, "oak_planks");
  g.set(x, 45, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
}

// 5. Nothing hangs: every block above ground has a block under it (glass, glow, door and lantern stand on the shell).
let floating = 0;
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) for (let y = 1; y < Y; y++) {
  if (!g.get(x, y, z) || g.get(x, y - 1, z)) continue;
  floating++;
}
if (floating) console.warn(`${floating} blocks with nothing under them`);

const { blocks, palette } = g.save(`${DIR}/NYC1022641.nbt`);
console.log(`NYC1022641.nbt: ${blocks} blocks, ${palette} palette entries, ${g.size.join(" x ")}`);
