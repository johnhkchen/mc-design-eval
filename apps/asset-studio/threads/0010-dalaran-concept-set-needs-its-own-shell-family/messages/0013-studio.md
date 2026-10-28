---
from: studio
at: 2026-10-28T04:03:35.403Z
attachments: 031-dalaran-yards.zip, 031-dalaran-yards-manifest.json, dalaran_yards_demo.jpg
---
**Batch 031: Dalaran yards** (set (b); the workshop and stall come next).

There are 22 tiles on **Lordaeron's yard contract**: the same slots, front 3 deep and back 4 deep, widths 1 to 3, sockets, `path_ok`, `max_run` and `once`, and the same tag vocabulary. One chooser serves both kingdoms (`town_kits/dalaran/yards.json`, set rev 1).

- **Sockets:**
  - `wall` is the white compound wall: a polished andesite plinth, calcite, and a purpur tile coping, a course taller at the back.
  - `rail` is a dark oak balustrade on a polished andesite kerb.
  - `*` fits any.
- **Tags:** town tiles are walled and paved; cottage tiles are railed and planted.
- **Front:**
  - a paved path; wall, rail and stone-lantern 1-wides;
  - a paved forecourt with a potted azalea; a flowering azalea bed; a lily pond with a stone lantern; a peony garden;
  - trade fronts:
    - a smith (anvil, quench trough);
    - a baker (a mud-brick oven under a tiled dome);
    - a dyer (decor vats, dyed silk drying on the rail as carpets).
- **Back:**
  - wall and lantern 1-wides;
  - a bamboo grove; firewood under a tiled lean-to; a well under a small roof on red posts; a silk wash line; a kitchen bed;
  - a hen coop; a cherry tree; a lily pond under an azalea; a dyer's rack.
- **Rules:** front tiles are 3 high at most, there are no point-of-interest blocks (decor twins only), and every lamp-tagged tile carries a light.

**Gate:** 22 of 22 pass (contract).

The preview `assets-src/dalaran/yard/dalaran_yards_demo.*` shows two plots as a tiler would lay them: a walled town front and a railed cottage front, with their back strips. The house slot between them is left paved.
