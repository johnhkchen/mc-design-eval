// A 1930s red-brick commercial block (stripped classical, Eden Terrace / Newton fabric): a one-storey main body with a
// two-storey top block on the north-west and north-east corners, a setback and low wings on the south side. Brick walls
// on a stone plinth, smooth-stone string courses and cornices, glass windows with air and a floor slab behind them,
// a shopfront with a timber fascia and a recessed door at street level on the south face, a concrete roof with plant.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_293020906.cells.json", "utf8"));
const g = new Voxels([35, 21, 24]);

// the lidar roof heights (2..8) smoothed into four flat tiers: low wing 3, main body 4, setback 6, top block 8
const tierOf = (r) => (r <= 3 ? 3 : r <= 5 ? 4 : r <= 7 ? 6 : 8);
const raw = new Map(cells.map(([x, z, , roof]) => [`${x},${z}`, tierOf(roof)]));
// a 3x3 median over the footprint drops the one-cell lidar spikes that would stand up as chimneys
const top = new Map();
for (const [k, v] of raw) {
  const [x, z] = k.split(",").map(Number), near = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const n = raw.get(`${x + dx},${z + dz}`); if (n) near.push(n); }
  near.sort((a, b) => a - b); top.set(k, near[Math.floor(near.length / 2)]);
}
const T = (x, z) => top.get(`${x},${z}`) ?? 0;   // a tier of 0 is outside the footprint
const DIRS = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] };   // z grows south
const exposed = (x, z) => Object.keys(DIRS).filter((d) => T(x + DIRS[d][0], z + DIRS[d][1]) < T(x, z));
const isWall = (x, z) => exposed(x, z).length > 0;

const DOOR = [18, 23];                       // south face, street level
const SHOP_X = [17, 20];                     // shopfront run on the south face
const windows = [];                          // { x, y, z, face } for every glazed opening

for (const [x, z] of top.keys().map((k) => k.split(",").map(Number))) {
  const t = T(x, z), ex = exposed(x, z), wall = ex.length > 0, face = ex.length === 1 ? ex[0] : null;
  // plinth: the ground floor is solid under every footprint cell
  g.set(x, 0, z, "stone_bricks");
  if (x === DOOR[0] && z === DOOR[1]) g.set(x, 0, z, "stone_brick_stairs", { facing: "south", half: "bottom", shape: "straight", waterlogged: "false" });
  for (let y = 1; y < t; y++) {
    if (!wall) {                             // interior: a floor slab per storey and the roof deck, air between
      if (y === 4 && t >= 6) g.set(x, y, z, "smooth_stone");
      else if (y === t - 1) g.set(x, y, z, "stone");
      continue;
    }
    if (y === t - 1) { g.set(x, y, z, "smooth_stone"); continue; }                 // cornice
    if (t >= 6 && y === 4) { g.set(x, y, z, "smooth_stone"); continue; }           // string course
    // the south face at street level: shopfront glass, a timber fascia above, the door in the middle
    if (ex.includes("S") && z === DOOR[1] && x >= SHOP_X[0] && x <= SHOP_X[1]) {
      if (y === 3) { g.set(x, y, z, "dark_oak_planks"); continue; }
      if (x === DOOR[0] && (y === 1 || y === 2)) {
        g.set(x, y, z, "dark_oak_door", { facing: "south", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
        continue;
      }
      if (y <= 2) { g.set(x, y, z, "glass"); continue; }
    }
    const rows = t >= 8 ? [1, 2, 5, 6] : t >= 4 ? [1, 2] : [1];                   // glazed rows of each storey
    const glazed = face && rows.includes(y) &&
      ((face === "N" || face === "S") ? x % 3 === 1 : z % 3 === 1);
    if (glazed) {
      const ns = face === "N" || face === "S";  // a pane runs along the wall it sits in
      g.set(x, y, z, "glass_pane", ns
        ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
        : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
      windows.push({ x, y, z, face });
    } else {
      g.set(x, y, z, "bricks");
    }
  }
}

// warm light behind some windows: a glowstone on the floor of the room, inside the glass
const innerOf = ({ x, z, face }) => [x - DIRS[face][0], z - DIRS[face][1]];
for (const w of windows) {
  const [ix, iz] = innerOf(w);
  if ((w.x + 2 * w.z) % 4 !== 0 || isWall(ix, iz) || T(ix, iz) === 0) continue;
  const floorRow = w.y === 1 || (w.y === 5 && T(ix, iz) >= 8);
  if (!floorRow) continue;
  g.set(ix, w.y, iz, "glowstone");
}

// roof plant: a few iron units standing on the roof deck of the main body
for (const [x, z] of top.keys().map((k) => k.split(",").map(Number))) {
  if (T(x, z) === 4 && !isWall(x, z) && x % 5 === 2 && z % 4 === 1) g.set(x, 4, z, "iron_block");
}

const { blocks, palette } = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_293020906.nbt");
console.log(`way_293020906: ${blocks} blocks, palette ${palette}`);
