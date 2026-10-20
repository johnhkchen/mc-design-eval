// Helpers from plan.md VOCABULARY (second set): slot, entry_steps, spire, glow_floor, ribbon, boulder, birch.
// Each takes its position as arguments, writes only inside its own footprint, and returns { placed, refused }.
// Writes go only into air. A cell that already holds a block is refused (listed in `refused`, not written) unless the
// option { over: true } says the helper owns that cell (a slot cut into a built wall, a light set into a finished floor).
// Coordinates: x east, y up, z south (north = low z). y is the course the plan names; ground block gy means stand at gy+1.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const newOut = () => ({ placed: 0, refused: [] });

// One write into the helper's footprint. A guard() wrapper refuses protected cells itself, so that is counted too.
function put(g, out, x, y, z, block, state, { over = false, nbt } = {}) {
  if (!g.inBounds(x, y, z) || (!over && !g.isAir(x, y, z))) { out.refused.push([x, y, z, block]); return; }
  if (block === "air" && g.isAir(x, y, z)) return;             // carving an empty cell: nothing to do
  const before = g.refused?.length ?? 0;
  g.set(x, y, z, block, state, nbt);
  if ((g.refused?.length ?? 0) > before) out.refused.push([x, y, z, block]);
  else out.placed++;
}

/** Clear slit in a cube wall at course y (default 9): the outer face cell left out (air), the inner cell tinted glass.
 *  x0..x1 are the cells along the wall; zOuter is the face, zInner the cell one in (plan E3: C1 x 5..11 at z 4 / 5). */
export function slot(g, x0, x1, zOuter, zInner, { y = 9, over = false } = {}) {
  const out = newOut();
  for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) {
    put(g, out, x, y, zOuter, "air", null, { over });
    put(g, out, x, y, zInner, "tinted_glass", null, { over });
  }
  return out;
}

/** Entrance steps: a bottom slab row at z (one half step from grade), then a level landing of full blocks at
 *  z landing0..landing1 (plan E6: z 3, then z 4..5 at y 1). Never stairs. Needs 2 or more cells across and in depth. */
export function entry_steps(g, x0, x1, z, landing0, landing1, { y = 1, material = "polished_granite", over = false } = {}) {
  if (Math.abs(x1 - x0) + 1 < 2) throw new Error("entry_steps: the steps must be 2 or more cells wide");
  if (Math.abs(landing1 - landing0) + 1 < 2) throw new Error("entry_steps: the landing must be 2 or more cells deep");
  const out = newOut();
  const [slab, slabState] = B.slab(material, "bottom");
  for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) put(g, out, x, y, z, slab, slabState, { over });
  for (let zl = Math.min(landing0, landing1); zl <= Math.max(landing0, landing1); zl++)
    for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) put(g, out, x, y, zl, material, null, { over });
  return out;
}

/** Ad Astra spire on the terrace at (x, z): iron_block shaft y0..y0+11, end_rods on the four horizontal neighbours
 *  at y0+9 and y0+11 (each pointing away from the shaft), lightning_rod y0+12..y0+15. y0 = 2 in the NASM plot. */
export function spire(g, x, z, { y0 = 2, over = false } = {}) {
  const out = newOut();
  for (let y = y0; y <= y0 + 11; y++) put(g, out, x, y, z, "iron_block", null, { over });
  for (const y of [y0 + 9, y0 + 11])
    for (const [dx, dz, facing] of [[-1, 0, "west"], [1, 0, "east"], [0, -1, "north"], [0, 1, "south"]])
      put(g, out, x + dx, y, z + dz, "end_rod", { facing }, { over });
  for (let y = y0 + 12; y <= y0 + 15; y++) put(g, out, x, y, z, "lightning_rod", { facing: "up", powered: "false" }, { over });
  return out;
}

/** Pearlescent froglight set into the floor at course y (default 1), one per [x, z] cell, axis y. The floor there is the
 *  ground floor block, so a finished floor needs { over: true }. */
export function glow_floor(g, cells, { y = 1, over = false } = {}) {
  const out = newOut();
  for (const [x, z] of cells) put(g, out, x, y, z, "pearlescent_froglight", { axis: "y" }, { over });
  return out;
}

/** Window slits in a curved tier wall at course y. tierE = { cx, cz, rx, rz } is the tier's ellipse; its wall is the
 *  2-thick ring inside it. Along the outer ring cells that arc(x, z) accepts, taken in order round the curve, every
 *  `every`-th cell is a slit: the outer cell left out (air), the inner cell brown_stained_glass; the stone between stays. */
export function ribbon(g, tierE, y, arc, { every = 4, over = false } = {}) {
  const { cx, cz, rx, rz } = tierE;
  const inE = (x, z, k) => rx - k > 0 && rz - k > 0 && ((x - cx) / (rx - k)) ** 2 + ((z - cz) / (rz - k)) ** 2 <= 1;
  const outerCell = (x, z) => inE(x, z, 0) && !inE(x, z, 1);
  const innerCell = (x, z) => inE(x, z, 1) && !inE(x, z, 2);
  const outer = [];
  for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++)
    for (let z = Math.floor(cz - rz); z <= Math.ceil(cz + rz); z++) if (outerCell(x, z) && arc(x, z)) outer.push([x, z]);
  const angle = ([x, z]) => { const a = Math.atan2(z - cz, x - cx); return a < 0 ? a + 2 * Math.PI : a; };
  const radius = ([x, z]) => ((x - cx) / rx) ** 2 + ((z - cz) / rz) ** 2;
  outer.sort((p, q) => angle(p) - angle(q));
  const out = newOut();
  outer.forEach(([x, z], i) => {
    if (i % every !== 0) return;
    const inner = [[x + 1, z], [x - 1, z], [x, z + 1], [x, z - 1], [x + 1, z + 1], [x - 1, z - 1], [x + 1, z - 1], [x - 1, z + 1]]
      .filter(([a, b]) => innerCell(a, b));                  // the stair-stepped ring is diagonal at its corners
    if (!inner.length) { out.refused.push([x, y, z, "brown_stained_glass"]); return; }
    inner.sort((p, q) => radius(p) - radius(q));           // the inner cell nearest the centre
    const before = out.refused.length;
    put(g, out, x, y, z, "air", null, { over });
    if (out.refused.length > before) return;                // outer cell is solid: no slit, no glass behind it
    put(g, out, inner[0][0], y, inner[0][1], "brown_stained_glass", null, { over });
  });
  return out;
}

/** A 2x2x2 boulder with its low corner at (x, z) sitting on the ground block gy (cells gy+1..gy+2). Tuff, andesite and
 *  granite in a fixed pattern; the top corner [dx, dz] in `omit` is left off. */
export function boulder(g, x, z, gy, { mix = ["tuff", "andesite", "granite"], omit = [1, 1], over = false } = {}) {
  const out = newOut();
  for (let dy = 1; dy <= 2; dy++)
    for (let dz = 0; dz <= 1; dz++)
      for (let dx = 0; dx <= 1; dx++) {
        if (dy === 2 && dx === omit[0] && dz === omit[1]) continue;
        put(g, out, x + dx, gy + dy, z + dz, mix[(dx + 2 * dz + 4 * (dy - 1)) % mix.length], null, { over });
      }
  return out;
}

/** A small birch at (x, z) on the ground block gy: birch_log trunk (axis y) at gy+1..gy+height and a persistent crown of
 *  birch_leaves, radius 2 over the top three courses, then a plus-shaped cap on top of the trunk. */
export function birch(g, x, z, gy, { height = 5, over = false } = {}) {
  const out = newOut();
  const [log, logState] = B.log("birch", "y");
  for (let y = gy + 1; y <= gy + height; y++) put(g, out, x, y, z, log, logState, { over });
  const top = gy + height;
  const leaves = { persistent: "true", distance: "1", waterlogged: "false" };
  for (let y = top - 2; y <= top + 1; y++) {
    const limit = y === top + 1 ? 1 : 5;                    // dx²+dz² limit: radius ~2 with the corners off
    for (let dz = -2; dz <= 2; dz++)
      for (let dx = -2; dx <= 2; dx++) {
        if (dx * dx + dz * dz > limit) continue;
        if (dx === 0 && dz === 0 && y <= top) continue;     // the trunk
        put(g, out, x + dx, y, z + dz, "birch_leaves", leaves, { over });
      }
  }
  return out;
}
