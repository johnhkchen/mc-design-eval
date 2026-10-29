---
from: studio
at: 2026-10-29T01:07:18.952Z
attachments: 036-lordaeron-harbour.zip, 036-lordaeron-harbour-manifest.json, sea-air.jpg, sea-quay.jpg, sea-mole.jpg, river-air.jpg
---
**Batch 036: the harbour district (Lordaeron)**, worked ahead at John's ask: docks, the port, a customs house and boats for towns on the sea, with smaller river versions. No rush to integrate. It's here for when the district work reaches the water. The set file (`town_kits/lordaeron/harbour.json`) carries the parts and the district's placement rules.

**Two new contracts:**
- **Dock contract** (waterside parts): layer `water_line` (0) is the water's surface; the deck stands at `deck`; each declared piling runs down from the water line to the bed, as the stone docks' pilings do now. Unset cells in a part's water side are left as they are.
- **Boat contract:** `water_line` (1) goes at the water's surface. Everything under it is solid hull, so nothing floods when placed.

**Waterside parts (21):**

| part | use |
|---|---|
| `quay_stone_1a/b/c`, `_bollard_1`, `_lamp_1`, `_ladder_1`, `_steps_1`, `_crane_1` | sea and river: a stone quay edge, 1 wide x 3 deep (z 0 paving, z 1 the edge, z 2 its face's fixtures), deck 2 over the water: bollards, lamps, iron-runged ladders, steps down to the water, a timber crane with its hoist |
| `quay_timber_1a/b`, `_lamp_1`, `_ladder_1`, `_crane_1` | river: the same in timber, a plank wharf on spruce piles |
| `jetty_timber_3x4`, `jetty_head_timber_5x5` | both: a jetty out from the quay, segments then a head with a bench, mooring posts and lamps |
| `mole_7x4a/b`, `mole_head_lighthouse_9x9` | sea: a breakwater of rubble with a paved walk behind a parapet; its head a banded stone lighthouse with a lit lantern room, a gallery and a slate cap |
| `boat_cog_7x19` | sea: a trader with castles fore and aft, a square sail, cargo, lamps |
| `boat_fishing_3x8` | both: a fishing boat, its sail furled |
| `boat_barge_4x11` | river: a flat barge with a covered load and a tiller |

**Buildings (5), on the relief module set, ground 2, fronts to the quay:**
- `customs_house_13x10`, stone, 2 storeys: an open arcade on the quay where cargo is inspected and weighed, the collector's office and strongroom above, a cupola with the harbour flag.
- `warehouse_13x7`, brick, 2 storeys: open loading bays to the quay, stock inside, a hoist from the loft's east gable.
- `warehouse_10x7`, the river's, 1 storey.
- `fish_market_10x7`: arcades to the quay, tables of fish on ice, barrels, kelp.
- `river_customs_7x5`: a booth at a river landing or a bridge's head, its counter window and a chain boom to the water.

**Gate:** all 21 parts pass the contract; the 4 halls pass contract and relief, and the booth passes contract.

**The district** (placement and growth in the set file):
- **Sea:** a quay street along the shore inside the outer wall. Its water side is quay tiles, its land side the district's plots facing the water.
  - The customs house goes at the quay's head beside the avenue that meets it. It's the district's first build.
  - Warehouses go along the quay with a crane in front of each, and the fish market at the far end.
  - A jetty every 24; the mole and lighthouse shelter the mouth; a cog lies alongside and fishing boats at the jetties.
- **River:** a timber wharf (8 to 16) where the main street meets the river, the river warehouse behind it, and the customs booth at the wharf's upstream end or the bridge's head. Add a jetty, a barge and a fishing boat.
- **Growth:**
  - hamlet: a jetty and a boat;
  - village: the wharf, or the first quay run and the customs house, a warehouse and the fish market;
  - town: the full quay, the mole and lighthouse, cogs and barges.

Pictures (demo scenes): the sea harbour from the air, the quay at eye level, the mole and lighthouse, and the river wharf.

Dalaran's and Stormwind's dress can follow when the district goes in. Tell me which kingdom's coast comes first.
