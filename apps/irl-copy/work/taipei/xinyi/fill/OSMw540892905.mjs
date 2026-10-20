import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540892905";
const W = 31, H = 23, D = 17;

// Record: 2 storeys (floor slab at y=5), flat roof deck at y=11, parapet to y=12.
// Era: late-20th-century Xinyi commercial block, tiled quartz-white facade,
// dark glass bays, shopfront at street level, rooftop plant.
const ROOF = 11;     // roof deck top layer
const FLOOR = 5;     // upper-floor slab / band course
const PARAPET = 12;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const GROUND = new Map();
for (const row of raw) {
  const [x, z, gr] = row;
  if (x >= 0 && x < W && z >= 0 && z < D) {
    GROUND.set(`${x},${z}`, Math.max(0, Math.round(gr ?? 0)));
  }
}

const inside = (x, z) => GROUND.has(`${x},${z}`);
const groundOf = (x, z) => GROUND.get(`${x},${z}`);
const isEdge = (x, z) =>
  !inside(x - 1, z) || !inside(x + 1, z) || !inside(x, z - 1) || !inside(x, z + 1);

// Front = the footprint's minimum-z edge (street side). Door sits nearest the middle.
let frontZ = Infinity;
for (const k of GROUND.keys()) frontZ = Math.min(frontZ, Number(k.split(",")[1]));
let doorCell = null;
{
  let best = Infinity;
  for (const k of GROUND.keys()) {
    const [x, z] = k.split(",").map(Number);
    if (z !== frontZ) continue;
    const d = Math.abs(x - 15);
    if (d < best) { best = d; doorCell = [x, z]; }
  }
}

const v = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) v.set(x, y, z, id, props);
  else v.set(x, y, z, id);
};

// Glass lit from behind: find an interior neighbour to hold a glowstone.
const inward = (x, z) => {
  for (const [dx, dz] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
    const nx = x + dx, nz = z + dz;
    if (inside(nx, nz) && !isEdge(nx, nz)) return [nx, nz];
  }
  return null;
};

const doorProps = (half) => ({
  facing: "north", half, hinge: "left", open: "false", powered: "false",
});

for (const k of GROUND.keys()) {
  const [x, z] = k.split(",").map(Number);
  const g = groundOf(x, z);
  const eg = Math.min(g, 4); // effective ground-storey start for the body

  // 1. Foundation: solid from y=0 up to the cell's own ground.
  for (let y = 0; y < g; y++) put(x, y, z, "stone_bricks");

  const edge = isEdge(x, z);
  const isDoor = doorCell && doorCell[0] === x && doorCell[1] === z;

  if (!edge) {
    // 2. Interior: floor slab per storey, roof deck, air gap in between.
    put(x, FLOOR, z, "light_gray_concrete");
    put(x, ROOF, z, "light_gray_concrete");
    // Rooftop plant boxes (2 tall) on a sparse grid.
    if (x % 9 === 4 && z % 6 === 3) {
      put(x, ROOF + 1, z, "smooth_stone");
      put(x, ROOF + 2, z, "smooth_stone");
    }
    continue;
  }

  // 3. Facade (edge cells).
  const pier = x % 4 === 0 || z % 4 === 0;
  for (let y = eg; y <= ROOF; y++) {
    if (isDoor && (y === eg || y === eg + 1)) {
      put(x, y, z, "oak_door", doorProps(y === eg ? "lower" : "upper"));
      continue;
    }
    if (y === ROOF) { put(x, y, z, "smooth_quartz"); continue; }            // cornice
    if (y === eg) { put(x, y, z, "polished_andesite"); continue; }          // base course
    if (y === FLOOR) { put(x, y, z, "smooth_quartz"); continue; }           // storey band
    if (y === 4 && eg < 4) { put(x, y, z, "white_concrete"); continue; }    // shopfront lintel
    if (y === 4 && eg === 4) continue;
    if (isDoor && y === eg + 2) { put(x, y, z, "white_concrete"); continue; }
    if (y === 6) { put(x, y, z, "white_concrete"); continue; }              // upper lintel
    if (y === 10) { put(x, y, z, "white_concrete"); continue; }            // sill
    if (y > eg && y < 4) {                                                  // shopfront zone
      put(x, y, z, pier ? "light_gray_concrete" : "glass");
      continue;
    }
    if (y >= 7 && y <= 9) {                                                 // upper window zone
      put(x, y, z, pier ? "white_concrete" : "light_blue_stained_glass");
      continue;
    }
  }

  // Parapet on the roof edge.
  put(x, PARAPET, z, "white_concrete");

  // Warm lights behind some glass.
  if (!pier && x % 8 === 2) {
    const inn = inward(x, z);
    if (inn) put(inn[0], 8, inn[1], "glowstone");
  }
  if (!pier && x % 8 === 6 && eg < 4) {
    const inn = inward(x, z);
    if (inn) put(inn[0], eg + 2, inn[1], "glowstone");
  }
}

v.save(`${DIR}/${ID}.nbt`);
