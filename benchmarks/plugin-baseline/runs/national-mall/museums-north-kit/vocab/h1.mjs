// Part-1 vocabulary from plan.md (VOCABULARY), for the three north-side museums: ashlarBay, balustrade, lanternCap,
// redTileHip, panelSlotWall, glassFront, porchCanopy, lampPost. Each takes its position (and face) as arguments and
// returns { cells, refused, bounds }: cells = every [x, y, z] it placed, refused = every write it held back.
// Writes stay inside the helper's bounds and go only into air; opts.over: true replaces what is there.
// Faces: the side the facade faces (south = +z, the Mall). "out" counts cells outward from the wall line (negative = in).
import { DIRS, roof } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const axisOf = (face) => {
  const d = DIRS[face];
  if (!d) throw new Error(`h1: unknown face ${face}`);
  return d[0] !== 0 ? 0 : 2;                                  // the axis the wall line runs across (x for E/W, z for N/S)
};
/** The cell at (along, out, y) of a wall whose outer line is `plane`. */
function cell(face, plane, along, out, y) {
  const d = DIRS[face], pa = axisOf(face), p = [0, y, 0];
  p[pa] = plane + d[pa] * out;
  p[pa === 0 ? 2 : 0] = along;
  return p;
}
/** Bounding box [lo, hi] of a wall-aligned span. */
function boxOf(face, plane, [a0, a1], [o0, o1], [y0, y1]) {
  const pts = [];
  for (const a of [a0, a1]) for (const o of [o0, o1]) for (const y of [y0, y1]) pts.push(cell(face, plane, a, o, y));
  const lo = [0, 1, 2].map((i) => Math.min(...pts.map((p) => p[i])));
  const hi = [0, 1, 2].map((i) => Math.max(...pts.map((p) => p[i])));
  return [lo, hi];
}
/** An (x, z) start cell on a face: the wall line from the face's axis, the run from the other. */
function wallLine(face, x, z) {
  return axisOf(face) === 2 ? { plane: z, along: x } : { plane: x, along: z };
}
/**
 * Every write goes through scope(): a cell outside bounds, or one that is not air (unless over), is refused and
 * reported, never thrown. g.set and g.fill are wrapped; everything else is the Grid's own method.
 */
function scope(g, [lo, hi], over = false) {
  const cells = [], refused = [];
  const inside = (x, y, z) => x >= lo[0] && x <= hi[0] && y >= lo[1] && y <= hi[1] && z >= lo[2] && z <= hi[2];
  const w = new Proxy(g, {
    get(t, p) {
      if (p === "set") return (x, y, z, block, state, nbt) => {
        if (inside(x, y, z) && (over || t.isAir(x, y, z))) { t.set(x, y, z, block, state, nbt); cells.push([x, y, z]); }
        else refused.push([x, y, z, block]);
        return w;
      };
      if (p === "fill") return (a, b, block, state) => {
        for (let x = Math.min(a[0], b[0]); x <= Math.max(a[0], b[0]); x++)
          for (let y = Math.min(a[1], b[1]); y <= Math.max(a[1], b[1]); y++)
            for (let z = Math.min(a[2], b[2]); z <= Math.max(a[2], b[2]); z++) w.set(x, y, z, block, state);
        return w;
      };
      const v = Reflect.get(t, p);
      return typeof v === "function" ? v.bind(t) : v;
    },
  });
  return { w, cells, refused };
}
const done = (s, bounds) => ({ cells: s.cells, refused: s.refused, bounds });

/**
 * One 4-cell bay of a facade, at the wall line through (x, z) facing `face`. Diorite plinth y1, stone bricks y2..3,
 * a smooth quartz string course y4 (proud by 1), calcite y5..10. The tall window slot is the bay's middle cell:
 * air from y2 to y9 (the ground and main openings), so the bay's window is left for glazing.
 */
export function ashlarBay(g, x, z, face, opts = {}) {
  const { plane, along } = wallLine(face, x, z);
  const bounds = boxOf(face, plane, [along, along + 3], [0, 1], [1, 10]);
  const s = scope(g, bounds, opts.over);
  const put = (a, o, y, block, state) => s.w.set(...cell(face, plane, a, o, y), block, state);
  const win = along + 2;
  for (let a = along; a <= along + 3; a++) {
    const slot = a === win;
    put(a, 0, 1, "polished_diorite");
    if (!slot) for (const y of [2, 3]) put(a, 0, y, "stone_bricks");
    for (const o of [0, 1]) put(a, o, 4, "smooth_quartz");
    for (let y = 5; y <= 10; y++) if (!slot || y === 10) put(a, 0, y, "calcite");
  }
  return done(s, bounds);
}

/**
 * A balustrade along x0..x1 at z: smooth quartz slab rail at y, diorite wall above it at y+1. A die (solid smooth
 * quartz, 2 high at y+1..y+2) stands every 4 cells from x0 (the pilaster bay lines), topped by a standing lantern at y+3.
 */
export function balustrade(g, x0, x1, z, y, opts = {}) {
  const lo = Math.min(x0, x1), hi = Math.max(x0, x1);
  const bounds = [[lo, y, z], [hi, y + 3, z]];
  const s = scope(g, bounds, opts.over);
  for (let x = lo; x <= hi; x++) {
    s.w.set(x, y, z, "smooth_quartz_slab", { type: "bottom" });
    if ((x - lo) % 4 === 0) {
      s.w.set(x, y + 1, z, "smooth_quartz");
      s.w.set(x, y + 2, z, "smooth_quartz");
      s.w.set(x, y + 3, z, "lantern", { hanging: "false" });
    } else {
      s.w.set(x, y + 1, z, "diorite_wall", { up: "false", east: "low", west: "low" });
    }
  }
  return done(s, bounds);
}

/**
 * A 3x3 lantern drum with its cap, on the drum course at y: glass on the ring, a lantern hanging in the middle from the
 * cap, a cut-copper slab cap at y+1, and a lightning rod on the cap at y+2. The footprint is x0..x0+2, z0..z0+2.
 */
export function lanternCap(g, x0, z0, y, opts = {}) {
  const bounds = [[x0, y, z0], [x0 + 2, y + 2, z0 + 2]];
  const s = scope(g, bounds, opts.over);
  for (let x = x0; x <= x0 + 2; x++) {
    for (let z = z0; z <= z0 + 2; z++) {
      s.w.set(x, y + 1, z, "oxidized_cut_copper_slab", { type: "bottom" });
      if (x === x0 + 1 && z === z0 + 1) s.w.set(x, y, z, "lantern", { hanging: "true" });
      else s.w.set(x, y, z, "glass");
    }
  }
  s.w.set(x0 + 1, y + 2, z0 + 1, "lightning_rod", { facing: "up", powered: "false" });
  return done(s, bounds);
}

/**
 * A hipped red-tile roof over the wall rectangle rect = [x0, z0, x1, z1]: eaves at course `eaves`, no overhang, slab
 * ridge, no grow, built by build.mjs roof(). `ridge` is the ridge height the plan expects; a different top is reported
 * in notes. opts.keep: boxes the roof must not touch (drum, pavilions). The bounds allow the hip to rise to half the
 * short side (at most one block a cell).
 */
export function redTileHip(g, rect, eaves, ridge, opts = {}) {
  const x0 = Math.min(rect[0], rect[2]), x1 = Math.max(rect[0], rect[2]);
  const z0 = Math.min(rect[1], rect[3]), z1 = Math.max(rect[1], rect[3]);
  const short = Math.min(x1 - x0, z1 - z0) + 1;
  const bounds = [[x0, eaves, z0], [x1, eaves + Math.ceil(short / 2) + 1, z1]];
  const s = scope(g, bounds, opts.over);
  const r = roof(s.w, [x0, z0, x1, z1], "hip", {
    y: eaves, material: "red-tile", pitch: opts.pitch ?? "half", overhang: 0, ridge: "slab", grow: false, keep: opts.keep ?? [],
  });
  const notes = [...(r.notes ?? [])];
  if (ridge != null && r.top !== ridge) notes.push(`redTileHip: ridge at y ${r.top}, plan says ${ridge}`);
  return { ...done(s, bounds), top: r.top, notes };
}

/**
 * A run of `length` cells of facade from (x, z) on `face`. Panels are white terracotta 3 wide with 1-wide window slots
 * between them: slots sit every 4 cells from the centre, and the first and last 3 cells are always panels (corners).
 * Each slot is air at the face, with a gray glass pane 1 cell inside it; every other slot has an ochre froglight 2 cells
 * inside, at mid-height. Rows y0..y1 (default 1..7).
 */
export function panelSlotWall(g, x, z, face, length, opts = {}) {
  const { plane, along } = wallLine(face, x, z);
  const last = along + length - 1;
  const y0 = opts.y0 ?? 1, y1 = opts.y1 ?? 7;
  const centre = opts.centre ?? along + Math.floor((length - 1) / 2);
  const bounds = boxOf(face, plane, [along, last], [-2, 0], [y0, y1]);
  const s = scope(g, bounds, opts.over);
  const put = (a, o, y, block, state) => s.w.set(...cell(face, plane, a, o, y), block, state);
  for (let a = along; a <= last; a++) {
    const k = (a - centre) / 4;
    const slot = Number.isInteger(k) && a - along >= 3 && last - a >= 3;
    for (let y = y0; y <= y1; y++) {
      if (!slot) put(a, 0, y, "white_terracotta");
      else put(a, -1, y, "gray_stained_glass_pane");
    }
    if (slot && k % 2 === 0) put(a, -2, Math.floor((y0 + y1) / 2), "ochre_froglight");
  }
  return done(s, bounds);
}

/**
 * The recessed glass entrance of a facade on the glass plane z (for `face`, default south), from x0 to x1: glass panes
 * y1..5 with white terracotta mullions every 4 cells (from x0, the ends too). Doors (opts.door, default x150..154) are
 * left as the air opening for the glazing part, at y1..2. A smooth quartz soffit at y6 runs 2 out, with an ochre
 * froglight every 4 cells on its outer row; white terracotta side returns sit at x0-1 and x1+1.
 */
export function glassFront(g, x0, x1, z, opts = {}) {
  const face = opts.face ?? "south", door = opts.door ?? [150, 154];
  const bounds = boxOf(face, z, [x0 - 1, x1 + 1], [0, 2], [1, 6]);
  const s = scope(g, bounds, opts.over);
  const put = (a, o, y, block, state) => s.w.set(...cell(face, z, a, o, y), block, state);
  for (let a = x0; a <= x1; a++) {
    const mullion = (a - x0) % 4 === 0, inDoor = a >= door[0] && a <= door[1];
    for (let y = 1; y <= 5; y++) if (!(inDoor && y <= 2)) put(a, 0, y, mullion ? "white_terracotta" : "glass_pane");
    put(a, 1, 6, "smooth_quartz");
    if (mullion) put(a, 2, 6, "ochre_froglight");
    else put(a, 2, 6, "smooth_quartz");
  }
  for (const a of [x0 - 1, x1 + 1]) for (let o = 0; o <= 2; o++) for (let y = 1; y <= 6; y++) put(a, o, y, "white_terracotta");
  return done(s, bounds);
}

/**
 * A flat canopy slab over x0..x1, z0..z1 at course y: smooth stone slab (top) deck, waxed cut copper on the edge rows
 * (x0, x1 and z1). Four slender polished deepslate wall posts stand under the front edge (z1) at x0, x0+4, x1-4, x1,
 * y-4..y-1. The canopy runs out from the building (z0) to the front (z1).
 */
export function porchCanopy(g, x0, z0, x1, z1, y, opts = {}) {
  const bounds = [[x0, y - 4, z0], [x1, y, z1]];
  const s = scope(g, bounds, opts.over);
  for (let x = x0; x <= x1; x++) {
    for (let z = z0; z <= z1; z++) {
      if (x === x0 || x === x1 || z === z1) s.w.set(x, y, z, "waxed_cut_copper");
      else s.w.set(x, y, z, "smooth_stone_slab", { type: "top" });
    }
  }
  for (const x of new Set([x0, x0 + 4, x1 - 4, x1])) {
    for (let py = y - 4; py <= y - 1; py++) s.w.set(x, py, z1, "polished_deepslate_wall", { up: "true" });
  }
  return done(s, bounds);
}

/** A lamp post at (x, y, z): two oak fence posts and a standing lantern on top (it stands on the fence, y+2). */
export function lampPost(g, x, y, z, opts = {}) {
  const bounds = [[x, y, z], [x, y + 2, z]];
  const s = scope(g, bounds, opts.over);
  s.w.set(x, y, z, "oak_fence");
  s.w.set(x, y + 1, z, "oak_fence");
  s.w.set(x, y + 2, z, "lantern", { hanging: "false" });
  return done(s, bounds);
}
