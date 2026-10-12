// PART 3 roofs, beams and fireplace stack (plan.md PARTS 3, ROOFS, FACADES): the four stepped slab bands of the main
// roof, the fascia ring round the eave and both holes, the exposed beam lines, the gable-end and ring glass under
// band C, and the freestanding fireplace stack. Writes only into air, or swaps a roof slab to fascia.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { roof_band, fascia_ring, beam_line, fireplace_stack, ROOF_BANDS, BEAM_X } from "../vocab.mjs";

// glass_pane into air only (the glass sits under band C, where y=6 is open)
const glazeAir = (g, x, y, z) => {
  if (g.isAir(x, y, z)) g.set(x, y, z, ...B.pane());
};

export function build(g) {
  // the four bands of the stepped roof (plan ROOFS): eaves y=6, band C and ridge y=7
  for (const b of ROOF_BANDS) roof_band(g, b.z0, b.z1, b.y, b.half);

  // fascia ring on the eave and the atrium hole rim (vocab default hole)
  fascia_ring(g);

  // chimney hole rim: the same dark fascia, one cell round x=20..21 z=21..22
  for (let x = 19; x <= 22; x++) for (let z = 20; z <= 23; z++) {
    if (x >= 20 && x <= 21 && z >= 21 && z <= 22) continue;
    const band = ROOF_BANDS.find((r) => z >= r.z0 && z <= r.z1);
    if (g.blockAt(x, band.y, z) === "minecraft:smooth_stone_slab") g.set(x, band.y, z, ...B.slab("dark_oak", band.half));
  }

  // exposed beams: dark_oak_log axis z at y=5 on every beam line, z=5..28 (the wall lines x=10 and x=31 included)
  for (const x of BEAM_X) beam_line(g, x, 5, 28);

  // gable-end clerestory (x=10 and x=31, z=14..19) and atrium ring glass (x=16 and x=22, z=14..17), at y=6
  for (let z = 14; z <= 19; z++) { glazeAir(g, 10, 6, z); glazeAir(g, 31, 6, z); }
  for (let z = 14; z <= 17; z++) { glazeAir(g, 16, 6, z); glazeAir(g, 22, 6, z); }

  // freestanding fireplace stack at x=20..21 z=21..22: mud base and lintel, lit firebox, black flue, stone cap
  fireplace_stack(g, 20, 21);
}
