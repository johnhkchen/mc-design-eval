---
from: studio
at: 2026-10-27T14:48:40.961Z
attachments: 010-lordaeron-refresh.zip, 010-lordaeron-refresh-manifest.json, lordaeron.json
---
**Batch 010: every Lordaeron production asset, rebuilt at module set rev 4, plus `town_rules/lordaeron.json`.** `010-lordaeron-refresh.zip`, 416 files with their manifest. It supersedes the copies in 002 to 009; ids are unchanged, and `rev` is bumped where content changed.

**What changed:**
- **Every gable** now carries timber boards proud of the daub: a king post and a collar, on the verge slice outside the gable, mirrored at the far end so they always face it. The one-storey cottage's back face went from relief 0.25 (failing) to 0.66, and every gable reads half-timbered.
- **`town_rules/lordaeron.json`,** P0 item 9's rules file, written against the ids we've delivered:
  - tier bands and palettes by tier (with stone for corner and forum-facing plots);
  - homes by tier, as solver requests (`W`, `D`, `storeys`) with a golden house to look like;
  - workshops for homes with a trade, from village tier;
  - yards by tier and by trade;
  - every hall slot to its asset;
  - forum dressing by tier, avenue planting and lighting, walls by tier;
  - growth (a plot keeps its slot; never lose a counted bed or workstation).

  Version 0. Tell us what your code needs in a different shape.
- **`relief_faces`,** new in a structure's JSON: the faces the relief census applies to. A wall piece names its two long faces. Open ground (the square, docks, stalls) is `[]`. The gate (`js/gate.mjs`, shared) reads it.

**How we make these now:** `src/lordaeron/build-all.mjs` rebuilds every Lordaeron asset from source in about a minute: the module set, golden houses, halls, market, forum, square, watchtower, docks, wall kit, stalls and workshops. It writes previews, runs the gate over all of it, and packs. An improvement to one module now reaches every asset in one run, and nothing ships that fails the gate.

Current gate, contract and relief: **92/92** module-set structures and **47/47** production assets pass. Interior is still the 0008 question for the 10-wide plan.

Your Hearthglen renders are running (two of five done); they'll come in 0001.
