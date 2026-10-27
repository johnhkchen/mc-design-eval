---
from: studio
at: 2026-10-27T13:16:40.665Z
status: planned
---
# Plan: the first kingdoms, Lordaeron pilot

Thanks: the contract is the clearest brief we've had. Villager rules, slots and acceptance are all stated, so we can
check our own work against them before you see it. Here's our plan, then the answers.

## What we're confident in, and what's new for us

- **Proven:** concept art (Codex paints from a brief, rounds refine it); kingdom style sheets and palettes; detailed
  signature builds; layouts on real terrain from GeoJSON and height rasters; path-traced renders.
- **New, and the riskiest part of the batch:** modular part sets with sockets plus assembly rules your code runs. We
  build in parts internally, but shipping parts that snap on your grid at every parameter value is new. We'd prove it
  small first (item 3 below) before you write C16 against it.
- **New but straightforward:** detailing a mass while keeping its fixed blocks exactly. We'll check every delivery
  ourselves first with a validator that mirrors your C14: DataVersion, slot size, no undeclared points of interest, no
  chest against a job site, light 8+, beds whole, a walk from the door to every bed and workstation.

## Order

1. **Concept art** (P0 #1): Lordaeron at village and town tiers, town from the road, a street, the forum, the abbey,
   plus notes. For John's approval. *No builds before this.*
2. **Style sheet and palettes** (#2): `style.md` you can read in five minutes, three palettes (daub, brick, stone).
3. **Part set, proven small** (#3, #4): first the 5 x 5 home at 3 palettes, then 7 x 7 and a terrace from the same
   parts. Assembly rules as data (`town_kits/lordaeron/timber.json`), plus a reference assembler in JS so you can
   diff your C16's output against ours, block for block.
4. **Yards, stalls, masses** (#5–#7), validated before delivery.
5. **Wall kit** (#8): tiling solved for all four of Hearthglen's sides, gates on the avenues.
6. **Hearthglen design** (#9) once your GIS export (C13) exists: layout, renders at two tiers, `town_rules/lordaeron.json`.

Steps 1–3 don't wait on any of your code.

## Estimate

Your $110–320 range is right. Our expectation is **$120–250**, with the part set the item most likely to run over.
We'll post actual spend at each step. Concept art costs little: it's painted outside our build budget.

## Where we'd rather ship data than code

Data first: assembly rules and town rules as JSON, plus our JS reference assembler as the spec. Java generators
later, once the rules have settled and we know which ones are worth compiling.

## Delivery

The contract has us open PRs on your repo. We'd suggest deliveries land on this desk as files laid out in your repo's
paths, and your agent commits them on `assets/NNN-<slug>` and opens the PR. That keeps your repo yours. If you'd
rather give us push access to a branch, say so.

## Your questions

1. **GIS input:** GeoJSON in `[x, -z]` plus 16-bit PNG heights with world files suits us. For the pilot please also
   send `region/`: we render designs in the real world around them, which is the fairest side-by-side.
2. **Masses:** JSON boxes are enough. Helpful extras: what stands on each neighbouring plot, the ground heights
   across the footprint, the occupant's trade and level, and the town's seed.
3. **Grid:** 2-block bays between 1-block posts with 4-block storeys suits timber-framing well. Sockets should carry:
   face, height range, kind (post, bay, roof), palette roles, and whether the joint is jettied.
4. **Ward blocks:** agreed, parts plus rules. We'd also deliver one or two whole example wards as the target the
   rules must reproduce, so quality has a reference.
5. **Walls on slopes:** a deep plinth (4 foundation layers) covers small changes. Step pieces only where a side climbs
   more than about 3 blocks between neighbours.
6. **Growth tiers:** the upgrade invariants (which blocks must survive into the next tier, by role) and whether a slot
   may widen or deepen between tiers. We'd design each tier's envelope to contain the last.

## Next

Once John approves this plan we'll post the Lordaeron street sketch here, then the full concept set.
