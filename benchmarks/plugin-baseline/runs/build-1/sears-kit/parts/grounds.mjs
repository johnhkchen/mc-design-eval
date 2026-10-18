// Part "chimneys, walks and grounds" (plan.md PARTS 6): the accessible walk and ramp to every main door, the lawn and the
// hedge on each plot, foundation planting in the front lawn row, the porch lanterns, and the eight chimneys (chimneyStack
// with the plan's calls). Runs after the roofs, porches and fittings, so every write here is into air or ground.
import { lawn, hedge, foundationPlanting, porchLantern, chimneyStack } from "../vocab.mjs";
import { SITE_SIZE } from "../vocab/base.mjs";

// per plot: the walk's first absolute x and width (plan.md SITE), the deck material (plan.md MATERIALS) and the deck's z
// span: the ramp is two cells (z deckZ0-2..deckZ0-1), the walk runs from z5 to the ramp, the deck ends at the cell in front of the door
const WALKS = [
  { x: 6, w: 4, deckZ0: 9, deckZ1: 12, deck: "smooth_quartz" },   // plot 0 Magnolia (walk 6..9)
  { x: 23, w: 2, deckZ0: 9, deckZ1: 12, deck: "mud_bricks" },     // plot 1 Alhambra (walk 23..24)
  { x: 39, w: 3, deckZ0: 9, deckZ1: 12, deck: "spruce_planks" },  // plot 2 Vallonia (walk 39..41)
  { x: 55, w: 3, deckZ0: 10, deckZ1: 12, deck: "smooth_quartz" }, // plot 3 Puritan (walk 55..57, ramp 8..9)
  { x: 71, w: 3, deckZ0: 9, deckZ1: 12, deck: "oak_planks" },     // plot 4 Cornell (walk 71..73)
  { x: 87, w: 3, deckZ0: 12, deckZ1: 13, deck: "smooth_stone" },  // plot 5 Stanford (walk 87..89, ramp 10..11, landing 12..13)
  { x: 103, w: 3, deckZ0: 10, deckZ1: 12, deck: "oak_planks" },   // plot 6 Winona (walk 103..105, ramp 8..9)
  { x: 118, w: 3, deckZ0: 9, deckZ1: 12, deck: "spruce_planks" }, // plot 7 Craftsman (walk 118..120)
];

// chimney calls (plan.md): wall cell at floor y 1, the room side (into), the flue's last course (top). The shell leaves the
// mouths unset (not air), so the chimney's mouth and lintel are written like any other cell of the stack
const CHIMNEYS = [
  { wall: [2, 1, 17], into: "east", top: 15 },
  { wall: [13, 1, 17], into: "west", top: 15 },
  { wall: [27, 1, 21], into: "north", top: 14 },
  { wall: [35, 1, 17], into: "east", top: 14 },
  { wall: [51, 1, 17], into: "east", top: 14 },
  { wall: [77, 1, 17], into: "west", top: 15 },
  { at: [88, 1, 18], open: "south", top: 13 },
  { wall: [108, 1, 18], into: "west", top: 11 },
  { wall: [125, 1, 17], into: "west", top: 15 },
];

// porch lanterns, hung under a porch ceiling block (porchLantern refuses a lantern with nothing above it)
const LANTERNS = [
  [5, 8, 10], [10, 8, 10],        // plot 0 under the portico entablature
  [56, 4, 10],                    // plot 3 under the pediment entablature, by the door
  [70, 4, 12], [74, 4, 12],       // plot 4 under the square porch's hip roof, each side of the door
  [103, 4, 11], [105, 4, 11],     // plot 6 under the gable porch eave, each side of the door
  [117, 4, 11], [121, 4, 11],     // plot 7 under the broad porch, each side of the door
];

// the walk and ramp to a door (plan.md SITE): smooth_stone walk flush at y0 over the grass, two bottom slabs at y1 for the
// ramp, then the deck block at y1. accessRamp() only writes into air, and the walk's cells are grass, so it refuses the
// whole way; this writes the walk over the ground (the ground part's grass is still writable here) and the ramp and deck
// into air only, so a porch deck already laid stays as it is.
function walkAndRamp(g, { x, w, deckZ0, deckZ1, deck }) {
  for (let dx = 0; dx < w; dx++) {
    const X = x + dx;
    for (let z = 5; z <= deckZ0 - 3; z++) g.set(X, 0, z, "smooth_stone");
    for (let z = deckZ0 - 2; z <= deckZ0 - 1; z++) if (g.isAir(X, 1, z)) g.set(X, 1, z, "smooth_stone_slab", { type: "bottom" });
    for (let z = deckZ0; z <= deckZ1; z++) if (g.isAir(X, 1, z)) g.set(X, 1, z, deck);
  }
}

// the cells above the ground that earlier parts built, read as this part starts (y1 up; the ground is still writable).
// runParts refuses any write into them, so a chimney must not try: the roof's stair where a stack passes through it,
// the room's floor under a hearth. Air the shell left is not in the set, so the flue and mouth stay writable.
function builtBefore(g) {
  const [SX, SY, SZ] = SITE_SIZE;
  const taken = new Set();
  for (let x = 0; x < SX; x++) for (let y = 1; y < SY; y++) for (let z = 0; z < SZ; z++) if (!g.isAir(x, y, z)) taken.add(`${x},${y},${z}`);
  return taken;
}

// one chimney. Its writes into cells an earlier part built are dropped (taken, see builtBefore); the rest of the stack,
// the mouth and the lintel over it included, is laid as usual.
function chimneyAt(g, c, taken) {
  const view = {
    get: (...a) => g.get(...a),
    inBounds: (...a) => g.inBounds(...a),
    isAir: (...a) => g.isAir(...a),
    set: (x, y, z, ...rest) => {
      if (taken.has(`${x},${y},${z}`)) return null;
      return g.set(x, y, z, ...rest);
    },
  };
  return chimneyStack(view, { ...c, hay: true });
}

export function build(g) {
  // read before any write of this part: the cells the earlier parts built
  const taken = builtBefore(g);
  // the walk and ramp first: the lawn writes only into what is still air or grass, so it leaves their cells alone
  WALKS.forEach((w) => walkAndRamp(g, w));
  for (let plot = 0; plot < 8; plot++) {
    lawn(g, plot);
    hedge(g, { x0: 16 * plot, w: 16, z: 24 });
    const w = WALKS[plot];
    // planting on the front lawn row z8, never on the walk and ramp columns
    foundationPlanting(g, { x0: 16 * plot + 1, x1: 16 * plot + 14, z: 8, skip: [[w.x, w.x + w.w - 1]] });
  }
  for (const [x, y, z] of LANTERNS) porchLantern(g, { x, y, z });
  // street lamps: a standing lantern on a fence post on each sidewalk (z3), two per plot, clear of every walk and ramp;
  // they light the street and the walks
  for (let plot = 0; plot < 8; plot++) for (const x of [16 * plot + 4, 16 * plot + 12]) {
    g.set(x, 1, 3, "spruce_fence");
    g.set(x, 2, 3, "lantern", { hanging: "false" });
  }
  for (const c of CHIMNEYS) chimneyAt(g, c, taken);
}
