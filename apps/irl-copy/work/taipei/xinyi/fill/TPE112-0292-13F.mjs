import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE112-0292-13F";
const W = 57, H = 23, D = 32;
const ROOF_Y = 11;        // parapet top, about 11 blocks above lowest ground
const STOREY_1_TOP = 5;   // storey line between storey 1 and 2
const STOREY_2_TOP = 10;  // roof slab / cornice line

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gz] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  ground.set(key(x, z), Math.max(0, Math.min(H - 1, gz)));
}
const inFp = (x, z) => ground.has(key(x, z));
const exposed = (x, z, dx, dz) => !inFp(x + dx, z + dz);
const isEdge = (x, z) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => exposed(x, z, dx, dz));

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Faces in priority order: outward normal and facing name.
const FACES = [
  [0, 1, "south"],
  [0, -1, "north"],
  [1, 0, "east"],
  [-1, 0, "west"],
];

// Entrance: centre of the south-facing exposed edge.
let doorU = null;
{
  const southX = [];
  for (const [k] of ground) {
    const [x, z] = k.split(",").map(Number);
    if (exposed(x, z, 0, 1)) southX.push(x);
  }
  if (southX.length) {
    doorU = Math.round((Math.min(...southX) + Math.max(...southX)) / 2);
  }
}

// 1. Foundations, slabs, roof deck, interior.
for (const [k, gz] of ground) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < gz; y++) put(x, y, z, "stone_bricks");
  if (!isEdge(x, z)) {
    put(x, gz, z, "smooth_stone");
    if (STOREY_1_TOP >= gz) put(x, STOREY_1_TOP, z, "light_gray_concrete");
    if (STOREY_2_TOP >= gz) put(x, STOREY_2_TOP, z, "light_gray_concrete");
  }
}

// 2. Edge walls: window grids, mullions, sills, entrance bay, corner piers, merlons.
for (const [k, gz] of ground) {
  const [x, z] = k.split(",").map(Number);
  if (!isEdge(x, z)) continue;

  let face = null;
  for (const [dx, dz, name] of FACES) {
    if (!inFp(x + dx, z + dz)) { face = { dx, dz, name }; break; }
  }
  if (!face) continue;

  const u = face.dz !== 0 ? x : z;
  const cornerX = exposed(x, z, 1, 0) || exposed(x, z, -1, 0);
  const cornerZ = exposed(x, z, 0, 1) || exposed(x, z, 0, -1);
  const isCorner = cornerX && cornerZ;

  // Entrance bay: door cell plus two glazed neighbours on the south face.
  const onSouth = face.name === "south";
  const inBay = doorU !== null && onSouth && Math.abs(x - doorU) <= 1;
  const isDoor = doorU !== null && onSouth && x === doorU && gz + 2 < STOREY_1_TOP;

  for (let y = gz; y <= ROOF_Y; y++) {
    if (y === gz) { put(x, y, z, "polished_granite"); continue; }
    if (y === STOREY_1_TOP || y === STOREY_2_TOP) { put(x, y, z, "smooth_quartz"); continue; }
    if (y === ROOF_Y) {
      // Merlon rhythm on the parapet, solid corner piers.
      if (isCorner || u % 4 === 0) put(x, y, z, "white_concrete");
      else put(x, y, z, "smooth_quartz");
      if (isCorner) put(x, y + 1, z, "white_concrete");
      continue;
    }

    const groundStorey = y < STOREY_1_TOP;

    if (inBay && groundStorey) {
      if (isDoor && (y === gz + 1 || y === gz + 2)) {
        const half = y === gz + 1 ? "lower" : "upper";
        put(x, y, z, "dark_oak_door", { facing: "south", half, hinge: "left", open: "false", powered: "false" });
        continue;
      }
      if (y === gz + 3) {
        // Hood over the entrance bay.
        put(x, y, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
        continue;
      }
      put(x, y, z, "glass");
      continue;
    }

    if (u % 3 === 0 && !(groundStorey && inBay)) {
      put(x, y, z, "white_concrete");
      continue;
    }

    // Sill course under each upper-storey window row.
    if (!groundStorey && y === 6) {
      put(x, y, z, "smooth_quartz");
      continue;
    }

    put(x, y, z, groundStorey ? "glass" : "light_blue_stained_glass");

    // Warm light placed in the air gap behind some windows.
    const lit = (groundStorey && y === 2 && u % 6 === 4) || (!groundStorey && y === 8 && u % 6 === 1);
    if (lit) {
      const ix = x - face.dx, iz = z - face.dz;
      if (inFp(ix, iz) && !isEdge(ix, iz)) put(ix, y, iz, "glowstone");
    }
  }
}

// 3. Roof equipment on interior roof deck.
for (const [k, gz] of ground) {
  const [x, z] = k.split(",").map(Number);
  if (isEdge(x, z) || gz > STOREY_2_TOP) continue;
  if (x % 10 >= 3 && x % 10 <= 5 && z % 10 >= 3 && z % 10 <= 5) {
    put(x, ROOF_Y, z, "light_gray_concrete");
    put(x, ROOF_Y + 1, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
