// Right ventricle (vat gallery), pulmonary shaft, left atrium (the sleeping-and-brewing loft), the aortic arch loft.
import { vat, jar, tesla } from "./props.mjs";
import { rnd } from "./mats.mjs";
import { RM } from "./interior.mjs";
import { wf } from "./kit.mjs";

// ---- right ventricle: a long gallery of glowing vats against the front wall ----------------------------------------
export function furnishRV(K) {
  // tricuspid valve: bone-white annulus round the doorway (u 7..8, y 8..10, z 6..7), leaflets and chordae on the RV side
  for (const z of [5, 8]) for (let y = 8; y <= 10; y++) { if (K.solid(7, y, z) && !K.at(7, y, z)) K.put(7, y, z, "bone_block"); }
  for (const u of [7, 8]) { K.put(u, 11, 6, "bone_block"); K.put(u, 11, 7, "bone_block"); }
  K.stairs(9, 10, 6, "quartz", "l", "top"); K.stairs(9, 10, 7, "quartz", "l", "top");
  K.stairs(9, 10, 5, "quartz", "s", "top");
  for (const z of [5, 6, 7]) if (K.free(9, 9, z)) K.chain(9, 9, z);
  K.wallSign(10, 9, 8, "dark_oak", "n", ["TRICUSPID VALVE", "THREE LEAFLETS", "NO PUN INTENDED", ""], { color: "white" });
  // vats
  const specs = [
    [10, 3, { glass: "lime_stained_glass", core: "verdant_froglight" }],
    [13, 3, { glass: "light_blue_stained_glass", core: "sea_lantern" }],
    [16, 4, { glass: "cyan_stained_glass", core: "ochre_froglight" }],
  ];
  for (const [u0, z0, o] of specs) vat(K, u0, 8, z0, 5, o);
  // copper pipes along the ceiling, with tinted-glass sight sections and lit bulbs
  for (let u = 9; u <= 17; u++) {
    for (const [y, z] of [[13, 4], [14, 5]]) {
      if (!K.free(u, y, z)) continue;
      const k = (u + y) % 4;
      K.put(u, y, z, k === 0 ? "copper_bulb" : k === 2 ? "tinted_glass" : "waxed_oxidized_copper", k === 0 ? { lit: "true", powered: "false" } : undefined);
    }
  }
  // tubes dropping from the pipes to the vat lids
  for (const u of [11, 14, 17]) for (let y = 13; y >= 13; y--) if (K.free(u, y, 4)) K.put(u, y, 4, "chain", { axis: "y", waterlogged: "false" });
  // walkway lamps
  for (const u of [9, 12, 15, 18]) for (let y = 9; y <= 14; y++) if (K.free(u, y, 6) && K.solid(u, y + 1, 6) && !K.at(u, y + 1, 6)) { K.lantern(u, y, 6, true); break; }
  for (const u of [9, 13, 17]) { for (let y = 16; y >= 10; y--) if (K.free(u, y, 5) && !K.free(u, y + 1, 5) && K.solid(u, y + 1, 5)) { K.put(u, y + 1, 5, "glowstone"); break; } }
}

// ---- pulmonary shaft: the ladder climbs the pulmonary trunk to a landing under the bifurcation ------------------------
export function furnishPT(K) {
  // pulmonary valve: three cusps (stairs) at the mouth of the trunk, above the RV conus
  for (let y = 8; y <= 23; y++) K.ladder(11, y, 6, "n");
  K.ladder(11, 23, 6, "n");
  for (const [u, z] of [[10, 5], [10, 6], [10, 7], [12, 5], [12, 6], [12, 7], [11, 5], [11, 7]]) if (K.free(u, 22, z)) K.put(u, 22, z, "smooth_quartz");
  K.put(11, 22, 6, "ladder", { facing: wf("n"), waterlogged: "false" });
  if (K.free(11, 23, 7)) K.put(11, 23, 7, "stone_bricks");
  for (const [u, z] of [[10, 6], [12, 6]]) if (K.free(u, 23, z)) K.lantern(u, 23, z);
  K.wallSign(11, 21, 7, "dark_oak", "n", ["PULMONARY VALVE", "THREE CUSPS", "MIND THE LADDER"], { color: "white" });
  // the valve ring: the wall cells round the shaft mouth at y=16, in bone-white
  annulus(K, 16, 10, 12, 4, 8);
}

// bone-white ring: every placed wall cell at height y (inside the box) that touches open air on a side
function annulus(K, y, u0, u1, z0, z1, block = "bone_block") {
  for (let u = u0 - 1; u <= u1 + 1; u++) for (let z = z0 - 1; z <= z1 + 1; z++) {
    if (!K.solid(u, y, z) || !K.at(u, y, z)) continue;
    if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => K.room(u + a, y, z + b) && K.free(u + a, y, z + b))) K.put(u, y, z, block);
  }
}

// ---- left atrium: bed, alchemy, a telescope, light from the pulmonary vein windows --------------------------------
export function furnishLA(K) {
  // floor y=16, 4 deep (z 18..21), u 11..18
  // bed in the east end (head to the east wall)
  K.put(17, 16, 19, "red_bed", { facing: wf("r"), part: "foot", occupied: "false" });
  K.put(18, 16, 19, "red_bed", { facing: wf("r"), part: "head", occupied: "false" });
  K.put(18, 17, 20, "lantern", { hanging: "false", waterlogged: "false" });
  K.put(18, 16, 18, "bookshelf"); K.put(18, 17, 18, "bookshelf"); K.put(17, 16, 18, "chest", { facing: "south", type: "single", waterlogged: "false" });
  // alchemy along the north bulkhead (z=18)
  const bench = [[11, "brewing_stand"], [12, "cauldron"], [13, "brewing_stand"], [14, "lectern"], [15, "cauldron"]];
  for (const [u, b] of bench) if (K.free(u, 16, 18)) K.put(u, 16, 18, b === "lectern" ? "lectern" : b, b === "brewing_stand" ? { has_bottle_0: "true", has_bottle_1: "true", has_bottle_2: "true" } : b === "lectern" ? { facing: "south", has_book: "true", powered: "false" } : undefined);
  // specimen shelves on the south wall (z=21): honey, slime, skulls
  for (let u = 11; u <= 17; u++) for (let y = 17; y <= 19; y++) {
    if (!K.free(u, y, 21) || !K.solid(u, y, 22)) continue;
    const r = rnd(u, y, 21, 9);
    K.put(u, y, 21, r < 0.25 ? "slime_block" : r < 0.45 ? "honey_block" : r < 0.6 ? "bookshelf" : r < 0.75 ? "chiseled_bookshelf" : "bookshelf",
      r >= 0.6 && r < 0.75 ? { facing: "north", slot_0_occupied: "true", slot_1_occupied: "true", slot_2_occupied: "false", slot_3_occupied: "true", slot_4_occupied: "true", slot_5_occupied: "false" } : undefined);
  }
  for (const u of [12, 15]) K.put(u, 16, 20, u === 12 ? "skeleton_skull" : "zombie_head", { rotation: "0", powered: "false", waterlogged: "false" });
  // lamps: sea lanterns in the ceiling, candles on the bench
  for (const u of [12, 15, 17]) for (let y = 22; y >= 18; y--) if (K.free(u, y, 19) && K.solid(u, y + 1, 19)) { K.put(u, y + 1, 19, "shroomlight"); break; }
  K.put(13, 17, 18, "candle", { candles: "4", lit: "true", waterlogged: "false" });
  K.wallSign(12, 18, 18, "dark_oak", "s", ["LEFT ATRIUM", "BED & BREAKFAST", "& BREWS"], { color: "white" });
}

// ---- aortic arch loft -----------------------------------------------------------------------------------------------
export function furnishAorta(K) {
  // aortic valve: a bone-white ring where the lab narrows into the aorta (y=21)
  annulus(K, 21, 11, 14, 12, 15);
  K.wallSign(11, 19, 15, "dark_oak", "n", ["AORTIC VALVE", "ONE WAY ONLY", ""], { color: "white" });
  // lamps set into the shaft wall
  for (const y of [18, 23, 27]) for (const [u, z] of [[13, 16], [12, 16], [13, 17]]) if (K.solid(u, y, z) && !K.at(u, y, z)) { K.put(u, y, z, "shroomlight"); break; }
  // arch loft: a floor under the horizontal run, lit by copper bulbs and a tesla-coil topped with a rod in each branch
  for (let u = 13; u <= 21; u++) for (let z = 12; z <= 17; z++) {
    // the floor lies under the lowest free cell of the loft level (y=31)
    if (K.room(u, 31, z) === RM.AO && K.free(u, 31, z) && K.room(u, 30, z) === RM.AO && K.free(u, 30, z)) K.put(u, 30, z, (u + z) & 1 ? "polished_deepslate" : "deepslate_tiles");
  }
  for (let u = 13; u <= 21; u += 2) for (let z = 13; z <= 16; z++) if (K.free(u, 33, z) && K.solid(u, 34, z)) K.put(u, 33, z, "copper_bulb", { lit: "true", powered: "false" });
}
