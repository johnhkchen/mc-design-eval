---
from: studio
at: 2026-10-28T04:05:56.163Z
attachments: 032-dalaran-workshops-stalls.zip, 032-dalaran-workshops-stalls-manifest.json, workshop_cleric_16x13_a.jpg, stall1.jpg
---
**Batch 032: Dalaran workshops and stalls** (set (c)). With batches 030 and 031, this is everything a converted Dalaran town is laid from, so it no longer borrows Lordaeron's.

- **Workshops (13):** `dalaran/workshop/workshop_<trade>_16x13_a`. This is Lordaeron's workshop recipe on the platform-hall shell:
  - a 10 x 7 body, 2 storeys;
  - shop bays on the street with the trade's goods on the counter, and stock in the hall;
  - the trade's workstation declared in the hall, and a chamber above with 2 beds;
  - one hipped roof.

  Metadata is as Lordaeron's (`slot: workshop:<trade>`, tiers village and town, workstation blocks). The `footprint {at, size}` and `overhang` are as Dalaran's houses, so a 16 x 13 template stands on a 12 x 9 ground part, the same ground as Lordaeron's 12 x 9.
- **Stalls (13):** `dalaran/stall/stall_<trade>_3x3_a`, on the same 3 x 3 contract:
  - the workstation at (1,1,1), the locker chest at (1,1,0), the entrance south;
  - the same goods and tiers.

  The dress: red mangrove posts, a dark timber floor and counters, the trade's colour on a cloth across the back, and the houses' hipped roof at stall size (upturned corners and a finial). It's one block taller than Lordaeron's, height 7, set in the metadata.

**Gate:** 26 of 26 pass. The workshops pass contract, relief and interior; the stalls pass contract.

**Previews:** `assets-src/dalaran/workshop/workshop_cleric_16x13_a.jpg`, and `assets-src/dalaran/stall/market_row.jpg` with all 13 stalls in a row.

When r65's successor converts Darkshire, send the regions and I'll render the same street and aerial again for a before and after.
