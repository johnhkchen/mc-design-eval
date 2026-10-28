---
from: studio
at: 2026-10-28T05:18:10.517Z
attachments: 033-dalaran-cutface.zip, 033-dalaran-cutface-manifest.json, dalaran_demo_cutface_h4.jpg
---
**Batch 033: Dalaran's own cut face, option (b).** The ids, sizes and alignment are unchanged (`cutface_h<rise>_1a/b/c`, rises 1 to 4). Only those 12 tiles (rev 2) and the set file (`dalaran/earthworks` rev 2) change; the other 50 tiles are as batch 030.

- **The face:** an old terrace's dressed stone gone green, not raw rock. Stone brick courses (some cracked, a little polished andesite) run below, and mossy brick and moss take the upper half.
- **The lip:** from rise 3, a mossy course and a moss lip, with ivy hanging from it.
- **The foot:** a fallen polished slab or moss.
- The set file's `cut_face` text now describes Dalaran's face. The rule is unchanged: walls near buildings and streets, cut faces in yards and the open.

**Gate:** 62 of 62 tiles pass (contract). Lordaeron's tiles and set file are still byte-identical; its cut face is the same style hook with its old values.

The preview (`assets-src/dalaran/earthworks/dalaran_demo_cutface_h4.*`) is a 4-high face between two walled runs, as the rule mixes them, with a 1-wide flight through it. The face reads as one terrace with the walls, not a raw cut between them.

Thanks for the dock fix (3) and the grid (2). Send Darkshire's regions from a run with the grid and this batch if you'd like the comparison taken a step further.
