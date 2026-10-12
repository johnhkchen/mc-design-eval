// Right atrium: three storeys of one tall hall.
//   y=8  vestibule at the foot of the stair (barrels, lamps)       y=12 the study (library, cluttered desk, specimen jar)
//   y=16 the mezzanine (jars, a shelf of skulls) leading east through the Gerbode shortcut
import { vat, jar, desk, tesla } from "./props.mjs";
import { rnd } from "./mats.mjs";
import { RM } from "./interior.mjs";

const SHELF = ["bookshelf", "bookshelf", "bookshelf", "chiseled_bookshelf", "bookshelf"];

// westmost free cell of the RA at (y, z) whose west neighbour is solid wall
function westCell(K, y, z, umax = 9) {
  for (let u = 3; u <= umax; u++) if (K.room(u, y, z) === RM.RA) return K.free(u, y, z) && K.solid(u - 1, y, z) ? u : -1;
  return -1;
}

export function furnishRA(K) {
  // ---- the study (floor y=12) ----------------------------------------------------------------------------------
  // library along the west wall: shelves four high, with a few jars and lanterns among them
  for (let z = 5; z <= 16; z++) {
    for (let y = 12; y <= (z < 13 ? 15 : 14); y++) {
      const u = westCell(K, y, z);
      if (u < 0) continue;
      const r = rnd(u, y, z, 21);
      if (r < 0.08) K.put(u, y, z, "slime_block");
      else if (r < 0.14) K.put(u, y, z, "honey_block");
      else if (r < 0.2) K.put(u, y, z, "lantern", { hanging: "false", waterlogged: "false" });
      else if (r < 0.36) K.put(u, y, z, "chiseled_bookshelf", { facing: "east", slot_0_occupied: "true", slot_1_occupied: "true", slot_2_occupied: "false", slot_3_occupied: "true", slot_4_occupied: "false", slot_5_occupied: "true" });
      else K.put(u, y, z, "bookshelf");
    }
  }
  // a lantern on top of each shelf stack (the stacks reach y=15 in front, y=14 under the mezzanine)
  for (let z = 6; z <= 15; z += 3) { const u = westCell(K, 16, z); if (u >= 0 && K.at(u, 15, z)) K.lantern(u, 16, z); }

  // the cluttered desk on the east wall, with a chair; the lamp, the skull, the books, the brews
  if (desk(K, 8, 12, 11, "z")) {
    K.stairs(7, 12, 12, "dark_oak", "l");                                  // chair (back to the west... faces the desk)
    K.put(8, 14, 11, "lectern", { facing: wf("r"), has_book: "true", powered: "false" });
    K.put(8, 14, 12, "brewing_stand", { has_bottle_0: "true", has_bottle_1: "false", has_bottle_2: "true" });
    K.put(8, 14, 13, "candle", { candles: "3", lit: "true", waterlogged: "false" });
    K.put(9, 14, 11, "skeleton_skull", { rotation: "12", powered: "false", waterlogged: "false" });
    K.put(9, 14, 12, "lantern", { hanging: "false", waterlogged: "false" });
    K.put(9, 14, 13, "potted_crimson_fungus");
    K.put(9, 14, 14, "red_candle", { candles: "2", lit: "true", waterlogged: "false" });
    K.put(8, 14, 14, "cauldron");
  }
  // rug in front of the desk
  for (let u = 4; u <= 7; u++) for (let z = 10; z <= 14; z++) if (K.free(u, 12, z)) K.put(u, 12, z, (u === 4 || u === 7 || z === 10 || z === 14) ? "black_carpet" : "red_carpet");
  // the specimen in the north-west corner: an organ in a jar
  jar(K, 4, 12, 6, "nether_wart_block", "lime_stained_glass");
  // the lightning mast: climbs from the study through the dome and out of the vena cava
  const mu = 6, mz = 11;
  for (let y = 12; y <= 35; y++) {
    if (y < 35 && !K.free(mu, y, mz)) break;
    if (y === 35) K.put(mu, y, mz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
    else if (y % 4 === 0) K.put(mu, y, mz, "copper_bulb", { lit: "true", powered: "false" });
    else K.put(mu, y, mz, "waxed_copper_block");
  }

  // ---- vestibule (floor y=8) ------------------------------------------------------------------------------------
  for (const [u, z] of [[5, 6], [5, 7], [6, 6]]) if (K.free(u, 8, z)) K.put(u, 8, z, "barrel", { facing: "up", open: "false" });
  if (K.free(5, 9, 6)) K.put(5, 9, 6, "chest", { facing: "south", type: "single", waterlogged: "false" });
  for (const [u, z] of [[3, 9], [3, 11], [3, 13]]) if (K.free(u, 8, z)) K.lantern(u, 8, z);

  // ---- the mezzanine (floor y=16) -------------------------------------------------------------------------------
  jar(K, 5, 16, 14, "slime_block", "light_blue_stained_glass");
  K.put(8, 17, 15, "wither_skeleton_skull", { rotation: "8", powered: "false", waterlogged: "false" });
  for (let u = 4; u <= 8; u++) if (K.free(u, 16, 16)) K.put(u, 16, 16, "bookshelf");
}
import { wf } from "./kit.mjs";
