import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no record. Lidar roof about 11 blocks above the lowest ground.
// Read as a two-storey, flat-roofed Xinyi-type commercial block (1980s-90s
// concrete frame): granite base, shopfront ground floor with a central
// entrance and canopy, white-concrete upper floor with window bays, a
// cornice parapet, and roof plant on a gray deck.

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw441377785";
const W = 58, H = 23, D = 17;

const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));
const vox = new Voxels([W, H, D]);

const gr = new Map();
for (const [x, z, h] of cells) gr.set(`${x},${z}`, h);
const has = (x, z) => gr.has(`${x},${z}`);
const at = (x, z) => gr.get(`${x},${z}`);

// Interior cell: footprint cell with all four neighbours in the footprint.
const interior = (x, z) =>
  has(x, z) && has(x + 1, z) && has(x - 1, z) && has(x, z + 1) && has(x, z - 1);

const put = (x, y, z, b, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) vox.set(x, y, z, b, p);
  else vox.set(x, y, z, b);
};

const DOOR_X = 28;

// Pass 1: foundations, walls, floors, roof deck.
for (const [x, z, gy] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gy; y++) put(x, y, z, "stone_bricks");

  const edgeN = !has(x, z - 1);
  const edgeS = !has(x, z + 1);
  const edgeW = !has(x - 1, z);
  const edgeE = !has(x + 1, z);
  const boundary = edgeN || edgeS || edgeW || edgeE;

  if (!boundary) {
    put(x, gy, z, "smooth_stone");            // ground floor slab
    put(x, gy + 5, z, "light_gray_concrete"); // first floor slab
    put(x, gy + 10, z, "gray_concrete");      // roof deck
    continue;
  }

  const longFace = edgeN || edgeS;
  const idx = longFace ? x : z;
  const b = gy;

  // Base course and cornice on every wall cell.
  put(x, b, z, "polished_granite");
  put(x, b + 10, z, "smooth_stone");

  // Storey line, upper header.
  put(x, b + 5, z, "smooth_stone");
  put(x, b + 9, z, "white_concrete");

  // Upper floor: window bays with white-concrete piers.
  for (let y = b + 6; y <= b + 8; y++) {
    put(x, y, z, idx % 3 === 0 ? "white_concrete" : "glass_pane");
  }

  if (longFace) {
    // Shopfront ground floor.
    for (let y = b + 1; y <= b + 3; y++) {
      put(x, y, z, idx % 6 === 0 ? "polished_andesite" : "glass");
    }
    put(x, b + 4, z, "smooth_stone"); // lintel

    if (edgeN) {
      // Central entrance on the north face: door, transom, canopy.
      if (x === DOOR_X) {
        put(x, b + 1, z, "dark_oak_door", {
          facing: "south", half: "lower", hinge: "left", open: "false", powered: "false",
        });
        put(x, b + 2, z, "dark_oak_door", {
          facing: "south", half: "upper", hinge: "left", open: "false", powered: "false",
        });
      }
      if (x >= DOOR_X - 2 && x <= DOOR_X + 1 && x !== DOOR_X) {
        put(x, b + 1, z, "polished_andesite");
        put(x, b + 2, z, "polished_andesite");
      }
      if (x >= DOOR_X - 2 && x <= DOOR_X + 2) {
        put(x, b + 3, z, "glass"); // transom
      }
      // Canopy posts and slab.
      if (x === DOOR_X - 3 || x === DOOR_X + 4) {
        for (let y = b + 1; y <= b + 3; y++) put(x, y, z, "polished_andesite");
      }
      if (x >= DOOR_X - 3 && x <= DOOR_X + 4) {
        put(x, b + 4, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
      }
    }
  } else {
    // End walls: solid ground floor with narrow glazing.
    for (let y = b + 1; y <= b + 4; y++) put(x, y, z, "stone_bricks");
    if (idx % 4 === 2) {
      put(x, b + 2, z, "glass_pane");
      put(x, b + 3, z, "glass_pane");
    }
    put(x, b + 4, z, "smooth_stone");
  }
}

// Pass 2: warm lights behind some glass (on the floor, two cells inside).
for (const [x, z, gy] of cells) {
  const edgeN = !has(x, z - 1);
  const edgeS = !has(x, z + 1);
  const edgeW = !has(x - 1, z);
  const edgeE = !has(x + 1, z);
  if (!(edgeN || edgeS || edgeW || edgeE)) continue;

  const longFace = edgeN || edgeS;
  const idx = longFace ? x : z;
  if (idx % 9 !== 4) continue;

  if (longFace) {
    const s = edgeN ? 1 : -1;
    if (interior(x, z + 2 * s)) {
      put(x, gy + 6, z + 2 * s, "glowstone");   // upper floor, behind window
      if (edgeS || x % 18 === 4) put(x, gy + 1, z + 2 * s, "glowstone"); // shop
    }
  } else {
    const s = edgeW ? 1 : -1;
    if (interior(x + 2 * s, z)) {
      put(x + 2 * s, gy + 6, z, "glowstone");
    }
  }
}

// Pass 3: roof plant on the gray deck (interior cells only).
for (const [x, z, gy] of cells) {
  const inBoxA = x >= 8 && x <= 11 && z >= 5 && z <= 7;
  const inBoxB = x >= 40 && x <= 45 && z >= 9 && z <= 11;
  if (!(inBoxA || inBoxB) || !interior(x, z)) continue;
  put(x, gy + 11, z, "light_gray_concrete");
  put(x, gy + 12, z, inBoxB ? "iron_block" : "light_gray_concrete");
}

vox.save(`${dir}/${id}.nbt`);
