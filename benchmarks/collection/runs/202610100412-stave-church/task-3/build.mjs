// Nordic stave church, 13 x 22 x 17, front faces NORTH (-z). Pass 1: form.
import { Grid, carve, B, roof } from "../../../../../minecraft-design/tools/src/build.mjs";

const OUT = new URL("./build.nbt", import.meta.url).pathname;
const g = new Grid([13, 22, 17]);
const W = 13, D = 17, CX = 6;

// palette by role: timber 60 / slate 30 / stone 10
const WALL = "dark_oak_planks", FRAME = "stripped_spruce_log", ROOF = "deepslate_tile", TRIM = "spruce", STONE = "stone_bricks";

// ---- 1. stone base (y0-1) + entrance steps -------------------------------------------------------------------
g.fill([0, 0, 0], [W - 1, 1, D - 1], STONE);
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if ((x * 7 + z * 13 + x * z) % 9 === 0) g.set(x, 0, z, "mossy_stone_bricks");
  if ((x * 5 + z * 11) % 8 === 0) g.set(x, 1, z, "cracked_stone_bricks");
  if (x === 0 || x === W - 1 || z === 0 || z === D - 1) { if ((x + z) % 4 === 0) g.set(x, 0, z, "stone_bricks"); }
}
g.fill([0, 1, 0], [W - 1, 1, D - 1], "stone_bricks");   // flat deck course
g.set(CX - 1, 1, 0, "polished_andesite"); // placeholder, overwritten below
for (let x = CX - 1; x <= CX + 1; x++) {
  g.set(x, 0, 0, ...B.stairs("stone_brick", "south"));
  g.set(x, 1, 0, "stone_bricks"); g.set(x, 1, 1, ...B.stairs("stone_brick", "south"));
}

// ---- 2. svalgang: posts, rail, deck ---------------------------------------------------------------------------
g.fill([0, 2, 0], [W - 1, 2, D - 1], "air");
const posts = [];
for (const x of [0, 2, 4, 8, 10, 12]) { posts.push([x, 0], [x, D - 1]); }
for (let z = 2; z <= D - 3; z += 2) posts.push([0, z], [W - 1, z]);
for (const [x, z] of posts) g.fill([x, 2, z], [x, 3, z], FRAME);
// rail between posts (y2), skip the entrance gap
for (let x = 1; x < W - 1; x++) for (const z of [0, D - 1]) if (!posts.some(([px, pz]) => px === x && pz === z) && !(z === 0 && x >= CX - 1 && x <= CX + 1) && (x < 4 || x > 8 || z === D - 1) ) g.set(x, 2, z, ...B.fence("spruce"));
for (let z = 1; z < D - 1; z++) for (const x of [0, W - 1]) if (!posts.some(([px, pz]) => px === x && pz === z)) g.set(x, 2, z, ...B.fence("spruce"));
// porch-front rail stubs closed by posts at x=4,8 (porch opening x5..7 left open)
// beam on post tops
for (let x = 0; x < W; x++) for (const z of [0, D - 1]) g.set(x, 4, z, ...B.pillar("stripped_spruce_log", "x"));
for (let z = 1; z < D - 1; z++) for (const x of [0, W - 1]) g.set(x, 4, z, ...B.pillar("stripped_spruce_log", "z"));
// gallery posts' beam y4 at x=0..12 replaced where a post: keep log

// ---- 3. gallery lean-to roof (hip over the whole plan, nave carved out after) -----------------------------------------
roof(g, [[1, 1, W - 2, D - 2]], "hip", { y: 6, pitch: 45, overhang: 1, material: ROOF, eave: "plain", ridge: "none", grow: false, contrast: false, pediment: { face: "north", width: 5, pitch: "steep", tympanum: WALL, cornice: "spruce", oculus: false } });
carve(g, [3, 2, 3], [9, 21, 13]);

// ---- 4. nave walls (x3..9, z3..13, y2..8): spruce planks, dark oak posts ------------------------------------------
const nx0 = 3, nx1 = 9, nz0 = 3, nz1 = 13, ny0 = 2, ny1 = 8;
for (let y = ny0; y <= ny1; y++) for (let x = nx0; x <= nx1; x++) for (const z of [nz0, nz1]) g.set(x, y, z, WALL);
for (let y = ny0; y <= ny1; y++) for (let z = nz0; z <= nz1; z++) for (const x of [nx0, nx1]) g.set(x, y, z, WALL);
// stave posts: corner + every 2 along
for (let y = ny0; y <= ny1; y++) {
  for (const x of [3, 5, 7, 9]) for (const z of [nz0, nz1]) g.set(x, y, z, ...B.pillar("stripped_spruce_log", "y"));
  for (const z of [3, 5, 7, 9, 11, 13]) for (const x of [nx0, nx1]) g.set(x, y, z, ...B.pillar("stripped_spruce_log", "y"));
}
// sill/plate beams
for (let x = nx0; x <= nx1; x++) for (const z of [nz0, nz1]) { g.set(x, ny1, z, ...B.pillar("stripped_spruce_log", "x")); }
for (let z = nz0; z <= nz1; z++) for (const x of [nx0, nx1]) { g.set(x, ny1, z, ...B.pillar("stripped_spruce_log", "z")); }
// portal (north door)
g.fill([CX, 2, nz0], [CX, 4, nz0], "air");
g.set(CX, 2, nz0, ...B.door("dark_oak", "north", "lower", "left"));
g.set(CX, 3, nz0, ...B.door("dark_oak", "north", "upper", "left"));
g.set(CX, 4, nz0, ...B.trapdoor("dark_oak", "north", "top", false));

// ---- 5. tier A roof: gable over the nave, ridge along z ------------------------------------------------------------
roof(g, [[nx0, nz0, nx1, nz1]], "gable", { y: 9, ridgeAxis: "z", pitch: 45, overhang: 1, material: ROOF, gable: WALL, verge: TRIM, eave: "plain", ridge: "slab", grow: false, contrast: false });

// ---- 6. tier B (clerestory) walls + gable roof -----------------------------------------------------------------
const bx0 = 4, bx1 = 8, bz0 = 5, bz1 = 11;
for (let y = 10; y <= 13; y++) for (let x = bx0; x <= bx1; x++) for (let z = bz0; z <= bz1; z++) {
  const edge = x === bx0 || x === bx1 || z === bz0 || z === bz1;
  if (edge) g.set(x, y, z, WALL);
}
for (let y = 10; y <= 13; y++) for (const [x, z] of [[4, 5], [8, 5], [4, 11], [8, 11], [6, 5], [6, 11], [4, 8], [8, 8]]) g.set(x, y, z, ...B.pillar("stripped_spruce_log", "y"));
roof(g, [[bx0, bz0, bx1, bz1]], "gable", { y: 14, ridgeAxis: "z", pitch: 45, overhang: 1, material: ROOF, gable: WALL, verge: TRIM, eave: "plain", ridge: "slab", grow: false, contrast: false });

// ---- 7. belfry + spire ---------------------------------------------------------------------------------------------
for (let y = 15; y <= 16; y++) for (let x = 5; x <= 7; x++) for (let z = 7; z <= 9; z++) {
  if (x === 6 && z === 8) { g.set(x, y, z, "air"); continue; }
  const corner = x !== 6 && z !== 8;
  g.set(x, y, z, corner ? FRAME : (y === 16 ? "air" : WALL));   // y16 centres = louvre openings (filled in the detail pass)
}
roof(g, [[5, 7, 7, 9]], "pyramid", { y: 17, pitch: "steep", overhang: 1, material: ROOF, eave: "plain", ridge: "none", grow: false, contrast: false });

// ---- 7b. dragon heads on the gable ridge ends ----------------------------------------------------------------------
// profile, outward = out of the gable: ridge-end beam, rising neck, head with snout + jaw tooth, horns either side
function dragon(x, zEnd, y, out) {
  const z = (d) => zEnd + out * d, back = out === -1 ? "south" : "north", fwd = out === -1 ? "north" : "south";
  g.set(x, y, z(1), ...B.pillar("stripped_spruce_log", "z"));                      // beam out of the rake end
  g.set(x, y + 1, z(1), ...B.pillar("stripped_spruce_log", "y"));                  // neck rises
  g.set(x, y + 2, z(1), ...B.stairs("spruce", fwd));               // brow
  g.set(x, y + 2, z(2), ...B.trapdoor("spruce", back, "top", false)); // snout
  g.set(x, y + 1, z(2), ...B.fence("spruce"));                     // jaw / tooth
}
for (const x of [3, 9]) { dragon(x, 2, 9, -1); dragon(x, 14, 9, 1); }   // tier A rake corners
for (const x of [3, 9]) { dragon(x, 4, 13, -1); dragon(x, 12, 13, 1); }  // tier B rake corners

// ---- 9. detail ----------------------------------------------------------------------------------------------------
// finial: cross on the spire tip
const fz = (o) => ["spruce_fence", { north: "false", east: "false", south: "false", west: "false", waterlogged: "false", ...o }];
g.set(6, 19, 8, ...fz({})); g.set(6, 20, 8, ...fz({ east: "true", west: "true" })); g.set(5, 20, 8, ...fz({ east: "true" })); g.set(7, 20, 8, ...fz({ west: "true" }));
g.set(6, 21, 8, ...fz({}));
// belfry louvres (open trapdoor slats) + a lantern hung in the middle
for (const [x, z, f] of [[6, 7, "north"], [6, 9, "south"], [5, 8, "west"], [7, 8, "east"]]) g.set(x, 16, z, ...B.trapdoor("dark_oak", f, "bottom", true));
g.set(6, 16, 8, ...B.lantern(true));
// gallery deck: dark planks under the colonnade
for (let x = 1; x < W - 1; x++) for (let z = 1; z < D - 1; z++) if (!(x >= CX - 1 && x <= CX + 1 && z <= 1)) g.set(x, 1, z, "dark_oak_planks");
// portal: arch haunches, lanterns, name boards
g.set(CX - 1, 4, 3, ...B.stairs("spruce", "east", "top")); g.set(CX + 1, 4, 3, ...B.stairs("spruce", "west", "top"));
g.set(CX - 1, 3, 3, ...B.pillar("stripped_spruce_log", "y")); g.set(CX + 1, 3, 3, ...B.pillar("stripped_spruce_log", "y"));
for (const x of [CX - 1, CX + 1]) g.set(x, 3, 0, ...B.lantern(true));
g.set(4, 3, 2, ...B.sign("spruce", ["ST. OLAV", "STAVKIRKE"], { facing: "north", color: "white" }));
g.set(8, 3, 2, ...B.sign("spruce", ["ANNO", "MCXXX"], { facing: "north", color: "white" }));
// back door in the nave's south wall, with lanterns
g.fill([CX, 2, nz1], [CX, 4, nz1], "air");
g.set(CX, 2, nz1, ...B.door("dark_oak", "south", "lower", "right")); g.set(CX, 3, nz1, ...B.door("dark_oak", "south", "upper", "right"));
g.set(CX, 4, nz1, ...B.trapdoor("dark_oak", "south", "top", false));
for (const x of [CX - 1, CX + 1]) g.set(x, 3, D - 1, ...B.lantern(true));
// lattice windows: panes in a timber grid on the upper tiers
function lattice(x, y, z, facing, h = 2) {
  for (let i = 0; i < h; i++) g.set(x, y + i, z, ...B.pane("glass_pane"));
  const side = facing === "north" || facing === "south";
  for (let i = 0; i < h; i++) {
    g.set(x + (side ? -1 : 0), y + i, z + (side ? 0 : -1), ...B.trapdoor("spruce", facing, "bottom", true));
    g.set(x + (side ? 1 : 0), y + i, z + (side ? 0 : 1), ...B.trapdoor("spruce", facing, "bottom", true));
  }
}
lattice(6, 13, 5, "north", 2); lattice(6, 13, 11, "south", 2);
lattice(6, 10, 3, "north", 1); lattice(6, 10, 13, "south", 1);
for (const z of [7, 9]) { g.set(4, 12, z, ...B.pane("glass_pane")); g.set(4, 13, z, ...B.pane("glass_pane")); g.set(8, 12, z, ...B.pane("glass_pane")); g.set(8, 13, z, ...B.pane("glass_pane")); }
// gallery corner lanterns on the posts
for (const [x, z] of [[0, 0], [12, 0], [0, 16], [12, 16]]) g.set(x, 1 + 3, z, ...B.pillar("stripped_spruce_log", "y"));

g.save(OUT);
console.log(JSON.stringify({ saved: OUT, refused: g.refused }));
