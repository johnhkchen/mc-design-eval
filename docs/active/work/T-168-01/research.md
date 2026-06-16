# T-168-01 Research — style-distance severity in the scoring core

Descriptive map of what exists and how it connects. No solutions here.

## The ticket in one line

`styleFidelityScore` (`src/workshop/bakeoff-score.mjs`) today is `100 − Σ penalty(severity)`. It counts
**missing-element presence** and has **no term** for an element that is *present but in the wrong style*.
E-40/S-168 adds a **style-distance** term: derive a per-item grammar mismatch from the Critique's
`expected` vs `present`, score present-but-wrong-style as a **capping MAJOR** with a distance contribution,
and fold it in so a clean wrong-style build is capped low regardless of completeness.

## The scoring core — `src/workshop/bakeoff-score.mjs`

Pure arithmetic referee (no GL/IO/Date/random; runs under the `src/**/*.test.mjs` glob). Relevant surface:

- `export const PENALTY = Object.freeze({ major: 20, minor: 8 })` — *the* single source for severity
  penalties; the test (`BO7`) and FINDINGS both cite it. The ticket asks the new constants to follow this
  exact pattern (one source).
- `styleFidelityScore(critique)` (lines 101–105): `items.reduce((s,it) => s + (PENALTY[it.severity] ?? PENALTY.minor), 0)`,
  then `clamp(100 − penalty, 0, 100)`. Reads **only** `it.severity`. Empty critique ⇒ 100.
- `critiqueEvidence(critique)` (lines 112–121): the reported bundle — `{score, nItems, nMajor, departments, missing}`.
  This is what the crater harness writes and FINDINGS quotes.
- `clamp` (line 92) is module-private. `dispatchCorrectness`, `regionToDepartment`, the two
  `worstDepartmentOf*` helpers are the S-166 split-vs-fused machinery — **unrelated** to this ticket
  (different claim); I will not touch them.

THE WHOLE MODULE IS CREATION-LOOP MEASUREMENT, NOT THE FROZEN INSTRUMENT (header lines 17–18). No gate
vocabulary, no scalar judge. The ticket's "frozen instrument untouched" constraint is already the module's
own contract.

## The data the term reads — the Layer A Critique (`baml_src/department.baml`)

The structured per-style diagnosis (Layer A, T-164/165). `CritiqueItem` (lines 31–37):

```
class CritiqueItem {
  department Department                  // ROOF|WALL|OPENING|CHIMNEY|ROOM
  expected string  // "what the concept's style calls for here"
  present  string  // "what the build currently has (empty string if absent)"
  missing  string  // "what is absent vs expected (empty string if nothing missing)"
  severity "minor" | "major"
}
class Critique { items CritiqueItem[] }
```

Two facts that drive the whole design:

1. **Layer A emits an item ONLY for a diverging department** (prompt line ~81: "emit no item for a
   department that already reads correctly"). So *every* item in a critique is, by construction, a
   divergence. The question is never "is this item a defect" but "*which kind* of defect."

2. **The repo already names the kinds.** `department.baml` lines 19–21 and `departments.mjs` lines 24–26
   define the element vocabulary the triple encodes:
   > the expected/present/missing triple is an element vocabulary (**missing→add, present-but-wrong→replace,
   > absent→remove**)

   So the *sanctioned* reading is structural: `present` empty ⇒ **add** (the element is absent — the build
   hasn't built it). `present` non-empty alongside a divergence ⇒ **replace** (the build put a *different*
   thing there). This is the present-but-wrong-style class the ticket wants — and it is read from which
   field is empty, **not** from parsing the free-text content.

`present` is the field today's `styleFidelityScore` ignores entirely. The whole E-40 lever is that the
score is blind to `present`.

## Why this matters — the E-39 outcome (`docs/active/work/T-166-01`, FINDINGS)

The E-39 crater harness (`experiments/eval-alignment/clean-wrong-style.mjs`) scored a clean build against
its matched concept (A) and two wrong-style concepts (B=arc-A classical, B2=chapelle gothic). Verdict
(line 159): **"DID NOT CRATER — per-style `expected` is cosmetic; blindness is in the model's reading."**

Read closely: the scalar `styleFidelityScore` counts `missing` severity, and the model emitted *similar*
`missing` counts for matched and wrong-style — so the scores tied. The per-style `expected` column existed
but **never reached the scalar** because the scalar only reads `severity`. E-40's memory node records the
refined diagnosis: *"blindness is in severity→scalar, not reading."* The fix lives exactly here, in
`styleFidelityScore`: give the scalar a term that reads `present` vs `expected`.

## The validation corpus (T-167-01, the dependency — already landed)

`src/workshop/defect-corpus.mjs` + `experiments/eval-alignment/corpus/defect-corpus.json`. 8 states:
- **4 single** `{worstDepartment ∈ DEPARTMENTS, confidence}` — e.g. `barn-roofless` (ROOF, the roof is
  *absent* → an **add**/incomplete state), `cottage-plain-upper` (WALL, upper storey plain — has plaster,
  missing studs → a **present-but-detail-incomplete** state).
- **4 pair** `{matchedConcept, wrongStyleConcept, moreFaithful:"matched"}` — the clean-build-vs-wrong-style
  cases (`gatehouse-vs-arc`, `gatehouse-vs-chapelle`, `cottage-vs-arc`, `cottage-vs-chapelle`).

The corpus is upstream **DATA** with **no dependency** on `bakeoff-score.mjs` (its header is explicit:
"S-168 joins the two"). T-168 is the scoring core only; the *live* re-run that feeds real critiques through
the corpus is **T-169-01**, not here. So T-168's tests are **synthetic** hand-built `Critique` objects.

## Existing test conventions (`src/workshop/bakeoff-score.test.mjs`)

`node:test` + `node:assert/strict`. Tests are `BO1`..`BO7`. `BO4` pins `styleFidelityScore`'s current
math; `BO5` pins `critiqueEvidence`. **Critically**: `BO4`/`BO5` items carry `severity` (and `missing`)
but **no `present` field** — so any new term keyed on `present` being non-empty must treat an absent
`present` as the *old* behavior, or these tests break. Backward-compatibility is a hard constraint, not a
nicety.

## Consumers of the functions I touch

- `styleFidelityScore` — called only via `critiqueEvidence`. No other caller (grep).
- `critiqueEvidence` — `experiments/eval-alignment/clean-wrong-style.mjs:138` reads
  `.score / .nMajor / .departments / .missing`. Additive fields on the bundle are safe; renaming or
  removing any of those four breaks the harness. T-169 will re-run this harness, so the bundle shape is a
  live contract.
- `PENALTY` — exported, pinned by `BO7`. Adding a sibling constant (not editing `PENALTY`) keeps `BO7` green.

## Constraints surfaced

- **Pure**: no GL/IO/model/Date/random. The classifier reads object fields only.
- **One source for constants** (the `PENALTY` pattern) — the new cap/distance live in one frozen object.
- **No brittle keyword matching** to fake the classifier (AC bullet 3). If distinguishing wrong-style from
  incomplete needs content comparison, that is a typed-grammar-tag gap to **document as scoped E-39 schema
  feedback**, not to hack with string ops.
- **Frozen instrument untouched** — already guaranteed by the module's creation-loop status.
- The falsifiable claim's three failure modes (free-text unclassifiable → typed tag; binary over/under-
  penalizes → graded distance, validated in T-169; matched/wrong-style still tie because Layer A emits
  identical `present` → route back to Layer A) are the design's guard-rails, addressed in design.md.
