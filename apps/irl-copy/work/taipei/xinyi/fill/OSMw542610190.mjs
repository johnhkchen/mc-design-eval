import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542610190";
const W = 30, H = 23, D = 16;

// Footprint: [x, z, ground] per cell.
const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const cells = new Map();
for (const row of raw) {
  const [x, z, gr] = row;
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  cells.set(`${x},${z}`, Math.max(0, Math.round(gr ?? 0)));
}
const has = (x, z) => cells.has(`${x},${z}`);
const groundAt = (x, z) => cells.get(`${x},${z}`);

const missingCount = (x, z) =>
  (!has(x + 1, z) ? 1 : 0) + (!has(x - 1, z) ? 1 : 0) +
  (!has(x, z + 1) ? 1 : 0) + (!has(x, z - 1) ? 1 : 0);
const isPerim = (x, z) => missingCount(x, z) > 0;
const isCorner = (x, z) => missingCount(x, z) >= 2;

// Inward neighbour (interior cell behind a perimeter wall cell), or null.
function inward(x, z) {
  let ix = x, iz = z;
  if (!has(x + 1, z)) ix = x - 1;
  else if (!has(x - 1, z)) ix = x + 1;
  else if (!has(x, z + 1)) iz = z - 1;
  else if (!has(x, z - 1)) iz = z + 1;
  if (!has(ix, iz) || isPerim(ix, iz)) return null;
  return [ix, iz];
}

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Entrance: middle of the south (z = max) street face.
const southFace = [...cells.keys()]
  .map((k) => k.split(",").map(Number))
  .filter(([x, z]) => !has(x, z + 1))
  .sort((a, b) => a[0] - b[0]);
const doorCell = southFace.length ? southFace[Math.floor(southFace.length / 2)] : null;
const doorKey = doorCell ? `${doorCell[0]},${doorCell[1]}` : null;

const PANE = { north: "true", south: "true", east: "true", west: "true" };

for (const [key, gr] of cells) {
  const [x, z] = key.split(",").map(Number);
  const perim = isPerim(x, z);
  const roofY = gr + 10;      // roof slab stands on the cornice course
  const parapetY = roofY + 1; // parapet on the perimeter

  // Foundation: solid from y0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Roof slab over every footprint cell.
  put(x, roofY, z, "smooth_stone");

  if (!perim) {
    // Interior: floor slabs per storey, air between (no interiors).
    put(x, gr + 4, z, "smooth_stone");
    put(x, gr + 9, z, "smooth_stone");
    // Rooftop plant boxes on a few interior cells.
    if (x % 8 === 3 && z % 5 === 2) {
      put(x, roofY + 1, z, "light_gray_concrete");
      put(x, roofY + 2, z, "light_gray_concrete");
    }
    continue;
  }

  // Perimeter facade. Pillars at corners and every third bay.
  const pillar = isCorner(x, z) || (x + z) % 3 === 0;
  const warmBehind = inward(x, z);
  const isDoor = key === doorKey;

  // Base course.
  put(x, gr, z, "polished_andesite");

  // Ground-floor shopfront (gr+1..gr+3).
  for (let y = gr + 1; y <= gr + 3; y++) {
    if (pillar) put(x, y, z, "smooth_quartz");
    else put(x, y, z, "glass_pane", PANE);
  }
  if (!pillar && warmBehind && (x + z) % 6 === 1) {
    put(warmBehind[0], gr + 2, warmBehind[1], "glowstone");
  }

  // Storey line.
  put(x, gr + 4, z, "smooth_stone");

  // Upper storey: spandrel band, then window band.
  put(x, gr + 5, z, pillar ? "smooth_quartz" : "calcite");
  for (let y = gr + 6; y <= gr + 8; y++) {
    if (pillar) put(x, y, z, "smooth_quartz");
    else put(x, y, z, "cyan_stained_glass_pane", PANE);
  }
  if (!pillar && warmBehind && (x + z) % 6 === 4) {
    put(warmBehind[0], gr + 7, warmBehind[1], "shroomlight");
  }

  // Cornice course and parapet.
  put(x, gr + 9, z, "stone_bricks");
  put(x, parapetY, z, "stone_bricks");

  // Entrance: double-height door with a hanging lantern above.
  if (isDoor) {
    const props = { facing: "south", hinge: "left", open: "false", powered: "false" };
    put(x, gr + 1, z, "dark_oak_door", { ...props, half: "lower" });
    put(x, gr + 2, z, "dark_oak_door", { ...props, half: "upper" });
    put(x, gr + 3, z, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
