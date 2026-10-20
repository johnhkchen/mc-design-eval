import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540296187";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Footprint 10 x 37. Two-storey low-rise commercial block (shophouse-style):
// stone plinth, cream-quartz walls with white-concrete frames, a shopfront
// ground floor on the west (street) face, a flat roof with a parapet cap.
const W = 10, H = 23, D = 37;
const g = new Voxels([W, H, D]);

const ground = new Map();
let minG = Infinity;
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, gr);
  if (gr < minG) minG = gr;
}
if (!Number.isFinite(minG)) minG = 0;

const has = (x, z) => ground.has(`${x},${z}`);
const exterior = (x, z) =>
  has(x, z) && (!has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1));

const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const PANE_NS = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const PANE_EW = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

// Storey levels (relative to lowest ground):
// 0 plinth, 1-3 shopfront glass, 4 lintel, 5 spandrel, 6-8 windows, 9 head band,
// 10 roof slab / parapet wall, 11 parapet cap.
const ROOF_Y = 10;
const PARAPET_Y = 11;

for (const [x, z, gr0] of cells) {
  const gr = gr0 - minG;
  const ext = exterior(x, z);
  const alongZ = !has(x - 1, z) || !has(x + 1, z); // wall runs north-south
  const c = alongZ ? z : x;                          // run coordinate for bays

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Floor slabs (interior air gaps between them), roof slab.
  if (gr <= 0) put(x, 0, z, "polished_andesite");
  if (gr <= 5) put(x, 5, z, "smooth_quartz");
  if (gr <= ROOF_Y) put(x, ROOF_Y, z, ext ? "smooth_quartz" : "gray_concrete");

  if (!ext) continue;

  // Inward neighbour for placing light behind glass.
  let dx = 0, dz = 0;
  if (!has(x - 1, z)) dx = 1; else if (!has(x + 1, z)) dx = -1;
  if (!has(x, z - 1)) dz = 1; else if (!has(x, z + 1)) dz = -1;
  let ix = x, iz = z;
  if (dx !== 0 && has(x + dx, z)) { ix = x + dx; iz = z; }
  else if (dz !== 0 && has(x, z + dz)) { ix = x; iz = z + dz; }
  const hasInside = (ix !== x || iz !== z) && has(ix, iz);

  const paneProps = alongZ ? PANE_NS : PANE_EW;
  const pillar = c % 4 === 0;
  const lightHere = c % 4 === 2;

  for (let y = gr; y <= PARAPET_Y; y++) {
    if (y < 0 || y >= H) continue;

    if (y === 0) {
      put(x, y, z, "polished_andesite");
    } else if (y >= 1 && y <= 3) {
      if (x === 0 && z === 18 && y <= 2) {
        // Shopfront entrance door (west face, centred), two halves.
        put(x, y, z, "dark_oak_door", {
          half: y === 1 ? "lower" : "upper",
          facing: "west",
          hinge: "left",
          open: "false",
          powered: "false",
        });
      } else if (x === 0 && z === 18 && y === 3) {
        put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
      } else if (pillar) {
        put(x, y, z, "white_concrete");
      } else {
        put(x, y, z, "glass_pane", paneProps);
        if (lightHere && hasInside && (x + z) % 2 === 0 && y === 2) {
          put(ix, y, iz, "glowstone");
        }
      }
    } else if (y === 4) {
      put(x, y, z, "white_concrete");
    } else if (y === 5) {
      put(x, y, z, "smooth_quartz");
    } else if (y >= 6 && y <= 8) {
      if (pillar) {
        put(x, y, z, "white_concrete");
      } else {
        put(x, y, z, "glass_pane", paneProps);
        if (lightHere && hasInside && y === 7 && (x + z) % 3 === 0) {
          put(ix, y, iz, "glowstone");
        }
      }
    } else if (y === 9) {
      put(x, y, z, "white_concrete");
    } else if (y === 10) {
      put(x, y, z, "smooth_quartz");
    } else if (y === PARAPET_Y) {
      put(x, y, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
    }
  }
}

// Roof equipment: a few condenser units on the interior roof.
for (const [x, z, gr0] of cells) {
  const gr = gr0 - minG;
  if (exterior(x, z)) continue;
  if (gr > ROOF_Y) continue;
  if (x >= 2 && x <= 7 && z >= 4 && z <= 32 && (x * 7 + z * 3) % 17 === 0) {
    put(x, PARAPET_Y, z, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);
