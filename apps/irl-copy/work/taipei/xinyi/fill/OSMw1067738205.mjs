import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise two-storey commercial block, Xinyi style (late 20th / early 21st century):
// white concrete frame, quartz string courses and cornice, glass infill, shopfront at grade,
// flat roof with a mechanical penthouse. Roof sits at y 10 (parapet 11) above the lowest ground.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1067738205";
const W = 16, H = 23, D = 47;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.max(0, Math.round(gr ?? 0)));

const inFp = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`) ?? 0;

const g = new Voxels([W, H, D]);
const put = (x, y, z, b, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

const paneX = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const paneZ = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const DOOR_X = 0, DOOR_Z = 23;

for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const perim = !inFp(x - 1, z) || !inFp(x + 1, z) || !inFp(x, z - 1) || !inFp(x, z + 1);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const roofY = Math.max(10, gr);
  const zFace = z === 0 || z === D - 1;
  // Pier columns: corners and every third bay on each facade.
  const pier = zFace ? (x % 3 === 0 || x === 15) : (z === D - 1 || z % 3 === 0);
  const isDoor = x === DOOR_X && z === DOOR_Z;

  for (let y = gr; y < roofY; y++) {
    const k = y - gr; // storey offset from this cell's ground
    if (!perim) {
      // Interior: floor slabs per storey, air between, a few warm lights on the floor.
      if (k === 0 || k === 5) put(x, y, z, "smooth_stone");
      else if (x === 1 && k === 1 && z % 6 === 2) put(x, y, z, "lantern", { hanging: "false", waterlogged: "false" });
      else if (x === 1 && k === 6 && z % 6 === 5) put(x, y, z, "glowstone");
      continue;
    }
    // Perimeter shell.
    if (k === 0) {
      put(x, y, z, "stone_bricks"); // base course
    } else if (k <= 3) {
      if (isDoor && k === 1) {
        put(x, y, z, "oak_door", { facing: "west", half: "lower", hinge: "left", open: "false", powered: "false" });
      } else if (isDoor && k === 2) {
        put(x, y, z, "oak_door", { facing: "west", half: "upper", hinge: "left", open: "false", powered: "false" });
      } else if (isDoor) {
        put(x, y, z, "smooth_quartz"); // door lintel
      } else if (pier) {
        put(x, y, z, "white_concrete");
      } else {
        put(x, y, z, "glass"); // shopfront glazing
      }
    } else if (k === 4) {
      put(x, y, z, "smooth_quartz"); // string course over shopfront
    } else if (k === 5) {
      put(x, y, z, "white_concrete"); // upper floor spandrel
    } else if (k <= 8) {
      if (pier) put(x, y, z, "white_concrete");
      else put(x, y, z, "light_blue_stained_glass_pane", zFace ? paneZ : paneX);
    } else {
      put(x, y, z, "smooth_quartz"); // cornice
    }
  }

  // Roof slab and parapet.
  if (perim) {
    put(x, roofY, z, "white_concrete");
    put(x, roofY + 1, z, "smooth_quartz");
  } else {
    put(x, roofY, z, "light_gray_concrete");
  }
}

// Mechanical penthouse on the roof, centred on the footprint.
for (let x = 5; x <= 10; x++) {
  for (let z = 15; z <= 31; z++) {
    if (!inFp(x, z)) continue;
    const rY = Math.max(10, gAt(x, z));
    const ring = x === 5 || x === 10 || z === 15 || z === 31;
    if (ring) {
      put(x, rY + 1, z, "light_gray_concrete");
      put(x, rY + 2, z, "light_gray_concrete");
    }
    put(x, rY + 3, z, "smooth_stone");
  }
}

g.save(`${DIR}/${ID}.nbt`);
