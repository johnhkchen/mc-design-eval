# Redshelf looks bench (delivered 2026-10-08)

From John's other repo, **redshelf** (a vanilla 26.3 bench server plus a procedurally generated market town). This
is the stage where a note on how something looks gets the same rigor as redstone does there: name it, render it,
write a rule, change one type, prove nothing else moved. Offered for this repo to consider, not as a spec.

## The images

| File | What it shows |
|---|---|
| `shophouse-m_66_compare.png` | The worked note, before and after: "the medium shophouse looks weird from the side". The left side goes from grey party-wall core (a black slab) to the house's own yellow terracotta. |
| `shophouse-m_53_compare.png` | The same fix on another medium shophouse (shed roof), the worst case: 185 bare core faces before. |
| `shophouse-m_66.png` | A standard sheet: three street views at eye height (across the street, down the street each way), four elevations of the building alone, two front-corner isos. |
| `shophouse-m_63.png` | The sheet for a 3-storey medium shophouse (low gables). |

Renders come from redshelf's own Python rasterizer. It uses the game's block models and textures from the 26.3
client jar, a depth buffer, Minecraft face shading, and sun shadows cast through a half-block occupancy grid, with
the light over the camera's left shoulder. It renders a voxel model of the town (built by the real build code, no
server needed) or the saved world. Block entities are boxes, there's no ambient occlusion, and the elevations of
the building alone show walls a neighbour hides in town. Judge sides from the street views.

## The loop (redshelf `docs/looks/README.md`)

1. **Name it.** Every building has a type you can say: designation plus size (`shophouse-m`), and a variant by
   roof (`shophouse-m/gables`). Free text resolves to it ("medium sized shophouse", "#66").
2. **Look at it.** A sheet per building (above).
3. **Write the rule.** Each look rule is code, with its source, run on the town in place among its neighbours.
   It must fail before the fix. First rules: no bare party-wall core showing to the open air, counted on the
   building whose face it is; nothing one block thin standing proud of the roofline; a note on blank fields over
   6 x 4.
4. **Change the type.** Fixes are knobs in a cascade (variant > type > designation > whole town), read by a dress
   pass after the massing. Snapshot first; the diff then reports which buildings changed, and which changed only
   through a wall they share with one.
5. **Show it, then build it.** A before/after sheet, then a three-way server patch: only blocks the model changed,
   and only where the world still matches the snapshot, so anything changed by hand is left alone.

Result for the note: 745 blocks changed. 4 medium shophouses changed outright, and 20 neighbours changed only
along shared walls. 12 of 12 now pass, all 46 existing town checks pass, and the patch went to the server with 0
errors.

## What might carry over here

- **Eye-height street views next to the orthographic views.** The side problem was obvious from down the street,
  and nearly invisible in a building-alone elevation.
- **Attributing a face to its owner** before scoring it. Shared walls make "whose fault is this face" a real
  question in any street-scale build.
- **A rule has to fail first.** Each complaint becomes a check that fails on the build John meant, before
  anything is changed.
- **Blast radius as a first-class output.** A type-scoped change, then a diff proving the scope, then a
  promotion to town-wide.

Still open there: the newly finished sides are plain walls. That's where a decor vocabulary (copings, plinths,
cornices, window surrounds) would plug in as more rules plus knobs.
