// Part 3: Facade. Tall arched windows in every OPENINGS window, iron-trapdoor shutters on the front windows, the
// sliding glass door at the back, and the quoin/cornice/stone-cap pieces that fall on air. The shell owns every wall
// and plate cell, so every write here goes only into air (a wall-plane piece the shell already built is skipped, not
// replaced); skipped cells are listed in plan.md's Notes.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { archWindow, shutters, quoin, GLASS_PANE, QUOINS, SMOOTH_QUARTZ } from "../vocab.mjs";

const isAir = (block) => /(^|:)(cave_)?air$/.test(block);

/** A view of the grid that writes only into air, so a shell-owned cell is skipped instead of refused. */
function airOnly(g) {
  return {
    set(x, y, z, block, state, nbt) {
      if (isAir(g.blockAt(x, y, z))) g.set(x, y, z, block, state, nbt);
      return this;
    },
  };
}

export function build(g) {
  const a = airOnly(g);

  // Tall arched windows (3x3, glass with arched smooth_quartz top corners) on each OPENINGS window.
  // Front, garage bonus room over the three doors (z5, y7..9).
  for (const c of [3, 8, 13]) archWindow(a, "north", c, 7, 5);
  // Front, main block: office (xc 22, y3..5), bedroom 3 (xc 22, y7..9).
  archWindow(a, "north", 22, 3, 7);
  archWindow(a, "north", 22, 7, 7);
  // West wall x18: pantry (z24, y3..5), bedroom 4 (z24, y7..9).
  archWindow(a, "west", 24, 3, 18);
  archWindow(a, "west", 24, 7, 18);
  // East wall x43: dining (z12, y3..5), family room (z20, y3..5), primary (z12, y7..9).
  archWindow(a, "east", 12, 3, 43);
  archWindow(a, "east", 20, 3, 43);
  archWindow(a, "east", 12, 7, 43);
  // Back wall z28: kitchen (xc 30, y3..5), bedroom 2 (xc 30, y7..9), primary bath (xc 38, y7..9).
  archWindow(a, "south", 30, 3, 28);
  archWindow(a, "south", 30, 7, 28);
  archWindow(a, "south", 38, 7, 28);

  // Sliding glass door to the deck: glass 3x3 in the back opening x37..39 y2..4 (birch frame is shell wall, skipped).
  for (let x = 37; x <= 39; x++) for (let y = 2; y <= 4; y++) a.set(x, y, 28, GLASS_PANE);

  // Black shutters on the front windows: open iron trapdoors in the outer air cell, 3 tall, at xc +-2.
  for (const c of [3, 8, 13]) shutters(a, "north", c, 7, 5);
  shutters(a, "north", 22, 3, 7);
  shutters(a, "north", 22, 7, 7);

  // Quoins and cornice: corners are shell walls and the y10 plate is shell-owned, so these land only on air.
  for (const [x, z] of QUOINS) quoin(a, x, z);
  for (let x = 0; x <= 18; x++) a.set(x, 10, 4, SMOOTH_QUARTZ);
  for (let x = 19; x <= 25; x++) a.set(x, 10, 6, SMOOTH_QUARTZ);
}
