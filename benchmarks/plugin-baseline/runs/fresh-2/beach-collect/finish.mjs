// Stage 3 — FINISH: openings that read, craft brushes, life, site. Input: stage2.nbt (form + cafe roof). Output: build.nbt
import { load, B, signboard, planter, fixture, boulder } from "../../../../../../minecraft-design/tools/src/build.mjs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
const HERE = dirname(fileURLToPath(import.meta.url));
const g = load(join(HERE, "stage2.nbt"));

const WOOD = "birch", DECK = "birch_planks", GLASS = "light_blue_stained_glass_pane";
const rnd = (() => { let s = 7; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32); })();
const log = (msg, r) => { if (r?.refused?.length || r?.notes?.length) console.log(msg, JSON.stringify(r.notes ?? r.refused)); };

// ---- glass: tint the clear panes so glazing reads as glass against the white walls -------------------------------
for (const c of g.cells.values()) if (c.block === "minecraft:glass_pane" && c.pos[1] >= 3) g.set(...c.pos, GLASS);   // (terrace balustrade included)

// ---- doors in the glass walls (real doors) --------------------------------------------------------------------------
const door = (x, z, facing, hinge) => { g.set(x, 3, z, ...B.door(WOOD, facing, "lower", hinge)); g.set(x, 4, z, ...B.door(WOOD, facing, "upper", hinge)); };
const door2 = (x, z, facing, hinge) => { g.set(x, 8, z, ...B.door(WOOD, facing, "lower", hinge)); g.set(x, 9, z, ...B.door(WOOD, facing, "upper", hinge)); };
door(15, 22, "south", "left"); door(16, 22, "south", "right");            // L south: sliding pair to the deck
door(25, 16, "east", "left"); door(25, 17, "east", "right");              // L east: to the carport terrace
door2(13, 16, "west", "left"); door2(13, 17, "west", "right");            // U west: to the roof terrace
for (let y = 3; y <= 6; y++) if (y > 4) for (const x of [15, 16]) g.set(x, y, 22, GLASS);     // transom over the L south doors
for (const z of [16, 17]) for (const y of [5, 6]) g.set(25, y, z, GLASS);
for (const z of [16, 17]) for (const y of [10]) g.set(13, y, z, GLASS);

// ---- ENTRY: stepping-stone path, step, porch lights, house sign, slat screen, bed -------------------------------
for (const z of [0, 1, 3, 4, 6, 7]) for (const x of [21, 22]) g.set(x, 1, z, "smooth_stone");
for (const x of [20, 21, 22]) { g.set(x, 1, 8, "smooth_stone"); g.set(x, 1, 9, "smooth_stone"); }
for (const x of [20, 21, 22]) g.set(x, 2, 9, ...B.stairs("smooth_stone", "south"));
g.set(20, 6, 10, ...B.lantern(true)); g.set(22, 6, 10, ...B.lantern(true));
for (const y of [4, 5]) for (const x of [23, 24]) g.set(x, y, 10, "gray_concrete");          // dark house-number panel
g.set(23, 4, 9, ...B.sign(WOOD, ["", "12", "", ""], { facing: "north", color: "white", glow: true }));
g.set(24, 4, 9, ...B.sign(WOOD, ["", "DUNE", "WALK", ""], { facing: "north", color: "white", glow: true }));
// slat screen, west of the entry: stripped-birch slats on a slab beam, garden room behind it
for (let x = 5; x <= 12; x++) for (let y = 3; y <= 6; y++) g.set(x, y, 6, ...B.trapdoor(WOOD, "east", "bottom", true));   // slat fins
for (let x = 5; x <= 12; x++) g.set(x, 7, 6, ...B.slab(WOOD, "bottom"));
for (let x = 5; x <= 12; x++) g.set(x, 2, 6, "gray_concrete");
for (const x of [5, 12]) for (let y = 3; y <= 6; y++) g.set(x, y, 6, "stripped_birch_log", { axis: "y" });
// beds: dune-grass planting along the north wall
for (let x = 5; x <= 13; x++) for (let z = 7; z <= 9; z++) {
  g.set(x, 1, z, rnd() < 0.8 ? "grass_block" : "coarse_dirt", rnd() < 0 ? {} : undefined);
  if (rnd() < 0.55) g.set(x, 2, z, ...B.block(rnd() < 0.7 ? "short_grass" : "fern"));
}
for (const [x, z] of [[7, 8], [11, 8]]) g.set(x, 2, z, ...B.block("azalea"));
planter(g, { at: [14, 2, 10], face: "north", width: 4, kind: "ground", depth: 1 });

// ---- SOUTH DECK: pool, loungers, parasol, glass balustrade, steps ---------------------------------------------------
// plunge pool (water flush with the deck, quartz coping)
for (let x = 5; x <= 13; x++) for (let z = 24; z <= 29; z++) g.set(x, 2, z, "smooth_quartz");
for (let x = 6; x <= 12; x++) for (let z = 25; z <= 28; z++) { g.set(x, 1, z, "light_blue_concrete"); g.set(x, 2, z, "water", { level: "0" }); }
// loungers: head (stairs) + two slabs + a towel
const lounger = (x, z, towel, y = 3) => {
  g.set(x, y, z, ...B.stairs("smooth_quartz", "north")); g.set(x, y, z + 1, ...B.slab("smooth_quartz", "bottom")); g.set(x, y, z + 2, ...B.slab("smooth_quartz", "bottom"));
  g.set(x, y + 1, z + 1, `${towel}_carpet`);
};
lounger(15, 27, "light_blue"); lounger(17, 27, "white"); 
// parasol: 3 tall pole, striped wool canopy, radius 2
function canopy(cx, cz) {
  for (let y = 3; y <= 5; y++) g.set(cx, y, cz, ...B.fence(WOOD));
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) {
    if (Math.abs(dx) === 2 && Math.abs(dz) === 2) continue;
    const stripe = (dx + 2) % 2 === 0;
    g.set(cx + dx, 6, cz + dz, stripe ? "light_blue_wool" : "white_wool");
  }
  g.set(cx, 7, cz, ...B.fence(WOOD));
}
canopy(30, 28);
lounger(27, 27, "white"); lounger(33, 27, "light_blue");
// glass balustrade along the deck edge and the pool's open side (frameless: tinted panes, one high), gaps at the steps
for (let x = 4; x <= 37; x++) if (![16, 17, 18, 19, 30, 31, 32].includes(x)) g.set(x, 3, 30, GLASS);
for (let z = 23; z <= 30; z++) { g.set(4, 3, z, GLASS); g.set(37, 3, z, GLASS); }
for (let x of [4, 37]) g.set(x, 3, 30, "quartz_pillar", { axis: "y" });
// stair landing wider: second step down to sand
for (const sx of [16, 17, 18, 19, 30, 31, 32]) { g.set(sx, 1, 32, "smooth_quartz"); }
// jetty from the south steps into the sea
for (let z = 32; z <= 37; z++) for (const x of [17, 18]) g.set(x, 2, z, DECK);
for (let z = 33; z <= 37; z += 2) for (const x of [17, 18]) g.set(x, 1, z, ...B.log("stripped_birch", "y"));
g.set(17, 3, 37, ...B.fence(WOOD)); g.set(18, 3, 37, ...B.fence(WOOD)); g.set(18, 4, 37, ...B.lantern(false));

// ---- UNDERCROFT (carport terrace): fire pit, benches, surfboards, lanterns ----------------------------------------
// fire pit: campfire in a ring of stone slabs, with log-seat benches
g.set(31, 2, 17, "smooth_stone"); g.set(31, 3, 17, "campfire", { lit: "true", facing: "north", signal_fire: "false", waterlogged: "false" });
for (const [dx, dz] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1]]) g.set(31 + dx, 3, 17 + dz, ...B.slab("smooth_stone", "bottom"));
for (const [x, z, f] of [[31, 14, "south"], [31, 20, "north"], [28, 17, "east"], [34 - 1, 17, "west"]]) g.set(x, 3, z, ...B.stairs("smooth_quartz", f));
// surfboards on the L east wall (wall banners), a fence rack rail under them
const board = (z, base, stripe, rim) => {
  g.set(26, 6, z, ...B.banner(base, [["stripe_center", stripe], ["border", rim]], { facing: "east" }));
  g.set(26, 4, z, ...B.banner(base, [["stripe_center", stripe], ["border", rim]], { facing: "east" }));
};
board(11, "white", "light_blue", "white"); board(12, "light_blue", "white", "light_blue"); board(20, "light_blue", "white", "light_blue"); board(21, "white", "light_blue", "white");
// lights: hanging lanterns under the cantilever soffit on the rhythm
for (const [x, z] of [[27, 12], [27, 22], [33, 12], [33, 22], [30, 17]]) g.set(x, 6, z, ...B.lantern(true));
// coffee table + a low planter in the carport corner
for (let x = 27; x <= 29; x++) g.set(x, 3, 24, "smooth_quartz");
for (let x = 27; x <= 29; x++) g.set(x, 4, 24, "azalea");

// ---- INTERIOR (seen through the glazing): living, kitchen island, stair, bedroom -----------------------------------
// stair flight up along the north wall (z=11) with the head-room slot cut in the U floor
for (let k = 0; k <= 4; k++) g.set(14 + k, 3 + k, 11, ...B.stairs(WOOD, "east"));
g.set(16, 7, 11, "air"); g.set(17, 7, 11, "air");
// living room: rug, sofa facing the sea, low table, lamp
for (let x = 8; x <= 13; x++) for (let z = 15; z <= 18; z++) g.set(x, 3, z, "light_gray_carpet");
for (let x = 8; x <= 13; x++) g.set(x, 3, 14, ...B.stairs("smooth_quartz", "north"));
g.set(7, 3, 14, ...B.block("smooth_quartz")); g.set(14, 3, 14, ...B.block("smooth_quartz"));
for (let x = 9; x <= 12; x++) g.set(x, 3, 17, ...B.slab(WOOD, "bottom"));
g.set(14, 3, 13, ...B.fence(WOOD)); g.set(14, 4, 13, "lantern", { hanging: "false", waterlogged: "false" });
// kitchen island + stools
for (let x = 18; x <= 22; x++) { g.set(x, 3, 17, "smooth_quartz"); g.set(x, 4, 17, ...B.slab("smooth_quartz", "bottom")); }
for (let x = 19; x <= 21; x++) g.set(x, 3, 19, ...B.trapdoor(WOOD, "north", "bottom", false));
// bedroom upstairs
g.set(24, 8, 22, "white_bed", { facing: "north", part: "foot", occupied: "false" }); g.set(24, 8, 21, "white_bed", { facing: "north", part: "head", occupied: "false" });
g.set(22, 8, 21, ...B.slab(WOOD, "bottom")); g.set(26, 8, 21, ...B.slab(WOOD, "bottom"));
for (let x = 17; x <= 30; x++) g.set(x, 8, 12, ...B.block("bookshelf"));

// ---- ROOF TERRACE (L roof): lounger pair, planter box, low table ---------------------------------------------------
lounger(7, 15, "light_blue", 8); lounger(10, 15, "white", 8);   // on the roof terrace (y8), not inside the living room
for (let x = 6; x <= 11; x++) { g.set(x, 8, 11, "smooth_quartz"); g.set(x, 9, 11, "azalea"); }
g.set(8, 8, 19, ...B.fence(WOOD)); g.set(9, 8, 19, ...B.slab(WOOD, "bottom"));

// ---- SITE: palms, dune grass, rocks, driftwood ----------------------------------------------------------------------
function palm(x, z, h, dx, dz) {
  let cx = x, cz = z;
  for (let k = 0; k < h; k++) {
    if (k > 0 && k % 4 === 0) { if (dx && dz) g.set(cx + dx, 2 + k - 1, cz, "jungle_log", { axis: "y" }); cx += dx; cz += dz; g.set(cx, 2 + k - 1, cz, "jungle_log", { axis: "y" }); }   // lean: overlap a course so the trunk stays face-connected
    g.set(cx, 2 + k, cz, "jungle_log", { axis: "y" });
  }
  const top = 2 + h;
  const leaf = (X, Y, Z) => { if (g.inBounds(X, Y, Z) && g.blockAt(X, Y, Z) === "minecraft:air") g.set(X, Y, Z, "jungle_leaves", { persistent: "true", distance: "1", waterlogged: "false" }); };
  leaf(cx, top, cz); leaf(cx, top + 1, cz);
  for (const [ax, az] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) {
    const len = ax && az ? 2 : 3;
    for (let i = 1; i <= len; i++) leaf(cx + ax * i, top, cz + az * i);
    if (!(ax && az)) { const sx = az ? 1 : 0, sz = ax ? 1 : 0; for (const i of [2, 3]) leaf(cx + ax * i + sx, top, cz + az * i + sz); }   // thicken the frond tip so it is not a one-face orphan
  }
}
palm(2, 28, 7, 1, 0); palm(39, 7, 8, -1, 0); palm(2, 5, 6, 1, 1); palm(39, 29, 7, -1, -1);
// dune grass tufts on the open sand
for (let n = 0; n < 70; n++) {
  const x = 1 + Math.floor(rnd() * 40), z = 1 + Math.floor(rnd() * 31);
  const inHouse = x >= 3 && x <= 38 && z >= 5 && z <= 31;
  if (inHouse && g.blockAt(x, 2, z) !== "minecraft:air") continue;
  if (g.blockAt(x, 1, z) !== "minecraft:sand" || g.blockAt(x, 2, z) !== "minecraft:air") continue;
  if (z >= 8 && z <= 31 && x >= 3 && x <= 38) continue;
  if (z < 8 && ((x >= 20 && x <= 23))) continue;
  g.set(x, 1, z, "grass_block"); g.set(x, 2, z, ...B.block(rnd() < 0.6 ? "short_grass" : "dead_bush"));
}
boulder(g, [40, 2, 17], [2, 1.6, 2], { materials: ["andesite", "stone", "andesite", "tuff"], moss: 0, seed: 5 });
boulder(g, [1, 2, 18], [1.8, 1.4, 1.6], { materials: ["andesite", "stone", "andesite", "tuff"], moss: 0, seed: 9 });
for (const [x, z] of [[24, 33], [25, 33], [26, 33]]) if (g.blockAt(x, 1, z) !== "minecraft:water") g.set(x, 2, z, "stripped_birch_log", { axis: "x" });


// ---- REVISION 2: massing, relief, age ------------------------------------------------------------------------------
// (a) rooftop pavilion on the U roof plate: a third, smaller white box with its own thin plate -> stepped, shaped top
const P = { x0: 17, x1: 25, z0: 14, z1: 21 };
for (let y = 13; y <= 15; y++) for (let x = P.x0; x <= P.x1; x++) for (const z of [P.z0, P.z1]) g.set(x, y, z, "white_concrete");
for (let y = 13; y <= 15; y++) for (let z = P.z0; z <= P.z1; z++) for (const x of [P.x0, P.x1]) g.set(x, y, z, "white_concrete");
for (let y = 13; y <= 15; y++) for (let x = P.x0 + 1; x <= P.x1 - 1; x++) g.set(x, y, P.z1, y === 13 ? "white_concrete" : GLASS);   // sea-view glazing
for (let x = P.x0; x <= P.x1; x += 4) for (let y = 14; y <= 15; y++) g.set(x, y, P.z1, "gray_concrete");                         // dark mullions
for (let x = P.x0 - 1; x <= P.x1 + 1; x++) for (let z = P.z0 - 1; z <= P.z1 + 2; z++) g.set(x, 16, z, ...B.slab("smooth_quartz", "bottom"));
for (let z = P.z0 + 2; z <= P.z1 - 2; z += 3) for (let y = 14; y <= 15; y++) g.set(P.x0, y, z, GLASS);                         // west slit windows
for (let x = P.x0 + 1; x <= P.x1 - 1; x++) g.set(x, 15, P.z0, x % 2 ? "gray_concrete" : "white_concrete");                      // dark clerestory band, north
// (b) wall relief: projecting quartz fins + a ledge under the north ribbon window; frames round the L windows
for (const x of [14, 19, 24, 29, 33]) for (let y = 8; y <= 11; y++) g.set(x, y, 9, "smooth_quartz");
for (let x = 15; x <= 32; x++) if (![19, 24, 29].includes(x)) g.set(x, 9, 9, ...B.slab("polished_deepslate", "bottom"));
for (let x = 14; x <= 17; x++) g.set(x, 7, 9, "smooth_quartz");                                                                  // (kept free of the entry)
for (let y = 3; y <= 6; y++) { g.set(13, y, 9, "smooth_quartz"); g.set(18, y, 9, "smooth_quartz"); }                            // frame fins by the tall window
for (let x = 13; x <= 18; x++) g.set(x, 7, 9, "smooth_quartz");
for (let x = 14; x <= 17; x++) g.set(x, 2, 9, "smooth_quartz");                                                                 // sill-plinth step
// (c) age: salt-weathered concrete, silvered timber, sand-blown deck, algae at the waterline
const rs = (() => { let s = 31; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32); })();
const worn = (pos, to) => { const [x, y, z] = pos; g.set(x, y, z, to); };
for (const c of [...g.cells.values()]) {
  const [x, y, z] = c.pos, b = c.block;
  if (b === "minecraft:white_concrete" && y <= 4 && y >= 3 && ((x + z) % 7 < 3 || (y === 3 && (x + z) % 7 < 5))) worn(c.pos, "light_gray_concrete");   // salt grime in runs near the sand
  else if (b === "minecraft:birch_planks" && y >= 2 && rs() < 0.2) worn(c.pos, rs() < 0.5 ? "pale_oak_planks" : "stripped_birch_log");   // silvered, mixed boards
  else if (b === "minecraft:smooth_stone" && y <= 2 && rs() < 0.2) worn(c.pos, "stone");
  else if (b === "minecraft:gray_concrete" && y === 2 && rs() < 0.2) worn(c.pos, "polished_andesite");
}
for (let n = 0; n < 14; n++) { const x = 4 + Math.floor(rs() * 34), z = 23 + Math.floor(rs() * 7); if (g.blockAt(x, 2, z) === "minecraft:birch_planks") g.set(x, 2, z, "sand"); }  // drifted sand on the deck
// trim stray droop leaves (orphan check): a leaf with <=1 leaf/log neighbour goes
for (let pass = 0; pass < 1; pass++) for (const c of [...g.cells.values()]) if (c.block === "minecraft:jungle_leaves") {
  const [x, y, z] = c.pos; let n = 0;
  for (const [dx, dy, dz] of [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]]) { const nb = g.blockAt(x + dx, y + dy, z + dz); if (nb && nb !== "minecraft:air" && nb !== "minecraft:water") n++; }
  if (n <= 1) g.set(x, y, z, "air");
}

// ---- REVISION 3: age, small details, roofline, grounding ----------------------------------------------------------
const rt = (() => { let s = 77; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32); })();
const air = (x, y, z) => g.blockAt(x, y, z) === "minecraft:air";
// (a) age without new hues: a salt-line course on the lower walls, speckled concrete (calcite/diorite), silvered slats, patinated copper
for (const c of [...g.cells.values()]) {
  const [x, y, z] = c.pos, b = c.block;
  if (b === "minecraft:white_concrete" && y === 3 && rt() < 0.75) g.set(x, y, z, "light_gray_concrete");
  else if (b === "minecraft:white_concrete" && y >= 5 && rt() < 0.07) g.set(x, y, z, rt() < 0.5 ? "calcite" : "polished_diorite");
  else if (b === "minecraft:birch_trapdoor" && z === 6 && rt() < 0.35) g.set(x, y, z, ...B.trapdoor("pale_oak", "east", "bottom", true));
}
for (const y of [4, 5]) for (const x of [23, 24]) g.set(x, y, 10, "oxidized_cut_copper");            // house-number panel, verdigris
for (let n = 0; n < 16; n++) { const x = 27 + Math.floor(rt() * 11), z = 11 + Math.floor(rt() * 15); if (g.blockAt(x, 2, z) === "minecraft:smooth_stone" && air(x, 3, z)) g.set(x, 2, z, "sand"); }  // sand blown onto the terrace
// (b) roof terrace: pergola over the loungers (new lower roofline step beside the pavilion)
for (const [x, z] of [[6, 14], [11, 14], [6, 19], [11, 19]]) for (let y = 8; y <= 10; y++) g.set(x, y, z, ...B.fence(WOOD));
for (let x = 6; x <= 11; x++) for (const z of [14, 19]) g.set(x, 11, z, ...B.log("stripped_birch", "x"));
for (let z = 15; z <= 18; z++) for (let x = 6; x <= 11; x += 1) if (x % 2 === 0) g.set(x, 11, z, ...B.slab(WOOD, "bottom"));
for (let x = 6; x <= 11; x += 1) for (const z of [15, 18]) if (x % 2 === 1) g.set(x, 11, z, ...B.trapdoor(WOOD, "north", "top", false));
// (c) roofline on the main plate: chimney stack, solar panels (tinted glass on a raised base), mast
for (let y = 13; y <= 15; y++) for (const [x, z] of [[29, 16], [30, 16], [29, 17], [30, 17]]) g.set(x, y, z, "smooth_quartz");
for (const [x, z] of [[29, 16], [30, 16], [29, 17], [30, 17]]) g.set(x, 16, z, ...B.slab("gray_concrete", "bottom"));
for (let x = 27; x <= 33; x++) for (const z of [11, 12, 20, 21]) if (!(x === 30 && false)) { g.set(x, 12, z, "polished_blackstone"); g.set(x, 13, z, "tinted_glass"); }
g.set(21, 17, 17, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
// (d) small details a player notices
// striped awning over the tall north window (white / light-blue slabs on the frame fins, 2 deep)
for (let x = 13; x <= 18; x++) for (const z of [8, 9]) if (air(x, 6, z) || g.blockAt(x, 6, z) !== "minecraft:smooth_quartz") g.set(x, 6, z, ...B.slab(x % 2 ? "light_blue_concrete" : "white_concrete", "top"));
for (const x of [13, 18]) g.set(x, 6, 9, "smooth_quartz");
// planters flanking the front door, a bench, path lanterns on fence posts
for (const x of [19, 23]) { g.set(x, 2, 8, "smooth_quartz"); g.set(x, 3, 8, "azalea"); }
g.set(24, 2, 8, ...B.stairs(WOOD, "north")); g.set(25, 2, 8, ...B.stairs(WOOD, "north"));
for (const [x, z] of [[20, 2], [23, 5], [20, 7]]) { g.set(x, 2, z, ...B.fence(WOOD)); g.set(x, 3, z, ...B.fence(WOOD)); g.set(x, 4, z, ...B.lantern(false)); }
// outdoor shower by the deck steps, towels on the balustrade, a ring buoy on the jetty
for (let y = 3; y <= 5; y++) g.set(21, y, 31, ...B.fence(WOOD));
g.set(21, 6, 31, "iron_bars"); g.set(22, 6, 31, "iron_bars"); g.set(21, 2, 31, "smooth_quartz");
for (const x of [6, 9]) g.set(x, 4, 30, "white_carpet");   // towels over the balustrade
for (let x = P.x0 + 1; x <= P.x1 - 1; x += 2) g.set(x, 15, P.z0, "oxidized_cut_copper");   // verdigris clerestory band echoes the house-number panel
g.set(17, 3, 33, ...B.lantern(false));
// (e) grounding: dune grass and a stone edge round the deck and the undercroft ends, boulder nested at the east
for (const [x, z] of [[3, 24], [3, 26], [38, 24], [38, 27], [36, 31], [3, 31], [14, 32], [21, 32], [29, 32], [35, 32]]) {
  if (g.blockAt(x, 1, z) === "minecraft:sand" && air(x, 2, z)) { g.set(x, 1, z, "grass_block"); g.set(x, 2, z, ...B.block(rt() < 0.7 ? "short_grass" : "fern")); }
}

g.save(join(HERE, "build.nbt"));
console.log(JSON.stringify({ saved: "build.nbt", size: g.size }));
