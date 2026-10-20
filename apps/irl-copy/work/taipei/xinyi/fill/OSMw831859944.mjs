import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Commercial mid-rise of the Xinyi district, c. 1990s: two storeys of cream
// tiled concrete over a stone plinth, a glazed shopfront at street level, a
// pale parapet cap, and rooftop plant boxes. Built from the lidar record only:
// flat roof about 11 blocks above the lowest ground.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw831859944";
const W = 32, H = 23, D = 16;
const TOP = H - 1; // highest usable y (22)

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// ---- footprint lookup -------------------------------------------------------
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));
const has = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => ground.get(`${x},${z}`);
const G = Math.min(...ground.values());          // datum: lowest ground under the building

// storey lines relative to the datum
const FL0 = G;          // ground-floor slab / base course
const FL1 = G + 5;      // first-floor slab
const ROOF = G + 10;    // roof slab
const PARAPET = G + 11; // parapet cap, about 11 above lowest ground

// ---- helpers ----------------------------------------------------------------
function put(x, y, z, id, props) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y > TOP) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

function isPerim(x, z) {
  return !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
}

// outward direction of a perimeter cell (the side with no neighbour)
function outDir(x, z) {
  if (!has(x, z + 1)) return { name: "south", dx: 0, dz: 1 };
  if (!has(x, z - 1)) return { name: "north", dx: 0, dz: -1 };
  if (!has(x + 1, z)) return { name: "east", dx: 1, dz: 0 };
  if (!has(x - 1, z)) return { name: "west", dx: -1, dz: 0 };
  return null;
}

// ---- foundation, slabs, walls, glazing --------------------------------------
for (const [x, z, gr] of cells) {
  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // interior floor slabs (only above ground)
  for (const fl of [FL1]) {
    if (fl >= gr) put(x, fl, z, "gray_concrete");
  }

  // flat roof slab across the whole footprint
  if (ROOF >= gr) put(x, ROOF, z, "light_gray_concrete");

  if (!isPerim(x, z)) {
    // roof plant on interior cells: small screened boxes
    if (x % 6 === 2 && z % 5 === 2) {
      for (let y = ROOF + 1; y <= ROOF + 2; y++) {
        if (y >= gr) put(x, y, z, "smooth_stone");
      }
    }
    continue;
  }

  const out = outDir(x, z);
  const alongX = out && out.dz !== 0; // north/south face: index by x
  const idx = alongX ? x : z;

  // exterior wall column
  for (let y = Math.max(gr, FL0); y < ROOF; y++) {
    const s = y < FL1 ? 0 : 1;
    const fl = s === 0 ? FL0 : FL1;
    const rel = y - fl;

    let id;
    if (rel === 0) {
      id = s === 0 ? "polished_granite" : "smooth_quartz"; // base course / storey line
    } else if (rel === 4) {
      id = "light_gray_concrete"; // spandrel
    } else {
      // rel 1..3: openings
      if (s === 0) {
        // shopfront: full glass with andesite piers every fourth cell
        id = idx % 4 === 0 ? "polished_andesite" : "light_blue_stained_glass";
      } else {
        // upper storey: panes with concrete mullions
        id = idx % 3 === 0 ? "gray_concrete" : "light_blue_stained_glass_pane";
      }
    }
    put(x, y, z, id);

    // warm light behind selected glass, inside the footprint
    if (rel === 2 && out && idx % 6 === 1) {
      const ix = x - out.dx, iz = z - out.dz;
      const inner = gnd(ix, iz);
      if (inner !== undefined && y >= inner) {
        put(ix, y, iz, "glowstone");
      }
    }
  }

  // parapet cap on the perimeter
  if (PARAPET >= gr) put(x, PARAPET, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
}

// ---- entrance on the main (south-most) face ---------------------------------
const frontCells = cells.filter(([x, z]) => {
  const o = outDir(x, z);
  return o && o.name === "south";
});
if (frontCells.length) {
  const cx = cells.reduce((a, [x]) => a + x, 0) / cells.length;
  let best = frontCells[0];
  for (const c of frontCells) if (Math.abs(c[0] - cx) < Math.abs(best[0] - cx)) best = c;
  const [ex, ez] = best;
  const gy = gnd(ex, ez);
  const door = { facing: "south", hinge: "left", open: "false", powered: "false" };
  put(ex, gy, ez, "dark_oak_door", { ...door, half: "lower" });
  put(ex, gy + 1, ez, "dark_oak_door", { ...door, half: "upper" });
  // recessed lantern over the door
  put(ex, gy + 2, ez, "lantern", { hanging: "true" });
  // canopy-style lintel above the door opening
  put(ex, FL0 + 4, ez, "light_gray_concrete");
}

// ---- roof plant over the partial storey line -------------------------------
// a single warm light on the roof edge for the street and the air view
for (const [x, z, gr] of cells) {
  if (!isPerim(x, z)) continue;
  const o = outDir(x, z);
  if (o && o.name === "north" && x === 0 && z === 0) {
    put(x, PARAPET + 1, z, "lantern", { hanging: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
