import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538414196";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const W = 14, H = 23, D = 20;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gy] of cells) ground.set(`${x},${z}`, gy);
const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);
const b = Math.min(...cells.map((c) => c[2]));

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Exterior faces of a footprint cell: N is the street side (z = 0 edge).
const faces = (x, z) => {
  const f = new Set();
  if (!has(x, z - 1)) f.add("N");
  if (!has(x, z + 1)) f.add("S");
  if (!has(x - 1, z)) f.add("W");
  if (!has(x + 1, z)) f.add("E");
  return f;
};
const perim = (x, z) => faces(x, z).size > 0;

// Pass 1: foundations and walls, per cell.
for (const [x, z, gy] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gy; y++) put(x, y, z, "stone_bricks");

  if (perim(x, z)) {
    const f = faces(x, z);
    const front = f.has("N");
    const u = (f.has("N") || f.has("S")) ? x : z;
    const pilaster = (f.has("N") || f.has("S")) ? x % 4 === 0 : z % 4 === 0;
    for (let y = gy; y <= b + 11; y++) {
      let id = "white_concrete";
      let props;
      if (y === gy) id = "smooth_stone";
      else if (y === b + 11) id = "smooth_quartz";
      else if (y === b + 10) { id = "stone_brick_slab"; props = { type: "bottom", waterlogged: "false" }; }
      else if (y === b + 5) id = "light_gray_concrete";
      else if (pilaster) id = "smooth_quartz";

      const lower = y >= b + 1 && y <= b + 3;
      const upper = y >= b + 6 && y <= b + 9;

      if (front) {
        if (lower) {
          id = (x % 4 === 0) ? "dark_oak_log" : "glass";
          if (x === 0 || x === 13) id = "smooth_quartz";
        } else if (y === b + 4) {
          id = (x % 4 === 2) ? "yellow_concrete" : "red_concrete";
        } else if (upper && u % 3 === 1 && !pilaster) {
          id = "glass";
        }
      } else if ((lower || upper) && u % 3 === 1 && !pilaster) {
        id = "glass";
      }

      if (props) put(x, y, z, id, props);
      else put(x, y, z, id);
    }
  }
}

// Pass 2: interior floor slabs, roof slab and behind-glass warm lights.
for (const [x, z, gy] of cells) {
  if (perim(x, z)) continue;
  put(x, gy, z, "light_gray_concrete");
  if (b + 5 >= gy) put(x, b + 5, z, "light_gray_concrete");
  if (b + 10 >= gy) put(x, b + 10, z, "light_gray_concrete");

  if (z === 1 && x % 4 === 2 && b + 2 > gy) put(x, b + 2, z, "glowstone");
  if (z === 18 && x % 4 === 2 && b + 7 > b + 5) put(x, b + 7, z, "glowstone");
}

// Pass 3: roof equipment (air-cooling units and a water tank).
const roofItems = [
  [3, 4, "iron_block"], [4, 4, "iron_block"],
  [9, 14, "iron_block"], [10, 14, "iron_block"],
  [12, 8, "copper_block"], [12, 9, "copper_block"],
];
for (const [x, z, id] of roofItems) {
  if (has(x, z) && !perim(x, z)) put(x, b + 11, z, id);
}

// Pass 4: street entrance door, placed after the shopfront so it wins.
for (const [x, z, gy] of cells) {
  if (x === 6 && z === 0 && gy <= b + 1) {
    put(x, b + 1, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, b + 2, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
