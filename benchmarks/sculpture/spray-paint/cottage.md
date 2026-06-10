# Spray-paint — cottage (T-079-02)

Plaster (`minecraft:white_terracotta`): **7 → 459** — the 215→8 regression **reversed**.

Sealed before paint: 6429 → 6597 placements (seal then paint).

## Zone-fill base coat (T-085-01)
Deterministic fill of each zone's dominant on the visible skin, ahead of the splat: **976 cells filled**, 1474 kept (secondary runs + already-dominant). roof 339/1214, upper 583/638, base 54/598.
Per-zone dominant coverage of the skin:
- **splat-only (the pre-fill pipeline):** base `stone_bricks` 56% of 598 · upper `white_terracotta` 13% of 638 · roof `spruce_planks` 64% of 1214
- **zone-filled (this fix):** base `stone_bricks` 62% of 598 · upper `white_terracotta` 71% of 638 · roof `spruce_planks` 89% of 1214
- upper-band plaster: **13% → 71%** — the splat places secondaries only (upper palette = ["dark_oak_log"]).

## Coverage gate (T-088-01)
Per-zone dominant coverage is a **precondition** ahead of the per-face hill-climb (threshold **0.5** of the zone's visible skin) — proof both ways:
- **splat-only replay (the E-23 under-applied skin): REJECTED** — upper `white_terracotta` 13% < 50%. Delta-independent: even the historically accepted marginal 0.25→0.40 front delta cannot pass it.
- **zone-filled skin (the shipped base coat): PASSED** — every zone's dominant ≥ 50% of its skin.

## Zone mask (T-079-02)
storeyDivide = y7. Surface plaster by zone:
- **masked (this fix):** base 0, upper 454, roof 0 → plaster confined to the upper storey (base 0, roof 0).
- **unmasked (the shipped color-only splat):** base 96, upper 83, roof 131 → smeared into base + roof.
- interior strays (pre-existing, not on any face, untouched): 5.

Enforced palette ("4 cans"): cobblestone, dark_oak_log, dark_oak_planks, spruce_planks, stone_bricks, white_terracotta.
Corner collisions resolved (concept > glb): 0.

## Faces
- **front (+z)** (concept): painted 86, skipped 8, offPalette 0, zoneRejected 477, accepted=true · resemblance 0.3→0.35
- **side (+x)** (glb): painted 224, skipped 30, offPalette 0, zoneRejected 436, accepted=true · no concept face for this side — the textured GLB is the truth; gated by-construction

Refine: skipped (optional polish; the structural zone mask + base/roof=0 throw are the guard)

> the splat does the bulk; the LLM refines/judges (twodee-interaction-sector). Verdict = the human face triptych + categorical judge (E-22 Rule 2); these scores are the per-face hill-climb nudge.
