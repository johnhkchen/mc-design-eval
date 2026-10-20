import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1016280224";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Footprint 23 x 21; roof about 21 blocks above lowest ground.
// Era: late-20th-century Taipei commercial/office mid-rise (4 storeys of 5 blocks),
// white concrete piers with glass bays, grey granite base, quartz cornice, flat roof with plant.
const W = 23, H = 33, D = 21;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gy] of cells) ground.set(`${x},${z}`, gy);
const has = (x, z) => ground.has(`${x},${z}`);
const gy = (x, z) => ground.get(`${x},${z}`);

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Outward faces of a perimeter cell (a missing neighbour means that face is exposed).
function faces(x, z) {
  const f = [];
  if (!has(x, z - 1)) f.push("north");
  if (!has(x, z + 1)) f.push("south");
  if (!has(x - 1, z)) f.push("west");
  if (!has(x + 1, z)) f.push("east");
  return f;
}
const isPerimeter = (x, z) => faces(x, z).length > 0;

// Entrance: double door on the north (z = 0) face, centred.
const DOOR_X = [10, 11];
const isDoor = (x, z, k) => k === 0 && z === 0 && DOOR_X.includes(x) && has(x, z);

for (const [x, z, b] of cells) {
  const fc = faces(x, z);
  const perim = fc.length > 0;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < b; y++) put(x, y, z, "stone_bricks");

  if (!perim) {
    // Interior: floor slabs per storey and roof deck; air between, no interiors.
    for (let k = 0; k <= 4; k++) put(x, b + 5 * k, z, "smooth_stone");
  } else {
    // Base course at ground level.
    put(x, b, z, "polished_andesite");

    // Storey bands (spandrels) and window/pier zones, 4 storeys.
    for (let k = 0; k < 4; k++) {
      const base = b + 5 * k;
      if (k > 0) put(x, base, z, "light_gray_concrete");
      for (let dy = 1; dy <= 4; dy++) {
        const y = base + dy;
        const yy = y;
        if (isDoor(x, z, k) && dy <= 2) {
          // Door handled below.
          continue;
        }
        // Piers at corners and every third bay; glass otherwise.
        let idx = fc.includes("north") || fc.includes("south") ? x : z;
        const corner = fc.length > 1;
        const pier = corner || idx % 3 === 0;
        put(x, yy, z, pier ? "white_concrete" : "light_blue_stained_glass");
      }
    }

    // Roof cornice band and parapet.
    put(x, b + 20, z, "quartz_block");
    put(x, b + 21, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }

  // Doors on the north face (ground storey).
  if (z === 0 && DOOR_X.includes(x) && has(x, z)) {
    const hinge = x === 10 ? "left" : "right";
    put(x, b + 1, z, "oak_door", { facing: "north", half: "lower", hinge, open: "false", powered: "false" });
    put(x, b + 2, z, "oak_door", { facing: "north", half: "upper", hinge, open: "false", powered: "false" });
  }
  // Canopy fascia over the entrance.
  if (z === 0 && DOOR_X.includes(x) && has(x, z)) {
    put(x, b + 4, z, "light_gray_concrete");
  }

  // Roof deck (interior) and roof plant.
  if (!perim) {
    put(x, b + 20, z, "light_gray_concrete");
    const inCore = x >= 9 && x <= 13 && z >= 8 && z <= 12;
    if (inCore) {
      for (let dy = 21; dy <= 23; dy++) put(x, b + dy, z, "light_gray_concrete");
      put(x, b + 24, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
    } else if ((x + z) % 5 === 0 && x > 2 && x < W - 3 && z > 2 && z < D - 3) {
      put(x, b + 21, z, "iron_block");
    }
  }
}

// Warm lights behind some window bays on the storeys (shroomlight on the interior cell behind the glass).
for (const [x, z, b] of cells) {
  const fc = faces(x, z);
  if (!fc.length) continue;
  let ix = x, iz = z;
  if (fc.includes("north")) iz = z + 1;
  else if (fc.includes("south")) iz = z - 1;
  else if (fc.includes("west")) ix = x + 1;
  else if (fc.includes("east")) ix = x - 1;
  if (!has(ix, iz) || isPerimeter(ix, iz)) continue;
  const idx = fc.includes("north") || fc.includes("south") ? x : z;
  for (let k = 0; k < 4; k++) {
    if (k % 2 === 1) continue;
    if (idx % 6 !== 2) continue;
    if (fc.length > 1) continue;
    put(ix, b + 5 * k + 2, iz, "shroomlight");
  }
}

// Ground-floor glow at the entrance: lanterns on the inside, behind the doors.
for (const x of DOOR_X) {
  if (!has(x, 1)) continue;
  const b = gy(x, 1);
  put(x, b + 2, 1, "lantern", { hanging: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
