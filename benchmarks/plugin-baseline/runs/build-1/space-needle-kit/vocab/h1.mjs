// SPDX-License-Identifier: AGPL-3.0-or-later
// Space Needle helper set H1 (plan.md VOCABULARY). Geometry is plan.md's: axis at cell (32, 32), azimuth clockwise
// from north (direction (sin θ, -cos θ) in x, z), cells on integer coordinates.
//
// Every helper takes its position as arguments (nothing is hard-wired to a spot) and writes only into AIR inside its
// own footprint. opts.replace lists block ids it may overwrite (default none); anything else is left alone and the
// helper returns the number of cells it actually wrote. Guarded grids (build.mjs guard) still refuse protected cells.
import { B, circleCells, inwardFacing, ringCells } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const AXIS = [32, 32];
const LEG_BLOCK = ["smooth_quartz", {}];
// leg → [pair azimuth in degrees, side]: the "a" leg is the minus side of the perpendicular, "b" the plus side
const LEGS = { Sa: [180, -1], Sb: [180, 1], NEa: [60, -1], NEb: [60, 1], NWa: [300, -1], NWb: [300, 1] };
const PAIR_AZIMUTH = { S: 180, NE: 60, NW: 300 };

const id = (b) => (b.includes(":") ? b : `minecraft:${b}`);
const rad = (deg) => (deg * Math.PI) / 180;

/** Write one block at [x, y, z] if the cell is air (or listed in opts.replace). Returns 1 if written, else 0. */
function place(g, [x, y, z], [block, state], { replace = [] } = {}) {
  if (!g.inBounds(x, y, z)) return 0;
  if (!g.isAir(x, y, z) && !replace.map(id).includes(g.blockAt(x, y, z))) return 0;
  g.set(x, y, z, block, state);
  return 1;
}

/** plan.md LEG TABLE: distance of a pair's centreline from the axis at height y. */
function legR(y) {
  return y <= 120 ? 6.5 + 15.5 * ((120 - y) / 119) ** 1.15 : 6.5 + 7.5 * ((y - 120) / 85) ** 1.4;
}

/** Origin [x, z] (min corner) of a leg's 2x2 box at height y, rounded exactly as the plan's table does. */
function legOrigin(leg, y) {
  const [deg, side] = LEGS[leg], th = rad(deg), R = legR(y);
  const cx = AXIS[0] + R * Math.sin(th) + side * 2.5 * Math.cos(th);
  const cz = AXIS[1] - R * Math.cos(th) + side * 2.5 * Math.sin(th);
  return [Math.round(cx - 0.5), Math.round(cz - 0.5)];
}

/** Cells of the 2x2 box with origin [x0, z0]. */
const box2 = (x0, z0) => [[x0, z0], [x0 + 1, z0], [x0, z0 + 1], [x0 + 1, z0 + 1]];

/** Bresenham line between two integer cells, both ends included. */
function line([x0, z0], [x1, z1]) {
  const out = [], dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1, dz = -Math.abs(z1 - z0), sz = z0 < z1 ? 1 : -1;
  let err = dx + dz, x = x0, z = z0;
  for (;;) {
    out.push([x, z]);
    if (x === x1 && z === z1) return out;
    const e2 = 2 * err;
    if (e2 >= dz) { err += dz; x += sx; }
    if (e2 <= dx) { err += dx; z += sz; }
  }
}

/** Fill the plot's ground: smooth_stone over x0..x1, z0..z1 at height y (the walk surface is y + 1). */
export function groundPlate(g, [x0, z0], [x1, z1], y, opts = {}) {
  let n = 0;
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) n += place(g, [x, y, z], ["smooth_stone", {}], opts);
  return n;
}

/**
 * Leg step between y - 1 and y for leg "Sa" | "Sb" | "NEa" | "NEb" | "NWa" | "NWb" (plan LEG TABLE). Where the 2x2 box
 * moves two or more cells in one axis, a bridge cell is laid at y - 1 so the leg stays in one piece. The old box's cells
 * that the new box leaves are capped at y by smooth_quartz_stairs whose back faces the new box (the step rises to the
 * leg). Does nothing where the origin is unchanged or y < 2.
 */
export function legStep(g, leg, y, opts = {}) {
  if (y < 2) return 0;
  const [ox, oz] = legOrigin(leg, y - 1), [nx, nz] = legOrigin(leg, y);
  if (ox === nx && oz === nz) return 0;
  const dx = nx - ox, dz = nz - oz;
  let n = 0;
  if (Math.abs(dx) >= 2) for (let z = Math.min(oz, nz); z <= Math.max(oz, nz) + 1; z++) n += place(g, [dx > 0 ? ox + 2 : ox - 1, y - 1, z], LEG_BLOCK, opts);
  if (Math.abs(dz) >= 2) for (let x = Math.min(ox, nx); x <= Math.max(ox, nx) + 1; x++) n += place(g, [x, y - 1, dz > 0 ? oz + 2 : oz - 1], LEG_BLOCK, opts);
  const oldBox = box2(ox, oz), newBox = box2(nx, nz);
  for (const [x, z] of oldBox) {
    if (newBox.some(([a, b]) => a === x && b === z)) continue;
    const facing = inwardFacing(x - (nx + 0.5), z - (nz + 0.5));
    n += place(g, [x, y, z], B.stairs("smooth_quartz", facing, "bottom"), opts);
  }
  return n;
}

/**
 * Radial tie at y: a bottom smooth_quartz_slab line from the pair's inner face to the core. S runs x 31..33 from z 36 to
 * the leg's inner face; NE and NW run one cell wide along their own diagonal (Bresenham).
 */
export function radialTie(g, pair, y, opts = {}) {
  let n = 0;
  if (pair === "S") {
    const zIn = Math.min(legOrigin("Sa", y)[1], legOrigin("Sb", y)[1]) - 1;
    for (let x = 31; x <= 33; x++) for (let z = 36; z <= zIn; z++) n += place(g, [x, y, z], B.slab("smooth_quartz", "bottom"), opts);
    return n;
  }
  const th = rad(PAIR_AZIMUTH[pair]), dx = Math.sin(th), dz = -Math.cos(th), R = legR(y);
  const from = [Math.round(AXIS[0] + 4.5 * dx), Math.round(AXIS[1] + 4.5 * dz)];
  const to = [Math.round(AXIS[0] + (R - 1) * dx), Math.round(AXIS[1] + (R - 1) * dz)];
  for (const [x, z] of line(from, to)) n += place(g, [x, y, z], B.slab("smooth_quartz", "bottom"), opts);
  return n;
}

/**
 * Glass elevator shaft: glass over x0..x0+1, z 27..28, y 2..222. opts.car writes the gold car (2x2x3 at y 150..152) last,
 * over the shaft's own glass; pass it for the east shaft (x0 = 34).
 */
export function elevatorShaft(g, x0, opts = {}) {
  const { car = false, ...rest } = opts;
  let n = 0;
  for (let x = x0; x <= x0 + 1; x++) for (let z = 27; z <= 28; z++) for (let y = 2; y <= 222; y++) n += place(g, [x, y, z], ["glass", {}], rest);
  if (car) for (let x = x0; x <= x0 + 1; x++) for (let z = 27; z <= 28; z++) for (let y = 150; y <= 152; y++) n += place(g, [x, y, z], ["gold_block", {}], { replace: ["glass"] });
  return n;
}

/**
 * Mullions: block (default white_concrete) at the ring-r cell nearest each azimuth, from startDeg every stepDeg round the
 * full circle, for y0..y1. Dresses an existing glass wall, so it may replace glass as well as writing into air.
 */
export function mullion(g, r, y0, y1, stepDeg, startDeg, opts = {}) {
  const { block = "white_concrete", ...rest } = opts;
  const ring = ringCells(r, { center: AXIS }), picks = new Set();
  for (let a = startDeg; a < startDeg + 360; a += stepDeg) {
    const px = AXIS[0] + r * Math.sin(rad(a)), pz = AXIS[1] - r * Math.cos(rad(a));
    let best = ring[0], bestD = Infinity;
    for (const c of ring) {
      const d = (c[0] - px) ** 2 + (c[1] - pz) ** 2;
      if (d < bestD) { bestD = d; best = c; }
    }
    picks.add(best.join(","));
  }
  let n = 0;
  for (const k of picks) {
    const [x, z] = k.split(",").map(Number);
    for (let y = y0; y <= y1; y++) n += place(g, [x, y, z], [block, {}], { replace: ["glass", ...(rest.replace ?? [])] });
  }
  return n;
}

/**
 * Conical shell at y: the annulus between the disc of radius prev (r at y - 1) and the disc of radius r (at y), around the
 * axis. Air only, so the core and the legs keep their cells.
 */
export function coneShell(g, y, r, prev, opts = {}) {
  const { block = "light_gray_concrete", ...rest } = opts;
  const inner = new Set(circleCells(prev, { center: AXIS }).map((c) => c.join(",")));
  let n = 0;
  for (const [x, z] of circleCells(r, { center: AXIS })) if (!inner.has([x, z].join(","))) n += place(g, [x, y, z], [block, {}], rest);
  return n;
}

/** Halo fin at azimuth theta (degrees): white_concrete on the cells at r 28, 29 and 30, for y0..y1. */
export function haloFin(g, theta, y0, y1, opts = {}) {
  const th = rad(theta);
  let n = 0;
  for (const r of [28, 29, 30]) {
    const x = Math.round(AXIS[0] + r * Math.sin(th)), z = Math.round(AXIS[1] - r * Math.cos(th));
    for (let y = y0; y <= y1; y++) n += place(g, [x, y, z], ["white_concrete", {}], opts);
  }
  return n;
}

/**
 * Drum at centre [cx, cz] with radius r: the floor disc at y0 (smooth_quartz), then the orange band at y0 + 1 .. y0 + 2.
 * plan.md: y0 = 227, r = 12.
 */
export function drumBand(g, cx, cz, y0, r, opts = {}) {
  const { base = "smooth_quartz", band = "orange_terracotta", ...rest } = opts;
  let n = 0;
  for (const [x, z] of circleCells(r, { center: [cx, cz] })) {
    n += place(g, [x, y0, z], [base, {}], rest);
    n += place(g, [x, y0 + 1, z], [band, {}], rest);
    n += place(g, [x, y0 + 2, z], [band, {}], rest);
  }
  return n;
}

/**
 * Restaurant table at [x, y, z]: a white_concrete post at y and a bottom smooth_quartz_slab on top of it (the top at
 * y + 1.5). Uses cells y and y + 1 only, so the 2-high clear lane above it stays open.
 */
export function table(g, x, y, z, opts = {}) {
  return place(g, [x, y, z], ["white_concrete", {}], opts) + place(g, [x, y + 1, z], B.slab("smooth_quartz", "bottom"), opts);
}
