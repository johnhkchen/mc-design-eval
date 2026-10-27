// Engineering 405: a concrete-frame university block of the 1960s-70s. A stone plinth on the sloping site, a glazed
// podium, a setback, and a main slab with a plant box. The footprint's lidar roofs are quantised to four flat tiers,
// each a storey line above the ground floor; every floor plate and tier stands on the one below it.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_693448282.cells.json`, "utf8"));

const D = 12;     // the ground floor's slab: the highest ground under the footprint, so the whole block is raised off grade
const PITCH = 4;  // storey height in blocks (about 3.3 m)
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// lidar roof (block y) -> tier top. Podium 22-28, setback ~36-50, slab 58-63, plant 64-66.
function tierOf(r) {
  if (r <= 16) return 16;
  if (r <= 26) return 24;
  if (r <= 30) return 28;
  if (r <= 50) return 44;
  return 60;
}

const cols = new Map();
for (const [x, z, g, r] of cells) cols.set(`${x},${z}`, { x, z, g, T: tierOf(r), plant: r >= 64 });
const at = (x, z) => cols.get(`${x},${z}`);

// the outward side of a column's wall at height y: a missing neighbour, or a neighbour that stops below y
function wallFace(c, y) {
  for (const [dx, dz] of DIRS) {
    const n = at(c.x + dx, c.z + dz);
    if (!n || n.T <= y) return [dx, dz];
  }
  return null;
}

// a roof edge: a missing neighbour or a lower tier, so it gets a parapet
const edgeAt = (c) => DIRS.some(([dx, dz]) => { const n = at(c.x + dx, c.z + dz); return !n || n.T < c.T; });

// 1-block wall on an exposed face: piers every 3 blocks as the frame, glazing (bronze-grey, some blue) between
function wallBlock(c, y, [dx]) {
  const along = dx !== 0 ? c.z : c.x;
  if (along % 3 === 0) return { block: "light_gray_concrete" };
  const alongZ = dx !== 0;   // the wall runs north-south
  const glass = (c.x * 7 + y * 5 + c.z * 3) % 4 === 0 ? "light_blue_stained_glass_pane" : "gray_stained_glass_pane";
  const state = alongZ
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };
  return { block: glass, state };
}
const isPier = (c, [dx]) => (dx !== 0 ? c.z : c.x) % 3 === 0;

const vox = new Voxels([98, 78, 124]);
const put = (x, y, z, block, state) => vox.set(x, y, z, block, state);

// the entrance: the middle of the north edge's front row, with wall either side for a flush canopy
const northEdge = [...cols.values()].filter((c) => !at(c.x, c.z - 1) && at(c.x - 1, c.z) && at(c.x + 1, c.z));
const zFront = Math.min(...northEdge.map((c) => c.z));
const frontRow = northEdge.filter((c) => c.z === zFront).sort((a, b) => a.x - b.x);
const door = frontRow[Math.floor(frontRow.length / 2)];

for (const c of cols.values()) {
  const { x, z, g, T } = c;

  // plinth and foundation: solid under the ground floor; exposed plinth faces (above the ground) get a base course and
  // the same window grid as the storeys, so the downhill side reads as its extra storeys
  for (let y = 0; y < D; y++) {
    const face = y >= g ? wallFace(c, y) : null;
    if (!face) put(x, y, z, "stone_bricks");
    else if (y % PITCH === 0) put(x, y, z, "smooth_stone");
    else if (y % PITCH === 3) put(x, y, z, "stone_bricks");
    else { const w = wallBlock(c, y, face); put(x, y, z, w.block, w.state); }
  }

  // storeys: a floor plate on every storey line across the footprint (the spandrel on the faces), the glazed grid on
  // the exposed faces, and air between the plates behind the glass
  for (let y = D; y < T; y++) {
    const o = (y - D) % PITCH;
    if (o === 0) put(x, y, z, "light_gray_concrete");
    else if (y === T - 1) put(x, y, z, "gray_concrete");   // the tier's roof slab
    else if (o === 3) { if (wallFace(c, y)) put(x, y, z, "light_gray_concrete"); }
    else { const f = wallFace(c, y); if (f) { const w = wallBlock(c, y, f); put(x, y, z, w.block, w.state); } }
  }

  // roof: a plant box on the tall slab, a parapet at the edges, air-conditioning units on the flat
  if (c.plant) {
    for (let y = T; y < 64; y++) put(x, y, z, y === 63 ? "smooth_stone" : "gray_concrete");
  } else if (edgeAt(c)) {
    put(x, T, z, "light_gray_concrete");
    put(x, T + 1, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  } else if ((x * 31 + z * 17) % 83 === 0) {
    put(x, T, z, "iron_block");
  }
}

// warm light behind some windows: glowstone on the floor plate, just inside the glazing
for (const c of cols.values()) {
  for (let y = D + 1; y < c.T - 1; y += PITCH) {
    const f = wallFace(c, y);
    if (!f || isPier(c, f) || (c.x * 7 + c.z * 13 + y) % 7 !== 0) continue;
    const n = at(c.x - f[0], c.z - f[1]);
    if (n && n.T > y && !wallFace(n, y)) put(n.x, y, n.z, "glowstone");
  }
}

// entrance: a door in the front row at ground-floor level, and a flush canopy over it at the storey's upper line
put(door.x, D, door.z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
put(door.x, D + 1, door.z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
for (const dx of [-1, 0, 1]) put(door.x + dx, D + 2, door.z, "smooth_stone");

const stats = vox.save(`${DIR}/way_693448282.nbt`);
console.log(JSON.stringify(stats));
