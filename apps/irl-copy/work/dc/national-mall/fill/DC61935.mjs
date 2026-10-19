// DC61935: Commercial-Office-Large at 810 1st St NE (Union Station edge, Capitol Hill / NoMa), as a 1.21.1 module.
// Read as a 1970s-80s brick office: a stone plinth and stone string courses, brick piers between two-pane tinted
// glass bays, a shopfront with a double entrance and a dark canopy on the south face, and a stone cornice.
// The lidar roof is 16 on the wings and 18 on the central core (smoothed 3x3 median). The core steps up to a
// 2-block glazed penthouse set in from its ring, and the wings carry three rooftop units. Every storey line is a
// solid floor slab across the footprint, so each tier stands on the one below; interiors are air behind the glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC61935.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC61935.nbt";

const key = (x, z) => `${x},${z}`;
const F = new Map(cells.map(([x, z, g, r]) => [key(x, z), { x, z, g, r }]));
const inF = (x, z) => F.has(key(x, z));
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const RING = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];

// Smoothed roof: median of the footprint cells in the 3x3 around each cell (lidar noise and 1-cell gaps drop out).
const roof = new Map();
for (const c of F.values()) {
  const vals = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const n = F.get(key(c.x + dx, c.z + dz)); if (n) vals.push(n.r);
  }
  vals.sort((a, b) => a - b);
  roof.set(key(c.x, c.z), vals[vals.length >> 1]);
}
const core = (x, z) => inF(x, z) && roof.get(key(x, z)) >= 17;

// Setback: distance inside the core from its edge (breadth-first from the core cells that touch a non-core cell).
const depth = new Map();
const queue = [];
for (const c of F.values()) {
  if (!core(c.x, c.z)) continue;
  if (DIRS.some(([dx, dz]) => !core(c.x + dx, c.z + dz))) { depth.set(key(c.x, c.z), 1); queue.push(c); }
}
for (let i = 0; i < queue.length; i++) {
  const c = queue[i], d = depth.get(key(c.x, c.z));
  for (const [dx, dz] of DIRS) {
    const n = key(c.x + dx, c.z + dz);
    if (core(c.x + dx, c.z + dz) && !depth.has(n)) { depth.set(n, d + 1); queue.push({ x: c.x + dx, z: c.z + dz }); }
  }
}
const penthouse = (x, z) => core(x, z) && (depth.get(key(x, z)) ?? 0) >= 2;

const shell = (x, z) => DIRS.some(([dx, dz]) => !inF(x + dx, z + dz));  // touches the outside of the footprint

// Entrance: the two middle cells of the south (+z) face, a double door under a dark canopy.
const maxZ = Math.max(...cells.map((c) => c[1]));
const southX = cells.filter((c) => c[1] === maxZ).map((c) => c[0]).sort((a, b) => a - b);
const mid = southX[Math.floor(southX.length / 2)];
const doorXs = [mid - 1, mid].every((x) => inF(x, maxZ)) ? [mid - 1, mid] : [mid, mid + 1];
const doorAt = (x, z) => z === maxZ && doorXs.includes(x);
const canopyAt = (x, z) => z === maxZ && x >= doorXs[0] - 1 && x <= doorXs[1] + 1;

// Blocks, placed into a map first so panes and walls can take their connections from their neighbours.
const GLASS = "light_blue_stained_glass_pane";
const M = new Map();
const put = (x, y, z, block, state) => M.set(`${x},${y},${z}`, { block, state });
const at = (x, y, z) => M.get(`${x},${y},${z}`);
const FULL = new Set(["bricks", "stone_bricks", "smooth_stone", "black_concrete", "iron_block"]);
const solid = (b) => b && (FULL.has(b.block) || b.block === GLASS);

for (const c of F.values()) {
  const { x, z } = c;
  const sh = shell(x, z);
  const ph = penthouse(x, z);

  // Solid slabs: the plinth at y 0, floor lines at 4, 8 and 12, the roof membrane at 15. The shell takes stone courses.
  for (const y of [0, 4, 8, 12, 15]) put(x, y, z, sh ? "stone_bricks" : "smooth_stone");

  if (ph) put(x, 17, z, sh ? "stone_bricks" : "smooth_stone");     // penthouse roof, top at 18

  if (!sh) continue;

  // Facade: a pier on every third column (corners always), glass between. Columns are counted along the face.
  const zFace = !inF(x, z - 1) || !inF(x, z + 1);
  const xFace = !inF(x - 1, z) || !inF(x + 1, z);
  const idx = zFace ? x : z;
  const pier = (zFace && xFace) || idx % 3 === 0;

  if (ph) {
    if (pier) put(x, 16, z, "bricks"); else put(x, 16, z, GLASS);
    put(x, 17, z, "stone_bricks");                                  // penthouse cap
    continue;
  }

  // Parapet on the wings and the core ring: a solid stone cap course, not battlements.
  put(x, 16, z, "stone_bricks");

  for (let k = 0; k < 4; k++) {
    const y1 = 4 * k + 1, y2 = 4 * k + 2, head = 4 * k + 3;
    if (k < 3) put(x, head, z, k === 0 ? "stone_bricks" : "bricks");    // head course (k=3's head is the cornice at 15)
    if (k === 0 && doorAt(x, z)) {
      put(x, 1, z, "dark_oak_door", { facing: "south", half: "lower", hinge: x === doorXs[0] ? "left" : "right", open: "false", powered: "false" });
      put(x, 2, z, "dark_oak_door", { facing: "south", half: "upper", hinge: x === doorXs[0] ? "left" : "right", open: "false", powered: "false" });
      continue;
    }
    if (k === 0 && canopyAt(x, z)) put(x, 3, z, "black_concrete");
    for (const y of [y1, y2]) {
      if (pier) put(x, y, z, k === 0 ? "stone_bricks" : "bricks");
      else put(x, y, z, GLASS);
    }
  }
}

// Shopfront depth: a lamp just inside a few ground-floor and upper bays, so the glass glows at dusk.
for (const c of F.values()) {
  const { x, z } = c;
  if (!shell(x, z) || penthouse(x, z)) continue;
  for (const [dx, dz] of DIRS) {
    if (inF(x + dx, z + dz)) continue;                            // this side is outside
    const ix = x - dx, iz = z - dz;
    if (!inF(ix, iz) || shell(ix, iz)) continue;
    for (let k = 0; k < 4; k++) {
      const y = 4 * k + 1;
      if (at(x, y, z)?.block !== GLASS || at(ix, y, iz)) continue;
      if ((x * 7 + z * 3 + k * 5) % 4 === 0) put(ix, y, iz, "lantern", { hanging: "false", waterlogged: "false" });
    }
  }
}

// Penthouse heart: a shroomlight on the roof membrane inside the glazed ring.
for (const c of F.values()) {
  if (penthouse(c.x, c.z) && !shell(c.x, c.z) && (c.x + c.z) % 3 === 0 && !at(c.x, 16, c.z)) put(c.x, 16, c.z, "shroomlight");
}

// Rooftop units: three cubes on the wing roof, away from the core and the parapet.
const units = cells.filter(([x, z]) => {
  if (core(x, z) || shell(x, z)) return false;
  if (roof.get(key(x, z)) !== 16) return false;
  return RING.every(([dx, dz]) => inF(x + dx, z + dz) && !core(x + dx, z + dz));
}).map(([x, z]) => [x, z]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
for (let i = 0; i < 3 && units.length; i++) {
  const [x, z] = units[Math.floor(((i + 0.5) * units.length) / 3)];
  put(x, 16, z, "iron_block");
}

// Connections: each pane joins its neighbours that are panes or solid faces, so a bay reads as one glazed run.
for (const [k, b] of M) {
  if (b.block !== GLASS) continue;
  const [x, y, z] = k.split(",").map(Number);
  const nb = (dx, dz) => at(x + dx, y, z + dz);
  b.state = {
    north: solid(nb(0, -1)) ? "true" : "false",
    south: solid(nb(0, 1)) ? "true" : "false",
    east: solid(nb(1, 0)) ? "true" : "false",
    west: solid(nb(-1, 0)) ? "true" : "false",
    waterlogged: "false",
  };
}

// Flush to the voxel volume: 21 x 20 x 15 (y 0 to 19; the penthouse top is at 18).
const g = new Voxels([21, 20, 15]);
for (const [k, b] of M) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, b.block, b.state);
}
const { blocks, palette } = g.save(OUT);
console.log(`DC61935: ${blocks} blocks, palette ${palette}`);
