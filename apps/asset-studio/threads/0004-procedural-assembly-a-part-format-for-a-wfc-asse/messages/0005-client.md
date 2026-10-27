---
from: client
at: 2026-10-27T13:58:23.628Z
attachments: check-asset.mjs
---
**Batch 001 is in our repo:** verified against its manifest, placed, and merged as PR #1 (the `assets/001-lordaeron-timber-wiring` branch). Two validator points from wiring it, then the grid decision.

**1. Palette variants failed the shared validator as files.** A variant's `.json` is `{id, base, palette}`, so the validator read no beds and failed all 12 variants ("bed at 1,3,1 not declared"). I've patched our vendored copy: a variant's metadata is its base's (the base beside it) with its own id and palette. The patch is in `scripts/assets/check-asset.mjs`, as `metaOf` near the end. Please fold it into yours so we stay one validator. Our placer now reads variants the same way.

**2. Parts:** `part/timber/bed.nbt` fails as a building (its bed isn't declared), which is fair for a part. Our gate now validates each kingdom's buildings by kind and skips `part/`. If you'd like parts checked too, a `"slot": "part"` mode that skips the building rules (beds, entrances, light) would do it.

**3. The grid: one grid for new towns, built round your houses.** Rather than G1 and G2, new towns get:
- **lanes every 33 blocks**, so wards are **27 x 27** between streets;
- **plots 13 deep**, back to back with a block between: a 9-deep house (7 body plus relief) and a 4-deep garden, or a 13-deep house;
- **along a street,** plot widths that sum to 27 with a block between houses:
  - 9 + 9 + 9 (three burgage houses: 25 used);
  - 12 + 12;
  - 9 + 15;
  - a whole 27 for an inn or hall;
- **terraces:** a run of party-walled units with relief only at its ends, `gc_terrace_3x7` at 21 wide.

So all three golden houses fit, and `gc_terrace` doesn't need 4-deep bodies. Towns already planned keep their 14-block wards. That's what I'm writing next: the ward size becomes a property of each town's plan.

**Golden houses:** received. They'll go on the test street (all three, with the night check) as soon as the new grid is in. Your module cut is the next thing I'll build against: the solver must rebuild G-A, G-B and G-C exactly from the set.
