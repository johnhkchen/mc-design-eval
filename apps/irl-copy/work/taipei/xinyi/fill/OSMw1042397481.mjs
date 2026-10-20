import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1042397481.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1042397481.nbt";

// Building record: 22 x 17 footprint, roof about 26 blocks above lowest ground.
// Read as a 1980s-90s five-storey office block: pale concrete piers and spandrels,
// blue-glass window bands, a stone plinth and shopfront, a quartz cornice and parapet,
// a roof deck with a mechanical penthouse and a lightning-rod mast.
const W = 22, H = 38, D = 17;
const ROOF_DECK = 25;   // roof deck (solid) at y=25, top of structure = 26 blocks
const PARAPET = 26;     // parapet ring at y=26
const STOREY = 5;

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);

const has = (x, z) => ground.has(`${x},${z}`);
const isBoundary = (x, z) =>
  !has(x, z - 1) || !has(x, z + 1) || !has(x - 1, z) || !has(x + 1, z);

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Facade block for a boundary cell at height y.
function facadeBlock(x, y, z, gr, pier, glassLit) {
  const k = Math.floor(y / STOREY);
  const rel = y % STOREY;
  if (k === 0) {
    if (y === gr) return ["stone_bricks"];           // plinth course
    if (y === 4) return ["smooth_stone"];            // shopfront fascia
    if (pier) return ["polished_granite"];
    return ["light_blue_stained_glass"];             // shopfront glazing
  }
  if (rel === 0) return ["light_gray_concrete"];     // spandrel at storey line
  if (rel === 4) return ["white_concrete"];          // frieze under slab
  if (pier) return ["quartz_pillar"];
  return ["light_blue_stained_glass"];
}

// Pass 1: foundations, walls, floor slabs, roof.
for (const [x, z, gr] of cells) {
  // Foundation: fill solid from y=0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const N = !has(x, z - 1), S = !has(x, z + 1);
  const Wd = !has(x - 1, z), E = !has(x + 1, z);
  const boundary = N || S || Wd || E;
  const corner = (N || S) && (Wd || E);
  // Along-face coordinate for pier rhythm.
  const a = (N || S) ? x : z;
  const pier = corner || (a % 3 === 0);

  for (let y = gr; y <= PARAPET; y++) {
    if (y === PARAPET) {
      if (boundary) put(x, y, z, "white_concrete");
      continue;
    }
    if (y === ROOF_DECK) {
      if (boundary) put(x, y, z, "quartz_block");       // cornice
      else put(x, y, z, "gray_concrete");              // roof deck
      continue;
    }
    if (boundary) {
      const [id] = facadeBlock(x, y, z, gr, pier);
      const props = null;
      put(x, y, z, id, props);
    } else if (y === gr || y % STOREY === 0) {
      put(x, y, z, "light_gray_concrete");             // floor slab
    }
  }
}

// Pass 2: entrance on the north face, centred on the footprint.
const northCells = cells
  .filter(([x, z]) => !has(x, z - 1))
  .sort((p, q) => p[0] - q[0]);
if (northCells.length) {
  const midX = Math.floor(northCells.reduce((s, c) => s + c[0], 0) / northCells.length);
  let door = northCells.reduce((best, c) =>
    Math.abs(c[0] - midX) < Math.abs(best[0] - midX) ? c : best);
  const [dx, dz, dg] = door;
  if (dg + 2 <= 3) {
    put(dx, dg + 1, dz, "dark_oak_door", {
      facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
    });
    put(dx, dg + 2, dz, "dark_oak_door", {
      facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
    });
  }
}

// Pass 3: warm lights behind some upper-floor windows (air gap inside the shell).
for (const [x, z, gr] of cells) {
  if (!isBoundary(x, z)) continue;
  const N = !has(x, z - 1), S = !has(x, z + 1);
  const Wd = !has(x - 1, z), E = !has(x + 1, z);
  if ((N || S) && (Wd || E)) continue; // skip corners
  let dx = 0, dz = 0;
  if (N) dz = -1; else if (S) dz = 1; else if (Wd) dx = -1; else if (E) dx = 1;
  const a = (N || S) ? x : z;
  if (a % 3 === 0) continue; // piers, not windows
  const ix = x - dx, iz = z - dz;
  if (!has(ix, iz) || isBoundary(ix, iz)) continue;
  for (let y = Math.max(gr, STOREY); y < ROOF_DECK; y++) {
    const rel = y % STOREY;
    if (rel < 1 || rel > 3) continue;
    if (((x * 7 + y * 13 + z * 3) % 11) !== 0) continue;
    const id = ((x + y + z) % 2 === 0) ? "shroomlight" : "glowstone";
    put(ix, y, iz, id);
  }
}

// Pass 4: mechanical penthouse on the roof deck, centred, with a lightning-rod mast.
const PX0 = 6, PX1 = 15, PZ0 = 5, PZ1 = 11, PY0 = 26, PY1 = 29, PTOP = 30;
for (let x = PX0; x <= PX1; x++) {
  for (let z = PZ0; z <= PZ1; z++) {
    if (!has(x, z)) continue;
    const ring = x === PX0 || x === PX1 || z === PZ0 || z === PZ1;
    const corner = (x === PX0 || x === PX1) && (z === PZ0 || z === PZ1);
    for (let y = PY0; y <= PY1; y++) {
      if (!ring) continue; // interior air
      if (y === PY0) put(x, y, z, "light_gray_concrete");
      else if (corner || y === PY1) put(x, y, z, "white_concrete");
      else if ((x + z) % 3 === 0) put(x, y, z, "quartz_pillar");
      else put(x, y, z, "light_blue_stained_glass");
    }
    put(x, PTOP, z, "light_gray_concrete");
  }
}
const mx = 10, mz = 8;
if (has(mx, mz)) {
  put(mx, PTOP + 1, mz, "lightning_rod");
  put(mx, PTOP + 2, mz, "lightning_rod");
}

g.save(OUT);
