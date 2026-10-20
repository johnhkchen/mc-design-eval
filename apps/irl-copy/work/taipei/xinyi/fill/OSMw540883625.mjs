import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw540883625.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw540883625.nbt";

const W = 18, H = 23, D = 17;

// Footprint + ground per cell
const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const key = (x, z) => x + "," + z;
const gmap = new Map();
for (const c of cells) gmap.set(key(c[0], c[1]), Math.round(c[2]));
const F0 = Math.min(...gmap.values());          // lowest ground under footprint (y reference)
const inF = (x, z) => gmap.has(key(x, z));
const gAt = (x, z) => gmap.get(key(x, z));
const exposed = (x, z) => ({ n: !inF(x, z - 1), s: !inF(x, z + 1), w: !inF(x - 1, z), e: !inF(x + 1, z) });
const isPerim = (x, z) => { const e = exposed(x, z); return e.n || e.s || e.w || e.e; };

// Storey plan (relative to F0):
//  0 base course | 1-3 shopfront glass | 4 lintel band | 5 spandrel
//  6-8 upper windows | 9 cornice slab | 10 parapet / roof deck | 11+ roof plant
// Roof surface sits 11 blocks above lowest ground.

// Entrance: on the north (low-z) face, ground-level cell nearest the middle
let door = null;
{
  const cand = [];
  for (const [k, gc] of gmap) {
    const [x, z] = k.split(",").map(Number);
    if (exposed(x, z).n && gc <= F0 + 1) cand.push([x, z]);
  }
  if (cand.length) {
    cand.sort((a, b) => a[0] - b[0]);
    const [dx, dz] = cand[Math.floor(cand.length / 2)];
    door = { x: dx, z: dz };
  }
}

const g = new Voxels([W, H, D]);
function put(x, y, z, id, props) {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

for (const [k, gc] of gmap) {
  const [x, z] = k.split(",").map(Number);

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gc; y++) put(x, y, z, "stone_bricks");

  const ex = exposed(x, z);
  const perim = ex.n || ex.s || ex.w || ex.e;
  const corner = (ex.n || ex.s) && (ex.w || ex.e);

  // Interior storey slabs and roof deck
  if (F0 + 5 >= gc) put(x, F0 + 5, z, "smooth_quartz");
  if (F0 + 10 >= gc) put(x, F0 + 10, z, "light_gray_concrete");

  // Roof plant on interior cells
  if (!perim && x % 5 === 2 && z % 5 === 2 && F0 + 10 >= gc) {
    put(x, F0 + 11, z, "light_gray_concrete");
    put(x, F0 + 12, z, "iron_block");
  }

  if (!perim) continue;

  // Facade walls, from this cell's ground up to the parapet
  const along = (ex.n || ex.s) ? x : z;
  const pil = corner || along % 3 === 0;
  const isDoor = door && door.x === x && door.z === z;

  for (let y = gc; y <= F0 + 10; y++) {
    const rel = y - F0;
    if (rel === 0) { put(x, y, z, "stone_bricks"); continue; }
    if (rel <= 3) {
      if (isDoor) {
        if (rel === 1) put(x, y, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
        else if (rel === 2) put(x, y, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
        else put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
        continue;
      }
      put(x, y, z, pil ? "light_gray_concrete" : "glass_pane");
      continue;
    }
    if (rel === 4) { put(x, y, z, "smooth_stone"); continue; }
    if (rel === 5) { put(x, y, z, "white_concrete"); continue; }
    if (rel <= 8) { put(x, y, z, pil ? "light_gray_concrete" : "glass_pane"); continue; }
    if (rel === 9) { put(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" }); continue; }
    put(x, y, z, "white_concrete"); // parapet
  }

  // Warm light behind some glass: lit cell one step inward, inside the building
  if (!corner && !isDoor) {
    const ix = x + (ex.w ? 1 : ex.e ? -1 : 0);
    const iz = z + (ex.n ? 1 : ex.s ? -1 : 0);
    if (inF(ix, iz) && !isPerim(ix, iz)) {
      if (along % 6 === 1 && F0 + 7 >= gAt(ix, iz) && F0 + 7 < F0 + 10) {
        put(ix, F0 + 7, iz, "glowstone");
      }
      if (along % 6 === 4 && F0 + 2 >= gAt(ix, iz)) {
        put(ix, F0 + 2, iz, "glowstone");
      }
    }
  }
}

g.save(OUT);
