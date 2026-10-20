import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no archive entry. Lidar roof ~11 blocks above lowest ground.
// Read as a two-storey mid-century Taipei commercial block (pre-tower Xinyi
// low-rise): white concrete frame and bays, stone base, glass shopfront and
// punched upper windows, a cornice and a parapet, a central entrance with a
// canopy, and a roof plant box.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1038711401";
const W = 29, H = 23, D = 30;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const k = (x, z) => `${x},${z}`;
const ground = new Map();
let minX = Infinity, minZ = Infinity, maxG = -Infinity;
for (const [x, z, gr] of cells) {
  ground.set(k(x, z), gr);
  minX = Math.min(minX, x);
  minZ = Math.min(minZ, z);
  maxG = Math.max(maxG, gr);
}
const inFp = (x, z) => ground.has(k(x, z));
const gOf = (x, z) => ground.get(k(x, z));

// Roof at 11 above lowest ground; keep it clear of the ground-up stack.
const ROOF = Math.min(H - 3, Math.max(11, maxG + 6));

function put(x, y, z, block, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
}

function faces(x, z) {
  const N = !inFp(x, z - 1);
  const S = !inFp(x, z + 1);
  const Wf = !inFp(x - 1, z);
  const E = !inFp(x + 1, z);
  return { N, S, W: Wf, E, n: [N, S, Wf, E].filter(Boolean).length };
}

const paneProps = (f) => {
  // Panes run along the face they sit in.
  const alongX = f.N || f.S;
  return {
    north: alongX ? "false" : "true",
    south: alongX ? "false" : "true",
    east: alongX ? "true" : "false",
    west: alongX ? "true" : "false",
    waterlogged: "false",
  };
};

for (const [x, z, gr] of cells) {
  const f = faces(x, z);
  const edge = f.n > 0;

  // 1. Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // 2. Interior floors (edge cells handled below).
  if (!edge) {
    put(x, gr, z, "smooth_stone");
    if (gr < 5) put(x, 5, z, "smooth_stone");
    put(x, ROOF, z, "smooth_stone"); // roof deck
    // Roof plant box on the deck, interior only.
    if (x >= 8 && x <= 11 && z >= 9 && z <= 12) {
      put(x, ROOF + 1, z, "light_gray_concrete");
      if (x >= 9 && x <= 10 && z >= 10 && z <= 11) put(x, ROOF + 2, z, "light_gray_concrete");
    }
    continue;
  }

  const corner = f.n >= 2;
  const along = (f.N || f.S) ? x - minX : z - minZ;
  const mull = along % 4 === 0;
  const onNorth = f.N && !corner;
  const entranceX = onNorth && along >= 12 && along <= 16;
  const doorX = onNorth && along === 14;
  // Inward cell for glowing lamps behind the glass.
  const inX = f.W ? x + 1 : f.E ? x - 1 : x;
  const inZ = f.N ? z + 1 : f.S ? z - 1 : z;
  const lampInside = !corner && inFp(inX, inZ) && !faces(inX, inZ).n;

  for (let y = gr; y <= ROOF; y++) {
    if (y === ROOF) {
      put(x, y, z, "white_concrete"); // parapet
    } else if (y === gr) {
      put(x, y, z, "smooth_stone"); // base course
    } else if (y === 10) {
      put(x, y, z, "smooth_stone_slab", { type: "top", waterlogged: "false" }); // cornice
    } else if (y === 5) {
      put(x, y, z, "smooth_stone"); // storey line
    } else if (corner) {
      put(x, y, z, "white_concrete"); // quoin pillar
    } else if (y < 5) {
      // Ground storey: shopfront.
      if (doorX && y === gr + 1 && gr + 2 < 5) {
        put(x, y, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      } else if (doorX && y === gr + 2 && gr + 2 < 5) {
        put(x, y, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
      } else if (entranceX && y === gr + 3) {
        put(x, y, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" }); // canopy
      } else if (mull) {
        put(x, y, z, "white_concrete");
      } else if (y === 4) {
        put(x, y, z, "white_concrete"); // lintel
      } else {
        put(x, y, z, "glass_pane", paneProps(f));
      }
      if (lampInside && !mull && y === gr + 2 && along % 8 === 2 && !entranceX && gr + 2 < 5) {
        put(inX, y, inZ, "glowstone");
      }
    } else {
      // Upper storey: punched windows.
      if (mull) {
        put(x, y, z, "white_concrete");
      } else if (y === 6) {
        put(x, y, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" }); // sill
      } else {
        put(x, y, z, "glass_pane", paneProps(f));
        if (lampInside && y === 8 && along % 8 === 2) put(inX, y, inZ, "glowstone");
      }
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
