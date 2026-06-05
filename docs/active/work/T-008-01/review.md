# Review — T-008-01: ground-on-sainte-chapelle

Handoff. What a reviewer needs without reading every diff. This is an **experiment ticket**: the
deliverable is a render-grounded verdict + journal entry, not a code change.

## TL;DR

Ran the champion `vRefRevise-designdoc` on `references/St_Chapelle.png` (run **020**). **No source code
changed** — the pre-registered triggers did not fire, so this stayed a clean generalization run. The
headline finding is two-part:

1. **The ticket's premise was wrong about the image.** It assumed Sainte-Chapelle is "already colorful"
   (polychrome glass → reference and brief *agree* on color → P12 should be a no-op). The supplied image
   is the chapel's **grey-limestone EXTERIOR**; the model read it as **pale** and the P12 split **fired**.
   So the inverse/agreement hypothesis is **refuted on its premise — it was never tested**, because the
   image presented *conflict*, not agreement.
2. **P12 held and is load-bearing** (`color = strong`, both rounds) across a *third* pale palette
   (white Taj / dark-timber Hōryū-ji / pale-stone Sainte-Chapelle). The genuine agreement case (a
   colorful reference *image*) remains **untested** and is filed as the open P12 question.

The sharpest secondary result: **the 2nd pass regressed the build** — round-0 `overall=strong (3/3)` →
render `overall=competent` — re-confirming P14's double-edge (round-0 was the better artifact).

## What changed (files)

**Source code:** *none.* `git diff HEAD -- benchmarks/temple-facade/run.mjs` is empty. Tree was already
clean at session start (no S-010-style WT edit to revert, unlike T-007-01); HEAD already is the 015-menu
champion. No trigger fired → no minimal generalizing edit.

**Journal (`docs/knowledge/design-learnings.md`):**
- Appended the **run-020 attempt-log entry** (premise discrepancy, A/B table, P12/P13/detail verdicts,
  the P14 regression, no-edit rationale).
- Added a **scope note to Principle P12**: confirmed load-bearing across three *pale* palettes; the
  no-op-under-a-colorful-reference converse is explicitly marked **untested / open**.

**Work artifacts (`docs/active/work/T-008-01/`):** `research.md`, `design.md`, `structure.md`, `plan.md`,
`progress.md`, `review.md`, and `judge-round0.mjs` (copied helper).

**Run outputs (retained, `benchmarks/temple-facade/runs/020-vRefRevise-designdoc/`):** `reference.png`,
`design-doc.md`, `*.prompt.txt`, `round-0.png`, `render.png`, `artifact.json`, `summary.json`,
`transcript.jsonl`. README gallery regenerated.

## Results (median-of-3, rubric `v2-categorical-baml`)

| dim | round-0 (build) | render (2nd pass) |
|-----|:---------------:|:-----------------:|
| proportion | **strong** | competent |
| color | strong | strong |
| detail | competent | competent |
| fidelity | **strong** | competent |
| **overall** | **strong (3/3)** | **competent** |

4,068 blocks, 0 unmapped, 33,106/66,402 tok, **$2.02**, 929s. round-0 unanimous strong; render
perSample [strong, competent, competent].

## Acceptance criteria

- **AC1 — both rounds scored (P14):** ✅ `render.png` auto-judged by `main()`; `round-0.png` scored via
  the copied `judge-round0.mjs` helper. Both median-of-3.
- **AC2 — journal entry with A/B + explicit P12 verdict (neutral vs additive), scoped; proportion under
  verticality; detail on tracery:** ✅ All present. Verdict: **P12 additive/load-bearing, not neutral**;
  hypothesis refuted on its premise; P12 scoped to pale references with the agreement case marked
  untested. Proportion: one-plane held under verticality, but the 2nd pass regressed it. Detail: S-006
  did not transfer; flat fields persist.
- **AC3 — any prompt diff recorded; `npm test` green; renders + `summary.json` retained:** ✅ No prompt
  diff (no trigger fired; recorded as such). `npm test` 133/133 green before and after. All outputs
  retained under `runs/020-vRefRevise-designdoc/`.

## Test coverage

`npm test` (133) guards artifact/schema validation only; green throughout. There is **no unit test** for
prompt strings or for the experimental verdict — by design, the "test" is the frozen categorical judge on
the render. Single generation (Design E): color (P12) and the one-plane read (P13) are
structural/low-variance and reliable from one render; the single `detail` score carries the P15 noise
caveat. **Gap:** the P14 regression is one generation — a confirmer run would tell whether the 2nd-pass
regression on Gothic references is systematic or a draw (see Open concerns).

## Open concerns / follow-ups (for human attention)

1. **The true inverse hypothesis is still untested.** To actually test "P12 is a no-op under a colorful
   reference," a *genuinely polychrome reference image* is needed — the Sainte-Chapelle **interior**, or
   a saturated-exterior building. Recommend either swapping in an interior shot under a new ticket or
   re-scoping S-008's claim. **Do not** treat run 020 as having tested agreement.
2. **P14's double-edge is now a coin-flip across references** (regressed 013/017/020; held 014/019). The
   standing fix — *judge both rounds and keep the better* — is now strongly indicated, not just noted.
   Candidate next ticket: make `main()` judge round-0 too and select/emit the higher-scoring round (or at
   least flag regressions), so a regressing 2nd pass can't silently become the artifact.
3. **Detail ceiling unmoved.** S-006/S-010 levers did not transfer to Gothic tracery; the failure
   localized to a single large flat gold pediment. P15's "dedicated fenced ornament pass" remains the
   likely path; the generic "NO LARGE FLAT FIELDS" menu clause keeps under-delivering.
4. **Data-integrity note (out of scope, flagged for the chain owner):** the run-019 (Hōryū-ji / T-007-01)
   directory on disk contains only `round-0.png` — no `render.png`/`summary.json`/`artifact.json` — yet
   its journal entry reports median-of-3 scores for *both* rounds. T-007-01 also has no `review.md`. Worth
   verifying that entry's render-side numbers weren't recorded without retained evidence. Untouched here.

## Bottom line

A correctly-scoped result, which is the success condition for a generalization ticket: P12 generalizes
and is load-bearing across pale references (now three); the ticket's specific agreement-case hypothesis
was untestable on the supplied exterior image and is left open and honest; and the run surfaced a clean,
reproducible instance of P14's 2nd-pass regression. No code risk (zero source diff, tests green).
