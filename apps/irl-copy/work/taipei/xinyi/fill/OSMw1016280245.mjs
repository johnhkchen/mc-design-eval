import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1016280245";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Footprint is 7 x 21: x 0..6, z 0..20. Roof deck at y 20, cornice at y 21.
const W = 7, H = 33, D = 21;
const ROOF = 20;      // top of storey 4, roof deck
const CORNICE = 21;   // parapet / cornice row
const g = new Voxels([W, H, D]);

const groundMap = new Map();
const key = (x, z) => `${x},${z}`;
for (const [x, z, gr] of cells) groundMap.set(key(x, z), gr);

const inF = (x, z) => groundMap.has(key(x, z));
const G = (x, z) => groundMap.get(key(x, z));

function put(x, y, z, id, props) {
  if (y < 0 || y >= H) return;
  if (!inF(x, z)) return;
  if (y < G(x, z)) return;            // below ground: foundation owns it
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

const isEdge = (x, z) =>
  !inF(x - 1, z) || !inF(x + 1, z) || !inF(x, z - 1) || !inF(x, z + 1);

const isCorner = (x, z) => (x === 0 || x === W - 1) && (z === 0 || z === D - 1);
const isLong = (x) => x === 0 || x === W - 1;

// Facade index: piers on long sides every 3 blocks, on end walls at x=1 and x=5.
function isPier(x, z) {
  if (isCorner(x, z)) return true;
  if (isLong(x)) return z % 3 === 0;
  return x === 1 || x === 5;
}

const PANE = "light_blue_stained_glass_pane";
function paneProps(x) {
  return isLong(x)
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
}

// 1. Foundation: solid stone from y 0 up to each cell's ground.
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
}

// 2. Shell: perimeter walls, storey lines, shopfront glass, piers, cornice.
for (const [x, z, gr] of cells) {
  if (!isEdge(x, z)) continue;
  for (let y = gr; y <= ROOF; y++) {
    const r = y % 5;
    if (y === gr) {
      put(x, y, z, "stone_bricks");                 // base course
    } else if (y === CORNICE) {
      put(x, y, z, "smooth_quartz");
    } else if (isCorner(x, z)) {
      put(x, y, z, "smooth_quartz");
    } else if (r === 0) {
      put(x, y, z, "smooth_stone");                 // storey line
    } else if (r === 4) {
      put(x, y, z, "white_concrete");               // spandrel
    } else if (isPier(x, z)) {
      put(x, y, z, "smooth_quartz");                // mullion / pier
    } else {
      // Window band (r 1..3); ground storey reads as shopfront glass
      put(x, y, z, PANE, paneProps(x));
    }
  }
  // Parapet cap at cornice row for non-corner cells is quartz; corners already handled.
  // Wall-top cornice course sits above roof deck.
  put(x, CORNICE, z, "smooth_quartz");
}

// 3. Interior: floor slabs at storey lines and roof deck; air otherwise (no interiors).
for (const [x, z, gr] of cells) {
  if (isEdge(x, z)) continue;
  for (const y of [5, 10, 15, ROOF]) {
    put(x, y, z, "light_gray_concrete");
  }
}

// 4. Entrance: double door centred on the z=0 (north) end wall, with a lintel above.
if (inF(3, 0)) {
  const gr = G(3, 0);
  put(3, gr, 0, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  if (gr + 1 <= ROOF) {
    put(3, gr + 1, 0, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  }
  // Lintel course over the entrance, two rows above the door head
  put(3, gr + 2, 0, "smooth_stone");
}

// 5. Warm lights behind some windows (shroomlights in the air gap, inside the glass).
for (const [x, z, gr] of cells) {
  if (!isEdge(x, z) || isCorner(x, z) || isPier(x, z)) continue;
  for (let s = 1; s <= 3; s++) {
    const y = s * 5 + 2;
    if (y < gr) continue;
    const idx = isLong(x) ? z : x;
    if ((idx + s) % 4 !== 1) continue;
    let ix = x, iz = z;
    if (x === 0) ix = 1;
    else if (x === W - 1) ix = W - 2;
    else if (z === 0) iz = 1;
    else if (z === D - 1) iz = D - 2;
    if (!inF(ix, iz) || isEdge(ix, iz)) continue;
    put(ix, y, iz, "shroomlight");
  }
}

// 6. Roof: mechanical plant block and a stair-tower-like stub, standing on the roof deck.
for (const [x, z, gr] of cells) {
  if (isEdge(x, z)) continue;
  if (x >= 2 && x <= 4 && z >= 7 && z <= 13) {
    put(x, CORNICE, z, "light_gray_concrete");
    if (x === 3 && z >= 9 && z <= 11) {
      put(x, CORNICE + 1, z, "light_gray_concrete");
      put(x, CORNICE + 2, z, "iron_bars");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
