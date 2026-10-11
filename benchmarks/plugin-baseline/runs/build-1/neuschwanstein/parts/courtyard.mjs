// Courtyard life in the upper court: fountain, lamp posts, banners, a cart, flower boxes; and the postern wall on its south edge.
import { P, B, hash } from "./shared.mjs";
import { POSTERN } from "./backcliff.mjs";
const put = (g, x, y, z, ...b) => { if (g.inBounds(x, y, z)) g.set(x, y, z, ...b); };
export function courtyard(g, { level }) {
  if (level < 2) return;
  // fountain: 5x5 stone-brick basin, water, a pillar with an upper bowl
  const fx = 45, fz = 37;
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) {
    const ring = Math.max(Math.abs(dx), Math.abs(dz)) === 2;
    if (ring) { g.set(fx + dx, 17, fz + dz, "stone_bricks"); if (Math.abs(dx) + Math.abs(dz) < 4) g.set(fx + dx, 18, fz + dz, ...B.slab("stone_brick", "bottom")); }
    else { g.set(fx + dx, 16, fz + dz, "stone_bricks"); g.set(fx + dx, 17, fz + dz, "water"); }
  }
  for (let y = 17; y <= 19; y++) g.set(fx, y, fz, "quartz_pillar");
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (dx || dz) g.set(fx + dx, 20, fz + dz, ...B.slab("smooth_quartz", "bottom"));
  g.set(fx, 20, fz, "quartz_block");
  g.set(fx, 21, fz, ...B.lantern(false));
  // lamp posts round the court
  for (const [x, z] of [[41, 31], [57, 31], [41, 48], [57, 48], [49, 31], [49, 48], [45, 42], [45, 32]]) {
    if (!g.isAir(x, 17, z)) continue;
    for (const y of [17, 18, 19]) g.set(x, y, z, ...B.wall("stone_brick"));
    g.set(x, 20, z, ...B.lantern(false));
  }
  // postern wall on the court's south edge with a small door (the service path's top)
  for (let x = POSTERN - 3; x <= POSTERN + 3; x++) {
    for (let y = 17; y <= 20; y++) g.set(x, y, 50, y === 17 && hash(x, y, 4) < 0.2 ? "mossy_stone_bricks" : "stone_bricks");
    if ((x - POSTERN) % 2 === 0) g.set(x, 21, 50, "stone_bricks"); else g.set(x, 21, 50, ...B.slab("stone_brick", "bottom"));
  }
  g.set(POSTERN, 17, 50, ...B.door("spruce", "south", "lower")); g.set(POSTERN, 18, 50, ...B.door("spruce", "south", "upper"));
  g.set(POSTERN, 19, 50, "stone_brick_slab", { type: "top", waterlogged: "false" });
  for (const x of [POSTERN - 1, POSTERN + 1]) { g.set(x, 17, 51, ...B.wall("stone_brick")); g.set(x, 18, 51, ...B.lantern(false)); }
  // cart: planked bed, wheels, shafts, a load of hay and barrels
  const cx = 55, cz = 44;
  for (let dx = 0; dx <= 2; dx++) for (let dz = 0; dz <= 1; dz++) g.set(cx + dx, 18, cz + dz, "spruce_planks");
  for (const dz of [-1, 2]) for (const dx of [0, 2]) g.set(cx + dx, 18, cz + dz, ...B.trapdoor("dark_oak", "north", "bottom", true));
  for (const dz of [0, 1]) g.set(cx - 1, 18, cz + dz, ...B.fence("spruce"));
  g.set(cx - 2, 18, cz, ...B.fence("spruce")); g.set(cx - 2, 18, cz + 1, ...B.fence("spruce"));
  g.set(cx, 19, cz, "hay_block", { axis: "y" }); g.set(cx + 1, 19, cz, "hay_block", { axis: "y" }); g.set(cx + 2, 19, cz + 1, "barrel", { facing: "up", open: "false" });
  // Knights' House east face onto the court: flower boxes under the windows, lozenge banners between
  const K = 38;
  for (const zs of [[34, 36], [40, 42]]) for (const y of [19, 26]) for (let z = zs[0]; z <= zs[1]; z++) {
    g.set(K + 1, y, z, ...B.trapdoor("spruce", "east", "bottom", false));
    put(g, K + 1, y + 1, z, ["potted_red_tulip", "potted_azure_bluet", "potted_poppy", "potted_cornflower"][(z + y) % 4], {});
  }
  for (const y of [21, 28]) g.set(K + 1, y, 38, ...B.banner("light_blue", [["rhombus", "white"], ["border", "white"]], { facing: "east" }));
  // banner poles in the court
  for (const x of [41, 57]) { for (const y of [17, 18, 19, 20, 21]) g.set(x, y, 36, ...B.fence("spruce")); g.set(x, 21, 37, ...B.banner("light_blue", [["rhombus", "white"], ["border", "white"]], { facing: "south" })); }
}
