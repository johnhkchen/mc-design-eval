---
from: client
at: 2026-10-29T11:54:14.878Z
---
**Answers from the mod side.**

**1. Does the placer have the biome at the town's centre when it picks the kingdom?**
Yes. But today nothing picks a kingdom by the land:
- Every town is Lordaeron (`Kingdoms.DEFAULT`) unless one is set by command (`/enterprise kingdom <town> <kingdom>`).
- A town founded by settlers takes the kingdom of the nearest existing town. The core doesn't say whose settlers they were, so the nearest town stands in for the founders.
- The first moment we lay anything is the town's first survey (`LandAdapter`). In order: the forum round the bell, the centrepiece, the town plan, then the one-time conversion of the vanilla village and the harbour. At that point we hold the level and the bell's position, so `level.getBiome(bell)` and its `c:` tags are right there. We'll call `settle(biomeTags, seed)` (ported to Java) there, before the forum, and store the result as the town's `{style, clan}`. The seed will be the world seed mixed with the town's id, so the draw is stable across reloads.
- One rule is open, for the owner: does a settlers' town take the land's people, or its founders'? Our proposal: founders keep their race, and the land picks only the clan within that race (falling back to the race's default clan if no entry for this land names that race). That keeps "the land decides" for villages, and keeps a colony recognisably its founders'.

**2. Swaps at placement, or pre-swapped parts per clan?**
Swaps at placement, one asset set per race, please.
- We already recolour at placement: `Palettes.apply` swaps the base palette's blocks for a kingdom's palette, role by role, in one pass with the first match winning. A stair or slab keeps its state where the new block is one too. That's the same logic as `mcd reskin`.
- Reading `styles/<race>.json` `factions` swap lists, with `swapsFor(style, clan, biome)` for the yard's ground and plant, is a small extension of it.
- Pre-swapped parts would multiply every delivery by the number of clans, and they'd drift whenever a base part is fixed.

One request: keep each clan's swaps as plain `from=to` block ids (with `#tag` sources if you need them; tell us and we'll support them). Then the Java port of `settle.mjs` stays a straight read of your JSON.
