import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 1835 I St NW, Washington DC: large commercial office block, mid-century
// steel-frame with a stone base, pale stone piers in continuous glass ribbons,
// a stepped core and rooftop plant. Roof ~20 blocks above lowest ground.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC79259";
const W = 23, H = 32, D = 41;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const key = (x, z) => x + "," + z;
const C = new Map();
for (const [x, z, gr, rf] of cells) C.set(key(x, z), { x, z, g: gr, r: rf });
const has = (x, z) => C.has(key(x, z));
const NB4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Ring (exterior wall) cells: any 4-neighbour missing from the footprint.
const dist = new Map();
const queue = [];
for (const c of C.values()) {
  if (NB4.some(([dx, dz]) => !has(c.x + dx, c.z + dz))) {
    dist.set(key(c.x, c.z), 0);
    queue.push(c);
  }
}
for (let i = 0; i < queue.length; i++) {
  const c = queue[i];
  const d = dist.get(key(c.x, c.z));
  for (const [dx, dz] of NB4) {
    const nx = c.x + dx, nz = c.z + dz;
    const k = key(nx, nz);
    if (C.has(k) && !dist.has(k)) {
      dist.set(k, d + 1);
      queue.push(C.get(k));
    }
  }
}
const ringDist = (c) => dist.get(key(c.x, c.z)) ?? 0;

// Smooth lidar roof over a 3x3 neighbourhood, quantise to 2-block storeys
// aligned on each cell's ground, then step the inner-ring tier down.
const tops = new Map();
for (const c of C.values()) {
  let sum = 0, n = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const o = C.get(key(c.x + dx, c.z + dz));
    if (o) { sum += o.r; n++; }
  }
  const s = sum / n;
  let top = c.g + 2 * Math.round((s - c.g) / 2);
  const d = ringDist(c);
  if (d >= 2 && d <= 3) top -= 2;           // first setback tier
  top = Math.max(top, c.g + 4);
  while (top > 29) top -= 2;                // canvas limit, keeps parity
  tops.set(key(c.x, c.z), top);
}
const topOf = (c) => tops.get(key(c.x, c.z));

// Entrance: front (min z) ring row, cell nearest the mean x.
const z0 = Math.min(...[...C.values()].map(c => c.z));
const frontXs = [...C.values()].filter(c => c.z === z0).map(c => c.x);
const meanX = frontXs.reduce((a, b) => a + b, 0) / frontXs.length;
const cx = frontXs.reduce((best, x) => Math.abs(x - meanX) < Math.abs(best - meanX) ? x : best, frontXs[0]);

const g = new Voxels([W, H, D]);
const set = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props); else g.set(x, y, z, id);
};

// Facade index: position along the face the ring cell sits on, plus whether
// it is a corner (missing neighbours on both axes).
function facadeInfo(c) {
  const zMissing = !has(c.x, c.z - 1) || !has(c.x, c.z + 1);
  const xMissing = !has(c.x - 1, c.z) || !has(c.x + 1, c.z);
  const corner = zMissing && xMissing;
  // Faces running along x (north/south) are indexed by x; others by z.
  const idx = zMissing ? c.x : c.z;
  return { idx, corner };
}

// 1. Foundations: solid from y 0 up to each cell's ground.
for (const c of C.values()) {
  for (let y = 0; y < c.g; y++) set(c.x, y, c.z, "stone_bricks");
}

// 2. Walls, floors, roof caps, columns.
for (const c of C.values()) {
  const gr = c.g, top = topOf(c), d = ringDist(c);
  if (d === 0) {
    const { idx, corner } = facadeInfo(c);
    const pier = corner || (idx % 4 === 0);
    for (let y = gr; y < top; y++) {
      const rel = y - gr;
      let id;
      if (rel === 0) id = "stone_bricks";                       // base course
      else if (y === top - 1) id = "stone_bricks";              // parapet
      else if (rel % 2 === 0) id = "smooth_stone";              // spandrel / floor line
      else id = pier ? "calcite" : "light_blue_stained_glass";  // piers and glass ribbon
      set(c.x, y, c.z, id);
    }
    // Cornice slab on the parapet.
    set(c.x, top, c.z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  } else {
    // Interior: floor slabs per storey, roof cap, no room fill (air gap).
    for (let y = gr; y <= top - 2; y += 2) set(c.x, y, c.z, "smooth_stone");
    set(c.x, top - 1, c.z, "gray_concrete");
    // Structural columns on a 4-block grid, carrying every floor.
    if (d >= 2 && c.x % 4 === 0 && c.z % 4 === 0) {
      for (let y = gr; y < top - 1; y++) set(c.x, y, c.z, "white_concrete");
    }
  }
}

// 3. Warm light behind some windows (interior ring-adjacent cells).
for (const c of C.values()) {
  if (ringDist(c) !== 1) continue;
  if ((c.x + c.z) % 5 !== 0) continue;
  const gr = c.g, top = topOf(c);
  for (let y = gr + 1; y < top - 1; y += 2) {
    if (y >= 1) set(c.x, y, c.z, "glowstone");
  }
}

// 4. Rooftop plant on the core: small screened boxes.
for (const c of C.values()) {
  if (ringDist(c) < 2) continue;
  if (c.x % 6 !== 3 || c.z % 6 !== 3) continue;
  if (c.x % 4 === 0 && c.z % 4 === 0) continue;
  const top = topOf(c);
  set(c.x, top, c.z, "light_gray_concrete");
  set(c.x, top + 1, c.z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

// 5. Entrance: doors in the front wall, stone surround, lintel and lantern.
const doorCell = C.get(key(cx, z0));
if (doorCell) {
  const gr = doorCell.g;
  set(cx, gr + 1, z0, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  set(cx, gr + 2, z0, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  // Stone surround: jambs two blocks either side, full height of the door.
  for (const dx of [-2, -1, 1, 2]) {
    const side = C.get(key(cx + dx, z0));
    if (!side) continue;
    set(cx + dx, gr + 1, z0, "stone_bricks");
    set(cx + dx, gr + 2, z0, "stone_bricks");
  }
  // Lintel and cornice over the door, with a lantern under the canopy line.
  for (let dx = -2; dx <= 2; dx++) {
    const c = C.get(key(cx + dx, z0));
    if (c && topOf(c) > gr + 4) set(cx + dx, gr + 3, z0, "stone_brick_slab", { type: "top", waterlogged: "false" });
  }
  if (topOf(doorCell) > gr + 4) {
    set(cx, gr + 3, z0, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
