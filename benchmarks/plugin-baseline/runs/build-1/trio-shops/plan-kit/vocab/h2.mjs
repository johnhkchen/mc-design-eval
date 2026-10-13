// Vocabulary helpers from plan.md (VOCABULARY), second set: shop_name, hanging_shop_sign, cornice_run,
// juliet_balcony, stair_flight, chimney_stack, lamp_post. Each takes the grid first, then its position (and facing).
// Every write goes into air only: a cell an earlier part owns is skipped and counted, never overwritten. Each helper
// returns { placed, skipped } so the caller can see what was refused.
import { B, plaque } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const tally = () => ({ placed: 0, skipped: [] });

// one block into air, or record the refusal; `block` is the [id, state, nbt] tuple from B.* or a literal pair
function put(g, out, x, y, z, [block, state, nbt]) {
  if (!g.inBounds(x, y, z) || !g.isAir(x, y, z)) return out.skipped.push([x, y, z, block]);
  const before = g.refused?.length ?? 0;
  g.set(x, y, z, block, state, nbt);
  if ((g.refused?.length ?? 0) > before) return out.skipped.push([x, y, z, block]);
  out.placed++;
}

/** Banner letters on the fascia: y 6..7 at z 6, over the 7 cells x a+1..a+7, in the shop's colour (blue, green, red). */
export function shop_name(g, a, word, colour) {
  const r = plaque(g, word, { at: [a + 7, 6, 7], face: "north", width: 7, height: 2, material: null, wall: `${colour}_concrete`, style: "banner", dataVersion: g.dataVersion });
  return { placed: r.cells, skipped: r.skipped ? [`${r.skipped} plaque letters refused`] : [] };
}

/** Fence arm from the pier (x, y 6, z) with a dark oak hanging sign under it (y 5). z 5 is the street side of the pier at z 6. */
export function hanging_shop_sign(g, x, word, z = 5) {
  const out = tally();
  put(g, out, x, 6, z, ["dark_oak_fence", { south: "true" }]);
  put(g, out, x, 5, z, B.sign("dark_oak", [word], { wall: false, hanging: true, rotation: 8, color: "white", dataVersion: g.dataVersion }));
  return out;
}

/** Upside-down smooth sandstone stairs along z 6 (lip to the street, facing south) from x0 to x1 at height y.
 *  dentils: a row of top slabs one below (y - 1) every 2nd cell, for the main cornice. */
export function cornice_run(g, y, x0, x1, { dentils = false } = {}) {
  const out = tally();
  for (let x = x0; x <= x1; x++) put(g, out, x, y, 6, B.stairs("smooth_sandstone", "south", "top"));
  if (dentils) for (let x = x0; x <= x1; x += 2) put(g, out, x, y - 1, 6, B.slab("smooth_sandstone", "top"));
  return out;
}

/** Juliet balcony on the centre French window of the house whose low-x wall is a: slab deck at y 9, iron rail at y 10, z 6, x a+4..a+8. */
export function juliet_balcony(g, a) {
  const out = tally();
  for (let x = a + 4; x <= a + 8; x++) {
    put(g, out, x, 9, 6, B.slab("smooth_sandstone", "bottom"));
    put(g, out, x, 10, 6, ["iron_bars", { north: "false", south: "false", east: "true", west: "true" }]);
  }
  return out;
}

/**
 * A straight stair flight: one dark oak stair per step, x0..x1 wide, the first step at (zStart, yStart), one step per
 * cell from zStart to zEnd. facing = the way it rises (the stairs' back): "south" or "north" (z must run that way).
 * rail: "west" | "east" puts a dark oak fence post at the open side (x0-1 or x1+1) at each step's head height, or null.
 * Writes nothing under the steps: the shell owns the body below them.
 */
export function stair_flight(g, x0, x1, zStart, zEnd, yStart, facing, { rail = null } = {}) {
  const dz = Math.sign(zEnd - zStart), want = { south: 1, north: -1 }[facing];
  if (!want || dz !== want) throw new Error(`stair_flight: facing ${facing} needs zEnd ${want > 0 ? "after" : "before"} zStart`);
  const out = tally(), n = Math.abs(zEnd - zStart) + 1;
  for (let i = 0; i < n; i++) {
    const z = zStart + i * dz, y = yStart + i;
    for (let x = x0; x <= x1; x++) put(g, out, x, y, z, B.stairs("dark_oak", facing, "bottom"));
    if (rail) put(g, out, rail === "west" ? x0 - 1 : x1 + 1, y + 1, z, B.fence("dark_oak"));
  }
  return out;
}

/** Rear chimney stack, 3 wide by 2 deep at x0..x0+2, z0..z0+1 (z0 = 25 for the terrace): brick body y 1..25, flue
 *  cell (x0+1, z0) left open, stone brick band at y 26, hay in the flue on the band (y 27), lit campfire on the hay
 *  (y 28), smooth sandstone cap slabs at y 27 stepping out one cell round the stack. */
export function chimney_stack(g, x0, z0 = 25) {
  const out = tally(), flue = [x0 + 1, z0];
  for (let x = x0; x <= x0 + 2; x++) for (let z = z0; z <= z0 + 1; z++) {
    const isFlue = x === flue[0] && z === flue[1];
    for (let y = 1; y <= 25; y++) if (!isFlue) put(g, out, x, y, z, B.block("bricks"));
    put(g, out, x, 26, z, B.block("stone_bricks"));
  }
  put(g, out, flue[0], 27, flue[1], ["hay_block", { axis: "y" }]);
  put(g, out, flue[0], 28, flue[1], ["campfire", { facing: "north", lit: "true" }]);
  for (let x = x0 - 1; x <= x0 + 3; x++) for (let z = z0 - 1; z <= z0 + 2; z++) {
    if (x === flue[0] && z === flue[1]) continue;
    put(g, out, x, 27, z, B.slab("smooth_sandstone", "bottom"));
  }
  return out;
}

/** Street lamp on the kerb (y 1) at (x, z): dark oak fence post y 2..4, lantern on top at y 5. */
export function lamp_post(g, x, z = 5) {
  const out = tally();
  for (let y = 2; y <= 4; y++) put(g, out, x, y, z, B.fence("dark_oak"));
  put(g, out, x, 5, z, B.lantern(false));
  return out;
}
