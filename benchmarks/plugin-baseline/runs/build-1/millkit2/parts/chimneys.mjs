// Part: Chimneys and hearths. The eight stacks of plan.md (chimney_stack: lit signal fire inside the flue, crown and
// cap), the plot 3 central hearth mass, the furnace and smoker nooks, the smokehouse smoker, and the plot 7 fireplace face.
// Air-only: every block here goes into a cell an earlier part left as air, so nothing is REFUSED. Stacks run first, so the
// masonry fills go round their flues.
import { chimney_stack, hearth_nook } from "../vocab.mjs";

// Writes into air only: a cell an earlier part built (shell, roof, floor) is left alone.
function put(g, x, y, z, block, state) {
  if (g.isAir(x, y, z)) g.set(x, y, z, block, state);
}

// The shell carves air at the plot 4 chimney footing (49,1,12..13) and that air locks, so the footing cells there are
// left clear here; the rest of the stack (50,1,12..13 and everything above y 1) builds as planned.
const SHELL_LOCKED_AIR = new Set(["49,1,12", "49,1,13"]);
function unlocked(g) {
  return {
    isAir: (x, y, z) => g.isAir(x, y, z),
    set: (x, y, z, block, state) => {
      if (!SHELL_LOCKED_AIR.has(`${x},${y},${z}`)) g.set(x, y, z, block, state);
    },
  };
}

// A lit smoker on the standing level, with a stone-brick mantle above (the hearth_nook pattern for a smoker).
function smoker_nook(g, x, y, z, facing, mantle = true) {
  put(g, x, y, z, "smoker", { facing, lit: "true" });
  if (mantle) put(g, x, y + 1, z, "stone_bricks", {});
}

export function build(g) {
  // ---- stacks (footing, shaft, crown and cap all come from chimney()) ----
  chimney_stack(g, [2, 1, 16], 13, 2, "cobblestone", "stone_bricks");   // plot 0 rear fieldstone chimney, fire y13
  chimney_stack(g, [13, 1, 14], 17, 2, "bricks", "deepslate_bricks");   // plot 1 camelback chimney, fire y17
  chimney_stack(g, [25, 1, 12], 19, 1, "bricks", "deepslate_bricks");   // plot 2 west end, in the gable wall, fire y19
  chimney_stack(g, [34, 1, 12], 19, 1, "bricks", "deepslate_bricks");   // plot 2 east end, in the gable wall, fire y19
  chimney_stack(g, [41, 1, 12], 15, 2, "bricks", "deepslate_bricks");   // plot 3 central stack through the apex, fire y15
  chimney_stack(unlocked(g), [49, 1, 12], 19, 2, "cobblestone", "stone_bricks");  // plot 4 kitchen chimney in the west end, fire y19
  chimney_stack(g, [63, 1, 17], 10, 1, "cobblestone", "stone_bricks");  // plot 5 smokehouse vent, back wall centre, fire y10
  chimney_stack(g, [85, 1, 13], 12, 2, "bricks", "deepslate_bricks");   // plot 7 bungalow brick chimney, fire y12

  // ---- plot 3 hearth mass: brick, four stoves back onto it (the stack's own cells are already placed above) ----
  for (let y = 1; y <= 6; y++) for (let z = 11; z <= 14; z++) for (const x of [41, 42]) put(g, x, y, z, "bricks", {});

  // ---- furnace nooks (lit furnace on a stone hearth, against a chimney or hearth wall; facing = into the room) ----
  hearth_nook(g, 2, 3, 14, "north");     // plot 0 west pen: kitchen-hall stove, against the chimney wall
  hearth_nook(g, 16, 3, 14, "east");     // plot 1 kitchen: stove by the west wall, chimney outside it
  hearth_nook(g, 26, 3, 12, "east");     // plot 2 west room parlour stove, against the gable chimney
  hearth_nook(g, 33, 3, 12, "west");     // plot 2 east room dining/kitchen stove, against the gable chimney
  hearth_nook(g, 40, 3, 11, "west");     // plot 3 NW parlour stove against the hearth mass
  hearth_nook(g, 43, 3, 11, "east");     // plot 3 NE kitchen stove against the hearth mass
  hearth_nook(g, 86, 3, 15, "south");    // plot 7 kitchen stove against the chimney
  hearth_nook(g, 87, 3, 13, "north");    // plot 7 living room fireplace face on the partition wall

  // ---- smokers ----
  smoker_nook(g, 51, 3, 12, "east");     // plot 4 kitchen smoker against the chimney breast
  smoker_nook(g, 63, 1, 15, "north", false); // plot 5 smoke room: lit smoker against the back wall, flue hole joins it
}
