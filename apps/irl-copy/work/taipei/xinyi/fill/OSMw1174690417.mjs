import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1174690417.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1174690417.nbt";

const W = 21, H = 23, D = 16;
const ROOF = 11;      // roof deck, absolute y
const PARAPET = 12;   // top of parapet
const GLASS = "light_blue_stained_glass_pane";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const ground = new Map();
for (const [x, z, g] of cells) ground.set(`${x},${z}`, g);

const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);
const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const miss = (x, z) => dirs.filter(([dx, dz]) => !has(x + dx, z + dz));

const g = new Voxels([W, H, D]);

// Pane connections: a pane on an east/west face runs along z (north/south arms).
function pane(x, y, z, faceDx) {
  const alongZ = faceDx !== 0;
  g.set(x, y, z, GLASS, {
    north: alongZ ? "true" : "false",
    south: alongZ ? "true" : "false",
    east: alongZ ? "false" : "true",
    west: alongZ ? "false" : "true",
    waterlogged: "false",
  });
}

// Entrance: a front (south-facing, missing z+1) single-missing face cell nearest the middle.
const frontCells = cells.filter(([x, z]) => {
  const m = miss(x, z);
  return m.length === 1 && m[0][0] === 0 && m[0][1] === 1;
});
let door = null;
if (frontCells.length) {
  const meanX = frontCells.reduce((s, [x]) => s + x, 0) / frontCells.length;
  const best = frontCells.reduce((a, b) => (Math.abs(b[0] - meanX) < Math.abs(a[0] - meanX) ? b : a));
  door = { x: best[0], z: best[1], g: best[2] };
}

// Pass 1: foundations, shell, floors, parapet, canopy, door.
for (const [x, z, g0] of cells) {
  const m = miss(x, z);
  const isPeri = m.length > 0;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < g0; y++) g.set(x, y, z, "stone_bricks");

  if (!isPeri) {
    // Interior: ground slab, storey slab at 5, roof deck at 11. Air between (behind-glass gap).
    g.set(x, g0, z, "smooth_stone");
    if (5 > g0) g.set(x, 5, z, "smooth_stone");
    if (ROOF > g0) g.set(x, ROOF, z, "gray_concrete");
    continue;
  }

  const isCorner = m.length >= 2;
  const faceDx = m[0][0];
  const idx = faceDx !== 0 ? z : x;
  const mullion = idx % 3 === 0;

  for (let y = g0; y <= PARAPET; y++) {
    if (isCorner) {
      g.set(x, y, z, y === g0 ? "stone_bricks" : "smooth_quartz");
      continue;
    }

    // Door cell.
    if (door && x === door.x && z === door.z && (y === door.g + 1 || y === door.g + 2)) {
      g.set(x, y, z, "iron_door", {
        facing: "south",
        half: y === door.g + 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }

    // Canopy/lintel above the entrance, spanning the door bay +-1.
    if (door && z === door.z && Math.abs(x - door.x) <= 1 && y === door.g + 3 && m[0][0] === 0 && m[0][1] === 1) {
      g.set(x, y, z, "smooth_quartz");
      continue;
    }

    let mat;
    if (y === g0) mat = "stone_bricks";
    else if (y === PARAPET) mat = "white_concrete";
    else if (y === ROOF) mat = "smooth_quartz";            // cornice
    else if (y === 10 || y === 6) mat = "white_concrete";  // head and sill spandrels
    else if (y === 5) mat = "smooth_quartz";               // storey line
    else mat = mullion ? "smooth_quartz" : GLASS;          // window / shopfront band

    if (mat === GLASS) pane(x, y, z, faceDx);
    else g.set(x, y, z, mat);
  }
}

// Pass 2: warm lights behind upper windows, entrance lantern, roof equipment.
for (const [x, z, g0] of cells) {
  const m = miss(x, z);
  if (m.length === 1) {
    const idx = m[0][0] !== 0 ? z : x;
    if (idx % 6 === 1 && idx % 3 !== 0) {
      const ix = x - m[0][0], iz = z - m[0][1];
      if (has(ix, iz) && miss(ix, iz).length === 0) g.set(ix, 8, iz, "glowstone");
    }
  }
}

if (door) {
  const ix = door.x, iz = door.z - 1;
  if (has(ix, iz) && miss(ix, iz).length === 0) {
    g.set(ix, gAt(ix, iz) + 1, iz, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

const inPent = (x, z) => x >= 7 && x <= 13 && z >= 5 && z <= 10;

for (const [x, z, g0] of cells) {
  if (miss(x, z).length > 0) continue;
  if (ROOF <= g0) continue;

  if (inPent(x, z)) {
    const ring = x === 7 || x === 13 || z === 5 || z === 10;
    if (ring) for (let y = PARAPET; y <= 14; y++) g.set(x, y, z, "white_concrete");
    g.set(x, 15, z, "smooth_quartz");
    continue;
  }

  // Mechanical boxes on the roof deck, scattered.
  if (x > 2 && x < 18 && z > 2 && z < 13 && (x * 3 + z * 5) % 11 === 0) {
    g.set(x, PARAPET, z, "light_gray_concrete");
    g.set(x, PARAPET + 1, z, "light_gray_concrete");
  }
}

g.save(OUT);
