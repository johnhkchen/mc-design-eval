import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1016280256";
const W = 8, H = 33, D = 21;
const ROOF = 20;      // roof slab; top of roof about 21 blocks above lowest ground
const PARAPET = 21;   // parapet course and cap above the roof slab

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const gmin = Math.min(...raw.map(c => c[2]));
const ground = new Map();
for (const [x, z, gr] of raw) ground.set(`${x},${z}`, gr - gmin);

const inFp = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);
const isEdge = (x, z) => !inFp(x - 1, z) || !inFp(x + 1, z) || !inFp(x, z - 1) || !inFp(x, z + 1);

const g = new Voxels([W, H, D]);

// Writes only on footprint cells and only above that cell's foundation.
const put = (x, y, z, id, props) => {
  if (!inFp(x, z) || y < 0 || y >= H || y < gAt(x, z)) return false;
  if (props) g.set(x, y, z, id, props); else g.set(x, y, z, id);
  return true;
};

const DOOR_X = 4; // entrance on the short north face (z = 0)

// 1. Foundation: solid from y 0 up to each cell's ground.
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
}

// 2. Floor slabs per storey (interior floors, air gap behind the glass), roof slab.
for (const [key] of ground) {
  const [x, z] = key.split(",").map(Number);
  for (const fy of [0, 5, 10, 15]) put(x, fy, z, "light_gray_concrete");
  put(x, ROOF, z, "light_gray_concrete");
}

// 3. Facades: piers, spandrels, window grid, base course, shopfront, awning, door.
for (const [key] of ground) {
  const [x, z] = key.split(",").map(Number);
  if (!isEdge(x, z)) continue;

  const corner = (x === 0 || x === 7) && (z === 0 || z === 20);
  const longFace = x === 0 || x === 7;          // long sides, index along z
  const along = longFace ? z : x;               // position along the face
  const isPier = corner || along % 3 === 0;
  const northShop = z === 0;                    // shopfront on the entrance face
  const isDoor = northShop && x === DOOR_X;

  for (let s = 0; s < 4; s++) {
    const b = s * 5;
    // Spandrel band just under the next storey line.
    put(x, b + 4, z, "light_gray_concrete");

    // Sill and window band.
    if (!isPier) {
      if (s === 0 && northShop) {
        put(x, 2, z, "light_blue_stained_glass");
        put(x, 3, z, "light_blue_stained_glass");
      } else {
        put(x, b + 1, z, "white_concrete");
        put(x, b + 2, z, "light_blue_stained_glass_pane");
        put(x, b + 3, z, "light_blue_stained_glass_pane");
      }
    } else {
      put(x, b + 1, z, "light_gray_concrete");
      put(x, b + 2, z, "light_gray_concrete");
      put(x, b + 3, z, "light_gray_concrete");
    }
  }

  // Ground storey: base course, awning over shopfront.
  put(x, 1, z, "smooth_stone");
  if (northShop && !isPier) put(x, 4, z, "red_concrete");

  // Entrance door and its canopy-side reveal.
  if (isDoor) {
    put(x, 1, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, 2, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    put(x, 3, z, "light_blue_stained_glass");
  }

  // Parapet and cornice cap.
  put(x, PARAPET, z, "white_concrete");
  put(x, PARAPET + 1, z, "light_gray_concrete");
}

// 4. Warm light behind some windows, set two blocks inside so an air gap stays.
for (const [key] of ground) {
  const [x, z] = key.split(",").map(Number);
  if (!isEdge(x, z)) continue;
  const corner = (x === 0 || x === 7) && (z === 0 || z === 20);
  if (corner) continue;
  const longFace = x === 0 || x === 7;
  const along = longFace ? z : x;
  if (along % 3 === 0) continue;
  for (let s = 1; s < 4; s++) {
    if ((along + s) % 4 !== 1) continue;
    const dx = x === 0 ? 2 : x === 7 ? -2 : 0;
    const dz = z === 0 ? 2 : z === 20 ? -2 : 0;
    const id = (along + s) % 8 === 1 ? "shroomlight" : "glowstone";
    put(x + dx, 5 * s + 2, z + dz, id);
  }
}

// 5. Rooftop: water tank on steel stand, penthouse block with cap.
for (let x = 1; x <= 2; x++) for (let z = 3; z <= 4; z++) {
  for (let y = PARAPET; y <= 23; y++) put(x, y, z, "iron_block");
  put(x, 24, z, "light_gray_concrete");
}
for (let x = 4; x <= 6; x++) for (let z = 11; z <= 15; z++) {
  put(x, PARAPET, z, "white_concrete");
  put(x, PARAPET + 1, z, "white_concrete");
  put(x, PARAPET + 2, z, "light_gray_concrete");
}

g.save(`${DIR}/${ID}.nbt`);
