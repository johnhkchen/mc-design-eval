import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const W = 12, H = 18, D = 6;
const cells = JSON.parse(readFileSync(`${DIR}/NYC3001470.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// ---- Smoothed massing: one flat floor level and one flat roof tier ----
const grounds = cells.map(([, , gr]) => Math.round(gr));
const roofs = cells.map(([, , , rf]) => Math.round(rf)).sort((a, b) => a - b);
const F = Math.max(...grounds);                       // storeys stand on the highest ground
const medianRoof = roofs[Math.floor(roofs.length / 2)];
const TOP = Math.min(H - 2, Math.max(F + 6, medianRoof)); // flat roof, three 2-block storeys

// Footprint lookup
const byKey = new Map();
const list = cells.map(([x, z, gr]) => {
  const c = { x, z, ground: Math.round(gr) };
  byKey.set(`${x},${z}`, c);
  return c;
});
const has = (x, z) => byKey.has(`${x},${z}`);

const DOOR_X = [2, 8];
const isFront = (x, z) => (z === 0 || z === D - 1) && x > 0 && x < W - 1;
const isSide = (x, z) => (x === 0 || x === W - 1) && z > 0 && z < D - 1;
const isPierX = (x) => x % 3 === 0;

function isWindowSlot(x, z, y) {
  const rel = y - F;
  if (rel !== 1 && rel !== 3 && rel !== 5) return false;
  if (isFront(x, z)) return !isPierX(x);
  if (isSide(x, z)) return z % 3 !== 0;
  return false;
}

for (const c of list) {
  const { x, z, ground } = c;
  const perimeter = !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

  // Solid plinth from y0 up to the flat floor level (no floating storeys)
  for (let y = 0; y <= F; y++) put(x, y, z, "stone_bricks");

  // Storey floor slabs and the roof deck
  put(x, F + 2, z, "smooth_stone");
  put(x, F + 4, z, "smooth_stone");
  put(x, F + 6, z, "smooth_stone");

  // Any height above the three storeys is solid attic masonry
  for (let y = F + 7; y < TOP; y++) {
    put(x, y, z, perimeter ? "bricks" : "stone_bricks");
  }

  if (perimeter) {
    // Brick walls, with stone pilasters on the street and rear faces
    const pilaster = (isFront(x, z) && isPierX(x)) || (isSide(x, z) && z === 3);
    for (let y = F + 1; y < TOP; y++) {
      put(x, y, z, pilaster ? "stone_bricks" : "bricks");
    }
    // Stone string courses at each storey line and a base course
    put(x, F + 1, z, "stone_bricks");
    put(x, F + 2, z, "smooth_stone");
    put(x, F + 4, z, "smooth_stone");

    // Glass panes in the window bays, air behind them
    for (const y of [F + 1, F + 3, F + 5]) {
      if (y >= TOP || !isWindowSlot(x, z, y)) continue;
      if (isFront(x, z)) {
        put(x, y, z, "glass_pane", { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" });
      } else {
        put(x, y, z, "glass_pane", { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
      }
    }

    // Street-front entrances: a pair of doors with a stone lintel
    if (z === 0 && DOOR_X.includes(x)) {
      put(x, F + 1, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      put(x, F + 2, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
      put(x, F + 3, z, "stone_bricks");
    }

    // Cornice cap
    if (TOP < H) put(x, TOP, z, "stone_bricks");
  } else {
    // Roof surface over the interior
    if (TOP < H) put(x, TOP, z, "deepslate_tiles");
  }
}

// Warm light behind some windows (interior air cells on the second row)
for (const c of list) {
  const { x, z } = c;
  if (z !== 1 || x < 1 || x > W - 2) continue;
  if (x === 4 || x === 7) put(x, F + 1, z, "lantern", { hanging: "false", waterlogged: "false" });
  if (x === 4 || x === 10) put(x, F + 3, z, "glowstone");
}

// Brick chimney stack rising from the roof deck
{
  const ch = list.find((c) => c.z === 2 && c.x === 6) || list.find((c) => c.z === 2);
  if (ch) {
    put(ch.x, TOP + 1, ch.z, "bricks");
    put(ch.x, TOP + 2, ch.z, "bricks");
    put(ch.x, TOP + 3, ch.z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(`${DIR}/NYC3001470.nbt`);
