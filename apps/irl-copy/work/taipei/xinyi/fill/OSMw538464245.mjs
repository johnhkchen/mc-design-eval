import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Narrow Taipei shophouse, c. 1960s-70s: white-tile body, red terracotta
// string courses, shopfront on the street (north) face, two storeys above
// the ground band, flat roof with parapet and a small water tank.
const W = 5, H = 23, D = 19;
const ROOF = 11;          // parapet cap top (absolute y)
const SLAB_A = 5;         // floor line between ground band and storey 2
const SLAB_B = 10;        // roof deck / cornice line

const BODY = "white_concrete";
const TRIM = "red_terracotta";
const FRAME = "gray_concrete";
const BASE = "stone_bricks";
const PLINTH = "polished_andesite";
const GLASS = "glass_pane";
const DECK = "light_gray_concrete";
const TANK = "white_concrete";
const LID = "smooth_stone_slab";

const SRC = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw538464245.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw538464245.nbt";

const cells = JSON.parse(readFileSync(SRC, "utf8"));
const fp = new Map();
for (const [x, z, gr] of cells) fp.set(`${x},${z}`, Math.max(0, Math.round(gr)));
const has = (x, z) => fp.has(`${x},${z}`);

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Exterior directions: n = street face (z-1 side), s, w, e
for (const [key, gr] of fp) {
  const [x, z] = key.split(",").map(Number);
  const N = !has(x, z - 1);
  const S = !has(x, z + 1);
  const Wx = !has(x - 1, z);
  const E = !has(x + 1, z);
  const edge = N || S || Wx || E;

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, BASE);

  // Floor slabs and roof deck on every cell that reaches that height
  if (gr <= SLAB_A) put(x, SLAB_A, z, edge ? TRIM : DECK);
  if (gr <= SLAB_B) put(x, SLAB_B, z, edge ? TRIM : DECK);

  if (!edge) {
    // Interior: only slabs (above) plus roof equipment below
    continue;
  }

  // Exterior walls from ground to parapet
  for (let y = gr; y <= SLAB_B; y++) {
    if (y === gr) { put(x, y, z, PLINTH); continue; }
    if (y === SLAB_A || y === SLAB_B) continue; // already set above
    if (y === 4) { put(x, y, z, FRAME); continue; } // lintel over shops
    if (y < 4) {
      // Ground band
      if (N) {
        if (x === 2 && y === gr + 1) {
          put(x, y, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
        } else if (x === 2 && y === gr + 2) {
          put(x, y, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
        } else if (x === 2) {
          put(x, y, z, GLASS);
        } else if (x === 0 || x === 4) {
          put(x, y, z, FRAME);
        } else if (y >= gr + 1 && y <= 3) {
          put(x, y, z, GLASS);
          // warm light behind the shop glass
          if ((x === 1 || x === 3) && y === gr + 2 && has(x, z + 1)) {
            put(x, y, z + 1, "shroomlight");
          }
        } else {
          put(x, y, z, BODY);
        }
      } else {
        // Sides and back: small windows on the upper half of the ground band
        const c = (N || S) ? x : z;
        const isWin = (N || S) ? (x > 0 && x < 4) : (c % 3 !== 0);
        if (isWin && (y === 2 || y === 3) && y >= gr + 1) put(x, y, z, GLASS);
        else put(x, y, z, BODY);
      }
      continue;
    }
    // Storey 2 band, y 6..9
    if (y === 6 || y === 9) { put(x, y, z, FRAME); continue; }
    // y === 7 or 8: window band
    const c = (N || S) ? x : z;
    const isWin = (N || S) ? (x > 0 && x < 4) : (c % 3 !== 0);
    if (isWin) {
      put(x, y, z, GLASS);
      if (y === 7 && c % 6 === 2) {
        // warm glow behind window on the inward side
        const ix = Wx ? 1 : E ? -1 : 0;
        const iz = N ? 1 : S ? -1 : 0;
        if (has(x + ix, z + iz)) put(x + ix, y, z + iz, "glowstone");
      }
    } else {
      put(x, y, z, BODY);
    }
  }

  // Parapet cap
  for (let y = SLAB_B + 1; y <= ROOF; y++) {
    put(x, y, z, y === ROOF ? TRIM : BODY);
  }
}

// Roof water tank and its lid, set in from the parapet
for (let x = 1; x <= 3; x++) {
  for (let z = 14; z <= 16; z++) {
    if (!has(x, z)) continue;
    put(x, SLAB_B + 1, z, TANK);
    put(x, SLAB_B + 2, z, TANK);
    put(x, SLAB_B + 3, z, LID, { type: "bottom", waterlogged: "false" });
  }
}

g.save(OUT);
