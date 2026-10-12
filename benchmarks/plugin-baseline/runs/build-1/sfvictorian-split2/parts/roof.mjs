// Roof (P3, plan.md ROOFS): the low shop-preset roof hidden behind the false front (dark slate, iron-bar crest, fish-scale
// back gable), the cream back-eave course under the rear overhang, and two brick chimneys on the west party wall.
// Writes nothing at z <= 7: the keep box guards the front gable and the cornice.
import { B, roof } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { ROOF_FOOTPRINT, DEEPSLATE_TILES, BAMBOO_MOSAIC, BRICKS, SMOOTH_QUARTZ_STAIRS } from "../vocab.mjs";

// The shell locks (x,16,z) as air at the flue foot, and the grid stops at y20 (build.mjs Grid([16, 21, 50])): so the stack runs y17..20.
function flue(g, x, z) {
  for (let y = 17; y <= 20; y++) g.set(x, y, z, BRICKS);
}

export function build(g) {
  // The roof: shop preset, half pitch, eaves at y17. No west overhang: an eave at x0 makes roof() grow the box and shift
  // every cell +1 in x (the make.sh roof step does the same with roof.json, see plan.md Notes). The east eave keeps the
  // neighbour's y17 cap (x15) as it is.
  const result = roof(g, ROOF_FOOTPRINT, "shop", {
    y: 17, pitch: "half", maxHeight: 3, overhang: { north: 0, south: 1, east: 1, west: 0 },
    material: DEEPSLATE_TILES, texture: false, gable: BAMBOO_MOSAIC,
    ridge: "crest", dormers: { count: 0 }, edges: { fascia: false, soffit: false },
    keep: [{ from: [0, 16, 3], to: [15, 21, 7] }, { from: [15, 17, 7], to: [15, 17, 33] }],
  });

  // Back-eave course: smooth_quartz_stairs half=top along the back wall, one cell out at z33 under the overhang.
  for (let x = 1; x <= 14; x++) g.set(x, 16, 33, ...B.stairs(SMOOTH_QUARTZ_STAIRS.replace(/_stairs$/, ""), "south", "top"));

  // Two flues rising above the ridge in the west party wall: the parlour and dining fireplaces.
  flue(g, 1, 12);
  flue(g, 1, 21);

  return result;
}
