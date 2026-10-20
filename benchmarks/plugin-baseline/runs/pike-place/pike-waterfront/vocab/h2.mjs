// vocab/h2.mjs: nine pike-waterfront helpers from plan.md VOCABULARY: pilingRun, shedWindow, fishMural, aquariumSign,
// lampPost, hallBox, deckRail, loggia, terraceRail. Shared conventions:
//  - Positions are KIT-frame coordinates as plan.md writes them (the grid is the kit frame, no offset). Each helper
//    takes its position (and facing where it has one) as arguments, and returns { box, placed, skipped }.
//  - box = the footprint it may write (inclusive). Nothing is written outside it, so nothing goes below box[1].
//  - Air only: a cell that is not air is kept and listed in skipped (ground, floors, and walls an earlier part owns).
//    The one exception is shedWindow's { replace: "birch_planks" }, which cuts glazing into its own shed wall.
//  - Block ids are plan.md PALETTE literals (1.21.1). No leaves, doors or hanging lights in this set.
import { bannerWord } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const AIR = /(^|:)(cave_)?air$/;
const idOf = (b) => (b.includes(":") ? b : `minecraft:${b}`);

/** Inclusive box test: box = [x0, y0, z0, x1, y1, z1]. */
const inBox = (box) => (x, y, z) => x >= box[0] && x <= box[3] && y >= box[1] && y <= box[4] && z >= box[2] && z <= box[5];
/** The bounding box of a list of [x, y, z] cells. */
const bbox = (cells) => cells.reduce((b, [x, y, z]) => [Math.min(b[0], x), Math.min(b[1], y), Math.min(b[2], z),
  Math.max(b[3], x), Math.max(b[4], y), Math.max(b[5], z)], [Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity]);
/** A box test that also needs clip(x, z) true (the mass clipped to its plot's footprint). */
const within = (box, clip) => (clip ? (x, y, z) => inBox(box)(x, y, z) && clip(x, z) : inBox(box));

/** A writer for one helper's footprint: inside(x, y, z) says which cells it may write. Refusals are recorded, never thrown. */
function ctx(g, box, inside = inBox(box), replace = null) { return { g, box, inside, replace: replace && idOf(replace), placed: 0, skipped: [] }; }
function put(c, x, y, z, block, state, nbt) {
  const here = c.g.inBounds(x, y, z) ? c.g.blockAt(x, y, z) : null;
  const free = here !== null && (AIR.test(here) || (c.replace && here === c.replace));
  if (!free || !c.inside(x, y, z)) { c.skipped.push([x, y, z]); return false; }
  c.g.set(x, y, z, block, state, nbt);
  c.placed++;
  return true;
}
/** The grid's get/set, routed through the writer, for build-library helpers that draw through g.set. */
const view = (c) => ({ get: (x, y, z) => c.g.get(x, y, z), set: (x, y, z, block, state, nbt) => { put(c, x, y, z, block, state, nbt); } });
const done = (c) => ({ box: c.box, placed: c.placed, skipped: c.skipped });

/** Fence, pane and bar connections: a side is joined when the same kind of block stands on that side at this y. */
const link = (set, x, y, z) => ({ north: set.has(`${x},${y},${z - 1}`), east: set.has(`${x + 1},${y},${z}`),
  south: set.has(`${x},${y},${z + 1}`), west: set.has(`${x - 1},${y},${z}`) });
const key = (x, y, z) => `${x},${y},${z}`;

/** The outside ring of a rectangle [x0, z0, x1, z1]: a parapet course at y+1 and iron_bars on it at y+2. */
function parapet(c, [x0, z0, x1, z1], y, [course, courseState]) {
  const ring = [];
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) if (x === x0 || x === x1 || z === z0 || z === z1) ring.push([x, z]);
  const bars = new Set(ring.map(([x, z]) => key(x, y + 2, z)));
  for (const [x, z] of ring) put(c, x, y + 1, z, course, courseState);
  for (const [x, z] of ring) put(c, x, y + 2, z, "iron_bars", link(bars, x, y + 2, z));
}
/** A deck of smooth_stone over the whole rectangle at y, with the cut-sandstone slab parapet and iron rail on its edge. */
function deckWithRail(c, [x0, z0, x1, z1], y) {
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) put(c, x, y, z, "smooth_stone");
  parapet(c, [x0, z0, x1, z1], y, ["cut_sandstone_slab", { type: "bottom" }]);
}

/**
 * Pilings under the deck edge: cells = [[x, z], ...]. Each is a stripped_spruce_log column at y 0..2 with a
 * dark_oak_planks cap at y 3. Only air is written, so a pile that would stand in ground is kept out and listed.
 * The cap is air-only too: where the deck (laid first) already covers y 3, the deck stays as it is.
 */
export function pilingRun(g, cells) {
  const cols = new Set(cells.map(([x, z]) => `${x},${z}`));
  const box = bbox(cells.flatMap(([x, z]) => [[x, 0, z], [x, 3, z]]));
  const c = ctx(g, box, (x, y, z) => cols.has(`${x},${z}`));
  for (const [x, z] of cells) {
    for (let y = 0; y <= 2; y++) put(c, x, y, z, "stripped_spruce_log", { axis: "y" });
    put(c, x, 3, z, "dark_oak_planks");
  }
  return done(c);
}

// The shed's long walls as diagonal bands: [outer d, inner d, first d inside the shed]. d = x - z, s = x + z.
const SHED_BAND = { west: [-40, -39, -37], east: [-15, -14, -17] };
/**
 * A lit two-storey window in one long shed wall: wall = "west" | "east", s = the first of its 4 cells of s.
 * Glass panes at y 6..8 and y 12..14 in the wall's band, joined to each other; a shroomlight at y 7 and y 13, two
 * cells inside. Air only, so the wall must leave the opening; { replace: "birch_planks" } cuts it from the shed wall.
 */
export function shedWindow(g, wall, s, { replace = null } = {}) {
  const [da, db, dIn] = SHED_BAND[wall];
  // the band has one cell per s (s and d share a parity), so each s gives exactly one wall cell
  const bandCell = (sv) => { const d = ((sv + da) & 1) === 0 ? da : db; return [(sv + d) / 2, (sv - d) / 2]; };
  const mid = ((s + 1 + dIn) & 1) === 0 ? s + 1 : s + 2;
  const [mx, mz] = [(mid + dIn) / 2, (mid - dIn) / 2];
  const panes = [], lights = [];
  for (let sv = s; sv <= s + 3; sv++) {
    const [x, z] = bandCell(sv);
    for (const [y0, y1] of [[6, 8], [12, 14]]) for (let y = y0; y <= y1; y++) panes.push([x, y, z]);
  }
  for (const y of [7, 13]) lights.push([mx, y, mz]);
  const box = bbox([...panes, ...lights]);
  const planned = new Set([...panes, ...lights].map(([x, y, z]) => key(x, y, z)));
  const c = ctx(g, box, (x, y, z) => planned.has(key(x, y, z)), replace);
  const paneSet = new Set(panes.map(([x, y, z]) => key(x, y, z)));
  for (const [x, y, z] of panes) put(c, x, y, z, "glass_pane", link(paneSet, x, y, z));
  for (const [x, y, z] of lights) put(c, x, y, z, "shroomlight");
  return done(c);
}

// The shed's walls again: each mural column is the one wall cell at that s.
const MURAL_BAND = { east: [-15, -14], west: [-40, -39] };
/**
 * A flush sea-life mosaic in one long shed wall over s0..s1, y0..y1 (the reserved mural bays): blue_concrete ground,
 * two sine rows of cyan_terracotta and light_blue_terracotta, and a 3-block yellow_terracotta fish (white_concrete eye)
 * every 6 in s. Each s is one wall cell, painted from the top: the fish over the waves over the ground.
 */
export function fishMural(g, wall, s0, s1, y0, y1) {
  const band = MURAL_BAND[wall];
  const cellAt = (sv) => { const d = ((sv + band[0]) & 1) === 0 ? band[0] : band[1]; return [(sv + d) / 2, (sv - d) / 2]; };
  const mid = (y0 + y1) >> 1;
  const pic = new Map();                          // "s,y" -> block
  const k = (sv, y) => `${sv},${y}`;
  for (let sv = s0; sv <= s1; sv++) for (let y = y0; y <= y1; y++) pic.set(k(sv, y), "blue_concrete");
  for (let sv = s0; sv <= s1; sv++) {
    // two sine rows, half a period apart: the light-blue row shows only on the ground, not over the cyan row
    const cyan = mid - 1 + Math.round(Math.sin((sv * Math.PI) / 4));
    const light = mid + 1 + Math.round(Math.sin((sv * Math.PI) / 4 + Math.PI));
    pic.set(k(sv, cyan), "cyan_terracotta");
    if (pic.get(k(sv, light)) === "blue_concrete") pic.set(k(sv, light), "light_blue_terracotta");
  }
  for (let f = s0 + 3; f + 1 <= s1; f += 6) {     // a fish: tail, body, head with the eye
    pic.set(k(f - 1, mid), "yellow_terracotta");
    pic.set(k(f, mid), "yellow_terracotta");
    pic.set(k(f + 1, mid), "white_concrete");
  }
  const cells = [];
  for (let sv = s0; sv <= s1; sv++) { const [x, z] = cellAt(sv); for (let y = y0; y <= y1; y++) cells.push([x, y, z]); }
  const c = ctx(g, bbox(cells));
  for (let sv = s0; sv <= s1; sv++) {
    const [x, z] = cellAt(sv);
    for (let y = y0; y <= y1; y++) put(c, x, y, z, pic.get(k(sv, y)));
  }
  return done(c);
}

/**
 * The SEATTLE AQUARIUM sign on the pavilion's east face: a black_concrete board at x, y0..y0+2, z zc-8..zc+8, with
 * the banner letters white on blue, hung on the board facing east, in the cell in front of it (x+1, the middle row).
 */
export function aquariumSign(g, x, y0, zc) {
  const box = [x, y0, zc - 8, x + 1, y0 + 2, zc + 8];
  const c = ctx(g, box);
  for (let z = zc - 8; z <= zc + 8; z++) for (let y = y0; y <= y0 + 2; y++) put(c, x, y, z, "black_concrete");
  bannerWord(view(c), "SEATTLE AQUARIUM", { center: [x + 1, y0 + 1, zc], face: "east", letter: "white", base: "blue" });
  return done(c);
}

/** A lamp post standing on the ground at (x, y, z): three spruce_fence posts from y, and a lantern on top at y+3. */
export function lampPost(g, x, y, z) {
  const c = ctx(g, [x, y, z, x, y + 3, z]);
  const post = { north: false, east: false, south: false, west: false };
  for (let k = 0; k < 3; k++) put(c, x, y + k, z, "spruce_fence", post);
  put(c, x, y + 3, z, "lantern", { hanging: false });
  return done(c);
}

/**
 * A Bay Wing hall over the rectangle [x0, z0, x1, z1]: a stone_bricks plinth at floor, smooth_sandstone walls up to
 * top-2, a cut_sandstone string at top-1, a smooth_stone roof deck at top, and the parapet and rail above it. Only
 * the ring and the deck are written: the floor inside belongs to the ground. clip(x, z) keeps it inside its plot.
 */
export function hallBox(g, [x0, z0, x1, z1], floor, top, { clip } = {}) {
  const box = [x0, floor, z0, x1, top + 2, z1];
  const c = ctx(g, box, within(box, clip));
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    if (!(x === x0 || x === x1 || z === z0 || z === z1)) continue;
    put(c, x, floor, z, "stone_bricks");
    for (let y = floor + 1; y <= top - 2; y++) put(c, x, y, z, "smooth_sandstone");
    put(c, x, top - 1, z, "cut_sandstone");
  }
  deckWithRail(c, [x0, z0, x1, z1], top);
  return done(c);
}

/**
 * A viewing deck over [x0, z0, x1, z1] at y deckY: smooth_stone deck, a cut_sandstone_slab parapet at deckY+1 round
 * its edge, and iron_bars on the parapet at deckY+2. clip(x, z) keeps it inside its mass.
 */
export function deckRail(g, [x0, z0, x1, z1], deckY, { clip } = {}) {
  const box = [x0, deckY, z0, x1, deckY + 2, z1];
  const c = ctx(g, box, within(box, clip));
  deckWithRail(c, [x0, z0, x1, z1], deckY);
  return done(c);
}

// Loggia depth: 0 is the face plane (the open front, rail on it), 1 is the recess's back (glass against the wall at 2).
const OUT = { east: [1, 0], west: [-1, 0], north: [0, -1], south: [0, 1] };
/**
 * A 2-deep loggia recess in a facade: iron_bars rail across its front at y+1, and a glass_pane door pair against its
 * back wall at y+1..y+2 (two of the four cells along the run). The recess itself is air, left by not placing the face
 * material. face: "east" | "west" (the run goes along z) or "north" | "south" (along x). start = the first of the 4
 * cells along the run (z for east/west, x for north/south). plane = the face's own coordinate (x for east/west, z for
 * north/south). y = the balcony floor (not written).
 */
export function loggia(g, face, start, y, plane) {
  const [ox, oz] = OUT[face];
  // cell at depth d, along-run index a, height yy
  const at = (d, a, yy) => (ox ? [plane - d * ox, yy, start + a] : [start + a, yy, plane - d * oz]);
  const rail = [], doors = [];
  for (let a = 0; a < 4; a++) rail.push(at(0, a, y + 1));
  for (let a = 1; a <= 2; a++) for (const yy of [y + 1, y + 2]) doors.push(at(1, a, yy));
  const c = ctx(g, bbox([...rail, ...doors]));
  const railSet = new Set(rail.map(([x, yy, z]) => key(x, yy, z)));
  const doorSet = new Set(doors.map(([x, yy, z]) => key(x, yy, z)));
  for (const [x, yy, z] of rail) put(c, x, yy, z, "iron_bars", link(railSet, x, yy, z));
  for (const [x, yy, z] of doors) put(c, x, yy, z, "glass_pane", link(doorSet, x, yy, z));
  return done(c);
}

/**
 * A terrace or roof edge over [x0, z0, x1, z1] at roofY (the roof slab, not written): a 1-high smooth_sandstone parapet
 * with its coping on the ring at roofY+1, and iron_bars on it at roofY+2. penthouse, if given: { box: [x0, z0, x1, z1],
 * cap: y } caps the penthouse with a polished_deepslate slab at y, overhanging it by 1 on every side.
 */
export function terraceRail(g, [x0, z0, x1, z1], roofY, { clip, penthouse } = {}) {
  const box = [x0, roofY + 1, z0, x1, roofY + 2, z1];
  // the penthouse cap: [x0, y, z0, x1, y, z1] of the penthouse grown by 1 on every side
  const cap = penthouse ? [penthouse.box[0] - 1, penthouse.cap, penthouse.box[1] - 1, penthouse.box[2] + 1, penthouse.cap, penthouse.box[3] + 1] : null;
  const ringOk = within(box, clip);
  const outer = cap ? [Math.min(box[0], cap[0]), Math.min(box[1], cap[1]), Math.min(box[2], cap[2]),
    Math.max(box[3], cap[3]), Math.max(box[4], cap[4]), Math.max(box[5], cap[5])] : box;
  const c = ctx(g, outer, cap ? (x, y, z) => ringOk(x, y, z) || inBox(cap)(x, y, z) : ringOk);
  parapet(c, [x0, z0, x1, z1], roofY, ["smooth_sandstone", {}]);
  if (cap) for (let x = cap[0]; x <= cap[3]; x++) for (let z = cap[2]; z <= cap[5]; z++) put(c, x, cap[1], z, "polished_deepslate");
  return done(c);
}
