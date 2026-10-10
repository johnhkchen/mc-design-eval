// Settlers' League hall — banner shop on an old deepslate stall base. Front faces NORTH (-z).
// v2: real gable roof with eaves + verges, ordered side walls (posts, band, windows), balcony + flags on all sides.
import { Grid, B } from "../../../../../minecraft-design/tools/src/build.mjs";
import { gableRoof } from "../../../../../minecraft-design/tools/src/shapes-massing.mjs";

const OX = 1;                                  // grid x = building x + 1 (room for the roof overhang)
const g = new Grid([9, 11, 10]);
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/benchmarks/collection/runs/202610100218-settlers-league/build.nbt";
const Z0 = 1, Z1 = 8;                          // building z = 1..8; z = 0 is awning / balcony / stoop
const ROOF = process.env.ROOF ?? "stone_brick";
const set = (x, y, z, b, s) => g.set(x + OX, y, z, b, s);
const put = (x, y, z, ...p) => g.set(x + OX, y, z, ...p);
const fill = (a, b, blk, s) => g.fill([a[0] + OX, a[1], a[2]], [b[0] + OX, b[1], b[2]], blk, s);
const stairs = (x, y, z, m, f, h = "bottom") => put(x, y, z, ...B.stairs(m, f, h));
const slab = (x, y, z, m, t = "bottom") => put(x, y, z, ...B.slab(m, t));
const log = (x, y, z, m, a = "y") => put(x, y, z, ...B.log(m, a));

// ---- base: old deepslate stall (cracked, a little moss) ----
fill([0, 0, Z0], [6, 0, Z1], "deepslate_bricks");
for (const [x, z] of [[0,1],[2,1],[5,2],[6,4],[0,6],[3,8],[6,7],[1,8],[0,3]]) set(x, 0, z, "cracked_deepslate_bricks");
for (const [x, z] of [[1,1],[4,1],[6,2],[0,5]]) set(x, 0, z, "mossy_cobblestone");
fill([1, 0, 2], [5, 0, 7], "spruce_planks");                      // shop floor
for (let x = 0; x <= 6; x++) slab(x, 0, 0, "cobbled_deepslate");  // stoop
for (let x = 2; x <= 4; x++) stairs(x, 0, 0, "deepslate_brick", "south");

// ---- walls: deepslate bricks, y1..6, hollow ----
fill([0, 1, Z0], [6, 6, Z1], "deepslate_bricks");
fill([1, 1, Z0], [5, 6, Z1 - 1], "air");
for (const [x, y, z] of [[0,1,3],[6,2,6],[0,4,5],[6,1,4],[3,1,8],[4,3,8]]) set(x, y, z, "cracked_deepslate_bricks");

// ---- side walls: oak posts at both corners, oak band at the floor line, 2 + 2 real windows ----
for (const x of [0, 6]) {
  for (let y = 1; y <= 6; y++) { log(x, y, Z0, "stripped_oak"); log(x, y, Z1, "stripped_oak"); }
  for (let z = 2; z <= 7; z++) log(x, 3, z, "stripped_oak", "z");                       // floor-line band
  for (let z = 2; z <= 7; z++) set(x, 4, z, "polished_deepslate");                       // sill course under the upper windows
  for (const z of [2, 3, 6, 7]) {
    for (const y of [1, 2, 5, 6]) put(x, y, z, "glass_pane", { north: "true", south: "true" });
  }
}
// side flags: market-stall origin visible from every angle
for (const [x, z, y, c1, c2] of [[-1, 4, 5, "red", "white"], [-1, 5, 1, "blue", "blue"], [7, 5, 5, "yellow", "white"], [7, 4, 1, "lime", "lime"]]) {
  set(x, y, z, `${c1}_wool`); set(x, y + 1, z, `${c2}_wool`);
}
put(-1, 4, 4, ...B.lantern(true)); put(7, 4, 5, ...B.lantern(true));

// ---- back wall: two upper windows + a flag so the back is not blank ----
for (const x of [2, 4]) for (const y of [5, 6]) set(x, y, Z1, "glass_pane", { east: "true", west: "true" });
for (const x of [1, 2, 3, 4, 5]) log(x, 3, Z1, "stripped_oak", "x");
for (const x of [1, 2, 3, 4, 5]) set(x, 4, Z1, "polished_deepslate");
set(3, 5, Z1 + 1, "cyan_wool"); set(3, 6, Z1 + 1, "white_wool");

// ---- front (z=1): oak corner posts, shop opening, beam, upper windows ----
for (let y = 1; y <= 6; y++) { log(0, y, Z0, "stripped_oak"); log(6, y, Z0, "stripped_oak"); }
for (let y = 1; y <= 6; y++) { log(0, y, 0, "oak"); log(6, y, 0, "oak"); }          // proud pilasters carried up past the balcony
for (let x = 1; x <= 5; x++) log(x, 3, Z0, "stripped_oak", "x");                    // shopfront beam
for (const x of [1, 2, 4, 5]) {
  set(x, 1, Z0, "oak_planks");
  put(x, 1, 0, ...B.trapdoor("spruce", "north", "bottom", true));
  slab(x, 2, 0, "spruce", "bottom");
  set(x, 2, Z0, "air");
}
put(3, 1, Z0, ...B.door("oak", "north", "lower"));
put(3, 2, Z0, ...B.door("oak", "north", "upper"));
fill([1, 4, Z0], [5, 4, Z0], "deepslate_tiles");
for (const x of [1, 2, 4, 5]) for (const y of [5, 6]) {
  set(x, y, Z0, "air");
  put(x, y, Z0 + 1, "glass_pane", { east: "true", west: "true" });
  set(x, y, Z0 + 2, "air");
}
for (const x of [1, 2, 4, 5]) slab(x, 5, Z0, "polished_deepslate", "bottom");
set(3, 5, Z0, "deepslate_bricks"); set(3, 6, Z0, "deepslate_bricks");

// ---- awning as balcony deck: striped wool at y4 z=0, rail above, sign board on the pier ----
for (let x = 1; x <= 5; x++) set(x, 4, 0, x % 2 ? "white_wool" : "cyan_wool");
for (const x of [1, 2, 4, 5]) set(x, 5, 0, "spruce_fence");
set(2, 6, 0, "spruce_planks"); set(3, 6, 0, "cyan_wool"); set(4, 6, 0, "spruce_planks");   // hung sign board
set(3, 5, 0, "spruce_fence");
for (const x of [0, 6]) put(x, 3, 0, ...B.lantern(true));
// hanging banners (wool pennants — the viewer draws banner entities as wood boxes)
const cols = { 1: "red", 2: "yellow", 3: "orange", 4: "lime", 5: "blue" };
for (const [x, c] of Object.entries(cols)) set(+x, 3, 0, `${c}_wool`);
for (const [x, c] of Object.entries({ 1: "purple", 5: "red" })) set(+x, 2, 0, `${c}_wool`);

// ---- interior ----
fill([1, 3, 2], [5, 3, Z1 - 1], "spruce_planks");
for (const [x, y, z] of [[1,1,7],[2,1,7],[5,1,7],[5,1,6]]) set(x, y, z, "barrel", { facing: "up" });
set(3, 1, 7, "bookshelf"); set(4, 1, 7, "bookshelf"); set(2, 2, 7, "bookshelf"); set(4, 2, 7, "bookshelf");
put(3, 2, 7, ...B.lantern(false));
fill([1, 4, 7], [5, 4, 7], "spruce_planks");
["red", "yellow", "blue", "lime", "purple"].forEach((c, i) => set(1 + i, 5, 7, `${c}_wool`));
for (const x of [1, 5]) set(x, 4, 2, "spruce_planks");
fill([2, 4, 4], [4, 4, 4], "spruce_planks");
set(3, 5, 4, "oak_pressure_plate");
put(3, 6, 3, ...B.lantern(true));
put(1, 4, 3, "lantern", { hanging: "false" }); put(5, 4, 3, "lantern", { hanging: "false" });

// ---- roof: real gable, stair courses, 1-block overhang at eaves and verges ----
const rr = gableRoof(g, {
  from: [0 + OX, 7, Z0], to: [6 + OX, Z1], ridge: "z", material: ROOF, gableBlock: "deepslate_bricks",
  overhang: 1, pitch: 1, verge: { block: "stripped_oak" },
});
console.log("roof", JSON.stringify(rr.bounds), rr.refused?.length);
for (let x = 1; x <= 5; x++) set(x, 7, Z0, "stripped_oak");                          // timber line in the pediment
set(3, 8, Z0, "cyan_wool"); set(3, 9, Z0, "white_wool");
g.save(OUT);
console.log(JSON.stringify({ saved: OUT, refused: g.refused }));
