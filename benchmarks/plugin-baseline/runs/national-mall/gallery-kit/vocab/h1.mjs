// Vocabulary part 1 (plan.md VOCABULARY): ten helpers the part workers call for the National Gallery of Art.
// Each takes its own position (and facing where it has one) as arguments and writes only its own footprint.
// Writes go into air only: a cell that already holds a block is refused and listed in `refused`, never overwritten.
// Two exceptions follow the plan's ground rule: a wall's own base replaces the ground block under it (marbleWall's
// footing, planarWall's y 0), and an opening replaces the wall it is cut into (recessDoor, entranceSlot).
// Every helper returns { placed, refused: [[x, y, z, was], ...] } so the caller can see what was skipped.
// Block ids are 1.21.1 names (chain, not iron_chain); stair, slab, pillar, chain and lantern states come from B.
import { B, DIRS, OPPOSITE, ringStair } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// One place to write: air only unless over, and every refusal is recorded.
function writer(g) {
  const out = { placed: 0, refused: [] };
  const put = (x, y, z, pair, over = false) => {
    const [block, state, nbt] = typeof pair === "string" ? [pair] : pair;
    if (!over && !g.isAir(x, y, z)) out.refused.push([x, y, z, g.blockAt(x, y, z)]);
    else { g.set(x, y, z, block, state, nbt); out.placed++; }
  };
  return { put, out };
}

// The cells on the outline of a rectangle [x0, z0, x1, z1], both ends included.
function outline([x0, z0, x1, z1]) {
  const cells = [];
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) if (x === x0 || x === x1 || z === z0 || z === z1) cells.push([x, z]);
  return cells;
}

// ---- West walls -------------------------------------------------------------------------------------------------------

/**
 * The West marble wall round a rectangle [x0, z0, x1, z1], hollow and 1 thick: polished_granite footing from `ground`
 * to y 2 (replaces the ground block), smooth_quartz base y 3, white_terracotta y 4..10, calcite frieze y 11,
 * smooth_quartz y 12 (the cornice ring sits outside it, see corniceRing).
 */
export function marbleWall(g, rect, { ground = 0 } = {}) {
  const w = writer(g);
  for (const [x, z] of outline(rect)) {
    for (let y = ground; y <= 2; y++) w.put(x, y, z, ["polished_granite"], true);
    w.put(x, 3, z, ["smooth_quartz"]);
    for (let y = 4; y <= 10; y++) w.put(x, y, z, ["white_terracotta"]);
    w.put(x, 11, z, ["calcite"]);
    w.put(x, 12, z, ["smooth_quartz"]);
  }
  return w.out;
}

/**
 * The 1-proud cornice course round the walls of rect [x0, z0, x1, z1] at height y (default 12): smooth_quartz_stairs
 * upside down (half top), each facing into the wall, corners shaped outer. rect is the wall's footprint, not the ring.
 * Writes the ring one cell outside rect.
 */
export function corniceRing(g, [x0, z0, x1, z1], y = 12) {
  const w = writer(g);
  for (let x = x0 - 1; x <= x1 + 1; x++) for (let z = z0 - 1; z <= z1 + 1; z++) {
    if (x >= x0 && x <= x1 && z >= z0 && z <= z1) continue;      // inside the wall, not on the ring
    const outZ = z < z0 ? "north" : z > z1 ? "south" : null;
    const outX = x < x0 ? "west" : x > x1 ? "east" : null;
    const [facing, shape] = ringStair(outZ, outX);
    w.put(x, y, z, B.stairs("smooth_quartz", facing, "top", shape));
  }
  return w.out;
}

/** One Ionic portico column at (x, z): smooth_quartz slab base at y 4, quartz_pillar shaft y 5..9, slab capital at y 10. */
export function ionicColumn(g, x, z) {
  const w = writer(g);
  w.put(x, 4, z, B.slab("smooth_quartz", "bottom"));
  for (let y = 5; y <= 9; y++) w.put(x, y, z, B.pillar("quartz_pillar", "y"));
  w.put(x, 10, z, B.slab("smooth_quartz", "top"));
  return w.out;
}

/**
 * Half steps from rows of { x0, x1, z, y, kind } (the OPENINGS table): kind "slab" = smooth_quartz_slab bottom,
 * kind "block" = smooth_quartz. Each row is one z line of the flight, x0..x1 inclusive.
 */
export function slabSteps(g, rows) {
  const w = writer(g);
  for (const { x0, x1, z, y, kind } of rows) for (let x = x0; x <= x1; x++) {
    if (kind === "slab") w.put(x, y, z, B.slab("smooth_quartz", "bottom"));
    else w.put(x, y, z, ["smooth_quartz"]);
  }
  return w.out;
}

/**
 * The 3x3 oculus lantern centred on (cx, cz): copper corners, glass pane sides (each joined to the copper beside it),
 * a glass centre at y (default 25), and a 3x3 weathered_cut_copper_slab cap at y + 1.
 */
export function oculusLantern(g, cx, cz, y = 25) {
  const w = writer(g);
  // inside the 3x3 and not the centre: a pane joins the copper corners beside it
  const joins = (a, b) => Math.abs(a) <= 1 && Math.abs(b) <= 1 && (a || b);
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const x = cx + dx, z = cz + dz;
    const edge = Math.abs(dx) + Math.abs(dz) === 1;
    const corner = Math.abs(dx) === 1 && Math.abs(dz) === 1;
    if (corner) w.put(x, y, z, ["weathered_cut_copper"]);
    else if (edge) w.put(x, y, z, ["glass_pane", {
      north: String(joins(dx, dz - 1)), east: String(joins(dx + 1, dz)),
      south: String(joins(dx, dz + 1)), west: String(joins(dx - 1, dz)),
    }]);
    else w.put(x, y, z, ["glass"]);
    w.put(x, y + 1, z, B.slab("weathered_cut_copper", "bottom"));
  }
  return w.out;
}

/**
 * A doorway recessed 1 into a wall (plan OPENINGS). (x, z) is the door's centre cell in the wall's plane; face is the
 * way it opens ("north" = out to -z). w cells wide along the wall (default 3): the plane cells y 4..8 are carved to
 * air, the tinted_glass back sits one cell in, smooth_quartz flanks run y 4..9 two cells out from the centre, and a
 * smooth_quartz lintel at y 9. The opening replaces the wall cells it is cut into.
 */
export function recessDoor(g, x, z, face, w = 3) {
  const out = writer(g);
  const lat = face === "north" || face === "south" ? DIRS.east : DIRS.south;   // along the wall
  const inn = DIRS[OPPOSITE[face]];                                             // into the building
  const half = (w - 1) / 2;
  // l along the wall, d 0 on the wall plane and 1 one cell in
  const at = (l, d, y) => [x + l * lat[0] + d * inn[0], y, z + l * lat[2] + d * inn[2]];
  for (let l = -half; l <= half; l++) for (let y = 4; y <= 8; y++) {
    out.put(...at(l, 0, y), ["minecraft:air"], true);
    out.put(...at(l, 1, y), ["tinted_glass"], true);
  }
  for (const l of [-half - 1, half + 1]) for (let y = 4; y <= 9; y++) out.put(...at(l, 0, y), ["smooth_quartz"], true);
  for (let l = -half - 1; l <= half + 1; l++) out.put(...at(l, 0, 9), ["smooth_quartz"], true);
  return out.out;
}

// ---- lights ------------------------------------------------------------------------------------------------------------

/**
 * A lantern hung from a block above (plan: hanging lanterns on iron chain): chain at (x, y, z) under the solid block at
 * y + 1, the lantern at y - 1. Places nothing unless there is a block above and the two cells under the lantern (y - 2,
 * y - 3) are air, so a 2-high lane stays clear under it.
 */
export function hangLamp(g, x, y, z) {
  const w = writer(g);
  if (g.isAir(x, y + 1, z)) { w.out.refused.push([x, y, z, "no block above"]); return w.out; }
  if (!g.isAir(x, y - 2, z) || !g.isAir(x, y - 3, z)) { w.out.refused.push([x, y, z, "no clear lane"]); return w.out; }
  w.put(x, y, z, B.chain("y", false));
  w.put(x, y - 1, z, B.lantern(true));
  return w.out;
}

// ---- East building -----------------------------------------------------------------------------------------------------

/**
 * The East body's planar walls from rows [z, x0, x1] (plan BODY): white_terracotta y 0..12, a calcite course at y 13 and
 * a calcite coping at y 14, flush and without overhang. The ground block at y 0 is replaced (plot 1 walls start at y 0).
 * Rows leave out the entrance slot, the west recess and the wedge slot.
 */
export function planarWall(g, rows) {
  const w = writer(g);
  for (const [z, x0, x1] of rows) for (let x = x0; x <= x1; x++) {
    w.put(x, 0, z, ["white_terracotta"], true);
    for (let y = 1; y <= 12; y++) w.put(x, y, z, ["white_terracotta"]);
    w.put(x, 13, z, ["calcite"]);
    w.put(x, 14, z, ["calcite"]);
  }
  return w.out;
}

/**
 * The East entrance slot (plan OPENINGS): a dark recess depth cells deep and len cells wide, open to `face`. (x, z) is
 * its mouth cell on the wall plane (default west: 108, 13, so the slot runs x 108..110, z 13..18). The slot is carved to
 * air from y0 up to h cells, a white_terracotta ceiling course sits over it at y0 + h, tinted_glass closes the back,
 * and three lanterns hang from the ceiling at the 2nd, 4th and 6th cells across (z 14, 16, 18).
 */
export function entranceSlot(g, x, z, face = "west", { depth = 3, len = 6, h = 5, y0 = 0 } = {}) {
  const w = writer(g);
  const lat = face === "north" || face === "south" ? DIRS.east : DIRS.south;   // across the slot
  const inn = DIRS[OPPOSITE[face]];                                             // into the slot
  // l across the slot, d in from the mouth (0), y up from y0
  const at = (l, d, y) => [x + l * lat[0] + d * inn[0], y0 + y, z + l * lat[2] + d * inn[2]];
  for (let d = 0; d < depth; d++) for (let l = 0; l < len; l++) {
    for (let y = 0; y < h; y++) w.put(...at(l, d, y), ["minecraft:air"], true);
    w.put(...at(l, d, h), ["white_terracotta"], true);
  }
  for (let l = 0; l < len; l++) for (let y = 0; y < h; y++) w.put(...at(l, depth, y), ["tinted_glass"], true);
  for (const l of [1, 3, 5]) w.put(...at(l, 1, h - 1), B.lantern(true));
  return w.out;
}

/**
 * The East atrium's glass space frame over the triangle given as rows [z, x0, x1] (plan ATRIUM), at height y (default
 * 14). Glass everywhere in the triangle except the ribs, light_gray_concrete on: the spine (the middle row), the base
 * (the least x), and two families of diagonals every 4 cells, parallel to the two sloped edges (3 cells across per row).
 * Where two rib lines cross, a glass_pane is lifted to y + 1 on that cell.
 */
export function atriumRoof(g, rows, y = 14) {
  const w = writer(g);
  const zMin = Math.min(...rows.map((r) => r[0])), zMax = Math.max(...rows.map((r) => r[0]));
  const zMid = (zMin + zMax) / 2, xBase = Math.min(...rows.map((r) => r[1]));
  const mod4 = (n) => ((n % 4) + 4) % 4;
  for (const [z, x0, x1] of rows) for (let x = x0; x <= x1; x++) {
    const u = x - xBase, v = z - zMin, vMax = zMax - zMin;
    const lines = [z === zMid, x === xBase, mod4(u - 3 * v) === 0, mod4(u + 3 * v - 3 * vMax) === 0].filter(Boolean).length;
    if (lines === 0) w.put(x, y, z, ["glass"]);
    else {
      w.put(x, y, z, ["light_gray_concrete"]);
      if (lines > 1) w.put(x, y + 1, z, ["glass_pane"]);
    }
  }
  return w.out;
}
