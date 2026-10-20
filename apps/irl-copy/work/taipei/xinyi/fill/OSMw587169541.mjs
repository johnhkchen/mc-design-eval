import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// OSMw587169541: 17 x 14 footprint, roof about 13 blocks above lowest ground.
// Read as a 1980s mid-rise commercial block in Xinyi: a three-storey frame in
// pale quartz-tile cladding, a shopfront at street level, a glazed upper
// storey with warm light behind some windows, a plain parapet, and a small
// plant room on the roof.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw587169541";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 17, H = 25, D = 14;
const g = new Voxels([W, H, D]);

const B1 = 5;      // top of ground storey / first floor line
const B2 = 9;      // second floor line
const ROOF = 12;   // roof deck and parapet course (roof surface at y=13)

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const has = (x, z) => ground.has(key(x, z));

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// outward unit vectors for each exposed side
const DIRS = {
  n: [0, -1],
  s: [0, 1],
  w: [-1, 0],
  e: [1, 0],
};
const OPP = { n: "s", s: "n", w: "e", e: "w" };

// Exposed sides per footprint cell
function exposures(x, z) {
  const out = [];
  for (const d of Object.keys(DIRS)) {
    const [dx, dz] = DIRS[d];
    if (!has(x + dx, z + dz)) out.push(d);
  }
  return out;
}

// Choose the entrance: a single-sided south-facing perimeter cell nearest the centre
const centreX = (W - 1) / 2;
let doorKey = null;
{
  let best = Infinity;
  for (const [x, z] of cells) {
    const ex = exposures(x, z);
    if (ex.length === 1 && ex[0] === "s") {
      const d = Math.abs(x - centreX);
      if (d < best) { best = d; doorKey = key(x, z); }
    }
  }
  if (!doorKey) {
    // fallback: any single-sided perimeter cell nearest centre
    for (const [x, z] of cells) {
      const ex = exposures(x, z);
      if (ex.length === 1) {
        const d = Math.abs(x - centreX);
        if (d < best) { best = d; doorKey = key(x, z); }
      }
    }
  }
}

for (const [x, z, gr0] of cells) {
  const gr = Math.min(Math.max(gr0, 0), ROOF);

  // Foundation: solid from y=0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const ex = exposures(x, z);

  if (ex.length === 0) {
    // Interior cell: floor slabs and roof deck only, air between
    for (const y of [B1, B2, ROOF]) {
      if (y >= gr) put(x, y, z, "smooth_stone");
    }
    // Roof plant boxes on a sparse grid, well inside the footprint
    const deep = [-1, 0, 1].every(dx => [-1, 0, 1].every(dz => has(x + dx, z + dz)));
    if (deep && x % 4 === 1 && z % 4 === 1) {
      put(x, ROOF + 1, z, "light_gray_concrete");
      put(x, ROOF + 2, z, "iron_block");
    }
    continue;
  }

  // Perimeter cell: full column from ground to parapet
  if (ex.length >= 2) {
    // Corner pillar
    for (let y = gr; y <= ROOF; y++) {
      if (y === gr) put(x, y, z, "polished_andesite");
      else if (y === ROOF) put(x, y, z, "smooth_quartz");
      else if (y === B1 || y === B2) put(x, y, z, "smooth_quartz");
      else put(x, y, z, "quartz_pillar");
    }
    continue;
  }

  // Single exposed face
  const d = ex[0];
  const alongX = d === "n" || d === "s";
  const t = alongX ? x : z;           // position along the facade
  const isPillar = t % 3 === 0;
  const [dx, dz] = DIRS[d];
  const inwardX = x - dx, inwardZ = z - dz;
  const isDoor = doorKey === key(x, z);

  for (let y = gr; y <= ROOF; y++) {
    // Parapet
    if (y === ROOF) { put(x, y, z, "smooth_quartz"); continue; }

    // Storey lines
    if (y === B1 || y === B2) { put(x, y, z, "smooth_quartz"); continue; }

    // Ground storey: base course, shopfront, entrance
    if (y < B1) {
      if (y === gr) { put(x, y, z, "polished_andesite"); continue; }
      if (isDoor) {
        if (y === gr) { put(x, y, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" }); continue; }
        if (y === gr + 1) { put(x, y, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" }); continue; }
        if (y === gr + 2) { put(x, y, z, "smooth_quartz"); continue; }
        if (y === gr + 3 && gr + 3 < B1) { put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" }); continue; }
      }
      if (isPillar) { put(x, y, z, "stone_bricks"); continue; }
      const pane = alongX
        ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
        : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
      put(x, y, z, "light_blue_stained_glass_pane", pane);
      continue;
    }

    // Upper storeys: window grid with sills and mullion pillars
    if (isPillar) { put(x, y, z, "quartz_pillar"); continue; }
    if (y === B1 + 1 || y === B2 + 1) { put(x, y, z, "smooth_quartz"); continue; } // sill rows
    const pane = alongX
      ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
      : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
    put(x, y, z, "light_blue_stained_glass_pane", pane);
  }

  // Warm light behind some upper-storey windows (in the cell just inside)
  if (!isPillar && (t % 6 === 1) && has(inwardX, inwardZ)) {
    put(inwardX, 8, inwardZ, "glowstone");
  }
}
// Ground storey floor slab at B1 inside is already set by interior loop;
// a canopy is implied by the lintel and lantern above the entrance.

g.save(`${DIR}/${ID}.nbt`);
