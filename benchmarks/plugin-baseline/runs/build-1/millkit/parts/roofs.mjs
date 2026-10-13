// P2 Roofs: the main roofs of plots 0-3, the store and the coop (roof tool, one call each, since one roof.json holds one
// roof), and the hand-built porch shed roofs at z 6..8 (one stair course rising to the wall, tucked under the eave).
// Runs after the shell, so every roof is built into air and its chimneys pass through on `keep` boxes.
import { roof } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/roofs.mjs";
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { CHIMNEYS } from "../vocab/base.mjs";

// A chimney as a keep box: its stack plus the cap and fire above it (y 1 up to the fire course).
const stack = (c, top) => ({ from: [c[0], 1, c[2]], to: [c[3], top, c[5]] });

// Where a cap ring stands on the roof: the ring's stairs at the stack's flanks (x0-1 and x1+1) sit on the roof's slabs at
// the band course, so that course runs one block out under each ring stair as a full block (a stair on a bottom slab
// hangs half a block over air). Plots 1 and 2 only: their chimneys sit in the ridge or the west gable.
function ringFooting(g, c, y) {
  for (const x of [c[0] - 1, c[3] + 1]) for (let z = c[2]; z <= c[5]; z++) g.set(x, y, z, "deepslate_bricks");
}

// Porch shed roof on z 6..8 from x0 to x1 at course y (houses 6, store 7): slab over the step line at z 6, a stair
// course at z 7 rising to the wall, and a full block at z 8, which the main eave's row (y + 1) sits on.
function porchRoof(g, x0, x1, y, mat, block = mat) {
  for (let x = x0; x <= x1; x++) {
    g.set(x, y, 6, ...B.slab(mat, "bottom"));
    g.set(x, y, 7, ...B.stairs(mat, "south", "bottom"));
    g.set(x, y, 8, block);
  }
}

// Plot 0: shotgun, gable to the lane (ridge along z), polished andesite tin, birch verge. Chimney x 9..10.
// Plot 1: saddlebag duplex, side gable (ridge along x), mangrove tin, dark oak verge. Chimney in the ridge x 17..18.
// Plot 2: hall-and-parlour, side gable, spruce shingle. Chimney x 25..26 at the west gable.
// Plot 3: shotgun mirrored, green copper tin, dark oak verge. Chimney x 37..38.
const HOUSES = [
  { i: 0, box: [3, 9, 8, 17], ridgeAxis: "z", overhang: 1, material: { mix: [["polished_andesite", 3], ["birch", 1]], eave: "birch", ridge: "polished_andesite", verge: "birch" }, verge: "birch",
    gable: "birch_planks", chimney: CHIMNEYS.p0, top: 12,
    porch: { x0: 3, x1: 8, mat: "polished_andesite" } },
  { i: 1, box: [13, 9, 22, 16], ridgeAxis: "x", overhang: { north: 1, south: 1, east: 0, west: 0 }, material: { mix: [["mangrove", 3], ["dark_oak", 1]], eave: "dark_oak", ridge: "dark_oak", verge: "dark_oak" },
    verge: "dark_oak", gable: "spruce_planks", chimney: CHIMNEYS.p1, top: 14, footing: 11,
    porch: { x0: 13, x1: 22, mat: "mangrove", block: "mangrove_planks" } },
  { i: 2, box: [26, 9, 34, 16], ridgeAxis: "x", overhang: { north: 1, south: 1, east: 0, west: 0 }, material: { mix: [["spruce", 3], ["oak", 1]], eave: "oak", ridge: "oak", verge: "birch" },
    verge: "birch", gable: "oak_planks", chimney: CHIMNEYS.p2, top: 14, footing: 11,
    porch: { x0: 26, x1: 34, mat: "spruce", block: "spruce_planks" } },
  { i: 3, box: [39, 9, 44, 17], ridgeAxis: "z", overhang: 1, material: { mix: [["weathered_cut_copper", 3], ["dark_oak", 1]], eave: "dark_oak", ridge: "weathered_cut_copper", verge: "dark_oak" }, verge: "dark_oak",
    gable: "jungle_planks", chimney: CHIMNEYS.p3, top: 12,
    porch: { x0: 39, x1: 44, mat: "weathered_cut_copper" } },
];

export function build(g) {
  const out = [];
  for (const h of HOUSES) {
    const r = roof(g, h.box, "gable", {
      y: 7, pitch: 45, eave: "plain", ridge: "slab", ridgeAxis: h.ridgeAxis, front: "n",
      overhang: h.overhang, material: h.material, verge: h.verge, gable: h.gable, texture: h.texture,
      keep: [stack(h.chimney, h.top)],
    });
    out.push(`plot ${h.i} roof: ${r.cells ?? "?"} cells, refused ${r.refused ?? 0}`);
    if (h.footing) ringFooting(g, h.chimney, h.footing);
    porchRoof(g, h.porch.x0, h.porch.x1, 6, h.porch.mat, h.porch.block);
  }

  // Company store: low gable hidden behind the false front (its north gable is the front wall, so no overhang there).
  const store = roof(g, [85, 9, 94, 17], "gable", {
    y: 8, pitch: 0.5, eave: "plain", ridge: "slab", ridgeAxis: "z", front: "n",
    overhang: { north: 0, south: 1, east: 0, west: 0 }, material: { mix: [["polished_andesite", 3], ["dark_oak", 1]], eave: "dark_oak", ridge: "polished_andesite", verge: "dark_oak" }, verge: "dark_oak",
    keep: [{ from: [85, 3, 9], to: [94, 12, 9] }],
  });
  out.push(`store roof: ${store.cells ?? "?"} cells, refused ${store.refused ?? 0}`);
  // store porch: shed roof at y 7 under the false front, same course as the houses' porches
  porchRoof(g, 85, 94, 7, "polished_andesite");

  // Coop: small front gable (ridge along z), spruce tin, spruce verge; the gable ends are on the north and south.
  const coop = roof(g, [63, 12, 68, 16], "gable", {
    y: 5, pitch: 45, eave: "plain", ridge: "slab", ridgeAxis: "z", front: "n", overhang: 1,
    material: "spruce", texture: false, contrast: false, verge: "spruce",
  });
  out.push(`coop roof: ${coop.cells ?? "?"} cells, refused ${coop.refused ?? 0}`);
  return out;
}
