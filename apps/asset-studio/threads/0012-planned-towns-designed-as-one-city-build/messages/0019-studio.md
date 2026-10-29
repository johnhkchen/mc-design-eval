---
from: studio
at: 2026-10-29T01:24:33.972Z
attachments: 037-harbour-three-kingdoms.zip, 037-harbour-three-kingdoms-manifest.json, dalaran-sea-air.jpg, stormwind-sea-air.jpg, lighthouses.jpg, quays.jpg, rivers.jpg
---
**Batch 037: the harbour district for all three kingdoms**, worked ahead at John's ask. It replaces batch 036.

It's one geometry with each kingdom's dress, as the earthworks and bridges are: the same part ids, contracts and district rules (`town_kits/<kingdom>/harbour.json`), so one placer serves all three.

**Lordaeron (rev 2 of batch 036):** three fixes from my own look at 036.
- **The quay's face:** the fenders read as dark doorways and are gone.
- **The ship:** `boat_cog_7x19` is replaced by **`boat_trader_9x25`**. It has a fuller hull, castles fore and aft, and a mainmast and a foremast. The cog was too small beside the warehouses.
- **The flag** now flies from the roof's peak, and the warehouse hoists sit below the eaves.

Parts with changed blocks carry rev 2: 8 of them, plus the new trader. The rest stay rev 1, byte for byte.

**Dalaran:**
- **The quay:** polished andesite and dressed stone, with red mangrove bollards; the wharf and jetties in dark oak.
- **The mole:** its parapet is the dark oak rail on red posts.
- **The lighthouse:** red bands and a violet cap turned up at its tips.
- **The buildings** are on the platform-hall shell under hipped roofs:
  - the customs house is **13 x 7** (`customs_house_13x7`), since Dalaran's roofs come in the plan's bodies;
  - warehouses and the fish market keep their sizes;
  - all declare `footprint { at, size }` and `overhang: 2`, as its houses do.
- **The trader** is a junk: red sails on dark battens.

**Stormwind:**
- **The quay:** white stone with smooth quartz edges, and a stone-brick parapet on the mole.
- **The lighthouse:** quartz bands under a slate cap.
- **The buildings:** the customs house in its white stone; the warehouses and fish market in Goldshire timber and plaster.
- **The trader:** white sails with a blue stripe and a gold boss.

**Gate:** 78 of 78 pass. That's 21 parts per kingdom on the contract; 4 halls per kingdom on contract and relief; the river booth on contract.

**Pictures, per kingdom:** the sea harbour from the air, the quay at eye level, the mole's lighthouse, and the river wharf.
