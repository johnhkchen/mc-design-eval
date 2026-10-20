import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 聯合世紀: 1990s Taipei office tower, 17 storeys over a 4-storey stone-and-glass podium.
// Podium to y20, glazed tower to y60 with a terrace ring at y59, setback glass crown
// inset 6 blocks to y88 with a parapet, penthouse core to y90.
// Facades: pale pilaster fins every 4 blocks, stone spandrel bands at each storey line,
// blue-green glazing between, a few warm lamps behind glass, and a porch entrance on each face.

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw294785357.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw294785357.nbt";

const W = 47, H = 100, D = 85;
const PODIUM_TOP = 20;
const TOWER_TOP = 60;
const ROOF = 87;
const PARAPET_TOP = 89;
const PENT_TOP = 90;

const FOUND = "stone_bricks";
const BASE = "polished_andesite";
const SPAN = "light_gray_concrete";
const PODFLOOR = "smooth_quartz";
const FIN = "white_concrete";
const GLASS = "light_blue_stained_glass";
const TGLASS = "cyan_stained_glass";
const WARM = "glowstone";
const ROOFS = "smooth_stone";
const PEN = "stone_bricks";
const CORNICE = "smooth_quartz";

const raw = JSON.parse(readFileSync(CELLS, "utf8"));
const key = (x, z) => `${x},${z}`;
let y0 = Infinity;
for (const [, , gr] of raw) y0 = Math.min(y0, gr);

const ground = new Map();
for (const [x, z, gr] of raw) ground.set(key(x, z), gr - y0);

const inF = (x, z) => ground.has(key(x, z));
const gnd = (x, z) => ground.get(key(x, z));

// Distance from the footprint edge (edge cells = 1, interior grows by BFS).
const dist = new Map();
const queue = [];
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (DIRS.some(([dx, dz]) => !inF(x + dx, z + dz))) {
    dist.set(k, 1);
    queue.push([x, z]);
  }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  const d = dist.get(key(x, z));
  for (const [dx, dz] of DIRS) {
    const nx = x + dx, nz = z + dz, nk = key(nx, nz);
    if (inF(nx, nz) && !dist.has(nk)) {
      dist.set(nk, d + 1);
      queue.push([nx, nz]);
    }
  }
}
const distOf = (x, z) => dist.get(key(x, z)) ?? 0;

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (y < 0 || y >= H || x < 0 || x >= W || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};
const hash = (x, y, z) => ((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0;
const lit = (x, y, z) => hash(x, y, z) % 97 === 0;

// Perimeter facade cell: pilaster fin every 4 blocks, glazing between, warm lamps rarely.
function facade(x, y, z, pod, gr) {
  if (pod && y < gr + 2) return BASE;
  if (((x + z) % 4) === 0) return FIN;
  if (lit(x, y, z)) return WARM;
  return pod ? GLASS : TGLASS;
}

// Main massing, cell by cell.
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  const gr = gnd(x, z);
  const d = distOf(x, z);

  // Foundation: solid from y0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, FOUND);

  // Podium and lower tower, up to y59.
  for (let y = gr; y < TOWER_TOP; y++) {
    const pod = y < PODIUM_TOP;
    if (y % 5 === 0 && y > gr) {
      if (d >= 1) {
        // Storey line: stone band on the perimeter, floor slab inside.
        put(x, y, z, d === 1 ? (pod ? CORNICE : SPAN) : (pod ? PODFLOOR : SPAN));
      }
    } else if (d === 1) {
      put(x, y, z, facade(x, y, z, pod, gr));
    }
  }

  // Terrace ring of the lower tower (setback step at y59-60).
  if (gr <= 59) {
    if (d >= 2 && d <= 5) put(x, 59, z, ROOFS);
    if (d === 1) put(x, 59, z, FIN);                    // parapet
  }

  // Setback crown: inset 6 blocks, y60 to y87.
  if (d >= 6) {
    for (let y = TOWER_TOP; y <= 86; y++) {
      if (y % 5 === 0 && y <= 85) {
        put(x, y, z, d === 6 ? CORNICE : SPAN);         // storey line
      } else if (d === 6) {
        put(x, y, z, facade(x, y, z, false, gr));       // crown curtain wall
      }
    }
    put(x, ROOF, z, ROOFS);                              // roof slab at y87
    if (d === 6) {
      for (let y = ROOF + 1; y <= PARAPET_TOP; y++) put(x, y, z, FIN);
    }
    if (d >= 12) {
      for (let y = ROOF + 1; y <= PENT_TOP; y++) put(x, y, z, PEN);
    }
  }
}

// Porch entrances on the north and south faces of the podium.
// Each porch: two pillars, a lintel band, a door two blocks tall, and a warm lamp above.
function entrance(dz) {
  const face = dz < 0 ? "north" : "south";
  const list = [];
  for (const k of ground.keys()) {
    const [x, z] = k.split(",").map(Number);
    if (distOf(x, z) === 1 && !inF(x, z + dz)) list.push([x, z]);
  }
  if (list.length === 0) return;
  const xs = list.map(([x]) => x).sort((a, b) => a - b);
  const m = xs[Math.floor(xs.length / 2)];
  // Door cell: the face cell nearest the median x.
  let door = list[0];
  for (const c of list) if (Math.abs(c[0] - m) < Math.abs(door[0] - m)) door = c;
  const [dx0, dz0] = door;
  const gr = gnd(dx0, dz0);

  // Porch lintel and pillars across +-2 blocks.
  for (const [x, z] of list) {
    const off = Math.abs(x - dx0);
    if (off <= 2) put(x, gr + 3, z, CORNICE);             // lintel band
    if (off === 2) {
      for (let y = gr; y <= gr + 2; y++) put(x, y, z, FIN); // pillars
    }
    if (off === 1) put(x, gr + 2, z, FIN);                // fanlight frame
  }

  // Door, two blocks tall, and a warm lamp over it.
  put(dx0, gr, dz0, "oak_door", { facing: face, half: "lower", hinge: "left", open: "false", powered: "false" });
  put(dx0, gr + 1, dz0, "oak_door", { facing: face, half: "upper", hinge: "left", open: "false", powered: "false" });
  put(dx0, gr + 2, dz0, WARM);
}
entrance(-1);
entrance(1);

g.save(OUT);
