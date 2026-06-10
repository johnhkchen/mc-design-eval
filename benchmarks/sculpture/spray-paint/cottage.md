# Spray-paint — cottage (T-079-02)

Plaster (`minecraft:white_terracotta`): **7 → 1197** — the 215→8 regression **reversed**.

Sealed before paint: 6429 → 6597 placements (seal then paint).

## Zone-fill base coat (T-085-01)
Deterministic fill of each zone's dominant on the visible skin, ahead of the splat: **2645 cells filled**, 2693 kept (secondary runs + already-dominant). base 151/1551, upper 1326/1413, roof 1168/2374.
Per-zone dominant coverage of the skin:
- **splat-only (the pre-fill pipeline):** base `stone_bricks` 58% of 1551 · upper `white_terracotta` 6% of 1413 · roof `spruce_planks` 43% of 2374
- **zone-filled (this fix):** base `stone_bricks` 66% of 1551 · upper `white_terracotta` 85% of 1413 · roof `spruce_planks` 91% of 2374
- upper-band plaster: **6% → 85%** — the splat places secondaries only (upper palette = ["dark_oak_log"]).

## Full-shell fill (T-090-01)
The base coat now covers the FULL exposed shell (6-dir exposure — every face any camera can see), not just the five-camera projection skin (976 cells) the old wall-field fill painted; this run filled **2645 cells**.
Exposed-shell composition, same instrument before/after:
- **before (projection-fill replay):**
  - base (1551): stone_bricks 67% dark_oak_log 21% cobblestone 8%
  - upper (1413): stone_bricks 49% white_terracotta 41% dark_oak_log 7%
  - roof (2374): spruce_planks 57% stone_bricks 26% cobblestone 9%
- **after (the painted build):**
  - base (1551): stone_bricks 66% dark_oak_log 27% cobblestone 7%
  - upper (1413): white_terracotta 85% dark_oak_log 15% spruce_planks 0%
  - roof (2374): spruce_planks 91% dark_oak_log 7% dark_oak_planks 2%
- **acceptance (chimney sub-region excepted):** roof materials 65% → **100%** (target ≥ 90%); upper `stone_bricks` residue 49% → **0%** (max 5%).
- **evidence renders (azimuth 135°):** benchmarks/sculpture/spray-paint/cottage/view-oblique135-before.png → benchmarks/sculpture/spray-paint/cottage/view-oblique135-after.png

## Coverage gate (T-088-01)
Per-zone dominant coverage is a **precondition** ahead of the per-face hill-climb (threshold **0.5** of the zone's visible skin) — proof both ways:
- **splat-only replay (the E-23 under-applied skin): REJECTED** — upper `white_terracotta` 6% < 50%, roof `spruce_planks` 43% < 50%. Delta-independent: even the historically accepted marginal 0.25→0.40 front delta cannot pass it.
- **zone-filled skin (the shipped base coat): PASSED** — every zone's dominant ≥ 50% of its skin.

## Zone mask (T-079-02)
storeyDivide = y7. Surface plaster by zone:
- **masked (this fix):** base 0, upper 454, roof 0 → plaster confined to the upper storey (base 0, roof 0).
- **unmasked (the shipped color-only splat):** base 96, upper 83, roof 131 → smeared into base + roof.
- interior strays (pre-existing, not on any face, untouched): 743.

Enforced palette ("4 cans"): cobblestone, dark_oak_log, dark_oak_planks, spruce_planks, stone_bricks, white_terracotta.
Corner collisions resolved (concept > glb): 0.

## Faces
- **front (+z)** (concept): painted 85, skipped 7, offPalette 0, zoneRejected 479, accepted=true · resemblance 0.3→0.35
- **side (+x)** (glb): painted 208, skipped 25, offPalette 0, zoneRejected 457, accepted=true · no concept face for this side — the textured GLB is the truth; gated by-construction

Refine: skipped (optional polish; the structural zone mask + base/roof=0 throw are the guard)

> the splat does the bulk; the LLM refines/judges (twodee-interaction-sector). Verdict = the human face triptych + categorical judge (E-22 Rule 2); these scores are the per-face hill-climb nudge.
