// DC55882: 1916 I St NW, a Commercial-Office-Large in Beaux-Arts limestone. A hollow shell on the lidar footprint:
// roof heights are median-smoothed and snapped to storey tiers (ground + 3-block upper storeys, so the cornice rows
// land on the storey lines), a 3-block storey pattern of glass in quartz piers, a granite base, a shopfront with a
// door, a central penthouse, and warm lights behind some panes. Interior is air with a floor slab per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC55882.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC55882.nbt";

const X = 42, Z = 36, Y = 29;
const TIERS = [5, 8, 11, 14, 17];          // tier tops: storey lines at 4, 7, 10, 13, 16 (cornice = top row)
const LINES = new Set([4, 7, 10, 13, 16]); // floor slabs / spandrel bands
const WIN = new Set([2, 3, 5, 6, 8, 9, 11, 12, 14, 15]); // glazed rows (ground shopfront = 2-3)

// footprint + raw roof per cell
const roof = new Map();
for (const [x, z, , r] of cells) roof.set(`${x},${z}`, r);
const raw = (x, z) => roof.get(`${x},${z}`);

// median of the 5x5 neighbourhood (present cells only), then snap to a storey tier (ties go up): wide enough to drop lidar
// noise, so the roof reads as clean tiers rather than a sawtooth of single cells
const snap = (v) => TIERS.reduce((best, t) => (Math.abs(v - t) <= Math.abs(v - best) ? t : best), TIERS[0]);
const T = new Map();
for (const [x, z] of roof.keys().map((k) => k.split(",").map(Number))) {
  const vals = [];
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) { const r = raw(x + dx, z + dz); if (r !== undefined) vals.push(r); }
  vals.sort((a, b) => a - b);
  T.set(`${x},${z}`, snap(vals[Math.floor(vals.length / 2)]));
}
const top = (x, z) => T.get(`${x},${z}`) ?? 0;
const foot = (x, z) => T.has(`${x},${z}`);
// building(y) = inside the footprint and under its tier top
const bld = (x, y, z) => foot(x, z) && y >= 0 && y < top(x, z);

// exposed horizontal faces of a building voxel: the wall's direction
const exposure = (x, y, z) => ({
  xm: !bld(x - 1, y, z), xp: !bld(x + 1, y, z), zm: !bld(x, y, z - 1), zp: !bld(x, y, z + 1),
});

const g = new Voxels([X, Y, Z]);
const put = (x, y, z, b, s) => g.set(x, y, z, b, s);
const PIER = "quartz_pillar", WALL = "smooth_quartz", LINE = "smooth_quartz", CORNICE = "chiseled_quartz_block";
const GLASS = "light_blue_stained_glass_pane", BASE = "polished_granite", FOUND = "stone_bricks";
const isGlass = (v) => v?.block === `minecraft:${GLASS}`; // Voxels.get returns the namespaced id

// the entrance: a door on the north face (z=1), in the shopfront at x=28, flanked by piers
const DOOR_X = 28, DOOR_Z = 1;
const doorState = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });

// glass panes take the connections of their in-wall neighbours: along x on a wall that runs in x, along z otherwise
const paneState = (x, y, z, axis) => {
  const solidAt = (a, b, c) => g.get(a, b, c) !== null;
  const conn = (dx, dz) => (solidAt(x + dx, y, z + dz) ? "true" : "false");
  if (axis === "x") return { east: conn(1, 0), west: conn(-1, 0), north: "false", south: "false", waterlogged: "false" };
  return { north: conn(0, -1), south: conn(0, 1), east: "false", west: "false", waterlogged: "false" };
};

const panes = []; // glass panes are dressed after the piers and door are placed, so their connections are right

// 1. foundation, base course, storey floors, and the hollow between: every building voxel
for (const key of T.keys()) {
  const [x, z] = key.split(",").map(Number);
  const t = top(x, z);
  for (let y = 0; y < t; y++) {
    const e = exposure(x, y, z);
    const exposed = e.xm || e.xp || e.zm || e.zp;
    if (y === 0) { put(x, y, z, FOUND); continue; }
    if (y === 1) { put(x, y, z, BASE); continue; }
    if (LINES.has(y)) {
      // the cornice (top row) is chiseled on the outside, the floor slab is smooth inside
      put(x, y, z, y === t - 1 && exposed ? CORNICE : LINE);
      continue;
    }
    if (!WIN.has(y) || !exposed) continue; // interior air behind the glass
    // a facade voxel: corners are quoins; piers every third cell; glass between
    const exX = e.xm || e.xp, exZ = e.zm || e.zp;
    if (exX && exZ) { put(x, y, z, PIER); continue; }
    const axis = exZ ? "x" : "z";     // the wall runs along x when its exposed faces are north/south
    const u = axis === "x" ? x : z;
    if (u % 3 === 0) { put(x, y, z, PIER); continue; }
    if (y <= 3 && x === DOOR_X + 0 && z === DOOR_Z) continue; // door cells placed below
    panes.push([x, y, z, axis]);
    put(x, y, z, GLASS);
  }
}

// 2. the entrance: piers flank the door, then a two-high door at x=28 on the north face
put(DOOR_X, 2, DOOR_Z, "dark_oak_door", doorState("lower"));
put(DOOR_X, 3, DOOR_Z, "dark_oak_door", doorState("upper"));
for (const x of [DOOR_X - 1, DOOR_X + 1]) for (const y of [2, 3]) put(x, y, DOOR_Z, PIER);

for (const [x, y, z, axis] of panes) if (isGlass(g.get(x, y, z))) put(x, y, z, GLASS, paneState(x, y, z, axis));

// 3. parapets: a one-block wall on every top-row edge (where the neighbour drops away or is outside)
for (const key of T.keys()) {
  const [x, z] = key.split(",").map(Number);
  const t = top(x, z);
  const edge = [[-1, 0], [1, 0], [0, -1], [0, 1]].some(([dx, dz]) => !foot(x + dx, z + dz) || top(x + dx, z + dz) <= t);
  if (edge) put(x, t, z, WALL);
}

// 4. penthouse on the tallest tier: two cells in from the edge, smooth stone with a copper cap
const penthouse = [];
for (const key of T.keys()) {
  const [x, z] = key.split(",").map(Number);
  if (top(x, z) !== 17) continue;
  let inset = true;
  for (let dz = -2; dz <= 2 && inset; dz++) for (let dx = -2; dx <= 2 && inset; dx++) if (!(foot(x + dx, z + dz) && top(x + dx, z + dz) === 17)) inset = false;
  if (inset) penthouse.push([x, z]);
}
for (const [x, z] of penthouse) {
  const edge = [[-1, 0], [1, 0], [0, -1], [0, 1]].some(([dx, dz]) => !penthouse.some(([a, b]) => a === x + dx && b === z + dz));
  put(x, 17, z, edge ? WALL : LINE);
  put(x, 18, z, edge ? WALL : LINE);
  put(x, 19, z, "oxidized_cut_copper");
}

// 5. warm lights in some windows: a glowstone on the inside of the pane (the air gap stays where it is)
let lights = 0;
for (const key of T.keys()) {
  const [x, z] = key.split(",").map(Number);
  const t = top(x, z);
  for (let y = 2; y < t; y++) {
    if (!WIN.has(y)) continue;
    const e = exposure(x, y, z);
    const exX = e.xm || e.xp, exZ = e.zm || e.zp;
    if (!(exX || exZ) || (exX && exZ)) continue;
    if (!isGlass(g.get(x, y, z))) continue;
    if ((x * 7 + y * 3 + z * 5) % 11 !== 0) continue;
    // the inward neighbour: opposite the exposed face
    const dx = e.xm ? 1 : e.xp ? -1 : 0, dz = e.xm || e.xp ? 0 : e.zm ? 1 : -1;
    if (!bld(x + dx, y, z + dz) || g.get(x + dx, y, z + dz)) continue;
    put(x + dx, y, z + dz, "glowstone");
    lights++;
  }
}

const res = g.save(OUT);
console.log(`saved ${OUT}: ${res.blocks} blocks, palette ${res.palette}, lights ${lights}, penthouse cells ${penthouse.length}`);
