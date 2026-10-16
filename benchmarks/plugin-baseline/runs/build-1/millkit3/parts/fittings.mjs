// Fittings (part 5): windows, doors, French pairs, shutters, porch frames and rails, brackets, turned posts, front steps,
// gable vents, fishscale shingle, the barn hoist and porch lanterns. Absolute coordinates from plan.md. Every write goes
// into air only (a cell that is not air is skipped), so earlier parts' blocks are never touched.
import {
  window, shutter, front_steps, hanging_lantern, fishscale, turned_post, french_pair,
} from "../vocab.mjs";

const RAIL_X = { north: "false", south: "false", east: "true", west: "true" };

// Put one block where there is air only; returns whether it was placed.
function put(g, x, y, z, block, state) {
  if (!g.inBounds(x, y, z) || !g.isAir(x, y, z)) return false;
  g.set(x, y, z, block, state);
  return true;
}

// Both halves of a door in a wall, facing out of the house (no step: the porch deck or the ground is the step).
function door(g, x, y, z, face, wood) {
  if (!g.isAir(x, y, z) || !g.isAir(x, y + 1, z)) return false;
  const st = (half) => ({ facing: face, half, hinge: "left", open: "false", powered: "false" });
  g.set(x, y, z, `${wood}_door`, st("lower"));
  g.set(x, y + 1, z, `${wood}_door`, st("upper"));
  return true;
}

// A 1-wide glass transom or sidelight in the wall plane (the window helper with no sill).
function glass(g, x, y, z, faceOut, w = 1, h = 1) {
  window(g, x, y, z, faceOut, w, h, { sill: null });
}

// A coloured pane run in the wall plane along x (north/south walls) or z (east/west walls).
function stained(g, x, y, z, faceOut, w, h, block = "orange_stained_glass_pane") {
  const along = faceOut === "north" || faceOut === "south";
  for (let i = 0; i < w; i++) for (let j = 0; j < h; j++) {
    const s = along
      ? { north: "false", south: "false", east: i < w - 1 ? "true" : "false", west: i > 0 ? "true" : "false" }
      : { east: "false", west: "false", north: i < w - 1 ? "true" : "false", south: i > 0 ? "true" : "false" };
    put(g, along ? x + i : x, y + j, along ? z : z + i, block, s);
  }
}

// Porch frame on one front row: posts y3..5 (optional brick pedestal y3 under each), a beam along x at y6 across
// xa..xb, a rail at y3 between the posts (gap = [xa, xb] left open for steps), gingerbread brackets under the beam
// either side of each post. The deck is the shell's, so it is not written here.
function porchFrame(g, { xa, xb, z, posts, post = "stripped_birch_log", beam = "stripped_birch_log", rail = "birch_fence", gap = null, pedestal = null, bracket = null }) {
  for (const px of posts) {
    if (pedestal) put(g, px, 3, z, pedestal);
    for (let y = pedestal ? 4 : 3; y <= 5; y++) put(g, px, y, z, post, { axis: "y" });
  }
  for (let x = xa; x <= xb; x++) put(g, x, 6, z, beam, { axis: "x" });
  for (let x = xa; x <= xb; x++) {
    if (posts.includes(x) || (gap && x >= gap[0] && x <= gap[1])) continue;
    put(g, x, 3, z, `${rail}`, RAIL_X);
  }
  if (bracket) for (const px of posts) for (const bx of [px - 1, px + 1]) {
    if (bx < xa || bx > xb) continue;
    put(g, bx, 5, z, `${bracket}_stairs`, { facing: "north", half: "top", shape: "straight", waterlogged: "false" });
  }
}

// Plot 0 double shotgun (x 1..10): two front doors with transoms, floor-length windows, outer shutters, shared porch,
// a gable vent. The front gable vent is an open birch trapdoor in the wall plane.
function plot0(g) {
  door(g, 4, 3, 9, "north", "bamboo");
  door(g, 7, 3, 9, "north", "bamboo");
  glass(g, 4, 5, 9, "north");
  glass(g, 7, 5, 9, "north");
  window(g, 2, 3, 9, "north", 1, 3, { sill: null });
  window(g, 9, 3, 9, "north", 1, 3, { sill: null });
  shutter(g, [1, 3, 8], "north", "dark_oak", { height: 3 });
  shutter(g, [10, 3, 8], "north", "dark_oak", { height: 3 });
  // the gable vent: two open birch trapdoors in the wall plane
  put(g, 5, 9, 9, "birch_trapdoor", { facing: "north", half: "bottom", open: "true", powered: "false" });
  put(g, 6, 9, 9, "birch_trapdoor", { facing: "north", half: "bottom", open: "true", powered: "false" });
  // shared porch: posts at x 1, 4, 7, 10 on z 7; beam y6; rail with the step gap x 5..6
  porchFrame(g, { xa: 1, xb: 10, z: 7, posts: [1, 4, 7, 10], beam: "stripped_birch_log", rail: "birch_fence", gap: [5, 6], bracket: "birch" });
  front_steps(g, 5, 6, 6, { material: "dark_oak" });
  put(g, 2, 5, 7, "lantern", { hanging: "true" });
  put(g, 8, 5, 7, "lantern", { hanging: "true" });
}

// Plot 1 Creole cottage (x 15..22): two French-door pairs under the galerie, board shutters, galerie posts and rail,
// west, east and back windows, the attic window.
function plot1(g) {
  french_pair(g, 16, 3, 10, "north");
  french_pair(g, 20, 3, 10, "north");
  for (const x of [15, 18, 19, 22]) shutter(g, [x, 3, 9], "north", "warped", { height: 3 });
  // galerie: slim dark oak posts at x 15, 19, 22 on z 7, beam y6, rail with the steps gap x 17..18
  porchFrame(g, { xa: 15, xb: 22, z: 7, posts: [15, 19, 22], post: "dark_oak_fence", beam: "stripped_dark_oak_log", rail: "dark_oak_fence", gap: [17, 18] });
  front_steps(g, 17, 18, 6, { material: "dark_oak" });
  hanging_lantern(g, 21, 5, 7);
  window(g, 15, 4, 11, "west", 1, 2);
  window(g, 15, 4, 16, "west", 1, 2);
  window(g, 22, 4, 12, "east", 1, 2);
  window(g, 22, 4, 15, "east", 1, 2);
  window(g, 22, 9, 12, "east", 1, 1);
  window(g, 17, 4, 17, "south", 1, 2);
  window(g, 20, 4, 17, "south", 1, 2);
}

// Plot 2 American Foursquare (x 27..34): front door with sidelight and transom, windows both storeys, the dormer
// window, side and back windows, a full-width porch with brick pedestals and cheek walls.
function plot2(g) {
  door(g, 30, 3, 9, "north", "spruce");
  window(g, 29, 3, 9, "north", 1, 2, { sill: null });
  glass(g, 29, 5, 9, "north");
  glass(g, 30, 5, 9, "north");
  window(g, 28, 4, 9, "north", 1, 2);
  window(g, 32, 4, 9, "north", 2, 2);
  window(g, 28, 9, 9, "north", 2, 2);
  window(g, 32, 9, 9, "north", 2, 2);
  window(g, 30, 13, 10, "north", 2, 1);
  window(g, 27, 4, 10, "west", 1, 2);
  window(g, 27, 4, 15, "west", 1, 2);
  window(g, 27, 9, 10, "west", 1, 2);
  window(g, 27, 9, 15, "west", 1, 2);
  window(g, 34, 4, 11, "east", 1, 2);
  window(g, 34, 4, 14, "east", 1, 2);
  window(g, 34, 9, 11, "east", 1, 2);
  window(g, 34, 9, 14, "east", 1, 2);
  door(g, 32, 3, 16, "south", "spruce");
  window(g, 29, 4, 16, "south", 1, 2);
  window(g, 29, 9, 16, "south", 1, 2);
  window(g, 32, 9, 16, "south", 1, 2);
  // porch: columns at x 27, 31, 34 on z 7 (brick pedestal, birch column), beam y6, birch balustrade, gap x 29..30
  porchFrame(g, { xa: 27, xb: 34, z: 7, posts: [27, 31, 34], beam: "stripped_birch_log", rail: "birch_fence", gap: [29, 30], pedestal: "bricks" });
  front_steps(g, 29, 30, 6, { material: "dark_oak" });
  put(g, 28, 1, 6, "brick_wall");
  put(g, 31, 1, 6, "brick_wall");
  hanging_lantern(g, 33, 5, 7);
}

// Plot 3 Queen Anne (x 37..45, tower 43..46): the double front door with a stained transom, bay windows, tower
// windows and belvedere glazing, the wraparound porch with turned posts and a spindle frieze, fishscale on the front.
function plot3(g) {
  door(g, 41, 3, 9, "north", "dark_oak");
  door(g, 42, 3, 9, "north", "dark_oak");
  stained(g, 41, 5, 9, "north", 2, 1);
  window(g, 39, 4, 9, "north", 2, 2);
  window(g, 40, 9, 9, "north", 2, 2);
  // bay hood: birch slab tops over the front pair, at z 8 y 6
  put(g, 39, 6, 8, "birch_slab", { type: "top", waterlogged: "false" });
  put(g, 40, 6, 8, "birch_slab", { type: "top", waterlogged: "false" });
  window(g, 44, 4, 7, "north", 2, 2);
  window(g, 44, 9, 7, "north", 2, 2);
  window(g, 46, 4, 8, "east", 1, 2);
  window(g, 46, 4, 9, "east", 1, 2);
  window(g, 46, 9, 8, "east", 1, 2);
  window(g, 46, 9, 9, "east", 1, 2);
  window(g, 44, 13, 7, "north", 2, 2);
  window(g, 46, 13, 8, "east", 1, 2);
  window(g, 43, 13, 8, "west", 1, 2);
  window(g, 39, 4, 11, "west", 1, 2);
  window(g, 39, 4, 14, "west", 1, 2);
  window(g, 39, 9, 11, "west", 1, 2);
  window(g, 39, 9, 14, "west", 1, 2);
  stained(g, 39, 9, 12, "west", 1, 2);
  window(g, 45, 4, 12, "east", 1, 2);
  window(g, 45, 4, 15, "east", 1, 2);
  window(g, 45, 9, 12, "east", 1, 2);
  window(g, 45, 9, 15, "east", 1, 2);
  door(g, 44, 3, 16, "south", "dark_oak");
  window(g, 39, 4, 16, "south", 1, 2, { sill: null });
  window(g, 39, 9, 16, "south", 1, 2, { sill: null });
  // wraparound porch: turned posts (37,7), (40,7), (37,10), (37,14); beams along x on z 7 and along z on x 37
  for (let x = 37; x <= 42; x++) put(g, x, 6, 7, "stripped_birch_log", { axis: "x" });
  for (let z = 8; z <= 14; z++) put(g, 37, 6, z, "stripped_birch_log", { axis: "z" });
  turned_post(g, 37, 7, 3, "x");
  turned_post(g, 40, 7, 3, "x");
  turned_post(g, 37, 10, 3, "z");
  turned_post(g, 37, 14, 3, "z");
  // spindle frieze: closed birch trapdoors hung under the beam between the posts
  for (const x of [38, 39, 41, 42]) put(g, x, 5, 7, "birch_trapdoor", { facing: "north", half: "top", open: "false", powered: "false" });
  // balustrade: front row (steps at x 41..42) and the west leg (exit at z 14)
  for (const x of [38, 39]) put(g, x, 3, 7, "birch_fence", RAIL_X);
  for (const z of [8, 9, 11, 12, 13]) put(g, 37, 3, z, "birch_fence", { north: "true", south: "true", east: "false", west: "false" });
  front_steps(g, 41, 42, 6, { material: "dark_oak" });
  hanging_lantern(g, 38, 5, 8);
}

// Plot 4 gable-front-and-wing (x 49..58): front gable windows and attic pair, the vent, wing and porch windows and
// doors, the porch frame in the angle, east and back windows.
function plot4(g) {
  window(g, 54, 4, 9, "north", 1, 2);
  window(g, 57, 4, 9, "north", 1, 2);
  window(g, 55, 9, 9, "north", 2, 2);
  put(g, 55, 11, 9, "birch_trapdoor", { facing: "north", half: "bottom", open: "true", powered: "false" });
  put(g, 56, 11, 9, "birch_trapdoor", { facing: "north", half: "bottom", open: "true", powered: "false" });
  door(g, 51, 3, 12, "north", "spruce");
  window(g, 50, 4, 12, "north", 1, 2);
  door(g, 53, 3, 10, "west", "spruce");
  // porch in the angle: posts (49,9), (52,9), (49,11); beams along x on z 9 and z 11; rail with the steps gap x 51..52
  porchFrame(g, { xa: 49, xb: 52, z: 9, posts: [49, 52], beam: "stripped_birch_log", rail: "birch_fence", gap: [51, 52] });
  for (let x = 49; x <= 52; x++) put(g, x, 6, 11, "stripped_birch_log", { axis: "x" });
  // back rail on x50 only: (51,3,11) stays clear, the way from the porch to the wing door (51,3,12)
  for (let x = 49; x <= 52; x++) if (x !== 49 && x !== 51 && x !== 52) put(g, x, 3, 11, "birch_fence", RAIL_X);
  put(g, 49, 3, 11, "stripped_birch_log", { axis: "y" });
  for (let y = 4; y <= 5; y++) put(g, 49, y, 11, "stripped_birch_log", { axis: "y" });
  front_steps(g, 51, 52, 8, { material: "dark_oak" });
  hanging_lantern(g, 50, 5, 9);
  window(g, 58, 4, 11, "east", 1, 2);
  window(g, 58, 4, 14, "east", 1, 2);
  window(g, 58, 9, 12, "east", 1, 1);
  window(g, 49, 4, 14, "west", 1, 2);
  put(g, 49, 8, 14, "birch_trapdoor", { facing: "west", half: "bottom", open: "false", powered: "false" });
  door(g, 55, 3, 16, "south", "spruce");
  window(g, 57, 4, 16, "south", 1, 2);
}

// Plot 5 mule barn (x 61..70): the big front doors with the open transom, the beam above, the loft door with its
// folded shutters, the hay hoist beam, stall hatches, and the back doors to the paddock.
function plot5(g) {
  door(g, 64, 1, 9, "north", "spruce");
  door(g, 65, 1, 9, "north", "spruce");
  // the transom over the big doors: a shut hatch in the wall plane (an open one would hang in the air inside)
  put(g, 64, 3, 9, "spruce_trapdoor", { facing: "north", half: "bottom", open: "false", powered: "false" });
  put(g, 65, 3, 9, "spruce_trapdoor", { facing: "north", half: "bottom", open: "false", powered: "false" });
  put(g, 64, 4, 9, "stripped_spruce_log", { axis: "x" });
  put(g, 65, 4, 9, "stripped_spruce_log", { axis: "x" });
  shutter(g, [63, 8, 8], "north", "spruce", { height: 2 });
  shutter(g, [66, 8, 8], "north", "spruce", { height: 2 });
  // hay hoist: fence beam at y10 over z 8, iron chain and a lantern hook
  put(g, 64, 10, 8, "spruce_fence", { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" });
  put(g, 65, 10, 8, "spruce_fence", { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" });
  put(g, 64, 9, 8, "iron_chain", { axis: "y" });
  put(g, 64, 8, 8, "lantern", { hanging: "true" });
  // stall hatches: shut trapdoors in the openings, no glass (an open one would hang in the air inside the wall)
  put(g, 61, 3, 11, "spruce_trapdoor", { facing: "west", half: "bottom", open: "false", powered: "false" });
  put(g, 61, 3, 13, "spruce_trapdoor", { facing: "west", half: "bottom", open: "false", powered: "false" });
  put(g, 68, 3, 11, "spruce_trapdoor", { facing: "east", half: "bottom", open: "false", powered: "false" });
  // back doors to the paddock
  door(g, 64, 1, 15, "south", "spruce");
  door(g, 65, 1, 15, "south", "spruce");
  hanging_lantern(g, 64, 5, 12);
}

// Plot 6 bake-oven yard: the pavilion and oven are the shell's and the chimneys'; the lantern hangs under the eave.
function plot6(g) {
  hanging_lantern(g, 77, 5, 9);
}

// Plot 7 company duplex (x 85..94): two front doors with transoms and gallery doors, windows both storeys, gallery
// and porch railings, the side windows, and the front steps for both units.
function plot7(g) {
  door(g, 88, 3, 9, "north", "dark_oak");
  door(g, 91, 3, 9, "north", "dark_oak");
  glass(g, 88, 5, 9, "north");
  glass(g, 91, 5, 9, "north");
  door(g, 88, 8, 9, "north", "dark_oak");
  door(g, 91, 8, 9, "north", "dark_oak");
  window(g, 86, 4, 9, "north", 2, 2);
  window(g, 92, 4, 9, "north", 2, 2);
  window(g, 86, 9, 9, "north", 2, 2);
  window(g, 92, 9, 9, "north", 2, 2);
  for (const x of [85, 94]) for (const z of [11, 14]) {
    window(g, x, 4, z, x === 85 ? "west" : "east", 1, 2);
    window(g, x, 9, z, x === 85 ? "west" : "east", 1, 2);
  }
  // porch rails: lower birch fence at y3 (gaps x 88 and x 91), gallery rail at y8
  for (const x of [86, 87, 92, 93]) put(g, x, 3, 7, "birch_fence", RAIL_X);
  for (const x of [86, 87, 88, 91, 92, 93]) put(g, x, 8, 7, "birch_fence", RAIL_X);
  front_steps(g, 88, 91, 6, { material: "stone_brick" });
  hanging_lantern(g, 87, 7, 8);
}

// Fishscale on the front of plot 3's upper storey, after the windows (air only, so the glass and frame keep their cells).
function plot3Shingle(g) {
  fishscale(g, [39, 8, 9, 42, 11, 9], "birch_planks", "birch_slab");
}

export function build(g) {
  plot0(g);
  plot1(g);
  plot2(g);
  plot3(g);
  plot4(g);
  plot5(g);
  plot6(g);
  plot7(g);
  plot3Shingle(g);
}
