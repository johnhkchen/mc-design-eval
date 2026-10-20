import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw537993155";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 24, H = 23, D = 19;
const g = new Voxels([W, H, D]);

const put = (x, y, z, blk, st) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (st) g.set(x, y, z, blk, st);
  else g.set(x, y, z, blk);
};

const fp = new Set(cells.map(([x, z]) => `${x},${z}`));
const has = (x, z) => fp.has(`${x},${z}`);
const isEdge = (x, z) => !has(x, z - 1) || !has(x, z + 1) || !has(x - 1, z) || !has(x + 1, z);

const paneFront = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const paneSide = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Pass 1: foundations, plinth, floor slabs, roof deck for every footprint cell
for (const [x, z, b0] of cells) {
  const b = Math.round(b0);
  for (let y = 0; y < b; y++) put(x, y, z, "stone_bricks");
  put(x, b, z, "polished_andesite");
  put(x, b + 5, z, "smooth_stone");   // storey line / upper floor slab
  put(x, b + 10, z, "stone_bricks");  // roof deck
}

// Pass 2: facades on edge cells, roof equipment on interior cells
for (const [x, z, b0] of cells) {
  const b = Math.round(b0);

  if (!isEdge(x, z)) {
    // roof plant: a few air-cooled units in 2x2 pads
    if ((x % 8 === 4 || x % 8 === 5) && (z % 6 === 2 || z % 6 === 3)) {
      put(x, b + 11, z, "light_gray_concrete");
    }
    // low parapet-free roof edge planters
    if (x % 8 === 1 && z % 6 === 4) put(x, b + 11, z, "moss_block");
    continue;
  }

  // Determine facade orientation and inward direction
  let face, u, inX, inZ;
  if (!has(x, z - 1))      { face = "front"; u = x; inX = 0; inZ = 1; }
  else if (!has(x, z + 1)) { face = "back";  u = x; inX = 0; inZ = -1; }
  else if (!has(x - 1, z)) { face = "side";  u = z; inX = 1; inZ = 0; }
  else                     { face = "side";  u = z; inX = -1; inZ = 0; }
  const pane = face === "side" ? paneSide : paneFront;

  // Walls: white cladding; storey line, lintel, cornice and parapet
  for (let y = b + 1; y <= b + 11; y++) {
    if (y === b + 11) { put(x, y, z, "white_concrete"); continue; }                    // parapet
    if (y === b + 10) { put(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" }); continue; } // cornice
    if (y === b + 5)  { put(x, y, z, "smooth_stone"); continue; }                      // band
    if (y === b + 4)  { put(x, y, z, "stone_bricks"); continue; }                      // lintel / sign band

    const ground = y <= b + 3;
    const pilaster = ground ? (u % 6 === 0) : (u % 3 === 0);

    // Entrance door on front, storey 1
    if (face === "front" && ground && x === 11 && (y === b + 1 || y === b + 2)) {
      put(x, y, z, "oak_door", {
        facing: "south",
        half: y === b + 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }

    if (pilaster) {
      put(x, y, z, ground ? "stone_bricks" : "white_concrete");
      continue;
    }

    put(x, y, z, "glass_pane", pane);

    // Warm light just behind some panes
    const ix = x + inX, iz = z + inZ;
    if (has(ix, iz) && !isEdge(ix, iz)) {
      if (ground && u % 6 === 4 && y === b + 2) put(ix, y, iz, "glowstone");
      if (!ground && u % 6 === 1 && y === b + 7) put(ix, y, iz, "shroomlight");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
