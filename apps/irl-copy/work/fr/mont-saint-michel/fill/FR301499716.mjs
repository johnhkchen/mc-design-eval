import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const cells = JSON.parse(readFileSync(`${DIR}/FR301499716.cells.json`, "utf8"));

const W = 21, H = 37, D = 22;
const g = new Voxels([W, H, D]);

const put = (x, y, z, block, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

// ---- index the footprint ----
const key = (x, z) => `${x},${z}`;
const cm = new Map();
for (const [x, z, gr, r] of cells) cm.set(key(x, z), { x, z, gr, r });
const has = (x, z) => cm.has(key(x, z));

// distance from the perimeter (1 = exposed edge cell), multi-source BFS
const dist = new Map();
const queue = [];
for (const c of cm.values()) {
  const edge = !has(c.x - 1, c.z) || !has(c.x + 1, c.z) || !has(c.x, c.z - 1) || !has(c.x, c.z + 1);
  if (edge) { dist.set(key(c.x, c.z), 1); queue.push(c); }
}
for (let qi = 0; qi < queue.length; qi++) {
  const c = queue[qi];
  const d = dist.get(key(c.x, c.z));
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = c.x + dx, nz = c.z + dz;
    if (!has(nx, nz) || dist.has(key(nx, nz))) continue;
    dist.set(key(nx, nz), d + 1);
    queue.push(cm.get(key(nx, nz)));
  }
}

// ---- one ridge level for the whole roof (lidar median, so no jagged tops) ----
const roofs = [...cm.values()].map(c => c.r).sort((a, b) => a - b);
const ridge = roofs[Math.floor(roofs.length / 2)] - 1;   // top block index of the roof

// exposed faces of a perimeter cell
const exposedFaces = (c) => ({
  w: !has(c.x - 1, c.z),
  e: !has(c.x + 1, c.z),
  n: !has(c.x, c.z - 1),
  s: !has(c.x, c.z + 1),
});

// ---- entrance: exposed north (-z) face cell nearest the middle ----
let doorCell = null;
{
  const northCells = [...cm.values()]
    .filter(c => !has(c.x, c.z - 1))
    .sort((a, b) => Math.abs(a.x - 10) - Math.abs(b.x - 10));
  doorCell = northCells[0] || null;
}
const doorKey = doorCell ? key(doorCell.x, doorCell.z) : null;

// ---- build each cell ----
for (const c of cm.values()) {
  const { x, z } = c;
  const gy = c.gr;
  const d = dist.get(key(x, z)) || 1;
  const perimeter = d === 1;
  const faces = exposedFaces(c);
  const isCorner = perimeter && (faces.w || faces.e) && (faces.n || faces.s);

  // eave: three storeys of 5 from the cell's ground, never above the ridge band
  const eave = Math.max(gy + 3, Math.min(gy + 15, ridge - 5));

  // stepped hip: edge cells sit lower, the core reaches the ridge
  const roofY = Math.max(eave + 1, ridge - Math.max(0, 3 - d));

  // foundation: solid stone from y0 up to the cell's ground
  for (let y = 0; y < gy; y++) put(x, y, z, "stone_bricks");

  // walls
  for (let y = gy; y < eave; y++) {
    const rel = y - gy;
    let b = "stone_bricks";
    if (rel === 0) b = "polished_andesite";                              // plinth
    else if (perimeter && rel % 5 === 0) b = "polished_andesite";         // storey lines
    else if (perimeter && y === eave - 1) b = "polished_andesite";        // cornice band
    if (isCorner && rel > 0 && rel !== 5 && rel !== 10) b = "polished_andesite"; // quoins
    put(x, y, z, b);
  }

  // windows: two-column bays on each exposed face, three storeys
  if (perimeter && !isCorner) {
    const onXFace = faces.w || faces.e;                  // exposed face runs along z
    const alongIndex = onXFace ? z : x;
    const isDoorCell = key(x, z) === doorKey;
    const bay = alongIndex % 4;                          // window on columns 1 and 2 of each bay
    const isWindow = bay === 1 || bay === 2;
    for (let k = 0; k < 3; k++) {
      for (let rr = 1; rr <= 3; rr++) {
        const y = gy + 5 * k + rr;
        if (y >= eave - 1) continue;
        if (isDoorCell && k === 0 && rr <= 2) continue;
        if (!isWindow) continue;
        const lit = ((alongIndex + k) % 7 === 1) && rr === 2;
        if (lit) {
          put(x, y, z, "glowstone");
        } else {
          const props = onXFace
            ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
            : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
          put(x, y, z, "glass_pane", props);
        }
      }
      // window sill on the storey line below each bay
      if (isWindow && k < 2) {
        const sy = gy + 5 * k + 5;
        // handled by storey line; nothing extra
      }
    }
  }

  // entrance: oak door with a stone canopy over it
  if (isDoorCell(key(x, z), doorKey)) {
    put(x, gy, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, gy + 1, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    put(x, gy + 3, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    put(x, gy + 4, z, "polished_andesite");
  }

  // roof: stone core, deepslate tile skin on top
  for (let y = eave; y < roofY; y++) put(x, y, z, "stone_bricks");
  put(x, roofY, z, "deepslate_tiles");

  // a few short chimneys on the roof core
  if (d >= 3 && (x * 3 + z) % 13 === 0) {
    for (let y = roofY + 1; y <= roofY + 2; y++) put(x, y, z, "bricks");
  }
}

function isDoorCell(k, doorKeyValue) {
  return k === doorKeyValue;
}

g.save(`${DIR}/FR301499716.nbt`);
