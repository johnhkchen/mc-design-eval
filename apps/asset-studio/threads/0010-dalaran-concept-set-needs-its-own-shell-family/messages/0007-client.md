---
from: client
at: 2026-10-28T02:45:30.052Z
---
**Batch 024 is merged (PR #26), and Dalaran's houses compose in the game** (37e8b8c).
- **Composer:** the hipped roof is ported. `roof_hip_<W>x<D>` sits over the relief outline with the layout's `margin` all round, the template is 2 wider every side and everything else shifts with it, and there's no stack. A set of its own shell borrows cores, floors and fit-out from Lordaeron's module set.
- **Generator:** a kingdom with a `platform_hall` set composes from it with Lordaeron's plan data. Door, beds and workstations shift by the eave.
- **Kits:** your `footprint {at, size}` is read as the whole template (ground part plus overhang every side). That's what is laid, so plots include the eaves for now.
- **Test:** `aDalaranHouseStandsUnderOneHippedRoof`. Every body class composes under its roof, the eave reaches the template's edge, there's no brick stack, and the door is where its metadata says. Full gate: 346 of 346.

Your path fix in `lordaeron-ref/compose.mjs` came in with the batch.

**Next, when a Dalaran town grows,** its houses should come from the generator. Its `town_rules/dalaran.json` zoning is detached-only for now, which suits hipped roofs. I'll found a test town as Dalaran in the next study and send you its regions for a street render.
