// SEA1270134471: Pacific Science Center campus annex (low exhibit/lab/shop wing).
// Box [150,195,166,207] size [17,13]; footprint from space-needle/manifest.json (146 cells, stepped diagonal).
// Local (0,0) = box corner. Facade = south (+z) face, which carries the most exposed run.
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";
import { readFileSync } from "node:fs";

const ID = "SEA1270134471";
const BOX = [150, 195, 166, 207];
const W = BOX[2] - BOX[0] + 1; // 17
const D = BOX[3] - BOX[1] + 1; // 13
const H = 8;                   // heightBlocks
const manifest = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/out/seattle/space-needle/manifest.json", "utf8"));
const bld = manifest.buildings.find((b) => b.id === ID);
const F = new Set(bld.footprint.map(([x, z]) => `${x - BOX[0]},${z - BOX[1]}`));
const inF = (x, z) => F.has(`${x},${z}`);
const cells = [...F].map((k) => k.split(",").map(Number));

const g = new Voxels([W, H + 6, D]);
const DIRS = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] };

// exterior wall cells and their outward faces
const walls = new Map(); // key -> Set of outward dirs
for (const [x, z] of cells) {
  const out = Object.keys(DIRS).filter((d) => !inF(x + DIRS[d][0], z + DIRS[d][1]));
  if (out.length) walls.set(`${x},${z}`, new Set(out));
}

// per-cell along-facade index for the south face (for piers / door placement)
const southRow = cells.filter(([x, z]) => walls.get(`${x},${z}`)?.has("S")).map(([x]) => x).sort((a, b) => a - b);
const sMin = southRow[0], sMax = southRow[southRow.length - 1];
// the south face is stepped; door bay centred on the widest south run
const doorCentre = Math.round((sMin + sMax) / 2);
const doorX = [doorCentre - 1, doorCentre]; // double door, 2 cells wide, at the south wall
// the south-face cells in the door bay
const doorBay = new Set(doorX.map((x) => x));

const BASE = "stone_bricks", WALL = "white_concrete", TRIM = "smooth_quartz", CORNICE = "light_blue_concrete";

// 1. foundation: solid under whole footprint, y 0-1
for (const [x, z] of cells) {
  g.set(x, 0, z, BASE);
  g.set(x, 1, z, BASE);
}

// 2. walls y 2-6, cornice y 7; roof cap y 8 over the whole footprint
for (const [key, dirs] of walls) {
  const [x, z] = key.split(",").map(Number);
  const isSouth = dirs.has("S");
  for (let y = 2; y <= 6; y++) {
    let m = WALL;
    if (y === 2 || y === 6) m = TRIM; // thin trim bands above base and below cornice
    if (isSouth) {
      // glazed front: glass in the bays between white piers, every 3rd cell a pier
      const pier = ((x - sMin) % 3) === 0 || x === sMax;
      if (y >= 3 && y <= 5) {
        m = pier ? WALL : "glass";
        if (doorBay.has(x)) m = null; // doors handled below
      }
    } else {
      // side walls: piers every 4 cells, a window band at y 3-4 on alternate runs
      if (y >= 3 && y <= 4 && (x + z) % 4 === 1) m = "glass";
      else if (((x + z) % 4 === 0) && y >= 2 && y <= 6) m = TRIM;
    }
    if (m) g.set(x, y, z, m);
  }
  g.set(x, 1, z, BASE);
  g.set(x, 7, z, CORNICE);
}

// 3. roof: smooth_quartz cap over the footprint at y 8
for (const [x, z] of cells) g.set(x, 8, z, TRIM);

// 4. south entrance: double iron doors in the centre bay, y 2-3, then a deep flat canopy at y 5
const southZ = Math.max(...cells.filter(([x]) => doorX.includes(x)).map(([, z]) => z));
for (const x of doorX) {
  const facing = "south";
  const hinge = x === doorX[0] ? "left" : "right";
  g.set(x, 2, southZ, "iron_door", { facing, half: "lower", hinge, open: "false", powered: "false" });
  g.set(x, 3, southZ, "iron_door", { facing, half: "upper", hinge, open: "false", powered: "false" });
  g.set(x, 1, southZ, BASE);
}
// canopy: deep, two cells over the entrance bay, carried by quartz jambs at the door edges
for (const x of [doorX[0] - 2, doorX[0] - 1, doorX[0], doorX[1], doorX[1] + 1, doorX[1] + 2]) {
  for (const dz of [0, -1]) {
    const z = southZ + dz;
    if (!inF(x, z)) continue;
    g.set(x, 5, z, TRIM);
    g.set(x, 6, z, CORNICE);
  }
}
// jambs: white piers under the canopy edges (y 2-4)
for (const x of [doorX[0] - 1, doorX[1] + 1]) {
  if (!inF(x, southZ)) continue;
  for (let y = 2; y <= 4; y++) g.set(x, y, southZ, WALL);
}
// lighter ceiling under the canopy so it reads as a soffit
for (const x of doorX) if (inF(x, southZ - 1)) g.set(x, 4, southZ - 1, TRIM);

// 5. roof equipment: skylights (glass with light-blue curb) and HVAC/vent boxes at y 9
const interior = cells.filter(([x, z]) => !walls.has(`${x},${z}`) && !doorBay.has(x) && z < southZ - 1);
const pick = (i) => interior[Math.floor(i * interior.length)];
const skylightAt = [pick(0.2), pick(0.55), pick(0.8)];
for (const [x, z] of skylightAt) {
  g.set(x, 8, z, "glass");
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    if (inF(x + dx, z + dz)) g.set(x + dx, 8, z + dz, CORNICE);
  }
}
const ventAt = [pick(0.36), pick(0.7)];
for (const [x, z] of ventAt) {
  g.set(x, 9, z, "light_gray_concrete");
  g.set(x, 10, z, "iron_trapdoor", { facing: "north", half: "top", open: "false", powered: "false", waterlogged: "false" });
}

// 6. stone base course: a stone band on the exterior wall at y 1 already set; add a stone slab course outside-facing at y 2 on the south face
// (kept inside the footprint: no paving outside it)

g.save(`/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/seattle-fill/${ID}.nbt`);
console.log("saved", ID, "size", [W, H + 6, D], "footprint", F.size, "walls", walls.size, "skylights", skylightAt.length, "vents", ventAt.length, "doorX", doorX, "southZ", southZ);
