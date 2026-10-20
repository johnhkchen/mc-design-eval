// Shared by the parts: hidden sea lanterns on a grid in the exposed tops of a part's own floors and roofs, so no
// sky-lit or dark top surface is left without block light (mobs spawn on full-block tops at block light 0).

/** Every cell in the box whose block is one of `blocks`, with air above it and on the `step` grid round the axis,
 *  becomes a sea_lantern. Returns the number placed. */
export function exposedLamps(g, [x0, y0, z0], [x1, y1, z1], { step = 6, blocks = ["smooth_quartz"], axis = [32, 32] } = {}) {
  const ids = new Set(blocks.map((b) => (b.includes(":") ? b : `minecraft:${b}`)));
  let n = 0;
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    if ((x - axis[0]) % step !== 0 || (z - axis[1]) % step !== 0) continue;
    if (!ids.has(g.blockAt(x, y, z)) || !g.isAir(x, y + 1, z)) continue;
    g.set(x, y, z, "sea_lantern", {});
    n++;
  }
  return n;
}
