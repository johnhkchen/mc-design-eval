import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE111-0316-16F";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 38, H = 23, D = 28;
const g = new Voxels([W, H, D]);

// Storey plan relative to each cell's ground gr:
//  rel 0      base course
//  rel 1..3   ground storey shopfront | rel 6..8 upper window band
//  rel 4      ground-storey fascia (lintel)
//  rel 5      floor slab / upper spandrel
//  rel 9      upper-storey cornice
//  rel 10     roof edge (total height 11 above lowest ground)
const ROOF_REL = 10;

const key = (x, z) => `${x},${z}`;
const occ = new Set(cells.map(([x, z]) => key(x, z)));
const has = (x, z) => occ.has(key(x, z));
const exposure = (x, z) => ({
  W: !has(x - 1, z),
  E: !has(x + 1, z),
  N: !has(x, z - 1),
  S: !has(x, z + 1),
});
const isPerimeter = (x, z) => {
  const e = exposure(x, z);
  return e.W || e.E || e.N || e.S;
};

function put(x, y, z, block, props) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
}

// Entrance: a south-facing, non-corner perimeter cell nearest the middle of that face.
const southBays = cells
  .filter(([x, z]) => {
    const e = exposure(x, z);
    return e.S && !e.W && !e.E;
  })
  .map(([x]) => x);
let doorCol = -1;
if (southBays.length) {
  const mid = southBays.reduce((a, b) => a + b, 0) / southBays.length;
  doorCol = southBays.reduce((best, x) =>
    Math.abs(x - mid) < Math.abs(best - mid) ? x : best, southBays[0]);
}

for (const [x, z, rawGround] of cells) {
  const gr = Math.max(0, rawGround);
  const top = gr + ROOF_REL;
  const e = exposure(x, z);
  const perimeter = e.W || e.E || e.N || e.S;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (!perimeter) {
    // Interior: floor slabs per storey, air gap otherwise, roof slab on top.
    put(x, gr, z, "light_gray_concrete");
    put(x, gr + 5, z, "light_gray_concrete");
    put(x, top, z, "light_gray_concrete");
    // Roof plant plinths on a grid, sitting on the roof slab.
    if (x % 9 === 4 && z % 9 === 4) {
      put(x, top + 1, z, "white_concrete");
      put(x, top + 2, z, "iron_block");
    }
    continue;
  }

  // Perimeter facade.
  const useX = e.W || e.E;
  const a = useX ? z : x; // along-face coordinate
  const isDoor = e.S && !e.W && !e.E && x === doorCol;
  const isPier = a % 3 === 0;

  for (let rel = 0; rel <= ROOF_REL; rel++) {
    const y = gr + rel;
    let block = null;

    if (rel === 0) block = "stone_bricks";
    else if (rel >= 1 && rel <= 3) {
      block = isPier ? "white_concrete" : "light_blue_stained_glass";
    } else if (rel === 4) block = "smooth_quartz";
    else if (rel === 5) block = "white_concrete";
    else if (rel >= 6 && rel <= 8) {
      block = isPier ? "white_concrete" : "light_blue_stained_glass";
    } else if (rel === 9) block = "smooth_quartz";
    else if (rel === ROOF_REL) block = "smooth_stone";

    if (isDoor && (rel === 1 || rel === 2)) {
      put(x, y, z, "dark_oak_door", {
        facing: "south",
        half: rel === 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }

    if (block) put(x, y, z, block);
  }

  // Entrance lantern hangs under the lintel above the door.
  if (isDoor) {
    put(x, gr + 3, z, "lantern", { hanging: "true", waterlogged: "false" });
  }

  // Corner/pier piers rise one block above the parapet for articulation.
  if (isPier && a % 6 === 0) {
    put(x, top + 1, z, "white_concrete");
  }

  // Warm lights behind the glazing, one block inside the facade.
  const [ix, iz] = e.W ? [x + 1, z] : e.E ? [x - 1, z] : e.N ? [x, z + 1] : [x, z - 1];
  if (has(ix, iz) && !isPerimeter(ix, iz) && a % 6 === 1) {
    put(ix, gr + 2, iz, "glowstone");
    put(ix, gr + 7, iz, "glowstone");
  }
}

g.save(`${DIR}/${ID}.nbt`);
