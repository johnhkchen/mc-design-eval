// Taipei, Xinyi district, OSM way 538618844 (no record).
// Read from lidar: roof ~11 blocks above lowest ground, footprint 28 x 19.
// Reads as a two-storey, mid-century-style commercial block: white concrete
// frame with light-gray belt courses, a ground-floor glass shopfront on a
// polished-andesite base, a centred dark-oak entrance under a stone lintel,
// upper-floor ribbon windows with white piers, a smooth-stone cornice and
// coping, and a few rooftop plant boxes. Warm shroomlights and glowstone sit
// behind some panes so the facade reads at dusk.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538618844";
const W = 28, H = 23, D = 19;

// ---- load footprint: [x, z, ground] per cell ----
const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const list = Array.isArray(raw) ? raw : (raw.cells ?? []);
const ground = new Map();
for (const c of list) {
  const [x, z, gr] = Array.isArray(c) ? c : [c.x, c.z, c.ground];
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  ground.set(`${x},${z}`, Math.max(0, Math.round(gr)));
}

const g = new Voxels([W, H, D]);

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}
const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

// Classify a footprint cell: null if interior, else face info.
function edgeInfo(x, z) {
  const N = has(x, z - 1), S = has(x, z + 1), Wn = has(x - 1, z), E = has(x + 1, z);
  if (N && S && Wn && E) return null;
  const corner = (!N || !S) && (!Wn || !E);
  if (!N || !S) {
    const dir = !N ? "north" : "south";
    const along = x;
    const pier = corner || !Wn || !E || along % 3 === 0;
    const inward = dir === "north" ? [0, 1] : [0, -1];
    return { dir, along, pier, inward };
  }
  const dir = !Wn ? "west" : "east";
  const along = z;
  const pier = corner || !N || !S || along % 3 === 0;
  const inward = dir === "west" ? [1, 0] : [-1, 0];
  return { dir, along, pier, inward };
}

// ---- pick the entrance: south face, non-pier cell nearest the mean x ----
let meanX = 0, n = 0;
for (const key of ground.keys()) { meanX += Number(key.split(",")[0]); n++; }
meanX /= n || 1;
let door = null;
for (const [key] of ground) {
  const [x, z] = key.split(",").map(Number);
  const e = edgeInfo(x, z);
  if (!e || e.dir !== "south" || e.pier) continue;
  if (!door || Math.abs(x - meanX) < Math.abs(door.x - meanX)) door = { x, z };
}

// ---- main build ----
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);

  // foundation: solid from y 0 up to the cell's ground
  for (let y = 0; y <= gr; y++) put(x, y, z, "stone_bricks");

  const e = edgeInfo(x, z);
  if (!e) {
    // interior: floor slabs only, air elsewhere (no interiors)
    put(x, gr + 5, z, "light_gray_concrete");
    put(x, gr + 10, z, "light_gray_concrete");
    // rooftop plant boxes on a regular grid
    if (x % 7 === 3 && z % 7 === 3 && gr + 12 <= H - 1) {
      put(x, gr + 11, z, "gray_concrete");
      put(x, gr + 12, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    }
    continue;
  }

  const { dir, along, pier, inward } = e;

  // base course
  put(x, gr + 1, z, "polished_andesite");
  // ground-floor shopfront: glass between white piers
  put(x, gr + 2, z, pier ? "white_concrete" : "light_blue_stained_glass");
  put(x, gr + 3, z, pier ? "white_concrete" : "light_blue_stained_glass");
  // lintel over shopfront
  put(x, gr + 4, z, "smooth_stone");
  // storey line
  put(x, gr + 5, z, "light_gray_concrete");
  // upper storey: spandrel, ribbon windows, head band
  put(x, gr + 6, z, pier ? "white_concrete" : "light_gray_concrete");
  put(x, gr + 7, z, pier ? "white_concrete" : "light_blue_stained_glass");
  put(x, gr + 8, z, pier ? "white_concrete" : "light_blue_stained_glass");
  put(x, gr + 9, z, "white_concrete");
  // cornice and coping
  put(x, gr + 10, z, "smooth_stone");
  put(x, gr + 11, z, "smooth_stone");

  // warm light behind some panes (interior side only)
  if (!pier) {
    const ix = x + inward[0], iz = z + inward[1];
    const inInterior = has(ix, iz) && !edgeInfo(ix, iz);
    if (inInterior && along % 6 === 1) put(ix, gr + 7, iz, "shroomlight");
    if (inInterior && along % 4 === 2) put(ix, gr + 2, iz, "glowstone");
  }
}

// ---- entrance: two-high dark-oak door in the south face ----
if (door) {
  const gr = gAt(door.x, door.z);
  put(door.x, gr + 1, door.z, "dark_oak_door",
    { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(door.x, gr + 2, door.z, "dark_oak_door",
    { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
