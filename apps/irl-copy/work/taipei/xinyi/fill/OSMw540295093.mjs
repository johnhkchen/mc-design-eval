import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540295093";
const W = 19, H = 23, D = 21;
const TOP = 11; // roof surface sits 11 blocks above the lowest ground

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// ---- footprint and ground ----
const ground = new Map();
let minG = Infinity;
for (const [x, z, g] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  ground.set(`${x},${z}`, g);
  if (g < minG) minG = g;
}
if (!isFinite(minG)) minG = 0;

const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`) - minG;
const exposedZ = (x, z) => !has(x, z - 1) || !has(x, z + 1);
const exposedX = (x, z) => !has(x - 1, z) || !has(x + 1, z);
const perimeterCell = (x, z) => exposedZ(x, z) || exposedX(x, z);

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// ---- entrance: on the z-minimum face, nearest to the centre ----
let door = null;
for (const key of ground.keys()) {
  const [x, z] = key.split(",").map(Number);
  if (has(x, z - 1)) continue;
  if (!door || Math.abs(x - 9) < Math.abs(door.x - 9)) door = { x, z };
}

// ---- pier pattern: every third bay, corners always piers ----
const minX = Math.min(...[...ground.keys()].map(k => +k.split(",")[0]));
const isPier = (x, z) => {
  if (exposedZ(x, z) && exposedX(x, z)) return true;
  if (exposedZ(x, z)) return (x - minX) % 3 === 0;
  return (z - (Math.min(...[...ground.keys()].map(k => +k.split(",")[1])))) % 3 === 0;
};

// inward direction for a perimeter cell (toward the interior)
const inward = (x, z) => {
  if (exposedZ(x, z)) {
    if (!has(x, z - 1)) return [0, 1];
    if (!has(x, z + 1)) return [0, -1];
  }
  if (!has(x - 1, z)) return [1, 0];
  if (!has(x + 1, z)) return [-1, 0];
  return null;
};

// ---- build each footprint cell ----
for (const key of ground.keys()) {
  const [x, z] = key.split(",").map(Number);
  const gc = Math.min(gAt(x, z), TOP - 1);
  const perim = perimeterCell(x, z);

  for (let y = 0; y < TOP; y++) {
    // foundation: solid from y 0 up to this cell's ground
    if (y < gc) {
      put(x, y, z, perim ? "stone_bricks" : "stone");
      continue;
    }

    if (!perim) {
      // interior: floor slab at storey line, roof deck at top of upper floor
      if (y === 5) put(x, y, z, "light_gray_concrete");
      else if (y === 9) put(x, y, z, "light_gray_concrete");
      // roof plant on the deck
      else if (y === 10 && x % 6 === 3 && z % 6 === 3) put(x, y, z, "iron_block");
      continue;
    }

    // ---- perimeter facade ----
    const isDoor = door && door.x === x && door.z === z;
    const pier = isPier(x, z);
    const alongX = exposedZ(x, z) && !exposedX(x, z); // wall runs along x
    const winProps = alongX
      ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
      : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

    if (y === 0) {
      put(x, y, z, "stone_bricks");
    } else if (y >= 1 && y <= 3) {
      if (isDoor && y === 1) {
        put(x, y, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      } else if (isDoor && y === 2) {
        put(x, y, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
      } else if (isDoor && y === 3) {
        put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
      } else if (pier) {
        put(x, y, z, "smooth_quartz");
      } else {
        const inn = inward(x, z);
        const lit = inn && y === 2 && (x * 3 + z * 5) % 5 === 0;
        put(x, y, z, "glass_pane", winProps);
        if (lit) {
          const [ix, iz] = inn;
          const cx = x + ix, cz = z + iz;
          if (has(cx, cz) && !perimeterCell(cx, cz) && gAt(cx, cz) <= y) put(cx, y, cz, "glowstone");
        }
      }
    } else if (y === 4) {
      put(x, y, z, "dark_oak_planks");
    } else if (y === 5) {
      put(x, y, z, "white_concrete");
    } else if (y >= 6 && y <= 8) {
      if (pier) {
        put(x, y, z, "smooth_quartz");
      } else {
        put(x, y, z, "glass_pane", winProps);
        const inn = inward(x, z);
        const lit = inn && y === 7 && (x * 3 + z * 5) % 4 === 0;
        if (lit) {
          const [ix, iz] = inn;
          const cx = x + ix, cz = z + iz;
          if (has(cx, cz) && !perimeterCell(cx, cz) && gAt(cx, cz) <= y) put(cx, y, cz, "glowstone");
        }
      }
    } else if (y === 9) {
      put(x, y, z, "smooth_stone");
    } else if (y === 10) {
      put(x, y, z, "stone_brick_wall");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
