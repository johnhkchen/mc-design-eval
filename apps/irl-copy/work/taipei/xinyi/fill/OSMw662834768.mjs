import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Office tower, c. 1990s Taipei: white concrete frame, blue-grey glazing,
// granite base, flat roof with cornice and a central plant penthouse.
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw662834768.cells.json", "utf8"));

const W = 18, H = 33, D = 24;
const g = new Voxels([W, H, D]);

const put = (x, y, z, id, props) => {
  if (y < 0 || y >= H || x < 0 || x >= W || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const has = (x, z) => ground.has(key(x, z));

const minG = Math.min(...cells.map((c) => c[2]));
const xs = cells.map((c) => c[0]), zs = cells.map((c) => c[1]);
const minX = Math.min(...xs), maxX = Math.max(...xs);
const minZ = Math.min(...zs), maxZ = Math.max(...zs);
const midX = Math.floor((minX + maxX) / 2);
const midZ = Math.floor((minZ + maxZ) / 2);

// Storey rhythm (rel = height above lowest ground):
// rel 0 base course, rel 5/10/15 storey bands, rel 20 roof slab/cornice, rel 21 parapet.
// Storeys 0..3 are 5 blocks each: rel 1-3 glazing, rel 4 spandrel.
const ROOF_REL = 20;
const PARAPET_REL = 21;
const PENT_TOP_REL = 22;
const ROD_TOP_REL = 25;

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const outN = !has(x, z - 1);
  const outS = !has(x, z + 1);
  const outW = !has(x - 1, z);
  const outE = !has(x + 1, z);
  const perimeter = outN || outS || outW || outE;
  const cornerCell = (outN || outS) && (outW || outE);

  // Penthouse footprint: central interior cells.
  const inPent =
    !perimeter &&
    x >= minX + 5 && x <= maxX - 5 &&
    z >= minZ + 6 && z <= maxZ - 6;

  for (let y = Math.max(gr, minG); y <= minG + ROD_TOP_REL; y++) {
    const rel = y - minG;

    // Roof and parapet
    if (rel === ROOF_REL) {
      put(x, y, z, perimeter ? "white_concrete" : "light_gray_concrete");
      continue;
    }
    if (rel === PARAPET_REL) {
      if (perimeter) put(x, y, z, "white_concrete");
      continue;
    }
    if (rel > PARAPET_REL) {
      // Plant penthouse and lightning rod, only over the centre.
      if (inPent && rel <= PENT_TOP_REL) {
        put(x, y, z, "light_gray_concrete");
      }
      if (x === midX && z === midZ && rel > PENT_TOP_REL && rel <= ROD_TOP_REL) {
        put(x, y, z, rel === ROD_TOP_REL ? "lightning_rod" : "iron_bars");
      }
      continue;
    }

    // Base course
    if (rel === 0) {
      put(x, y, z, perimeter ? "polished_granite" : "white_concrete");
      continue;
    }

    // Storey bands (spandrels and floor lines)
    if (rel % 5 === 0) {
      put(x, y, z, "white_concrete");
      continue;
    }

    // Interior core stays solid (no voids, nothing floats)
    if (!perimeter) {
      put(x, y, z, "white_concrete");
      continue;
    }

    // Window rows on perimeter cells
    const storey = Math.floor(rel / 5);
    const ground_storey = storey === 0;

    // Ground-floor entrance on the south face, centred
    if (ground_storey && outS && x === midX && (rel === 1 || rel === 2)) {
      const half = rel === 1 ? "lower" : "upper";
      put(x, y, z, "oak_door", {
        facing: "south", half, hinge: "left", open: "false", powered: "false",
      });
      continue;
    }

    // Corners and mullions in white concrete, glazing between
    const axisOuterNS = outN || outS;
    const mullion = cornerCell || (axisOuterNS ? x % 3 === 0 : z % 3 === 0);
    if (mullion) {
      put(x, y, z, "white_concrete");
      continue;
    }

    // Warm light behind some windows
    if (rel >= 6 && (x * 7 + z * 3 + rel) % 19 === 0) {
      put(x, y, z, "glowstone");
      continue;
    }
    if (ground_storey && (x + z + rel) % 13 === 0) {
      put(x, y, z, "lantern", { hanging: "false", waterlogged: "false" });
      continue;
    }

    put(x, y, z, "light_blue_stained_glass");
  }
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw662834768.nbt");
