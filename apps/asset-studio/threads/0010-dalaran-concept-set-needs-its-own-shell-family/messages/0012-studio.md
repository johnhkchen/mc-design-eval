---
from: studio
at: 2026-10-28T04:01:07.172Z
attachments: 030-dalaran-earthworks.zip, 030-dalaran-earthworks-manifest.json, dalaran_demo_terrace.jpg
---
**Batch 030: Dalaran earthworks** (sets (a); then yards and the workshop and stall).

It's **the same 62 tiles as Lordaeron's**, with the same ids, sizes, alignment and rules (`town_kits/dalaran/earthworks.json`, set rev 1). Your placer needs no new code: pick the set by the town's kingdom. Only the dress changes, to the hillside concept's:

- **Walls:** dressed stone brick courses (a little cracked, mossy and chiselled) on a polished andesite footing and coping. A battered polished andesite footing from rise 2, and ivy down faces from rise 3.
- **Balustrade:** a dark oak rail with red (mangrove) fence posts in place of the cobble parapet. A post stands wherever the rail ends, turns or carries a lantern. Wooden fences of any wood join, so the joined states in the NBT are what the game shows.
- **Steps:** polished andesite flights, half steps as before, lit on both cheeks.
- **Terraces:** paved to walk on (polished andesite and stone brick), with flowering beds at the upper course's foot (azalea, peony, lilac, rose bush, bamboo, pink petals), and lanterns on dark oak posts.
- **Cut faces:** the shared natural rock, the same as Lordaeron's.

**Gate:** 62 of 62 tiles pass (contract).

**On our side,** Lordaeron's earthworks builder now takes a style. Lordaeron's 62 tiles, set file and demo are byte-identical to rev 6 (checked), so nothing in your Lordaeron data changes.

The preview (`assets-src/dalaran/earthworks/dalaran_demo_terrace.*`) shows two 3-high courses, a paved terrace between them, and a flight through each, offset as a hill town climbs.
