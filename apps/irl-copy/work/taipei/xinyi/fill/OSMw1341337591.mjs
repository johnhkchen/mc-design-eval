import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1341337591.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1341337591.nbt";

const W = 32, H = 19, D = 8;
const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const g = new Voxels([W, H, D]);

// Footprint lookup and ground heights
const ground = new Map();
let b = Infinity;
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, gr);
  if (gr < b) b = gr;
}
if (!Number.isFinite(b)) b = 0;

const inside = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

// Roof: about 7 blocks above lowest ground. Solid up to roofY, parapet at roofY+1.
const roofY = Math.min(b + 6, H - 2);
const parapetY = roofY + 1;

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const glassPaneEW = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const glassPaneNS = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

for (const [x, z, gc] of cells) {
  // Foundation fill from y=0 up to ground, then plinth on the ground itself
  for (let y = 0; y < gc; y++) put(x, y, z, "stone");
  if (gc <= roofY) put(x, gc, z, "stone_bricks");

  // Floor slab at the storey line (interior and perimeter), so nothing floats
  if (gc + 4 < roofY) put(x, gc + 4, z, "smooth_stone");

  // Roof slab
  if (gc <= roofY) put(x, roofY, z, "smooth_stone");

  // Facade exposure: N = z-1 side, S = z+1, W = x-1, E = x+1
  const faceN = !inside(x, z - 1);
  const faceS = !inside(x, z + 1);
  const faceW = !inside(x - 1, z);
  const faceE = !inside(x + 1, z);
  let face = null;
  if (faceN) face = "N";
  else if (faceS) face = "S";
  else if (faceW) face = "W";
  else if (faceE) face = "E";

  // Parapet on the perimeter
  if (face) put(x, parapetY, z, "quartz_slab", { type: "bottom", waterlogged: "false" });

  if (!face) continue;

  // Index along the facade
  const i = (face === "N" || face === "S") ? x : z;
  const pane = (face === "N" || face === "S") ? glassPaneEW : glassPaneNS;
  const isPier = i % 4 === 0;
  const isDoorCol = face === "N" && (x === 15 || x === 16);

  for (let rel = 0; rel < roofY - gc; rel++) {
    const y = gc + rel;
    if (rel === 0) continue; // plinth already placed

    if (rel <= 3) {
      // Ground-floor shopfront
      if (rel <= 2 && isDoorCol) {
        const half = rel === 1 ? "lower" : "upper";
        const hinge = x === 15 ? "left" : "right";
        put(x, y, z, "oak_door", { facing: "north", half, hinge, open: "false", powered: "false" });
      } else if (isPier) {
        put(x, y, z, "quartz_block");
      } else if (rel === 3) {
        put(x, y, z, "white_concrete");
      } else {
        put(x, y, z, "glass");
      }
    } else if (rel === 4) {
      // Storey line band
      put(x, y, z, "smooth_stone");
    } else {
      // Upper storey: window ribbon with quartz piers and a spandrel
      if (isPier) put(x, y, z, "quartz_block");
      else if (rel === 5) put(x, y, z, "glass_pane", pane);
      else put(x, y, z, "white_concrete");
    }
  }
}

// Warm light behind some front windows (one block inside, on the floor slab / plinth)
for (const [x, z, gc] of cells) {
  const faceN = !inside(x, z - 1);
  if (!faceN) continue;
  const i = x;
  if (i % 4 === 0 || x === 15 || x === 16) continue;
  if (!inside(x, z + 1) || gAt(x, z + 1) !== gc) continue;
  if (i % 8 === 2) {
    if (gc + 1 < roofY) put(x, gc + 1, z + 1, "glowstone");
  } else if (i % 8 === 6) {
    if (gc + 5 < roofY) put(x, gc + 5, z + 1, "shroomlight");
  }
}

// Rooftop roof equipment (AC units) on the roof slab, set back from the parapet
for (const [x, z, gc] of cells) {
  if (gc > roofY) continue;
  const edge = !inside(x - 1, z) || !inside(x + 1, z) || !inside(x, z - 1) || !inside(x, z + 1);
  if (!edge && x % 6 === 3 && z === 3) {
    put(x, parapetY, z, "light_gray_concrete");
  }
}

g.save(OUT);
