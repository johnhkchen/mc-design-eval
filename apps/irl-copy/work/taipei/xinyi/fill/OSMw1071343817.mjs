import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw1071343817";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

const W = 11, H = 23, D = 21;
const g = new Voxels([W, H, D]);

// Palette: a two-storey post-2000 Xinyi commercial block, white-tiled concrete,
// stone base, blue-tinted glazing, stone coping, rooftop plant enclosure.
const WALL = "white_concrete";
const BAND = "smooth_stone";
const BASE = "polished_andesite";
const FOUND = "stone_bricks";
const WIN = "light_blue_stained_glass_pane";
const SHOP = "glass";
const PIER = "light_gray_concrete";
const ROOFBOX = "light_gray_concrete";
const LIGHT = "glowstone";

const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);
const has = (x, z) => G.has(`${x},${z}`);

function put(x, y, z, block, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
}

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr && y < H; y++) put(x, y, z, FOUND);

  const missN = !has(x, z - 1); // front (street-facing) face
  const missS = !has(x, z + 1);
  const missW = !has(x - 1, z);
  const missE = !has(x + 1, z);
  const nMiss = [missN, missS, missW, missE].filter(Boolean).length;
  const perim = nMiss > 0;

  if (!perim) {
    // Interior: storey floor slab at y=5, roof deck at y=10.
    if (gr <= 5) put(x, 5, z, BAND);
    if (gr <= 10) put(x, 10, z, BAND);
    continue;
  }

  // Window rhythm: odd-indexed bays are windows, even are piers.
  const isWinZFace = missN || missS;
  const bayIdx = isWinZFace ? x : z;
  const isWin = nMiss < 2 && bayIdx % 2 === 1;
  const isEntrance = missN && x === 5;

  for (let y = gr; y <= 11; y++) {
    if (y === 11) {
      put(x, y, z, "smooth_stone_slab", { type: "top", waterlogged: "false" });
      continue;
    }
    if (y === 10) {
      put(x, y, z, WALL);
      continue;
    }
    if (y === gr) {
      put(x, y, z, BASE);
      continue;
    }
    if (y === 5) {
      put(x, y, z, BAND);
      continue;
    }

    if (nMiss >= 2) {
      put(x, y, z, PIER);
      continue;
    }

    if (y <= 4) {
      // Ground storey.
      if (y === 4) {
        put(x, y, z, WALL);
        continue;
      }
      if (missN) {
        if (isEntrance && y <= gr + 2) {
          const half = y === gr + 1 ? "lower" : y === gr + 2 ? "upper" : null;
          if (half) {
            put(x, y, z, "iron_door", {
              facing: "north", half, hinge: "left", open: "false", powered: "false",
            });
          } else {
            put(x, y, z, WALL);
          }
        } else if (x >= 2 && x <= 8) {
          put(x, y, z, SHOP);
        } else {
          put(x, y, z, WALL);
        }
      } else if (isWin && y >= gr + 1 && y <= 3) {
        put(x, y, z, WIN);
      } else {
        put(x, y, z, WALL);
      }
      continue;
    }

    // Upper storey (y 6..9).
    if (y === 9) {
      put(x, y, z, WALL);
      continue;
    }
    if (isWin && y >= 6 && y <= 8) {
      put(x, y, z, WIN);
    } else {
      put(x, y, z, WALL);
    }
  }
}

// Rooftop plant enclosure, set back from the parapet on the roof deck.
for (const [x, z, gr] of cells) {
  const interior =
    has(x, z - 1) && has(x, z + 1) && has(x - 1, z) && has(x + 1, z);
  if (!interior || gr > 10) continue;
  if (x >= 3 && x <= 7 && z >= 8 && z <= 12) {
    put(x, 11, z, ROOFBOX);
    put(x, 12, z, ROOFBOX);
  }
}

// Warm light behind selected upper-floor windows on the street face.
for (const [x, z, gr] of cells) {
  if (z !== 0 || !has(x, z - 1) === false) {
    // only street-face windows
  }
  const missN = !has(x, z - 1);
  if (!missN) continue;
  if (x % 4 === 1 && has(x, z + 1) && gr <= 6) {
    put(x, 7, z + 1, LIGHT);
  }
}

// Warm ground-floor interior glow behind the shopfront.
for (const [x, z, gr] of cells) {
  const missN = !has(x, z - 1);
  if (!missN) continue;
  if ((x === 3 || x === 7) && has(x, z + 1) && gr <= 1) {
    put(x, gr + 2, z + 1, LIGHT);
  }
}

g.save(`${dir}/${id}.nbt`);
