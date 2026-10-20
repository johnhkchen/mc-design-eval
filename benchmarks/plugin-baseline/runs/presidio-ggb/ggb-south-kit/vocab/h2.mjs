// plan.md VOCABULARY, part 2: parapetRun, sallyPort, lighthouse, pylon, cableHousing, trussBay, spandrelPost, abutment.
// Every helper takes its position as arguments and returns { placed, refused }; refused = [x, y, z, block, reason].
// Writes stay inside the footprint the helper computes from its arguments, go only into air (opts.over replaces, for
// the cut-throughs and the walls it owns), and never touch y < 1 (the ground course and the water are earlier parts').
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const AIR = "minecraft:air";
// Plot 0 cells the parapet steps around (plan.md FACADES): the lighthouse, the three stair towers, the SW buttress.
const FORT_SKIP = [[2, 10, 4, 12], [24, 0, 27, 3], [38, 2, 41, 5], [38, 0, 39, 1], [4, 32, 7, 35]];
// The bridge's centre line (plan.md: cable/rib/truss planes at x 8 and x 22, the deck centre at x 15).
const CENTRE_X = 15;

const tally = (g) => ({ g, placed: 0, refused: [] });
const result = (t) => ({ placed: t.placed, refused: t.refused });

// One cell: refused unless it is inside the footprint box [x0, y0, z0, x1, y1, z1], in the grid, at y >= 1, and (unless over) air.
function put(t, [x0, y0, z0, x1, y1, z1], x, y, z, block, state, over) {
  if (x < x0 || x > x1 || y < y0 || y > y1 || z < z0 || z > z1 || y < 1) return t.refused.push([x, y, z, block, "outside"]);
  if (!t.g.inBounds(x, y, z)) return t.refused.push([x, y, z, block, "outside"]);
  if (!over && !t.g.isAir(x, y, z)) return t.refused.push([x, y, z, block, "occupied"]);
  t.g.set(x, y, z, block, state);
  t.placed++;
}

// The fort's outer parapet: y7 bricks and a y8 polished_granite coping on outer cells, a y7 brick_wall rail on parade cells.
// cells = [[x, z, "outer" | "parade"], ...]. Cells inside opts.skip (boxes [x0, z0, x1, z1]; default: the lighthouse and
// the towers) are left alone. A rail cell connects "low" to each neighbouring rail cell in the same run.
export function parapetRun(g, cells, opts = {}) {
  const skip = opts.skip ?? FORT_SKIP;
  const t = tally(g);
  const rail = new Set(cells.filter(([, , side]) => side === "parade").map(([x, z]) => `${x},${z}`));
  const xs = cells.map(([x]) => x), zs = cells.map(([, z]) => z);
  const fp = [Math.min(...xs), 7, Math.min(...zs), Math.max(...xs), 8, Math.max(...zs)];
  for (const [x, z, side] of cells) {
    if (skip.some(([x0, z0, x1, z1]) => x >= x0 && x <= x1 && z >= z0 && z <= z1)) continue;
    if (side === "outer") {
      put(t, fp, x, 7, z, "bricks", undefined, opts.over);
      put(t, fp, x, 8, z, "polished_granite", undefined, opts.over);
    } else if (side === "parade") {
      const state = { up: "true" };
      if (rail.has(`${x},${z - 1}`)) state.north = "low";
      if (rail.has(`${x + 1},${z}`)) state.east = "low";
      if (rail.has(`${x},${z + 1}`)) state.south = "low";
      if (rail.has(`${x - 1},${z}`)) state.west = "low";
      put(t, fp, x, 7, z, "brick_wall", state, opts.over);
    } else throw new Error(`parapetRun side must be "outer" or "parade", got ${side}`);
  }
  return result(t);
}

// A sally port through the wall at z1 (the face row): the passage x..x+1, y..y+2, z0..z1 is air, with upside-down brick
// stairs at x-1 and x+2 (y+2, z1) facing into the opening, and a y+3 lintel of polished_granite across x-1..x+2 with a
// chiseled keystone at x. Carving through a solid wall needs opts.over (the fort's wall is an earlier part's).
export function sallyPort(g, x, y, z0, z1, opts = {}) {
  const over = opts.over, t = tally(g);
  const fp = [x - 1, y, z0, x + 2, y + 3, z1];
  for (let z = z0; z <= z1; z++) for (let dx = 0; dx < 2; dx++) for (let dy = 0; dy < 3; dy++) put(t, fp, x + dx, y + dy, z, AIR, undefined, over);
  put(t, fp, x - 1, y + 2, z1, ...B.stairs("brick", "east", "top"), over);
  put(t, fp, x + 2, y + 2, z1, ...B.stairs("brick", "west", "top"), over);
  for (let dx = -1; dx <= 2; dx++) put(t, fp, x + dx, y + 3, z1, x + dx === x ? "chiseled_stone_bricks" : "polished_granite", undefined, over);
  return result(t);
}

// The lighthouse on a 3x3 base at x..x+2, z..z+2, from base y to y+7: polished_blackstone_wall legs at the corners (y..y+3),
// a green_terracotta core, a 3x3 polished_blackstone_slab gallery (y+4), the lantern room (y+5: glowstone centre, glass_pane
// edges facing it, blackstone wall corners), a stair cap (y+6: polished_blackstone centre, stairs rising inward) and a
// lightning_rod at y+7. Air-only unless opts.over.
export function lighthouse(g, x, y, z, opts = {}) {
  const over = opts.over, t = tally(g), fp = [x, y, z, x + 2, y + 7, z + 2];
  const at = (dx, dy, dz, block, state) => put(t, fp, x + dx, y + dy, z + dz, block, state, over);
  const corners = [[0, 0], [2, 0], [0, 2], [2, 2]];
  for (const [dx, dz] of corners) for (let dy = 0; dy <= 3; dy++) at(dx, dy, dz, "polished_blackstone_wall", { up: "true" });
  for (let dy = 0; dy <= 3; dy++) at(1, dy, 1, "green_terracotta");
  for (let dx = 0; dx <= 2; dx++) for (let dz = 0; dz <= 2; dz++) at(dx, 4, dz, ...B.slab("polished_blackstone", "top"));
  at(1, 5, 1, "glowstone");
  // each edge pane joins the glowstone on its inward side; the corners are walls
  at(1, 5, 0, "glass_pane", { south: "true" });
  at(1, 5, 2, "glass_pane", { north: "true" });
  at(0, 5, 1, "glass_pane", { east: "true" });
  at(2, 5, 1, "glass_pane", { west: "true" });
  for (const [dx, dz] of corners) at(dx, 5, dz, "polished_blackstone_wall", { up: "true" });
  at(1, 6, 1, "polished_blackstone");
  // the cap ring: edges face the centre; the corners face it along x (the west corners east, the east corners west)
  at(1, 6, 0, ...B.stairs("polished_blackstone", "south", "bottom"));
  at(1, 6, 2, ...B.stairs("polished_blackstone", "north", "bottom"));
  at(0, 6, 1, ...B.stairs("polished_blackstone", "east", "bottom"));
  at(2, 6, 1, ...B.stairs("polished_blackstone", "west", "bottom"));
  at(0, 6, 0, ...B.stairs("polished_blackstone", "east", "bottom"));
  at(0, 6, 2, ...B.stairs("polished_blackstone", "east", "bottom"));
  at(2, 6, 0, ...B.stairs("polished_blackstone", "west", "bottom"));
  at(2, 6, 2, ...B.stairs("polished_blackstone", "west", "bottom"));
  at(1, 7, 1, "lightning_rod", { facing: "up" });
  return result(t);
}

// A Deco pylon: a 7 x 9 body at x..x+6, z..z+8 from base y (1) to y+41 (y42). Plinth cut_sandstone at y..y+2, body
// smooth_sandstone, string course cut_sandstone at y+35. Fluting: from y+5 to y+34 the face cells are left out (the cell
// behind stays solid) on the north and south faces at x+2 and x+4, and on the outer column at z+2, z+4, z+6. The outer
// column is the west one unless opts.outer says "east" (west of the centre line x 15 is the default). Crown: an inset-1
// tier (x+1..x+5, z+1..z+7) at y+36..y+38, an inset-2 tier (x+2..x+4, z+2..z+6) at y+39..y+40, and a y+41 slab course
// over the inset-2 footprint (the ridge). Every exposed ledge gets a bottom slab on top.
export function pylon(g, x, y, z, opts = {}) {
  const over = opts.over, t = tally(g), fp = [x, y, z, x + 6, y + 41, z + 8];
  const outerDx = (opts.outer ?? (x < CENTRE_X ? "west" : "east")) === "west" ? 0 : 6;
  const grooved = (dx, dz) => ((dx === 2 || dx === 4) && (dz === 0 || dz === 8)) || (dx === outerDx && (dz === 2 || dz === 4 || dz === 6));
  const inF1 = (dx, dz) => dx >= 1 && dx <= 5 && dz >= 1 && dz <= 7;
  const inF2 = (dx, dz) => dx >= 2 && dx <= 4 && dz >= 2 && dz <= 6;
  const slab = B.slab("smooth_sandstone", "bottom");
  const cell = (dx, dz, dy) => {
    if (dy <= 35) {
      if (dy <= 2 || dy === 35) return ["cut_sandstone"];
      return dy >= 5 && grooved(dx, dz) ? null : ["smooth_sandstone"];
    }
    if (dy === 36) return inF1(dx, dz) ? ["smooth_sandstone"] : slab;
    if (dy === 37 || dy === 38) return inF1(dx, dz) ? ["smooth_sandstone"] : null;
    if (dy === 39) return inF2(dx, dz) ? ["smooth_sandstone"] : inF1(dx, dz) ? slab : null;
    if (dy === 40) return inF2(dx, dz) ? ["smooth_sandstone"] : null;
    return inF2(dx, dz) ? slab : null;
  };
  for (let dy = 0; dy <= 41; dy++) for (let dx = 0; dx <= 6; dx++) for (let dz = 0; dz <= 8; dz++) {
    const c = cell(dx, dz, dy);
    if (c) put(t, fp, x + dx, y + dy, z + dz, c[0], c[1], over);
  }
  return result(t);
}

// One cable housing: a solid smooth_sandstone wedge at x-1..x+1, z, from y15 up to cableY+1, with the cable itself
// (red_concrete) buried at x, cableY. opts.collar: a cut_sandstone ring 1 proud of the housing (at z-1) around the mouth.
export function cableHousing(g, x, z, cableY, opts = {}) {
  const over = opts.over, t = tally(g), fp = [x - 1, Math.min(15, cableY), z, x + 1, cableY + 1, z];
  for (let y = 15; y <= cableY + 1; y++) for (let dx = -1; dx <= 1; dx++) {
    const cable = dx === 0 && y === cableY;
    put(t, fp, x + dx, y, z, cable ? "red_concrete" : "smooth_sandstone", undefined, over);
  }
  if (cableY < 15) put(t, fp, x, cableY, z, "red_concrete", undefined, over);
  if (opts.collar) {
    const cfp = [x - 2, cableY - 1, z - 1, x + 2, cableY + 3, z - 1];
    for (let y = cableY - 1; y <= cableY + 3; y++) for (let dx = -2; dx <= 2; dx++) {
      if (Math.abs(dx) <= 1 && y >= cableY && y <= cableY + 2) continue;
      put(t, cfp, x + dx, y, z - 1, "cut_sandstone", undefined, over);
    }
  }
  return result(t);
}

// One 4-long bay of the stiffening truss at z..z+3, deck level Y, in each column of opts.xs (default x 8 and x 22):
// chords orange_terracotta at Y-4 and Y-1, a vertical at z in Y-3..Y-2, and a red_terracotta Warren zigzag across Y-3..Y-2
// through z+1..z+3. The zigzag starts in the upper row on one bay and the lower row on the next (by z).
export function trussBay(g, z, Y, opts = {}) {
  const over = opts.over, t = tally(g), xs = opts.xs ?? [8, 22];
  const first = Math.floor((z - 2) / 4) % 2 === 0 ? Y - 2 : Y - 3;
  const second = first === Y - 2 ? Y - 3 : Y - 2;
  for (const x of xs) {
    const fp = [x, Y - 4, z, x, Y - 1, z + 3];
    for (let k = 0; k < 4; k++) {
      put(t, fp, x, Y - 4, z + k, "orange_terracotta", undefined, over);
      put(t, fp, x, Y - 1, z + k, "orange_terracotta", undefined, over);
    }
    put(t, fp, x, Y - 3, z, "orange_terracotta", undefined, over);
    put(t, fp, x, Y - 2, z, "orange_terracotta", undefined, over);
    for (let k = 1; k <= 3; k++) put(t, fp, x, k % 2 === 1 ? first : second, z + k, "red_terracotta", undefined, over);
  }
  return result(t);
}

// The spandrel posts above an arch rib at plan z: orange_terracotta, 1 deep in z, two wide, from y0 up to y1 (default 29).
// opts.pairs: the x pairs (default [8, 9] and [21, 22]).
export function spandrelPost(g, z, y0, y1 = 29, opts = {}) {
  const over = opts.over, t = tally(g);
  for (const [xa, xb] of opts.pairs ?? [[8, 9], [21, 22]]) {
    const fp = [xa, y0, z, xb, y1, z];
    for (let x = xa; x <= xb; x++) for (let y = y0; y <= y1; y++) put(t, fp, x, y, z, "orange_terracotta", undefined, over);
  }
  return result(t);
}

// The south abutment: columns x0..x1 over z0..z1, from y1 up to top(z), smooth_sandstone with a cut_sandstone top course.
// top: a number or (z) => y. Default is plan.md's table: y24 for z 184..189, y23 at z 190.
const PLAN_TOP = (z) => (z === 190 ? 23 : 24);
export function abutment(g, x0, x1, z0, z1, opts = {}) {
  const over = opts.over, t = tally(g);
  const topOf = typeof opts.top === "number" ? () => opts.top : opts.top ?? PLAN_TOP;
  for (let z = z0; z <= z1; z++) {
    const h = topOf(z), fp = [x0, 1, z, x1, h, z];
    for (let x = x0; x <= x1; x++) for (let y = 1; y <= h; y++) put(t, fp, x, y, z, y === h ? "cut_sandstone" : "smooth_sandstone", undefined, over);
  }
  return result(t);
}
