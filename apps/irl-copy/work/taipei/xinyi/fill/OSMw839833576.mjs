// Low-rise 1980s-90s commercial block in Xinyi: two shop/office storeys of 5 blocks,
// a white-painted concrete frame with light-grey pilasters, a stone plinth, shopfronts
// with red awning bands on the ground floor, a cornice and parapet, one entrance on the
// longest street face, lit windows, and rooftop plant. Y 0 is the lowest ground, so the
// storey lines stay level across the footprint and each cell rises from its own ground.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const SRC = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw839833576.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw839833576.nbt";

const cells = JSON.parse(readFileSync(SRC, "utf8"));
const W = 21, H = 23, D = 16;
const vox = new Voxels([W, H, D]);

// footprint lookup: "x,z" -> ground height
const G = new Map();
for (const [x, z, gr] of cells) G.set(x + "," + z, gr);
const has = (x, z) => G.has(x + "," + z);
const gnd = (x, z) => G.get(x + "," + z);

const minG = Math.min(...G.values());
const keys = [...G.keys()].map((k) => k.split(",").map(Number));
const minX = Math.min(...keys.map((k) => k[0])), maxX = Math.max(...keys.map((k) => k[0]));
const minZ = Math.min(...keys.map((k) => k[1])), maxZ = Math.max(...keys.map((k) => k[1]));

// storey and roof levels (absolute y, minG = 0 for this site)
const B = minG;
const FLOOR2 = B + 5;     // second floor slab / sill line
const ROOF = B + 10;      // roof deck / cornice line
const PARA = B + 11;      // top of parapet

// guarded setter: stays inside the volume and never overwrites the foundation below a cell's ground
function put(x, y, z, id, props) {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  const gr = gnd(x, z);
  if (gr === undefined || y < gr) return;
  if (props) vox.set(x, y, z, id, props);
  else vox.set(x, y, z, id);
}

// exterior face of a footprint cell: outward unit vector (edge cells only)
function face(x, z) {
  const ox = !has(x - 1, z) ? -1 : !has(x + 1, z) ? 1 : 0;
  const oz = !has(x, z - 1) ? -1 : !has(x, z + 1) ? 1 : 0;
  return { ox, oz, edge: ox !== 0 || oz !== 0 };
}

// facade material by height on a street face; piers every third bay and at the corners
function wallId(y, gr, pier) {
  if (y === gr && y < 5) return "polished_andesite";              // plinth
  if (y < 4) return pier ? "light_gray_concrete" : "light_blue_stained_glass"; // shopfront glazing
  if (y === 4) return pier ? "light_gray_concrete" : "red_terracotta";         // shop awning band
  if (y === 5) return pier ? "light_gray_concrete" : "white_concrete";         // sill band
  if (y <= 8) return pier ? "light_gray_concrete" : "light_blue_stained_glass"; // office windows
  if (y === 9) return pier ? "light_gray_concrete" : "white_concrete";         // head band
  if (y === 10) return "smooth_stone";                                         // cornice
  return pier ? "light_gray_concrete" : "white_concrete";                      // parapet
}

// pass 1: foundations, floors, roof deck
for (const [k, gr] of G) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < gr; y++) vox.set(x, y, z, "stone_bricks");   // foundation to ground
  const { edge } = face(x, z);
  put(x, gr, z, edge ? "polished_andesite" : "smooth_stone");     // ground floor slab / plinth
  put(x, FLOOR2, z, "smooth_stone");                               // second floor slab
  put(x, ROOF, z, edge ? "smooth_stone" : "light_gray_concrete");  // roof deck / cornice
}

// pass 2: street walls with window grid, storey lines and parapet
for (const [k, gr] of G) {
  const [x, z] = k.split(",").map(Number);
  const { ox, oz, edge } = face(x, z);
  if (!edge) continue;
  const alongAxis = ox !== 0 ? z : x;
  const minA = ox !== 0 ? minZ : minX;
  const maxA = ox !== 0 ? maxZ : maxX;
  const a = alongAxis;
  const pier = (a - minA) % 3 === 0 || a === minA || a === maxA;
  for (let y = gr; y <= PARA; y++) put(x, y, z, wallId(y, gr, pier));
}

// pass 3: one entrance on the longest (north, z-min) face, close to centre
const cx = (minX + maxX) / 2;
let doorCell = null;
for (const [k, gr] of G) {
  const [x, z] = k.split(",").map(Number);
  const { oz } = face(x, z);
  if (oz !== -1 || gr > 1) continue;
  if (!doorCell || Math.abs(x - cx) < Math.abs(doorCell.x - cx)) doorCell = { x, z, gr };
}
if (doorCell) {
  const { x, z, gr } = doorCell;
  put(x, gr + 1, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(x, gr + 2, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  put(x, 4, z, "red_terracotta"); // awning over the door
}

// pass 4: warm light behind glass (interior cell just inside each lit window)
for (const [k, gr] of G) {
  const [x, z] = k.split(",").map(Number);
  const { ox, oz, edge } = face(x, z);
  if (!edge) continue;
  const a = ox !== 0 ? z : x;
  const minA = ox !== 0 ? minZ : minX;
  const maxA = ox !== 0 ? maxZ : maxX;
  const pier = (a - minA) % 3 === 0 || a === minA || a === maxA;
  if (pier) continue;
  const ix = x - ox, iz = z - oz; // inward neighbour
  if (!has(ix, iz)) continue;
  const igr = gnd(ix, iz);
  // upper-floor lantern on the second-floor slab
  if ((a - minA) % 6 === 2 && igr <= 6) {
    put(ix, 6, iz, "lantern", { hanging: "false" });
  }
  // ground-floor glowstone behind the shopfront
  if ((a - minA) % 6 === 4 && igr <= gr + 1 && gr + 1 < 4) {
    put(ix, gr + 1, iz, "glowstone");
  }
}

// pass 5: rooftop plant on interior roof cells
for (const [k, gr] of G) {
  const [x, z] = k.split(",").map(Number);
  if (face(x, z).edge) continue;
  if (x % 5 === 2 && z % 5 === 2) {
    put(x, PARA, z, "iron_block");
    if ((x + z) % 2 === 0) put(x, PARA + 1, z, "iron_block");
  }
}

vox.save(OUT);
