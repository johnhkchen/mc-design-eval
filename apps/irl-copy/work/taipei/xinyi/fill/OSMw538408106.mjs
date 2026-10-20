import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538408106";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 22, H = 23, D = 16;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground height of that cell
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const inFp = (x, z) => ground.has(`${x},${z}`);

function put(x, y, z, id, st) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (st) g.set(x, y, z, id, st);
  else g.set(x, y, z, id);
}

// Outward faces: [dx, dz, name]
const FACES = [
  [0, -1, "north"],
  [0, 1, "south"],
  [-1, 0, "west"],
  [1, 0, "east"],
];

// Pass 1: foundations, floor slabs, roof deck for every footprint cell
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");   // foundation below own ground
  put(x, gr, z, "smooth_stone");                               // ground floor slab
  put(x, gr + 5, z, "smooth_stone");                           // second floor slab
  put(x, gr + 10, z, "light_gray_concrete");                   // roof deck
}

// Pass 2: perimeter walls with articulation
for (const [x, z, gr] of cells) {
  for (const [dx, dz, face] of FACES) {
    if (inFp(x + dx, z + dz)) continue; // not an exterior face
    const idx = (face === "north" || face === "south") ? x : z;
    const inX = x - dx, inZ = z - dz;   // one block inward, behind the glass
    const inside = inFp(inX, inZ);

    for (let dy = 1; dy <= 11; dy++) {
      const y = gr + dy;
      const mull = idx % 3 === 0;
      let id;

      if (dy === 11) {
        // parapet
        id = "smooth_quartz";
      } else if (dy === 1) {
        // plinth course
        id = "polished_granite";
      } else if (dy <= 3) {
        // ground-floor shopfront
        id = mull ? "white_concrete" : "light_blue_stained_glass";
      } else if (dy === 4) {
        // shopfront lintel
        id = "smooth_quartz";
      } else if (dy === 5 || dy === 10) {
        // storey line / roof band
        id = "smooth_quartz";
      } else if (dy === 6 || dy === 9) {
        // upper spandrels, mullions continue
        id = mull ? "white_concrete" : "smooth_quartz";
      } else {
        // dy 7, 8: upper window glass
        id = mull ? "white_concrete" : "light_blue_stained_glass";
      }
      put(x, y, z, id);

      // Warm light behind selected windows
      if (inside && !mull) {
        if (dy === 2 && idx % 4 === 2) put(inX, y, inZ, "glowstone");
        if ((dy === 7 || dy === 8) && idx % 6 === 1 && dy === 7) put(inX, y, inZ, "shroomlight");
      }
    }
  }
}

// Pass 3: entrance on the south (front) face, centred
for (const [x, z, gr] of cells) {
  if (inFp(x, z + 1)) continue;
  if (x !== 11) continue;
  put(x, gr + 1, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(x, gr + 2, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  put(x, gr + 3, z, "glass_pane");
  // lantern inside, behind the door transom
  if (inFp(x, z - 1)) put(x, gr + 3, z - 1, "lantern", { hanging: "false", waterlogged: "false" });
}

// Pass 4: roof equipment and a small parapet cap on interior roof cells
for (const [x, z, gr] of cells) {
  const edge = FACES.some(([dx, dz]) => !inFp(x + dx, z + dz));
  if (edge) continue;
  if (x % 7 === 3 && z % 5 === 2) {
    put(x, gr + 11, z, "light_gray_concrete");
    put(x, gr + 12, z, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);
