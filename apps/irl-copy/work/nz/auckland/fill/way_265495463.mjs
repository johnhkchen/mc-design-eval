// Victopia, Auckland (way 265495463): a 1980s concrete-frame office tower, fourteen storeys (56 blocks, about 47 m) on a
// 45 x 42 footprint. The lidar roof is flat to within a block (55 to 57 everywhere), so the massing is one prism with no
// setbacks: the lidar says so, and inventing tiers would not. A basalt base course with a shopfront storey, then a 4-block
// storey rhythm: white floor-line bands, glass ribbons between white piers every third column, light-grey spandrels. Piers
// at the corners. A dark-oak entrance on the lowest street face, flanked by stone piers. Warm glowstone behind some panes.
// Roof plant where the lidar reads 57. Foundation fills from y 0 up to each cell's ground. Interiors are air with a slab per
// storey (the roof slab at y 56, parapet to 57).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_265495463.cells.json", "utf8"));
const W = 45, D = 42, STOREYS = 14, TOP = 4 * STOREYS;   // roof slab at y 56
const G = Array.from({ length: W }, () => Array(D).fill(-1));   // ground under the cell, -1 = not footprint
const R = Array.from({ length: W }, () => Array(D).fill(0));    // lidar roof height
for (const [x, z, g, r] of cells) { G[x][z] = g; R[x][z] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && G[x][z] >= 0;

// distance from the outside (1 on the outer ring), by BFS through the footprint
const dist = Array.from({ length: W }, () => Array(D).fill(0));
const queue = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  const edge = !inside(x - 1, z) || !inside(x + 1, z) || !inside(x, z - 1) || !inside(x, z + 1);
  if (edge) { dist[x][z] = 1; queue.push([x, z]); }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = x + dx, nz = z + dz;
    if (inside(nx, nz) && !dist[nx][nz]) { dist[nx][nz] = dist[x][z] + 1; queue.push([nx, nz]); }
  }
}

// outward directions of a cell: the sides with no footprint beside them
const OUT = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const outFaces = (x, z) => Object.keys(OUT).filter(k => !inside(x + OUT[k][0], z + OUT[k][1]));
const inwardOf = (x, z, face) => [x - OUT[face][0], z - OUT[face][1]];

// roof: the lidar is median-smoothed on the 3 x 3 neighbourhood; 57 reads as plant, everything else as the flat roof
const median = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) v.push(R[x + dx][z + dz]);
  v.sort((a, b) => a - b); return v[v.length >> 1];
};

const g = new Voxels([W, 70, D]);
const BASE = "polished_blackstone_bricks", PIER_LOW = "polished_blackstone", PIER = "white_concrete";
const SPANDREL = "light_gray_concrete", GLASS = "light_blue_stained_glass", SHOP = "glass";

// foundation, and a slab per storey line (y = 0, 4, ... 56) across the whole footprint: the floor under each storey
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  for (let y = 0; y < G[x][z]; y++) g.set(x, y, z, BASE);
  for (let k = 0; k <= STOREYS; k++) g.set(x, 4 * k, z, SPANDREL);
}

// the entrance: the lowest-ground outward face with the most ground-level cells, its middle cell
const faceCount = {};
const groundCells = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z) && dist[x][z] === 1 && G[x][z] === 0) {
  const f = outFaces(x, z); if (!f.length) continue;
  const face = f[0]; faceCount[face] = (faceCount[face] || 0) + 1; groundCells.push([x, z, face]);
}
let doorFace = Object.keys(faceCount).sort((a, b) => faceCount[b] - faceCount[a])[0];
const doorRun = groundCells.filter(([, , f]) => f === doorFace).sort((a, b) => (doorFace === "N" || doorFace === "S" ? a[0] - b[0] : a[1] - b[1]));
const doorCell = doorRun[doorRun.length >> 1];
const doorKey = doorCell ? `${doorCell[0]},${doorCell[1]}` : null;
const flank = new Set();
if (doorCell) {
  const [dx, dz] = doorFace === "N" || doorFace === "S" ? [1, 0] : [0, 1];
  for (const s of [-1, 1]) flank.add(`${doorCell[0] + s * dx},${doorCell[1] + s * dz}`);
}

// the facade of each perimeter cell, by storey
let lamps = 0;
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z) || dist[x][z] !== 1) continue;
  const faces = outFaces(x, z), corner = faces.length > 1;
  const face = faces[0];
  const c = face === "N" || face === "S" ? x : z;                // the coordinate along the face: piers on a 3 grid
  const pier = (k) => corner || c % 3 === 0;
  const [ix, iz] = inwardOf(x, z, face);
  const inwardOK = inside(ix, iz) && dist[ix][iz] >= 2;
  const key = `${x},${z}`;

  // ground storey: base course, shopfront, lintel
  const isDoor = key === doorKey, isFlank = flank.has(key) && G[x][z] === 0;
  for (let y = 0; y < G[x][z]; y++) g.set(x, y, z, BASE);      // the foundation under the wall
  g.set(x, 0, z, BASE);
  if (isDoor) {
    const facing = { N: "north", S: "south", W: "west", E: "east" }[face];
    g.set(x, 1, z, "dark_oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
    g.set(x, 2, z, "dark_oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
  } else {
    g.set(x, 1, z, pier(0) || isFlank ? PIER_LOW : SHOP);
    g.set(x, 2, z, pier(0) || isFlank ? PIER_LOW : SHOP);
  }
  g.set(x, 3, z, SPANDREL);

  // storeys 1 to 13: floor line, window band with frames, spandrel (the next floor line starts the next storey)
  for (let k = 1; k < STOREYS; k++) {
    const y0 = 4 * k;
    g.set(x, y0, z, PIER);
    for (const dy of [1, 2]) {
      const isPier = pier(k);
      g.set(x, y0 + dy, z, isPier ? PIER : GLASS);
      // a warm light in some panes, inside the air gap behind the glass
      if (!isPier && dy === 1 && inwardOK && (c + 2 * k) % 7 === 3) { g.set(ix, y0 + dy, iz, (c + k) % 3 === 0 ? "shroomlight" : "glowstone"); lamps++; }
    }
    g.set(x, y0 + 3, z, SPANDREL);
  }
  // cornice and parapet
  g.set(x, TOP, z, PIER);
  g.set(x, TOP + 1, z, PIER);
}

// the roof: one solid plant block where the lidar reads 57, set in from the parapet (a contiguous mass, not specks)
let plant = 0;
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z) || dist[x][z] < 3) continue;
  if (median(x, z) >= 57) { g.set(x, TOP + 1, z, SPANDREL); plant++; }
}

const info = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_265495463.nbt");
console.log(`way_265495463: ${info.blocks} blocks, ${info.palette} palette entries, ${lamps} warm lights, ${plant} roof plant boxes, door ${doorKey} facing ${doorFace}`);
