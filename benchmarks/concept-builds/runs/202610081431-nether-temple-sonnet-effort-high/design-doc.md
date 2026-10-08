# Nether Temple: Design Document

## 1. Identity
A blackstone ziggurat shrine, gold-trimmed and lit by soul fire. A bridge-stair crosses a lava moat to a sealed sanctum, so the lava makes visitors cross something dangerous to reach it.

## 2. Palette by role
- **Dominant, `polished_blackstone_bricks`** (plus stairs, slabs, `chiseled_polished_blackstone`, sparse `gilded_blackstone`): the native Nether stone. It gives mass and weight, and the chiseled frieze reads as carved.
- **Supporting, `polished_basalt` (axis y)**: pillars. Its vertical grain reads as structure against the brick courses, and it is a Nether native.
- **Secondary accent, `red_nether_bricks`**: recessed panels, the roof band and the frieze fill. It is warm and organic against the cold black.
- **Primary accent, `gold_block`**: lintels, portal pilasters and the spire cap. It marks sanctity and wealth, and goes only where the eye should land.
- **Rare accent, `warped_wart_block`** in the spire drum: a cool contrast with the crimson.
- **Light**: `soul_lantern`, `chain`, `soul_campfire`, `shroomlight`. Lava is the glowing moat.

Relationship: black mass, red infill, gold edge, teal at the top only.

## 3. Massing & roof
- **Moat and street:** a 3-deep polished-blackstone street strip at z −3..−1. The lava ring is 2 wide on all four sides. The stair (x8–12) bridges it.
- **Tier 1:** plinth x2–18, z2–18, y1–3, as two stair-stepped courses.
- **Tier 2:** hall walls x5–15, z5–15, y4–10.
- **Tier 3:** a hipped roof. Its eaves overhang 1 block at y11 using top-half stairs. It then steps in 1 block per course to a 5×5 cap at y15, with a gold-block course on the lowest step.
- **Spire:** a 3×3 warped/crimson drum at y16–18 with gold corner posts. Above it, a 1×1 brick shaft at y19–22, a gold block at y23 and a `nether_brick_fence` finial at y24.
- **Back:** the same volumes without the portal.

## 4. Facade composition
- **Base:** the plinth and a front stair 5 wide with `facing=south` stairs. Every riser aligns to the portal axis x=10.
- **Middle:** basalt columns at x=5, 8, 12 and 15 form three bays.
  - The centre bay x9–11 is a 3×5 dark portal with gold-block pilasters and a gold arch lintel.
  - Each side bay (x6–7 and x13–14) holds a recessed red-nether-brick panel with a stair-arched window.
- **Top:** a chiseled blackstone frieze, then a red-brick vent band under the eaves.

## 5. Depth plan
- The stair projects into the moat and the plinth steps out 3 in front of the hall.
- The colonnade sits 1 proud of the wall (z5 against z6).
- The portal recesses 2 behind the colonnade, to z7.
- Side panels recess 1.
- Gold lintels project 1.
- The eave overhangs 1 past the wall and 2 over the columns.

Together these layers keep the front from reading as a flat box.

## 6. Detail & life
- **Brazier pillars:** 3-high basalt pillars at the plinth corners (x2, x18) and flanking the stair (x7, x13). Each is topped with a lit `soul_campfire`, whose cyan flame is the signature of the place.
- **Eave chains:** 3-link `chain` pairs hang `soul_lantern`s from the eave corners.
- **Portal and spire lighting:** a soul lantern hangs inside the portal. `shroomlight` sits in the spire windows.
- **Gold fleck:** `gilded_blackstone` appears once per course on the plinth.
- **Skyline:** the narrow gold-capped spire rising above the dark roof is the silhouette to protect.
