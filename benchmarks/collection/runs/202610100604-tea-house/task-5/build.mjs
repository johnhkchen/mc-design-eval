// Japanese tea house in a garden — 13 x 11 (front, x; north = -z) x 9 tall (y0 grass .. y8 ridge).
// Layers: y0 ground | y1 footings | y2 deck | y3..5 posts + shoji walls | y6.. roof (teahouse preset).
import { Grid, B, roof, boulder, fixture, planter, surround } from "../../../../../minecraft-design/tools/src/build.mjs";

const g = new Grid([13, 11, 11]);
const HERE = new URL(".", import.meta.url).pathname;
const S = (x, y, z, ...b) => g.set(x, y, z, ...b);
const rng = (() => { let s = 4242; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); })();
const P = { timber: "dark_oak_log", beam: "stripped_spruce_log", paper: "snow_block", deck: "spruce_planks", foot: "cobblestone" };
const isAir = (x, y, z) => g.isAir(x, y, z);   // not a /air/ regex: "st-AIR-s" matches

// ---- ground: grass with moss patches and a gravel apron -----------------------------------------------------------
g.fill([0, 0, 0], [12, 0, 10], "grass_block");
for (let x = 0; x < 13; x++) for (let z = 0; z < 11; z++) if (rng() < 0.2) S(x, 0, z, "moss_block");

// ---- raised floor: stone footings, spruce deck, tatami room ---------------------------------------------------------
for (const x of [2, 4, 6, 8, 10]) for (const z of [3, 5, 7, 9]) S(x, 1, z, P.foot);
for (const [x, z] of [[1, 2], [11, 2], [1, 10], [11, 10]]) S(x, 1, z, P.foot);
g.fill([1, 2, 2], [11, 2, 10], P.deck);
// deck rim: dark stripped logs along the front/back/sides lip
for (let x = 1; x <= 11; x++) for (const z of [2, 10]) S(x, 2, z, ...B.log("stripped_spruce", "x"));
for (let z = 2; z <= 10; z++) for (const x of [1, 11]) S(x, 2, z, ...B.log("stripped_spruce", "z"));
g.fill([4, 2, 5], [8, 2, 7], "bamboo_mosaic");   // tatami room floor

// ---- veranda posts on the deck lip carry the deep eave ------------------------------------------------------------------
const lip = [[1, 2], [5, 2], [7, 2], [11, 2], [1, 6], [11, 6], [1, 10], [5, 10], [7, 10], [11, 10]];
for (const [x, z] of lip) g.fill([x, 3, z], [x, 5, z], P.timber, { axis: "y" });
const isLip = (x, z) => lip.some(([a, b]) => a === x && b === z);
for (let x = 1; x <= 11; x++) for (const z of [2, 10]) if (!isLip(x, z)) S(x, 5, z, ...B.log("stripped_spruce", "x"));
for (let z = 2; z <= 10; z++) for (const x of [1, 11]) if (!isLip(x, z)) S(x, 5, z, ...B.log("stripped_spruce", "z"));
// engawa railing between the lip posts, open at the entry steps
const rail = (x, z) => { if (!isLip(x, z)) S(x, 3, z, ...B.fence("spruce")); };
for (let x = 1; x <= 11; x++) { if (x !== 6) rail(x, 2); rail(x, 10); }
for (let z = 3; z <= 9; z++) { rail(1, z); rail(11, z); }

// ---- shoji room x2..10, z3..9: white panels (y3-4) between dark posts, lattice ranma band (y5) ----------------------------
// each panel bay = a plain white (snow) backing one cell inside, with a dark_oak_fence kumiko grid on the outer plane
const panel = (x, z, f) => {
  const [bx, bz] = { north: [0, 1], south: [0, -1], west: [1, 0], east: [-1, 0] }[f];
  for (const y of [3, 4]) { S(x + bx, y, z + bz, P.paper); S(x, y, z, ...B.fence("dark_oak")); }
};
const ranma = (x, z, f) => S(x, 5, z, ...B.trapdoor("dark_oak", f, "bottom", true));
const wallPost = (x, z) => g.fill([x, 3, z], [x, 5, z], P.timber, { axis: "y" });
const head = (x, z, axis) => S(x, 5, z, ...B.log("stripped_spruce", axis));
for (const z of [3, 9]) {
  const f = z === 3 ? "north" : "south";
  for (const x of [2, 5, 7, 10]) wallPost(x, z);
  for (const x of [3, 4, 8, 9]) { panel(x, z, f); ranma(x, z, f); }
}
for (const x of [2, 10]) {
  const f = x === 2 ? "west" : "east";
  for (const z of [3, 6, 9]) wallPost(x, z);
  for (const z of [4, 5, 7, 8]) { panel(x, z, f); ranma(x, z, f); }
}
// front door bay x6 (open) / back bay x6 (panel)
g.fill([6, 3, 3], [6, 4, 3], "air"); head(6, 3, "x");
panel(6, 9, "south"); ranma(6, 9, "south");
// ceiling inside so hanging lights have support
g.fill([3, 5, 4], [9, 5, 8], "spruce_planks");
for (const y of [3, 4]) for (const x of [3, 9]) for (let z = 4; z <= 8; z++) if (isAir(x, y, z)) S(x, y, z, P.paper);
// tokonoma on the back wall inside: scroll on a dark post, flowers, hanging lanterns
wallPost(6, 9); S(6, 3, 8, "air"); S(6, 4, 8, ...B.banner("white", [["stripe_center", "black"], ["border", "red"]], { facing: "north" }));
S(5, 3, 8, "potted_red_tulip"); S(7, 3, 8, "potted_azure_bluet");
S(6, 4, 5, ...B.lantern(true));
// eave lanterns on the corner lip posts
for (const [x, z] of [[2, 2], [10, 2], [2, 10], [10, 10], [4, 2], [8, 2]]) S(x, 4, z, ...B.lantern(true));

// ---- entry steps and stepping stones -----------------------------------------------------------------------------------
for (const x of [5, 6, 7]) S(x, 1, 1, ...B.stairs("spruce", "south"));
S(6, 2, 2, ...B.stairs("spruce", "south"));
// stepping stones: staggered stone-brick blocks and slabs across moss, gravel between
for (const [x, z] of [[6, 0], [5, 0], [7, 0]]) S(x, 0, z, "stone_bricks");
for (const [x, z] of [[4, 0], [8, 0], [3, 1], [9, 1], [10, 0], [2, 0], [6, 1], [5, 1], [7, 1]]) if (!(x >= 5 && x <= 7 && z === 1)) S(x, 0, z, "gravel");
for (const [x, z] of [[6, 0], [4, 1], [8, 1], [3, 0], [9, 0]]) S(x, 1, z, ...B.slab("stone_brick", "bottom"));

// ---- garden: stone lantern (toro), maple, shrubs, rocks ----------------------------------------------------------------
function toro(x, z) {
  S(x, 1, z, ...B.slab("stone_brick", "bottom"));            // foot
  S(x, 2, z, ...B.wall("stone_brick"));                         // shaft
  S(x, 3, z, "stone_bricks");                                   // lamp housing
  S(x, 3, z, ...B.lantern(false));                              // light
  S(x, 4, z, ...B.slab("stone_brick", "bottom"));             // cap
}
toro(3, 0);
S(3, 1, 0, "stone_bricks");
S(3, 4, 0, ...B.slab("stone_brick", "bottom"));

function maple(cx, cz) {
  for (let y = 1; y <= 4; y++) S(cx, y, cz, ...B.log("dark_oak", "y"));
  S(cx + 1, 4, cz, ...B.log("dark_oak", "x")); S(cx + 1, 5, cz, ...B.log("dark_oak", "y"));
  for (let dx = -2; dx <= 3; dx++) for (let dz = -2; dz <= 2; dz++) for (let dy = -1; dy <= 2; dy++) {
    const r = Math.hypot((dx - 1) / 1.5, dz / 1.3, (dy - 0.2) / 0.95);
    const x = cx + dx, y = 5 + dy, z = cz + dz;
    if (r > 1.45 || !g.inBounds(x, y, z) || y < 3 || !isAir(x, y, z)) continue;
    if (rng() < 0.15) continue;
    S(x, y, z, rng() < 0.25 ? "red_wool" : "nether_wart_block");
  }
}
maple(0, 1);

const shrub = (x, z, h = 1) => { for (let y = 1; y <= h; y++) if (isAir(x, y, z)) S(x, y, z, rng() < 0.3 ? "flowering_azalea_leaves" : "azalea_leaves", { persistent: "true" }); };
for (const [x, z] of [[0, 4], [0, 6], [0, 8], [0, 10], [12, 3], [12, 5], [12, 7], [12, 9], [3, 10], [6, 10], [9, 10], [11, 0], [12, 1]]) shrub(x, z, rng() < 0.5 ? 2 : 1);
for (const [x, z] of [[11, 1], [10, 0], [12, 0], [4, 0], [8, 0], [0, 2], [12, 2], [0, 3], [12, 4]]) if (isAir(x, 1, z)) S(x, 1, z, rng() < 0.5 ? "short_grass" : "fern");
boulder(g, [11.5, 1, 1.5], [1.4, 1.2, 1.1], { moss: 0.5 });
boulder(g, [0.8, 1, 6.5], [0.8, 0.8, 0.9], { moss: 0.5 });

g.save(HERE + "base.nbt");   // everything except the roof

// ---- roof: teahouse preset (dutch gable, upturned eaves, dark glazed tiles) --------------------------------------------
const R = roof(g, [[2, 3, 10, 9]], "teahouse", {
  y: 6, overhang: { north: 2, south: 1, east: 1, west: 1 }, maxHeight: 4, style: "hip", pitch: 0.9, ridge: "slab",
  material: { mix: [["deepslate_tile", 50], ["cobbled_deepslate", 25], ["polished_blackstone_brick", 25]], eave: "polished_blackstone_brick", ridge: "polished_blackstone_brick", verge: "dark_oak" },
  pediment: { face: "north", width: 5, pitch: 1, tympanum: "snow_block", oculus: false, cornice: "dark_oak" },
});
// gablet: kumiko lattice window (fence grid over a white backing) in the plaster tympanum
for (const [x, y] of [[5, 6], [6, 6], [7, 6], [6, 7]]) {
  if (g.blockAt(x, y, 3) && /snow/.test(g.blockAt(x, y, 3))) { S(x, y, 4, P.paper); S(x, y, 3, ...B.fence("dark_oak")); }
}
// craft brushes: planter of azaleas/flowers beside the steps (ground bed)
const brushNotes = {};
// the rafter-tail row spills one cell past the 11-deep plot: copy everything else into a 13 x 10 x 11 grid
const out = new Grid([13, 10, 11]);
for (let x = 0; x < 13; x++) for (let y = 0; y < 10; y++) for (let z = 0; z < 11; z++) {
  const b = g.blockAt(x, y, z);
  if (!g.isAir(x, y, z)) { const c = g.get(x, y, z); out.set(x, y, z, c.block, c.state, c.nbt); }
}
out.save(HERE + "build.nbt");
console.log(JSON.stringify({ saved: HERE + "build.nbt", roof: R && R.notes, brushes: Object.fromEntries(Object.entries(brushNotes).map(([k, v]) => [k, v && { cells: v.cells && v.cells.length, skipped: v.skipped && v.skipped.length, notes: v.notes }])), refused: g.refused }));
