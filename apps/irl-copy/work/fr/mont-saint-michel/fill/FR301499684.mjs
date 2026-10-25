import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const ID = "FR301499684";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 9, H = 23, D = 11;
const g = new Voxels([W, H, D]);

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Footprint lookup
const map = new Map();
for (const [x, z, gr, r] of cells) {
  map.set(`${x},${z}`, { gr: Math.round(gr), r: Math.round(r) });
}
const has = (x, z) => map.has(`${x},${z}`);

// One smoothed roof tier for the whole block: median of lidar roof heights
const roofs = cells.map(c => Math.round(c[3])).sort((a, b) => a - b);
const ROOF = roofs[Math.floor(roofs.length / 2)];

// Warm light behind some upper glazing
const lit = (x, z, y) => ((x * 7 + z * 3 + y) % 4 === 0);
const glass = (x, z, y) => (lit(x, z, y) ? "glowstone" : "glass_pane");

const slabBottom = { type: "bottom", waterlogged: "false" };

for (const [x, z, grRaw] of cells) {
  const gr = Math.round(grRaw);
  const top = Math.max(ROOF, gr + 7) - 1;   // cornice course, smoothed tier
  const upTop = top - 2;                     // last window row (below cornice band)

  const frontFace = !has(x, z - 1);
  const backFace = !has(x, z + 1);
  const leftFace = !has(x - 1, z);
  const rightFace = !has(x + 1, z);
  const exposed = frontFace || backFace || leftFace || rightFace;
  const perimeter = exposed;

  // Foundation up to ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Render body
  for (let y = gr; y < top; y++) put(x, y, z, "smooth_sandstone");

  // Cornice band: stone brick course with slab lip on the perimeter
  put(x, top, z, "stone_bricks");
  if (perimeter) put(x, top + 1, z, "stone_brick_slab", slabBottom);

  if (exposed) {
    // Base course under the storey line
    put(x, gr + 4, z, "stone_bricks");
  }

  // Piers at building corners on every exposed column
  const corner = (x === 0 || x === W - 1) && (z === 0 || z === D - 1);

  // Front: shopfront on the ground storey
  if (frontFace) {
    if (x === 0 || x === W - 1) {
      for (let y = gr; y <= gr + 4; y++) put(x, y, z, "stone_bricks");
    } else if (x === 4) {
      // Central door under a stone lintel
      put(x, gr, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      put(x, gr + 1, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
      put(x, gr + 2, z, "stone_bricks");
      put(x, gr + 3, z, "dark_dark_oak_planks".replace("dark_dark", "dark"));
    } else {
      put(x, gr, z, "stone_bricks");                       // plinth
      put(x, gr + 1, z, "glass_pane");
      put(x, gr + 2, z, "glass_pane");
      put(x, gr + 3, z, "dark_oak_planks");                // fascia / sign band
    }
  }

  // Upper windows: framed glass on alternating columns (or rows on sides)
  if (exposed) {
    for (let y = gr + 5; y <= upTop; y++) {
      if (frontFace || backFace) {
        if (x === 0 || x === W - 1) {
          put(x, y, z, "stone_bricks");          // pier
        } else if (x % 2 === 1) {
          // window: framed glass, sill at bottom, head at top
          if (y === gr + 5) put(x, y, z, "stone_brick_slab", slabBottom);
          else if (y === upTop) put(x, y, z, "stone_bricks");
          else put(x, y, z, glass(x, z, y));
        } else {
          put(x, y, z, "stone_bricks");          // pier
        }
      } else {
        // left/right faces
        if (z === 0 || z === D - 1) {
          put(x, y, z, "stone_bricks");
        } else if (z % 2 === 1) {
          if (y === gr + 5) put(x, y, z, "stone_brick_slab", slabBottom);
          else if (y === upTop) put(x, y, z, "stone_bricks");
          else put(x, y, z, glass(x, z, y));
        } else {
          put(x, y, z, "stone_bricks");
        }
      }
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
