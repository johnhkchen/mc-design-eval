import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const SRC = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC3001535.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC3001535.nbt";

const cells = JSON.parse(readFileSync(SRC, "utf8"));
const W = 5, H = 21, D = 17;
const g = new Voxels([W, H, D]);

// ---- footprint lookup -------------------------------------------------
const cellMap = new Map();
for (const [x, z, gr, roof] of cells) {
  cellMap.set(`${x},${z}`, { g: Math.round(gr), roof });
}
const has = (x, z) => cellMap.has(`${x},${z}`);
const mod3 = (v) => ((v % 3) + 3) % 3;

// storey lines align to the lowest ground under the footprint
const grounds = [...cellMap.values()].map((c) => c.g);
const B = Math.min(...grounds);
const maxG = Math.max(...grounds);

// one flat roof tier from the median lidar roof height, clamped to the grid
const roofs = [...cellMap.values()].map((c) => c.roof).sort((a, b) => a - b);
const median = roofs[Math.floor(roofs.length / 2)];
let T = Math.round(median);
T = Math.max(T, maxG + 3, B + 6);
T = Math.min(T, 17);

// ---- materials ---------------------------------------------------------
const BRICK = "bricks";                 // Flemish-bond style Brooklyn brick
const BROWNSTONE = "brown_terracotta";  // brownstone courses, lintels, cornice
const FOUNDATION = "stone_bricks";      // rubble/stone base below grade
const FLOOR = "oak_planks";
const ROOF = "smooth_stone";            // light tar-and-gravel roof, not a hole
const GLASS = "glass_pane";
const LANTERN = "lantern";
const DOOR = "dark_oak_door";
const COPING = "smooth_stone_slab";     // parapet coping

// ---- build -------------------------------------------------------------
for (const [key, cell] of cellMap) {
  const [x, z] = key.split(",").map(Number);
  const gr = cell.g;

  // foundation fill from y0 up to the cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, FOUNDATION);

  const hasW = has(x - 1, z), hasE = has(x + 1, z);
  const hasN = has(x, z - 1), hasS = has(x, z + 1);
  const boundary = !hasW || !hasE || !hasN || !hasS;
  const front = !hasN;   // street face at low z
  const rear = !hasS;    // garden face at high z

  for (let y = gr; y <= T - 1; y++) {
    const rel = mod3(y - B);

    if (!boundary) {
      // interior: roof deck on top, floor slab per storey, air otherwise
      if (y === T - 1) g.set(x, y, z, ROOF);
      else if (rel === 0) g.set(x, y, z, FLOOR);
      continue;
    }

    // boundary walls
    if (y === T - 1 && (front || rear)) {
      g.set(x, y, z, BROWNSTONE); // cornice band
      continue;
    }
    if (y === T - 1) {
      g.set(x, y, z, BRICK);
      continue;
    }
    if (rel === 0) {
      g.set(x, y, z, BROWNSTONE); // storey string course: sill below, lintel above
      continue;
    }

    // rel 1 and 2: window zone of each storey
    if ((front || rear) && (x === 1 || x === 3)) {
      g.set(x, y, z, GLASS);
    } else {
      g.set(x, y, z, BRICK);
    }
  }

  // parapet coping on top of every wall cell
  if (boundary) g.set(x, T, z, COPING, { type: "bottom", waterlogged: "false" });
}

// ---- entrance (front, centre bay) with brownstone surround -----------
if (has(2, 0)) {
  const gd = cellMap.get("2,0").g;
  // door sits in the ground storey: start on the cell's ground, avoiding a string course row
  let yd = gd;
  if (mod3(yd - B) === 0) yd += 1;
  if (yd + 1 < T - 1) {
    // brownstone surround: pilasters either side, lintel above
    for (const xs of [1, 3]) {
      for (let y = yd; y <= yd + 1; y++) g.set(xs, y, 0, BROWNSTONE);
    }
    g.set(2, yd, 0, DOOR, { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    g.set(2, yd + 1, 0, DOOR, { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    // entry lantern beside the door, on the surround (sits on the pilaster row above)
    if (yd + 2 < T - 1) g.set(2, yd + 2, 0, LANTERN, { hanging: "false", waterlogged: "false" });
  }
}

// ---- warm lights behind front windows (interior side of the glass) ---
for (const yl of [B + 4, B + 7]) {
  if (yl >= T - 2) continue;
  for (const xl of [1, 3]) {
    if (!has(xl, 1)) continue;
    const gc = cellMap.get(`${xl},1`).g;
    if (yl < gc) continue;
    if (!has(xl - 1, 1) || !has(xl + 1, 1) || !has(xl, 2)) continue;
    if (mod3(yl - B) !== 1) continue;
    g.set(xl, yl, 1, LANTERN, { hanging: "false", waterlogged: "false" });
  }
}

// ---- brick chimney rising from the roof deck --------------------------
if (has(1, 14) && has(0, 14) && has(2, 14) && has(1, 13) && has(1, 15)) {
  for (let y = T; y <= T + 2; y++) g.set(1, y, 14, BRICK);
  g.set(1, T + 3, 14, BROWNSTONE, { type: "bottom", waterlogged: "false" });
}

g.save(OUT);
