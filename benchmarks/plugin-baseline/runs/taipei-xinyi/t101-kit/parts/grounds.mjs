// P5 Medallions, canopies and grounds (plot 0): four coin medallions with their y129 uplights, three glass canopies,
// the mall entrance slab ramp (and the pedestal's east ramp), the mall sign, roof gardens on the exposed mall decks,
// an east plaza checker, planters and lamp posts. Plot-local coordinates (plot 0 origin is 0,0,0).
import {
  coin, uplightRow, canopy, slabRamp, mallSign, roofGarden, planter, lampPost, SMOOTH_STONE,
} from "../vocab.mjs";

export function build(g) {
  // ---- giant coin medallions (plan.md FACADES: centre y 140.5; wall planes from the pedestal's inset 5 / inset 6) ----
  // A step back at y 146 (inset 6) moves each wall plane one cell inward, so the gap is filled with raw gold.
  coin(g, "south", [133.5, 140.5, 178], { wallAt: (y) => (y >= 146 ? 177 : 178) });
  coin(g, "north", [133.5, 140.5, 113], { wallAt: (y) => (y >= 146 ? 114 : 113) });
  coin(g, "east", [166, 140.5, 145.5], { wallAt: (y) => (y >= 146 ? 165 : 166) });
  coin(g, "west", [101, 140.5, 145.5], { wallAt: (y) => (y >= 146 ? 102 : 101) });

  // shroomlight uplights in front of each disc, row y 129, 18 long
  uplightRow(g, "south", 125, 142, 129, 178);
  uplightRow(g, "north", 125, 142, 129, 113);
  uplightRow(g, "east", 137, 154, 129, 166);
  uplightRow(g, "west", 137, 154, 129, 101);

  // ---- glass canopies on a quartz frame, deck y 12 ----
  // north: Xinyi Road forecourt entrance; east and south: the pedestal's doors
  canopy(g, { x0: 65, z0: 0, x1: 99, z1: 9 }, 12, [[66, 1], [74, 1], [82, 1], [90, 1], [98, 1]]);
  canopy(g, { x0: 172, z0: 124, x1: 186, z1: 147 }, 12, [[185, 125], [185, 134], [185, 138], [185, 146]]);
  canopy(g, { x0: 125, z0: 184, x1: 139, z1: 204 }, 12, [[125, 192], [125, 203], [139, 192], [139, 203]]);

  // ---- entrance ramps: bottom slab, then a full landing (plan.md OPENINGS) ----
  slabRamp(g, { face: "north", from: 72, to: 92, y: 2, slab: 8, landing: 9 });
  slabRamp(g, { face: "east", from: 130, to: 141, y: 2, slab: 173, landing: 172 });

  // ---- mall sign on the north face, sea lantern letters ----
  // Stands one cell proud of the facade (z 9): the mall part already owns the wall cells at z 10 (piers, glass), and
  // earlier parts are locked, so the band sits in the air in front of them, touching the wall on its back face.
  mallSign(g, { face: "north", range: [40, 130], y0: 26, y1: 34, plane: 9 });

  // ---- roof gardens on the exposed mall decks (rects kept inside each deck's own footprint) ----
  // No skylight strips: a skylight would replace the mall's own deck cells, which are locked to this part. The
  // planting sits on the deck's y + 1, so the gardens need nothing from the deck itself.
  // NW block, deck y 68
  roofGarden(g, { x0: 12, z0: 22, x1: 72, z1: 82, y: 68 });
  // middle terrace, part 1 (exposed east of the NW block), deck y 46
  roofGarden(g, { x0: 77, z0: 17, x1: 126, z1: 92, y: 46 });
  // middle terrace, part 2 (south-west L leg), deck y 46
  roofGarden(g, { x0: 12, z0: 97, x1: 82, z1: 154, y: 46 });
  // base deck strips left open by the terraces, deck y 35
  roofGarden(g, { x0: 131, z0: 16, x1: 152, z1: 92, y: 35 });
  roofGarden(g, { x0: 86, z0: 96, x1: 150, z1: 100, y: 35 });

  // ---- east plaza checker: smooth stone and polished andesite (the ground layer is polished andesite) ----
  for (let x = 172; x <= 192; x++) for (let z = 102; z <= 199; z++) {
    if ((x + z) % 2 === 0) g.set(x, 1, z, SMOOTH_STONE);
  }

  // ---- planters on the east plaza (smooth quartz box, oak leaves) ----
  planter(g, [178, 108, 179, 110], 2);
  planter(g, [178, 160, 179, 162], 2);

  // ---- lamp posts every ~9 cells along the east plaza's west edge (x 176 is on the footprint) ----
  for (const z of [105, 114, 153, 162, 171]) lampPost(g, 176, 2, z);
}
