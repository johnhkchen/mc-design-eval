// Shared constants for the Golden Gate kit: palette ids (palette.json only), plan.md site coordinates, seeded rng.
// Plot origins: plot 0 (tower) is the frame itself; plots 1-3 sit further along x in the one grid (plan.md's cross-
// section is module-local, so a part adds PLOT_X.* to its plot-1..3 x values). Plot-local coordinates otherwise.

// palette (ids as in palette.json; bare names, the toolkit adds minecraft:)
/** Steel body: legs, struts, chords, girders, cable body. */
export const STEEL = "orange_terracotta";
/** Recess backs, truss diagonals, deck plate, X brace. */
export const BACK = "red_terracotta";
/** Bands, raised strut panels, brackets, cable bands. */
export const HIGHLIGHT = "orange_concrete";
/** Accent, sparingly (lower portal strut faces). */
export const ACCENT = "red_concrete";
/** Bottom slab for ledges and cable half-steps. */
export const SLAB = "smooth_red_sandstone_slab";
/** Corbels (placed upside down) and shaping stairs. */
export const STAIR = "smooth_red_sandstone_stairs";
/** Railing and lamp shafts. */
export const RAILING = "red_sandstone_wall";
/** Suspender ropes. */
export const ROPE = "red_stained_glass_pane";
/** Road surface. */
export const ROAD = "gray_concrete";
/** Centre lane line. */
export const LANE_CENTRE = "yellow_concrete";
/** Lane dashes. */
export const LANE_DASH = "white_concrete";
/** Sidewalks, walkways, pier and fender body. */
export const SIDEWALK = "light_gray_concrete";
/** Pier and fender top course. */
export const PIER_TOP = "polished_andesite";
/** Street and walkway lanterns. */
export const LANTERN = "lantern";
/** Hidden lights in floor beams, strut tops and lamp panels. */
export const SHROOM = "shroomlight";
/** Glow under the aircraft warning light. */
export const GLOW = "glowstone";
/** Aircraft warning light glass. */
export const WARNING_GLASS = "red_stained_glass";

// site (grid size and plot origins along x; all y/z are plot-local, see plan.md)
/** Plot origins along x in the one grid. */
export const PLOT_X = { tower: 0, deck: 48, mainCable: 63, sideCable: 78 };
/** Full kit extent: x 0..92 (plot 3 ends at 78+14), y 0..116, z 0..248. */
export const SITE_SIZE = [93, 117, 249];
/** y 0 is the water surface: nothing there, no ground course. */
export const WATER_Y = 0;

// shared cross-section (plots 1-3 x; plot 0 adds TOWER_DECK_X)
/** Plot 0 cross-section offset: its deck sits 16 further along x. */
export const TOWER_DECK_X = 16;
/** Rail and lamp stand level. */
export const RAIL_Y = 39;
/** Road and sidewalk surface (people stand on it at RAIL_Y). */
export const ROAD_Y = 38;
/** Edge girder and truss top chord. */
export const GIRDER_Y = 38;
/** Deck plate (closed underside) and truss top chord row. */
export const DECK_PLATE_Y = 37;
/** Warren diagonals span these rows. */
export const DIAGONAL_Y = [35, 36];
/** Floor beams (shroomlight at z % 4 = 0). */
export const FLOOR_BEAM_Y = 35;
/** Bottom chord and lateral bracing. */
export const BOTTOM_Y = 34;
/** Road lanes and sidewalks x (plots 1-3): road 3..11, sidewalks 1..2 and 12..13, edges 0 and 14. */
export const ROAD_X = [3, 11];
export const SIDEWALK_X = [[1, 2], [12, 13]];
export const EDGE_X = [0, 14];
/** Warren period: z % 4 = 1 -> y 35, = 2 -> y 36, = 3 -> y 35, = 0 open (node on the bottom chord). */
export const WARREN_PERIOD = 4;
/** Tiles every 16 blocks along z. */
export const DECK_TILE = 16;

// plot 0: south tower (local coordinates, x 0..46, z 0..23, y 1..116)
/** Fender ring outer and inner ellipse semi-axes; plan.md ring test. */
export const FENDER = { x: [0, 46], y: [1, 3], z: [0, 23], outer: { ax: 23.5, az: 12 }, inner: { ax: 21.5, az: 10 }, centre: { x: 23, z: 11.5 } };
/** Pier body and top course. */
export const PIER = { x: [11, 35], y: [1, 5], z: [5, 18], topY: 5 };
/** Leg stages on the west side; east mirrors x' = 46 - x (east S3/S4 x 28..31). */
export const LEG_STAGES = [
  { name: "S1", x: [14, 18], y: [6, 54], z: [8, 15] },
  { name: "S2", x: [14, 18], y: [55, 79], z: [9, 14] },
  { name: "S3", x: [15, 18], y: [80, 104], z: [10, 13] },
  { name: "S4", x: [15, 18], y: [105, 112], z: [10, 13] },
];
/** Tower x mirror: x' = TOWER_MIRROR - x. */
export const TOWER_MIRROR = 46;
/** Bottom tie beam, X brace, lower portal strut (carries the deck). */
export const TIE = { x: [19, 27], y: [6, 7], z: [10, 13] };
export const X_BRACE = { x: [19, 27], y: [8, 27], z: [10, 13] };
export const LOWER_STRUT = { x: [19, 27], y: [28, 33], z: [10, 13] };
/** Portal struts 1-3 and top strut (x 19..27, z 10..13). */
export const STRUTS = [
  { name: "strut 1", y: [55, 60] },
  { name: "strut 2", y: [72, 77] },
  { name: "strut 3", y: [90, 95] },
  { name: "top strut", y: [106, 112] },
];
/** Top strut crown: a 9x4 course at y 113, a 5x2 cap at y 114. */
export const CROWN = { y113: { x: [19, 27], z: [10, 13] }, y114: { x: [21, 25], z: [11, 12] } };
/** Deck through the tower: full section z 0..7 and 16..23; road + floor beams only z 8..15 (bearing on the legs). */
export const TOWER_DECK = { x: [16, 30], y: [34, 39], z: [[0, 7], [16, 23]] };
export const PORTAL_DECK = { x: [19, 27], y: [34, 38], z: [8, 15] };
/** Walkway platforms at y 38 (x 12..18 and mirror 28..34), along the leg and its corbels at y 37. */
export const WALKWAY = { platformX: [12, 18], platformZ: [[6, 7], [16, 17]], legX: [12, 13], legZ: [8, 15], corbelY: 37, corbelZ: [8, 11, 12, 15] };
/** Setback ledges (bottom slab course): S1->S2 at y 55 on z 8 and z 15; S2->S3 at y 80 on x 14 / x 32 and z 9 / z 14. */
export const LEDGE_Y = { s1s2: 55, s2s3: 80 };
/** Bands, solid orange_concrete courses across each leg. */
export const BANDS = [[6, 7], [53, 54], [78, 79], [103, 104], [111, 111]];
/** Top caps (west; east mirror). */
export const CAP = { legTop: 112, housingWalls: 113, housingRoof: 114, lights: 115, warning: 116 };
/** Cable grooves open through the tower top: x 16 and x 30, y 112..113, z 10..13. */
export const GROOVE_X = [16, 30];
export const GROOVE = { y: [112, 113], z: [10, 13] };
/** Portal roadway clearance: x 19..27, y 39..52, z 8..15. */
export const PORTAL_ROAD = { x: [19, 27], y: [39, 52], z: [8, 15] };
/** Deck lamps (plot 1) and walkway lamps (plot 0, same design). */
export const DECK_LAMP_Z = 8;
export const DECK_LAMP_X = [1, 13];
export const WALKWAY_LAMPS = [[12, 6], [12, 17], [34, 6], [34, 17]];
/** Pier lanterns (y 6) and fender lanterns (y 4), plot-0 coordinates. */
export const PIER_LANTERNS = [[11, 5], [23, 5], [35, 5], [11, 18], [23, 18], [35, 18]];
export const FENDER_LANTERNS = [[0, 11], [46, 12], [23, 0], [23, 23], [3, 7], [43, 7], [3, 16], [43, 16], [15, 1], [31, 1], [15, 22], [31, 22]];

// plot 1: deck section (local x 0..14, z 0..15, y 34..44)
/** Tiles along z: 0..15, every layer continuous at z 0 and z 15. */
export const PLOT1 = { z: [0, 15], y: [34, 44] };
/** Suspender anchor brackets: x 0 and x 14, z 0, 4, 8, 12, y 38..39. */
export const ANCHOR_X = [0, 14];
export const ANCHOR_Z = [0, 4, 8, 12];
export const ANCHOR_Y = [38, 39];
/** Lane lines: centre x 7 (continuous); dashes x 5 and x 9 at z 0..3 and 8..11. */
export const LANE_CENTRE_X = 7;
export const LANE_DASH_X = [5, 9];
export const LANE_DASH_Z = [[0, 3], [8, 11]];
/** Suspender clear zone: x 0 and x 14, y 40..44 (all z). */
export const SUSPENDER_CLEAR_Y = [40, 44];

// plots 2 and 3: cables (plot-local x 0..14)
/** Main-span cable: f(z) = 41.9 + 0.00069 (z+72)^2, z 0..248. */
export const MAIN_CABLE = { z: [0, 248], a: 41.9, k: 0.00069, zc: 72, x: [0, 14] };
/** Side-span cable: f = 112.8 - 0.6475u + 0.001165u^2 (u = z + 0.5) for z 0..171; then level at y 36 for z 172..231. */
export const SIDE_CABLE = { z: [0, 231], curveZ: [0, 171], levelY: 36, levelZ: [172, 231], a: 112.8, b: 0.6475, c: 0.001165, x: [0, 14] };
/** Cable bands every 4 blocks in z (orange_concrete body block where z % 4 = 0). */
export const BAND_PERIOD = 4;
/** Suspender rows: main every 4 blocks in z from 0 to 248; side at z 12, 16, ..., 168. */
export const SIDE_SUSPENDER_Z = [12, 168];
/** Side suspender bottoms by z band (from y, up to base-1). */
export const SIDE_SUSPENDER_BOTTOM = [[12, 43, 40], [44, 75, 39], [76, 107, 38], [108, 139, 37], [140, 171, 36]];

// determinism
/** Seeded rng(seed): same seed, same stream (toolkit terrain.mjs). */
export { rng } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/terrain.mjs";
