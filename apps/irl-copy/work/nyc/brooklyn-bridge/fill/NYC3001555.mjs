import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3001555";
const W = 10, H = 24, D = 6;

// Footprint cells: [x, z, ground, roof]
const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const grounds = raw.map(([, , gr]) => Math.max(0, Math.round(gr)));
const roofs = raw.map(([, , , rf]) => Math.round(rf));

// One flat roof for the whole building (lidar noise removed), at the median lidar height
const sortedRoofs = [...roofs].sort((a, b) => a - b);
const R = Math.min(H - 4, sortedRoofs[Math.floor(sortedRoofs.length / 2)]);

const cells = raw.map(([x, z, gr]) => {
  const g = Math.max(0, Math.round(gr));
  const r = Math.max(R, g + 3);
  return { x, z, g, r };
});

const key = (x, z) => x + "," + z;
const map = new Map(cells.map((c) => [key(c.x, c.z), c]));
const has = (x, z) => map.has(key(x, z));
const base0 = Math.min(...cells.map((c) => c.g));

const g = new Voxels([W, H, D]);

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

const GLASS = "glass_pane";

for (const c of cells) {
  const { x, z, g: gr, r } = c;
  const edge = !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
  const front = !has(x, z - 1);
  const corner = (x === 0 || x === W - 1) && (z === 0 || z === D - 1);

  // Foundation: stone from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Body
  for (let y = gr; y < r - 1; y++) {
    const isBand = y > base0 && (y - base0) % 3 === 0;
    if (!edge) {
      if (isBand) put(x, y, z, "oak_planks");
      continue;
    }
    let b;
    if (y < base0 + 3) b = "brown_terracotta";
    else if (y >= r - 2) b = "smooth_stone";
    else if (isBand) b = "smooth_stone";
    else b = "bricks";
    put(x, y, z, b);

    // Two-high windows in alternating bays, not on corners, below the cornice
    const rel = (y - base0) % 3;
    const inWindowRow = (rel === 1 || rel === 2) && y >= base0 + 1 && y < r - 3;
    if (!corner && inWindowRow && (x + z) % 2 === 1) {
      put(x, y, z, GLASS);
    }

    // Street entrance: brownstone surround, dark oak door, lintel
    if (front) {
      if (x === 4 && (y === gr || y === gr + 1)) {
        const half = y === gr ? "lower" : "upper";
        put(x, y, z, "dark_oak_door", {
          facing: "north", half, hinge: "left", open: "false", powered: "false",
        });
      } else if ((x === 3 || x === 5) && (y === gr || y === gr + 1)) {
        put(x, y, z, "brown_terracotta");
      } else if (x >= 2 && x <= 6 && y === gr + 2) {
        put(x, y, z, "smooth_stone");
      }
    }
  }

  // Roof: cornice cap on the edge, flat roof slab inside
  put(x, r - 1, z, edge ? "smooth_stone" : "stone_bricks");

  // Warm light behind some street-front windows
  if (front && !corner && x % 4 === 1 && has(x, 1) && x >= 1 && x <= W - 2) {
    const ly = base0 + 2;
    if (ly >= gr && ly < r - 3) put(x, ly, 1, "glowstone");
  }
}

// Canopy over the door: slab row projecting inward from the lintel
for (const c of cells) {
  if (c.z === 1 && c.x >= 3 && c.x <= 5 && has(c.x, 0)) {
    const dy = map.get(key(c.x, 0)).g;
    put(c.x, dy + 3, 1, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
  }
}

// Brick chimneys rising from the flat roof
for (const [cx, cz] of [[2, 2], [7, 3]]) {
  if (has(cx, cz)) {
    const c = map.get(key(cx, cz));
    for (let y = c.r; y < c.r + 2; y++) put(cx, y, cz, "bricks");
    put(cx, c.r + 2, cz, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
