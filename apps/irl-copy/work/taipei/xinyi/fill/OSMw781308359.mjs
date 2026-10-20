import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw781308359";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// 19 x 47 x 19 volume. Roof surface at y 35, parapet 36-37, plant room and mast above.
const W = 19, H = 47, D = 19;
const ROOF = 35;
const g = new Voxels([W, H, D]);

// Footprint lookup: key "x,z" -> ground y
const gnd = new Map();
for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  gnd.set(`${x},${z}`, Math.max(0, Math.min(ROOF - 6, Math.round(gr))));
}
const has = (x, z) => gnd.has(`${x},${z}`);
const keys = [...gnd.keys()].map((k) => k.split(",").map(Number));

// Distance inward from the perimeter (0 = exterior skin cell)
const dist = new Map();
const queue = [];
for (const [x, z] of keys) {
  const edge = !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
  if (edge) { dist.set(`${x},${z}`, 0); queue.push([x, z]); }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  const d = dist.get(`${x},${z}`);
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = x + dx, nz = z + dz;
    if (!has(nx, nz) || dist.has(`${nx},${nz}`)) continue;
    dist.set(`${nx},${nz}`, d + 1);
    queue.push([nx, nz]);
  }
}

// Facade classification for perimeter cells
function facade(x, z) {
  const mx = !has(x - 1, z) || !has(x + 1, z);
  const mz = !has(x, z - 1) || !has(x, z + 1);
  if (mx && mz) return { corner: true, t: 0 };
  if (mx) return { corner: false, t: z };   // east/west face, bays run along z
  return { corner: false, t: x };           // north/south face, bays run along x
}

// Entrance: the north (min z) face, centre bays
function isEntrance(x, z) {
  if (!has(x, z)) return false;
  if (has(x, z - 1)) return false;
  if (!(x === 9 || x === 10)) return false;
  const f = facade(x, z);
  return !f.corner && (!has(x - 1, z) || !has(x + 1, z)) === false;
}

const B = (id, props) => ({ id, props });
const GLASS = "light_blue_stained_glass";
const WALL = "white_concrete";
const SPAN = "light_gray_concrete";
const BASE = "stone_bricks";

// Block for a footprint cell at height y, or null for air
function cellBlock(x, z, y, gr, d) {
  const s = Math.floor(y / 5);   // storey index (0 = ground storey)
  const r = y % 5;               // row within storey: 0 slab, 1-3 glazing, 4 spandrel

  if (y < gr) return B(BASE);

  if (d === 0) {
    const f = facade(x, z);
    if (f.corner) return B(WALL);
    if (y === gr) return B(BASE);
    if (s === 0 && isEntrance(x, z)) {
      if (y === gr + 1 || y === gr + 2) return null;   // doorway opening
      if (y === gr + 3) return B(WALL);                // lintel
    }
    if (r === 0) return B(WALL);
    if (r === 4) return B(SPAN);
    // glazing rows: piers every third bay, glass otherwise
    const pier = f.t % 3 === 0;
    if (pier) return B(WALL);
    return B(GLASS);
  }

  // interior cells
  if (r >= 1 && r <= 3 && d === 1) {
    // air gap behind the glass, with a warm light in some bays
    if (r === 2 && (x + 2 * z + s) % 5 === 0) return B("glowstone");
    return null;
  }
  return B(WALL);
}

for (const [x, z] of keys) {
  const k = `${x},${z}`;
  const gr = gnd.get(k);
  const d = dist.get(k) ?? 0;

  // Foundation and body up to the roof
  for (let y = 0; y < ROOF; y++) {
    const b = cellBlock(x, z, y, gr, d);
    if (b) g.set(x, y, z, b.id, b.props);
  }

  // Roof slab at 35 across the footprint
  g.set(x, ROOF, z, SPAN);

  // Parapet on the exterior skin
  if (d === 0) {
    g.set(x, 36, z, WALL);
    g.set(x, 37, z, WALL);
  }

  // Roof plant room, 7 x 7, with glazed upper band on its outer faces
  if (Math.abs(x - 9) <= 3 && Math.abs(z - 9) <= 3) {
    const edge = Math.abs(x - 9) === 3 || Math.abs(z - 9) === 3;
    g.set(x, 36, z, WALL);
    g.set(x, 37, z, edge ? GLASS : WALL);
    g.set(x, 38, z, edge ? GLASS : WALL);
    g.set(x, 39, z, SPAN);
  }
}

// Entrance lantern under the lintel
for (const [x, z] of keys) {
  if (x === 9 && isEntrance(x, z)) {
    const gr = gnd.get(`${x},${z}`);
    g.set(x, gr + 2, z, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

// Mast on the plant room
if (has(9, 9)) {
  for (let y = 40; y <= 44; y++) {
    g.set(9, y, 9, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
