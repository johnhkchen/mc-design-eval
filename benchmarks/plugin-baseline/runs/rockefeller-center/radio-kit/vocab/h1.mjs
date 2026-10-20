// SPDX-License-Identifier: AGPL-3.0-or-later
// Radio City block, helper set H1 (plan.md VOCABULARY): limestone_mass, frieze_band, marquee_run, marquee_word,
// tall_window, stage_door, vent_box, floodlight.
// Every helper takes its position (and facing) as arguments and writes only into air inside its own footprint.
// A cell that is not air (an earlier part's cell) is refused and listed in `refused`; it is never overwritten.
// Each returns { placed, refused }.
import { B, OPPOSITE, bannerWord } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const result = () => ({ placed: 0, refused: [] });

// Write one block into air; record the refusal otherwise.
function put(g, out, x, y, z, block, state) {
  if (!g.isAir(x, y, z)) { out.refused.push([x, y, z, block]); return; }
  g.set(x, y, z, block, state);
  out.placed++;
}

// Every cell of an inclusive box [x0, y0, z0, x1, y1, z1], in any corner order.
function* cells([x0, y0, z0, x1, y1, z1]) {
  for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++)
    for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++)
      for (let z = Math.min(z0, z1); z <= Math.max(z0, z1); z++) yield [x, y, z];
}

/**
 * Solid limestone box to its top block. The bottom row is polished_granite when plinth (pass the box's bottom at
 * the plinth level: y0, or y1 where the ground is 1).
 */
export function limestone_mass(g, box, { plinth = true } = {}) {
  const out = result(), lo = Math.min(box[1], box[4]);
  for (const [x, y, z] of cells(box)) put(g, out, x, y, z, plinth && y === lo ? "polished_granite" : "smooth_sandstone");
  return out;
}

/**
 * One row of cut_sandstone (the frieze under a parapet; the box is that row). With stringCourse = the direction the
 * lip points (the street), the row is a string course of smooth_sandstone_stairs half=top, back into the wall.
 */
export function frieze_band(g, box, { stringCourse } = {}) {
  const out = result();
  for (const [x, y, z] of cells(box)) {
    if (stringCourse) put(g, out, x, y, z, ...B.stairs("smooth_sandstone", OPPOSITE[stringCourse], "top"));
    else put(g, out, x, y, z, "cut_sandstone");
  }
  return out;
}

// Marquee words: the letter and banner colours per run word (plan: RADIO CITY red/white, MUSIC HALL white/blue).
const WORD_COLOURS = { "RADIO CITY": { letter: "red", base: "white" }, "MUSIC HALL": { letter: "white", base: "blue" } };

/**
 * One straight marquee run, 2 deep, from `from` to `to` along the run (z for axis "z", x for axis "x").
 * `at` is the front row's coordinate across the run (x for axis "z", z for axis "x"); `front` is the street side
 * (west/east for axis "z", south/north for axis "x"). Section per plan, from the top: y10 smooth_quartz_slab top
 * layer with sea_lantern every 4 behind and end_rod every 2 on the front edge (y11); y9 blue_stained_glass over
 * sea_lantern; y7..8 light_gray_concrete letter band; y6 red_stained_glass over shroomlight; the soffit under the
 * front row at y0-1 alternates glowstone and sea_lantern.
 */
export function marquee_run(g, { axis, from, to, at, front, y0 = 6 }) {
  const out = result();
  const sides = axis === "z" ? ["west", "east"] : ["south", "north"];
  if (!sides.includes(front)) throw new Error(`marquee_run: axis ${axis} needs front ${sides.join(" or ")}, got ${front}`);
  // the step from the front row into the building: +1 for a west (low x) or north (low z) front
  const inward = front === "west" || front === "north" ? 1 : -1;
  const lo = Math.min(from, to), hi = Math.max(from, to);
  for (let t = lo; t <= hi; t++) {
    const i = t - lo;
    // depth 0 is the front row, 1 the row behind it
    const at_ = (depth, y, block, state) => {
      const d = at + inward * depth;
      const [x, z] = axis === "z" ? [d, t] : [t, d];
      put(g, out, x, y, z, block, state);
    };
    at_(0, y0, "red_stained_glass");
    at_(1, y0, "shroomlight");
    for (const y of [y0 + 1, y0 + 2]) { at_(0, y, "light_gray_concrete"); at_(1, y, "light_gray_concrete"); }
    at_(0, y0 + 3, "blue_stained_glass");
    at_(1, y0 + 3, "sea_lantern");
    at_(0, y0 + 4, "smooth_quartz_slab", { type: "top" });
    if (i % 4 === 0) at_(1, y0 + 4, "sea_lantern");
    else at_(1, y0 + 4, "smooth_quartz_slab", { type: "top" });
    if (i % 2 === 0) at_(0, y0 + 5, "end_rod", { facing: "up" });
    at_(0, y0 - 1, i % 2 ? "sea_lantern" : "glowstone");
  }
  return out;
}

/**
 * RADIO CITY / MUSIC HALL letters on the banner row (wall banners hung on the letter band), reading along `face`.
 * center is the middle letter's cell; the colours default from the word. bannerWord writes a letter only into air.
 */
export function marquee_word(g, word, { center, face, letter, base } = {}) {
  const colours = WORD_COLOURS[word] ?? {};
  const l = letter ?? colours.letter, b = base ?? colours.base;
  if (!l || !b) throw new Error(`marquee_word: no colours for "${word}"; pass letter and base`);
  const placed = bannerWord(g, word, { center, face, letter: l, base: b });
  return { placed, refused: [] };
}

/**
 * A 1-wide glass_pane in a wall, framed by waxed_cut_copper on both sides, rows y0..y1; the bottom glass row is a
 * waxed_cut_copper_stairs sill (top half, back into the wall). pos = [x, z] of the glass column; face = the street
 * side (north/south for a wall running along x, east/west for one running along z).
 */
export function tall_window(g, { pos: [px, pz], face, y0, y1 }) {
  const out = result();
  const alongX = face === "north" || face === "south";
  const [ax, az] = alongX ? [1, 0] : [0, 1];
  const pane = alongX ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
  const sill = B.stairs("waxed_cut_copper", OPPOSITE[face], "top");
  for (let y = y0; y <= y1; y++) {
    put(g, out, px - ax, y, pz - az, "waxed_cut_copper");
    put(g, out, px + ax, y, pz + az, "waxed_cut_copper");
    if (y === y0) put(g, out, px, y, pz, ...sill);
    else put(g, out, px, y, pz, "glass_pane", pane);
  }
  return out;
}

/**
 * The stage door in a wall running along x at plane z (face south or north): glass_pane across x0..x1, rows y0..y1;
 * waxed_cut_copper jambs and head around it; an optional canopy { x0, x1, z0, z1, y }: sea_lantern on every other
 * x in row y (the underside), smooth_quartz_slab bottom at y+1 across the canopy.
 */
export function stage_door(g, { x0, x1, z, y0, y1, face = "south", canopy }) {
  if (face !== "south" && face !== "north") throw new Error(`stage_door: face must be south or north, got ${face}`);
  const out = result(), pane = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };
  const lo = Math.min(x0, x1), hi = Math.max(x0, x1);
  for (let x = lo; x <= hi; x++) for (let y = y0; y <= y1; y++) put(g, out, x, y, z, "glass_pane", pane);
  for (let y = y0; y <= y1 + 1; y++) { put(g, out, lo - 1, y, z, "waxed_cut_copper"); put(g, out, hi + 1, y, z, "waxed_cut_copper"); }
  for (let x = lo; x <= hi; x++) put(g, out, x, y1 + 1, z, "waxed_cut_copper");
  if (canopy) {
    const cLo = Math.min(canopy.x0, canopy.x1), cHi = Math.max(canopy.x0, canopy.x1);
    for (let x = cLo; x <= cHi; x++) for (let cz = Math.min(canopy.z0, canopy.z1); cz <= Math.max(canopy.z0, canopy.z1); cz++) {
      if ((x - cLo) % 2 === 0) put(g, out, x, canopy.y, cz, "sea_lantern");
      put(g, out, x, canopy.y + 1, cz, "smooth_quartz_slab", { type: "bottom" });
    }
  }
  return out;
}

/** A 2x2 vent: iron_block at y with a closed iron_trapdoor lid on each of its four cells at y+1. */
export function vent_box(g, { x, y, z }) {
  const out = result();
  for (let dx = 0; dx < 2; dx++) for (let dz = 0; dz < 2; dz++) {
    put(g, out, x + dx, y, z + dz, "iron_block");
    put(g, out, x + dx, y + 1, z + dz, ...B.trapdoor("iron", "north", "bottom", false));
  }
  return out;
}

/**
 * Sea lanterns standing on a deck (deckY is the deck's top block) along the foot of a higher wall: the row at
 * coordinate `at` (z for axis "x", x for axis "z") from `from` to `to`, every `every` cells.
 */
export function floodlight(g, { deckY, axis, at, from, to, every = 4 }) {
  const out = result(), lo = Math.min(from, to), hi = Math.max(from, to);
  for (let t = lo; t <= hi; t += every) {
    const [x, z] = axis === "x" ? [t, at] : [at, t];
    put(g, out, x, deckY + 1, z, "sea_lantern");
  }
  return out;
}
