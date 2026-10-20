import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1077413.cells.json`, "utf8"));

const W = 24, H = 45, D = 31;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const map = new Map();
let xmin = Infinity, xmax = -Infinity, zmin = Infinity, zmax = -Infinity;
let maxRoof = -Infinity;

// Quantise lidar roofs into clean two-block storeys, minimum four blocks tall.
for (const [x, z, gr, roof] of cells) {
  const rr = Math.max(gr + 4, gr + 2 * Math.round((roof - gr) / 2));
  const r = Math.min(rr, H - 4);
  map.set(key(x, z), { g: gr, r });
  xmin = Math.min(xmin, x); xmax = Math.max(xmax, x);
  zmin = Math.min(zmin, z); zmax = Math.max(zmax, z);
  maxRoof = Math.max(maxRoof, r);
}

const inside = (x, y, z) => x >= 0 && x < W && y >= 0 && y < H && z >= 0 && z < D;
const put = (x, y, z, block, props) => { if (inside(x, y, z)) g.set(x, y, z, block, props); };

const isEdge = (x, z) =>
  !map.has(key(x - 1, z)) || !map.has(key(x + 1, z)) || !map.has(key(x, z - 1)) || !map.has(key(x, z + 1));

const onZFace = (x, z) => z === zmin || z === zmax;

// Window bay test: every third bay along each facade, counted along the wall.
const windowCol = (x, z) => {
  const i = onZFace(x, z) ? x : z;
  return i % 3 === 1;
};

// Street face cells (z === zmin). Pick the entrance cell nearest the middle of that face.
const frontXs = [];
for (const k of map.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (z === zmin) frontXs.push(x);
}
const midX = (xmin + xmax) / 2;
const doorX = frontXs.length
  ? frontXs.reduce((best, x) => (Math.abs(x - midX) < Math.abs(best - midX) ? x : best), frontXs[0])
  : Math.floor(midX);
const DOOR_FACING = "north";

// Pass 1: foundation, walls, floors, roof deck, shopfront, string courses, parapets.
for (const [key_, { g: gr, r }] of map) {
  const [x, z] = key_.split(",").map(Number);
  const edge = isEdge(x, z);
  const front = edge && z === zmin;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "polished_granite");

  for (let y = gr; y < r; y++) {
    const s = Math.floor((y - gr) / 2);
    const local = (y - gr) % 2; // 0 = lower course (string course), 1 = upper course (glass row)
    const top = y === r - 1;

    if (!edge) {
      // Interior: floor slab at the start of every storey and the roof deck.
      if (local === 0 || top) put(x, y, z, "smooth_stone");
      continue;
    }

    // Facade wall: plinth, string courses at each storey line, cornice, brick between.
    let block = "bricks";
    if (y === gr) block = "stone_bricks";               // plinth course
    else if (top) block = "stone_bricks";               // cornice course
    else if (local === 0) block = "stone_bricks";       // storey string course / window sill line
    put(x, y, z, block);

    // Upper-floor windows in the upper course of each storey.
    if (local === 1 && !top && windowCol(x, z) && !(front && s === 0)) {
      put(x, y, z, "glass_pane");
    }

    // Ground-floor shopfront on the street face.
    if (front && s === 0) {
      if (x === doorX) {
        put(x, y, z, "oak_door", {
          facing: DOOR_FACING,
          half: local === 0 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
      } else if ((x - xmin) % 5 === 0 || x === xmax) {
        put(x, y, z, "stone_bricks");                   // pilaster between shop bays
      } else {
        put(x, y, z, "glass_pane");
      }
    }
  }

  // Dark oak canopy slab over the shopfront, then the entrance is readable from the street.
  if (front && r > gr + 2) {
    put(x, gr + 2, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
  }

  // Parapet slab on the top of every edge cell.
  if (edge && r < H) {
    put(x, r, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

// Pass 2: warm light behind some upper-floor windows, in the interior cell just inside the glass.
for (const [key_, { g: gr, r }] of map) {
  const [x, z] = key_.split(",").map(Number);
  if (!isEdge(x, z)) continue;
  let ix = x, iz = z;
  if (z === zmin) iz = z + 1;
  else if (z === zmax) iz = z - 1;
  else if (x === xmin) ix = x + 1;
  else if (x === xmax) ix = x - 1;
  else continue;
  if (!map.has(key(ix, iz))) continue;
  for (let y = gr; y < r - 1; y++) {
    const s = Math.floor((y - gr) / 2);
    const local = (y - gr) % 2;
    if (local !== 1) continue;
    if (!windowCol(x, z)) continue;
    if ((x + z + s) % 4 !== 0) continue;
    put(ix, y, iz, "shroomlight");
  }
}

// Pass 3: rooftop penthouse and roof equipment on the tallest interior tier.
const cx = (xmin + xmax) / 2, cz = (zmin + zmax) / 2;
for (const [key_, { r }] of map) {
  const [x, z] = key_.split(",").map(Number);
  if (isEdge(x, z)) continue;
  if (r !== maxRoof) continue;
  if (Math.abs(x - cx) <= 4 && Math.abs(z - cz) <= 6) {
    put(x, r, z, "stone_bricks");
    put(x, r + 1, z, "stone_bricks");
    if ((x + z) % 3 === 0) put(x, r + 2, z, "glass_pane");
  }
  // Small roof equipment boxes near the ends of the roof.
  if ((Math.abs(x - xmin) <= 2 || Math.abs(x - xmax) <= 2) && (z - zmin) % 6 === 2) {
    put(x, r, z, "iron_block");
  }
}

// Pass 4: where the roof steps down beside a taller neighbour, a stone course on the lower edge.
for (const [key_, { r }] of map) {
  const [x, z] = key_.split(",").map(Number);
  if (!isEdge(x, z)) continue;
  const lower = [[x - 1, z], [x + 1, z], [x, z - 1], [x, z + 1]]
    .map(([a, b]) => map.get(key(a, b)))
    .filter(Boolean)
    .some((n) => n.r > r);
  if (lower) put(x, r - 1, z, "stone_bricks");
}

g.save(`${DIR}/NYC1077413.nbt`);
