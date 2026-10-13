// Part: rear chimney stacks, one per house (plan.md CHIMNEYS and the chimney_stack vocabulary). Each stack is a 3 x 2
// brick body on its own footing (y 1..25, z 25..26) with a 1 x 1 flue up the middle at the house's flue x (31, 19, 7).
// Top: a stone brick band at y 26 across the whole stack, hay in the flue at y 27, a lit signal campfire on the hay at
// y 28 (a campfire on hay is a signal fire: the hay below is what makes the smoke rise high in this version, there is
// no signal_fire state), and a smooth sandstone cap course at y 27 stepping out one cell round the stack. Writes go
// into air only; a cell an earlier part owns is skipped and listed.
// The vocab's chimney_stack() is close, but this part draws its own stack for the cap and the flue's hay.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { CHIMNEY_FLUE_X } from "../vocab.mjs";

const Z0 = 25;

// one block into air, or record the refusal; `tuple` is [block, state, nbt] from B.* or a literal [block, state]
function put(g, out, x, y, z, tuple) {
  if (!g.inBounds(x, y, z) || !g.isAir(x, y, z)) return out.skipped.push([x, y, z, tuple[0]]);
  g.set(x, y, z, ...tuple);
  out.placed++;
}

/** One stack: body, band, flue, signal fire and cap. flueX is the 1 x 1 flue's x; the stack spans flueX-1..flueX+1. */
function stack(g, flueX) {
  const out = { placed: 0, skipped: [] };
  const x0 = flueX - 1;
  for (let x = x0; x <= x0 + 2; x++) for (let z = Z0; z <= Z0 + 1; z++) {
    const isFlue = x === flueX && z === Z0;
    if (!isFlue) for (let y = 1; y <= 25; y++) put(g, out, x, y, z, B.block("bricks"));
    put(g, out, x, 26, z, B.block("stone_bricks"));
  }
  put(g, out, flueX, 27, Z0, ["hay_block", { axis: "y" }]);
  put(g, out, flueX, 28, Z0, ["campfire", { facing: "north", lit: "true" }]);
  for (let x = x0 - 1; x <= x0 + 3; x++) for (let z = Z0 - 1; z <= Z0 + 2; z++) {
    if (x === flueX && z === Z0) continue;
    put(g, out, x, 27, z, B.slab("smooth_sandstone", "bottom"));
  }
  return out;
}

export function build(g) {
  const tally = { placed: 0, skipped: [] };
  for (const flueX of Object.values(CHIMNEY_FLUE_X)) {
    const r = stack(g, flueX);
    tally.placed += r.placed;
    tally.skipped.push(...r.skipped);
  }
  if (tally.skipped.length) console.log(`chimneys: ${tally.skipped.length} cells already built, left alone`);
  return tally;
}
