import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538458218";
const W = 10, H = 23, D = 8;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// footprint lookup: "x,z" -> ground y
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

// bounds- and footprint-guarded setter
const put = (x, y, z, block, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (!has(x, z)) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

// Building: 1980s-era Taipei reinforced-concrete commercial block, two storeys
// (5 blocks each), white-painted concrete walls with a grey base course and
// stringcourses, blue-tinted window bands, a shopfront with a recessed entrance
// on the south face, a parapet, and rooftop AC plant and a water tank.
const STOREY = 5;
const FLOOR_BLOCK = "smooth_stone";
const WALL = "white_concrete";
const BAND = "light_gray_concrete";
const BASE = "gray_concrete";
const FOUND = "stone_bricks";
const GLASS = "light_blue_stained_glass_pane";
const SHOP = "glass_pane";
const LINTEL = "white_concrete";

for (const [x, z, gr] of cells) {
  const N = !has(x, z - 1); // north face exposed
  const S = !has(x, z + 1); // south face exposed (street/entrance side)
  const Wf = !has(x - 1, z);
  const E = !has(x + 1, z);
  const faces = [N, S, Wf, E].filter(Boolean).length;
  const perimeter = faces > 0;

  // Foundation from y 0 up to this cell's ground, with a grey plinth course
  for (let y = 0; y < gr; y++) put(x, y, z, FOUND);
  if (gr > 0) put(x, gr - 1, z, BASE);

  // Floor slabs for each storey and the roof slab
  put(x, gr, z, FLOOR_BLOCK);
  put(x, gr + STOREY, z, FLOOR_BLOCK);
  put(x, gr + 2 * STOREY, z, BAND);

  // Interior air is left as-is (no interiors)

  if (!perimeter) continue;

  // Walls: piers and stringcourses on every perimeter cell
  for (let y = gr + 1; y <= gr + 2 * STOREY + 1; y++) put(x, y, z, WALL);
  put(x, gr + STOREY, z, BAND);     // storey line
  put(x, gr + 2 * STOREY, z, BAND); // cornice under parapet
  put(x, gr + 2 * STOREY + 1, z, WALL); // parapet

  // Only single-face cells get openings (corners stay as piers)
  if (faces !== 1) continue;

  const along = (N || S) ? x : z;
  const isDoor = S && x === 4;

  if (isDoor) {
    // Recessed entrance on the south face
    put(x, gr + 1, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 2, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 3, z, SHOP);
    // Dark awning over the entrance, kept inside the footprint column
    put(x, gr + 4, z, "dark_oak_slab", { type: "top", waterlogged: "false" });
    continue;
  }

  if (along % 2 !== 1) continue; // piers between windows

  // Storey 1: shopfront glazing on ground floor, window band above
  const s1Glass = (gr + 0 === gr) ? SHOP : GLASS;
  for (let y = gr + 1; y <= gr + 3; y++) put(x, y, z, y === gr + 1 ? s1Glass : s1Glass);
  put(x, gr + 4, z, LINTEL);

  // Storey 2: window band
  for (let y = gr + STOREY + 1; y <= gr + STOREY + 3; y++) put(x, y, z, GLASS);
  put(x, gr + 2 * STOREY - 1, z, LINTEL);

  // Warm light behind some glass, in the air gap one cell inward
  const ix = N ? x : S ? x : Wf ? x + 1 : x - 1;
  const iz = N ? z + 1 : S ? z - 1 : z;
  if ((along + gr) % 3 === 0) put(ix, gr + 2, iz, "glowstone");
  if ((along + gr) % 3 === 1) put(ix, gr + STOREY + 2, iz, "glowstone");
}

// Roof plant: AC condenser units and a water tank (only on the roof, guarded)
for (const [x, z, gr] of cells) {
  const roofY = gr + 2 * STOREY + 1; // top of parapet level
  const inAC = x >= 2 && x <= 3 && z >= 2 && z <= 3;
  const inTank = x >= 6 && x <= 7 && z >= 2 && z <= 3;
  if (inAC) {
    put(x, roofY, z, "iron_block");
    put(x, roofY + 1, z, "light_gray_concrete");
  }
  if (inTank) {
    put(x, roofY, z, WALL);
    put(x, roofY + 1, z, WALL);
    put(x, roofY + 2, z, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);
