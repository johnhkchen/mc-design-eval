// The way in: the inferior vena cava stands at the heart's lower left like a stone-collared pipe tower. A double door in
// its front opens on a square spiral stair that rises to the right atrium's floor (y=8).
import { RM } from "./interior.mjs";
import { signboard } from "../../../../../../minecraft-design/tools/src/build.mjs";
import { R, idx } from "./anat.mjs";

// clean 4x4 shaft u3..6, z9..12, y1..7 (edits the field, so it runs before the blocks are emitted)
export function entranceShape(F) {
  for (let u = 3; u <= 6; u++) for (let z = 9; z <= 12; z++) {
    for (let y = 0; y <= 7; y++) {
      const i = idx(u, y, z);
      if (y >= 1) { F.a[i] = 0; F.room[i] = RM.IVC; } else { F.room[i] = 0; F.a[i] = R.VM; }
    }
  }
}

export function entrance(K, F) {
  const wallMat = "dark_prismarine";
  // fill: everything in the shaft that is not the stair ring, up to y=7
  const ring = [[4, 9], [5, 9], [6, 9], [6, 10], [6, 11], [6, 12], [5, 12]];
  const isRing = (u, z) => ring.some(([a, b]) => a === u && b === z);
  for (let u = 3; u <= 6; u++) for (let z = 9; z <= 12; z++) {
    if (isRing(u, z)) continue;
    const top = u === 4 && z === 12 ? 7 : 7;
    for (let y = 1; y <= top; y++) K.put(u, y, z, y === 1 ? "polished_andesite" : ((u + z + y) & 1 ? "stone_bricks" : "polished_andesite"));
  }
  // ring cells: ground floor, support under each stair, the stair itself
  const faces = ["r", "r", "s", "s", "s", "l", "l"];
  ring.forEach(([u, z], k) => {
    const sy = k + 1;
    for (let y = 1; y < sy; y++) K.put(u, y, z, "stone_bricks");
    K.stairs(u, sy, z, "stone_brick", faces[k]);
  });
  // the first four steps run in a covered passage (cap at y=7, so the vestibule floor is continuous);
  // the last three open into a stairwell, guarded by two balusters
  ring.slice(0, 4).forEach(([u, z]) => K.put(u, 7, z, "stone_bricks"));
  K.put(6, 8, 10, "dark_oak_fence"); K.put(5, 8, 11, "dark_oak_fence");
  // ground floor of the entry hall
  for (let u = 3; u <= 6; u++) for (let z = 9; z <= 12; z++) K.put(u, 0, z, "stone_bricks");

  // ---- the door --------------------------------------------------------------------------------------------------
  // the tower wall at the door is the single course z=8 (u 3..6)
  K.put(4, 1, 8, "air"); K.put(5, 1, 8, "air"); K.put(4, 2, 8, "air"); K.put(5, 2, 8, "air");
  K.clear(4, 1, 8); K.clear(5, 1, 8); K.clear(4, 2, 8); K.clear(5, 2, 8);
  // iron double door facing the street
  K.door(5, 1, 8, "warped", "n", "left");
  K.door(4, 1, 8, "warped", "n", "right");
  // frame: copper jambs, a stepped copper lintel with a keystone, flanking lanterns
  for (const u of [3, 6]) { K.put(u, 1, 8, "waxed_cut_copper"); K.put(u, 2, 8, "waxed_cut_copper"); }
  for (const u of [3, 4, 5, 6]) K.put(u, 3, 8, "waxed_cut_copper");
  K.stairs(3, 3, 7, "waxed_cut_copper", "s", "top"); K.stairs(6, 3, 7, "waxed_cut_copper", "s", "top");
  K.slab(4, 3, 7, "waxed_cut_copper", "top"); K.slab(5, 3, 7, "waxed_cut_copper", "top");
  K.put(4, 4, 8, "waxed_copper_block"); K.put(5, 4, 8, "waxed_copper_block");
  // the name board over the door: a signboard brush (plank board, slab cap, stair brackets, wall signs on it)
  signboard(K.g, "DR. V. CORDIS|CARDIAC LAB|KNOCK TWICE", { at: [K.X(5), 5, 8], face: "north", mode: "wall", width: 4, height: 2, wood: "dark_oak", dataVersion: 4189 });
  // lamp posts either side of the stoop
  for (const u of [2, 7]) {
    K.put(u, 1, 6, "dark_oak_fence"); K.put(u, 2, 6, "dark_oak_fence"); K.put(u, 3, 6, "dark_oak_fence"); K.lantern(u, 4, 6, false);
  }
  // paved stoop
  for (let u = 3; u <= 6; u++) for (let z = 0; z <= 7; z++) K.put(u, 0, z, (u + z) & 1 ? "stone_bricks" : "polished_andesite");
}
