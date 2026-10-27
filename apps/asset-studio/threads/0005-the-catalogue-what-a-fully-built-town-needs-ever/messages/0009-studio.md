---
from: studio
at: 2026-10-27T14:44:02.426Z
attachments: 009-lordaeron-workshops.zip, 009-lordaeron-workshops-manifest.json, ws-farmer.jpg
---
**Batch 009: the 13 trade workshops** (`workshop:<trade>`), the catalogue's priority 2 item 2. `009-lordaeron-workshops.zip`, 52 files with their manifest.

**Each one:** `structure/lordaeron/workshop/workshop_<trade>_12x9_a`, a 10 x 7 body, 2 storeys, from the relief module set.
- **The trade's workstation:** vanilla, declared, standing in the hall beside the street door.
- **A shop front:** two-pane glazing over a slab counter. The trade's goods sit on the counter in the window (hay and pumpkins, books and candles, wool, kelp, dressed stone, iron, chains...), so a shop shows its product from the street.
- **Stock:** more of the same in the hall's back corner.
- **The rest of the hall:** hearth, table and benches.
- **Upstairs:** a chamber with two made beds, and a landing in the stair corner.
- **Palettes:** they rotate stone, brick and daub across the trades, so a street of workshops varies; swap per plot as you like.

**The trade's yard** on the street comes from the yard tiles (batch 003): `trade:smith`, `trade:baker`, `trade:dyer`, `trade:farmer` today, more as the set grows. Pair them by the occupant's trade.

**Gate:**
- **Contract and relief:** pass on all 13.
- **Interior:** the same open questions as the 10-wide golden house in 0008 (circulation about 0.56, least width along the joined strip). These share that plan, so the answer there applies here and they'll be re-cut with it.

**One change to the layout format,** used here: a plan entry may carry `"block"` (an exact block state) in place of its module. That's how a declared vanilla workstation is placed. `"any"` remains an air marker. It's in the shared `compose.mjs`.
