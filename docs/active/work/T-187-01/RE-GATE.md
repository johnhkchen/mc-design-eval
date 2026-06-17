# T-187-01 — RE-GATE (the voxel-vs-art tolerance, judged at VOTES=6)

**Verdict: `DO-NOT-PROMOTE` (`recommendation.go = false`, "validated only on the obvious pairs") — but
the split MOVED, and the move is the finding.** The tolerance did *exactly* what it was built to do: it
made the decomposition **PICTURE-DRIVEN, decisively** (`conceptImageEffect 33 ≫ packEffect 5`, clearing
`NOISE(12)` with room) **without lifting wrong-picture builds** (matchedWrong 3→7) — the dominant
predicted failure (uniform lift) did **not** occur. But it **regressed hard-middle agreement 5/5 → 2/5**
by over-lifting the deliberately-MIDDLING builds toward the faithful ones, collapsing the faithful-vs-
middle margin to inside the noise band. T-186 was decomposition-FAIL + agreement-PASS; **T-187 is the
mirror image: decomposition-PASS + agreement-FAIL.** Still a split; the AC says do not promote on a split.

Source: `experiments/eval-alignment/results/style-agreement.json` (`style-agreement/v1`, VOTES=6,
`labelSource: llm-proxy`, `licensing: false`). Compare against T-186-01 `RE-GATE.md`.

## 1. The decomposition — PICTURE-DRIVEN, the primary claim CONFIRMED

| cell | **T-187 mean** | T-186 | T-185 | moved |
|---|---|---|---|---|
| **matchedRight** (rustic, right picture) | **40** | 21 | 53 | ✅ headroom RESTORED (compression fixed) |
| **matchedWrong** (rustic, WRONG picture) | **7** | 3 | 45 | ✅ stayed LOW (decoupling held) |
| **foreignRight** (guildhall, right picture) | **35** | 9 | 8 | ✅ rose hard (pack-material leak fixed) |

- **conceptImageEffect = 40 − 7 = `33`** (T-186: 18; T-185: 8). Swapping the *picture* now moves the
  score **4×** what T-185 saw.
- **packEffect = 40 − 35 = `5`** (T-186: 12; T-185: **45**). Swapping the *pack* now costs **~⅑** of the
  E-46 confound. The pack-material confound is essentially gone.
- `33 > 5 + 12` ⇒ **PICTURE-DRIVEN** (T-186 missed this by 6 inside the noise band; T-187 clears it by 16).

**The crux, reported explicitly (the AC):** `matchedRight` rose **19** points (21→40) while
`matchedWrong` rose **4** (3→7). The faithful builds lifted; the wrong-picture builds did **not**. This
is the spread the gate needs, and it is the design's mechanical prediction holding: the medium clause
forgives blockiness (lifting faithful builds), but wrong-picture builds diverge in CONTENT (missing
entablature, gold cornice, medallion frieze — `gh-samepack-classical` floored at **0** across all 6
votes), which the clause explicitly does NOT forgive. **The dominant risk named in the claim did not
materialize.**

**Per-subject** (PICTURE-DRIVEN on every subject with a contrast): gatehouse CIE 20 / PE 3; cottage CIE
36 / PE **−7** (the pack now slightly *helps* the foreign build); barn CIE 41 / PE n/a.

## 2. gh-wrongpack — DIAGNOSED: it was the TERM (pack-material leak), not the fixture

`gh-wrongpack` **1 → 23** (votes `[12,28,20,20,28,28]`); `ct-wrongpack` **16 → 46**. The faithful
gatehouse-in-guildhall recovered off the floor under the D3 material anti-leak. This settles the AC's
third failure clause: the floor was **NOT** a synthetic-grounding artifact — it was the foreign
vocabulary leaking as the expected MATERIAL (the §2b same-build contrast: rustic→`add`, guildhall→
`replace`). Telling the judge "these materials are never the expected material" recovered it. **No
fixture change needed; the GATEHOUSE_PROGRAM stays as-is** (T-182 comparability preserved).

## 3. Where the residual now lives — the hard-middle margin collapsed into the noise floor

The tolerance also lifted the **hard-middle** (deliberately-middling) builds, and proportionally MORE:

| hard-middle state | **T-187** | T-186 |
|---|---|---|
| gh-mid-material | 29 | 9 |
| gh-mid-gate | **47** | 3 |
| ct-mid-plain | 44 | 10 |

They now sit **at or above** the faithful builds (gh-match 26, ct-match 39), so the term's argmax flips:

| pair | term | label | margin | note |
|---|---|---|---|---|
| **H1** gh-match(26) vs gh-mid-material(29) | B | A | **Δ3** | sub-noise flip |
| **H2** gh-mid-material(29) vs gh-mid-gate(47) | B | A (intended *tie*) | Δ18 | gh-mid-gate over-lifted to ~matched |
| **H4** ct-match(39) vs ct-mid-plain(44) | B | A | **Δ5** | sub-noise flip |

Two of the three disagreements (H1, H4) are flips on gaps **smaller than `NOISE(12)`** — the term and
the proxy "disagree" on differences below the instrument's own resolution. The proxy itself stays
near-unanimous A (frac 0.83) on those pairs; the term flips on a 3–5 point gap. The third (H2) is a
genuine over-lift: `gh-mid-gate` (votes `[52,60,40,52,40,40]`, mean 47) is now read as essentially
faithful — the clearest case of the tolerance being **too generous on the middle**.

**The localization (sharp):** the lever is no longer the term's decomposition *scale* — that is fixed.
It is the **hard-middle DISCRIMINATION**, and it splits two ways:
1. **The instrument floor.** Hard-middle pairwise agreement is measured on faithful-vs-middle gaps that
   are *inside* `NOISE(12)`. T-186's 5/5 was itself partly luck on sub-noise gaps (its margins:
   gh-match 18 vs gh-mid-material 9 = Δ9, also < noise); T-187 just flipped which side of the noise some
   pairs landed on. **Argmax on sub-noise gaps is not a reliable axis** at this corpus size/granularity —
   a noise-aware pairwise rule (tie within ±NOISE) would not register H1/H4 as disagreements. This is a
   GATE/measurement localization, not a term reading error.
2. **Tolerance granularity (H2).** `gh-mid-gate` genuinely over-lifted (Δ18). The current clause makes a
   BINARY medium/content split; it has no "faithful vs middling-but-recognizable" gradation, so a build
   that is recognizable-but-worse can score like a matched one. Tightening that is a term lever — but it
   risks re-compressing the matched cell (the exact thing this loop fixed), so it is a *successor*
   decision, not a same-loop tweak.

## 4. Agreement & concordance

`overall 5/8 (0.625)` · `easy 3/3 (1.00)` · **`hardMiddle 2/5 (0.40)`** · `tau = +0.25 (C=5, D=3)`.
Inter-label hard-middle self-consistency **0.83 ≥ 0.67 (LABELABLE)** — the proxy labels are stable, so
the disagreement is the TERM's (or the gate's sub-noise rule's), not label noise. The recommendation
fires `onlyEasy` ⇒ `DO-NOT-PROMOTE (validated only on the obvious pairs)`.

## 5. The verdict, read against the claim

The falsifiable claim required ALL of: PICTURE-DRIVEN ∧ matchedRight↑ without matchedWrong↑ ∧
hard-middle ≥ 0.70 ∧ gh-wrongpack diagnosed.

- PICTURE-DRIVEN ✅ (33 vs 5, clears noise by 16) · matchedRight↑ (21→40) without matchedWrong↑ (3→7) ✅
  · gh-wrongpack diagnosed ✅ (term, not fixture; 1→23) · **hard-middle agreement 0.40 < 0.70 ❌**
  (regressed from 1.00 — the tolerance over-lifted the middle).

Three of four pass emphatically — including the *primary* mechanism (the decomposition the prior two
loops could not move). The fourth regressed, and per the AC (*do not promote on a split*) the honest
call is **DO-NOT-PROMOTE (`go=false`)**. `licensing:false` (proxy) makes promotion impossible regardless;
the human gate is untouched and was never on the table this loop ([[pin-guard-is-structural]]).

**This is a publishable, directional result** ([[anti-hedge-falsifiable-commitment]]): E-45 fixed the
mechanism; T-186 made the term read the picture; **T-187 made it read the picture through the voxel
medium** — the decomposition is now PICTURE-DRIVEN and the pack confound is gone, the matched-compression
and gh-wrongpack residuals are both closed. The cost surfaced the *next* seam: the tolerance is
calibrated for faithful-vs-wrong but too generous for faithful-vs-middling, and the gate's hard-middle
rule reads gaps below its own noise floor. **Nothing under `measurements/` is touched; the term stays in
`src/`, unpromoted.**

## 6. Successor scope (the follow-on stub — NOT executed this loop)

Not staged (the result is `go=false`, not GO-LEANING — Step 7 produces the localization, not a PROMOTE
package). The successor (a new E-47 story) should pick ONE of the two localized levers and not both at
once (they trade against each other):
- **(a) Gate-side, lower-risk:** make the hard-middle pairwise rule **noise-aware** — count a pair as
  agreeing/tie when `|scoreA − scoreB| < NOISE`, so sub-noise flips (H1/H4) stop registering as
  disagreements. This is a `style-agreement.mjs` change (the GATE, which this ticket held fixed), tested
  on the existing run without new spend. It does not touch the term.
- **(b) Term-side, higher-risk:** add a faithful-vs-middling gradation to the tolerance so a
  recognizable-but-worse build (gh-mid-gate) does not score like a matched one — but guard against
  re-compressing the matched cell (re-run the decomposition to confirm matchedRight holds ~40).
- Either way: **re-run the SAME gate at VOTES=6** and report matchedRight/matchedWrong AND the
  hard-middle pairs with their margins-vs-noise. A clean PICTURE-DRIVEN + hard-middle ≥ 0.70 licenses
  the human-signed-off freeze.
