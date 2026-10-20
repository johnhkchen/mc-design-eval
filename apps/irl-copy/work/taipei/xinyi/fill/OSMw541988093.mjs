import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 1980s Taipei low-rise commercial block: two storeys over a glazed shopfront,
// white tiled piers, light-grey spandrels, a plain parapet, rooftop AC plant.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541988093";
const W = 15, H = 23, D = 15;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const base = Math.min(...cells.map((c) => c[2]));   // lowest ground
const TOP = base + 10;                               // top parapet block; roof surface at base+11

function put(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Outward face of a perimeter cell, or null for interior cells.
function outward(x, z) {
  if (!has(x, z - 1)) return { face: "north", dx: 0, dz: -1, u: x };
  if (!has(x, z + 1)) return { face: "south", dx: 0, dz: 1, u: x };
  if (!has(x - 1, z)) return { face: "west", dx: -1, dz: 0, u: z };
  if (!has(x + 1, z)) return { face: "east", dx: 1, dz: 0, u: z };
  return null;
}

const PANE = { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" };

// Facade block for a perimeter cell at storey level lvl (0..10).
function facade(lvl, win) {
  if (lvl === 0) return ["polished_granite"];                    // base course
  if (lvl <= 3) return win ? ["light_blue_stained_glass_pane", PANE] : ["white_concrete"]; // shopfront
  if (lvl === 4) return ["smooth_stone"];                        // fascia / lintel band
  if (lvl === 5) return ["light_gray_concrete"];                 // storey line
  if (lvl <= 8) return win ? ["light_blue_stained_glass_pane", PANE] : ["white_concrete"]; // upper storey
  if (lvl === 9) return ["light_gray_concrete"];                 // head course
  return ["white_concrete"];                                     // parapet
}

// Entrance: perimeter cell on the south face nearest the centre column.
const perimCells = cells.filter(([x, z]) => outward(x, z));
let pool = perimCells.filter(([x, z]) => outward(x, z).face === "south");
if (pool.length === 0) pool = perimCells;
const centre = 7;
pool.sort((a, b) => Math.abs(a[0] - centre) - Math.abs(b[0] - centre));
const [ex, ez] = pool[0];
const entranceKey = `${ex},${ez}`;
const entranceFace = outward(ex, ez).face;

// 1. Foundation: solid from y 0 up to each cell's ground.
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");
}

// 2. Body: perimeter facade, interior air with floor slabs.
for (const [x, z, gr] of cells) {
  const out = outward(x, z);
  for (let y = gr; y <= TOP; y++) {
    const lvl = Math.min(10, Math.max(0, y - base));
    if (out) {
      const win = out.u % 3 === 1;
      if (`${x},${z}` === entranceKey) {
        if (y === gr + 1) { put(x, y, z, "oak_door", { facing: entranceFace, half: "lower", hinge: "left", open: "false", powered: "false" }); continue; }
        if (y === gr + 2) { put(x, y, z, "oak_door", { facing: entranceFace, half: "upper", hinge: "left", open: "false", powered: "false" }); continue; }
        if (y === gr + 3) { put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" }); continue; }
      }
      const [id, props] = facade(lvl, win);
      put(x, y, z, id, props);
    } else {
      // Interior: floor slabs at ground, mid-height and roof; otherwise air.
      if (y === gr || y === base + 5 || y === TOP) put(x, y, z, "smooth_stone");
    }
  }
}

// 3. Warm lights behind some windows (interior cell directly inside the glass).
for (const [x, z, gr] of cells) {
  const out = outward(x, z);
  if (!out || out.u % 3 !== 1) continue;
  const ix = x - out.dx, iz = z - out.dz;
  const ig = ground.get(`${ix},${iz}`);
  if (ig === undefined || outward(ix, iz)) continue;   // must be interior footprint
  if (out.u % 6 === 1) {
    const y = base + 7;
    if (y > ig && y < TOP) put(ix, y, iz, "glowstone");
  }
  if (out.u % 6 === 4) {
    const y = base + 2;
    if (y > ig && y < base + 5) put(ix, y, iz, "shroomlight");
  }
}

// 4. Roof: AC plant on a grid of interior roof cells (stands on the roof slab).
if (TOP + 1 < H) {
  for (const [x, z] of cells) {
    if (outward(x, z)) continue;
    if (x % 5 === 2 && z % 5 === 2) put(x, TOP + 1, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
