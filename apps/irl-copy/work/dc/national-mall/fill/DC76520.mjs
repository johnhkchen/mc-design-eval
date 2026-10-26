// 1012 N St NW (Residential-Cooperative, Mount Vernon Square): a 3 x 8 block brick rowhouse of three storeys
// (one block each at 0.42 blocks/m) on a stone plinth, a stone storey line and a stone cornice, with a projecting
// entrance bay on its front and a rooftop bulkhead on the rear east corner (where the lidar reads one block higher).
// Walls are one block thick; the interior is a one-cell air well (x=1) with a floor slab per storey, so each window
// has air behind its glass, and a few warm lights sit in the wells.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC76520.cells.json`, "utf8"));   // [x, z, ground, roof]

const key = (x, y, z) => `${x},${y},${z}`;
const fp = new Set(cells.map(([x, z]) => `${x},${z}`));
const inFp = (x, z) => fp.has(`${x},${z}`);

// the plan: every block by cell, so glass panes can take their connections from their neighbours
const plan = new Map();
const put = (x, y, z, block, state) => plan.set(key(x, y, z), { block, state });
const AIR = "air";

// the outer face of each cell: a face is outside when the cell across it is not on the footprint
const exteriorFaces = (x, z) => ({ N: !inFp(x, z - 1), S: !inFp(x, z + 1), W: !inFp(x - 1, z), E: !inFp(x + 1, z) });

for (const [x, z, , roof] of cells) {
  const f = exteriorFaces(x, z);
  const exterior = f.N || f.S || f.W || f.E;

  // plinth (y0), storey line (y2) and cornice / roof deck (y4) run over the whole footprint: slabs, nothing hangs
  put(x, 0, z, "stone_bricks");
  put(x, 2, z, "smooth_stone");
  put(x, 4, z, "stone_bricks");

  for (const y of [1, 3]) {
    if (!exterior) { put(x, y, z, AIR); continue; }      // the air well behind the glass
    // front (north) cells and the rear middle cell carry windows, the side walls every other cell; piers between
    const front = z === 1 && (f.N || f.W || f.E) && x !== 1;
    const rear = z === 7 && x === 1;
    const side = (f.W || f.E) && !f.N && [2, 4, 6].includes(z);
    if (front || rear || side) put(x, y, z, "glass_pane", {});   // state filled in below
    else put(x, y, z, "bricks");
  }

  if (roof >= 6) {
    // the lidar's extra block on the rear east corner: a rooftop bulkhead on the parapet deck
    put(x, 5, z, "bricks");
  }
}

// entrance bay: the projecting cell (1,0) is the vestibule, a 2-high door with a brick head and a stone cornice
put(1, 1, 0, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
put(1, 2, 0, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
put(1, 3, 0, "bricks");

// warm lights in the air wells, behind the glass
put(1, 1, 2, "lantern", { hanging: "false" });
put(1, 1, 4, "shroomlight");
put(1, 3, 3, "glowstone");
put(1, 3, 6, "lantern", { hanging: "false" });

// glass panes join the glass and the piers beside them, and stay open to air or the street
const solid = (x, y, z) => { const p = plan.get(key(x, y, z)); return !!p && p.block !== AIR; };
for (const [k, p] of plan) {
  if (p.block !== "glass_pane") continue;
  const [x, y, z] = k.split(",").map(Number);
  p.state = {
    north: String(solid(x, y, z - 1)),
    south: String(solid(x, y, z + 1)),
    east: String(solid(x + 1, y, z)),
    west: String(solid(x - 1, y, z)),
    waterlogged: "false",
  };
}

// the file: 3 x 18 x 8 cells, y 0 at the lowest ground
const g = new Voxels([3, 18, 8]);
for (const [k, p] of plan) {
  if (p.block === AIR) continue;
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, p.block, p.state);
}
const out = g.save(`${DIR}/DC76520.nbt`);
console.log(`DC76520.nbt: ${out.blocks} blocks, ${out.palette} palette entries`);
