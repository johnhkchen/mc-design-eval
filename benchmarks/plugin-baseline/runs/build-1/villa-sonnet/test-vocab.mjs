// Calls every vocab.mjs helper on a site-size grid and checks the blocks and states it placed, that every placed block is in
// palette.json, and that every exported helper was exercised. Run: node test-vocab.mjs
import { readFileSync } from "node:fs";
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as V from "./vocab.mjs";

const pal = JSON.parse(readFileSync(new URL("./palette.json", import.meta.url), "utf8"));
const allowed = new Set([...Object.values(pal.roles).flat(), ...pal.objects]);

const g = new Grid(V.SITE.size, { dataVersion: V.SITE.dataVersion });
const fails = [];
let checks = 0;
const ran = new Set();
const ok = (cond, msg) => { checks++; if (!cond) fails.push(msg); };

/** The block at (x,y,z) is one of `ids` (a string or array) and its state has every key in `st`. */
const expectBlock = (x, y, z, ids, st = {}) => {
  const c = g.get(x, y, z);
  const got = c ? c.block.replace("minecraft:", "") : "air";
  const want = [ids].flat();
  const gs = c?.state ?? {};
  const stOk = Object.entries(st).every(([k, v]) => gs[k] === String(v));
  ok(want.includes(got) && stOk, `(${x},${y},${z}) want ${want.join("|")} ${JSON.stringify(st)}, got ${got} ${JSON.stringify(gs)}`);
};
const expectAir = (x, y, z) => ok(g.blockAt(x, y, z) === "minecraft:air", `(${x},${y},${z}) want air, got ${g.blockAt(x, y, z)}`);
const throws = (fn) => { try { fn(); return false; } catch { return true; } };
const PLASTER = [V.SMOOTH_SANDSTONE, V.END_STONE_BRICKS, V.SANDSTONE];

// ---- walls and shell ----
ran.add("wallCell");
V.wallCell(g, 3, 1, 2); V.wallCell(g, 3, 2, 2); V.wallCell(g, 3, 4, 2); V.wallCell(g, 3, 6, 2);
expectBlock(3, 1, 2, V.STONE_BRICKS);
expectBlock(3, 2, 2, V.RED_TERRACOTTA);
expectBlock(3, 4, 2, PLASTER);
expectBlock(3, 6, 2, V.CUT_SANDSTONE);
ok(throws(() => V.wallCell(g, 3, 7, 2)), "wallCell accepts y 7");

ran.add("wallLine");
V.wallLine(g, 0, 2, 35, 2, { open: [V.OPENINGS.fauceStreet, ...V.OPENINGS.shopStreet] });
expectBlock(6, 3, 2, V.RED_TERRACOTTA);           // a closed cell of the front wall
expectAir(3, 3, 2);                               // inside the shop window
expectAir(17, 5, 2);                              // inside the fauces opening
expectBlock(17, 1, 2, V.STONE_BRICKS);            // the plinth is always built
expectBlock(17, 6, 2, V.CUT_SANDSTONE);           // the cornice is always built
ok(throws(() => V.wallLine(g, 0, 2, 5, 9)), "wallLine accepted a diagonal wall");

ran.add("pilaster");
V.pilaster(g, 15, 2);
expectBlock(15, 2, 2, V.QUARTZ_BLOCK);
expectBlock(15, 3, 2, V.QUARTZ_PILLAR, { axis: "y" });
expectBlock(15, 6, 2, V.SMOOTH_QUARTZ);

ran.add("column");
V.column(g, 10, 34);
expectBlock(10, 1, 34, V.SMOOTH_STONE);
expectBlock(10, 5, 34, V.CHISELED_QUARTZ_BLOCK);

ran.add("beamLine");
V.beamLine(g, 14, 13, 21, 13, V.DARK_OAK_LOG);
expectBlock(16, 6, 13, V.DARK_OAK_LOG, { axis: "x" });
V.beamLine(g, 14, 13, 14, 18, V.DARK_OAK_LOG);
expectBlock(14, 6, 16, V.DARK_OAK_LOG, { axis: "z" });

ran.add("tuscanColumn");
V.tuscanColumn(g, 14, 13);
expectBlock(14, 2, 13, V.STONE_BRICKS);
expectBlock(14, 3, 13, V.DARK_OAK_LOG, { axis: "y" });
expectBlock(14, 5, 13, V.DARK_OAK_PLANKS);

// ---- street front ----
ran.add("shopWindow");
V.shopWindow(g, 3, 5);
expectBlock(3, 2, 2, V.STONE_BRICK_SLAB, { type: "bottom" });
expectBlock(5, 2, 2, V.STONE_BRICK_SLAB, { type: "bottom" });
expectBlock(4, 3, 2, V.DECORATED_POT);

ran.add("shutter");
V.shutter(g, 2, 3, 1);
expectBlock(2, 3, 1, V.SPRUCE_TRAPDOOR, { facing: "north", open: "true", half: "bottom" });
expectBlock(2, 4, 1, V.SPRUCE_TRAPDOOR, { facing: "north", open: "true", half: "bottom" });

ran.add("windowGrille");
V.windowGrille(g, 0, 3, 12, "z");
expectBlock(0, 3, 12, V.COPPER_BARS, { north: "true", south: "true" });
expectBlock(0, 4, 12, V.COPPER_BARS, { north: "true", south: "true" });
V.windowGrille(g, 3, 3, 45, "x");
expectBlock(3, 3, 45, V.COPPER_BARS, { east: "true", west: "true" });

// ---- doors ----
ran.add("doorway");
V.doorway(g, 15, 6, "z");
expectBlock(15, 2, 6, V.SPRUCE_DOOR, { facing: "east", half: "lower", hinge: "left", open: "false" });
expectBlock(15, 3, 6, V.SPRUCE_DOOR, { facing: "east", half: "upper" });
expectBlock(15, 4, 6, PLASTER);

ran.add("doorPair");
V.doorPair(g, 16, 4, "x");
expectBlock(16, 2, 4, V.SPRUCE_DOOR, { facing: "north", half: "lower", hinge: "left", open: "true" });
expectBlock(17, 2, 4, V.SPRUCE_DOOR, { facing: "north", half: "lower", hinge: "right", open: "true" });

ran.add("step");
V.step(g, 16, 19, 1);
expectBlock(16, 1, 1, V.STONE_BRICK_STAIRS, { facing: "south", half: "bottom" });
expectBlock(19, 1, 1, V.STONE_BRICK_STAIRS, { facing: "south", half: "bottom" });

// ---- lamps, pots, statues ----
ran.add("hangLamp");
V.hangLamp(g, 12, 11);
expectBlock(12, 5, 11, V.COPPER_CHAIN);
expectBlock(12, 4, 11, V.COPPER_LANTERN, { hanging: "true" });

ran.add("lampStand");
V.lampStand(g, 16, 3);
expectBlock(16, 2, 3, V.CUT_COPPER_SLAB, { type: "bottom" });
expectBlock(16, 3, 3, V.COPPER_BARS);
expectBlock(16, 4, 3, V.COPPER_LANTERN, { hanging: "false" });
V.lampStand(g, 14, 1, 1);
expectBlock(14, 1, 1, V.CUT_COPPER_SLAB, { type: "bottom" });
expectBlock(14, 3, 1, V.COPPER_LANTERN, { hanging: "false" });

ran.add("pot");
V.pot(g, 13, 1, "fern", 1);
expectBlock(13, 1, 1, V.STONE_BRICKS);
expectBlock(13, 2, 1, V.POTTED_FERN);
V.pot(g, 9, 33, "flowering_azalea", 2);
expectBlock(9, 3, 33, V.POTTED_FLOWERING_AZALEA_BUSH);

ran.add("statue");
V.statue(g, 8, 33, 8);
expectBlock(8, 2, 33, V.STONE_BRICKS);
expectBlock(8, 3, 33, V.DIORITE_WALL);
expectBlock(8, 4, 33, V.QUARTZ_PILLAR, { axis: "y" });
expectBlock(8, 5, 33, V.SKELETON_SKULL, { rotation: "8" });

// ---- garden ----
ran.add("hedge");
V.hedge(g, 12, 36);
expectBlock(12, 2, 36, V.AZALEA_LEAVES, { persistent: "true" });
V.hedge(g, 12, 37, true);
expectBlock(12, 2, 37, V.FLOWERING_AZALEA_LEAVES);

ran.add("gardenBed");
const [wBed, eBed] = V.GARDEN_BEDS;
V.gardenBed(g, wBed.x0, wBed.z0, wBed.x1, wBed.z1, wBed.flowers);
expectBlock(12, 1, 36, V.GRASS_BLOCK);
expectBlock(12, 2, 36, V.AZALEA_LEAVES);                 // ring cell 0
expectBlock(12, 2, 37, V.FLOWERING_AZALEA_LEAVES);       // ring cell 3: every 4th
expectBlock(13, 2, 37, V.POPPY);                         // interior, z37
expectBlock(13, 2, 39, V.AZURE_BLUET);                   // interior, z39
expectAir(13, 2, 38);                                    // the centre waits for the statue
V.gardenBed(g, eBed.x0, eBed.z0, eBed.x1, eBed.z1, eBed.flowers);
expectBlock(22, 2, 37, V.ALLIUM);
expectBlock(22, 2, 39, V.CORNFLOWER);

ran.add("fountain");
V.fountain(g, V.FOUNTAIN.x0, V.FOUNTAIN.z0, V.FOUNTAIN.x1, V.FOUNTAIN.z1);
expectBlock(15, 2, 36, V.SMOOTH_QUARTZ);
expectBlock(16, 1, 37, V.BLUE_TERRACOTTA);
expectBlock(16, 2, 37, V.WATER);
expectBlock(17, 2, 38, V.QUARTZ_PILLAR, { axis: "y" });
expectBlock(18, 3, 38, V.QUARTZ_PILLAR, { axis: "y" });
expectBlock(18, 4, 38, V.WATER_CAULDRON, { level: "3" });
let fountainWater = 0;
for (let x = 15; x <= 20; x++) for (let z = 36; z <= 40; z++) if (g.blockAt(x, 2, z) === "minecraft:water") fountainWater++;
ok(fountainWater === 10, `fountain water cells: want 10, got ${fountainWater}`);

ran.add("impluvium");
V.impluvium(g);
expectBlock(15, 1, 14, V.WATER);
expectBlock(20, 1, 17, V.WATER);
expectBlock(14, 2, 14, V.SMOOTH_QUARTZ_SLAB, { type: "bottom" });
expectBlock(14, 2, 13, V.STONE_BRICKS);                  // a corner: the Tuscan column's base stays
let coping = 0;
for (let x = 14; x <= 21; x++) for (let z = 13; z <= 18; z++) if (g.blockAt(x, 2, z) === "minecraft:smooth_quartz_slab") coping++;
ok(coping === 20, `impluvium coping cells: want 20, got ${coping}`);

// ---- floors ----
ran.add("mosaic");
const atrium = V.ROOMS[5].box, tablinum = V.ROOMS[10].box, triclinium = V.ROOMS[12].box;
V.mosaic(g, atrium, { kind: "checker", a: V.QUARTZ_BLOCK, b: V.POLISHED_BLACKSTONE });
expectBlock(10, 1, 10, V.QUARTZ_BLOCK);
expectBlock(11, 1, 10, V.POLISHED_BLACKSTONE);
V.mosaic(g, tablinum, [
  { kind: "border", field: V.WHITE_TERRACOTTA, b1: V.RED_TERRACOTTA, b2: V.BLACK_TERRACOTTA },
  { kind: "emblem", at: [17, 26, 18, 27], block: V.BLUE_GLAZED_TERRACOTTA },
]);
expectBlock(11, 1, 23, V.RED_TERRACOTTA);
expectBlock(12, 1, 24, V.BLACK_TERRACOTTA);
expectBlock(15, 1, 26, V.WHITE_TERRACOTTA);
expectBlock(17, 1, 26, V.BLUE_GLAZED_TERRACOTTA);
V.mosaic(g, triclinium, { kind: "meander", a: V.RED_TERRACOTTA, b: V.YELLOW_TERRACOTTA });
expectBlock(26, 1, 23, V.RED_TERRACOTTA);

// ---- furniture ----
ran.add("couch");
V.couch(g, 27, 26, "north", 4);
expectBlock(27, 2, 26, V.RED_BED, { facing: "east", part: "foot" });
expectBlock(28, 2, 26, V.RED_BED, { facing: "east", part: "head" });
expectBlock(29, 2, 26, V.RED_BED, { facing: "east", part: "foot" });
expectBlock(30, 2, 26, V.RED_BED, { facing: "east", part: "head" });
expectBlock(27, 2, 27, V.DARK_OAK_SLAB, { type: "bottom" });
expectBlock(30, 2, 27, V.DARK_OAK_SLAB, { type: "bottom" });
ok(throws(() => V.couch(g, 27, 26, "north", 3)), "couch accepted an odd len");

ran.add("table");
V.table(g, 12, 26, 3, 2);
expectBlock(12, 2, 26, V.DARK_OAK_FENCE);
expectBlock(14, 2, 27, V.DARK_OAK_FENCE);
expectBlock(13, 3, 26, V.DARK_OAK_SLAB, { type: "top" });

// ---- every exported helper ran; every placed block is in the palette ----
const helpers = Object.keys(V).filter((k) => typeof V[k] === "function");
for (const h of helpers) ok(ran.has(h), `helper ${h} was not exercised`);

const strays = new Set();
for (const c of g) {
  const id = c.block.replace("minecraft:", "");
  if (id !== "air" && !allowed.has(id)) strays.add(id);
}
ok(strays.size === 0, `blocks not in palette.json: ${[...strays].join(", ")}`);

if (fails.length) {
  for (const f of fails) console.log(`FAIL ${f}`);
  console.log(`${fails.length} of ${checks} checks failed`);
  process.exitCode = 1;
} else {
  console.log(`vocab: ${checks} checks passed; ${helpers.length} helpers exercised; every placed block is in palette.json`);
}
