# Progress — T-007-01: ground-on-horyuji

Live tracker. Scoreboard + verdicts are filled ONLY from actual judge output.

## Step status

| # | step | status |
|---|------|--------|
| 1 | Revert run.mjs to champion (015 menu) | ✅ done — tree clean vs HEAD; `Detail — NO LARGE FLAT FIELDS` present |
| 2 | `npm test` pre-run gate | ✅ done — 133/133 pass |
| 3 | Live Hōryū-ji run (`019-vRefRevise-designdoc`) | ✅ done — overall strong, 4953 blocks, 31809/47581 tok, $1.52, 688s |
| 4 | Judge round-0 (helper, median-of-3) | ✅ done — overall strong |
| 5 | Read P12/P13 from render; trigger check | ✅ done — **neither trigger fired** (both held) |
| 6 | Conditional minimal edit | ⏭️ skipped — no trigger; tree stays clean champion |
| 7 | Journal attempt-log entry | ✅ done (`design-learnings.md`) |
| 8 | progress.md + review.md | ✅ done |

## Run facts (`019-vRefRevise-designdoc`)
- Reference: `references/horyu_ji.JPG` (Hōryū-ji Kondō + five-storey pagoda; near-monochrome timber).
- Config: **champion** (committed HEAD, 015 "NO LARGE FLAT FIELDS" menu) — S-010's texture-grain WT
  edit reverted before launch (it did not promote; run 017 regressed proportion strong→competent).
- Cost/size: 4,953 blocks, 31,809/47,581 tok, **$1.52**, 688s wall.
- Style chosen by the model: **"Temple of the Vermilion Eaves"** — vermilion (red concrete) dominant,
  prismarine-brick celadon-jade roofs (complement), calcite plaster ground, gold sōrin accent.
  Doc-stage quotes: "white plaster, dark wood, gray tile — *information, not mandate*" (P12) and "fold
  the pagoda's diminishing tiered spire into the crown rather than copying it as a detached tower" (P13).

## A/B scoreboard (median-of-3, rubric `v2-categorical-baml`, all samples unanimous)

| dimension | round-0 (build) | render (2nd pass) |
|-----------|-----------------|-------------------|
| proportion | strong | strong |
| color | strong | strong |
| detail | competent | competent |
| fidelity | strong | strong |
| **overall** | **strong (3/3)** | **strong (3/3)** |

The 2nd pass **held every dimension** (no regression, no lift). It restyled the body (round-0:
open red colonnade + 4 white bays + torii-like recessed door; render: enclosed two-storey vermilion
wall with white window insets) while keeping the base→middle→crown massing and palette intact.

## Principle verdicts (grounded in `render.png`, cross-checked vs judge notes)
- **P12 (color from brief, not the reference) — HELD.** The near-monochrome timber/white/grey reference
  did **not** leak. Both renders are boldly colorful (vermilion dominant, jade-green eaves, gold accent,
  grey ground); judge calls color "the build's strength … a disciplined, classic palette." Craft/color
  split generalized cleanly to a monochrome reference.
- **P13 (one connected plane; rhythm not 3-D standalone parts) — HELD.** No floating pagoda, no detached
  tiers, no sky between masses. The freestanding 5-storey tower + freestanding Kondō were translated into
  a **single connected elevation** with the pagoda's tiered rhythm folded into a crowning spire.
  Proportion stayed **strong through the 2nd pass** — the inverse of Taj run 013/017 where the revision
  detached masses and regressed proportion.

## Notable (recorded, not a P12/P13 failure)
- **Cross-form finial.** The gold crown finial renders as a Latin-cross-like shape; the judge flags it
  as "an oddly syncretic signal that muddies the cultural identity." A minor **fidelity** blemish
  (fidelity still strong), not a principle failure. Candidate future note, not actioned here.
- **Detail stayed competent** in both rounds (flat white window panels persist) — consistent with P15
  (detail is the lone holdout; the no-flat-fields menu clause helps less than structural clauses). Read
  with the P15 generation-noise caveat; not the dimension under test here.

## Deviations from plan
- None. Steps 1–2 executed before artifact authoring (to gate the metered run); the long run was
  overlapped with Research/Design/Structure/Plan authoring. Step 6 skipped (no trigger fired).
