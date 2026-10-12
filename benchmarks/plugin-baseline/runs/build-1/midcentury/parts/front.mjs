// PART 5 car and front garden: the two-tone 1950s car on the driveway, two palms, the cactus cluster on the gravel bed,
// a dead bush on the sand and the low mailbox (plan.md PARTS 5; elements 20, 21, 22). Ticks 20, 21, 22.
import { car_50s, palm, saguaro, barrel_cactus, mailbox, DEAD_BUSH, DIRT } from "../vocab.mjs";

// The cactus helpers set sand at y=0 under each plant. site.mjs (an earlier part) owns the bed's ground, so the sand
// goes in only where the ground is still plain dirt; a cell site already paved (gravel or sand) is left as it is.
const onGround = (g) => new Proxy(g, {
  get(target, prop) {
    if (prop === "set") {
      return (x, y, z, block, state) => {
        if (y > 0 || target.blockAt(x, 0, z) === `minecraft:${DIRT}`) target.set(x, y, z, block, state);
        return g;
      };
    }
    const v = Reflect.get(target, prop);
    return typeof v === "function" ? v.bind(target) : v;
  },
});

// vocab's palm sets plain jungle_leaves, which decay once the trunk is gone; plan.md wants them persistent
const persistCrown = (g, x, z) => {
  for (let y = 6; y <= 7; y++) for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) {
    if (g.blockAt(x + dx, y, z + dz) === "minecraft:jungle_leaves") g.set(x + dx, y, z + dz, "jungle_leaves", { persistent: "true" });
  }
};

export function build(g) {
  car_50s(g);                       // x=3..5 z=1..7 on the driveway, nose to the street
  palm(g, 12, 3);                   // in the north gravel bed
  persistCrown(g, 12, 3);
  palm(g, 30, 4);                   // in the east gravel bed; its crown meets the roof's eave, the helper skips filled cells
  persistCrown(g, 30, 4);
  const desert = onGround(g);
  saguaro(desert, 26, 3, 3);        // tallest, with one arm on the west side
  saguaro(desert, 24, 2, 2);
  barrel_cactus(desert, 28, 2);
  barrel_cactus(desert, 23, 4);
  barrel_cactus(desert, 29, 4);
  g.set(25, 1, 6, DEAD_BUSH);       // a dead bush on the open sand, clear of the cactus bed
  mailbox(g, 9, 1);                 // low post and box at the head of the driveway
}
