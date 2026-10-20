// Nine vocabulary helpers from plan.md (VOCABULARY): ashlarWall, roundArch, gableEnd, battlements, uplight, bigArch,
// cornice, courtTree, soffitLight. Placed through the build library; block ids are plan.md's PALETTE, states checked
// against 1.21.1 with `mcd states`.
//
// Contract every helper keeps:
// - takes its position (and a face where it has one) as arguments; nothing is hard-wired to a spot;
// - writes only inside the footprint it computes from its arguments (a write outside throws: a bug in the caller);
// - writes only into air, unless opts.over is true (to cut an opening or dress a wall the shell already built).
//   A refused write (a solid cell without over) is pushed onto g.refused and not placed.
// Faces are the outward face of the wall: north is low z (the Mall front), east is high x.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// ---- kit materials (plan.md PALETTE) ------------------------------------------------------------------------------
// stair: the material name B.stairs appends _stairs to (the arch and corner stairs of the openings).
const KIT = {
  castle: { body: "red_terracotta", plinth: "red_nether_bricks", granite: true, stair: "polished_granite", trim: "polished_granite" },
  ai: { body: "bricks", plinth: "polished_andesite", granite: false, stair: "brick", trim: "orange_terracotta" },
  freer: { body: "white_terracotta", plinth: "smooth_stone", granite: false, stair: "polished_diorite", trim: "polished_diorite" },
};

// ---- geometry -----------------------------------------------------------------------------------------------------
/** Inclusive box [x0, y0, z0, x1, y1, z1] with each pair sorted. */
const norm = ([a, b, c, d, e, f]) => [Math.min(a, d), Math.min(b, e), Math.min(c, f), Math.max(a, d), Math.max(b, e), Math.max(c, f)];
/** A north/south face runs along x; an east/west face runs along z. */
const alongAxis = (face) => (face === "north" || face === "south" ? "x" : "z");
/** The cell at position `along` on a wall at `plane` (z for north/south faces, x for east/west), at height y. */
const cellAt = (face, along, y, plane) => (alongAxis(face) === "x" ? [along, y, plane] : [plane, y, along]);
/** Inclusive perimeter cells of the rectangle [x0, z0]..[x1, z1], duplicates removed. */
function ringCells(x0, z0, x1, z1) {
  const out = [];
  for (let x = x0; x <= x1; x++) out.push([x, z0], [x, z1]);
  for (let z = z0 + 1; z <= z1 - 1; z++) out.push([x0, z], [x1, z]);
  return [...new Map(out.map((c) => [c.join(), c])).values()];
}

/**
 * Place one block in a footprint. spec: a block id, or [block, state] / [block, state, nbt] as the B helpers return.
 * Returns 1 when placed, 0 when refused (a solid cell and no over).
 */
function put(g, fp, x, y, z, spec, { over = false } = {}) {
  const [a, b, c, d, e, f] = fp;
  if (x < a || x > d || y < b || y > e || z < c || z > f) throw new Error(`outside footprint [${fp}]: ${x},${y},${z}`);
  if (!over && !g.isAir(x, y, z)) {
    (g.refused ??= []).push([x, y, z, typeof spec === "string" ? spec : spec[0]]);
    return 0;
  }
  const [block, state, nbt] = typeof spec === "string" ? [spec] : spec;
  g.set(x, y, z, block, state, nbt);
  return 1;
}

// ---- helpers ------------------------------------------------------------------------------------------------------

/**
 * A 1-thick wall: `box` is its footprint, thin along the axis that the face points along (z for north/south, x for
 * east/west). Base course y0 is the plinth; in the castle, polished granite fills runs of three about one cell in
 * twelve (deterministic, so re-running gives the same wall).
 */
export function ashlarWall(g, box, face, kit = "castle", opts = {}) {
  const k = KIT[kit];
  if (!k) throw new Error(`ashlarWall: unknown kit ${kit}`);
  const [x0, y0, z0, x1, y1, z1] = norm(box);
  const thickness = alongAxis(face) === "x" ? z1 - z0 : x1 - x0;
  if (thickness !== 0) throw new Error(`ashlarWall: box is ${thickness + 1} thick; a ${face} wall is 1 thick`);
  const fp = [x0, y0, z0, x1, y1, z1];
  let n = 0;
  for (let x = x0; x <= x1; x++)
    for (let y = y0; y <= y1; y++)
      for (let z = z0; z <= z1; z++) {
        const along = alongAxis(face) === "x" ? x : z;
        let block = k.body;
        if (y === y0) block = k.plinth;
        else if (k.granite && (Math.floor(along / 3) * 5 + y * 7) % 12 === 0) block = "polished_granite";
        n += put(g, fp, x, y, z, block, opts);
      }
  return n;
}

/**
 * A round-arched opening `width` cells wide (>= 2), from (x, y, z) on a wall with outward face `face`. Clears the
 * opening (3 high, y..y+2), upside-down stairs at the two ends of the arch course (y+3) facing in, and a keystone
 * course of the kit's trim above (y+4). Needs over: true to cut a built wall.
 */
export function roundArch(g, x, y, z, width, face, kit = "castle", opts = {}) {
  if (width < 2) throw new Error(`roundArch: width ${width} < 2`);
  const k = KIT[kit];
  if (!k) throw new Error(`roundArch: unknown kit ${kit}`);
  const ax = alongAxis(face);
  const a0 = ax === "x" ? x : z, plane = ax === "x" ? z : x, a1 = a0 + width - 1;
  const fp = ax === "x" ? [a0, y, plane, a1, y + 4, plane] : [plane, y, a0, plane, y + 4, a1];
  const plus = ax === "x" ? "east" : "south", minus = ax === "x" ? "west" : "north";
  let n = 0;
  for (let a = a0; a <= a1; a++) {
    for (let dy = 0; dy <= 2; dy++) n += put(g, fp, ...cellAt(face, a, y + dy, plane), "minecraft:air", opts);
    n += put(g, fp, ...cellAt(face, a, y + 4, plane), k.trim, opts);
  }
  n += put(g, fp, ...cellAt(face, a0, y + 3, plane), B.stairs(k.stair, plus, "top"), opts);
  n += put(g, fp, ...cellAt(face, a1, y + 3, plane), B.stairs(k.stair, minus, "top"), opts);
  return n;
}

/**
 * The triangle infill of a gable wall: `box` is the wall (thin along x or z; the triangle spans the other axis), from
 * eave row y0 (full width) up to y1, each row inset one cell per side (pitch 1:1). Air only unless over.
 */
export function gableEnd(g, box, y0, y1, material, opts = {}) {
  const [x0, , z0, x1, , z1] = norm(box);
  const xThin = x0 === x1, zThin = z0 === z1;
  if (xThin === zThin) throw new Error("gableEnd: box must be 1 thick along x or z");
  const fp = [x0, y0, z0, x1, y1, z1];
  let n = 0;
  for (let y = y0; y <= y1; y++) {
    const k = y - y0;
    if (xThin) for (let z = z0 + k; z <= z1 - k; z++) n += put(g, fp, x0, y, z, material, opts);
    else for (let x = x0 + k; x <= x1 - k; x++) n += put(g, fp, x, y, z0, material, opts);
  }
  return n;
}

/**
 * A parapet on the perimeter of rect [x0, z0, x1, z1] at height y. style "crenel": a red nether brick course at y,
 * merlons (red_nether_brick_wall) on every other ring cell at y+1, and an upside-down corbel under each side cell at
 * y-1 (it lands where the wall stops, so the corbel reads proud). style "ring": a wall ring at y with polished granite
 * corner posts at y and y+1 (T3). Air only unless over.
 */
export function battlements(g, rect, y, style = "crenel", opts = {}) {
  const [x0, z0, x1, z1] = rect;
  const fp = [x0, y - 1, z0, x1, y + 1, z1];
  const wall = ["red_nether_brick_wall", { up: "true" }];
  let n = 0;
  for (const [x, z] of ringCells(x0, z0, x1, z1)) {
    const corner = (x === x0 || x === x1) && (z === z0 || z === z1);
    if (style === "ring") {
      if (corner) n += put(g, fp, x, y, z, "polished_granite", opts) + put(g, fp, x, y + 1, z, "polished_granite", opts);
      else n += put(g, fp, x, y, z, wall, opts);
    } else {
      n += put(g, fp, x, y, z, "red_nether_bricks", opts);
      if ((x + z) % 2 === 0) n += put(g, fp, x, y + 1, z, wall, opts);
      if (!corner) {
        const inward = z === z0 ? "south" : z === z1 ? "north" : x === x0 ? "east" : "west";
        n += put(g, fp, x, y - 1, z, B.stairs("red_nether_brick", inward, "top"), opts);
      }
    }
  }
  return n;
}

/** A single ochre froglight flush at ground level (y0) in a lawn strip. */
export function uplight(g, x, z, opts = {}) {
  return put(g, [x, 0, z, x, 0, z], x, 0, z, ["ochre_froglight", { axis: "y" }], opts);
}

/**
 * The A&I arched window: `a0..a1` along the wall (x for north/south faces, z for east/west), `y0..y1` high, on the
 * plane `plane` (z or x). Gray glass panes, brick stairs as the voussoirs at the top corners, an orange terracotta
 * course above, and the middle columns of plain glass as the door from y1 (ground) to y0-2. Needs over: true.
 */
export function bigArch(g, a0, a1, y0, y1, plane, face, opts = {}) {
  const k = KIT.ai;
  const ax = alongAxis(face);
  const fp = ax === "x" ? [a0, 1, plane, a1, y1 + 1, plane] : [plane, 1, a0, plane, y1 + 1, a1];
  const plus = ax === "x" ? "east" : "south", minus = ax === "x" ? "west" : "north";
  const pane = ax === "x" ? { east: "true", west: "true", north: "false", south: "false" } : { north: "true", south: "true", east: "false", west: "false" };
  const glass = ["gray_stained_glass_pane", pane];
  let n = 0;
  for (let a = a0; a <= a1; a++) {
    for (let y = y0; y <= y1; y++) {
      if (y === y1 && (a === a0 || a === a1)) continue;
      n += put(g, fp, ...cellAt(face, a, y, plane), glass, opts);
    }
    n += put(g, fp, ...cellAt(face, a, y1 + 1, plane), k.trim, opts);
  }
  n += put(g, fp, ...cellAt(face, a0, y1, plane), B.stairs(k.stair, plus, "bottom"), opts);
  n += put(g, fp, ...cellAt(face, a1, y1, plane), B.stairs(k.stair, minus, "bottom"), opts);
  for (let a = a0 + 1; a <= a1 - 1; a++)
    for (let y = 1; y <= y0 - 2; y++) n += put(g, fp, ...cellAt(face, a, y, plane), ["glass_pane", pane], opts);
  return n;
}

/**
 * A Freer cornice at height y: polished diorite on the perimeter of `box` (the body's outer face), a smooth stone
 * slab (top half) proud 1 all round it. opts.court: the open court [x0, z0, x1, z1] inside the box, which gets the same
 * course on its edge and a slab proud into the court. Air only unless over.
 */
export function cornice(g, box, y, opts = {}) {
  const { court = null, ...rest } = opts;
  const [x0, z0, x1, z1] = box;
  const fp = [x0 - 1, y, z0 - 1, x1 + 1, y, z1 + 1];
  const cap = B.slab("smooth_stone", "top");
  let n = 0;
  for (const [x, z] of ringCells(x0, z0, x1, z1)) n += put(g, fp, x, y, z, "polished_diorite", rest);
  for (const [x, z] of ringCells(x0 - 1, z0 - 1, x1 + 1, z1 + 1)) n += put(g, fp, x, y, z, cap, rest);
  if (court) {
    const [cx0, cz0, cx1, cz1] = court;
    for (const [x, z] of ringCells(cx0, cz0, cx1, cz1)) n += put(g, fp, x, y, z, "polished_diorite", rest);
    for (const [x, z] of ringCells(cx0 + 1, cz0 + 1, cx1 - 1, cz1 - 1)) n += put(g, fp, x, y, z, cap, rest);
  }
  return n;
}

/** A court tree at (x, z): oak log trunk y0..y2 (axis y), a 3x3 crown of persistent oak leaves at y3 and y4. */
export function courtTree(g, x, z, opts = {}) {
  const fp = [x - 1, 0, z - 1, x + 1, 4, z + 1];
  let n = 0;
  for (let y = 0; y <= 2; y++) n += put(g, fp, x, y, z, B.log("oak", "y"), opts);
  for (let y = 3; y <= 4; y++)
    for (let dx = -1; dx <= 1; dx++)
      for (let dz = -1; dz <= 1; dz++) n += put(g, fp, x + dx, y, z + dz, ["oak_leaves", { distance: "7", persistent: "true" }], opts);
  return n;
}

/**
 * Ochre froglights in a soffit at height opts.y (default 3) on the ring of radius r about (cx, cz): every opts.step-th
 * ring cell in angular order (default 4). Needs over: true where the drum's course is already built.
 */
export function soffitLight(g, cx, cz, r, opts = {}) {
  const { y = 3, step = 4, ...rest } = opts;
  const ring = [];
  for (let dx = -r - 1; dx <= r + 1; dx++)
    for (let dz = -r - 1; dz <= r + 1; dz++) if (Math.abs(Math.hypot(dx, dz) - r) <= 0.5) ring.push([cx + dx, cz + dz, Math.atan2(dz, dx)]);
  ring.sort((p, q) => p[2] - q[2]);
  const fp = [cx - r - 1, y, cz - r - 1, cx + r + 1, y, cz + r + 1];
  let n = 0;
  ring.forEach(([x, z], i) => { if (i % step === 0) n += put(g, fp, x, y, z, ["ochre_froglight", { axis: "y" }], rest); });
  return n;
}
