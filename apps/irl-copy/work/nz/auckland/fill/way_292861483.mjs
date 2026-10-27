// Way 292861483, Mt Eden / Eden Terrace: a late-1960s concrete-frame office block on a stone plinth, eight storeys
// over a seven-storey wing, a three-storey wing on the low west side, and a planted light well in the middle.
// Storeys sit on one global datum (floors at y = 4k, y 0 = lowest ground), so the lidar tiers stay level across the
// block; the uphill cells bury their lower storey in foundation. Lidar roofs are median-smoothed and snapped to
// storey tops (4n+1: 13, 17, 21, 25, 29, 33), so each tier is a flat slab, and open light wells are left open.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_292861483.cells.json`, "utf8"));
const W = 35, D = 29, H = 46;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Lidar roof -> storey top: each band snaps to the nearest 4n+1 so the cap and parapet sit on a floor line
const TIERS = [[31, 33], [27, 29], [23, 25], [19, 21], [15, 17], [0, 13]];
const tierOf = (r) => TIERS.find(([min]) => r >= min)[1];
const median = (a) => a.slice().sort((p, q) => p - q)[Math.floor(a.length / 2)];

const raw = new Map();
for (const [x, z, g, r] of cells) raw.set(`${x},${z}`, { g, r });
// a light well: the lidar roof is within a block of the ground, so nothing is built above it
const isCourt = (c) => c.r - c.g <= 1;

const cols = new Map();
for (const [key, c] of raw) {
  const [x, z] = key.split(",").map(Number);
  if (isCourt(c)) { cols.set(key, { x, z, g: c.g, court: true, top: c.g }); continue; }
  const near = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const n = raw.get(`${x + dx},${z + dz}`);
    if (n && !isCourt(n)) near.push(n.r);
  }
  cols.set(key, { x, z, g: c.g, court: false, top: tierOf(median(near)) });
}

// the sides of a cell at height y that face air: outside the footprint, or above the neighbour's top
const sides = (x, z, y) => DIRS.filter(([dx, dz]) => {
  const n = cols.get(`${x + dx},${z + dz}`);
  return !n || y >= n.top;
});
const same = (a, b) => a[0] === b[0] && a[1] === b[1];

// the entrance: a ground-level cell on the west edge of the low (ground 0) side, nearest the middle of the face
const doorCands = [...cols.values()].filter((c) => !c.court && c.g === 0 && sides(c.x, c.z, 1).some((d) => same(d, [-1, 0])));
doorCands.sort((a, b) => Math.abs(a.z - 13) - Math.abs(b.z - 13));
const door = doorCands[0];

// mullions: one frame column in three, the same rhythm on every straight run of wall
const mullion = (x, z) => (x + z) % 3 === 0;

const v = new Voxels([W, H, D]);
const lights = [];

function facade(c, x, y, z, ex) {
  const k = Math.floor(y / 4), j = y % 4;
  if (y === c.g) return "stone_bricks";                                  // base course on the ground
  if (k === 0 && door && x === door.x && z === door.z && (y === 1 || y === 2)) {
    const half = y === 1 ? "lower" : "upper";
    return { block: "iron_door", state: { facing: "west", half, hinge: "left", open: "false", powered: "false" } };
  }
  if (k === 0 && j === 3) return "gray_concrete";                        // shopfront fascia
  if (j === 0 || j === 3) return "light_gray_concrete";                  // storey line and spandrel
  if (mullion(x, z)) return "gray_concrete";                             // window frame
  // a glass pane: shopfronts are darker, upper windows blue-tinted; some get a warm light just behind
  const inward = ex.length ? [-ex[0][0], -ex[0][1]] : null;
  if (inward) lights.push({ x, y, z, k, inward, shop: k === 0 });
  return k === 0 ? "gray_stained_glass" : "light_blue_stained_glass";
}

for (const c of cols.values()) {
  const { x, z, g } = c;
  if (c.court) {
    for (let y = 0; y < g; y++) v.set(x, y, z, y === g - 1 ? "moss_block" : "stone_bricks");
    continue;
  }
  const cap = c.top - 1;
  for (let y = 0; y < g; y++) v.set(x, y, z, "stone_bricks");            // foundation under the uphill ground
  for (let y = g; y < cap; y++) {
    const ex = sides(x, z, y);
    if (ex.length) {
      const b = facade(c, x, y, z, ex);
      if (typeof b === "string") v.set(x, y, z, b);
      else v.set(x, y, z, b.block, b.state);
    } else if (y % 4 === 0) {
      v.set(x, y, z, "light_gray_concrete");                             // floor slab, air above it
    }
  }
  // roof: a cornice on the edge, a parapet above it, and a plain cap inside
  const edge = sides(x, z, cap).length > 0;
  v.set(x, cap, z, edge ? "smooth_stone" : "light_gray_concrete");
  if (edge) v.set(x, c.top, z, "stone_bricks");
}

// roof plant on the tower top: a louvred box, its roof, and a lightning rod (cells on the 33 tier only)
for (let z = 8; z <= 10; z++) for (let x = 18; x <= 21; x++) {
  const c = cols.get(`${x},${z}`);
  if (!c || c.court || c.top !== 33) continue;
  for (let y = 33; y <= 35; y++) {
    const wall = x === 18 || x === 21 || z === 8 || z === 10;
    if (wall) v.set(x, y, z, "light_gray_concrete");
  }
  v.set(x, 36, z, "light_gray_concrete");
}
v.set(19, 37, 9, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });

// warm lights in some windows, placed in the air just inside the glass (never on a facade cell)
for (const l of lights) {
  const ix = l.x + l.inward[0], iz = l.z + l.inward[1];
  const inner = cols.get(`${ix},${iz}`);
  if (!inner || inner.court || v.val(ix, l.y, iz) !== 0) continue;
  if (sides(ix, iz, l.y).length) continue;
  const lit = l.shop ? (l.x * 3 + l.z) % 4 === 0 : (l.x * 5 + l.z * 7 + l.y * 3) % 11 === 0;
  if (lit) v.set(ix, l.y, iz, "glowstone");
}

const counts = v.save(`${DIR}/way_292861483.nbt`);
console.log(JSON.stringify({ door: door ? [door.x, door.z] : null, ...counts }));
