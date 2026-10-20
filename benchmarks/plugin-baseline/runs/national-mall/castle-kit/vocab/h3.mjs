// SPDX-License-Identifier: AGPL-3.0-or-later
// plan.md VOCABULARY helpers (h3 group): corbelTable, glowCell, slateSpire, oriel, polyBand, octoRing, smallWindow,
// precastStrip, sculpture. Plot-local coordinates; each helper takes its position (and facing) as arguments and
// writes only its own footprint. Writes go only into air unless opts.replace is true, which lets a band or trim go
// over an existing wall in that same footprint. Nothing is written beside or under a footprint.
// States are explicit: 1.21.1 stairs, slabs and panes take no waterlogged property (mcd states --version 1.21.1).
import { ringStair } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const st = (facing, half = "bottom", shape = "straight") => ({ facing, half, shape });

/** One cell. Returns 1 if written; 0 when the cell is out of bounds, not air (unless opts.replace) or guard-refused. */
function put(g, x, y, z, block, state, { replace = false } = {}) {
  if (!g.inBounds(x, y, z) || (!replace && !g.isAir(x, y, z))) return 0;
  const refused = g.refused?.length ?? 0;
  g.set(x, y, z, block, state);
  return (g.refused?.length ?? 0) === refused ? 1 : 0;
}

/** Upside-down red_nether_brick_stairs, one cell proud of the box [x0,z0,x1,z1] on its long faces (or opts.faces), at y. */
export function corbelTable(g, [x0, z0, x1, z1], y, opts = {}) {
  const block = "red_nether_brick_stairs";
  const faces = opts.faces ?? (x1 - x0 >= z1 - z0 ? ["north", "south"] : ["east", "west"]);
  let n = 0;
  for (const f of faces) {
    // facing = the back, into the wall; the lip points out
    if (f === "north") for (let x = x0; x <= x1; x++) n += put(g, x, y, z0 - 1, block, st("south", "top"), opts);
    if (f === "south") for (let x = x0; x <= x1; x++) n += put(g, x, y, z1 + 1, block, st("north", "top"), opts);
    if (f === "west") for (let z = z0; z <= z1; z++) n += put(g, x0 - 1, y, z, block, st("east", "top"), opts);
    if (f === "east") for (let z = z0; z <= z1; z++) n += put(g, x1 + 1, y, z, block, st("west", "top"), opts);
  }
  return n;
}

/** Shroomlight one cell inside the wall plane, at the window's centre height. */
export const glowCell = (g, x, y, z, opts = {}) => put(g, x, y, z, "shroomlight", null, opts);

/**
 * Steep slate spire on the tower rect [x0,z0,x1,z1] whose shaft top is y-1. Each row is the rect inset 1 cell more:
 * stair ring (back inward, corners shaped); once a row is 2 wide or less, or it is the last row, a slab cap. A
 * lightning_rod sits on the cap. A polished_granite slab band, proud 1, runs one row under the eave (y-1).
 * Returns cells written. Rows fall short of `height` when the rect shrinks first (a 4x4 tower gets a 2-row cap).
 */
export function slateSpire(g, [x0, z0, x1, z1], y, height, opts = {}) {
  const { material = "deepslate_tile", finial = true, band = true } = opts;
  let n = 0, apex = null;
  if (band) {
    for (let x = x0 - 1; x <= x1 + 1; x++) for (const z of [z0 - 1, z1 + 1]) n += put(g, x, y - 1, z, "polished_granite_slab", { type: "top" }, opts);
    for (let z = z0; z <= z1; z++) for (const x of [x0 - 1, x1 + 1]) n += put(g, x, y - 1, z, "polished_granite_slab", { type: "top" }, opts);
  }
  for (let k = 0; k < height; k++) {
    const a = x0 + k, b = x1 - k, c = z0 + k, e = z1 - k;
    if (b < a || e < c) break;
    const cap = k === height - 1 || b - a < 2 || e - c < 2;
    for (let x = a; x <= b; x++) for (let z = c; z <= e; z++) {
      if (cap) { n += put(g, x, y + k, z, `${material}_slab`, { type: "bottom" }, opts); continue; }
      const outZ = z === c ? "north" : z === e ? "south" : null, outX = x === a ? "west" : x === b ? "east" : null;
      if (!outZ && !outX) continue;
      const [facing, shape] = ringStair(outZ, outX);
      n += put(g, x, y + k, z, `${material}_stairs`, st(facing, "bottom", shape), opts);
    }
    if (cap) { apex = { x: (a + b) >> 1, y: y + k, z: (c + e) >> 1 }; break; }
  }
  if (finial && apex) n += put(g, apex.x, apex.y + 1, apex.z, "lightning_rod", { facing: "up", powered: "false" }, opts);
  return n;
}

/**
 * Corbelled bay on the wall at z, x0..x1 by y0..y1: red_terracotta one cell proud of the wall, paired gray glass lights
 * in the middle columns below the top row, upside-down red_nether_brick_stairs corbels at y0-1 (skipped where a roof
 * already sits), a deepslate_tile slab cap at y1+1.
 */
export function oriel(g, x0, x1, z, y0, y1, opts = {}) {
  let n = 0;
  const lights = { north: "false", east: "true", south: "false", west: "true" };
  for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) {
    const glass = x > x0 && x < x1 && y < y1;
    n += glass ? put(g, x, y, z, "gray_stained_glass_pane", lights, opts) : put(g, x, y, z, "red_terracotta", null, opts);
  }
  for (let x = x0; x <= x1; x++) n += put(g, x, y0 - 1, z, "red_nether_brick_stairs", st("south", "top"), opts);
  for (let x = x0; x <= x1; x++) n += put(g, x, y1 + 1, z, "deepslate_tile_slab", { type: "bottom" }, opts);
  return n;
}

/** Band course round the perimeter of the rect [x0,z0,x1,z1], `thickness` rows from y, flush with the wall. */
export function polyBand(g, [x0, z0, x1, z1], y, material, thickness = 1, opts = {}) {
  let n = 0;
  for (let dy = 0; dy < thickness; dy++) for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    if (x !== x0 && x !== x1 && z !== z0 && z !== z1) continue;
    n += put(g, x, y + dy, z, material, null, opts);
  }
  return n;
}

/**
 * Octagonal wall ring centred (cx,cz), half-width r (the box is 2r+1 square), with `chamfer` cells cut from each corner,
 * rows y0..y1. opts.block sets the wall (default bricks).
 */
export function octoRing(g, cx, cz, r, chamfer, y0, y1, opts = {}) {
  const block = opts.block ?? "bricks";
  const [x0, z0, x1, z1] = [cx - r, cz - r, cx + r, cz + r];
  const inside = (x, z) => x >= x0 && x <= x1 && z >= z0 && z <= z1 && Math.min(x - x0, x1 - x) + Math.min(z - z0, z1 - z) >= chamfer;
  let n = 0;
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    if (!inside(x, z) || (inside(x - 1, z) && inside(x + 1, z) && inside(x, z - 1) && inside(x, z + 1))) continue;
    for (let y = y0; y <= y1; y++) n += put(g, x, y, z, block, null, opts);
  }
  return n;
}

/** 1x1 gray glass pane at (x,y,z) in the wall of `face`, with a polished_diorite sill below and lintel above. */
export function smallWindow(g, x, y, z, face = "north", opts = {}) {
  if (!["north", "south", "east", "west"].includes(face)) throw new Error(`smallWindow: face ${face}`);
  // the pane joins along the wall: east/west for a north or south wall, north/south for an east or west wall
  const join = face === "north" || face === "south"
    ? { north: "false", east: "true", south: "false", west: "true" }
    : { north: "true", east: "false", south: "true", west: "false" };
  let n = put(g, x, y, z, "gray_stained_glass_pane", join, opts);
  n += put(g, x, y - 1, z, "polished_diorite", null, opts);
  n += put(g, x, y + 1, z, "polished_diorite", null, opts);
  return n;
}

// 20 strips of 2 columns: W = white_terracotta (14), S = smooth_sandstone (3), G = light_gray_concrete (3) ≈ 70/15/15
const PRECAST_ROW = "WWSWWGWWWSWWGWWWSWWG";
const PRECAST = { W: "white_terracotta", S: "smooth_sandstone", G: "light_gray_concrete" };
/** Panel material for drum column index i (two columns per strip, so the joints read as strips). */
export const precastMaterial = (i) => PRECAST[PRECAST_ROW[Math.floor(i / 2) % PRECAST_ROW.length]];

/** A column of precast panel material at (x,z), rows y0..y1; the strip is chosen by column index i. */
export function precastStrip(g, x, y0, y1, z, i, opts = {}) {
  let n = 0;
  for (let y = y0; y <= y1; y++) n += put(g, x, y, z, precastMaterial(i), null, opts);
  return n;
}

/**
 * Column of polished_blackstone (opts.material "basalt", axis y) h high from y at (x,z); opts.width 2 adds the cell
 * to +x. Only the column is written, so the 2-high lane past it stays clear.
 */
export function sculpture(g, x, y, z, h, opts = {}) {
  const { material = "polished_blackstone", width = 1 } = opts;
  const state = material === "basalt" ? { axis: "y" } : null;
  let n = 0;
  for (let dx = 0; dx < width; dx++) for (let dy = 0; dy < h; dy++) n += put(g, x + dx, y + dy, z, material, state, opts);
  return n;
}
