import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542610201";
const W = 18, D = 14, H = 23;

// Record: 18 x 14 footprint, roof ~11 blocks above lowest ground, two storeys
// of ~5 blocks each plus parapet. Reads as a 1980s Xinyi commercial block:
// stone base course, pale quartz and concrete frame, pale glass bays with
// quartz piers, a sloped lintel band on the street face, and a rooftop plant box.

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
let minG = Infinity;
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, gr);
  minG = Math.min(minG, gr);
}
const has = (x, z) => ground.has(`${x},${z}`);
const frontZ = Math.max(...cells.map(c => c[1]));
const frontXs = cells.filter(c => c[1] === frontZ).map(c => c[0]).sort((a, b) => a - b);
const doorX = frontXs[Math.floor(frontXs.length / 2)];

const g = new Voxels([W, H, D]);

function put(x, y, z, id, p) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
}

const PANE_NS = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const PANE_EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

for (const [x, z, gr] of cells) {
  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const onNS = !has(x, z - 1) || !has(x, z + 1); // exposed on a north/south face
  const onEW = !has(x - 1, z) || !has(x + 1, z); // exposed on an east/west face
  const edge = onNS || onEW;
  const corner = onNS && onEW;

  if (!edge) {
    // Interior: floor slabs at each storey line and the roof deck, air between
    put(x, gr, z, "smooth_stone");
    if (minG + 5 >= gr) put(x, minG + 5, z, "smooth_stone");
    if (minG + 10 >= gr) put(x, minG + 10, z, "smooth_stone");
    put(x, minG + 11, z, "smooth_stone");
    continue;
  }

  const front = onNS && z === frontZ && !corner;
  const i = onNS ? x : z;           // index along the exposed face
  const pier = corner || i % 3 === 0;
  const paneP = onNS ? PANE_NS : PANE_EW;

  for (let y = gr; y <= minG + 13; y++) {
    const k = y - minG;

    if (y === gr) { put(x, y, z, "polished_andesite"); continue; }

    if (k === 13) { put(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" }); continue; }

    if (k >= 1 && k <= 3) {
      if (front && x === doorX && k === 1 && gr <= minG + 1) {
        put(x, y, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      } else if (front && x === doorX && k === 2 && gr <= minG + 1) {
        put(x, y, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
      } else if (pier) {
        put(x, y, z, "smooth_quartz");
      } else {
        put(x, y, z, "light_blue_stained_glass_pane", paneP);
      }
    } else if (k === 4) {
      if (front) {
        put(x, y, z, "stone_brick_stairs", { facing: "north", half: "top", shape: "straight", waterlogged: "false" });
      } else {
        put(x, y, z, "light_gray_concrete");
      }
    } else if (k === 5) {
      put(x, y, z, "light_gray_concrete");
    } else if (k >= 6 && k <= 8) {
      if (pier) put(x, y, z, "smooth_quartz");
      else put(x, y, z, "light_blue_stained_glass_pane", paneP);
    } else if (k === 9) {
      put(x, y, z, "smooth_quartz");
    } else if (k === 10) {
      put(x, y, z, "light_gray_concrete");
    } else if (k === 11 || k === 12) {
      put(x, y, z, "smooth_quartz");
    }
  }

  // Warm light: glowstone one block inside some storey-two bays
  if (!pier && i % 6 === 1) {
    let dx = 0, dz = 0;
    if (onNS) dz = has(x, z + 1) ? -1 : 1;
    else dx = has(x + 1, z) ? -1 : 1;
    if (has(x + dx, z + dz)) put(x + dx, minG + 7, z + dz, "glowstone");
  }
}

// Rooftop plant: a few AC units and a small penthouse box on the deck
for (const [x, z] of cells) {
  const onNS = !has(x, z - 1) || !has(x, z + 1);
  const onEW = !has(x - 1, z) || !has(x + 1, z);
  if (onNS || onEW) continue;
  if (x % 6 === 4 && z === 4) put(x, minG + 12, z, "iron_block");
  if (x % 6 === 4 && z === 9) put(x, minG + 12, z, "iron_block");
  if ((x === 8 || x === 9) && (z === 6 || z === 7)) {
    put(x, minG + 12, z, "light_gray_concrete");
    put(x, minG + 13, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
