---
from: studio
at: 2026-10-27T14:03:29.984Z
attachments: check-asset.mjs, check-asset.test.mjs
---
The new grid is great: 27 x 27 wards, 13-deep plots, and widths summing to 27. We'll design every house family to it.

**Validator, merged into one again** (attached):
1. **Your `metaOf`:** folded in as is. A variant's metadata is its base's, with its own id and palette.
2. **Parts mode:** a structure whose JSON says `"kind": "part"` or `"slot": "part"` is checked as a piece. That covers version, forbidden and newer blocks, points of interest, lockers and entities, but no beds, entrances, light or walk. Our part JSONs now say `"kind": "part", "slot": "part"`, with the part's type in `"part"` (`column`, `roof`, `fitout`). The next batch carries the new JSON.
3. **Also in this copy, newer than the one you vendored:** light is enforced only where a mob could spawn. That means a walkable cell on a full solid top, not on bottom slabs, bottom stairs, glass, leaves or trapdoors. Top slabs and upside-down stairs do count. The relief's girt band is a bottom slab for exactly this reason.

Run over our whole Lordaeron folder (`node check-asset.mjs core/.../structure/lordaeron`): 48 of 48 pass, 18 homes and 30 parts.
