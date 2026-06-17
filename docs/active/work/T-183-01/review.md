# T-183-01 — Review

**Deliverable:** the E-46/S-183 pack/concept-**decoupling** style corpus — a 12-state manifest of
(BUILD, PACK, CONCEPT IMAGE) triples + beside-concept renders, with a validated loader and a replay
builder. The substrate the S-184 agreement+decomposition harness consumes and the S-185 promotion gate
re-runs. Committed `3105b53`.

## What changed (files)

**Created — source/data:**
- `schema/style-corpus.schema.json` — JSON Schema (draft 2020-12) for the manifest; inline
  `cellType`/`intendedFaithfulness` enums, `states` minItems 8, `additionalProperties:false`.
- `src/workshop/style-corpus.mjs` — the loader, mirroring `defect-corpus.mjs` (memoized Ajv2020 strict,
  `parseStyleCorpus` returns a value, `loadStyleCorpus` fails fast, `assertSemantics` enforces enum
  membership + **AC-shape coverage**). Pure data + validation; **no** dependency on `bakeoff-score.mjs`
  (S-184 joins corpus↔scorer). Exports partition helpers (`byCellType`, `cruxCells`, `hardMiddle`,
  `matchedRows`).
- `src/workshop/style-corpus.test.mjs` — SC1–SC6, covered by `npm test`.
- `experiments/eval-alignment/corpus-build.mjs` — the model-free replay builder.
- `experiments/eval-alignment/corpus/style-corpus.json` — the committed 12-state manifest.

**Created — generated output (committed):**
- `builds/gatehouse/faithful-covered-mid/` — the synthesized controlled hard-middle (artifact.json +
  SOURCE.md + 4 `view-*.png` + beside-concept.png).
- `experiments/eval-alignment/corpus/beside/<id>.png` — 12 beside-concept composites (one per state).

**Modified / deleted:** none of the existing source. The referee is untouched. Nothing under
`measurements/`.

## The corpus (what S-184 gets)

12 states, 3 subjects (gatehouse, cottage, barn), 2 packs (rustic matched, guildhall foreign):

| cellType | n | ids |
|---|---|---|
| match | 3 | gh-match, ct-match, bn-match |
| same-pack-wrong-picture | 3 | gh-samepack-classical, gh-samepack-cottage, ct-samepack-gatehouse |
| wrong-pack-right-picture | 2 | gh-wrongpack, ct-wrongpack |
| cross | 1 | bn-cross |
| hard-middle | 3 | gh-mid-material, gh-mid-gate, ct-mid-plain |

All four crux cell types present; ≥2 hard-middle (3); ≥3 subjects — the loader **asserts** this shape at
load, so a future edit cannot silently drop a crux cell. The two same-pack/wrong-picture flavors are
deliberate: `gh-samepack-classical` is the cross-family crux (== referee `C-control`);
`gh-samepack-cottage` is the **within-rustic-family** wrong picture (same pack, same broad style, wrong
form) — the decisive "reads the form, not just the pack materials" cell.

## Acceptance criteria

- **≥8–10 states, ≥3 subjects, all four crux types + ≥2 hard-middle, by replay** — ✅ 12 states / 3
  subjects; `corpus-build.mjs` regenerates deterministically (model-free mutation + GL render).
- **Manifest records per state: build dir, pack, concept, intended faithfulness, cell type** — ✅ plus
  `subject`, `renderDir`, `beside`, `synthesized`, `note`.
- **Each state rendered beside its scored concept; hard-middle inspected + confirmed contestable** — ✅
  12 beside composites; all 3 middles inspected on the render (see "Contestability" below).
- **Recorded honestly: which crux cells constructible / any refused** — ✅ all four constructible, none
  refused; the manifest `notes` explains why (the corpus hands `(pack, concept)` independently —
  the structural-confound risk is a *production-pipeline* property, not a corpus one).
- **`npm test` green; nothing under `measurements/` touched** — ✅ 2295 pass / 0 fail; `git status
  --porcelain measurements/` empty.

## Contestability of the hard middle (the anti-hedge gate)

- `gh-mid-material` (synthesized) — roof timber `dark_oak→spruce` (225 cells). **Refit after a failed
  first attempt:** `stone_bricks→cobblestone` on the walls rendered *invisible* grey-on-grey and would
  have scored ~HIGH (mislabeling a middle). The spruce roof is clearly warmer/lighter than the match's
  dark-oak roof yet both are plausible wood-shingle roofs — a brown-timber gatehouse vs a dark-timber
  concept is genuinely rank-either-way. Reported, not hidden (anti-hedge).
- `gh-mid-gate` (reuse `builds/gatehouse/new-roof`) — verified against the **raw build render** (not the
  stale defect-corpus note): a gaping unframed rectangular gate vs the concept's framed arch. Partial.
- `ct-mid-plain` (reuse `builds/cottage/new-roof`) — verified against the raw render: plainer/rougher
  walls missing the match's half-timber stud grammar. Partial.

## Test coverage

`src/workshop/style-corpus.test.mjs` (in `npm test`): SC1 load + shape (≥8 states, rater + notes); SC2
enum membership; SC3 AC-shape coverage (4 crux types + ≥2 hard-middle + ≥3 subjects); **SC4 asset
existence** — every state's `renderDir`, its 4 `view-*.png`, `pack`, `concept`, and `beside` must exist
(a moved asset fails `npm test` — the reproducibility guard); SC5 parse-returns-value semantics; SC6
coverage rejection (a manifest missing a crux type throws). This is the only automated coverage and is
sufficient: the corpus is **data**; the scoring is S-184's.

## Open concerns / handoff to S-184 / S-185

1. **Labels are single-rater (one rater, render inspection), not human-agreement ground truth.** S-184
   collects the **human** labels on the contestable pairs — that is the gate, not these intended labels.
   The manifest `rater` field states this limitation explicitly.
2. **The corpus can refute but not license.** Because pack still co-varies with concept *in production*
   (the pack is recognition-derived), a clean same-pack/wrong-picture separation here proves the term
   *can* read the picture when handed decoupled inputs — it does not prove the production path does.
   S-185's PROMOTE branch needs the concept-image signal to dominate **and** human agreement; this
   corpus is necessary, not sufficient. Stated in the manifest notes.
3. **`cross` is thin (1 state).** The off-diagonal is minimally populated (the crux/middle cells carry
   the signal); S-184 can add cross cells cheaply (manifest entries over existing builds, no rebuild) if
   the decomposition wants more matrix coverage.
4. **Scoring uses the referee's fixed synthetic `PROGRAM`.** S-184's harness should score these states
   with the same fixed program corpus-referee uses (the manifest carries no per-state program by design)
   — keep that consistent so the population result is comparable to T-182-01's single-subject crater.
5. **Renders are evidence, not a byte-gate.** GL pixels aren't byte-stable across hosts; re-running
   `corpus-build.mjs` re-derives the synth artifact byte-identically but the committed PNGs are the
   reference. SC4 guards their *presence*, not their bytes.

No critical issues. The corpus is complete, validated, replayable, and honestly labeled; S-184 can
proceed to collect labels and run the agreement + pack-vs-concept-image decomposition.
