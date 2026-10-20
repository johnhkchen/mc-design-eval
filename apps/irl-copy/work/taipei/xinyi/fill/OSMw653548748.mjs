import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw653548748";
const W = 28, H = 66, D = 28;
const STOREY = 5;          // blocks per storey
const STOREYS = 10;        // 10 storeys -> roof near 50, plant room to ~54
const SETBACK_K = 7;       // storeys 7..9 sit on a 3-cell inset
const INSET = 3;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const vox = new Voxels([W, H, D]);

// footprint lookup: "x,z" -> ground (absolute y, lowest ground is 0)
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];

function put(x, y, z, id, props) {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) vox.set(x, y, z, id, props);
  else vox.set(x, y, z, id);
}

// storey footprint: full footprint for the podium tier, inset for the upper tier
function inTier(x, z, k) {
  if (!has(x, z)) return false;
  if (k < SETBACK_K) return true;
  return x >= INSET && x <= W - 1 - INSET && z >= INSET && z <= D - 1 - INSET;
}

const inTier2 = (x, z) => inTier(x, z, 9);
const inPlant = (x, z) => has(x, z) && x >= 7 && x <= 20 && z >= 7 && z <= 20;
const inFoot = (x, z) => has(x, z);

// true if any side of (x,z) lies outside region R
function isEdge(x, z, R) {
  return NB.some(([dx, dz]) => !R(x + dx, z + dz));
}

const PANE = { east: "true", west: "true", north: "true", south: "true", waterlogged: "false" };

for (const [x, z, gr] of cells) {
  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  for (let k = 0; k < STOREYS; k++) {
    const R = (a, c) => inTier(a, c, k);
    const b = gr + STOREY * k;

    if (!R(x, z)) {
      // inset-tier cells lie on the lower terrace; outer cells form the terrace
      if (k === SETBACK_K) {
        put(x, b, z, (x * 7 + z * 3) % 9 === 0 ? "moss_block" : "smooth_stone");
        if (isEdge(x, z, inFoot)) {
          put(x, b + 1, z, "white_concrete");
          put(x, b + 2, z, "white_concrete");
          put(x, b + 3, z, "quartz_slab", { type: "top" });
        }
      }
      continue;
    }

    // floor slab for every storey, across the whole storey footprint
    put(x, b, z, "light_gray_concrete");

    if (!isEdge(x, z, R)) continue; // interior: air gap, no interiors

    const [dx, dz] = NB.find(([p, q]) => !R(x + p, z + q));
    const ix = x - dx, iz = z - dz; // inward neighbour
    const mull = x % 4 === 0 || z % 4 === 0;
    const entranceOpen = k === 0 && z === 0 && (x === 13 || x === 14);
    const entranceZone = k === 0 && z === 0 && x >= 12 && x <= 15;

    if (k === 0) {
      if (!entranceOpen) put(x, b + 1, z, "polished_andesite");
      if (entranceZone && (x === 13 || x === 14)) {
        put(x, b + 3, z, "quartz_block"); // lintel over the entrance
      } else {
        for (let dy = 2; dy <= 3; dy++) {
          if (mull) put(x, b + dy, z, "white_concrete");
          else put(x, b + dy, z, "light_blue_stained_glass_pane", PANE);
        }
      }
      put(x, b + 4, z, "smooth_stone");
    } else {
      for (let dy = 1; dy <= 3; dy++) {
        if (mull) put(x, b + dy, z, "white_concrete");
        else put(x, b + dy, z, "light_blue_stained_glass_pane", PANE);
      }
      put(x, b + 4, z, "white_concrete"); // spandrel band
    }

    // warm light just behind some windows
    const glass = !mull && !entranceZone;
    if (glass && R(ix, iz) && (x * 3 + z * 5 + k * 7) % 11 === 0) {
      put(ix, b + 2, iz, "glowstone");
    }
  }

  // upper-tier roof and parapet at g+50
  if (inTier2(x, z)) {
    put(x, gr + 50, z, "quartz_block");
    if (isEdge(x, z, inTier2)) {
      put(x, gr + 51, z, "white_concrete");
      put(x, gr + 52, z, "white_concrete");
      put(x, gr + 53, z, "quartz_slab", { type: "top" });
    }
  }

  // roof plant room
  if (inPlant(x, z)) {
    if (isEdge(x, z, inPlant)) {
      put(x, gr + 51, z, "light_gray_concrete");
      if ((x + z) % 2 === 0) put(x, gr + 52, z, "iron_bars");
      else put(x, gr + 52, z, "light_gray_concrete");
      put(x, gr + 53, z, "light_gray_concrete");
    }
    put(x, gr + 54, z, "smooth_stone");
  }

  // mast on the plant room
  if (x === 13 && z === 13) {
    for (let dy = 55; dy <= 58; dy++) {
      put(x, gr + dy, z, "lightning_rod", { facing: "up" });
    }
  }
}

vox.save(`${DIR}/${ID}.nbt`);
