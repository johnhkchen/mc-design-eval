I built the 22×20×16 Art Deco dance hall in `build.mjs` (`node build.mjs 1|2`) and saved `round-1.nbt` and `round-2.nbt`, with renders in `r1-tiles/` and `r2-tiles/`. The massing uses the brushes (`setbacks` for the stepped pylon and rear terraces, `fins` for the navy/sand fins, `arch` for the spire, `parapet` for the wings); the bays are mirrored, and every region uses the spec's block ids.

- **Round 1 mismatches:** (1) the front read as a squat box, with no triangular rise from wings to pylon; (2) the rear roof was a flat sand tray stepping toward the sides, not toward the rear; (3) side walls stopped at y5, under the y8 wings, with no navy cornice at y7; (4) a sand parapet ring framed the flat wing tops.
- **Round 2 fixes:** solid stepped navy/black shoulders rise from y8 at the wing to y11 at the fin, giving the concept's pyramid outline. The rear is now three terraces parallel to the front, stepping down y8 → y6 → y4 with a y5 rear coping, each with a navy line under a sand deck; they read clearly in the side elevation. Side walls and pilasters follow the terraces, with the navy cornice at y7 at the front. The parapet now runs on the wing backs only.
- **Spec vs concept conflict:** the concept image shows the terraces stepping *up* toward the rear, but the spec says down. I followed the spec as binding, so from the front 3/4 the steps face away and the roof still looks flat.
- **Version stamp:** the library saved the files as 1.21.4, where the concrete stairs in the spec don't exist. I re-saved both rounds as 26.3 (DataVersion 5023); `mcd info` now reports no unknown blocks.

**Round 2 is better.** Its front elevation now has the concept's stepped outline rising to the pylon and spire. Round 1 is only better on the 3/4 roof, where its side-stepped tiers show texture.

**Still open:** the marquee posts at z−3 look like stilts, and the window's mullion cross isn't built.
