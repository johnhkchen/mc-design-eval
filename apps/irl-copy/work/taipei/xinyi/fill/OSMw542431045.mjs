import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542431045";
const W = 26, H = 23, D = 13;

// Footprint: [x, z, ground]
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, Math.round(gr));
const has = (x, z) => G.has(`${x},${z}`);
const gnd = (x, z) => G.get(`${x},${z}`);
const minG = Math.min(...G.values());

// Levels (absolute y). Roof is ~11 blocks above lowest ground.
const SL = minG + 5;   // storey line / floor slab (ground storey is 5 blocks)
const T = minG + 10;   // roof slab / cornice layer
// parapet sits at T + 1 = minG + 11

const g = new Voxels([W, H, D]);

const put = (x, y, z, id, props) => {
  if (!has(x, z)) return;
  if (y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const outside = (x, z) => !has(x, z);
const isEdge = (x, z) =>
  outside(x - 1, z) || outside(x + 1, z) || outside(x, z - 1) || outside(x, z + 1);
const face = (x, z) => {
  if (outside(x, z - 1)) return "N";
  if (outside(x, z + 1)) return "S";
  if (outside(x - 1, z)) return "W";
  if (outside(x + 1, z)) return "E";
  return null;
};

// Entrance: two-leaf door, centred on the north (z = 0) facade.
const EX = Math.floor(W / 2) - 1; // columns 12 and 13

const paneNS = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const paneEW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const parapetProps = { up: "true", east: "low", north: "low", south: "low", west: "low", waterlogged: "false" };

for (const [x, z, gr] of cells) {
  const edge = isEdge(x, z);
  const f = face(x, z);
  const alongX = f === "N" || f === "S"; // facade runs along x
  const idx = alongX ? x : z;
  const paneProps = alongX ? paneNS : paneEW;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");

  // Storey-line floor slab across the whole footprint.
  put(x, SL, z, "smooth_stone");

  // Roof slab, cornice at the edge, parapet on the edge.
  if (edge) {
    put(x, T, z, "smooth_quartz");
    put(x, T + 1, z, "stone_brick_wall", parapetProps);
  } else {
    put(x, T, z, "light_gray_concrete");
    // Rooftop plant box on the roof, centred.
    if (x >= 9 && x <= 16 && z >= 4 && z <= 8) {
      put(x, T + 1, z, "gray_concrete");
      if (x >= 10 && x <= 15 && z >= 5 && z <= 7) {
        put(x, T + 2, z, (x + z) % 2 === 0 ? "iron_bars" : "gray_concrete");
      } else {
        put(x, T + 2, z, "light_gray_concrete");
      }
    }
    // Warm light behind the storey-2 glass on the interior row.
    if (z === 1 && x % 6 === 1) put(x, SL + 2, z, "glowstone");
  }

  if (!edge) continue;

  // Base course.
  put(x, gr, z, "polished_granite");

  // Storey 1: shopfront zone, then lintel band at SL - 1.
  for (let y = gr + 1; y <= SL - 2; y++) {
    if (f === "N" && (x === EX || x === EX + 1) && y <= gr + 2) {
      const facing = "north";
      const hinge = x === EX ? "left" : "right";
      const half = y === gr + 1 ? "lower" : "upper";
      put(x, y, z, "dark_oak_door", { facing, half, hinge, open: "false", powered: "false" });
    } else if (f === "N" && (x === EX || x === EX + 1) && y === gr + 3) {
      put(x, y, z, "dark_oak_planks");
    } else if (idx % 4 === 0) {
      put(x, y, z, "white_concrete");
    } else {
      put(x, y, z, "glass_pane", paneProps);
    }
  }
  if (SL - 1 >= gr + 1) {
    const band = f === "N" && (x === EX || x === EX + 1) ? "dark_oak_planks" : "smooth_stone";
    put(x, SL - 1, z, band);
  }

  // Storey 2: sill, window band, lintel.
  for (let y = SL + 1; y <= T - 1; y++) {
    if (y === SL + 1) {
      put(x, y, z, "smooth_quartz");
    } else if (y === T - 1) {
      put(x, y, z, "smooth_quartz");
    } else if (idx % 3 === 0) {
      put(x, y, z, "white_concrete");
    } else {
      put(x, y, z, "glass_pane", paneProps);
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
