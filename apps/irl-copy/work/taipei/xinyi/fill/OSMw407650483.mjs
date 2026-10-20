import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no name or use on file. Lidar gives a roof about 88 blocks above the lowest ground.
// Read as a mid-rise Xinyi-era (c. 1995-2010) glass-curtain-wall office/residential block:
// 16 storeys of 5 blocks, white-concrete frame and spandrels, light-blue glass, granite base,
// corner pilasters, a glazed ground-floor band, a setback mechanical penthouse, and a mast.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw407650483";
const W = 24, D = 25, H = 100;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const key = (x, z) => `${x},${z}`;
const groundMap = new Map();
for (const [x, z, gr] of cells) groundMap.set(key(x, z), gr);
const has = (x, z) => groundMap.has(key(x, z));
const gAt = (x, z) => groundMap.get(key(x, z));

const minG = Math.min(...cells.map((c) => c[2]));
const b = Math.min(minG, H - 1 - 88);

const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];

const isPerim = (x, z) => NB.some(([dx, dz]) => !has(x + dx, z + dz));

// Corner: exterior cell missing a neighbour on one x-side AND one z-side.
const isCorner = (x, z) => {
  const xOpen = !has(x - 1, z) || !has(x + 1, z);
  const zOpen = !has(x, z - 1) || !has(x, z + 1);
  return xOpen && zOpen;
};

// Inset distance from the perimeter (1 = exterior wall cell).
const dist = new Map();
const queue = [];
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  if (isPerim(x, z)) {
    dist.set(key(x, z), 1);
    queue.push([x, z]);
  }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  const d = dist.get(key(x, z));
  for (const [dx, dz] of NB) {
    const nx = x + dx, nz = z + dz;
    if (has(nx, nz) && !dist.has(key(nx, nz))) {
      dist.set(key(nx, nz), d + 1);
      queue.push([nx, nz]);
    }
  }
}
const distAt = (x, z) => dist.get(key(x, z)) ?? 1;

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// 1. Foundation: solid from y 0 up to each cell's ground.
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");
}

// 2. Storeys: 16 storeys of 5 blocks, from b up to b+79.
//    r=0 floor slab / spandrel, r=1..3 glass with frame, r=4 storey line.
//    Corners are solid pilasters; ground storey is a glazed shopfront band.
for (const [x, z, gr] of cells) {
  const perim = distAt(x, z) === 1;
  const corner = perim && isCorner(x, z);
  const inner = distAt(x, z);
  for (let y = Math.max(gr, b); y <= b + 79; y++) {
    const rel = y - b;
    const s = Math.floor(rel / 5);
    const r = rel % 5;

    if (perim) {
      if (y === gr) {
        put(x, y, z, "polished_granite"); // base course
        continue;
      }
      if (corner) {
        // Corner pilaster: continuous concrete column, with a lighter cap at each storey line.
        put(x, y, z, r === 4 ? "light_gray_concrete" : "white_concrete");
        continue;
      }
      if (r === 0) put(x, y, z, "white_concrete");
      else if (r === 4) put(x, y, z, "light_gray_concrete");
      else if (s === 0) {
        // Ground-floor shopfront: continuous glass, no mullions.
        put(x, y, z, "light_blue_stained_glass");
      } else {
        const mullion = (x + z) % 3 === 0;
        put(x, y, z, mullion ? "white_concrete" : "light_blue_stained_glass");
      }
    } else {
      if (r === 0) put(x, y, z, "smooth_stone"); // interior floor slab
      else if (r === 2 && inner === 2 && ((x * 7 + z * 13 + s * 5) % 4 === 0)) {
        put(x, y, z, "glowstone"); // warm light behind the glass
      }
    }
  }
}

// 3. Roof deck at b+80 over the whole footprint.
for (const [x, z, gr] of cells) {
  if (gr <= b + 80) put(x, b + 80, z, "smooth_stone");
}

// 4. Parapet ring on the exterior cells, b+81..b+82.
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  if (distAt(x, z) === 1) {
    put(x, b + 81, z, "white_concrete");
    put(x, b + 82, z, "white_concrete");
  }
}

// 5. Setback mechanical penthouse on cells with inset >= 4.
let mastCell = null;
let mastD = -1;
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  const d = distAt(x, z);
  if (d < 4) continue;
  put(x, b + 81, z, "smooth_stone");
  put(x, b + 85, z, "stone_bricks");
  if (d === 4) {
    for (let y = b + 82; y <= b + 84; y++) {
      const mullion = (x + z) % 3 === 0;
      put(x, y, z, mullion ? "white_concrete" : "light_blue_stained_glass");
    }
  }
  if (d > mastD) {
    mastD = d;
    mastCell = [x, z];
  }
}

// 6. Mast on the innermost cell, up to b+88.
if (mastCell) {
  const [mx, mz] = mastCell;
  for (let y = b + 86; y <= b + 88; y++) put(mx, y, mz, "iron_bars");
}

// 7. Entrance: two-cell-wide lobby door on the minimum-z face, nearest its middle.
const perimCells = cells.map((c) => [c[0], c[1], c[2]]).filter(([x, z]) => isPerim(x, z));
if (perimCells.length) {
  const minZ = Math.min(...perimCells.map((c) => c[1]));
  const face = perimCells.filter((c) => c[1] === minZ);
  const meanX = face.reduce((a, c) => a + c[0], 0) / face.length;
  face.sort((a, b2) => Math.abs(a[0] - meanX) - Math.abs(b2[0] - meanX));
  const [ex, ez, eg] = face[0];

  // Take a neighbour on the same face as the second door leaf if one exists.
  const sibling = face.find(([x]) => Math.abs(x - ex) === 1);
  const doorCells = sibling ? [[ex, eg, ez], [sibling[0], sibling[2], sibling[1]]] : [[ex, eg, ez]];

  const doorProps = (half, hinge) => ({ facing: "north", half, hinge, open: "false", powered: "false" });
  for (const [dx, dy, dz] of doorCells) {
    const hinge = dx < ex ? "right" : "left";
    put(dx, dy, dz, "oak_door", doorProps("lower", hinge));
    put(dx, dy + 1, dz, "oak_door", doorProps("upper", hinge));
  }

  // Canopy over the entrance, outside the footprint, tied to the wall at its inner edge.
  const minX = Math.min(...doorCells.map((c) => c[0])) - 1;
  const maxX = Math.max(...doorCells.map((c) => c[0])) + 1;
  for (let cx = minX; cx <= maxX; cx++) {
    put(cx, eg + 3, ez - 1, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
