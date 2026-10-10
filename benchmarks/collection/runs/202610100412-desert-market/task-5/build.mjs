// Desert adobe market hall. Front faces NORTH (-z), x along the street. Grid 17 x 9 x 13.
// Body: two overlapping rectangles (chamfered / "rounded" plan corners), walls 2 thick, one 4-block storey
// (floor y0, clear y1..3, flat deck y4); street apron + 2-deep striped awnings in front; dome + wind tower on the deck.
import { Grid, B, dome, arch, roof, paint } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

let g = new Grid([17, 9, 13]);
const OUT = process.env.OUT ?? "build.nbt";
const put = (x, y, z, ...p) => g.set(x, y, z, ...p);
const fill = (a, b, blk, s) => g.fill(a, b, blk, s);
const stairs = (x, y, z, m, f, h = "bottom") => put(x, y, z, ...B.stairs(m, f, h));
const slab = (x, y, z, m, t = "bottom") => put(x, y, z, ...B.slab(m, t));
const log = (x, y, z, m, a = "y") => put(x, y, z, ...B.log(m, a));
const fence = (x, y, z, m = "spruce") => put(x, y, z, ...B.fence(m));
const pot = (x, y, z) => put(x, y, z, "decorated_pot");
const barrel = (x, y, z) => put(x, y, z, "barrel", { facing: "up" });

const WALL = "sandstone", TRIM = "mud_brick", PLINTH = "mud_bricks", BAND = "orange_terracotta";
const DECK = 4;                                                          // deck course (wall top + 1)

// ---- plan: outer union and the interior (shrunk by 2 = 2-thick walls) ----
const R1 = [1, 3, 15, 10], R2 = [2, 2, 14, 11];                          // x0,z0,x1,z1
const inRect = (r, x, z) => x >= r[0] && x <= r[2] && z >= r[1] && z <= r[3];
const shrink = (r, n) => [r[0] + n, r[1] + n, r[2] - n, r[3] - n];
const outer = (x, z) => inRect(R1, x, z) || inRect(R2, x, z);
const inner = (x, z) => inRect(shrink(R1, 2), x, z) || inRect(shrink(R2, 2), x, z);

// ---- street apron, floor, walls ----
fill([1, 0, 0], [15, 0, 1], "smooth_sandstone");                                  // paved apron under the awnings
for (let x = 1; x <= 15; x++) for (let z = 0; z <= 1; z++) if ((x + z) % 4 === 0) put(x, 0, z, BAND);
for (let x = 0; x < 17; x++) for (let z = 0; z < 13; z++) {
  if (!outer(x, z)) continue;
  put(x, 0, z, inner(x, z) ? ((x + z) % 2 ? "smooth_sandstone" : BAND) : "cut_sandstone");
  for (let y = 1; y < DECK; y++) put(x, y, z, inner(x, z) ? "air" : WALL);
}
// plinth course, and orange terracotta stripe bands on the corner and mid piers
for (let x = 0; x < 17; x++) for (let z = 0; z < 13; z++) {
  if (!outer(x, z) || inner(x, z)) continue;
  const edge = [-1, 0, 1].some((dx) => [-1, 0, 1].some((dz) => !outer(x + dx, z + dz)));
  if (!edge) continue;
  put(x, 1, z, PLINTH);
  if ((x <= 3 || x >= 13) && (z <= 4 || z >= 9)) { put(x, 2, z, BAND); put(x, 3, z, BAND); }
}
for (const x of [6, 10]) for (const z of [2, 3]) { put(x, 2, z, BAND); put(x, 3, z, BAND); }

// ---- front arcade: two segmental stall openings and a grand round entrance arch ----
for (const x0 of [3, 11]) arch(g, { at: [x0, 1, 2], width: 3, height: 3, depth: 2, axis: "x", profile: "segmental", block: WALL });
arch(g, { at: [7, 1, 2], width: 3, height: 3, depth: 2, axis: "x", profile: "round", block: WALL, frame: "dark_oak_planks" });

// ---- striped cloth awnings (5 wide, 2 deep) on spruce posts: red-sandstone / quartz stair stripes ----
for (const x0 of [2, 10]) for (let i = 0; i < 5; i++) {
  const m = i % 2 === 0 ? "red_sandstone" : "smooth_quartz";
  stairs(x0 + i, 3, 0, m, "south");
  stairs(x0 + i, 3, 1, m, "south");
}
for (const x of [2, 6, 10, 14]) { fence(x, 1, 0); fence(x, 2, 0); }
for (const x of [4, 12]) put(x, 2, 0, ...B.lantern(true));                            // hung under the awning lip
put(8, 3, 3, ...B.lantern(true));                                                      // lantern in the arch
put(7, 4, 1, ...B.sign("spruce", ["MARKET"], { facing: "north", color: "black" }));   // name signs flank the centre viga
put(9, 4, 1, ...B.sign("spruce", ["HALL"], { facing: "north", color: "black" }));

// ---- vigas: dark oak beam ends 1 proud, every 2nd cell, on all four sides ----
for (let x = 2; x <= 14; x += 2) { log(x, 4, 1, "dark_oak", "z"); log(x, 4, 12, "dark_oak", "z"); }
for (const z of [3, 5, 8, 10]) { log(0, 4, z, "dark_oak", "x"); log(16, 4, z, "dark_oak", "x"); }

// ---- roof: flat deck + parapet by style ----
const rr = roof(g, [R1, R2], "flat-parapet", { y: DECK, material: "mud_brick", trim: TRIM, parapet: 1, eave: "plain", gable: WALL });
console.log("roof", JSON.stringify({ top: rr.top, refused: rr.refused?.length, notes: rr.notes }));

// ---- dome (pointed, on the deck) and wind tower with a vent slot in each face ----
dome(g, { center: [7, DECK, 7], radius: 3, height: 4.5, profile: "pointed", block: WALL });
fill([11, 5, 8], [13, 7, 10], WALL);
for (const y of [6, 7]) { put(12, y, 8, "dark_oak_planks"); put(12, y, 10, "dark_oak_planks"); put(11, y, 9, "dark_oak_planks"); put(13, y, 9, "dark_oak_planks"); }
fill([11, 8, 8], [13, 8, 10], "red_sandstone_slab", { type: "bottom", waterlogged: "false" });
log(10, 6, 9, "dark_oak", "x"); log(14, 6, 9, "dark_oak", "x"); log(12, 6, 7, "dark_oak", "z");   // beam stubs

// ---- side and back openings: slit windows with open spruce shutters, a back door ----
// side windows: a round-headed arch through the 2-thick wall (z6..7), glazed from inside, sill slab, no shutters
arch(g, { at: [1, 2, 6], width: 2, height: 2, depth: 2, axis: "z", profile: "round", block: WALL });
arch(g, { at: [14, 2, 6], width: 2, height: 2, depth: 2, axis: "z", profile: "round", block: WALL });
for (const z of [6, 7]) for (const y of [2, 3]) for (const x of [2, 14]) if (g.blockAt(x, y, z) === "minecraft:air") put(x, y, z, "glass_pane");
for (const z of [6, 7]) { slab(1, 1, z, "sandstone", "top"); slab(15, 1, z, "sandstone", "top"); }
// side doors (west and east, z5): spruce doors through the 2-thick walls, lantern hung beside
for (const [xo, xi, f] of [[1, 2, "west"], [15, 14, "east"]]) {
  for (const y of [1, 2]) { put(xi, y, 5, "air"); put(xo, y, 5, "air"); }
  put(xo, 1, 5, ...B.door("spruce", f, "lower")); put(xo, 2, 5, ...B.door("spruce", f, "upper"));
  put(xo + (f === "west" ? -1 : 1), 3, 5, ...B.lantern(true)); put(xo + (f === "west" ? -1 : 1), 4, 5, ...B.log("dark_oak", "x"));
}
fill([0, 0, 3], [0, 0, 10], "smooth_sandstone"); fill([16, 0, 3], [16, 0, 10], "smooth_sandstone");   // doorstep paving outside the side doors
// back: two slit windows with open shutters either side of the door
for (const x of [4, 12]) for (const y of [2, 3]) {
  put(x, y, 11, "air"); put(x, y, 10, "glass_pane");
  put(x - 1, y, 12, ...B.trapdoor("spruce", "south", "bottom", true)); put(x + 1, y, 12, ...B.trapdoor("spruce", "south", "bottom", true));
}
for (const y of [1, 2]) { put(8, y, 11, "air"); put(8, y, 10, "air"); }
put(8, 1, 11, ...B.door("spruce", "south", "lower")); put(8, 2, 11, ...B.door("spruce", "south", "upper"));
put(8, 3, 12, ...B.lantern(true));                                                      // hung from the centre viga above the back door

// ---- stalls, pots, baskets (street side, under the awnings) ----
for (const [x0, flip] of [[3, 1], [11, -1]]) {
  for (let i = 0; i < 3; i++) slab(x0 + i, 1, 3, "spruce", "top");                  // stall counter in the opening
  put(x0, 2, 3, "potted_cactus"); pot(x0 + 1, 2, 3); put(x0 + 2, 2, 3, "composter");
  barrel(x0 + 1, 1, 4); put(x0 + (flip > 0 ? 2 : 0), 1, 4, "hay_block"); pot(x0 + 1, 2, 4);
  barrel(x0, 1, 1); pot(x0 + 1, 1, 1); put(x0 + 2, 1, 1, "hay_block");
}
for (const x of [2, 14]) put(x, 1, 1, "potted_fern");
for (const x of [6, 10]) pot(x, 1, 1);
put(9, 1, 1, "potted_dead_bush"); put(7, 1, 1, "potted_cactus");
// interior: runner, lanterns under the ceiling, goods along the side walls
for (let z = 4; z <= 9; z++) put(8, 1, z, z % 2 ? "white_carpet" : "orange_carpet");
for (const z of [5, 8]) for (const x of [6, 10]) put(x, 3, z, ...B.lantern(true));
for (const [x, z, b] of [[4, 6, "barrel"], [4, 7, "hay_block"], [12, 6, "hay_block"], [12, 7, "barrel"], [4, 9, "barrel"], [12, 9, "barrel"]]) b === "barrel" ? barrel(x, 1, z) : put(x, 1, z, b);
pot(4, 2, 6); pot(12, 2, 7); pot(5, 1, 9); pot(11, 1, 9);

// ---- deck: shade cloth (striped slabs on fence posts), crates, plants ----
for (const [x, z] of [[11, 3], [13, 3], [11, 6], [13, 6]]) { fence(x, 5, z); fence(x, 6, z); }
for (let x = 11; x <= 13; x++) for (let z = 3; z <= 6; z++) slab(x, 7, z, x % 2 ? "red_sandstone" : "quartz");
barrel(12, 5, 4); put(12, 5, 5, "hay_block"); put(11, 5, 4, "potted_cactus"); pot(13, 5, 5);
for (const [x, z] of [[3, 3], [3, 5], [3, 8], [10, 10]]) put(x, 5, z, "flowering_azalea");
barrel(10, 5, 3); put(10, 5, 5, "composter");
// dome finial: a lightning rod on the tip if the box allows
for (let y = 8; y >= DECK; y--) if (g.blockAt(7, y, 7) !== "minecraft:air") { if (y + 1 < 9) put(7, y + 1, 7, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" }); break; }
// dome: orange band on its second ring (keeps each stair's own state)
for (let x = 3; x <= 11; x++) for (let z = 3; z <= 11; z++) {
  const c = g.get(x, 5, z);
  if (c && /^minecraft:sandstone_stairs$/.test(c.block)) put(x, 5, z, "red_sandstone_stairs", c.state);
}
// spruce railing on the parapet: front run in three panels and the back; sides left open for the vigas to read
const pr = paint(g, `roof z 2 x 3..6 -> railing spruce_fence force
roof z 2 x 7..9 -> railing spruce_fence force
roof z 2 x 10..13 -> railing spruce_fence force
roof z 11 x 3..13 -> railing spruce_fence force`);
console.log("railing", JSON.stringify(pr.report));
g = pr.grid;
if (process.env.WEATHER === "1") {
  const wr = paint(g, `all faces where sandstone -> vary subtle\nall faces ground row -> weather light`);
  console.log("weather", JSON.stringify(wr.report));
  g = wr.grid;
}
g.save(OUT);
console.log(JSON.stringify({ saved: OUT, size: g.size, refused: g.refused }));
