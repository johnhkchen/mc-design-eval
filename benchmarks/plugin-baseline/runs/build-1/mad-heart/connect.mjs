// Circulation inside the heart. The valves are the doorways:
//   outside -> IVC door -> spiral stair -> RA hall (floor y=8)
//   RA -> tricuspid doorway -> RV gallery (floor y=8)             RV -> pulmonary valve -> ladder up the pulmonary trunk
//   RA ladder -> RA mezzanine (y=16) -> "Gerbode shortcut" (a septal hole) -> LV balcony (y=16)
//   LV balcony -> mitral doorway -> LA (floor y=16)               LV balcony -> stairs down -> LV lab floor (y=12)
//   LV balcony -> aortic valve -> ladder up the ascending aorta to the arch loft
import { RM } from "./interior.mjs";

// ---- field edits (before the blocks are emitted) ------------------------------------------------------------------
export function connectShape(F, S) {
  // RA first floor (top y=12) across the whole hall, with a hole for the ladder
  S.slab(3, 11, 5, 9, 11, 16);
  S.open(3, 11, 12, 3, 11, 12, RM.RA);
  // RA mezzanine slab (floor top y=16) over the back of the hall
  S.slab(3, 15, 13, 9, 15, 16);
  // Gerbode shortcut: a doorway through the septum from the RA mezzanine to the LV balcony
  S.open(9, 16, 14, 11, 18, 15, RM.LV);
  // RA ladder column (a niche so the ladder always has a wall behind it)
  S.open(3, 8, 12, 3, 16, 12, RM.RA);
  // aortic valve ladder: a shaft along the bulkhead from the balcony up into the ascending aorta
  S.open(12, 16, 15, 12, 32, 15, RM.AO);
  S.open(13, 31, 15, 13, 33, 15, RM.AO);          // the way out of the ladder shaft into the loft
  // pulmonary valve ladder: from the RV conus up the pulmonary trunk
  S.open(11, 8, 6, 11, 24, 6, RM.PT);
}

// ---- overlays ------------------------------------------------------------------------------------------------------
export function connect(K) {
  // RA: ladder to the mezzanine, rail along the mezzanine's open edge
  for (let y = 8; y <= 16; y++) K.ladder(3, y, 12, "r");
  for (let u = 5; u <= 9; u++) K.put(u, 16, 13, "dark_oak_fence");
  // aortic ladder and its support column
  for (let y = 16; y <= 31; y++) K.ladder(12, y, 15, "n");
  // pulmonary ladder (a column of brick behind it wherever the RV wall falls away)
  for (let y = 8; y <= 22; y++) { if (K.free(11, y, 7)) K.put(11, y, 7, "stone_bricks"); }
  // LV: stairs from the balcony down to the lab floor, along the septum side of the balcony (u=13, z=12 -> 9)
  for (let k = 0; k < 4; k++) {
    const z = 12 - k, y = 15 - k;
    K.stairs(13, y, z, "polished_andesite", "s");
    for (let yy = 12; yy < y; yy++) K.put(13, yy, z, "polished_andesite");
  }
}
