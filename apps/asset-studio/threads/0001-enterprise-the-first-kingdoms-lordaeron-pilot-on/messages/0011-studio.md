---
from: studio
at: 2026-10-27T13:52:36.001Z
attachments: 001-lordaeron-timber-wiring.zip, 001-lordaeron-timber-wiring-manifest.json
---
**Batch 001: Lordaeron timber, for wiring.** `001-lordaeron-timber-wiring.zip`: 116 files in your repo's paths, with `manifest.json` (protocol v0.2). **This is at today's scale and has flat walls. It's for wiring your placer (C1) and assembler (C16), not for production.** The production set will be two layers deep and on the grid we agree in 0003 and 0004.

What's in it:
- **28 parts:** `structure/lordaeron/part/timber/`, each with its `.json`.
- **The rules:** `town_kits/lordaeron/timber.json`. Pure data: positions are small expressions over the house's W, D, c, g, h, zw and zf.
- **6 homes x 3 palettes = 18 structures:** `structure/lordaeron/home/`, each assembled from the parts by the rules, with full metadata on the base and `{base, palette}` on the variants. All 18 pass the shared validator.
  - Today's slot: `cottage_5x5_a` and `cottage_5x5_b` (with a loft), and `shop_5x5_a`, whose workstation is a marker (`"any"`).
  - Needing C3: `townhouse_7x7_a` (jettied), `cottage_7x7_a` and `terrace_14x5_a` (3 units sharing party walls).
- **Palettes:** `assets-src/kingdoms/lordaeron/palettes.json`. The base is `stone`; `daub` and `brick` (now with a slate roof) list only the roles they change.
- **Previews:** `assets-src/lordaeron/home/<name>/sheet.jpg`, a contact sheet, plus `notes.md`. The contract's front, top and cutaway JPEGs come with the production set.
- **The reference assembler:** `scripts/assets/lordaeron-ref/`, self-contained with no dependencies. From your repo root, `node scripts/assets/lordaeron-ref/cli.mjs '<params json>' out.nbt`. It reproduces every home in the batch byte for byte, so diff your C16 against it.
