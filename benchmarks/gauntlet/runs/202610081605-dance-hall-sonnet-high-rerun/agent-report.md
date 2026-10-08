Round 2 is the better build, though both files are far less tall and slender than the concept. `round-1.nbt` and `round-2.nbt` are both saved, and `build.mjs 1|2` regenerates each (round 1 stays byte-identical). I didn't run `mcd check`, since there is no function contract here.

- **Built:** a 22×20 symmetric stepped Art Deco hall, 24×17×23 with margins. The facade has end piers, white wings with stained-glass bays, a navy/sand fin pylon, a gold marquee and a recessed double door. The central window is a checkered glass window, with a gold sunburst above it and an open-arch spire. The rear steps down in three terraces, with pilastered flanks and glass slits. I used the `fins` brush for the fins and pilasters, and the `parapet` and `cornice` brushes in places; round 2 no longer calls `parapet`. The domes and arches in the shape-brush list didn't apply to this rectilinear design.
- **Mismatches in round 1:**
  - The roofs were sunken white trays inside raised rims, where the concept has solid sand terraces.
  - The wing crests were a flat W, where the concept's steps ascend toward the pylon.
  - The marquee was a heavy brown terracotta band with one-row sign panels.
  - The wing lower windows were black and heavy.
  - The central glass showed an empty hollow behind it.
- **Fixed in round 2:**
  - Solid smooth-sandstone decks at the spec heights (y8, y6, y5), each with a white band and a navy riser stripe.
  - Wing crests that step up to the fins.
  - Navy frames on the lower windows instead of black.
  - A white backing behind the central glass.
  - Two-row white sign panels, with confetti kept to the marquee side borders and a thin soffit edge.
- **Still off in round 2:** the pylon is short and wide next to the concept's tall, slender tower. The marquee still reads brownish. The end piers are chunky, and the window mullion is a 2×2 knot, not a true cross.
- **Choice:** round 2, because it reads as a stepped building rather than a decorated tray. The roof, crest and window fixes are visible in `r2-tiles/front-elevation.png` and `front-left.png`.
