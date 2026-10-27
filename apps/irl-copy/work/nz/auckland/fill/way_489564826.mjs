// The Carlise (way 489564826): a 1970s concrete-framed office and apartment block on Mt Eden's flank.
// Massing from the lidar: each footprint cell is a column from its ground (foundation) to a storey-snapped roof tier.
// Roof is the 3x3 median of the lidar roof (spikes go), then floored to 4-block storeys: most of the block is 5 storeys,
// a lower 4-storey wing, and a few taller cells to the north-west.
// Facade: light grey concrete frame, white piers and string courses, cyan tinted glass in bays, a shopfront base where
// the ground is low, a door on the lowest street side, parapets, roof boxes, glowstone behind some panes, shroomlight crowns.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_489564826.cells.json", "utf8"));
const W = 34, D = 38, H = 68;
const STOREY = 4;

// footprint: "x,z" -> { g: ground, T: roof tier (absolute y of the roof deck) }
const fp = new Map();
for (const [x, z, g, r] of cells) fp.set(`${x},${z}`, { g, r });
const at = (x, z) => fp.get(`${x},${z}`);
const med = (a) => a.sort((p, q) => p - q)[a.length >> 1];
for (const [k, c] of fp) {
  const [x, z] = k.split(",").map(Number);
  const vals = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const n = at(x + dx, z + dz); if (n) vals.push(n.r); }
  c.T = Math.max(STOREY * 4, STOREY * Math.floor((med(vals) + 1) / STOREY));
}
// a tall roof only reads as a tower when it is a cluster; a lone 2-3 block spike is lidar noise and drops to the roof round it
const TOWER = 28;
const seen = new Set();
for (const [k, c] of fp) {
  if (c.T < TOWER || seen.has(k)) continue;
  const comp = [k], stack = [k]; seen.add(k);
  while (stack.length) {
    const [x, z] = stack.pop().split(",").map(Number);
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nk = `${x + dx},${z + dz}`, n = fp.get(nk);
      if (n && n.T >= TOWER && !seen.has(nk)) { seen.add(nk); comp.push(nk); stack.push(nk); }
    }
  }
  if (comp.length >= 6) continue;
  for (const nk of comp) {
    const [x, z] = nk.split(",").map(Number);
    const around = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dz]) => fp.get(`${x + dx},${z + dz}`)).filter((n) => n && n.T < TOWER);
    fp.get(nk).T = around.length ? Math.max(...around.map((n) => n.T)) : 5 * STOREY;
  }
}

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
// a side is exposed at height y when there is no column beside it or the neighbour's roof is at or below y
const exposed = (x, z, y) => DIRS.filter(([dx, dz]) => { const n = at(x + dx, z + dz); return !n || n.T <= y; });
const wallTop = (x, z, y) => { const n = at(x, z); return n && n.T > y; };

// the entrance: the lowest exposed side (ground at or under 4), nearest the middle of the frontage
let door = null;
for (const [k, c] of fp) {
  if (c.g > 4) continue;
  const [x, z] = k.split(",").map(Number);
  const ex = exposed(x, z, 5);
  if (ex.length !== 1) continue;          // a single open side; corners stay solid quoins
  const score = c.g * 100 + Math.abs(x - W / 2) + Math.abs(z - D / 2) * 0.1;
  if (!door || score < door.score) door = { x, z, dir: ex[0], score };
}

const hash = (x, y, z) => ((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0;

const v = new Voxels([W, H, D]);
const put = (x, y, z, block, state) => v.set(x, y, z, block, state);

for (const [k, c] of fp) {
  const [x, z] = k.split(",").map(Number);
  const { g, T } = c;
  const base = Math.max(g, 4);
  // foundation under the ground and a solid base course up to the first floor line
  for (let y = 0; y < base; y++) put(x, y, z, "stone_bricks");

  for (let y = base; y <= T; y++) {
    if (y === T) { put(x, y, z, "gray_concrete"); continue; }                           // roof deck
    if (y % STOREY === 0) {                                                             // floor slab / string course
      put(x, y, z, exposed(x, z, y).length ? "white_concrete" : "light_gray_concrete");
      continue;
    }
    const ex = exposed(x, z, y);
    if (!ex.length) {                                                                   // interior: air gap, pillars on a 4 grid
      if (x % 4 === 2 && z % 4 === 2) { put(x, y, z, "light_gray_concrete"); continue; }
      const winRow = y % STOREY === 1;
      const nextToWindow = DIRS.some(([dx, dz]) => exposed(x + dx, z + dz, y).length && at(x + dx, z + dz));
      if (winRow && nextToWindow && hash(x, y, z) % 4 === 0) put(x, y, z, "glowstone");
      continue;
    }
    const xEx = ex.some(([dx]) => dx !== 0), zEx = ex.some(([, dz]) => dz !== 0);
    if (xEx && zEx) { put(x, y, z, "white_concrete"); continue; }                       // corner quoin
    const run = zEx ? "x" : "z";                                                        // the wall runs along x when exposed to z
    const u = run === "x" ? x : z;
    const bay = u % 3 !== 0;
    if (!bay) { put(x, y, z, "white_concrete"); continue; }                             // pier between bays
    if (y % STOREY === 3) { put(x, y, z, "light_gray_concrete"); continue; }            // spandrel
    if (door && x === door.x && z === door.z && (y === STOREY + 1 || y === STOREY + 2)) {
      const [dx, dz] = door.dir;
      put(x, y, z, "dark_oak_door", {
        facing: dx === 1 ? "east" : dx === -1 ? "west" : dz === 1 ? "south" : "north",
        half: y === STOREY + 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false",
      });
      continue;
    }
    // glass pane in the window row, connected to its neighbours along the wall
    const [ax, az] = run === "x" ? [x + 1, z] : [x, z + 1];
    const [bx, bz] = run === "x" ? [x - 1, z] : [x, z - 1];
    const cA = wallTop(ax, az, y), cB = wallTop(bx, bz, y);
    const link = { north: "false", south: "false", east: "false", west: "false" };
    if (run === "x") { link.east = cA ? "true" : "false"; link.west = cB ? "true" : "false"; }
    else { link.north = cB ? "true" : "false"; link.south = cA ? "true" : "false"; }
    put(x, y, z, "cyan_stained_glass_pane", link);
  }

  // parapet on the roof edges that stand above the open air or a lower roof; warm crowns on the tower's corners only
  const edges = DIRS.filter(([ex, ez]) => { const n = at(x + ex, z + ez); return !n || n.T < T; });
  if (edges.length) {
    put(x, T + 1, z, "white_concrete");
    if (edges.length === 2 && T >= TOWER + 8) put(x, T + 2, z, "shroomlight");
  }
  // roof plant boxes on the tall blocks, on a 4 grid clear of the parapet
  if (T >= 36 && !edges.length && x % 4 === 2 && z % 4 === 2) {
    put(x, T + 1, z, "light_gray_concrete");
    put(x, T + 2, z, "light_gray_concrete");
  }
}

// the entrance: a band over the door, the wall either side of it
if (door) {
  for (const [ox, oz] of door.dir[0] !== 0 ? [[0, 1], [0, -1]] : [[1, 0], [-1, 0]]) {
    const xx = door.x + ox, zz = door.z + oz;
    if (at(xx, zz)) put(xx, STOREY + 3, zz, "polished_andesite");
  }
  put(door.x, STOREY + 3, door.z, "polished_andesite");
}

const report = v.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_489564826.nbt");
console.log("blocks", report.blocks, "palette", report.palette, "door", door ? `${door.x},${door.z} dir ${door.dir}` : "none");
