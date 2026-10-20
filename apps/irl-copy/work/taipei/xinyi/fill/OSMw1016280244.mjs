import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Era read from the record: a 21 x 14 block, four-storey (about 21 block roof) commercial
// block in the Xinyi district, built in the 1990s. Facade is white quartz and white
// terracotta with light-blue glass bands and white concrete piers, a quartz cornice, and
// rooftop plant boxes. Sporadic glowstone sits behind some glass for dusk.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1016280244";
const OUT = `${DIR}/${ID}.nbt`;

const W = 21, H = 33, D = 14;
const TOP = 21;                 // roof surface (lidar: about 21 above lowest ground)
const BASES = [1, 6, 11, 16];   // storey base lines, absolute y (5-block storeys)

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  ground.set(`${x},${z}`, Math.max(0, Math.min(TOP - 1, Math.round(gr))));
}
const has = (x, z) => ground.has(`${x},${z}`);

const g = new Voxels([W, H, D]);

function put(x, y, z, block, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
}

// Edge facing the street (north side, z minimum) for the entrance.
function exposure(x, z) {
  return { n: !has(x, z - 1), s: !has(x, z + 1), w: !has(x - 1, z), e: !has(x + 1, z) };
}

// Pick the entrance: exposed north-facing cell, lowest ground, nearest the middle.
let entranceKey = null;
{
  let best = null;
  for (const [key, gr] of ground) {
    const [x, z] = key.split(",").map(Number);
    if (!exposure(x, z).n) continue;
    const score = gr * 100 + Math.abs(x - 10);
    if (best === null || score < best) { best = score; entranceKey = key; }
  }
}

function bandBase(y) {
  let b = BASES[0];
  for (const base of BASES) if (base <= y) b = base;
  return b;
}

for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const ex = exposure(x, z);
  const perimeter = ex.n || ex.s || ex.w || ex.e;

  // Foundation: solid from y 0 up to the cell's ground.
  for (let y = 0; y <= gr; y++) put(x, y, z, "stone_bricks");

  if (!perimeter) {
    // Interior cell: solid podium up to the first storey slab, then floor slabs with air
    // between, roof deck on top. No interior fitting-out.
    const fb = BASES.find((b) => b > gr);
    const solidTo = fb ?? TOP;
    for (let y = gr + 1; y < solidTo; y++) put(x, y, z, "stone_bricks");
    for (const b of BASES) if (b > gr && b < TOP) put(x, b, z, "smooth_quartz");
    put(x, TOP, z, "gray_concrete");

    // Rooftop plant boxes, sitting on the roof deck, kept off the edges.
    if (((x * 5 + z * 3) % 7) === 0 && x > 2 && z > 2 && x < W - 3 && z < D - 3) {
      put(x, TOP + 1, z, "light_gray_concrete");
      put(x, TOP + 2, z, "light_gray_concrete");
    }
    continue;
  }

  // Perimeter cell: full facade column from its ground up to the roof.
  const corner = (ex.n || ex.s) && (ex.w || ex.e);
  const u = (ex.n || ex.s) ? x : z;   // rhythm runs along the exposed face
  const pier = corner || (((u % 3) + 3) % 3 === 0);

  for (let y = gr + 1; y <= TOP; y++) {
    if (y === TOP) { put(x, y, z, "smooth_quartz"); continue; }   // cornice / parapet cap
    const b = bandBase(y);
    const rel = y - b;
    if (rel === 0) {
      put(x, y, z, b === 1 ? "polished_granite" : "smooth_quartz");
    } else if (rel === 4) {
      put(x, y, z, "white_terracotta");                          // spandrel
    } else if (pier) {
      put(x, y, z, "white_concrete");                            // pier / mullion
    } else {
      // Glass bay, with a few glowstone lights behind it for dusk.
      const lit = ((x * 31 + z * 17 + y * 7) % 13) === 0;
      put(x, y, z, lit ? "glowstone" : "light_blue_stained_glass");
    }
  }

  // Entrance: double door on the street face, one cell.
  if (key === entranceKey && gr + 2 < TOP) {
    put(x, gr + 1, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 2, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  }
}

g.save(OUT);
