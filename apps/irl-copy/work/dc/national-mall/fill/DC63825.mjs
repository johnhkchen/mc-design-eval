import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC63825.cells.json`, "utf8"));

const W = 4, H = 29, D = 18;
const g = new Voxels([W, H, D]);

const put = (x, y, z, id, p) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

const key = (x, z) => `${x},${z}`;
const cellMap = new Map();
for (const c of cells) cellMap.set(key(c[0], c[1]), c);
const hasCell = (x, z) => cellMap.has(key(x, z));

const GLASS_SIDE = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const GLASS_END = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

// Storey grid: 4 blocks per storey, anchored on the lowest ground so floors line up across the footprint.
const gmin = Math.min(...cells.map(c => c[2]));
const STOREY = 4;

// Snap each cell's roof to whole storeys for clean tiers.
const snapRoof = (gr, rf) => {
  const n = Math.max(1, Math.round((rf - gmin) / STOREY));
  return gmin + STOREY * n;
};

// Window columns: side facades (x = 0, 3) carry windows between brick piers every 3 blocks;
// end facades (z = 0, 17) carry windows on x = 1..2. Ground floor side is a continuous shopfront.
function glazedSide(z, s) {
  return z >= 1 && z <= 16 && (s === 0 || z % 3 !== 0);
}

for (const [x, z, gr, rf] of cells) {
  const T = Math.min(snapRoof(gr, rf), H - 3);
  const side = x === 0 || x === 3;
  const endZ = z === 0 || z === 17;
  const shell = side || endZ;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  for (let y = gr; y < T; y++) {
    const rel = y - gmin;
    const r = ((rel % STOREY) + STOREY) % STOREY;
    const s = Math.floor(rel / STOREY);
    const top = y >= T - 2;

    if (!shell) {
      // Interior: floor slab on each storey line, solid roof deck at the top, air between.
      if (top) put(x, y, z, "stone_bricks");
      else if (r === 0 || y === gr) put(x, y, z, "smooth_stone");
      continue;
    }

    // Shell.
    if (y === T - 1) { put(x, y, z, "stone_bricks"); continue; }      // parapet cap
    if (r === 0) { put(x, y, z, s === 0 ? "polished_andesite" : "stone_bricks"); continue; } // storey line
    if (r === 3) { put(x, y, z, "bricks"); continue; }                // spandrel

    // r = 1 or 2: glazing band.
    if (s === 0 && z === 0 && x === 1) {
      const half = r === 1 ? "lower" : "upper";
      put(x, y, z, "oak_door", { facing: "north", half, hinge: "left", open: "false", powered: "false" });
      continue;
    }

    let glazed = false;
    if (side && !endZ) glazed = glazedSide(z, s);
    else if (endZ && !side) glazed = true;

    if (glazed) put(x, y, z, "glass_pane", side ? GLASS_SIDE : GLASS_END);
    else put(x, y, z, "bricks");
  }

  // Warm lights behind some glazing on the interior side (x = 1).
  if (side && !endZ && x === 0 && hasCell(1, z)) {
    for (let y = gr; y < T - 2; y++) {
      const rel = y - gmin;
      const r = ((rel % STOREY) + STOREY) % STOREY;
      const s = Math.floor(rel / STOREY);
      if ((r === 1 || r === 2) && z % 6 === 2 && glazedSide(z, s)) put(1, y, z, "glowstone");
    }
  }

  // Roof plant: a small box on the interior roof deck, standing on the roof slab.
  if (!side && !endZ && (x === 1 || x === 2) && (z === 8 || z === 9)) {
    put(x, T, z, "light_gray_concrete");
    put(x, T + 1, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/DC63825.nbt`);
