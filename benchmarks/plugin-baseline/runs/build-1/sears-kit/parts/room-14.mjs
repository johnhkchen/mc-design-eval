// Room "P1 west bedroom" (interior designer's part): two beds on the west wall (heads against the solid wall at x18,
// z14 and z20), a chest dresser on the north wall, a spruce-fence table with a top slab and a standing lantern in the
// middle, a brown rug on the floor and a barrel dresser at the south corner. Inner air x19..21, y6..8, z14..20.
// Everything is drawn as text with layers() (rows run along +x, successive rows along +z); beds go through bed().
//
// BLOCKED (not fixed here): shell west's interior fill (parts/shell-west.mjs, g.fill(..., "air") over x0+1..x1-1,
// y2..top, z0+1..z1-1) makes every interior cell an earlier part's cell, air included, so runParts refuses all
// furnishing writes into this room (15 refused: the 4 bed halves, chest, table post, rug, barrel, slab, lantern).
// Until the shell leaves the interior unset, this part places nothing. The furnishing calls are removed below; the
// bedPair helper and the layout are kept so they can be restored in one step.
const ORIGIN = [19, 6, 14];
const STEP = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };

// Local bed pair, same states as the library's bed(). NOTE: bed() tests air with /(^|_)air$/, which misses the
// "minecraft:air" a built grid reports, so it refuses every bed in a loaded build. Notes in plan.md.
const isAir = (g, x, y, z) => {
  const c = g.get(x, y, z);
  return !c || /(^|:)(cave_)?air$/.test(c.block);
};
function bedPair(g, [x, y, z], facing, color = "red") {
  const [dx, dz] = STEP[facing];
  const hx = x + dx, hz = z + dz;
  if (!isAir(g, x, y, z) || !isAir(g, hx, y, hz)) return false;
  g.set(x, y, z, `${color}_bed`, { facing, part: "foot", occupied: "false" });
  g.set(hx, y, hz, `${color}_bed`, { facing, part: "head", occupied: "false" });
  return true;
}

// Lamplighter: one standing lantern on the floor against the west wall at the room's middle (19,6,17), on the oak
// planks at y5. Measured on a scratch copy (mcd light): it lifts all 21 floor cells to 8+ (min 10, the south corner
// z20 reads 10..12), so no second lantern is needed. It is the one lamp for this room, and it is refused by the lock
// like the furniture above, until shell west leaves the interior unset.
// no other writes: every cell of this room is already owned by shell west (see the note above)
export function build(g) {
  g.set(19, 6, 17, "lantern", { hanging: "false" });
}
