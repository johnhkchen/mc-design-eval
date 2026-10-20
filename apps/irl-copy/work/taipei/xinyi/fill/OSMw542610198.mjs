import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no source. Decided from lidar: 19 x 17 footprint, roof ~11 blocks above lowest ground.
// Reads as a two-storey, cream-clad 1980s-90s commercial block: granite plinth, tinted glass
// shopfront, a storey band, upper punched windows, quartz cornice and parapet, rooftop plant.

const cells = JSON.parse(
  readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw542610198.cells.json", "utf8")
);

const W = 19, H = 23, D = 17;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const has = (x, z) => ground.has(key(x, z));
const gmin = Math.min(...cells.map((c) => c[2]));

// Global storey levels, measured from the lowest ground.
const L1 = gmin + 5;   // storey band / upper floor slab
const L2 = gmin + 10;  // cornice
const TOP = gmin + 11; // parapet and roof deck (roof ~11 above lowest ground)

function put(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

const CLAD = "white_terracotta";
const PANE_NS = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const PANE_EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Pass 1: foundations, exterior walls, floors, roof deck.
const doorCandidates = [];
for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y <= gr; y++) put(x, y, z, "stone_bricks");

  const nN = !has(x, z - 1), nS = !has(x, z + 1);
  const nW = !has(x - 1, z), nE = !has(x + 1, z);
  const ext = nN || nS || nW || nE;
  const corner = (nN || nS) && (nW || nE);
  const alongX = nN || nS;
  const mull = corner || (alongX ? x % 3 === 0 : z % 3 === 0);
  const i = alongX ? x : z;

  if (!ext) {
    if (L1 > gr) put(x, L1, z, "light_gray_concrete");   // floor slab per storey
    if (TOP > gr) put(x, TOP, z, "light_gray_concrete"); // roof deck
    continue;
  }

  if (nS && !corner) doorCandidates.push({ x, z, gr });

  for (let y = gr + 1; y <= TOP; y++) {
    let id = null, props = undefined;
    if (y === gr + 1) {
      id = "polished_granite"; // base course
    } else if (y <= gmin + 3) {
      id = mull ? CLAD : "gray_stained_glass"; // shopfront
    } else if (y === gmin + 4) {
      id = CLAD; // lintel
    } else if (y === L1) {
      id = "light_gray_concrete"; // storey band
    } else if (y <= gmin + 9) {
      if (mull) id = CLAD;
      else { id = "light_blue_stained_glass_pane"; props = alongX ? PANE_NS : PANE_EW; }
    } else if (y === L2) {
      id = "smooth_quartz"; // cornice
    } else if (y === TOP) {
      id = "smooth_quartz"; // parapet
    }
    if (id) put(x, y, z, id, props);
  }

  // Warm light behind some upper and ground-floor windows.
  if (!mull && !corner) {
    const ix = x + (nW ? 1 : nE ? -1 : 0);
    const iz = z + (nN ? 1 : nS ? -1 : 0);
    if (has(ix, iz) && !(!has(ix - 1, iz) || !has(ix + 1, iz) || !has(ix, iz - 1) || !has(ix, iz + 1))) {
      if (i % 6 === 1) put(ix, gmin + 6, iz, "glowstone"); // upper floor, standing on the slab
      if (i % 6 === 4) put(ix, gr + 1, iz, "lantern", { hanging: "false", waterlogged: "false" });
    }
  }
}

// Pass 2: main entrance on the south face, nearest the middle.
if (doorCandidates.length) {
  doorCandidates.sort((a, b) => Math.abs(a.x - 9) - Math.abs(b.x - 9));
  const { x, z, gr } = doorCandidates[0];
  put(x, gr + 2, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(x, gr + 3, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  // Hanging lantern under the entrance lintel, supported by the storey band above.
  if (gr + 4 === gmin + 4) put(x, gr + 4, z, "lantern", { hanging: "true", waterlogged: "false" });
}

// Pass 3: rooftop plant room and screen on the roof deck.
for (let x = 6; x <= 12; x++) {
  for (let z = 5; z <= 10; z++) {
    if (!has(x, z)) continue;
    const ext = !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
    if (ext) continue;
    put(x, TOP + 1, z, "gray_concrete");
    if (x >= 7 && x <= 11 && z >= 6 && z <= 9) {
      put(x, TOP + 2, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
    }
  }
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw542610198.nbt");
