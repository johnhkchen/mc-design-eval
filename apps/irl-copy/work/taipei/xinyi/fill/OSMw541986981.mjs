import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no name, 20 x 11 footprint, roof ~11 blocks above lowest ground.
// Read as a 1980s-90s Xinyi-style low commercial block: two storeys, a glazed
// shopfront on the street (front, z = 0), white-tiled upper storey with framed
// glass bays and a few warm lamps behind the glass, a parapet, and rooftop
// AC plant. Structure: stone foundation to the level floor, slabs at F+5 and
// F+9, parapet at F+10, so the roof tops out 11 blocks above the floor line.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541986981";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 20, H = 23, D = 11;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground height
const ground = new Map();
for (const [x, z, gy] of cells) ground.set(`${x},${z}`, gy);
const has = (x, z) => ground.has(`${x},${z}`);

// Level floor line: the highest ground under the footprint, so every cell is
// carried up to a single floor level by its own foundation.
const F = Math.max(...cells.map((c) => c[2]));

const put = (x, y, z, id, props) => {
  if (y < 0 || y >= H || x < 0 || x >= W || z < 0 || z >= D) return;
  if (!has(x, z)) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const exterior = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
const faceOf = (x, z) => {
  if (!has(x, z - 1)) return "front";
  if (!has(x, z + 1)) return "back";
  if (!has(x - 1, z)) return "west";
  return "east";
};

const DOOR_P = 9; // entrance position along the front face

for (const key of ground.keys()) {
  const [x, z] = key.split(",").map(Number);

  // Foundation from y 0 up to the level floor (covers every cell's ground).
  for (let y = 0; y < F; y++) put(x, y, z, "stone_bricks");

  // Floor slabs: F+5 (upper storey floor), F+9 (roof deck).
  put(x, F + 5, z, "light_gray_concrete");
  put(x, F + 9, z, "smooth_stone");

  if (!exterior(x, z)) continue; // interior: only the slabs

  const f = faceOf(x, z);
  const front = f === "front";
  const back = f === "back";
  const along = front || back ? W : D;
  const p = front || back ? x : z; // position along the face
  const edge = p === 0 || p === along - 1;

  // Base course
  put(x, F, z, "stone_bricks");

  // Ground storey: F+1 .. F+3 glazing, F+4 fascia
  for (let y = F + 1; y <= F + 3; y++) {
    if (front) {
      if (p === DOOR_P) {
        if (y === F + 1) put(x, y, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
        else if (y === F + 2) put(x, y, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
        else put(x, y, z, "glass");
      } else if (edge || p % 4 === 0) {
        put(x, y, z, "polished_andesite");
      } else {
        put(x, y, z, "glass");
      }
    } else {
      // back and sides: solid tiled wall with a few windows
      const win = p > 0 && p < along - 1 && p % 3 === 1;
      put(x, y, z, win ? "glass" : "white_concrete");
    }
  }

  // Fascia / lintel band at F+4
  if (front) {
    if (p === DOOR_P) put(x, F + 4, z, "lantern", { hanging: "true", waterlogged: "false" });
    else put(x, F + 4, z, "smooth_quartz");
  } else {
    put(x, F + 4, z, "white_concrete");
  }

  // Upper storey F+6 .. F+8: white piers with framed glass bays
  const winU = p > 0 && p < along - 1 && p % 3 !== 0;
  for (let y = F + 6; y <= F + 8; y++) {
    if (winU) {
      if (y === F + 6) put(x, y, z, "light_gray_concrete"); // sill
      else put(x, y, z, "glass");
    } else {
      put(x, y, z, "white_concrete");
    }
  }

  // Parapet F+10 on the exterior ring
  put(x, F + 10, z, "white_concrete");
}

// Warm lamps standing inside, one air cell behind selected front and back windows
for (let x = 1; x < W - 1; x++) {
  if (!has(x, 0) || !has(x, 1)) continue;
  if (x % 3 !== 0 && x % 6 === 2) {
    put(x, F + 6, 2, "glowstone");
    put(x, F + 6, D - 3, "glowstone");
  }
}
// Side windows: one lamp on each long-ish side at mid-depth
for (let z = 2; z < D - 2; z++) {
  if (has(0, z) && has(1, z) && z % 3 === 2) put(2, F + 6, z, "glowstone");
  if (has(W - 1, z) && has(W - 2, z) && z % 3 === 2) put(W - 3, F + 6, z, "glowstone");
}

// Rooftop plant: AC condenser blocks and a small service box, on the deck (F+10)
for (let x = 4; x <= 6; x++) for (let z = 3; z <= 4; z++) put(x, F + 10, z, "iron_block");
for (let x = 14; x <= 15; x++) for (let z = 3; z <= 4; z++) put(x, F + 10, z, "light_gray_concrete");

g.save(`${DIR}/${ID}.nbt`);
