// Back deck and yard (P6, plan.md Part 6, elements 21 and 35): the spruce deck x19..34 z26..31 with posts, railing,
// door and side steps, the cauldron grill and the AC unit, and the back shrub row at z=25. All of it is vocab.mjs's
// deck(), which follows the Part 6 spec. Every cell it writes is outside the shell (z>=25, or y<=2 on the lawn).
import { deck, lampPost } from "./../vocab.mjs";

export function build(g) {
  deck(refuseEarlier(g));
  // yard lamps in the back corners, where the lawn read dark (light 0) beyond the deck
  lampPost(refuseEarlier(g), 4, 29);
  lampPost(refuseEarlier(g), 15, 29);
  lampPost(refuseEarlier(g), 40, 29);
}

// runParts refuses any write into a cell an earlier part already built, and deck() writes straight through, so drop
// those writes here. The cells read as they were when this part started; the ground grass stays writable.
function refuseEarlier(g) {
  const earlier = new Set([...g].filter((c) => c.block !== "minecraft:grass_block").map((c) => c.pos.join(",")));
  const skip = (x, y, z) => earlier.has(`${x},${y},${z}`);
  return new Proxy(g, {
    get(target, prop) {
      if (prop === "set") return (x, y, z, ...rest) => { if (!skip(x, y, z)) target.set(x, y, z, ...rest); return target; };
      if (prop === "fill") return (a, b, block, state) => {
        for (let x = Math.min(a[0], b[0]); x <= Math.max(a[0], b[0]); x++)
          for (let y = Math.min(a[1], b[1]); y <= Math.max(a[1], b[1]); y++)
            for (let z = Math.min(a[2], b[2]); z <= Math.max(a[2], b[2]); z++) if (!skip(x, y, z)) target.set(x, y, z, block, state);
        return target;
      };
      const v = Reflect.get(target, prop);
      return typeof v === "function" ? v.bind(target) : v;
    },
  });
}
