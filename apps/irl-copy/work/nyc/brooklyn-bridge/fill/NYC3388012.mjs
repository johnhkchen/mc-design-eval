import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC3388012.cells.json`, "utf8"));

const W = 14, H = 39, D = 22;
const MAX_TOP = 36;
const g = new Voxels([W, H, D]);

const cellMap = new Map();
for (const [x, z, gr, roof] of cells) {
  cellMap.set(`${x},${z}`, { x, z, gr: Math.round(gr), roof: Number(roof) });
}
const has = (x, z) => cellMap.has(`${x},${z}`);
const all = [...cellMap.values()];

// One smoothed roof level for the whole building: median lidar roof, snapped to 3-block storeys
const roofs = all.map(c => c.roof).sort((a, b) => a - b);
const medRoof = roofs[Math.floor(roofs.length / 2)];
const gMax = Math.max(...all.map(c => c.gr));
let TOP = gMax + 3 * Math.max(1, Math.round((medRoof - gMax) / 3));
if (TOP > MAX_TOP) TOP = MAX_TOP;

// Entrance: street-facing (min z) boundary cell nearest the frontage middle
const northCells = all.filter(c => !has(c.x, c.z - 1));
let doorCell = null;
if (northCells.length) {
  const xs = northCells.map(c => c.x).sort((a, b) => a - b);
  const mid = xs[Math.floor(xs.length / 2)];
  doorCell = northCells.reduce((best, c) =>
    (!best || Math.abs(c.x - mid) < Math.abs(best.x - mid)) ? c : best, null);
}

// Penthouse footprint: interior cells at least 3 in from every exposed edge
const distToEdge = (x, z) => {
  let d = 0;
  while (has(x - d, z) && has(x + d, z) && has(x, z - d) && has(x, z + d)) d++;
  return d;
};

for (const c of all) {
  const { x, z } = c;
  const gnd = Math.max(0, c.gr);
  let R = TOP;
  if (R < gnd + 3) R = gnd + 3;

  for (let y = 0; y < gnd; y++) g.set(x, y, z, "stone_bricks");

  const wW = !has(x - 1, z), wE = !has(x + 1, z);
  const wN = !has(x, z - 1), wS = !has(x, z + 1);
  const boundary = wW || wE || wN || wS;
  const corner = (wW || wE) && (wN || wS);
  const along = (wW || wE) ? z : x;
  const isGlassCol = (along % 4 === 1) || (along % 4 === 2);

  for (let y = gnd; y < R; y++) {
    const k = (y - gnd) % 3;
    const isBase = y === gnd;
    const isTop = y === R - 1;
    const groundStorey = (y - gnd) < 3;

    if (boundary) {
      if (corner) g.set(x, y, z, "bricks");
      else if (isTop) g.set(x, y, z, "stone_bricks");        // cornice
      else if (isBase) g.set(x, y, z, "stone_bricks");       // base course
      else if (k === 0) g.set(x, y, z, "smooth_stone");      // storey line
      else if (isGlassCol) g.set(x, y, z, groundStorey ? "glass" : "glass_pane");
      else g.set(x, y, z, "bricks");                         // pier
    } else {
      if (k === 0 || isTop) g.set(x, y, z, "smooth_stone");  // floor slab / roof
      else if (k === 2 && (x + z) % 7 === 0 && (y - gnd) > 2)
        g.set(x, y, z, "lantern", { hanging: "false" });     // warm light behind glass
    }
  }

  if (boundary) g.set(x, R, z, "stone_brick_wall", { up: "true" });
}

// Roof: a few vents and a centred penthouse block on the roof slab
const roofY = TOP;
const centred = all.filter(c => distToEdge(c.x, c.z) >= 3);
for (const c of centred) {
  if (c.x % 5 === 2 && c.z % 7 === 3 && roofY + 1 <= 37) {
    g.set(c.x, roofY, c.z, "bricks");
    g.set(c.x, roofY + 1, c.z, "stone_brick_slab", { type: "bottom" });
  }
}
// Penthouse: one storey of brick on the central cells, with a window band
const ph = centred.filter(c => distToEdge(c.x, c.z) >= 3 && c.x >= 4 && c.x <= 9 && c.z >= 6 && c.z <= 15);
for (const c of ph) {
  if (roofY + 3 > 37) break;
  for (let y = roofY; y < roofY + 3; y++) {
    if (y === roofY) g.set(c.x, y, c.z, "smooth_stone");
    else if (c.x === 4 || c.x === 9 || c.z === 6 || c.z === 15) g.set(c.x, y, c.z, "bricks");
    else if (y === roofY + 1) g.set(c.x, y, c.z, "glass_pane");
    else g.set(c.x, y, c.z, "stone_brick_slab", { type: "bottom" });
  }
}

// Entrance door and hanging lantern
if (doorCell) {
  const { x, z, gr } = doorCell;
  const gnd = Math.max(0, gr);
  g.set(x, gnd, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(x, gnd + 1, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  g.set(x, gnd + 2, z, "lantern", { hanging: "true" });
}

g.save(`${DIR}/NYC3388012.nbt`);
