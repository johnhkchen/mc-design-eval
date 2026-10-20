import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw541988709";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

// Footprint 18 x 20. Two-storey 1980s-90s Xinyi commercial block:
// stone-base shopfront, white terracotta pilasters, light grey concrete
// frames, glass panes, warm lamps in some windows, parapet and rooftop plant.
const W = 18, H = 23, D = 20;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z] of cells) {
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}
const midX = Math.floor((minX + maxX) / 2);

for (const [x, z, gr] of cells) {
  // Foundation up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  // Ground floor slab, storey-2 slab, roof slab (every cell).
  g.set(x, gr, z, "smooth_stone");
  g.set(x, gr + 5, z, "smooth_stone");
  g.set(x, gr + 10, z, "gray_concrete");

  // Exposed faces: N/S use x index, W/E use z index.
  const faces = [];
  if (!has(x, z - 1)) faces.push("N");
  if (!has(x, z + 1)) faces.push("S");
  if (!has(x - 1, z)) faces.push("W");
  if (!has(x + 1, z)) faces.push("E");

  if (faces.length === 0) {
    // Interior: roof plant on a sparse grid, standing on the roof slab.
    if (x % 6 === 3 && z % 6 === 3) g.set(x, gr + 11, z, "iron_block");
    continue;
  }

  // Pillar bays every 3 cells along each exposed face, and at the ends.
  let pillar = false;
  for (const f of faces) {
    const idx = (f === "N" || f === "S") ? x - minX : z - minZ;
    const ext = (f === "N" || f === "S") ? maxX - minX : maxZ - minZ;
    if (idx % 3 === 0 || idx === 0 || idx === ext) pillar = true;
  }

  const lamp = (x * 7 + z * 13 + gr) % 7 === 0;
  const warm = (x * 5 + z * 3 + gr) % 4 === 0 ? "shroomlight" : "glowstone";
  const isEntrance = faces.includes("S") && z === maxZ && x === midX;

  // Base course on the street level.
  g.set(x, gr + 1, z, "stone_bricks");

  // Storey 1: shopfront.
  if (pillar) {
    g.set(x, gr + 2, z, "white_terracotta");
    g.set(x, gr + 3, z, "white_terracotta");
    g.set(x, gr + 4, z, "white_terracotta");
  } else if (isEntrance) {
    g.set(x, gr + 2, z, "glass_pane");
    g.set(x, gr + 3, z, "glass_pane");
    g.set(x, gr + 4, z, "light_gray_concrete");
  } else {
    g.set(x, gr + 2, z, lamp ? warm : "glass_pane");
    g.set(x, gr + 3, z, lamp ? warm : "glass_pane");
    g.set(x, gr + 4, z, "light_gray_concrete");
  }

  // Storey line / cornice between storeys.
  g.set(x, gr + 5, z, "light_gray_concrete");

  // Storey 2: window band with frames.
  if (pillar) {
    for (let dy = 6; dy <= 9; dy++) g.set(x, gr + dy, z, "white_terracotta");
  } else {
    g.set(x, gr + 6, z, "light_gray_concrete");
    g.set(x, gr + 7, z, lamp ? warm : "glass_pane");
    g.set(x, gr + 8, z, lamp ? warm : "glass_pane");
    g.set(x, gr + 9, z, "light_gray_concrete");
  }

  // Roof cornice and parapet.
  g.set(x, gr + 10, z, "smooth_stone");
  g.set(x, gr + 11, z, "white_terracotta");
}

g.save(`${dir}/${id}.nbt`);
