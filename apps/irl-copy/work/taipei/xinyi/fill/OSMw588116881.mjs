import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw588116881";
const W = 23, H = 34, D = 35;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Footprint lookup: cell -> ground height
const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const has = (x, z) => ground.has(key(x, z));

// Set a block only on footprint cells, and only at or above that cell's ground.
function put(x, y, z, block, props) {
  if (y < 0 || y >= H) return;
  const gr = ground.get(key(x, z));
  if (gr === undefined || y < gr) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
}

const DIRS = [
  { dx: 1, dz: 0, name: "east" },
  { dx: -1, dz: 0, name: "west" },
  { dx: 0, dz: 1, name: "south" },
  { dx: 0, dz: -1, name: "north" },
];
function outward(x, z) {
  for (const d of DIRS) if (!has(x + d.dx, z + d.dz)) return d;
  return null;
}

// Foundation: solid from y 0 up to each cell's ground.
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
}

// Storey slabs at y = 0, 5, 10, 15, 20 on every footprint cell (roof deck at 20).
for (const [x, z] of cells) {
  for (let s = 0; s <= 4; s++) put(x, 5 * s, z, "light_gray_concrete");
}

// Edge cells and their outward facing.
const edges = [];
for (const [x, z, gr] of cells) {
  const d = outward(x, z);
  if (d) edges.push({ x, z, gr, d, idx: d.dx !== 0 ? z : x });
}

// Main entrance: middle of the south-facing wall if there is one, otherwise middle of all edges.
let pool = edges.filter(e => e.d.name === "south");
if (pool.length === 0) pool = edges;
const avgIdx = pool.reduce((a, e) => a + e.idx, 0) / pool.length;
pool.sort((a, b) => Math.abs(a.idx - avgIdx) - Math.abs(b.idx - avgIdx));
const doorE = pool[0] ?? null;

// Facade on every edge cell.
for (const e of edges) {
  const { x, z, d, idx } = e;
  const isDoor = doorE && e.x === doorE.x && e.z === doorE.z;
  const nearDoor = doorE && d.name === doorE.d.name && Math.abs(idx - doorE.idx) <= 1;
  const ix = x - d.dx, iz = z - d.dz; // interior cell behind this wall
  const hasIn = has(ix, iz);

  for (let y = 0; y <= 22; y++) {
    const s = Math.floor(y / 5);
    const r = y % 5;

    if (y === 0) { put(x, y, z, "stone_bricks"); continue; }          // base course
    if (y === 22) { put(x, y, z, "smooth_stone"); continue; }         // parapet cap
    if (y === 21) { put(x, y, z, "white_concrete"); continue; }       // parapet
    if (y === 20) { put(x, y, z, "light_gray_concrete"); continue; }  // roof deck line
    if (r === 0) { put(x, y, z, "light_gray_concrete"); continue; }   // storey line

    if (r === 4) {
      if (s === 0) {
        // Ground-floor canopy over the entrance, cornice elsewhere
        if (isDoor || nearDoor) put(x, y, z, "dark_oak_slab", { type: "top", waterlogged: "false" });
        else put(x, y, z, "smooth_stone");
      } else {
        put(x, y, z, "white_concrete"); // spandrel band
      }
      continue;
    }

    // Window zone, r = 1..3
    if (isDoor && s === 0) {
      if (y === 1 || y === 2) {
        const props = { facing: d.name, hinge: "left", open: "false", powered: "false", half: y === 1 ? "lower" : "upper" };
        put(x, y, z, "dark_oak_door", props);
      } else {
        put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" }); // transom lantern
      }
      continue;
    }

    if (idx % 3 === 0) { put(x, y, z, "light_gray_concrete"); continue; } // mullion

    if (s === 0) put(x, y, z, "tinted_glass");                          // shopfront
    else put(x, y, z, "light_blue_stained_glass");

    // Warm light just behind some glass.
    const warm = s === 0 ? (idx % 4 === 2) : ((idx + s) % 4 === 1);
    if (hasIn && warm) put(ix, y, iz, "glowstone");
  }
}

// Roof penthouse: a 9 x 9 mechanical core near the middle, 3 storeys tall above the roof deck.
const cx = 11, cz = 17, half = 4;
for (let x = cx - half; x <= cx + half; x++) {
  for (let z = cz - half; z <= cz + half; z++) {
    const ring = x === cx - half || x === cx + half || z === cz - half || z === cz + half;
    if (ring) {
      put(x, 21, z, "light_gray_concrete");
      put(x, 22, z, (x + z) % 2 === 0 ? "iron_bars" : "light_gray_concrete");
      put(x, 23, z, "light_gray_concrete");
    }
    put(x, 24, z, "smooth_stone"); // penthouse roof
  }
}

// Rooftop AC units on interior cells.
for (const [x, z] of [[4, 7], [18, 6], [5, 27], [17, 28]]) {
  if (!has(x, z) || outward(x, z)) continue;
  put(x, 21, z, "iron_block");
  put(x, 22, z, "iron_block");
}

g.save(`${DIR}/${ID}.nbt`);
