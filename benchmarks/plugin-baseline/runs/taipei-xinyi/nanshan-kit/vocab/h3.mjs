// Plan helpers (plan.md VOCABULARY, third batch). Each takes its position as arguments and writes only inside the
// footprint it is given. Writes go only into air unless opts.over names a block that may be replaced; a cell that
// is taken is skipped, and the helper returns how many blocks it placed.
// Boxes are [x0, y0, z0, x1, y1, z1] (inclusive); footprints that are flat use [x0, z0, x1, z1].
// `face` is the outward side of a wall: north = low z, south = high z, west = low x, east = high x.
import { B, DIRS, OPPOSITE } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// One write per cell: air only (or a block named in opts.over). A cell outside the grid throws: fail loud.
function placer(g, over = []) {
  const allowed = new Set(over.map((n) => (n.includes(":") ? n : `minecraft:${n}`)));
  return (x, y, z, block) => {
    if (!g.inBounds(x, y, z)) throw new RangeError(`cell ${x},${y},${z} is outside the ${g.size} grid`);
    if (!g.isAir(x, y, z) && !allowed.has(g.blockAt(x, y, z))) return 0;
    const [id, state] = Array.isArray(block) ? block : [block];
    g.set(x, y, z, id, state);
    return 1;
  };
}

const mod = (a, n) => ((a % n) + n) % n;

// The cell `depth` in from the outer plane of `face`, at `u` along that face (u = 0 at the box's low end), height y.
function onFace([x0, , z0, x1, , z1], face, u, y, depth) {
  switch (face) {
    case "north": return [x0 + u, y, z0 + depth];
    case "south": return [x0 + u, y, z1 - depth];
    case "west": return [x0 + depth, y, z0 + u];
    case "east": return [x1 - depth, y, z0 + u];
    default: throw new RangeError(`face must be north, south, east or west, got ${face}`);
  }
}

// How many cells run along a face (x for north/south, z for east/west).
const faceSpan = ([x0, , z0, x1, , z1], face) => (face === "north" || face === "south" ? x1 - x0 + 1 : z1 - z0 + 1);

/**
 * Chamfer one shaft corner. Cells with dx+dz < 6 are left as air (the chamfer). Cells with dx+dz = 6 get a smooth_quartz
 * fin; the glass one cell diagonally in, at (dx+1, dz+1), is gray_stained_glass, black on every 4th floor band.
 * corner = { x, z, sx, sz }: the corner cell, and the step (+1 or -1 on each axis) that points into the shaft.
 */
export function chamferCorner(g, { x, z, sx, sz }, y0, y1, opts = {}) {
  const put = placer(g, opts.over);
  let n = 0;
  for (let y = y0; y <= y1; y++) {
    const glass = mod(y - y0, 28) < 7 ? "black_stained_glass" : "gray_stained_glass";
    for (let i = 0; i <= 6; i++) {
      const j = 6 - i;
      n += put(x + sx * i, y, z + sz * j, "smooth_quartz");
      n += put(x + sx * (i + 1), y, z + sz * (j + 1), glass);
    }
  }
  return n;
}

/**
 * A door bay: two doors (lower and upper halves, facing out, hinges alternate) across w cells, a glass transom above
 * them up to the lintel, quartz_pillar jambs and a smooth_quartz lintel. at = the low-end floor cell of the opening;
 * face = the outward side. The opening itself must already be air (the shell recesses it).
 */
export function doorBay(g, at, face, w = 2, h = 3, wood = "birch", opts = {}) {
  if (h < 2) throw new RangeError("doorBay needs h >= 2 (two door halves)");
  const put = placer(g, opts.over);
  const [x, y, z] = at;
  const [ax, az] = face === "north" || face === "south" ? [1, 0] : [0, 1];   // step along the wall
  const cell = (u, dy) => [x + ax * u, y + dy, z + az * u];
  let n = 0;
  for (let u = 0; u < w; u++) {
    const hinge = u % 2 === 0 ? "left" : "right";
    n += put(...cell(u, 0), B.door(wood, face, "lower", hinge));
    n += put(...cell(u, 1), B.door(wood, face, "upper", hinge));
    for (let dy = 2; dy < h; dy++) n += put(...cell(u, dy), "glass");
  }
  for (let dy = 0; dy < h; dy++) for (const u of [-1, w]) n += put(...cell(u, dy), B.pillar("quartz_pillar", "y"));
  for (let u = -1; u <= w; u++) n += put(...cell(u, h), "smooth_quartz");
  return n;
}

/**
 * Crown glow: pearlescent_froglight one cell inside each fin in the roof-slab row slabY, and ochre_froglight one cell
 * inside every third fin at slabY + 1. fins = [{ x, z, face }], face = the outward side the fin stands on. The roof
 * slab is placed earlier, so pass opts.over = ["gray_concrete"] to light through it.
 */
export function crownGlow(g, fins, slabY, opts = {}) {
  const put = placer(g, opts.over);
  let n = 0;
  fins.forEach(({ x, z, face }, k) => {
    const [dx, , dz] = DIRS[OPPOSITE[face]];
    n += put(x + dx, slabY, z + dz, "pearlescent_froglight");
    if (k % 3 === 0) n += put(x + dx, slabY + 1, z + dz, "ochre_froglight");
  });
  return n;
}

/**
 * Gold perforated screen on one face of a mass. The face plane is yellow_terracotta with an open birch_trapdoor
 * diamond lattice (period 4, offset by latticeOffset) and gold_block studs at the nodes. One cell in is glass
 * (opts.glass, default "glass"); on every 4th bay a warm ochre_froglight sits two cells in.
 * box = the mass [x0, y0, z0, x1, y1, z1]; face = the outward side the screen sits on.
 */
export function goldScreen(g, box, face, latticeOffset = 0, opts = {}) {
  const put = placer(g, opts.over);
  const [, y0, , , y1] = box;
  const glass = opts.glass ?? "glass";
  const span = faceSpan(box, face);
  let n = 0;
  for (let y = y0; y <= y1; y++) for (let u = 0; u < span; u++) {
    const d1 = mod(u + (y - y0) - latticeOffset, 4) === 0;
    const d2 = mod(u - (y - y0) - latticeOffset, 4) === 0;
    const plane = d1 && d2 ? "gold_block" : d1 || d2 ? B.trapdoor("birch", face, "bottom", true) : "yellow_terracotta";
    n += put(...onFace(box, face, u, y, 0), plane);
    // A lattice shutter needs a solid wall behind it: yellow_terracotta there, glass everywhere else (fit: floating shutter).
    n += put(...onFace(box, face, u, y, 1), d1 !== d2 ? "yellow_terracotta" : glass);
    if (mod(Math.floor(u / 4) + Math.floor((y - y0) / 4), 4) === 0) n += put(...onFace(box, face, u, y, 2), "ochre_froglight");
  }
  return n;
}

/**
 * Dark glass box on the four walls of a glazed volume box = [x0, y0, z0, x1, y1, z1]: black_stained_glass field,
 * gray_concrete mullions every 3 (corners are mullions), smooth_stone bands at y0 + 4 and y0 + 8, and a smooth_stone
 * coping ring over the top opts.coping rows (default 2). About one bay in five is lit warm (ochre_froglight) one cell
 * inside the glass.
 */
export function darkGlassBox(g, box, opts = {}) {
  const put = placer(g, opts.over);
  const [x0, y0, z0, x1, y1, z1] = box;
  const bands = opts.bands ?? [4, 8];   // rows above y0
  const coping = opts.coping ?? 2;
  let n = 0;
  for (let y = y0; y <= y1 + coping; y++) for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    if (!(x === x0 || x === x1 || z === z0 || z === z1)) continue;   // the wall ring only
    if (y > y1) { n += put(x, y, z, "smooth_stone"); continue; }
    if (bands.includes(y - y0)) { n += put(x, y, z, "smooth_stone"); continue; }
    const u = x === x0 || x === x1 ? z - z0 : x - x0;   // position along the wall
    if (u % 3 === 0) { n += put(x, y, z, "gray_concrete"); continue; }
    n += put(x, y, z, "black_stained_glass");
    if (mod(Math.floor(u / 3) + (y - y0), 5) === 0) {
      const ix = x === x0 ? x + 1 : x === x1 ? x - 1 : x;
      const iz = z === z0 ? z + 1 : z === z1 ? z - 1 : z;
      n += put(ix, y, iz, "ochre_froglight");
    }
  }
  return n;
}

/**
 * A 2x2 planter on a deck: moss_block soil in the deck-level cells at [x, y, z], and on the row above a checker of
 * flowering_azalea and persistent oak_leaves. (The plan's smooth_stone ring does not fit a 2x2 footprint, so it is left out.)
 */
export function planter(g, [x, y, z], opts = {}) {
  const put = placer(g, opts.over);
  let n = 0;
  for (let dx = 0; dx < 2; dx++) for (let dz = 0; dz < 2; dz++) {
    n += put(x + dx, y, z + dz, "moss_block");
    const plant = (dx + dz) % 2 === 0 ? "flowering_azalea" : ["oak_leaves", { persistent: "true" }];
    n += put(x + dx, y + 1, z + dz, plant);
  }
  return n;
}

/**
 * Atrium glass roof on the row y over the footprint [x0, z0, x1, z1]: iron_block ribs every 6 (and on the edges),
 * light_gray_stained_glass between, and a sea_lantern one row below at each bay centre.
 */
export function atriumRoof(g, [x0, z0, x1, z1], y, opts = {}) {
  const put = placer(g, opts.over);
  let n = 0;
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    const rib = (x - x0) % 6 === 0 || (z - z0) % 6 === 0 || x === x1 || z === z1;
    n += put(x, y, z, rib ? "iron_block" : "light_gray_stained_glass");
    if ((x - x0) % 6 === 3 && (z - z0) % 6 === 3) n += put(x, y - 1, z, "sea_lantern");
  }
  return n;
}

/**
 * A podium face on the plane of `face` of the mass box = [x0, y0, z0, x1, y1, z1]. Piers every 6 cells stand on the
 * plane; glass sits one cell behind them, with smooth_stone bands every 5 rows in the glass plane (so the piers stand
 * proud). The bottom row is a plinth and the top row a coping. opts.pierEvery, opts.bandEvery and opts.mats override
 * the defaults: pier, cap, plinth, band, glass.
 */
export function podiumFace(g, box, face, opts = {}) {
  const put = placer(g, opts.over);
  const [, y0, , , y1] = box;
  const span = faceSpan(box, face);
  const pierEvery = opts.pierEvery ?? 6, bandEvery = opts.bandEvery ?? 5;
  const m = { pier: "polished_diorite", cap: "polished_diorite", plinth: "polished_andesite", band: "smooth_stone",
    glass: "light_gray_stained_glass", ...opts.mats };
  let n = 0;
  for (let y = y0; y <= y1; y++) for (let u = 0; u < span; u++) {
    const plane = (block) => put(...onFace(box, face, u, y, 0), block);
    if (y === y1) n += plane(m.cap);
    else if (u % pierEvery === 0) n += plane(m.pier);
    else if (y === y0) n += plane(m.plinth);
    else if ((y - y0) % bandEvery === 0) n += put(...onFace(box, face, u, y, 1), m.band);
    else n += put(...onFace(box, face, u, y, 1), m.glass);
  }
  return n;
}

/**
 * Taper setback at row y: the old footprint [x0, z0, x1, z1] steps in by 1 on every side above this row, so its outline
 * is capped with smooth_quartz_slab (bottom) on the row above the rib tops. The caller builds the new, smaller ribs.
 * (Rounded corners are not handled: the cap is the flat outline.)
 */
export function taperStep(g, y, [x0, z0, x1, z1], opts = {}) {
  const put = placer(g, opts.over);
  let n = 0;
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    if (x === x0 || x === x1 || z === z0 || z === z1) n += put(x, y, z, B.slab("smooth_quartz", "bottom"));
  }
  return n;
}

/**
 * Observatory-style mast on a centre column: iron_block 3x3 base for 4 rows, a 1x1 iron_block column for 7 more,
 * end_rod rungs at the 2nd and 5th rows of the column on the four sides, and a lightning_rod on top.
 * centre = [cx, y0, cz] for the base's lowest cell; the rod sits at y0 + 11 (the plan's 396 when y0 = 385).
 */
export function mast(g, [cx, y0, cz], opts = {}) {
  const put = placer(g, opts.over);
  let n = 0;
  for (let x = cx - 1; x <= cx + 1; x++) for (let z = cz - 1; z <= cz + 1; z++) for (let y = y0; y <= y0 + 3; y++) {
    n += put(x, y, z, "iron_block");
  }
  for (let y = y0 + 4; y <= y0 + 10; y++) n += put(cx, y, cz, "iron_block");
  for (const y of [y0 + 4, y0 + 7]) {
    for (const [dx, dz, facing] of [[1, 0, "east"], [-1, 0, "west"], [0, 1, "south"], [0, -1, "north"]]) {
      n += put(cx + dx, y, cz + dz, ["end_rod", { facing }]);
    }
  }
  n += put(cx, y0 + 11, cz, ["lightning_rod", { facing: "up" }]);
  return n;
}
