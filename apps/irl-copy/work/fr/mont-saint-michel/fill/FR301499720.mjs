import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const ID = "FR301499720";
const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 6, H = 22, D = 9;
const cellMap = new Map();
for (const [x, z, gr, r] of raw) cellMap.set(`${x},${z}`, { g: gr, r });
const inB = (x, z) => cellMap.has(`${x},${z}`);
const groundAt = (x, z) => (cellMap.get(`${x},${z}`)?.g ?? 0);

// Roof height: median of lidar roof values, flattened to one roof line.
const roofVals = raw.map((c) => c[3]).sort((a, b) => a - b);
const rh = Math.max(8, roofVals[Math.floor(roofVals.length / 2)] || 10);
const top = rh - 2;      // top of stone walls / roof base
const ridge = top + 2;   // ridge block layer

const g = new Voxels([W, H, D]);

const stairProps = (facing) => ({ facing, half: "bottom", shape: "straight", waterlogged: "false" });
const paneNS = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const paneEW = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

// Deterministic weathering so the stone is not a flat texture.
const wallBlock = (x, y, z) => {
  const h = (x * 7 + y * 13 + z * 31) % 11;
  if (h === 0) return "cracked_stone_bricks";
  if (h === 6 && y <= 2) return "mossy_stone_bricks";
  return "stone_bricks";
};

// 1. Solid stone body, base course, storey bands, and gable roof per column.
for (const [key] of cellMap) {
  const [x, z] = key.split(",").map(Number);
  const edge = x === 0 || x === W - 1 || z === 0 || z === D - 1;
  for (let y = 0; y < top; y++) {
    let b = wallBlock(x, y, z);
    if (y === 0 && edge) b = "polished_granite";
    if ((y === 3 || y === 6) && edge) b = "chiseled_stone_bricks";
    g.set(x, y, z, b);
  }
  if (x === 0 || x === W - 1) {
    const face = x === 0 ? "west" : "east";
    g.set(x, top, z, "deepslate_tile_stairs", stairProps(face));
  } else if (x === 1 || x === W - 2) {
    const face = x === 1 ? "west" : "east";
    g.set(x, top, z, "deepslate_tiles");
    g.set(x, top + 1, z, "deepslate_tile_stairs", stairProps(face));
  } else {
    g.set(x, top, z, "deepslate_tiles");
    g.set(x, top + 1, z, "deepslate_tiles");
    g.set(x, ridge, z, "deepslate_tiles");
  }
}

// 2. Interior: air behind the glass, timber floor slabs per storey, ceiling at wall top.
for (let x = 1; x <= W - 2; x++) {
  for (let z = 1; z <= D - 2; z++) {
    if (!inB(x, z)) continue;
    const gr = groundAt(x, z);
    for (const y of [1, 2, 4, 5, 7]) {
      if (y >= gr) g.set(x, y, z, "air");
    }
    g.set(x, 3, z, "spruce_planks");
    g.set(x, 6, z, "spruce_planks");
  }
}

// 3. Windows: side facades get paired panes between stone piers; street and rear
//    fronts keep stone piers so the walls read as solid masonry.
const win = (x, z, y, props) => {
  if (!inB(x, z)) return;
  if (y <= groundAt(x, z) || y >= top) return;
  g.set(x, y, z, "glass_pane", props);
};

const lowRows = [1, 2];
const midRows = [4, 5];
for (const y of [...lowRows, ...midRows, 7]) {
  for (const z of [2, 3, 5, 6]) {
    win(0, z, y, paneNS);
    win(W - 1, z, y, paneNS);
  }
}
// Street front (z=0): pier at x=0,3,5; windows at x=1 and x=4; door bay at x=2.
for (const y of [...lowRows, ...midRows]) {
  win(1, 0, y, paneEW);
  win(4, 0, y, paneEW);
}
// Rear (z=8): windows at x=1 and x=4 only.
for (const y of [...lowRows, ...midRows]) {
  win(1, D - 1, y, paneEW);
  win(4, D - 1, y, paneEW);
}

// 4. Entrance: door at x=2 on the street front, flanked by granite pilasters.
if (inB(2, 0)) {
  g.set(1, 1, 0, "polished_granite");
  g.set(1, 2, 0, "polished_granite");
  g.set(3, 1, 0, "polished_granite");
  g.set(3, 2, 0, "polished_granite");
  g.set(2, 3, 0, "stone_brick_slab", { type: "top", waterlogged: "false" });
  g.set(2, 1, 0, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(2, 2, 0, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  // Lantern just inside the door, lighting the hall at dusk.
  if (inB(2, 1)) g.set(2, 2, 1, "lantern", { hanging: "true", waterlogged: "false" });
}

// 5. Warm light behind some panes.
if (inB(1, 2)) g.set(1, 2, 2, "glowstone");
if (inB(4, 6)) g.set(4, 5, 6, "shroomlight");
if (inB(1, 6)) g.set(1, 5, 6, "glowstone");

// 6. Chimney stack rising from the ridge.
if (inB(2, 6)) {
  g.set(2, ridge + 1, 6, "stone_bricks");
  g.set(2, ridge + 2, 6, "stone_bricks");
}

g.save(`${DIR}/${ID}.nbt`);
