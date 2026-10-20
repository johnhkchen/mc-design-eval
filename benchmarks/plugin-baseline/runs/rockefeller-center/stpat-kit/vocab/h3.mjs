// Vocabulary helpers from plan.md's VOCABULARY: string_course, portal_arch, pinnacle, crocket, rose_window,
// gable_roof_z, fleche, roof_light, tree. Each takes the grid first, then the position and facing the plan gives, then
// an optional opts object, and returns how many blocks it wrote.
// Every write stays inside the footprint the helper was given and goes only into air (opts.overwrite: true replaces
// blocks instead), so a helper never writes ground, floor or an earlier part's cells. Facings follow the toolkit: a
// stair's facing points at its full-height back, so a stair that drops toward the west has facing "east", and a string
// course on a west face has facing "east" (its backs against the wall).
import { B, DIRS, OPPOSITE } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// ---- vectors and writers ----------------------------------------------------------------------------------------------
const add = (...vs) => vs.reduce((s, v) => s.map((x, i) => x + v[i]), [0, 0, 0]);
const mul = (k, v) => v.map((x) => x * k);
const alongOf = (face) => (face === "east" || face === "west" ? DIRS.south : DIRS.east);   // a wall's horizontal axis
const into = (face) => DIRS[OPPOSITE[face]];                                                 // from the face into the wall
const NAME = { "1,0,0": "east", "-1,0,0": "west", "0,0,1": "south", "0,0,-1": "north" };
const facingOf = (v) => NAME[v.join(",")];

/** A footprint [a, b] (inclusive corners). fp.put(p, block, state) writes into air inside it; fp.n counts the writes. */
function footprint(g, a, b, opts = {}) {
  const lo = a.map((v, i) => Math.min(v, b[i])), hi = a.map((v, i) => Math.max(v, b[i]));
  const fp = {
    n: 0,
    put(p, block, state) {
      if (!p.every((v, i) => v >= lo[i] && v <= hi[i])) return false;
      if (!opts.overwrite && !g.isAir(...p)) return false;
      g.set(p[0], p[1], p[2], block, state);
      fp.n++;
      return true;
    },
  };
  return fp;
}

// ---- string_course ----------------------------------------------------------------------------------------------------
/** Upside-down polished_diorite stairs over the box at height y, 1 proud of the face; the lips point out to `face`. */
export function string_course(g, x0, z0, x1, z1, y, face, opts = {}) {
  const fp = footprint(g, [x0, y, z0], [x1, y, z1], opts);
  for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++)
    for (let z = Math.min(z0, z1); z <= Math.max(z0, z1); z++)
      fp.put([x, y, z], ...B.stairs("polished_diorite", OPPOSITE[face], "top"));
  return fp.n;
}

// ---- portal_arch ------------------------------------------------------------------------------------------------------
/** One pointed head over an opening of width w (odd), as upside-down stairs meeting at a polished_diorite keystone. */
function pointedHead(put, c, face, w) {
  const al = alongOf(face), half = (w - 1) / 2, toward = facingOf(al), away = OPPOSITE[toward];
  for (let r = 0; r < half; r++)
    for (const s of [-1, 1]) put(add(c, mul(s * (half - r), al), [0, r, 0]), ...B.stairs("polished_diorite", s < 0 ? toward : away, "top"));
  put(add(c, [0, half, 0]), "polished_diorite");
}

/**
 * Layered portal. c = [x, y, z] is the centre of the opening's bottom row on the outer face; `face` is the way it
 * faces out. `orders` pointed arches sit one cell deeper each, the outer ones wider; the opening is `w` wide and `h`
 * tall; copper door pairs stand one cell behind the innermost order with a polished_diorite trumeau at the centre.
 */
export function portal_arch(g, c, face, orders = 2, w = 5, h = 8, opts = {}) {
  const inward = into(face), al = alongOf(face), half = (w - 1) / 2, reach = half + orders - 1;
  const at = (depth, a, row) => add(c, mul(depth, inward), mul(a, al), [0, row, 0]);
  const fp = footprint(g, at(0, -reach, 0), at(orders, reach, h + reach), opts);
  for (let k = 0; k < orders; k++) {
    const hk = half + (orders - 1 - k);
    for (let row = 0; row < h; row++) for (const s of [-hk, hk]) fp.put(at(k, s, row), "polished_diorite");
    pointedHead(fp.put, at(k, 0, h), face, 2 * hk + 1);
  }
  const door = B.door("waxed_exposed_copper", face, "lower", "left"), upper = B.door("waxed_exposed_copper", face, "upper", "left");
  for (let a = -half; a <= half; a++) {
    if (a === 0) { fp.put(at(orders, 0, 0), "polished_diorite"); fp.put(at(orders, 0, 1), "polished_diorite"); continue; }
    fp.put(at(orders, a, 0), ...door);
    fp.put(at(orders, a, 1), ...upper);
  }
  return fp.n;
}

// ---- crocket and pinnacle ---------------------------------------------------------------------------------------------
/** One smooth_quartz crocket at (x, y, z), projecting out to `face`, its back against the shaft. */
export function crocket(g, x, y, z, face, opts = {}) {
  const fp = footprint(g, [x, y, z], [x, y, z], opts);
  fp.put([x, y, z], ...B.stairs("smooth_quartz", OPPOSITE[face], "bottom"));
  return fp.n;
}

/** Pinnacle: diorite_wall shaft from y up h cells, crockets on all four sides every second course, end_rod tip at y + h. */
export function pinnacle(g, x, y, z, h, opts = {}) {
  const fp = footprint(g, [x - 1, y, z - 1], [x + 1, y + h, z + 1], opts);
  for (let dy = 0; dy < h; dy++) fp.put([x, y + dy, z], "diorite_wall", { up: "true" });
  for (let dy = 1; dy < h; dy += 2)
    for (const out of ["north", "south", "east", "west"]) fp.n += crocket(g, x + DIRS[out][0], y + dy, z + DIRS[out][2], out, opts);
  fp.put([x, y + h, z], "end_rod", { facing: "up" });
  return fp.n;
}

// ---- rose_window ------------------------------------------------------------------------------------------------------
/**
 * Rose of radius r (diameter 2r+1) in the plane through c, facing `face`: a polished_diorite ring, eight diorite_wall
 * spokes and a hub, and stained glass blocks between the spokes in colour sectors, with an ochre_froglight behind each.
 */
export function rose_window(g, c, face, r = 4, opts = {}) {
  const al = alongOf(face), inward = into(face);
  const pos = (depth, u, v) => add(c, mul(depth, inward), mul(u, al), [0, v, 0]);
  const fp = footprint(g, pos(0, -r, -r), pos(1, r, r), opts);
  const GLASS = { blue: "blue_stained_glass", red: "red_stained_glass", purple: "purple_stained_glass", yellow: "yellow_stained_glass" };
  const SECTORS = ["blue", "red", "blue", "purple", "blue", "red", "blue", "yellow"];
  const RAYS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
  for (let v = -r; v <= r; v++) for (let u = -r; u <= r; u++) {
    const d = Math.hypot(u, v);
    if (d > r + 0.5) continue;
    if (d > r - 0.5) { fp.put(pos(0, u, v), "polished_diorite"); continue; }
    const onSpoke = u === 0 && v === 0 || RAYS.some(([su, sv]) => {
      const t = su !== 0 ? u / su : v / sv;
      return t > 0 && t <= r - 1 && u === t * su && v === t * sv;
    });
    if (onSpoke) { fp.put(pos(0, u, v), "diorite_wall", { up: "true" }); continue; }
    const sector = Math.floor((Math.atan2(v, u) + Math.PI) / (Math.PI / 4)) % 8;
    fp.put(pos(0, u, v), GLASS[SECTORS[sector]]);
    fp.put(pos(1, u, v), "ochre_froglight", { axis: "y" });
  }
  return fp.n;
}

// ---- gable_roof_z -----------------------------------------------------------------------------------------------------
/**
 * Gable roof over the plan box [x0, z0, x1, z1], ridge along z: 45-degree deepslate tile stairs rising from eaveY at
 * both x edges to the ridge, capped at ridgeY; 1 in 3x3 patch in cobbled deepslate; a copper slab ridge cap.
 */
export function gable_roof_z(g, [x0, z0, x1, z1], eaveY, ridgeY, opts = {}) {
  const fp = footprint(g, [x0, eaveY, z0], [x1, ridgeY + 1, z1], opts);
  const dmax = Math.floor((x1 - x0) / 2);
  const patchy = (x, z) => ((Math.imul(Math.floor(x / 3), 73856093) ^ Math.imul(Math.floor(z / 3), 19349663)) >>> 0) % 5 === 0;
  for (let x = x0; x <= x1; x++) {
    const d = Math.min(x - x0, x1 - x), course = Math.min(eaveY + d, ridgeY), apex = d === dmax;
    const facing = x - x0 < x1 - x ? "east" : "west";   // the slope rises toward the middle
    for (let z = z0; z <= z1; z++) {
      if (x - x0 === x1 - x) fp.put([x, course, z], ...B.slab("deepslate_tile", "bottom"));   // odd span: a slab peak
      else fp.put([x, course, z], ...B.stairs(patchy(x, z) ? "cobbled_deepslate" : "deepslate_tile", facing, "bottom"));
      if (apex) fp.put([x, course + 1, z], ...B.slab("waxed_oxidized_cut_copper", "bottom"));
    }
  }
  return fp.n;
}

// ---- fleche -----------------------------------------------------------------------------------------------------------
/**
 * Fleche on the 3x3 centred at [cx, y, cz] (y = the lantern floor, 42 in plan.md): an open copper grate lantern five
 * high with a hanging lantern, a copper stair roof on its top ring (y + 6), a 1-wide copper spire to y + 14, end rods.
 */
export function fleche(g, [cx, y, cz], opts = {}) {
  const fp = footprint(g, [cx - 1, y, cz - 1], [cx + 1, y + 16, cz + 1], opts);
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    fp.put([cx + dx, y, cz + dz], "waxed_oxidized_copper_grate");
    fp.put([cx + dx, y + 5, cz + dz], "waxed_oxidized_copper_grate");
    if (dx !== 0 && dz !== 0) for (let dy = 1; dy <= 4; dy++) fp.put([cx + dx, y + dy, cz + dz], "waxed_oxidized_copper_grate");
  }
  fp.put([cx, y + 4, cz], "lantern", { hanging: "true" });   // hangs from the grate ceiling, 3 clear cells below
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    if (dx === 0 && dz === 0) continue;
    const facing = dx !== 0 ? (dx < 0 ? "east" : "west") : (dz < 0 ? "south" : "north");   // toward the centre
    fp.put([cx + dx, y + 6, cz + dz], ...B.stairs("waxed_oxidized_cut_copper", facing, "bottom"));
  }
  for (let dy = 6; dy <= 14; dy++) fp.put([cx, y + dy, cz], "waxed_oxidized_cut_copper");
  for (let dy = 15; dy <= 16; dy++) fp.put([cx, y + dy, cz], "end_rod", { facing: "up" });
  return fp.n;
}

// ---- roof_light -------------------------------------------------------------------------------------------------------
/** Evenly spaced points along [lo, hi], at most 6 apart, so every cell is within 3 of one. */
function lattice(lo, hi) {
  const p = Math.min(lo, hi), len = Math.abs(hi - lo) + 1, n = Math.ceil(len / 6);
  return Array.from({ length: n }, (_, i) => p + Math.floor(((i + 0.5) * len) / n));
}

/**
 * Lanterns standing on a deck: deck top at a[1] (the corners a and b give the deck's plan), lanterns at a[1] + 1 on a
 * lattice at most 6 apart, so block light stays 8 or more on every cell of the deck.
 */
export function roof_light(g, a, b, opts = {}) {
  const y = a[1];
  const fp = footprint(g, [a[0], y + 1, a[2]], [b[0], y + 1, b[2]], opts);
  for (const x of lattice(a[0], b[0])) for (const z of lattice(a[2], b[2]))
    if (!g.isAir(x, y, z)) fp.put([x, y + 1, z], "lantern", { hanging: "false" });
  return fp.n;
}

// ---- tree -------------------------------------------------------------------------------------------------------------
/** Oak tree standing on the ground cell [x, y, z]: 5 logs, then a round persistent crown of radius 2 (a small cap on top). */
export function tree(g, x, y, z, opts = {}) {
  const fp = footprint(g, [x - 2, y + 1, z - 2], [x + 2, y + 6, z + 2], opts);
  for (let dy = 1; dy <= 5; dy++) fp.put([x, y + dy, z], ...B.log("oak", "y"));
  for (let dy = 3; dy <= 6; dy++) for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) {
    const d2 = dx * dx + dz * dz;
    if (dy < 6 ? d2 > 5 : d2 > 2) continue;
    fp.put([x + dx, y + dy, z + dz], "oak_leaves", { persistent: "true" });   // the trunk cells are not air: skipped
  }
  return fp.n;
}
