import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw587169543.cells.json", "utf8"));

const W = 60, H = 33, D = 16;
const ROOF = 21;                       // roof deck top, about 21 blocks above lowest ground
const FLOORS = [6, 11, 16];            // slab lines below the roof, five blocks per storey
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(x + "," + z, gr);
const has = (x, z) => ground.has(x + "," + z);
const gy = (x, z) => ground.get(x + "," + z);
const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const PANE_X = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const PANE_Z = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Pass 1: foundations and floor slabs across the whole footprint.
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  for (const fl of FLOORS) if (fl >= gr) put(x, fl, z, "light_gray_concrete");
  put(x, ROOF, z, "light_gray_concrete");
}

// Pass 2: perimeter shell, glazing, entrance, lights.
for (const [x, z, gr] of cells) {
  if (!isEdge(x, z)) continue;

  // Which face this cell sits on (for window layout).
  let side = null;
  if (z === 0) side = "front";
  else if (z === D - 1) side = "back";
  else if (x === 0) side = "west";
  else if (x === W - 1) side = "east";
  const u = (side === "front" || side === "back") ? x : z;

  // Wall skin from ground to roof, base course at the ground line.
  for (let y = gr; y <= ROOF - 1; y++) {
    put(x, y, z, y === gr ? "polished_granite" : "white_concrete");
  }

  // Cornice and parapet.
  put(x, ROOF, z, "quartz_block");
  put(x, ROOF + 1, z, "white_concrete");

  if (!side) continue;
  const paneProps = (side === "front" || side === "back") ? PANE_X : PANE_Z;
  const inX = side === "west" ? 1 : side === "east" ? W - 2 : x;
  const inZ = side === "front" ? 1 : side === "back" ? D - 2 : z;

  // Ground floor shopfront with entrance on the front.
  const shopTop = Math.min(gr + 3, FLOORS[0] - 1);
  for (let y = gr + 1; y <= shopTop; y++) {
    if (side === "front" && u >= 28 && u <= 31) {
      if (u === 29) {
        if (y === gr + 1) put(x, y, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
        else if (y === gr + 2) put(x, y, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
        else put(x, y, z, "white_concrete");
        continue;
      }
    }
    if (u % 3 === 0) put(x, y, z, "quartz_pillar");
    else put(x, y, z, "glass_pane", paneProps);
  }
  // Canopy over the entrance.
  if (side === "front" && u >= 26 && u <= 33) put(x, gr + 4, z, "quartz_slab", { type: "bottom", waterlogged: "false" });

  // Upper storeys: window bands between slab lines.
  const bands = [[7, 10], [12, 15], [17, 20]];
  for (const [y0, y1] of bands) {
    if (y1 < gr + 1) continue;
    for (let y = Math.max(y0, gr + 1); y <= y1; y++) {
      if (u % 4 === 0) put(x, y, z, "quartz_pillar");
      else put(x, y, z, "glass_pane", paneProps);
    }
    // Warm light behind some panes.
    const lightY = y0 + 1;
    if (lightY >= gr + 1 && u % 8 === 2 && inX >= 0 && inX < W && inZ >= 0 && inZ < D) {
      put(inX, lightY, inZ, "glowstone");
    }
  }
}

// Pass 3: roof equipment.
for (let x = 6; x <= 12; x++) for (let z = 4; z <= 7; z++) {
  if (!has(x, z)) continue;
  for (let y = ROOF + 1; y <= ROOF + 2; y++) put(x, y, z, "iron_block");
}
for (let x = 48; x <= 49; x++) for (let z = 4; z <= 5; z++) {
  if (!has(x, z)) continue;
  for (let y = ROOF + 1; y <= ROOF + 4; y++) put(x, y, z, "stone_bricks");
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw587169543.nbt");
