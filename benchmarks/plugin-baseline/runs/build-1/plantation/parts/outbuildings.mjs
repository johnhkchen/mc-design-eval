// Part: outbuildings (plan.md SITE rows "carriage house" and "guest cottage", ROOFS, OPENINGS auxiliaries).
// The carriage house (x76..91, z40..53) is a bricks body with a hip slate roof and a cupola; the guest cottage
// (x76..87, z64..75) is the house in miniature on a bricks base with its own porch and hip roof. Both come from the
// vocabulary helpers; this part only places them and adds the chimney the cottage's plan calls for.
// Writes go only into air: the helpers skip any cell an earlier part already filled.
import { carriageHouse, cottage } from "../vocab.mjs";

// The carriage helper asks hipRoof for material "slate", which has no block of that name; the palette's slate is
// deepslate_tile. Spell each write the palette's way as it is made (state kept): re-spelling the cells afterwards
// would leave the first spelling in the part's write log, and the palette report counts that.
const PALETTE_SPELLING = { slate_stairs: "deepslate_tile_stairs", slate_slab: "deepslate_tile_slab", slate: "deepslate_tiles" };
function onPalette(g) {
  return new Proxy(g, {
    get(target, prop) {
      if (prop === "set") return (x, y, z, block, state, nbt) => {
        const name = typeof block === "string" ? block.replace("minecraft:", "") : block;
        return target.set(x, y, z, PALETTE_SPELLING[name] ?? block, state, nbt);
      };
      const v = Reflect.get(target, prop);
      return typeof v === "function" ? v.bind(target) : v;
    },
  });
}

export function build(g) {
  // Carriage house: plan.md SITE row (x76..91, z40..53), three arched bays on the north face z40.
  carriageHouse(onPalette(g), 76, 40, "north");

  // Guest cottage: plan.md SITE row (x76..87, z64..75), floor row y1, porch z60..63 in front of the north wall.
  cottage(g, 76, 64, "north", 1);
  // The cottage is the house in miniature, white on a brick base (plan.md): the helper walls it in brick, so the
  // body above the base row is re-spelled white_concrete. The chimney stack keeps its brick.
  for (let x = 76; x <= 87; x++)
    for (let y = 2; y <= 6; y++)
      for (let z = 64; z <= 75; z++) {
        const onStack = (x === 85 || x === 86) && (z === 72 || z === 73);
        if (!onStack && g.get(x, y, z)?.block === "minecraft:bricks") g.set(x, y, z, "white_concrete");
      }

  // Cottage chimney from R-cottage: a 2x2 brick stack at (85,72), rising through the hip to y10 (two courses above
  // the roof at y8). The stack's cells over the roof are written over (this part owns the roof and the stack), so the
  // roof's slabs don't sit under it. It is a short stack, not chimneyStack's 28-high one, and has no campfire.
  for (let y = 2; y <= 10; y++)
    for (const x of [85, 86]) for (const z of [72, 73]) g.set(x, y, z, "bricks");
}
