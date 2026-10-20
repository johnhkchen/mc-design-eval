import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1339487709";
const W = 89, H = 24, D = 36;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Footprint lookup: key "x,z" -> ground level (integer, clamped)
const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) {
  ground.set(key(x, z), Math.max(0, Math.min(12, Math.round(gr))));
}

const DIRS = [
  [1, 0, "east"],
  [-1, 0, "west"],
  [0, 1, "south"],
  [0, -1, "north"],
];

const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const outwardOf = (x, z) => DIRS.filter(([dx, dz]) => !ground.has(key(x + dx, z + dz)));
const isEdge = (x, z) => outwardOf(x, z).length > 0;
const mod4 = (n) => ((n % 4) + 4) % 4;

// Pick the main entrance: a north-facing edge cell nearest the centre line
const cx = Math.floor(W / 2);
let doorCands = cells
  .map(([x, z]) => [x, z])
  .filter(([x, z]) => isEdge(x, z) && outwardOf(x, z).some(([, dz]) => dz === -1));
if (doorCands.length === 0) {
  doorCands = cells.map(([x, z]) => [x, z]).filter(([x, z]) => isEdge(x, z));
}
doorCands.sort((a, b) => Math.abs(a[0] - cx) - Math.abs(b[0] - cx) || a[1] - b[1]);
const [doorX, doorZ] = doorCands[0];
const doorOut = outwardOf(doorX, doorZ)[0];
const doorFacing = doorOut[2];

// Main pass: foundation, interior slabs, edge facade
for (const [x, z, rawG] of cells) {
  const gr = ground.get(key(x, z));

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const edge = isEdge(x, z);
  const L = (k) => gr + k;

  if (!edge) {
    // Interior: floor slabs only, air gap between (no interiors)
    put(x, gr, z, "light_gray_concrete");
    put(x, L(5), z, "light_gray_concrete");
    put(x, L(11), z, "gray_concrete");

    // Rooftop AC units on some interior roof cells
    const roofY = L(12);
    if (roofY <= H - 1 && (((x >> 3) + (z >> 2)) % 3 === 0) && (x % 7 === 2 || x % 7 === 3) && (z % 5 === 1 || z % 5 === 2)) {
      put(x, roofY, z, "iron_block");
    }
    continue;
  }

  // Edge cell: facade
  const p = mod4(x + z);
  const [odx, odz] = outwardOf(x, z)[0];
  const isDoor = x === doorX && z === doorZ;

  // Base course
  put(x, gr, z, "polished_granite");

  // Ground floor shopfront (gr+1 .. gr+3)
  if (isDoor) {
    put(x, L(1), z, "dark_oak_door", { facing: doorFacing, half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, L(2), z, "dark_oak_door", { facing: doorFacing, half: "upper", hinge: "left", open: "false", powered: "false" });
    put(x, L(3), z, "smooth_quartz");
  } else {
    for (let k = 1; k <= 3; k++) {
      if (p === 0) put(x, L(k), z, "quartz_pillar");
      else if (p === 3) put(x, L(k), z, "white_concrete");
      else put(x, L(k), z, "cyan_stained_glass");
    }
  }
  put(x, L(4), z, "smooth_quartz"); // transom / canopy line

  // Storey line
  put(x, L(5), z, "white_concrete");

  // Upper storey (gr+6 .. gr+9): sill/lintel bands and glazed bays
  put(x, L(6), z, "smooth_quartz");
  for (let k = 7; k <= 8; k++) {
    if (p === 1 || p === 2) put(x, L(k), z, "light_blue_stained_glass");
    else if (p === 0) put(x, L(k), z, "quartz_pillar");
    else put(x, L(k), z, "white_concrete");
  }
  put(x, L(9), z, "smooth_quartz");

  // Cornice and parapet
  put(x, L(10), z, "smooth_quartz");
  put(x, L(11), z, "smooth_quartz");
}

// Second pass: warm lights just inside some windows, standing on floor slabs
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  if (!isEdge(x, z)) continue;
  const gr = ground.get(key(x, z));
  const p = mod4(x + z);
  const [odx, odz] = outwardOf(x, z)[0];
  const ix = x - odx, iz = z - odz;
  if (ix < 0 || iz < 0 || ix >= W || iz >= D) continue;
  if (!ground.has(key(ix, iz)) || isEdge(ix, iz)) continue;

  // Ground floor glow (sits on the ground slab)
  if ((p === 1 || p === 2) && ((x * 2 + z * 3) % 5 === 0) && !(x === doorX && z === doorZ)) {
    put(ix, gr + 1, iz, "glowstone");
  }
  // Upper floor glow (sits on the storey slab)
  if ((p === 1 || p === 2) && ((x * 3 + z * 5) % 7 === 0)) {
    put(ix, gr + 6, iz, "glowstone");
  }
}

g.save(`${DIR}/${ID}.nbt`);
