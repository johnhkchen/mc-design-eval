---
from: studio
at: 2026-10-27T20:33:27.139Z
attachments: 024-dalaran-first-houses.zip, 024-dalaran-first-houses-manifest.json, dalaran-houses.jpg
---
**Batch 024: Dalaran's first houses and its module set.** `024-dalaran-first-houses.zip` with its manifest. All 29 parts and the 5 houses pass the shared gate: contract, relief on all four faces, and interiors on your floor-plan tool.

**The set, `dalaran/platform_hall`** (`town_kits/dalaran/platform_hall.json`, parts in `structure/dalaran/part/platform_hall/`):
- **Same slots, sizes, ids and placement as `lordaeron/timber_relief`**, so your WFC solver and `plan.json` carry over unchanged. Every Lordaeron body class (7 x 7, 10 x 7, 13 x 7, 10 x 10) composes as Dalaran.
- **Cores and fit-out are Lordaeron's parts**, listed in the set file.
- **Construction:**
  - **ground storey:** red lacquered columns on a stone plinth with a stepped lip;
  - **upper storeys:** white plaster in dark timber;
  - **windows:** one lattice column a bay, so the walls read white with dark openings;
  - **eave:** a bracket on every column;
  - **between storeys:** a violet tile skirt;
  - **door:** a bracket hood with a lamp.

**One composer change, the roof.** Dalaran's roof is **one hipped piece per body**, `roof_hip_<W>x<D>`: concave, with upturned corners and pillar finials on the ridge, laid over the relief outline with **2 of eave all round**.
- **Placement:** the house template is 2 wider on every side than a Lordaeron one, so every other placement shifts by +2 in x and z.
- **No chimney stack:** the roof is unbroken.

The set file's `placement.roof` says this exactly. In `scripts/assets/lordaeron-ref/compose.mjs` it's ten lines: a layout's `set`, roof `hip` and `margin`, with Lordaeron's output byte-identical. `scripts/assets/dalaran-ref/` holds Dalaran's modules and its layout wrapper, `dalaranLayout(p)`.

**Metadata, as you asked:** each house declares `footprint: { at: [2, 2], size: [...] }` (what stands on the ground) and `overhang: 2` (the eaves). The shared validator now accepts that form and checks the ground part lies inside the structure. It's pushed to `js/check-asset.mjs`.

**The houses** (`structure/dalaran/home/`, a `front.jpg` each under `assets-src/dalaran/home/`):
- `cottage_7x7_a`;
- `house_10x7_a`, and `shophouse_10x7_a` (the shop bay on the street);
- `house_13x7_a`;
- `house_10x10_a`.

`dalaran-houses.jpg` shows four of them.

**A bug fix in the shared reference, please take it:** `scripts/assets/lordaeron-ref/compose.mjs` looked for `plan.json` at a path that's wrong from inside your repo (`../../bundle/...`). So run from there, it fell back to its own built-in furniture. It now reads `../../../core/.../plan.json`. Your Java port reads the data itself, so only the JS reference was affected.

**Still to come for Dalaran:**
- the courtyard house (double plot, the court open to the sky);
- the hall with its front gallery, as in the study;
- the kingdom's pieces: paifang, bell pavilion, courtyard wall and gate, then the pagoda.
