import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Two-storey mid-century commercial block: stone plinth, white tiled piers,
// blue-glass window bays, a shopfront with a central door, a cornice,
// a parapet, and a rooftop mechanical plant. No record exists, so the era
// and materials are inferred from the lidar height (~11 blocks).

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541457999";
const W = 15, H = 23, D = 20;
const TOP = 11;          // parapet top level (about 11 above lowest ground)
const ROOF = 10;         // roof deck / cornice level
const FLOOR = 5;         // storey line between the two storeys
const DOOR_X = 7;        // entrance column on the north (z = 0) face

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const minG = Math.min(...raw.map((c) => c[2]));
const ground = new Map();
for (const [x, z, gr] of raw) ground.set(`${x},${z}`, gr - minG);

const gAt = (x, z) => ground.get(`${x},${z}`);
const inFoot = (x, z) => gAt(x, z) !== undefined;
const isCorner = (x, z) => (x === 0 || x === W - 1) && (z === 0 || z === D - 1);
const isPerim = (x, z) =>
  x === 0 || x === W - 1 || z === 0 || z === D - 1 ||
  !inFoot(x - 1, z) || !inFoot(x + 1, z) || !inFoot(x, z - 1) || !inFoot(x, z + 1);

// Position along the face a perimeter cell sits on, and the inward direction.
function faceInfo(x, z) {
  if (z === 0) return { t: x, dx: 0, dz: 1 };
  if (z === D - 1) return { t: x, dx: 0, dz: -1 };
  if (x === 0) return { t: z, dx: 1, dz: 0 };
  if (x === W - 1) return { t: z, dx: -1, dz: 0 };
  return { t: x + z, dx: 0, dz: 0 };
}

const g = new Voxels([W, H, D]);

function setIf(x, y, z, id, props) {
  const gr = gAt(x, z);
  if (gr === undefined || y <= gr || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Foundation: solid from y 0 up to each cell's ground.
for (const [x, z, gr] of [...ground].map(([k, v]) => [...k.split(",").map(Number), v])) {
  for (let y = 0; y <= gr; y++) g.set(x, y, z, "stone_bricks");
}

const perimCells = [];
const interiorCells = [];
for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);
  (isPerim(x, z) ? perimCells : interiorCells).push([x, z]);
}

// Interior: a floor slab at each storey line and the roof deck, air between.
for (const [x, z] of interiorCells) {
  const gr = gAt(x, z);
  for (const y of [FLOOR, ROOF]) {
    if (y > gr) setIf(x, y, z, "light_gray_concrete");
  }
}

// Perimeter: walls, bays, shopfront, cornice, parapet.
const lightSpots = [];
for (const [x, z] of perimCells) {
  const gr = gAt(x, z);
  const { t, dx, dz } = faceInfo(x, z);
  const pier = isCorner(x, z) || t % 3 === 0;
  const onNorth = z === 0;

  for (let y = gr + 1; y <= TOP; y++) {
    if (y === 1) { setIf(x, y, z, "stone_bricks"); continue; }          // plinth
    if (y === FLOOR) { setIf(x, y, z, "light_gray_concrete"); continue; } // storey line
    if (y === ROOF) { setIf(x, y, z, "smooth_stone"); continue; }        // cornice
    if (y === TOP) { setIf(x, y, z, isCorner(x, z) ? "light_gray_concrete" : "white_concrete"); continue; } // parapet

    if (y >= 2 && y <= 4) {                                              // ground storey
      if (y === 4) {                                                     // lintel band
        if (onNorth && (x === DOOR_X - 2 || x === DOOR_X + 2)) {
          setIf(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
        } else {
          setIf(x, y, z, "white_concrete");
        }
        continue;
      }
      if (onNorth && x === DOOR_X) {                                     // entrance door
        setIf(x, y, z, "dark_oak_door", {
          facing: "north", half: y === 2 ? "lower" : "upper",
          hinge: "left", open: "false", powered: "false",
        });
        continue;
      }
      setIf(x, y, z, pier ? "white_concrete" : "light_blue_stained_glass");
      continue;
    }

    if (y >= 6 && y <= 9) {                                              // upper storey
      if (y === 6 || y === 9) { setIf(x, y, z, "white_concrete"); continue; }
      setIf(x, y, z, pier ? "white_concrete" : "light_blue_stained_glass");
      if (!pier && y === 7 && t % 6 === 1 && !isCorner(x, z)) {
        lightSpots.push([x + dx, 7, z + dz]);
      }
    }
  }
}

// Warm light behind selected upper-storey windows.
for (const [x, y, z] of lightSpots) {
  if (inFoot(x, z) && !isPerim(x, z) && gAt(x, z) < y) {
    g.set(x, y, z, "glowstone");
  }
}

// Rooftop mechanical plant on the roof deck (interior cells only).
const roofBox = (x0, x1, z0, z1, y, id) => {
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    if (inFoot(x, z) && !isPerim(x, z) && y > gAt(x, z)) g.set(x, y, z, id);
  }
};
roofBox(3, 6, 4, 7, 11, "smooth_stone");        // main unit housing
roofBox(4, 5, 5, 6, 12, "light_gray_concrete"); // upper unit
roofBox(10, 11, 13, 14, 11, "iron_block");      // exhaust plant

g.save(`${DIR}/${ID}.nbt`);
