import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise two-storey commercial block, Xinyi district: white-rendered concrete frame,
// stone-brick plinth, light-grey storey bands, glazed shopfront and upper-floor
// window grid, parapet with rooftop plant. Era guess from the lidar record: 1980s–90s.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw539951317";
const W = 22, H = 23, D = 20;

const ROOF = 11;        // roof slab level, about 11 blocks above lowest ground
const PARAPET = 12;     // parapet course and rooftop plant
const BAND = 5;         // storey line between ground floor and upper floor
const CORNICE = 10;     // top of upper-floor walls

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const foot = new Map();
for (const [x, z, gr] of cells) {
  foot.set(`${x},${z}`, Math.max(0, Math.min(gr, ROOF - 2)));
}
const has = (x, z) => foot.has(`${x},${z}`);

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, p) => (p ? g.set(x, y, z, id, p) : g.set(x, y, z, id));

// Missing-neighbour directions for an edge cell (facade faces).
function missing(x, z) {
  const m = [];
  if (!has(x - 1, z)) m.push([-1, 0]);
  if (!has(x + 1, z)) m.push([1, 0]);
  if (!has(x, z - 1)) m.push([0, -1]);
  if (!has(x, z + 1)) m.push([0, 1]);
  return m;
}

for (const [key, gr] of foot) {
  const [x, z] = key.split(",").map(Number);
  const miss = missing(x, z);
  const isEdge = miss.length > 0;

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (!isEdge) {
    // Interior: floor slabs per storey, air between; columns on a 5-block grid.
    put(x, gr, z, "smooth_stone");
    if (BAND > gr) put(x, BAND, z, "smooth_stone");
    if (x % 5 === 0 && z % 5 === 0) {
      for (let y = gr + 1; y < CORNICE + 1; y++) put(x, y, z, "white_concrete");
    }
    put(x, ROOF, z, "smooth_stone");
    if (x % 5 === 2 && z % 5 === 2) put(x, PARAPET, z, "iron_block"); // rooftop AC plant
    continue;
  }

  const isCorner = miss.length >= 2 && miss.some(m => m[0] !== 0) && miss.some(m => m[1] !== 0);
  const [mx, mz] = miss[0];
  const u = mz !== 0 ? x : z;            // position along the facade
  const bay = u % 3 !== 0;               // piers every third cell
  const frontEntrance = mz === -1 && mx === 0 && Math.abs(x - 11) <= 1;
  const inX = x - mx, inZ = z - mz;      // one cell inward from the facade
  const hasInward = has(inX, inZ);

  for (let y = gr; y <= CORNICE; y++) {
    let id = "white_concrete";
    let props;

    if (y === gr) {
      id = "polished_andesite";                       // base course
    } else if (y === BAND) {
      id = frontEntrance ? "stone_brick_slab" : "light_gray_concrete";
      if (frontEntrance) props = { type: "bottom", waterlogged: "false" }; // canopy
    } else if (y === CORNICE) {
      id = "quartz_block";                            // cornice
    } else if (isCorner) {
      id = "white_concrete";
    } else if (y <= 4 && y > gr) {
      // Ground floor: shopfront glazing, entrance centred on the front.
      if (bay) id = frontEntrance ? "glass" : "glass";
    } else if (y >= 6 && y <= 9) {
      // Upper floor: glass pane grid in each bay.
      if (bay) id = "glass_pane";
    }

    put(x, y, z, id, props);
  }

  // Warm light in some upper windows, placed one cell inside behind the glass.
  if (hasInward && bay && !isCorner && u % 6 === 1) {
    put(inX, 7, inZ, "glowstone");
  }

  // Interior floor slabs at ground, storey line and roof still apply behind the facade.
  if (hasInward) {
    if (foot.get(`${inX},${inZ}`) !== undefined) {
      put(inX, gr, inZ, "smooth_stone");
    }
  }

  // Roof slab and parapet on the perimeter.
  put(x, ROOF, z, "smooth_stone");
  put(x, PARAPET, z, "white_concrete");
}

// Roof ring: slab over the whole footprint already placed via edge/interior loops.
// Entrance canopy support: keep the band solid above the entrance glass.

g.save(`${DIR}/${ID}.nbt`);
