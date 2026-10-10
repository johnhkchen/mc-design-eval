// Japanese tea house in a garden — 13 x 11 (front, x; north = -z) x 9 tall above the ground layer (y0 = grass).
// Layout: ground y0 | footings y1 | deck y2 | walls/posts y3..5 | roof from y6 (hip below a front gablet, ridge along z).
import { Grid, B, roof, boulder, fixture } from "../../../../../minecraft-design/tools/src/build.mjs";

const g = new Grid([13, 11, 11]);
const OUT = new URL("./build.nbt", import.meta.url).pathname;

const P = {
  timber: "dark_oak_log", beam: "stripped_dark_oak_log", fence: "dark_oak_fence", deck: "spruce_planks", paper: "snow_block",
  tatami: "bamboo_mosaic", tile: "deepslate_tile", foot: "cobblestone",
};
const S = (x, y, z, ...b) => g.set(x, y, z, ...b);
const rng = (() => { let s = 12345; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); })();

// ---- ground: grass with moss patches ---------------------------------------------------------------------------
g.fill([0, 0, 0], [12, 0, 10], "grass_block");
for (let x = 0; x < 13; x++) for (let z = 0; z < 11; z++) if (rng() < 0.22) S(x, 0, z, "moss_block");

// ---- raised floor: stone footings, spruce deck, tatami room ------------------------------------------------------
for (const x of [1, 3, 5, 7, 9, 11]) for (const z of [2, 4, 6, 8, 10])
  S(x, 1, z, (x + z) % 4 === 0 ? "mossy_cobblestone" : P.foot);
g.fill([1, 2, 2], [11, 2, 10], P.deck);
g.fill([3, 2, 4], [9, 2, 8], P.tatami);

// ---- posts, rail beams ------------------------------------------------------------------------------------------
const veranda = [[2, 3], [10, 3], [2, 9], [10, 9], [2, 6], [10, 6]];
for (const [x, z] of veranda) g.fill([x, 3, z], [x, 5, z], P.timber, { axis: "y" });
// beam ring on the post line (carries the eaves)
for (let x = 2; x <= 10; x++) for (const z of [3, 9]) if (!veranda.some(([a, b]) => a === x && b === z)) S(x, 5, z, ...B.log("stripped_dark_oak", "x"));
for (let z = 3; z <= 9; z++) for (const x of [2, 10]) if (!veranda.some(([a, b]) => a === x && b === z)) S(x, 5, z, ...B.log("stripped_dark_oak", "z"));
// engawa railing on the outer lip, open at the entry steps
const rail = (x, z) => S(x, 3, z, ...B.fence("spruce"));
for (let x = 1; x <= 11; x++) { if (x < 5 || x > 7) rail(x, 2); rail(x, 10); }
for (let z = 3; z <= 9; z++) { rail(1, z); rail(11, z); }

// ---- the room: shoji walls (white panels in dark frames) ---------------------------------------------------------
const wallPost = (x, z) => g.fill([x, 3, z], [x, 5, z], P.timber, { axis: "y" });
const panel = (x, z) => { S(x, 3, z, P.paper); S(x, 4, z, P.paper); };
const ranma = (x, z, face) => { S(x, 5, z, ...B.trapdoor("dark_oak", face, "bottom", true)); };
// front (z=4): panels x4,5 | entry x6 | panels x7,8
for (const x of [3, 4, 5, 7, 8, 9]) { panel(x, 4); ranma(x, 4, "south"); }
S(6, 3, 4, "air"); S(6, 4, 4, "air"); S(6, 5, 4, P.beam, { axis: "x" });
// back (z=8): panels x4,5 | mullion x6 | panels x7,8
for (const x of [3, 4, 5, 7, 8, 9]) { panel(x, 8); ranma(x, 8, "north"); }
g.fill([6, 3, 8], [6, 5, 8], P.timber, { axis: "y" });
// west (x=3) / east (x=9): panels z5,7 | mullion z6
for (const x of [3, 9]) {
  for (const z of [4, 5, 6, 7, 8]) { if (z === 6) g.fill([x, 3, z], [x, 5, z], P.timber, { axis: "y" }); else { panel(x, z); ranma(x, z, x === 3 ? "east" : "west"); } }
}
// wall-top rail ring behind the ranma
for (let x = 4; x <= 8; x++) for (const z of [5, 7]) if (x >= 4) S(x, 5, z, P.paper);
for (let z = 5; z <= 7; z++) for (const x of [4, 8]) S(x, 5, z, P.paper);
S(5, 5, 6, "spruce_planks"); S(6, 5, 6, "spruce_planks"); S(7, 5, 6, "spruce_planks");
S(6, 5, 5, "spruce_planks"); S(6, 5, 7, "spruce_planks");
// kick rail under the panels (dark sill slab along each wall base outside)
// ---- interior: tokonoma scroll, tea table, cushions, lantern -----------------------------------------------------
S(6, 4, 7, ...B.banner("white", [["stripe_center", "black"], ["border", "red"]], { facing: "north" }));
S(6, 3, 7, "potted_red_tulip");
S(6, 4, 5, ...B.lantern(true));
S(7, 3, 6, ...B.slab("dark_oak", "bottom"));
S(5, 3, 6, "red_carpet"); S(7, 3, 5, "red_carpet"); S(7, 3, 7, "red_carpet");

for (const [x, z] of [[3, 3], [9, 3], [3, 9], [9, 9]]) S(x, 4, z, ...B.lantern(true));
// ---- entry steps and stepping stones ------------------------------------------------------------------------------
for (const x of [5, 6, 7]) S(x, 1, 1, ...B.stairs("spruce", "south"));
for (const [x, z] of [[6, 0], [5, 0], [4, 1], [8, 1], [9, 0], [3, 0], [7, 0]]) {
  S(x, 0, z, "stone_bricks");
}
for (const [x, z] of [[6, 0], [4, 1], [8, 1], [3, 0], [9, 0]]) S(x, 1, z, ...B.slab("stone_brick", "bottom"));
for (const [x, z] of [[2, 1], [10, 1], [11, 0], [1, 0], [5, 0], [7, 0]]) S(x, 0, z, "gravel");

// ---- roof: hip below a front gablet (irimoya), dark tiles, flared eaves ---------------------------------------------
const R = roof(g, [[2, 3, 10, 9]], "hip", {
  y: 6, material: P.tile, trim: "dark_oak", pitch: 0.67, eave: "flared", overhang: 1, ridge: "slab", hips: P.tile, contrast: false,
  pediment: { face: "north", width: 7, pitch: 1, tympanum: "snow_block", oculus: false, cornice: "dark_oak" },
});

// gable: timber lattice window (kumiko) in the plaster tympanum
for (const x of [5, 6, 7]) S(x, 6, 3, ...B.trapdoor("dark_oak", "south", "bottom", true));
S(6, 7, 3, ...B.trapdoor("dark_oak", "south", "bottom", true));
S(4, 6, 3, P.paper); S(8, 6, 3, P.paper);
// eave tips: the four roof corners flick up one course
for (const [x, z] of [[1, 2], [11, 2], [1, 10], [11, 10]]) S(x, 6, z, "deepslate_tiles");

// ---- garden: stone lantern, maple, shrubs, rocks ---------------------------------------------------------------------
function toro(x, z) {
  S(x, 1, z, "stone_bricks"); S(x, 2, z, ...B.wall("stone_brick")); S(x, 3, z, ...B.lantern(false));
  S(x, 4, z, ...B.slab("stone_brick", "bottom"));
}
toro(3, 0);

function maple(cx, cz) {
  for (let y = 1; y <= 4; y++) S(cx, y, cz, ...B.log("dark_oak", "y"));
  S(cx + 1, 3, cz, ...B.log("dark_oak", "x")); S(cx, 3, cz + 1, ...B.log("dark_oak", "z"));
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) for (let dy = 0; dy <= 2; dy++) {
    const r = Math.hypot(dx, dz, (dy - 0.8) * 1.5);
    const x = cx + dx, y = 4 + dy, z = cz + dz;
    if (r > 1.9 || !g.inBounds(x, y, z)) continue;
    const cur = g.blockAt(x, y, z);
    if (cur && !/air/.test(cur)) continue;
    S(x, y, z, rng() < 0.12 ? "red_wool" : "nether_wart_block");
  }
}
maple(1, 1);   // front-left, beside the roof corner

// shrubs and rocks
const shrub = (x, z, h = 1) => { for (let y = 1; y <= h; y++) S(x, y, z, rng() < 0.3 ? "flowering_azalea_leaves" : "azalea_leaves", { persistent: "true" }); };
for (const [x, z] of [[0, 4], [0, 6], [0, 8], [0, 9], [0, 10], [12, 3], [12, 5], [12, 7], [12, 9], [12, 10], [3, 10], [6, 10], [9, 10], [11, 0], [12, 1]]) shrub(x, z, rng() < 0.5 ? 2 : 1);
for (const [x, z] of [[11, 1], [10, 0], [12, 0], [1, 1], [4, 0], [8, 0], [0, 2], [12, 2]]) if (g.blockAt(x, 1, z) == null || /air/.test(g.blockAt(x, 1, z))) S(x, 1, z, rng() < 0.5 ? "short_grass" : "fern");
boulder(g, [11.5, 1, 1.5], [1.4, 1.2, 1.1], { moss: 0.5 });
boulder(g, [0.8, 1, 6.5], [0.8, 0.8, 0.9], { moss: 0.5 });

g.save(OUT);
console.log(JSON.stringify({ saved: OUT, roof: R && R.notes, refused: g.refused }));
