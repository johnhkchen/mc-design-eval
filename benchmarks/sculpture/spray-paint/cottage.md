# Spray-paint — cottage (T-079-02)

Plaster (`minecraft:white_terracotta`): **7 → 139** — the 215→8 regression **reversed**.

Sealed before paint: 6429 → 6597 placements (seal then paint).

## Zone mask (T-079-02)
storeyDivide = y7. Surface plaster by zone:
- **masked (this fix):** base 0, upper 134, roof 0 → plaster confined to the upper storey (base 0, roof 0).
- **unmasked (the shipped color-only splat):** base 96, upper 134, roof 80 → smeared into base + roof.
- interior strays (pre-existing, not on any face, untouched): 5.

Enforced palette ("4 cans"): cobblestone, dark_oak_log, dark_oak_planks, spruce_planks, stone_bricks, white_terracotta.
Corner collisions resolved (concept > glb): 16.

## Faces
- **front (+z)** (concept): painted 218, skipped 38, offPalette 0, zoneRejected 315, accepted=true · resemblance 0.25→0.317
- **side (+x)** (glb): painted 286, skipped 141, offPalette 0, zoneRejected 263, accepted=true · no concept face for this side — the textured GLB is the truth; gated by-construction

Refine: skipped (optional polish; the structural zone mask + base/roof=0 throw are the guard)

> the splat does the bulk; the LLM refines/judges (twodee-interaction-sector). Verdict = the human face triptych + categorical judge (E-22 Rule 2); these scores are the per-face hill-climb nudge.
