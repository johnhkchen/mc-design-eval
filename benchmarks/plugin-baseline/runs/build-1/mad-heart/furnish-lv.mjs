// Left ventricle: the thick-walled main lab. Floor y=12, ceiling about y=21, a balcony (y=16) along the back with the
// mitral doorway, the Gerbode shortcut and the aortic ladder.
import { vat, tesla, jar, console_ } from "./props.mjs";
import { rnd } from "./mats.mjs";
import { RM } from "./interior.mjs";
import { wf } from "./kit.mjs";

// topmost free cell of a column with a solid above: a ceiling lamp goes in the solid
function ceilingLamps(K, code, step, block, state) {
  for (let u = 12; u <= 24; u += step) for (let z = 8; z <= 15; z += step) {
    let top = -1;
    for (let y = 12; y <= 22; y++) if (K.room(u, y, z) === code && K.free(u, y, z)) top = y;
    if (top > 0 && K.solid(u, top + 1, z) && !K.at(u, top + 1, z)) K.put(u, top + 1, z, block, state);
  }
}

export function furnishLV(K) {
  // floor: a copper border ring along the walls
  for (let u = 12; u <= 24; u++) for (let z = 8; z <= 15; z++) {
    if (!K.room(u, 12, z) || !K.free(u, 12, z)) continue;
    const edge = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => !K.free(u + a, 12, z + b) && K.solid(u + a, 12, z + b));
    if (edge && K.solid(u, 11, z)) K.put(u, 11, z, "waxed_cut_copper");
  }
  // two tesla coils and a big vat
  tesla(K, 16, 12, 10, 9);
  tesla(K, 22, 12, 10, 9);
  for (const [u0, z0] of [[20, 13], [21, 13], [19, 13]]) if (vat(K, u0, 12, z0, 8, { glass: "lime_stained_glass" })) break;
  // operating table at the centre: slab top on iron legs, a sheet over a shape, and a surgical lamp on a chain
  for (let u = 17; u <= 19; u++) {
    K.put(u, 13, 12, "smooth_quartz_slab", { type: "top", waterlogged: "false" });
    if (u !== 18) { K.put(u, 12, 12, "iron_bars"); }
  }
  K.put(18, 12, 12, "iron_block");
  K.put(17, 14, 12, "white_carpet"); K.put(18, 14, 12, "white_carpet"); K.put(19, 14, 12, "white_carpet");
  K.put(18, 13, 11, "polished_blackstone_button", { face: "wall", facing: "north", powered: "false" });
  for (let y = 18; y <= 20; y++) if (K.free(18, y, 12)) K.chain(18, y, 12);
  K.lantern(18, 17, 12, true); K.lantern(17, 18, 12, true); K.put(17, 19, 12, "chain", { axis: "y", waterlogged: "false" });
  // control console on the north wall with a bank of lamps above it
  console_(K, 15, 12, 8, 6, "n");
  for (let u = 15; u <= 20; u++) for (let y = 14; y <= 15; y++) if (K.free(u, y, 8)) K.put(u, y, 8, (u + y) % 3 === 0 ? "redstone_lamp" : (u + y) % 3 === 1 ? "copper_bulb" : "polished_blackstone_bricks", (u + y) % 3 === 0 ? { lit: "true" } : (u + y) % 3 === 1 ? { lit: "true", powered: "false" } : undefined);
  // east wall: shelves of specimens
  for (let z = 9; z <= 15; z++) for (let y = 12; y <= 15; y++) {
    let u = -1;
    for (let c = 24; c >= 20; c--) if (K.room(c, y, z) === RM.LV && K.free(c, y, z) && K.solid(c + 1, y, z)) { u = c; break; }
    if (u < 0) continue;
    const r = rnd(u, y, z, 5);
    K.put(u, y, z, r < 0.2 ? "slime_block" : r < 0.35 ? "honey_block" : r < 0.55 ? "chiseled_bookshelf" : "bookshelf", r >= 0.35 && r < 0.55 ? { facing: "west", slot_0_occupied: "true", slot_1_occupied: "true", slot_2_occupied: "true", slot_3_occupied: "false", slot_4_occupied: "true", slot_5_occupied: "false" } : undefined);
  }
  // under the balcony: a workbench alcove (z 13..15, y 12..14)
  for (let u = 14; u <= 19; u++) {
    K.put(u, 12, 15, "barrel", { facing: "up", open: "false" });
    K.put(u, 13, 15, u % 2 ? "cauldron" : "brewing_stand", u % 2 ? undefined : { has_bottle_0: "true", has_bottle_1: "true", has_bottle_2: "false" });
  }
  K.put(12, 12, 14, "blast_furnace", { facing: "east", lit: "true" });
  K.put(12, 13, 14, "smithing_table"); K.put(12, 12, 13, "anvil", { facing: "north" });
  // balcony: iron railing with lanterns, a few jars
  for (let u = 14; u <= 19; u++) K.put(u, 16, 13, "iron_bars");
  K.lantern(14, 17, 13); K.lantern(19, 17, 13);
  jar(K, 16, 16, 14, "red_nether_bricks", "light_blue_stained_glass");
  // valve signs beside the doorways
  K.wallSign(13, 17, 15, "dark_oak", "n", ["MITRAL VALVE", "(TWO LEAFLETS)", "MIND THE DRAUGHT", ""], { color: "white" });
  // ceiling lamps set into the heart muscle
  ceilingLamps(K, RM.LV, 3, "glowstone");
}
