// Grafton Hall A (OSM way 1131115634): a four-storey concrete hall of the 1960s-70s, from the lidar record.
// Footprint 31 x 52 blocks, roof ~19 blocks above the lowest ground. Light-grey concrete piers, stone-brick plinth,
// smooth-stone floor lines, dark tinted glazing set in 1-deep niches with an air gap behind, a stepped core to 18-19,
// a parapet ring, a recessed entrance on the west face under a canopy, and warm lights in a share of the windows.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1131115634.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1131115634.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const vox = new Voxels([31, 31, 52]);

// footprint lookup, and the outward normal of each side (N = -z, S = +z, W = -x, E = +x)
const fp = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inFp = (x, z) => fp.has(`${x},${z}`);
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const DIR_NAME = { N: "north", S: "south", W: "west", E: "east" };
const exposed = (x, z) => Object.keys(DIRS).filter((d) => !inFp(x + DIRS[d][0], z + DIRS[d][1]));

// the lidar roof smoothed over each cell's footprint neighbours (a 3 x 3 mean), then into tiers: a 16-block main roof
// (4 storeys), a 18-19 stepped core, low wings in 4-block steps
function topOf(roof) {
  if (roof >= 18.5) return 19;
  if (roof >= 17.5) return 18;
  if (roof >= 14.5) return 16;
  return Math.max(4, 4 * Math.round(roof / 4));
}
const smoothRoof = (x, z) => {
  let sum = 0, n = 0;
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const q = fp.get(`${x + dx},${z + dz}`);
    if (q) { sum += q.roof; n++; }
  }
  return sum / n;
};

// one column per footprint cell: its ground (0..3), the top of its body, and its exposed sides
const cols = [...fp.entries()].map(([key, { ground }]) => {
  const [x, z] = key.split(",").map(Number);
  const exp = exposed(x, z);
  const top = topOf(smoothRoof(x, z));
  const parapet = exp.length > 0 && top === 16;             // the main roof's edge rises one block as a parapet
  const T = top + (parapet ? 1 : 0);
  return { x, z, g: Math.min(3, Math.max(0, ground)), T, exp, parapet };
});
const colAt = new Map(cols.map((c) => [`${c.x},${c.z}`, c]));

// solid mass: foundation fill to each cell's ground, then the body up to its top, roof surface on top
for (const c of cols) {
  for (let y = 0; y < c.g; y++) vox.set(c.x, y, c.z, "stone");
  for (let y = c.g; y < c.T; y++) vox.set(c.x, y, c.z, y === c.T - 1 ? "smooth_stone" : "stone");
}

// the outer skin: plinth at grade, floor lines every 4, light-grey concrete piers and spandrels, parapet on top
function skinMat(c, y) {
  if (y === c.T - 1) return c.parapet ? "stone_bricks" : "smooth_stone";
  if (y === c.g) return "stone_bricks";
  if (y % 4 === 0) return "smooth_stone";
  return "light_gray_concrete";
}
for (const c of cols) {
  if (!c.exp.length) continue;
  for (let y = c.g; y < c.T; y++) vox.set(c.x, y, c.z, skinMat(c, y));
}

// glazing rows: the two middle rows of each 4-block storey, never the roof row
const isGlazeRow = (c, y) => y >= c.g && y <= c.T - 2 && (y % 4 === 1 || y % 4 === 2);

// windows: a single exposed side, bays of two glazed then two piers along the wall; the glass sits in the skin and
// the cell behind it is an air gap (or a warm light for about a quarter of the windows)
const panes = new Map();
const lights = [];
for (const c of cols) {
  // a corner cell glazes on the first side that has a solid cell behind it; otherwise it stays a pier
  const pick = c.exp.find((d) => {
    const inner = colAt.get(`${c.x - DIRS[d][0]},${c.z - DIRS[d][1]}`);
    const u = d === "N" || d === "S" ? c.x : c.z;      // position along the wall
    return inner && !inner.exp.length && (u % 4 === 1 || u % 4 === 2);
  });
  if (!pick) continue;
  const ix = c.x - DIRS[pick][0], iz = c.z - DIRS[pick][1];   // the cell behind the glass
  for (let y = c.g; y < c.T; y++) {
    if (!isGlazeRow(c, y)) continue;
    const h = (c.x * 73 + c.z * 151 + Math.floor(y / 4) * 37) % 16;   // warm-light pick, one per window cell
    panes.set(`${c.x},${y},${c.z}`, { x: c.x, y, z: c.z });
    if (h === 0) lights.push([ix, y, iz, "shroomlight"]);
    else if (h % 4 === 0) lights.push([ix, y, iz, "glowstone"]);
    else vox.set(ix, y, iz, "air");
  }
}
for (const [x, y, z, block] of lights) vox.set(x, y, z, block);

// the entrance: the west face cell nearest the middle of that face, recessed one cell deep, two blocks tall, with a
// stone surround and a hanging lantern under the canopy (the storey slab above it)
const westFace = cols.filter((c) => c.exp.length === 1 && c.exp[0] === "W" && c.T >= 16);
const zs = westFace.map((c) => c.z).sort((a, b) => a - b);
const midZ = zs[Math.floor(zs.length / 2)];
const door = westFace.reduce((a, c) => (Math.abs(c.z - midZ) < Math.abs(a.z - midZ) ? c : a));
const dIn = colAt.get(`${door.x + 1},${door.z}`);
const dState = (half) => ({ facing: DIR_NAME.W, half, hinge: "left", open: "false", powered: "false" });
for (const dz of [-1, 1]) {                             // stone surround either side of the door
  const side = colAt.get(`${door.x},${door.z + dz}`);
  if (side) for (const y of [door.g, door.g + 1]) vox.set(side.x, y, side.z, "stone_bricks");
}
vox.set(door.x, door.g, door.z, "oak_door", dState("lower"));
vox.set(door.x, door.g + 1, door.z, "oak_door", dState("upper"));
vox.set(dIn.x, door.g, dIn.z, "air");
vox.set(dIn.x, door.g + 1, dIn.z, "lantern", { hanging: "true", waterlogged: "false" });
vox.set(door.x, door.g + 2, door.z, "stone_bricks");   // canopy edge over the recess

// roof plant: 2x2 boxes on the main roof, well inside the parapet
for (const c of cols) {
  if (c.T !== 16 || c.parapet || c.exp.length || c.x % 9 !== 4 || c.z % 9 !== 4) continue;
  const quad = [[c.x, c.z], [c.x + 1, c.z], [c.x, c.z + 1], [c.x + 1, c.z + 1]];
  if (!quad.every(([x, z]) => { const q = colAt.get(`${x},${z}`); return q && q.T === 16 && !q.exp.length; })) continue;
  for (const [x, z] of quad) {
    vox.set(x, 16, z, "light_gray_concrete");
    vox.set(x, 17, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}

// glass panes: connect to any neighbouring pane in the same row, so each window band reads as one run of glazing
for (const { x, y, z } of panes.values()) {
  const has = (dx, dz) => panes.has(`${x + dx},${y},${z + dz}`);
  vox.set(x, y, z, "gray_stained_glass_pane", {
    north: has(0, -1), south: has(0, 1), east: has(1, 0), west: has(-1, 0),
  });
}

const info = vox.save(OUT);
console.log(`Grafton Hall A: ${cols.length} columns, entrance on the west face at z=${door.z}, ${info.blocks} blocks, ${info.palette} palette entries`);
