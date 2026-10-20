import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540295628";
const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const list = (Array.isArray(raw) ? raw : raw.cells).map(([x, z, gy]) => [x, z, Math.round(gy)]);

const W = 21, H = 23, D = 23;
const g = new Voxels([W, H, D]);

// Footprint lookup
const key = (x, z) => x + "," + z;
const ground = new Map(list.map(([x, z, gy]) => [key(x, z), gy]));
const has = (x, z) => ground.has(key(x, z));
const gnd = (x, z) => ground.get(key(x, z));

const minG = Math.min(...list.map(c => c[2]));
const TOP = minG + 10;                      // parapet layer; roof surface at minG + 11
const minZ = Math.min(...list.map(c => c[1]));

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const perim = (x, z) => DIRS.some(([dx, dz]) => !has(x + dx, z + dz));
const missing = (x, z) => DIRS.filter(([dx, dz]) => !has(x + dx, z + dz));

// Entrance: centre of the north (min-z) edge
const northEdge = list.filter(([x, z]) => z === minZ && !has(x, z - 1)).map(c => c[0]).sort((a, b) => a - b);
const entranceX = northEdge.length ? northEdge[Math.floor(northEdge.length / 2)] : null;

const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Bay logic: vertical piers every 3 bays and at corners
const isCorner = miss => miss.some(d => d[0] !== 0) && miss.some(d => d[1] !== 0);
const bayOf = (x, z, miss) => (miss.some(([dx, dz]) => dz !== 0) ? x : z);
const isPier = (x, z, miss) => isCorner(miss) || (bayOf(x, z, miss) % 3 === 0);

function facade(x, z, h, miss) {
  if (h === 0) return { id: "smooth_stone" };                  // base course
  if (h === 4 || h === 9) return { id: "quartz_block" };      // storey bands / cornice
  if (h === 5) return { id: "light_gray_concrete" };           // floor spandrel
  if (h === 10) return { id: "smooth_quartz" };                // parapet
  if (h < 0 || h > 10) return null;

  if (isPier(x, z, miss)) return { id: "light_gray_concrete" };

  const upper = h >= 6;
  const isEntrance = !upper && entranceX !== null && z === minZ && x === entranceX
    && miss.some(([dx, dz]) => dz === -1);
  if (isEntrance) {
    if (h === 1) return { id: "dark_oak_door", props: { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" } };
    if (h === 2) return { id: "dark_oak_door", props: { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" } };
    if (h === 3) return { id: "dark_oak_slab", props: { type: "bottom", waterlogged: "false" } }; // canopy
  }
  return { id: "light_blue_stained_glass_pane" };
}

// Pass 1: foundations, floors, facades
for (const [x, z, gy] of list) {
  for (let y = 0; y < gy; y++) put(x, y, z, "stone_bricks");

  const isPerim = perim(x, z);
  const miss = missing(x, z);

  for (let y = gy; y <= TOP; y++) {
    if (isPerim) {
      const b = facade(x, z, y - minG, miss);
      if (b) put(x, y, z, b.id, b.props);
    } else if (y === minG || y === minG + 5 || y === TOP) {
      put(x, y, z, "light_gray_concrete");                    // floor / roof slabs
    }
    // else: air gap behind glass
  }
}

// Pass 2: warm lights behind some glazed bays
for (const [x, z, gy] of list) {
  if (!perim(x, z)) continue;
  const miss = missing(x, z);
  if (miss.length === 0 || isPier(x, z, miss)) continue;
  const [dx, dz] = miss[0];
  const ix = x - dx, iz = z - dz;
  if (!has(ix, iz) || perim(ix, iz)) continue;

  if (gy <= minG + 7 && (x + z) % 4 === 0) {
    put(ix, minG + 7, iz, "shroomlight");                    // upper storey
  } else if (gy <= minG + 2 && (x + z) % 4 === 2) {
    put(ix, minG + 2, iz, "glowstone");                      // ground floor
  }
}

// Pass 3: roof plant room and mast
for (const [x, z] of list) {
  if (perim(x, z)) continue;
  if (x >= 7 && x <= 13 && z >= 8 && z <= 14) {
    put(x, TOP + 1, z, "light_gray_concrete");
    put(x, TOP + 2, z, "smooth_stone");
  }
}
if (has(10, 11)) {
  for (let y = TOP + 3; y <= TOP + 5; y++) put(10, y, 11, "lightning_rod");
}

g.save(`${DIR}/${ID}.nbt`);
