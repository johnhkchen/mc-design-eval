---
id: E-47
title: concept-image-conditioned-style-distance
type: epic
status: open
priority: high
depends_on: [E-46]
spec: "§9.1"
stories: [S-186, S-187]
---

## Background (the residual E-46 named)

**Milestone rung: M1, instrument-validation — "make the ruler read the picture, then re-gate."** E-46 ran the
promotion gate and returned a sharp, pre-registered **DO-NOT-PROMOTE** (T-185-01): on the S-183 decoupling
corpus at VOTES=6 the recalibrated style-distance term is **PACK-DRIVEN** —

- `packEffect = 45 ≫ conceptImageEffect = 8` (pooled, 3 subjects);
- hard-middle term-vs-label agreement `1/5 (0.20)` against **labelable** ground truth (proxy self-consistency
  0.9 — the gate is sound, the term is wrong);
- the inversion made concrete: a wrong-picture build in the right pack (`gh-samepack-classical`, 61) outranks
  the faithful gatehouse (47); a faithful build in the wrong pack (`ct-wrongpack`) scores a flat 0.

E-45 fixed the *mechanism* (severity-weighted wrong-style, graded cap, replace→add against own concept,
`replaceContrast +0.245`). It did **not** change what "expected" means: the diagnosis still grades the build
against a **pack-derived** style spec (`src/workshop/diagnose.mjs::styleProfileBlock`/`diagnoseRenderArgs`), so
the term measures **pack-material agreement, not picture resemblance.** See
`docs/active/work/T-185-01/LOCALIZATION.md` for the exact seam.

## Goal (falsifiable)

Make the style-distance term **condition on the rendered-build-vs-concept-image match**, not on pack/material
agreement — then **re-run the E-46 gate** (the corpus + harness already exist, unchanged) and promote only if
the term now reads the picture across the population.

**The bar (same instrument, same corpus):** re-running `experiments/eval-alignment/style-agreement-run.mjs` on
the S-183 corpus shows **PICTURE-DRIVEN** (`conceptImageEffect > packEffect + NOISE`), hard-middle agreement
≥ 0.70, with `gh-wrongpack`/`ct-wrongpack` (right picture, wrong pack) rising off the floor and `gh-samepack-*`
(wrong picture, right pack) falling. **Fails if:** the fix raises the picture effect only by *also* re-coupling
to the pack (no real decoupling), or it regresses the matched builds, or the gate stays PACK-DRIVEN/INCONCLUSIVE.

## Approach (diverge before converge)

Spike the candidates in `LOCALIZATION.md` §repair — picture-anchored expectation; an explicit build-vs-image
term; decoupling `styleProfileBlock` from the pack — and let the strongest (or a hybrid) win on the re-gated
decomposition, not on a hand-tuned constant ([[diverge-before-converge-experiment-freedom]]).

## Stories

- **S-186** — concept-image-conditioned style distance + re-gate (the fix, then the E-46 gate re-run).
  *Outcome (T-186-01): made the term read the picture (packEffect 45→12, hard-middle agreement 0.20→1.00) but
  re-gate landed MIXED/INCONCLUSIVE — matched builds compressed 53→21 (voxel renders graded vs concept art),
  so the +6 picture lead sits inside the noise band.*
- **S-187** — voxel-vs-art tolerance to restore matched dynamic range (blocky-but-faithful ≠ wrong-style)
  without lifting wrong-picture builds + diagnose `gh-wrongpack`, then re-run the same gate. A clean
  PICTURE-DRIVEN re-gate is what licenses the human-signed-off promotion.

## Note

The promotion gate and its human sign-off remain exactly as E-46 left them: a clean re-gate that comes back
PICTURE-DRIVEN + agreeing is what licenses the (still human-signed-off) freeze into `measurements/style-distance/`.
This epic changes the **term**, not the gate.
</content>
