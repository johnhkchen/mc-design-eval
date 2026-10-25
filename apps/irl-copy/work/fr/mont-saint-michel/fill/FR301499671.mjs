import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const ID = "FR301499671";
const W = 14, H = 34, D = 13;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const map = new Map();
for (const [x, z, gr, roof] of cells) {
  map.set(`${x},${z}`, { g: Math.round(gr), r: Math.round(roof) });
}
const has = (x, z) => map.has(`${x},${z}`);
const perim = (x, z) => !(has(x - 1, z) && has(x + 1, z) && has(x, z - 1) && has(x, z + 1));

// Flat common roof tier from lidar: median height above each cell's ground, snapped to 5-block storeys
const heights = [...map.values()].map((c) => c.r - c.g).sort((a, b) => a - b);
const med = heights[Math.floor(heights.length / 2)] ?? 20;
const storeys = Math.max(1, Math.round(med / 5));
const baseG = Math.min(...[...map.values()].map((c) => c.g));
const T = baseG + storeys * 5;

const g = new Voxels([W, H, D]);
const S = (x, y, z, b, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

const GLASS = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };

// Front = highest z row; entrance on the central column if present
const frontZ = Math.max(...cells.map((c) => c[1]));
const doorX = has(Math.floor(W / 2), frontZ) ? Math.floor(W / 2) : cells.find((c) => c[1] === frontZ)[0];

// One chimney stack on an interior cell
let chimney = null;
for (const [x, z] of cells) {
  if (!perim(x, z) && (x + z) % 5 === 0) { chimney = [x, z]; break; }
}

for (const [x, z] of cells) {
  const { g: G } = map.get(`${x},${z}`);
  const Tc = Math.min(31, Math.max(T, G + 5));
  const per = perim(x, z);

  // Rubble-stone foundation down to the ground line, then the ground floor slab
  for (let y = 0; y < G; y++) S(x, y, z, "cobblestone");
  S(x, G, z, "stone_bricks");

  for (let y = G + 1; y <= Tc - 2; y++) {
    const rel = y - G;
    const m = rel % 5;
    if (!per) {
      // interior: open air gap, floor slab at each storey line
      if (m === 0) S(x, y, z, "stone_bricks");
      continue;
    }
    let blk = "stone_bricks";
    let props;
    if (m === 4) {
      blk = "chiseled_stone_bricks"; // string course under each storey
    } else if (m === 1 || m === 2 || m === 3) {
      const ground = rel < 5;
      const pilaster = ground ? (x + z) % 4 === 1 : (x + z) % 2 === 1;
      if (pilaster) {
        blk = "polished_andesite";
      } else if (ground && x === doorX && z === frontZ && (rel === 1 || rel === 2)) {
        blk = null; // door placed below
      } else if (m === 1) {
        // window sill
        blk = "stone_brick_slab";
        props = { type: "bottom", waterlogged: "false" };
      } else {
        blk = "glass_pane";
        props = GLASS;
        // a few warm-lit windows, middle row only, so they read as lamplight
        if (!ground && m === 2 && (x * 3 + z + rel) % 9 === 0) blk = "glowstone";
      }
    }
    if (blk) S(x, y, z, blk, props);
  }

  // Cornice, parapet, and roof
  if (per) {
    S(x, Tc - 1, z, "polished_andesite");
    S(x, Tc, z, "stone_brick_wall");
  } else {
    S(x, Tc - 1, z, "stone_bricks");
    S(x, Tc, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

// Entrance: door, then a canopy carried over the front on three columns
if (has(doorX, frontZ)) {
  const G = map.get(`${doorX},${frontZ}`).g;
  S(doorX, G + 1, frontZ, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  S(doorX, G + 2, frontZ, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  for (const dx of [-1, 0, 1]) {
    if (has(doorX + dx, frontZ)) {
      S(doorX + dx, G + 3, frontZ, "dark_oak_slab", { type: "top", waterlogged: "false" });
      S(doorX + dx, G + 4, frontZ, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
    }
  }
  // lantern under the canopy beside the door
  const lx = doorX + 1;
  if (has(lx, frontZ)) S(lx, G + 2, frontZ, "lantern", { hanging: "true", waterlogged: "false" });
}

// Roof equipment: single brick chimney stack
if (chimney) {
  const [cx, cz] = chimney;
  const { g: G } = map.get(`${cx},${cz}`);
  const Tc = Math.min(31, Math.max(T, G + 5));
  if (Tc + 2 <= H - 1) {
    S(cx, Tc + 1, cz, "bricks");
    S(cx, Tc + 2, cz, "bricks");
  }
}

g.save(`${DIR}/${ID}.nbt`);
