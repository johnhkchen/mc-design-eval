import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Shophouse-type commercial block, c.1980s: two storeys over a shop-glass ground floor,
// white tiled/concrete walls, a granite plinth, a stone string course and cornice,
// blue-tinted glazing with white mullions, and a roof with a small AC plant.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1156915591";
const W = 26, H = 23, D = 8;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, g] of cells) ground.set(`${x},${z}`, g);
const has = (x, z) => ground.has(`${x},${z}`);
const minG = Math.min(...ground.values());

// Storey levels, measured from the lowest ground (roof top ~ minG + 11).
const L1 = minG + 5;   // first-floor slab / string course
const L2 = minG + 10;  // cornice course; its top face is the roof at minG + 11
const ENTRANCE_X = 13;

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};
const pane = (facadeNS) => facadeNS
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

for (const [x, z, gr] of cells) {
  const ex = {
    n: !has(x, z - 1), s: !has(x, z + 1),
    w: !has(x - 1, z), e: !has(x + 1, z),
  };
  const exterior = ex.n || ex.s || ex.w || ex.e;
  const northSouth = ex.n || ex.s;
  const col = northSouth ? x : z;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr && y < H; y++) put(x, y, z, "stone_bricks");

  const top = Math.max(L2, gr);
  for (let y = gr; y <= top && y < H; y++) {
    if (y === gr) {
      // Plinth course (exterior) or floor slab (interior).
      put(x, y, z, exterior ? "polished_granite" : "light_gray_concrete");
      continue;
    }
    if (y === top) {
      // Cornice / roof slab.
      put(x, y, z, exterior ? "smooth_stone" : "light_gray_concrete");
      continue;
    }
    if (y === L1) {
      // Floor slab between storeys.
      put(x, y, z, exterior ? "smooth_stone" : "light_gray_concrete");
      continue;
    }
    if (!exterior) continue; // interior: air gap

    if (y < L1) {
      // Ground-floor shopfront.
      if (northSouth) {
        if (col === ENTRANCE_X && y <= gr + 2) continue; // recessed entrance
        if (y === L1 - 1) { put(x, y, z, "white_concrete"); continue; } // fascia band
        if (col % 4 === 0) put(x, y, z, "white_concrete");
        else put(x, y, z, "glass_pane", pane(true));
      } else {
        put(x, y, z, "white_concrete");
      }
      continue;
    }

    // Upper storey.
    if (y === L1 + 1 || y === L2 - 1) { put(x, y, z, "white_concrete"); continue; } // sill / lintel
    if (northSouth && col % 3 !== 0) {
      put(x, y, z, "light_blue_stained_glass_pane", pane(true));
    } else if (!northSouth && z % 3 === 1 && (ex.w || ex.e)) {
      put(x, y, z, "light_blue_stained_glass_pane", pane(false));
    } else {
      put(x, y, z, "white_concrete");
    }
  }
}

// Warm light behind some glass: shroomlights on the interior side of the street facade.
for (const [x, z] of [...ground.keys()].map((k) => k.split(",").map(Number))) {
  if (z !== 0 || has(x, z - 1) || !has(x, 1)) continue;
  if (x === ENTRANCE_X) continue;
  if (x % 6 === 1) put(x, L1 + 2, 1, "shroomlight");
  if (x % 6 === 4) put(x, minG + 2, 1, "shroomlight");
}

// Rooftop AC plant on the interior roof, standing on the roof slab.
for (let x = 9; x <= 11; x++) for (let z = 2; z <= 5; z++) {
  if (!has(x, z)) continue;
  if (x === 9 || x === 11) put(x, L2 + 1, z, "light_gray_concrete");
  else put(x, L2 + 1, z, "iron_block");
}

g.save(`${DIR}/${ID}.nbt`);
