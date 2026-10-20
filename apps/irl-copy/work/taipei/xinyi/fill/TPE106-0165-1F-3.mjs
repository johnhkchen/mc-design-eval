import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// TPE106-0165-1F-3: 2017 low-rise Xinyi mixed-use block.
// One ground storey of shopfront glazing with a stone base, a concrete cornice
// ledge, a parapet, and a roof deck with a small plant enclosure, about 7 blocks tall.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE106-0165-1F-3";
const W = 14, H = 19, D = 26;

const STOREY = 5;   // ground storey height, cornice line
const TOP = 7;      // parapet top, roof is ~7 blocks above lowest ground

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const minG = Math.min(...raw.map((c) => c[2]));
const cellG = new Map();
for (const [x, z, gr] of raw) cellG.set(`${x},${z}`, Math.round(gr - minG));

const has = (x, z) => cellG.has(`${x},${z}`);
const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// Entrance: the north-facing (min z) perimeter cell on the central column.
let ex = null, ez = null;
for (let z = 0; z < D; z++) {
  if (has(7, z) && isEdge(7, z)) { ex = 7; ez = z; break; }
}

const glassPane = (x, z) => ({
  north: has(x, z - 1) ? "true" : "false",
  south: has(x, z + 1) ? "true" : "false",
  east: has(x + 1, z) ? "true" : "false",
  west: has(x - 1, z) ? "true" : "false",
});

// Mullion rule: a perimeter cell is a pillar when it sits on the regular bay grid
// of the face it belongs to. Corners are always pillars.
const isMullion = (x, z) => {
  const zFace = !has(x, z - 1) || !has(x, z + 1);
  const xFace = !has(x - 1, z) || !has(x + 1, z);
  if (zFace && xFace) return true;
  if (zFace) return x % 3 === 0;
  if (xFace) return z % 3 === 0;
  return false;
};

for (const [key, gc] of cellG) {
  const [x, z] = key.split(",").map(Number);
  const edge = isEdge(x, z);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gc; y++) put(x, y, z, "stone_bricks");

  // Cells standing above the roof line are only a plinth stub.
  if (gc >= TOP) continue;

  if (!edge) {
    // Interior: ground floor slab and roof deck, air gap between.
    put(x, gc, z, "smooth_stone");
    if (gc < STOREY) put(x, STOREY, z, "smooth_stone");

    // Warm light just inside the facade, on a loose pattern.
    const nearWall = isEdge(x - 1, z) || isEdge(x + 1, z) || isEdge(x, z - 1) || isEdge(x, z + 1);
    if ((x * 3 + z * 5) % 7 === 0 && nearWall && gc + 1 <= 3) {
      put(x, gc + 1, z, "glowstone");
    }

    // Roof plant enclosure in the middle of the deck.
    if (x >= 5 && x <= 8 && z >= 9 && z <= 16 && gc <= STOREY) {
      put(x, STOREY + 1, z, "light_gray_concrete");
      put(x, STOREY + 2, z, "iron_bars");
    }
    continue;
  }

  // Perimeter facade.
  // Stone base course at the cell's ground.
  put(x, gc, z, "polished_andesite");

  const isEntrance = x === ex && z === ez;
  // Door surround: the cells flanking the entrance on the same face get stone-brick jambs.
  const isJamb = ez !== null && z === ez && (x === ex - 1 || x === ex + 1);
  const mull = isMullion(x, z);

  // Shopfront: glass band with concrete pillars, lintel at y 4.
  for (let y = gc + 1; y <= 3; y++) {
    if (isEntrance && (y === gc + 1 || y === gc + 2)) continue; // door opening
    if (isJamb) { put(x, y, z, "stone_bricks"); continue; }
    if (mull) put(x, y, z, "white_concrete");
    else put(x, y, z, "light_blue_stained_glass_pane", glassPane(x, z));
  }
  if (gc + 1 <= 4) put(x, 4, z, "white_concrete");
  // Stone lintel course directly over the entrance surround.
  if (ez !== null && z === ez && Math.abs(x - ex) <= 1 && gc + 3 <= 3) {
    put(x, gc + 3, z, "stone_brick_slab", { type: "top" });
  }

  // Entrance: double-height door with a hanging lantern under the lintel.
  if (isEntrance && gc + 2 <= 3) {
    put(x, gc + 1, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, gc + 2, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
    if (gc + 3 <= 3) put(x, gc + 3, z, "lantern", { hanging: "true" });
  }

  // Cornice: a stepped ledge at the storey line (slab course) over a concrete band.
  if (gc < STOREY) {
    put(x, STOREY, z, "gray_concrete");
    put(x, STOREY + 1, z, "stone_brick_slab", { type: "bottom" });
  }

  // Parapet with a quartz cap at the top of the building.
  if (gc <= TOP - 2) {
    put(x, STOREY + 1, z, "white_concrete");
    put(x, TOP, z, "smooth_quartz");
  }
}

g.save(`${DIR}/${ID}.nbt`);
