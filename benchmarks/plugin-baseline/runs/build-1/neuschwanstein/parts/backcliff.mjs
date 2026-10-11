// The back (south) cliff: buttresses and gullies, strata ledges and undercuts, a zig-zag service path with a postern
// door into the upper court, and a few pines clinging to the ledges. Authored in lifted (grid) coordinates.
import { hash, B, tree, DY } from "./shared.mjs";
const TOP = 16 + DY;                                      // upper terrace top block
const put = (g, x, y, z, ...b) => { if (g.inBounds(x, y, z)) g.set(x, y, z, ...b); };
const buttress = (x) => {                                  // 0 gully .. 2 buttress, in runs 3-6 wide
  const a = hash(Math.floor(x / 5), 0, 41), b = hash(Math.floor((x + 2) / 3), 1, 42);
  return Math.max(0, Math.min(2, Math.round(a * 2 + b * 1.1 - 0.5)));
};
export const APSE_X = [92, 102];                           // rock buttress carried under the throne-hall apse
const reach = (x, y) => {
  if (x >= APSE_X[0] && x <= APSE_X[1]) return 51;
  const t = TOP - y;
  let r = 47 + buttress(x) + Math.min(2, Math.floor((t - 5) / 6));
  if (hash(Math.floor(y / 3), Math.floor(x / 7), 5) < 0.28) r -= 1;       // undercut band: the ledge above overhangs
  r += (hash(x, y, 7) < 0.14 ? 1 : 0) - (hash(x, y, 8) < 0.1 ? 1 : 0);
  return Math.max(47, Math.min(51, r));
};
const strata = (x, y, z) => {
  const band = Math.floor(y / 4), n = hash(x, z, y);
  if (band % 3 === 0) return n < 0.6 ? "andesite" : "stone";
  if (band % 5 === 2) return n < 0.5 ? "tuff" : "andesite";
  return n < 0.12 ? "cobblestone" : n < 0.2 ? "tuff" : "stone";
};
// service path: switchbacks on the face, z=51 (and z=50 low down); y = surface row
export const PATH = [];
for (let x = 40; x <= 56; x++) PATH.push({ x, y: 4 + (x - 40), dir: "east" });
for (let x = 56; x >= 44; x--) PATH.push({ x, y: 20 + (56 - x), dir: "west" });
export const POSTERN = 44;
export function backCliff(g) {
  const [W] = g.size;
  for (let x = 6; x <= 106; x++) for (let z = 47; z <= 51; z++) {
    for (let y = 0; y <= TOP - 5; y++) {
      if (z <= reach(x, y)) { if (g.isAir(x, y, z) || y > 0) g.set(x, y, z, strata(x, y, z)); }
      else g.unset(x, y, z);
    }
    // ledge tops: moss and gravel where a ledge shows sky
    for (let y = 1; y <= TOP - 5; y++) if (!g.isAir(x, y, z) && g.isAir(x, y + 1, z) && hash(x, z, y + 21) < 0.45) g.set(x, y, z, hash(x, z, y) < 0.6 ? "mossy_cobblestone" : "gravel");
  }
  // retaining wall under the court's south strip (z=50 is court paving; y28..31 would otherwise hang in air)
  for (let x = 39; x <= 58; x++) for (let y = TOP - 4; y <= TOP - 1; y++) g.set(x, y, 50, hash(x, y, 2) < 0.2 ? "mossy_stone_bricks" : "stone_bricks");
  // the path: carve headroom, build the tread, support it down to the rock
  for (const { x, y, dir } of PATH) {
    for (const z of y <= 26 ? [50, 51] : [51]) {
      for (let h = 1; h <= 3; h++) g.unset(x, y + h, z);
      for (let yy = y - 1; yy >= Math.max(0, y - 22); yy--) { if (!g.isAir(x, yy, z)) break; g.set(x, yy, z, "stone_bricks"); }
      g.set(x, y, z, ...B.stairs("stone_brick", dir));
    }
  }
  for (const z of [50, 51]) for (const x of [55, 56]) { g.set(x, 19, z, "stone_bricks"); g.set(x, 20, z, "stone_bricks"); }   // switchback landing
  for (const x of [43, 44, 45]) { g.set(x, TOP, 51, "stone_bricks"); for (let h = 1; h <= 3; h++) g.unset(x, TOP + h, 51); }  // postern landing
  for (const { x, y } of PATH) if (x % 4 === 0 && y > 6) { put(g, x, y + 1, 51, ...B.wall("stone_brick")); put(g, x, y + 2, 51, ...B.lantern(false)); }
}
/** Pines clinging to the ledges (after the castle is merged, so they only take air). */
export function cliffPines(g) {
  let n = 0;
  for (let x = 9; x <= 104; x += 3) {
    if (hash(x, 3, 61) > 0.5) continue;
    if (x >= 38 && x <= 58) continue;                                       // path and postern
    const z = 50;
    for (let y = TOP - 5; y >= 4; y--) {
      if (!g.isAir(x, y, z) && g.isAir(x, y + 1, z)) {
        if (y < TOP - 14 && hash(x, y, 62) < 0.6) { g.set(x, y, z, "mossy_cobblestone"); tree(g, [x, y + 1, z], "spruce", 0.6 + hash(x, y, 63) * 0.3, x * 17 + y); n++; }
        break;
      }
    }
  }
  return n;
}
