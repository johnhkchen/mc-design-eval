import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// TPE107-0227-1F: 2018 low-rise retail/office pavilion in Xinyi.
// One storey of about 5 blocks under a flat roof at a single datum (lidar: 7 blocks).
// White stone-clad walls with a quartz parapet, light-blue glazing with quartz piers,
// a granite base course, a storefront and recessed door on the north (min-z) face,
// warm lanterns behind some glass, and a rooftop plant screen.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE107-0227-1F";
const W = 10, H = 19, D = 22;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z] of cells) {
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const isPerim = (x, z) =>
  !has(x, z - 1) || !has(x, z + 1) || !has(x - 1, z) || !has(x + 1, z);

// One roof datum for the whole building: parapet top block at 6 (surface at 7).
// Cells on higher ground get a shorter storey, not a higher roof.
const ROOF_TOP = 6;
const roofTop = (gr) => Math.max(ROOF_TOP, gr + 5);

// Door: on the north (min-z) face, nearest the footprint's centre line.
const midX = (minX + maxX) / 2;
const frontXs = cells
  .filter(([x, z]) => z === minZ && !has(x, z - 1))
  .map(([x]) => x);
const doorX = frontXs.reduce((best, x) =>
  Math.abs(x - midX) < Math.abs(best - midX) ? x : best, frontXs[0]);

const paneZFacade = {
  east: "true", west: "true", north: "false", south: "false", waterlogged: "false",
};
const paneXFacade = {
  east: "false", west: "false", north: "true", south: "true", waterlogged: "false",
};

const lightCandidates = [];
const interior = new Map(); // interior cell key -> ground

// Pass 1: foundations, floors, walls, parapets, recessed roof.
for (const [x, z, gr] of cells) {
  const RT = roofTop(gr);

  // Foundation to ground; floor slab at ground level.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  put(x, gr, z, "smooth_stone");

  if (!isPerim(x, z)) {
    interior.set(`${x},${z}`, gr);
    put(x, RT - 1, z, "stone"); // roof deck, recessed one block below the parapet
    continue;
  }

  const missN = !has(x, z - 1);
  const missS = !has(x, z + 1);
  const missW = !has(x - 1, z);
  const missE = !has(x + 1, z);
  const nMiss = [missN, missS, missW, missE].filter(Boolean).length;
  const isCorner = nMiss >= 2;
  const zFacade = missN || missS; // wall runs east-west
  const bay = zFacade ? x - minX : z - minZ;
  const isPier = isCorner || bay % 3 === 0;
  const isFront = missN && z === minZ;
  const isDoorCell = isFront && x === doorX;
  const pane = zFacade ? paneZFacade : paneXFacade;

  for (let y = gr + 1; y <= RT; y++) {
    if (y === RT) {
      // Parapet cap.
      put(x, y, z, "smooth_quartz");
      continue;
    }
    if (isCorner) {
      put(x, y, z, "quartz_pillar", { axis: "y" });
      continue;
    }
    if (y === gr + 1) {
      // Base course; shopfront glazing on the street face.
      if (isDoorCell) {
        put(x, y, z, "dark_oak_door", {
          facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
        });
      } else if (isFront && !isPier) {
        put(x, y, z, "light_blue_stained_glass_pane", pane);
      } else {
        put(x, y, z, "polished_granite");
      }
      continue;
    }
    if (y === RT - 1) {
      put(x, y, z, "smooth_quartz"); // storey line under the parapet
      continue;
    }
    // Window band.
    if (isDoorCell && y === gr + 2) {
      put(x, y, z, "dark_oak_door", {
        facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
      });
      continue;
    }
    if (isFront && y === gr + 3 && Math.abs(x - doorX) <= 1) {
      put(x, y, z, "smooth_quartz"); // lintel over the entrance
      continue;
    }
    if (isPier) {
      put(x, y, z, "smooth_quartz");
    } else {
      put(x, y, z, "light_blue_stained_glass_pane", pane);
      if (y === gr + 2 && bay % 2 === 0 && !isFront) {
        // Inward neighbour: where a lantern can stand behind this glass.
        let ix = x, iz = z;
        if (missN) iz = z + 1;
        else if (missS) iz = z - 1;
        else if (missW) ix = x + 1;
        else if (missE) ix = x - 1;
        lightCandidates.push([ix, iz]);
      }
    }
  }
}

// Pass 2: warm lanterns standing on the interior floor behind lit windows.
const litDone = new Set();
for (const [ix, iz] of lightCandidates) {
  const key = `${ix},${iz}`;
  if (litDone.has(key) || !interior.has(key)) continue;
  litDone.add(key);
  const gr = interior.get(key);
  put(ix, gr + 1, iz, "lantern", { hanging: "false", waterlogged: "false" });
}

// Pass 3: rooftop plant screen on interior roof cells, rising above the parapet datum.
for (const [key, gr] of interior) {
  const [x, z] = key.split(",").map(Number);
  const RT = roofTop(gr);
  const rel = z - minZ;
  if ((x === 2 || x === 3) && rel >= 7 && rel <= 8) {
    put(x, RT, z, "light_gray_concrete");
    put(x, RT + 1, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
