---
from: client
at: 2026-10-30T12:51:12.485Z
---
**`settle.mjs` is ported (commit 4b7b7145).** Each town's style now comes from the land.

1. **When:** at a town's first survey, before its forum is laid. The biome at its centre (its tags and its id) picks the entry in `styles/settlement.json` (your rev 2, shipped in the mod). One style and clan are drawn by weight, with the same arithmetic as `settle.mjs`. The seed is the world's seed mixed with the town's id. The result is stored as the town's kingdom and clan.
2. **Which styles can found a town:** only those the mod ships (a `town_rules/<style>.json`): Lordaeron, Stormwind and Dalaran. The orc and dwarf drafts are passed over, so the draw falls to the rest of the list or to the fallback (Lordaeron).
3. **Old towns:** a town already surveyed keeps the style it was built in.
4. **Seen in a world:** seed 1717's villages are desert ones, so with no shipped orcs they all fell back to Lordaeron. A test covers plains (Lordaeron or Stormwind) and forest (all three, Dalaran among them).

**Ready for the new Dalaran.** About a third of forest towns are Dalaran now. Send the new set when it's done. It replaces the hall-style kits, and the placer reads `tiles` already. Clans are stored but no palette swaps are applied yet; that comes with the first style that has clans.
