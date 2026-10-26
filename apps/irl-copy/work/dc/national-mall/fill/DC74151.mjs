// 1601 Connecticut Ave NW: a 1920s red-brick commercial block with a limestone base, string courses and cornice.
// Massing: lidar roof heights snapped to three flat tiers (12 podium, 14 body, 15 core) plus a 2 m wing; a penthouse on the core.
// Interior cells are hollow (air, a floor slab per storey, a roof slab); shell cells are brick with glass, calcite piers and string courses.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC74151.cells.json", "utf8"));

// lidar roof heights -> flat tiers (noise at 13 joins the 12 podium)
const TIER = { 2: 2, 12: 12, 13: 12, 14: 14, 15: 15 };
const fp = new Map();
for (const [x, z, ground, roof] of cells) fp.set(`${x},${z}`, { ground, top: TIER[roof] ?? roof });
const inFp = (x, z) => fp.has(`${x},${z}`);
// faces: N = -z (the street front, z 0), S = +z, W = -x, E = +x
const FACES = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const exposed = (x, z) => Object.keys(FACES).filter(f => !inFp(x + FACES[f][0], z + FACES[f][1]));
const isShell = (x, z) => exposed(x, z).length > 0;
const FLOORS = [4, 7, 10, 13];           // storey string courses (the floor slab of each storey is interior)

const g = new Voxels([9, 27, 13]);
const set = (x, y, z, block, state) => g.set(x, y, z, block, state);
const door = (x, y, z, half, hinge) => set(x, y, z, "oak_door", { facing: "north", half, hinge, open: "false", powered: "false" });
const pane = (x, y, z, face) => set(x, y, z, "glass_pane", face === "N" || face === "S"
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });

for (const [key, { top: T }] of fp) {
  const [x, z] = key.split(",").map(Number);
  set(x, 0, z, "stone_bricks");                                      // plinth / foundation across the footprint
  const faces = exposed(x, z);
  if (!faces.length) {                                               // interior: air, a slab per storey, the roof slab
    for (const L of FLOORS) if (L < T - 1) set(x, L, z, "smooth_stone");
    set(x, T - 1, z, "smooth_stone");
    continue;
  }
  const corner = faces.some(f => f === "N" || f === "S") && faces.some(f => f === "W" || f === "E");
  const face = faces.includes("N") || faces.includes("S") ? faces.find(f => f === "N" || f === "S") : faces[0];
  const idx = face === "N" || face === "S" ? x : z;                 // bay index along the facade
  const pier = corner || idx % 3 === 0;
  const lightBehind = (y) => {                                       // a warm lamp in the room behind some glass
    const [dx, dz] = FACES[face], bx = x - dx, bz = z - dz;
    if (inFp(bx, bz) && !isShell(bx, bz) && (x * 3 + z * 5 + y) % 11 === 0) set(bx, y, bz, (y + x) % 2 ? "glowstone" : "shroomlight");
  };
  // the body of the shell: brick up to the cornice at T - 1
  for (let y = 1; y <= T - 2; y++) {
    let block = "bricks";
    if (y === 1) block = "stone_bricks";                             // base course / bulkhead
    else if (y >= 4 && (y - 4) % 3 === 0) block = "calcite";         // storey string course
    if (y === 1 || (y >= 4 && (y - 4) % 3 === 0)) set(x, y, z, block);  // base course and string courses run the whole face
    else if (pier) set(x, y, z, "calcite");                             // piers between bays
    else { pane(x, y, z, face); lightBehind(y); }                       // windows: shopfront (y 2-3) and upper storeys
  }
  set(x, T - 1, z, "calcite");                                          // cornice (a 2-tall wing has only this course)
}

// the street entrance: a pair of oak doors under a dark canopy, calcite pilasters either side (north face, z 0)
for (const x of [4, 7]) for (const y of [1, 2]) set(x, y, 0, "calcite");
door(5, 1, 0, "lower", "left"); door(5, 2, 0, "upper", "left");
door(6, 1, 0, "lower", "right"); door(6, 2, 0, "upper", "right");
for (const x of [4, 5, 6, 7]) set(x, 3, 0, "dark_oak_planks");

// roof: a penthouse on the 15 core (cells 4..5 x 2..3) sitting on its roof slab, and two chillers on the 12 podium
for (const [x, z] of [[4, 2], [5, 2], [4, 3], [5, 3]]) { set(x, 15, z, "smooth_quartz"); set(x, 16, z, "smooth_quartz"); set(x, 17, z, "stone"); }
set(4, 18, 2, "lantern", { hanging: "false", waterlogged: "false" });
for (const [x, z] of [[1, 3], [1, 4]]) set(x, 12, z, "iron_block");

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC74151.nbt");
console.log("DC74151 built:", g.count(), "blocks");
