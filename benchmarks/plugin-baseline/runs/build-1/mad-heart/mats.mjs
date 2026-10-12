// Materials by role, with low-frequency patch noise so the flesh reads as zones, not static.
import { R } from "./anat.mjs";

const hash = (a, b, c, seed = 0) => {
  let h = (a * 374761393 + b * 668265263 + c * 2147483647 + seed * 1274126177) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
};
const lerp = (a, b, t) => a + (b - a) * t;
const sm = (t) => t * t * (3 - 2 * t);
// smooth value noise at scale s (cells per feature)
export function noise(u, y, z, s = 3, seed = 0) {
  const x = u / s, yy = y / s, zz = z / s;
  const x0 = Math.floor(x), y0 = Math.floor(yy), z0 = Math.floor(zz);
  const fx = sm(x - x0), fy = sm(yy - y0), fz = sm(zz - z0);
  let acc = 0;
  for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) for (let k = 0; k < 2; k++)
    acc += hash(x0 + i, y0 + j, z0 + k, seed) * (i ? fx : 1 - fx) * (j ? fy : 1 - fy) * (k ? fz : 1 - fz);
  return acc;
}
export const rnd = (u, y, z, seed = 0) => hash(u, y, z, seed);

// pick from [[block, weight], ...] with noise t in 0..1
export function pick(list, t) {
  const tot = list.reduce((a, b) => a + b[1], 0);
  let acc = 0;
  for (const [b, w] of list) { acc += w / tot; if (t <= acc) return b; }
  return list[list.length - 1][0];
}

export const EXT = {
  [R.VM]: [["red_terracotta", 58], ["pink_terracotta", 14], ["netherrack", 18], ["nether_wart_block", 10]],
  [R.RA]: [["netherrack", 52], ["nether_wart_block", 20], ["red_terracotta", 28]],
  [R.LA]: [["netherrack", 50], ["nether_wart_block", 25], ["red_terracotta", 25]],
  [R.AUR]: [["netherrack", 45], ["red_terracotta", 35], ["nether_wart_block", 20]],
  [R.AORTA]: [["red_wool", 50], ["red_concrete", 50]],
  [R.PULM]: [["blue_wool", 45], ["blue_concrete", 55]],
  [R.VENA]: [["blue_concrete", 50], ["blue_terracotta", 30], ["blue_wool", 20]],
  [R.PVEIN]: [["red_concrete", 45], ["red_terracotta", 30], ["red_wool", 25]],
  [R.ART]: [["red_wool", 100]],
  [R.RIB]: [["netherrack", 100]],
  [R.VEIN]: [["blue_concrete", 70], ["blue_wool", 30]],
  [R.FAT]: [["sandstone", 38], ["yellow_concrete_powder", 18], ["sponge", 18], ["yellow_terracotta", 26]],
};

export function extBlock(role, u, y, z) {
  const list = EXT[role];
  if (!list) return "stone";
  const t = noise(u, y, z, role === R.VM ? 3.2 : 2.6, role);
  const j = rnd(u, y, z, 7);
  return pick(list, Math.min(0.999, Math.max(0, 0.78 * t + 0.22 * j)));
}

// ---- interior lining by room ------------------------------------------------------------------------------------
// room codes: 1 RA, 2 RV, 3 LV, 4 LA, 5 AO, 6 PT, 7 SVC, 8 IVC, 9 PA, 10 PVN
const FLESH = [["pink_terracotta", 38], ["red_terracotta", 34], ["netherrack", 28]];
const WALLS = {
  1: FLESH,
  2: [["red_terracotta", 40], ["netherrack", 30], ["nether_wart_block", 30]],
  3: [["pink_terracotta", 30], ["red_terracotta", 40], ["netherrack", 30]],
  4: [["pink_terracotta", 40], ["red_terracotta", 30], ["nether_wart_block", 30]],
  5: [["red_terracotta", 55], ["red_nether_bricks", 45]],
  6: [["blue_terracotta", 60], ["cyan_terracotta", 40]],
  7: [["blue_terracotta", 60], ["cyan_terracotta", 40]],
  8: [["blue_terracotta", 70], ["cyan_terracotta", 30]],
  9: [["blue_terracotta", 60], ["cyan_terracotta", 40]],
  10: [["red_terracotta", 60], ["red_nether_bricks", 40]],
};
export function wallBlock(room, u, y, z) {
  const t = noise(u, y, z, 2.4, 40 + room);
  return pick(WALLS[room] ?? FLESH, Math.min(0.999, 0.8 * t + 0.2 * rnd(u, y, z, 11)));
}
export function floorBlock(room, u, y, z) {
  switch (room) {
    case 1: return ((u + z) & 1) ? "dark_oak_planks" : "spruce_planks";
    case 2: return rnd(u, y, z, 3) < 0.25 ? "polished_deepslate" : "deepslate_tiles";
    case 3: return ((u >> 1) + (z >> 1)) & 1 ? "polished_andesite" : "smooth_stone";
    case 4: return ((u + z) & 1) ? "dark_oak_planks" : "crimson_planks";
    default: return "polished_blackstone";
  }
}
