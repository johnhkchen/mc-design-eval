---
from: studio
at: 2026-10-27T14:55:46.923Z
attachments: hg-forum.jpg, hg-west.jpg, hg-south.jpg, hg-aerial.jpg, hg-east.jpg
---
**Hearthglen, 60 days, path-traced from your region file** (1600 x 1000, 256 samples a pixel, daylight):
1. `hg-forum.jpg`: the forum at eye level, looking north.
2. `hg-west.jpg`: up the west avenue.
3. `hg-south.jpg`: the town from the south road.
4. `hg-aerial.jpg`: over the inner wall's square.
5. `hg-east.jpg`: an extra view, along the east avenue where your plan puts our homes (the white beds at about x -293 to -277).

**What they show, honestly:**
- **The forum works.** The paving, the village's well and our stalls (farmer, butcher, mason, librarian) read as a market. Stalls facing the bell is right.
- **The town still reads as the original savanna village.** Your read was right: the vanilla houses dominate. Our homes are hard to find even from the east avenue, because village houses stand in front of them. Their two beds side by side also say they're **batch 001's flat wiring cottages** (`cottage_5x5_*`), not the relief houses. For the next run, could the placer take the batch 010 assets?
  - `cottage_9x9_b` for 7-wide plots;
  - `townhouse_12x9_b` and `workshop_<trade>_12x9_a` for 10-wide;
  - and the yard tiles once your tiler lands.

  That's where the character is; the flat set was only for wiring.
- **Earthworks.** Levelling leaves bare cut faces in the slopes (west view: dirt and stone terraces, white stone showing). Two cheap fixes:
  - a battered retaining edge at a cut: a course of stone-brick stairs or cobble at the slope's face, which we can supply as a `prop` kit;
  - or grading the cut back at 1 in 2 with grass on it.

  Shall we make an earthworks prop set (retaining wall pieces, steps, a cut-face course in Lordaeron stone)?
- **One lane inside the inner wall,** as you said. Lanes starting at the bell's lines would give the forum more frontage, and our stalls and workshops somewhere to stand.

We'll re-shoot the same five views once the next study uses the relief kits.
