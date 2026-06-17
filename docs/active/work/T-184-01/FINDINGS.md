# T-184-01 — FINDINGS

**DO-NOT-PROMOTE. The recalibrated style-distance term tracks the PACK, not the concept IMAGE, across the
population — the T-182-01 single-subject confound generalizes to 3 subjects — and it disagrees with the
labels on the hard middle (1/5) and even on an "easy" pair whose difficulty lived in the picture axis.** The
labels are highly self-consistent (the gate is labelable, NOT ill-posed), so the disagreement is the term being
wrong, not the labels being noisy. This is the falsifiable claim's pre-registered failure branch — the
publishable negative — with the residual named for S-185: **concept-image-conditioning**. Proxy-fallback labels
(licensing=false) — a proxy can REFUTE (and did); the human gate is prepared but not needed to refute. Run:
`experiments/eval-alignment/results/style-agreement.json` @ VOTES=6. `measurements/` untouched.

## 1. The decomposition — PACK-DRIVEN (the deciding evidence, AC #2/#3)

The T-182 C-control generalized to a 2×2 (pack ∈ {matched, foreign} × picture ∈ {right, wrong}) across 3
subjects. `packEffect = matchedRight − foreignRight`; `conceptImageEffect = matchedRight − matchedWrong`.

| cell | n | mean | states |
|---|---|---|---|
| matchedRight (rustic pack, right picture) | 3 | **53** | gh-match 47, ct-match 46, bn-match 66 |
| matchedWrong (rustic pack, WRONG picture) | 4 | **45** | gh-samepack-classical 61, gh-samepack-cottage 56, ct-samepack-gatehouse 27, bn-cross 34 |
| foreignRight (guildhall pack, right picture) | 2 | **8** | gh-wrongpack 16, ct-wrongpack 0 |
| foreignWrong | 0 | — | (not in the corpus; main effects don't need it) |

- **packEffect = 53 − 8 = +45.** **conceptImageEffect = 53 − 45 = +8.** With NOISE=12, `45 > 8 + 12` →
  **PACK-DRIVEN**. Swapping the *pack* moves the score **45**; swapping the *picture* moves it **8**. The term
  follows the material spec, not whether the build looks like its target.
- **The smoking gun — foreignRight floored:** `gh-wrongpack`=16 and `ct-wrongpack`=**0** are builds that DO
  match their own concept image (faithful gatehouse / cottage) — tanked purely by carrying the foreign
  (guildhall) pack. A build that matches its picture scores ~0 if the pack is "wrong." The term is reading the
  pack.
- **Per-subject (the within-subject confirmation):**
  - **gatehouse: conceptImageEffect = −12** (NEGATIVE) — the wrong-picture cell (rustic pack + classical/cottage
    concept, mean 59) scored *higher* than the matched cell (47). The term rated the obviously-wrong pairing
    **better**. packEffect = +31.
  - **cottage: conceptImageEffect = +19, packEffect = +46** — pack dominates ~2.4×.
  - **barn: conceptImageEffect = +32** — the one subject with a real picture effect, but it has no foreign-pack
    cell, so it cannot exonerate the term; pooled and in the two subjects that CAN test pack-vs-picture, the
    pack wins decisively.

This is T-182 review concern #2 ("the separation rides on the pack, not the picture") confirmed at population
scale. The corpus was built to make this separable (decoupled pack/concept inputs); the term failed the
separation.

## 2. Term-vs-label agreement — fails the hard middle AND a picture-axis "easy" pair (AC #2)

Reported **overall, easy, and hard-middle SEPARATELY** (a term that only nails the obvious pairs is not
validated). Labels are the LLM-proxy glance judge ("which build looks like ITS OWN concept?"), VOTES=6.

| bucket | agree | rate |
|---|---|---|
| easy | 2/3 | 0.67 |
| **hard middle** | **1/5** | **0.20** |
| overall | 3/8 | 0.375 |

Rank concordance **τ = −0.14** (C=3, D=4) — the term's pairwise ordering is *slightly anti-correlated* with the
glance, worse than a coin flip.

Per-pair (term pick vs proxy vs the intended single-rater reference):

| pair | bucket | A (score) | B (score) | term | proxy | intended |
|---|---|---|---|---|---|---|
| E1 | easy | gh-match (47) | gh-samepack-classical (61) | **B** | A (6/6) | A |
| E2 | easy | ct-match (46) | ct-samepack-gatehouse (27) | A | A (6/6) | A |
| E3 | easy | bn-match (66) | bn-cross (34) | A | A (6/6) | A |
| H1 | hardMiddle | gh-match (47) | gh-mid-material (43) | A | A (6/6) | A |
| H2 | hardMiddle | gh-mid-material (43) | gh-mid-gate (49) | **B** | A (5/6) | tie |
| H3 | hardMiddle | gh-mid-gate (49) | gh-samepack-classical (61) | **B** | A (6/6) | A |
| H4 | hardMiddle | ct-match (46) | ct-mid-plain (23) | A | tie (3 tie/2 A) | A |
| H5 | hardMiddle | ct-mid-plain (23) | ct-samepack-gatehouse (27) | **B** | A (6/6) | A |

- **E1 is the cleanest indictment.** An "easy" pair — the proxy is **unanimous (6/6) A**: a gatehouse build
  beside a gatehouse concept obviously realizes its target better than the *same build* beside a classical-arch
  concept. The TERM picks **B** (scored the classical pairing 61 > the gatehouse pairing 47). It got an obvious
  pair wrong because the difficulty lived in the *picture* axis it ignores. The term passes E2/E3 only because
  those pairs' difficulty also showed up in the pack/material dimension.
- **Hard middle 1/5.** The three pairs that pit a real-but-incomplete build against a wrong-picture build
  (H3, H5) all go to the term picking the wrong-picture build (it scored the rustic-pack wrong-picture cells
  high). The proxy correctly prefers the right-subject build.

## 3. Inter-label agreement — the gate is LABELABLE, not ill-posed (AC #2)

Proxy-panel self-consistency (the labelability stand-in for one-rater inter-rater): **easy meanFraction 1.0,
hard-middle meanFraction 0.90** → **LABELABLE** (≥ 0.67 floor). The contested middle carries a stable majority
(only H4 splits, 3 tie / 2 A). **This closes the "ill-posed gate" escape**: the pairs ARE labelable; the term
disagrees with a stable, sensible label. The disagreement is the term's, not the corpus's.

## 4. Honest caveats (AC #4)

- **Labels are LLM-proxy, not human (licensing=false).** A proxy can **refute**, not **license** — and a
  refutation is all a DO-NOT-PROMOTE needs. Independently, the **decomposition alone refutes** without any
  labels: a build that matches its picture (gh-wrongpack/ct-wrongpack) scoring 16/0 purely from a foreign pack
  is dispositive. The human instrument (`corpus/labels/instrument/*.png` + `labels-template.json`) is prepared;
  a human run would only matter to *license* a promote, which is not the verdict.
- **Anti-circularity held:** the proxy prompt carries NO pack, NO score, NO DiagnoseBuild — a holistic glance
  judge. Its picks are not the term agreeing with itself; they oppose the term (τ=−0.14).
- **Breadth:** 3 subjects, 2 packs, 12 states, 8 curated pairs. foreignWrong cell is empty (the main effects
  don't need it). barn lacks a foreign-pack cell (its picture effect can't be weighed against a pack effect) —
  but the two subjects that CAN test it (gatehouse, cottage) both come out pack-driven, and the pooled effect
  is unambiguous. A larger corpus would sharpen the magnitude, not the direction.
- **The recalibrated term still earned its E-45 win** (0 wrong-style `replace` tags on every matched build —
  `nWrongStyle=0` across all matched/control states here too). The mechanism fix (T-181/T-182) is real; the
  problem it does NOT solve is the one this ticket isolates: the score's *signal* is pack-material agreement,
  not picture match.

## 5. Recommendation for S-185 — DO-NOT-PROMOTE; localize concept-image-conditioning

`recommendation.go = false`, label **DO-NOT-PROMOTE**. The E-38→E-46 arc lands on the sharp, publishable
negative the anti-hedge directive asked for: **the eval was honestly shown to measure the PACK (the recognized
style spec), not the PICTURE (does the build look like its target), across a population.** Do **not** soften this
into a promotion.

The residual, named precisely for the S-185 follow-on:
- **The term must condition on the rendered-build-vs-concept-IMAGE match, not pack/material agreement.** Today
  `styleFidelityScore` is driven by `itemStyleClass` over per-department present/missing — which the judge
  populates from the **style profile (pack)**, so a faithful build under a foreign pack reads as wrong-style and
  a wrong-picture build under the right pack reads as fine. The fix is to make the diagnosis (and therefore the
  score) **conditioned on the concept image dominating the pack** — e.g. a picture-match gate or term that
  fires when the build's silhouette/form diverges from the concept regardless of material vocabulary.
- **`measurements/` stays untouched.** Promotion was an ADD; the ADD is not licensed. S-185's PROMOTE branch is
  not taken; its DO-NOT-PROMOTE branch (localize the fix + a follow-on stub) is.

This corpus + harness is the reusable gate: re-run `npm run style:agreement` after the concept-image-conditioning
fix to see packEffect and conceptImageEffect change places. That is the bar the fix must clear.
