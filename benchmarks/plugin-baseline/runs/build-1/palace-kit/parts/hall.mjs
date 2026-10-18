// Exhibition hall and lamps (plan.md PARTS 6): the plot 3 hall bay (x 96..111, z 0..23) with its wall, pilasters,
// blind arch, frieze, cornice, parapet, the shed roof by hand, the hall's hanging lanterns, and the four corner lamp
// standards in plot 0. Builds into air only; every element that a vocab helper covers goes through that helper.
import { blindArch, shedRoof, lampStandard } from "../vocab.mjs";

const X0 = 96;
const X1 = 111;
const FRONT = 4; // the wall face (north); the wall is 3 thick, z 4..6
const ARCH_X = 103.5; // blind arch centre (the recess is x 100..107)

// Blind arch opening (plan.md Plot 3): |dx| <= 3.5 up to the springline y 12, then a circle of radius 4.5 above.
function inArch(x, y) {
  const dx = x - ARCH_X;
  if (y <= 12) return Math.abs(dx) <= 3.5;
  return dx * dx + (y - 12) ** 2 <= 4.5 ** 2;
}

export function build(g) {
  const refused = [];
  // Writes only into air: a cell already placed (by this part) is skipped, never replaced.
  const put = (x, y, z, block, state) => {
    if (!g.inBounds(x, y, z) || !g.isAir(x, y, z)) { refused.push([x, y, z]); return; }
    g.set(x, y, z, block, state);
  };

  // Roof first, then the arch (its archivolt and keystone sit on the front plane), so the wall fill below
  // skips every cell they took.
  shedRoof(g, [X0, 7, X1, 23], 24);
  blindArch(g, ARCH_X, FRONT);

  // Wall body z 4..6, y 1..22: smooth_sandstone, the frieze band at y 18..20 on the face, the recess opening
  // (z 4..5) left as air and its back (z 6) in sandstone.
  for (let x = X0; x <= X1; x++) for (let y = 1; y <= 22; y++) for (let z = FRONT; z <= 6; z++) {
    if (z <= 5 && inArch(x, y)) continue;
    if (z === 6 && inArch(x, y)) { put(x, y, z, "sandstone"); continue; }
    if (z === FRONT && y >= 18 && y <= 20) {
      const tablet = y === 19 && [98, 102, 105, 109].includes(x);
      put(x, y, z, tablet ? "chiseled_sandstone" : "cut_sandstone");
      continue;
    }
    put(x, y, z, "smooth_sandstone");
  }

  // Plinth (proud 1, z 3, y 1..2) and the pilasters (proud 1, y 3..17, chiseled capital at y 17) at the bay ends.
  for (let x = X0; x <= X1; x++) for (let y = 1; y <= 2; y++) put(x, y, 3, "sandstone");
  for (const x of [X0, X0 + 1, X1 - 1, X1]) {
    for (let y = 3; y <= 16; y++) put(x, y, 3, "cut_sandstone");
    put(x, 17, 3, "chiseled_sandstone");
  }

  // Cornice: cut_sandstone at y 21 (proud 1), upside-down smooth_sandstone_stairs at y 22 with the lip to the street.
  for (let x = X0; x <= X1; x++) {
    put(x, 21, 3, "cut_sandstone");
    put(x, 22, 3, "smooth_sandstone_stairs", { facing: "south", half: "top" });
  }

  // Parapet z 4..5, y 23..26, with a sunk panel x 100..107, y 24..25 (1 deep, back at z 5); coping slab at y 27.
  for (let x = X0; x <= X1; x++) for (let y = 23; y <= 26; y++) for (let z = FRONT; z <= 5; z++) {
    const panel = x >= 100 && x <= 107 && y >= 24 && y <= 25;
    if (panel && z === FRONT) continue;
    put(x, y, z, panel && z === 5 ? "sandstone" : "smooth_sandstone");
  }
  for (let x = X0; x <= X1; x++) for (let z = FRONT; z <= 5; z++) put(x, 27, z, "cut_sandstone_slab", { type: "bottom" });

  // Back wall (south, z 22), plain sandstone, y 1..16.
  for (let x = X0; x <= X1; x++) for (let y = 1; y <= 16; y++) put(x, y, 22, "sandstone");

  // Lamps. A lantern hangs from something: the blind arch head hangs from the keystone wall at y 17;
  // each pilaster face (x 97 and 110) has a cut_sandstone bracket at y 6 with a lantern under it.
  put(103, 16, 5, "lantern", { hanging: "true" });
  for (const x of [97, 110]) {
    put(x, 6, 2, "cut_sandstone");
    put(x, 5, 2, "lantern", { hanging: "true" });
  }

  // Hall interior: hanging lanterns under the roof at z 10 and z 17, every 5 along x. Each hangs under the lowest
  // roof block of its column, found in the built roof. Under a roof 16 high they light only the air above the
  // floor, so each also stands on a sandstone_wall post at floor height (a lamp post, lantern on top at y 2).
  for (const z of [10, 17]) for (const x of [98, 103, 108]) {
    let roofY = null;
    for (let y = 17; y <= 30; y++) if (!g.isAir(x, y, z)) { roofY = y; break; }
    if (roofY !== null && g.isAir(x, roofY - 1, z)) put(x, roofY - 1, z, "lantern", { hanging: "true" });
    put(x, 1, z, "sandstone_wall", { up: "true" });
    put(x, 2, z, "lantern", { hanging: "false" });
  }

  // Corner lamp standards outside the rotunda ring (plot 0).
  for (const [x, z] of [[6, 6], [57, 6], [6, 57], [57, 57]]) lampStandard(g, x, z);

  if (refused.length) console.log(`hall: ${refused.length} writes skipped (cells already filled by the arch or roof)`);
}
