# T-187-01 — DESIGN (a voxel-vs-art tolerance that forgives the MEDIUM, never the CONTENT)

The seam is the picture-anchored `DiagnoseBuild` prompt + `diagnose.mjs::styleProfileBlock` (the T-186
seam). The arithmetic is right and the standard is the picture; the residual is that the judge grades a
voxel render against painted ART with **no tolerance for the medium gap** (matched compression, §2a of
research) and the foreign vocabulary still leaks as the expected MATERIAL (gh-wrongpack, §2b). Both are
prompt-side; neither is a scoring-core change.

## The crux the design must thread

The dominant risk (named in the AC) is a tolerance that **lifts everything uniformly** — if it forgives
the wrong-picture builds (`matchedWrong`) along with the faithful ones, the spread does not widen and
the term re-couples. The whole design hinges on a distinguisher that separates **blocky-but-faithful**
from **genuinely-wrong**, on a principle (not a tuned constant).

## Diverge-before-converge: HOW to distinguish blocky-faithful from wrong

Four candidate distinguishers, judged against the recorded data and the crux:

- **D1 — Same-thing-ness at block resolution (semantic).** Forgive a divergence when the element
  depicts the SAME thing the concept shows — same form-class, same material *family*, same feature
  presence — differing only in blockiness / stair-stepping / coarser texture. Penalize when it depicts
  a genuinely DIFFERENT thing (different form-class, different material family, an absent design
  element). This is a *principle*, not a threshold. **Decouples by construction:** `matchedWrong` builds
  (e.g. `gh-samepack-classical`: a rustic gatehouse vs a CLASSICAL concept — missing entablature, gold
  cornice, medallion frieze, relief panels) diverge in CONTENT, not medium → not forgiven. The voxel
  gatehouse gate that "doesn't read as the framed gate" but IS the gate, rendered blockily → forgiven.
- **D2 — Sub-resolution detail exemption.** Ornament finer than the block grid can resolve (filigree,
  thin scrollwork, fine moldings, narrow trim) is BELOW the medium's resolution; absence of it is not a
  penalizable divergence. Directly attacks the major-severity `add` pile (§2a-ii). Composes with D1.
- **D3 — Material-from-picture, never-from-vocabulary (the gh-wrongpack prong).** The expected MATERIAL
  is whatever the CONCEPT IMAGE shows — *never* what the vocabulary lists. A build whose material
  matches the picture but differs from the vocabulary is `match`, not `replace`. Kills the §2b leak
  (same build, brown roof, flagged `replace` only because guildhall's vocab lists stone).
- **D4 (REJECTED) — a tuned tolerance budget in the scorer.** e.g. "forgive up to N `replace`
  departments" or "discount the cap by a constant for matched cells." Rejected: it IS the tuned constant
  the AC forbids; it is blind to WHY a divergence exists (it would forgive wrong-picture builds equally,
  re-coupling — the exact crux failure); and it grows/edits `bakeoff-score.mjs` (the frozen-surface
  purity contract). The arithmetic is not the bug — the judge's reading is.

## The decision

**Approach A (CHOSEN): a prose MEDIUM-TOLERANCE clause in `DiagnoseBuild` (D1+D2) + a sharpened
material-anti-leak header in `styleProfileBlock` (D3).** A prompt/serializer change, mirroring T-186.

1. **`DiagnoseBuild` prompt prose (`baml_src/department.baml`)** — append, after the existing
   CONCEPT-CONDITIONAL clause, a VOXEL-MEDIUM clause:
   - The build is **Minecraft blocks at finite resolution**; the concept may be **smooth painted art**.
     Blockiness, stair-stepped curves/diagonals, and the coarser block-texture palette are the MEDIUM,
     not divergence from the concept (D1).
   - Judge whether the element depicts the **same thing** at block resolution (same form-class, same
     material family, same feature). Do **not** tag `replace`, and do **not** raise severity to major,
     merely because an element is blockier or coarser than the smooth concept — that is the medium.
   - Ornament **finer than the block grid can resolve** is below the medium's resolution; do not flag its
     absence as a divergence (D2).
   - **Reserve `replace`/major** for an element that depicts a GENUINELY DIFFERENT thing — a different
     form-class, a different material family, or an element the concept does not show (the decoupling
     guard, stated explicitly so wrong-picture builds are NOT forgiven).

2. **`styleProfileBlock` header (`src/workshop/diagnose.mjs`)** — extend the existing
   "NAMING VOCABULARY … NOT the standard" line with the **material** sharpening (D3): the vocabulary's
   materials are **never the expected material**; a build whose roof/walls/openings match the CONCEPT
   IMAGE but use materials unlike this list is CORRECT (`match`), not `replace`. Body (role→block / idiom
   lists) unchanged, so DG5/DG7 hold; the header gains one clause. This keeps a unit-testable
   distinguisher surface in `src/` (DG9) and single-sources the anti-leak message at the very block that
   leaks.

3. **Scoring core: unchanged.** `itemStyleClass`/`styleFidelityScore` keep counting `replace`/breadth.
   Because the prompt now tags medium-only divergence as `add`/`match` (not `replace`) and exempts
   sub-resolution detail, the SAME arithmetic stops penalizing blockiness. **No `bakeoff-score.mjs` edit.**

### Why this is the right cut

- **It is principled, not tuned.** D1/D3 are *criteria* (medium vs content; picture vs vocabulary), not
  thresholds — satisfying the AC's "not a tuned constant."
- **It decouples by construction.** The clause forgives only the medium and only picture-matching
  materials; wrong-picture builds diverge in CONTENT and so stay penalized. The matched cell rises; the
  wrong cell does not — that is the spread the gate needs, argued mechanically not hoped for.
- **It attacks the exact localized residual.** §2a (matched compression) ← D1+D2; §2b (gh-wrongpack
  leak) ← D3. One coherent prompt change covers both, so ONE metered re-gate tests both.
- **Architecture-preserving & cheap.** No new model call, no schema change, no scoring-core change, no
  new recognition pass. One prompt clause + one header clause + a golden re-pin. Minimal freeze surface.

## gh-wrongpack — term vs fixture (the AC's named third failure mode)

The §2b same-build contrast (rustic→add, guildhall→replace, identical render+concept) shows the cause is
the **vocabulary leaking as the expected material** — a TERM residual, addressed by D3. The thin
synthetic `GATEHOUSE_PROGRAM` (generic on roof material) is the likely *amplifier* (it pins no material,
so the vocab fills the void), but it is a FIXTURE lever with T-182 comparability blast radius. **Decision:
fix the term (D3) this loop; do NOT touch the fixture.** The re-gate adjudicates: if `gh-wrongpack`
rises off the floor → the leak was the cause (term fix confirmed). If it stays floored while
`ct-wrongpack` holds → the synthetic-grounding artifact is named as the residual (a fixture follow-on,
not a term change), exactly as the AC's third clause anticipates.

## Alternatives considered & rejected

- **B — explicit build-vs-image term blended into `styleFidelityScore`** (the `proxyJudge` glance folded
  into the scalar). Rejected (same as T-186 design B): a blend, not a tolerance — the medium-blind half
  still rides along; it grows the scoring core (a model call inside the pure term, breaking the
  `src/**/*.test.mjs` purity contract); and it double-counts the proxy (the gate's own label source),
  weakening the independence of the agreement signal. Kept as the documented fallback IF A under-moves.
- **C — re-render the concept into a voxel proxy and compare voxel-to-voxel.** Rejected: a whole new
  pipeline (concept→3D→voxel→render) per state, enormous cost, and it would import the very voxelization
  errors we are trying to tolerate. The picture is the spec; teach the judge to read it through the
  medium, don't rebuild the spec in the medium.
- **D4 — tuned scorer budget.** Rejected above (re-couples, tuned constant, edits the frozen surface).

## How we know it worked — and how it fails (anti-hedge)

**Re-gate** `style-agreement-run.mjs`, S-183 corpus, VOTES=6. The claim holds iff ALL of:
- **PICTURE-DRIVEN**: `conceptImageEffect > packEffect + NOISE(12)`.
- **the crux split**: `matchedRight` (faithful) rises materially from 21; `matchedWrong` (wrong-picture)
  stays low (≤ ~6) — **report matchedRight AND matchedWrong explicitly** (the AC's crux).
- **hard-middle agreement ≥ 0.70** (was 1.00 — must not regress) ∧ `gh-wrongpack` diagnosed.

**Fails (recorded, not promoted) if:** matchedWrong rises with matchedRight (uniform lift → re-couple —
the dominant risk); OR the +6 gap is irreducible (voxel-vs-art divergence is entangled with
picture-divergence and a tolerance cannot widen the *scale* → localize to the gate/NOISE/corpus-size, not
the term); OR gh-wrongpack stays floored (the synthetic-grounding fixture artifact, named). A still-MIXED
run that HOLDS agreement at 1.00 is a sharp localization (the bar/scale, not the reading), reported at
full strength — not dressed as success. Promotion is human-sign-off-only (proxy ⇒ `licensing:false`);
the loop preps, never freezes.
