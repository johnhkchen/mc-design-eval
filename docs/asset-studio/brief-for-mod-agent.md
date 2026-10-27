# Asset studio: a brief for the mod development agent

You are building a Minecraft mod in which villagers run businesses and trade with other settlements on
their own. We are a separate pipeline that designs and builds Minecraft structures. This file says what
we can make for you, what you get back, and how to ask. **Send us a request file back** (template at the
end); we start with whatever asset problem is most valuable to you.

We do the building. You keep the game: mechanics, code, entities, and how assets are used are yours.

## What we can make

Figures are what we have actually measured, on a Claude subscription, not targets.

| Service | What it is | Measured cost and time |
|---|---|---|
| **Signature buildings** | One designed building from a brief and reference images: a trade hall, exchange, guild house, port. A planner model designs it, a crew of worker models builds it in parts. | $2–15 and 30–60 min each (an abbey: $2.17, 58 min; a full Notre-Dame: $14.74, 31 min) |
| **Bulk buildings** | Many ordinary buildings from footprints: shops, houses, warehouses, each built individually, so no two match. | About 4¢ each; 478 buildings in 3 h 14 min for $17.47 |
| **Variants** | Palette swaps and roof or colour variants of a finished building. Code only, no models. | Seconds, effectively free |
| **Revisions** | A fix round on one building from a written comment ("the towers read as slits"). We only revise on a comment, never on our own initiative. | $1–6 a round |
| **Settlement layouts** | Buildings placed on a plot grid with roads, paths, lamps and landscaping, composed into one structure or world. | Minutes once the buildings exist |
| **Real terrain** | Land, footprints and trees copied from open data for a real place (US cities, Paris, Auckland so far). | Minutes to an hour a place |
| **Renders** | Path-traced stills for a wiki, catalog or store page; quick preview images for every building. | 3 min a preview, 15–80 min a full-size still |

## What you get

Each asset arrives as a folder:

- `<name>.nbt`: a vanilla structure file for **Minecraft 1.21.1** (DataVersion 3955). No blocks from
  later versions.
- `<name>-card.png`: preview images from several angles.
- `<name>.json`: the manifest below.

### Manifest (proposed v0; tell us what you need changed)

```json
{
  "id": "granary-temperate-stage2-full",
  "size": [15, 12, 11],
  "footprint": { "plot": [16, 16], "door": [7, 1, 0], "facing": "south" },
  "role": { "produces": [], "stores": ["wheat", "bread"], "workers": 2, "tier": 2 },
  "markers": [
    { "kind": "job_site",  "pos": [4, 1, 5], "block": "minecraft:composter" },
    { "kind": "input",     "pos": [2, 1, 8] },
    { "kind": "output",    "pos": [12, 1, 8] },
    { "kind": "bed",       "pos": [3, 5, 2] },
    { "kind": "loading",   "pos": [7, 1, 0], "size": [3, 1, 2] },
    { "kind": "sign",      "pos": [7, 4, 0], "text_slot": "business_name" },
    { "kind": "path",      "points": [[7, 1, 0], [7, 1, 5], [4, 1, 5]] }
  ],
  "family": "granary-temperate",
  "variant": { "palette": "temperate", "stage": 2, "fill": "full" }
}
```

Positions are relative to the structure's origin. Every variant in a `family` keeps the same markers in
the same places, so you can swap them freely at run time. Markers are new for us: we will put them
wherever your placement code can read them (this JSON, data blocks inside the `.nbt`, or jigsaw blocks).
Tell us which.

## Ideas we think fit a trade sim

You know your game better; these are starting points.

- **Growth stages**: stall, then shop, then a shopfront with a warehouse, then a trading house. Swap as
  revenue grows.
- **Stock levels**: the same granary, warehouse or dock empty, partly full, overflowing.
- **Decline**: boarded-up or half-empty versions, so failure is as visible as success.
- **Regional identity**: each settlement in materials that match its exports (timber, sandstone, brick).
- **Route infrastructure**: caravan stations, docks, toll gates, inns, market squares.
- **Signage**: business names, banners and sign text written once per business.

## House rules every asset follows

- Minecraft 1.21.1 only.
- No features that depict slavery. Villagers are owners, employees and traders.
- A shop's displays and headers show the goods it actually sells.
- Chimneys draw from a hearth set into a wall and run solid through the roof.
- Street-to-door approaches use slab half-steps, at least 2 wide, never full stairs.

## What we don't do

- Write or review mod code, entity behaviour or game balance.
- Make textures, item models or resource packs (not currently).
- Deploy to a live server without the owner's approval.

## How we work together

1. You send a request file (template below). The owner passes it to us.
2. We reply with a plan: what we will build, an estimated cost and time, and a test image.
3. The owner approves; we build and deliver the folders above.
4. You try them in the mod and send back comments. We revise on those comments.

Start with your highest-value problem. A small first slice (one good, a few buildings, two variants)
tells us both quickly whether the contract works.

---

## Request template (copy, fill in, send back)

```markdown
# Asset request: <short title>

## About the mod (first request only)
- Loader and version: <NeoForge / Fabric, 1.21.1>
- How structures enter the world: <vanilla templates / jigsaw / our own placer / player-placed>
- Where you want markers: <manifest JSON / data blocks in the .nbt / jigsaw / other>
- Goods and professions modelled: <list>
- Villager movement: <how villagers path to work sites, storage and loading areas>
- Settlement scale: <buildings per settlement, plot size, spacing>

## The challenge
<What asset problem this solves, and why it is high-value for the game.>

## What you need
- Assets: <e.g. a granary family, a market stall, a caravan station>
- Quantity and variation: <how many, which axes: palette, stage, fill level, decline>
- Functional requirements: <markers, worker counts, storage, door direction>
- Size limits: <max footprint and height>
- Style: <setting, era, region; reference images if any>

## How you will judge it
<What "works" means: it places cleanly, villagers reach their job sites, it reads as a granary from the road...>

## Priority and timing
<What to build first; anything you are blocked on.>
```
