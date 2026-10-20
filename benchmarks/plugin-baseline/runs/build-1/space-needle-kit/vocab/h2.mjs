// SPDX-License-Identifier: AGPL-3.0-or-later
// Space Needle vocabulary, set h2 (plan.md VOCABULARY). Every helper takes the grid `g` first (a build-library Grid,
// from load() or new Grid()), then its position: `axis` = [cx, cz], the tower's centre cell ([32, 32] in plan.md),
// and the y levels it needs. Nothing is hard-wired to a spot.
//
// Writes are AIR-ONLY: a cell that already holds a block (ground, an earlier part's wall) is refused and listed in the
// returned `refused` ("x,y,z" strings), never overwritten. Pass `replace: true` only where the plan says a part writes
// over an earlier one. Each helper returns { placed, refused }. Every write is a plain g.set with states the 1.21.1
// toolkit lists (`$MCD states <block> --version 1.21.1`).

// ---- plumbing ---------------------------------------------------------------------------------------------------------
function need(name, opts, keys) {
  for (const k of keys) if (opts?.[k] === undefined) throw new Error(`${name}: missing ${k}`);
}
const result = () => ({ placed: 0, refused: [] });

/** One write: into air (or over it with replace). */
function put(g, out, x, y, z, block, state, replace) {
  if (!replace && !g.isAir(x, y, z)) {
    out.refused.push(`${x},${y},${z}`);
    return;
  }
  g.set(x, y, z, block, state);
  out.placed++;
}

/** Degrees clockwise from north (-z), 0..360, for a cell offset (dx, dz) from the axis. */
function azimuth(dx, dz) {
  const a = (Math.atan2(dx, -dz) * 180) / Math.PI;
  return a < 0 ? a + 360 : a;
}

// ---- legs -------------------------------------------------------------------------------------------------------------
/** plan.md LEG TABLE: each leg's pair direction θ and which side of the pair centreline it sits on. */
const LEGS = { Sa: [180, -1], Sb: [180, 1], NEa: [60, -1], NEb: [60, 1], NWa: [300, -1], NWb: [300, 1] };

/** Pair centreline distance from the axis at height y. */
export function legR(y) {
  return y <= 120 ? 6.5 + 15.5 * ((120 - y) / 119) ** 1.15 : 6.5 + 7.5 * ((y - 120) / 85) ** 1.4;
}

/** A leg's centre and its 2x2 origin at height y: { cx, cz, x0, z0, R }. Pure: writes nothing. */
export function legCentre(leg, y, opts = {}) {
  need("legCentre", opts, ["axis"]);
  const [deg, side] = LEGS[leg] ?? (() => { throw new Error(`legCentre: unknown leg ${leg}`); })();
  const [ax, az] = opts.axis, th = (deg * Math.PI) / 180, R = legR(y);
  const cx = ax + R * Math.sin(th) + side * 2.5 * Math.cos(th);
  const cz = az - R * Math.cos(th) + side * 2.5 * Math.sin(th);
  return { cx, cz, x0: Math.round(cx - 0.5), z0: Math.round(cz - 0.5), R };
}

/** 4x4 smooth_quartz pad at y (the walk surface, 1) around the leg's 2x2 box at that y. Placed first; the leg
 *  overwrites its own 2x2 with replace: true. */
export function footPad(g, leg, opts = {}) {
  need("footPad", opts, ["axis", "y"]);
  const { y, replace = false } = opts, out = result();
  const { x0, z0 } = legCentre(leg, y, opts);
  for (let x = x0 - 1; x <= x0 + 2; x++) for (let z = z0 - 1; z <= z0 + 2; z++) put(g, out, x, y, z, "smooth_quartz", null, replace);
  return out;
}

// ---- core -------------------------------------------------------------------------------------------------------------
/** The 7x7 core: white posts at the four corners and the south spine (cx, cz+3), iron bars on the other perimeter
 *  cells, the 5x5 shaft left open. doors: [[yLo, yHi], ...] of north-face doorways (x cx-1..cx+1 on z cz-3), left empty. */
export function coreLattice(g, opts = {}) {
  need("coreLattice", opts, ["axis", "y0", "y1"]);
  const { axis: [cx, cz], y0, y1, doors = [], replace = false } = opts, out = result();
  const perim = (x, z) => Math.max(Math.abs(x - cx), Math.abs(z - cz)) === 3;
  const door = (x, z, y) => z === cz - 3 && Math.abs(x - cx) <= 1 && doors.some(([a, b]) => y >= a && y <= b);
  const post = (x, z) => (Math.abs(x - cx) === 3 && Math.abs(z - cz) === 3) || (x === cx && z === cz + 3);
  for (let y = y0; y <= y1; y++)
    for (let x = cx - 3; x <= cx + 3; x++)
      for (let z = cz - 3; z <= cz + 3; z++) {
        if (!perim(x, z) || door(x, z, y)) continue;
        if (post(x, z)) { put(g, out, x, y, z, "white_concrete", null, replace); continue; }
        const lat = (nx, nz) => perim(nx, nz) && !door(nx, nz, y);   // bars join bars, posts and solid neighbours
        put(g, out, x, y, z, "iron_bars", {
          north: String(lat(x, z - 1)), east: String(lat(x + 1, z)), south: String(lat(x, z + 1)), west: String(lat(x - 1, z)),
        }, replace);
      }
  return out;
}

/** The climbing ladder on the axis' south side: x cx, z cz+2 (against the spine at z cz+3), y0..y1. Facing is the
 *  side the ladder faces: "north" for the plan's ladder against the south spine. */
export function coreLadder(g, opts = {}) {
  need("coreLadder", opts, ["axis", "y0", "y1", "facing"]);
  const { axis: [cx, cz], y0, y1, facing, replace = false } = opts, out = result();
  for (let y = y0; y <= y1; y++) put(g, out, cx, y, cz + 2, "ladder", { facing }, replace);
  return out;
}

// ---- pavilion approach ------------------------------------------------------------------------------------------------
/** The approach at y (1): full smooth_quartz landing r 14.5..18.5 over θ 345..15 (north), and a bottom-slab ramp
 *  r 16.5..18.5 over θ 315..345 curving round from the north-west. Ground under it is the plot's, never written. */
export function pavilionRamp(g, opts = {}) {
  need("pavilionRamp", opts, ["axis", "y"]);
  const { axis: [cx, cz], y, replace = false } = opts, out = result();
  for (let x = cx - 19; x <= cx + 19; x++)
    for (let z = cz - 19; z <= cz + 19; z++) {
      const dx = x - cx, dz = z - cz, r = Math.hypot(dx, dz), th = azimuth(dx, dz);
      if (r < 14.5 || r > 18.5) continue;
      if (th >= 345 || th <= 15) put(g, out, x, y, z, "smooth_quartz", null, replace);
      else if (th >= 315 && th < 345 && r >= 16.5) put(g, out, x, y, z, "smooth_quartz_slab", { type: "bottom" }, replace);
    }
  return out;
}

// ---- saucer ------------------------------------------------------------------------------------------------------------
/** Radius of the underside cone at the top of layer y (205..211): 14 at 205, 30 at 211. */
const coneR = (y) => 14 + ((y - 205) * 16) / 7;

/** The cone layer whose annulus holds radius r (the surface cell at that radius). */
function coneLayer(r) {
  for (let y = 205; y <= 211; y++) if (r <= coneR(y) + 1e-9) return y;
  return null;
}

/** One smooth_quartz rib along azimuth θ from r rMin to rMax, one block below the cone's surface cell at each radius.
 *  The surface cell is solid and the cell under it is air, so the rib can only sit at layer-1 (plan says 205..211 for
 *  the layers themselves; the air-only rule puts it one block lower, 204..210). Inside the throat (r<=13) the rib
 *  cell is refused. */
export function radialRib(g, theta, opts = {}) {
  need("radialRib", opts, ["axis"]);
  const { axis: [cx, cz], rMin = 4, rMax = 30, replace = false } = opts, out = result(), seen = new Set();
  const rad = (theta * Math.PI) / 180;
  for (let t = rMin; t <= rMax; t += 0.25) {
    const x = Math.round(cx + t * Math.sin(rad)), z = Math.round(cz - t * Math.cos(rad));
    const r = Math.hypot(x - cx, z - cz), k = `${x},${z}`;
    if (seen.has(k) || r > rMax) continue;
    seen.add(k);
    const layer = coneLayer(r);
    if (layer == null) continue;
    put(g, out, x, layer - 1, z, "smooth_quartz", null, replace);
  }
  return out;
}

/** A ring band of bottom smooth_quartz_slab at y, cells with r0 <= r <= r1 (ring at N: N-0.5 < r <= N+0.5). */
export function hoop(g, y, opts = {}) {
  need("hoop", opts, ["axis", "r0", "r1"]);
  const { axis: [cx, cz], r0, r1, replace = false } = opts, out = result();
  for (let x = cx - r1 - 1; x <= cx + r1 + 1; x++)
    for (let z = cz - r1 - 1; z <= cz + r1 + 1; z++) {
      const r = Math.hypot(x - cx, z - cz);
      if (r > r0 - 0.5 && r <= r1 + 0.5) put(g, out, x, y, z, "smooth_quartz_slab", { type: "bottom" }, replace);
    }
  return out;
}

// ---- spire ------------------------------------------------------------------------------------------------------------
/** The mast on the axis: white_concrete for 4 blocks from base, end rods facing up up to top-1, a sea lantern at top. */
export function spire(g, opts = {}) {
  need("spire", opts, ["axis", "base", "top"]);
  const { axis: [cx, cz], base, top, replace = false } = opts, out = result();
  for (let y = base; y <= top; y++) {
    if (y <= base + 3) put(g, out, cx, y, cz, "white_concrete", null, replace);
    else if (y < top) put(g, out, cx, y, cz, "end_rod", { facing: "up" }, replace);
    else put(g, out, cx, y, cz, "sea_lantern", null, replace);
  }
  return out;
}
