// FR245184450: a Haussmann-era residence (1870, 7 storeys, Paris limestone, slate mansard) on the Ile de la Cite footprint.
// The lidar tops snap to clean tiers (7/11/15/19/23/27, and the 32 main body with its attic); the walls are a one-cell
// ring round an open interior with a floor slab per storey, so each window has air behind it and a few lamps sit inside.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR245184450.cells.json", "utf8"));

const BODY = "calcite";            // Paris limestone, cream
const BAND = "smooth_sandstone";   // string courses, cornice and quoins
const BASE = "stone_bricks";       // foundation and base course
const FLOOR = "smooth_stone";      // storey slabs
const SLATE = "deepslate_tiles";   // mansard attic, roof cap
const EAVE = "deepslate_tile_stairs";
const BRICK = "bricks";            // chimney stacks
const LAMP = "glowstone";          // warm light just inside a window

const byXZ = new Map();
for (const [x, z, gr, r] of cells) byXZ.set(`${x},${z}`, { gr, r });
const inFp = (x, z) => byXZ.has(`${x},${z}`);
const faces = (x, z) => [
  ["north", !inFp(x, z - 1)], ["south", !inFp(x, z + 1)], ["west", !inFp(x - 1, z)], ["east", !inFp(x + 1, z)],
].filter(([, out]) => out).map(([f]) => f);
const ring = (x, z) => faces(x, z).length > 0;
const INWARD = { north: [0, 1], south: [0, -1], west: [1, 0], east: [-1, 0] };

// Lidar tops -> clean tiers: anything at 30+ is the main body (32); lower wings snap to a tier whose cornice lands on a band line
const TIERS = [7, 11, 15, 19, 23, 27];
function snap(r) {
  if (r >= 30) return 32;
  let best = TIERS[0];
  for (const t of TIERS) if (Math.abs(t - r) <= Math.abs(best - r)) best = t;   // ties go up
  return best;
}
// storey string courses sit at y = 1, 5, 9, ... (base course at 1); each storey's window is a sill, then two glass rows
const band = (y) => y % 4 === 1;
const sill = (y) => y % 4 === 2;
const paneState = (face) => (face === "north" || face === "south")
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

const g = new Voxels([20, 40, 41]);

for (const [x, z, gr, r] of cells) {
  const T = snap(r);
  const out = faces(x, z);
  const edge = out.length > 0;
  const face = out[0];                                   // the wall's main exterior face (north before south, west, east)
  const along = face === "north" || face === "south" ? x : z;
  const winCol = edge && along % 3 === 1;                // window bays on every third cell; pillars between
  const body = T === 32;
  const door = x === 6 && z === 0;                       // street door on the north face

  // foundation: solid from y 0 up to the ground (all ground here is 0), so the plinth course sits on y 0
  g.set(x, 0, z, BASE);

  for (let y = 1; y < T; y++) {
    if (y === T - 1) {                                   // roof cap; the main body's outer ring gets a slate eave lip
      if (edge && body) g.set(x, y, z, EAVE, { facing: face, half: "bottom", shape: "straight", waterlogged: "false" });
      else g.set(x, y, z, SLATE);
      continue;
    }
    if (y === T - 2) { g.set(x, y, z, edge ? BAND : FLOOR); continue; }   // cornice on the wall, ceiling slab inside
    if (!edge) { if (band(y)) g.set(x, y, z, FLOOR); continue; }          // interior: only the storey slabs, air between
    if (door && (y === 1 || y === 2)) {
      g.set(x, y, z, "dark_oak_door", { facing: "north", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (door && y === 3) { g.set(x, y, z, "glass_pane", paneState("north")); continue; }   // transom over the door
    if (y === 1) { g.set(x, y, z, BASE); continue; }                                      // base course
    if (band(y)) { g.set(x, y, z, BAND); continue; }
    if (body && y >= 26 && y <= 28) {                    // the mansard attic: slate walls, dormer glass in the window bays
      if (winCol && !sill(y)) g.set(x, y, z, "glass_pane", paneState(face));
      else g.set(x, y, z, SLATE);
      continue;
    }
    if (winCol) {
      if (sill(y)) { g.set(x, y, z, BAND); continue; }
      g.set(x, y, z, "glass_pane", paneState(face));
      continue;
    }
    if (out.length >= 2) { g.set(x, y, z, BAND); continue; }                              // quoins at the corners
    g.set(x, y, z, BODY);
  }
}

// warm lamps just inside some windows, standing on the storey slab below
for (const [x, z, gr, r] of cells) {
  const T = snap(r);
  const out = faces(x, z);
  if (!out.length) continue;
  const face = out[0];
  const along = face === "north" || face === "south" ? x : z;
  if (along % 3 !== 1) continue;
  const [dx, dz] = INWARD[face];
  if (!inFp(x + dx, z + dz) || ring(x + dx, z + dz)) continue;
  for (let b = 1; b + 2 < T - 2; b += 4) if ((along + b) % 8 === 1) g.set(x + dx, b + 1, z + dz, LAMP);
}

// chimney stacks on the main body's roof, and a few skylights in its cap
for (const [x, z, gr, r] of cells) {
  if (snap(r) !== 32 || ring(x, z)) continue;
  if (x % 6 === 3 && z % 9 === 5) {
    for (let y = 32; y <= 35; y++) g.set(x, y, z, BRICK);
    g.set(x, 36, z, "brick_slab", { type: "bottom", waterlogged: "false" });
  } else if (x % 6 === 1 && z % 7 === 2) {
    g.set(x, 31, z, "glass");
  }
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR245184450.nbt");
