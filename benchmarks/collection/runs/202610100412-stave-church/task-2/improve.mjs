// Task 2: clerestory + narrower timber tiers, smaller ground eave. Loads in.nbt, keeps the ground floor (y0-5) as built,
// rebuilds everything above it. Front faces NORTH (-z).
import { Grid, carve, B, roof, load } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const IN = new URL("./in.nbt", import.meta.url).pathname;
const OUT = new URL("./out.nbt", import.meta.url).pathname;
const src = load(IN);
const W = 13, D = 17, H = 28, CX = 6;
const WALL = "dark_oak_planks", FRAME = "stripped_spruce_log", ROOF = "deepslate_tile", TRIM = "spruce";
const g = new Grid([W, H, D]);

// ---- ground floor: keep y0-5 exactly as built ----------------------------------------------------------------------
for (const c of src) if (c.pos[1] <= 5) g.set(c.pos[0], c.pos[1], c.pos[2], c.block, c.state, c.nbt);

// ---- gallery roof: same hip, overhang 1 -> 0 so the ground eave steps in one block each side ---------------------
roof(g, [[1, 1, W - 2, D - 2]], "hip", { y: 6, pitch: 45, overhang: 0, material: ROOF, eave: "plain", ridge: "none", grow: false, contrast: false, pediment: { face: "north", width: 5, pitch: "steep", tympanum: WALL, cornice: "spruce", oculus: false } });
carve(g, [3, 6, 3], [9, H - 1, 13]);

// ---- nave: walls y6-11 with a clerestory band (glass at y9-10) between stave posts ---------------------------------
const nx0 = 3, nx1 = 9, nz0 = 3, nz1 = 13, ny0 = 6, ny1 = 11;
for (let y = ny0; y <= ny1; y++) for (let x = nx0; x <= nx1; x++) for (const z of [nz0, nz1]) g.set(x, y, z, WALL);
for (let y = ny0; y <= ny1; y++) for (let z = nz0; z <= nz1; z++) for (const x of [nx0, nx1]) g.set(x, y, z, WALL);
for (let y = 9; y <= 10; y++) {
  for (const z of [4, 6, 8, 10, 12]) for (const x of [nx0, nx1]) g.set(x, y, z, ...B.pane("glass_pane"));
  for (const x of [4, 6, 8]) for (const z of [nz0, nz1]) g.set(x, y, z, ...B.pane("glass_pane"));
}
for (let y = ny0; y <= ny1; y++) {
  for (const x of [3, 5, 7, 9]) for (const z of [nz0, nz1]) g.set(x, y, z, ...B.pillar(FRAME, "y"));
  for (const z of [3, 5, 7, 9, 11, 13]) for (const x of [nx0, nx1]) g.set(x, y, z, ...B.pillar(FRAME, "y"));
}
for (let x = nx0; x <= nx1; x++) for (const z of [nz0, nz1]) g.set(x, ny1, z, ...B.pillar(FRAME, "x"));
for (let z = nz0; z <= nz1; z++) for (const x of [nx0, nx1]) g.set(x, ny1, z, ...B.pillar(FRAME, "z"));

// ---- tier A roof: gable over the 7-wide nave, base y12 ------------------------------------------------------------
roof(g, [[nx0, nz0, nx1, nz1]], "gable", { y: 12, ridgeAxis: "z", pitch: 45, overhang: 1, material: ROOF, gable: WALL, verge: TRIM, eave: "plain", ridge: "slab", grow: false, contrast: false });

// ---- tier B: narrower 5-wide timber box on a collar, y14-19, own gable roof at y20 -----------------------------
const bx0 = 4, bx1 = 8, bz0 = 5, bz1 = 11;
for (let y = 14; y <= 15; y++) for (let x = bx0; x <= bx1; x++) for (let z = bz0; z <= bz1; z++) g.set(x, y, z, WALL);
for (let y = 16; y <= 19; y++) for (let x = bx0; x <= bx1; x++) for (let z = bz0; z <= bz1; z++) {
  const edge = x === bx0 || x === bx1 || z === bz0 || z === bz1;
  if (edge) g.set(x, y, z, WALL);
}
for (let y = 16; y <= 19; y++) for (const [x, z] of [[4, 5], [8, 5], [4, 11], [8, 11], [6, 5], [6, 11], [4, 8], [8, 8]]) g.set(x, y, z, ...B.pillar(FRAME, "y"));
for (const z of [7, 9]) for (const x of [bx0, bx1]) for (const y of [17, 18]) g.set(x, y, z, ...B.pane("glass_pane"));
function lattice(x, y, z, facing, h = 2) {
  for (let i = 0; i < h; i++) g.set(x, y + i, z, ...B.pane("glass_pane"));
  const side = facing === "north" || facing === "south";
  for (let i = 0; i < h; i++) {
    g.set(x + (side ? -1 : 0), y + i, z + (side ? 0 : -1), ...B.trapdoor("spruce", facing, "bottom", true));
    g.set(x + (side ? 1 : 0), y + i, z + (side ? 0 : 1), ...B.trapdoor("spruce", facing, "bottom", true));
  }
}
lattice(6, 17, 5, "north", 2); lattice(6, 17, 11, "south", 2);
roof(g, [[bx0, bz0, bx1, bz1]], "gable", { y: 20, ridgeAxis: "z", pitch: 45, overhang: 1, material: ROOF, gable: WALL, verge: TRIM, eave: "plain", ridge: "slab", grow: false, contrast: false });

// ---- belfry + spire: y21-22, pyramid base y23 ---------------------------------------------------------------------
for (let y = 21; y <= 22; y++) for (let x = 5; x <= 7; x++) for (let z = 7; z <= 9; z++) {
  if (x === 6 && z === 8) { g.set(x, y, z, "air"); continue; }
  const corner = x !== 6 && z !== 8;
  g.set(x, y, z, corner ? FRAME : (y === 22 ? "air" : WALL));
}
roof(g, [[5, 7, 7, 9]], "pyramid", { y: 23, pitch: "steep", overhang: 1, material: ROOF, eave: "plain", ridge: "none", grow: false, contrast: false });

// ---- dragon heads on the gable rake ends of both tiers ---------------------------------------------------------------
function dragon(x, zEnd, y, out) {
  const z = (d) => zEnd + out * d, back = out === -1 ? "south" : "north", fwd = out === -1 ? "north" : "south";
  g.set(x, y, z(1), ...B.pillar(FRAME, "z"));
  g.set(x, y + 1, z(1), ...B.pillar(FRAME, "y"));
  g.set(x, y + 2, z(1), ...B.stairs("spruce", fwd));
  g.set(x, y + 2, z(2), ...B.trapdoor("spruce", back, "top", false));
  g.set(x, y + 1, z(2), ...B.fence("spruce"));
}
for (const x of [3, 9]) { dragon(x, 2, 12, -1); dragon(x, 14, 12, 1); }
for (const x of [3, 9]) { dragon(x, 4, 19, -1); dragon(x, 12, 19, 1); }

// ---- finial on the spire tip ----------------------------------------------------------------------------------------
const fz = (o) => ["spruce_fence", { north: "false", east: "false", south: "false", west: "false", waterlogged: "false", ...o }];
g.set(6, 25, 8, ...fz({})); g.set(6, 26, 8, ...fz({ east: "true", west: "true" })); g.set(5, 26, 8, ...fz({ east: "true" })); g.set(7, 26, 8, ...fz({ west: "true" }));
g.set(6, 27, 8, ...fz({}));
// belfry louvres + hung lantern
for (const [x, z, f] of [[6, 7, "north"], [6, 9, "south"], [5, 8, "west"], [7, 8, "east"]]) g.set(x, 22, z, ...B.trapdoor("dark_oak", f, "bottom", true));
g.set(6, 22, 8, ...B.lantern(true));

g.save(OUT);
console.log(JSON.stringify({ saved: OUT, refused: g.refused }));
