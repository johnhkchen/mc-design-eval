# T-187-01 — RESEARCH (the voxel-vs-art residual, mapped against the live code + the T-186 data)

Descriptive map. The seam is the SAME one T-186-01 re-anchored (`diagnose.mjs` + the `DiagnoseBuild`
prompt); this ticket reads the *residual* that left the re-gate one noise band short and localizes it
in the live code and the recorded run. No solutions here — those are `design.md`.

## 1. Where the term lives (unchanged chain, recapped)

`experiments/eval-alignment/style-agreement-run.mjs::diagnose()` is the term end-to-end:

```
diagnoseRenderArgs({program, pack, azimuths})     // src/workshop/diagnose.mjs — serialize prompt inputs
  → bamlRender({fn:"DiagnoseBuild", args, images:{concept, renders}})  // baml_src/department.baml — the prompt
  → runTieredOp({tier:"strong"})                  // the LLM judge (claude -p shim)
  → bamlParse → Critique{items:[{department, expected, present, missing, kind, severity}]}
  → styleFidelityScore(critique)                  // src/workshop/bakeoff-score.mjs — 0-100 scalar
```

T-186 made the prompt anchor `expected` on the **concept image** and demoted the pack to a NAMING
VOCABULARY (`diagnose.mjs::styleProfileBlock` header + the `DiagnoseBuild` prose). The scoring
arithmetic (`styleFidelityScore`) was correct and is untouched: `score = 100 − Σpenalty`, where a
`replace`/wrong-style item costs `PENALTY[severity]+distance(12)` AND drives a graded breadth cap
`cap(b)=max(40, 100−12·b)`; an `add`/`remove` item costs only `PENALTY[severity]` (no cap). So the
score is driven by **how many departments the judge tags `replace` (present-but-wrong) and how many
items it tags major**.

## 2. The residual, read from the recorded VOTES=6 run

Source: `experiments/eval-alignment/results/style-agreement.json` (the T-186 run). Two mechanisms keep
the decomposition MIXED (`conceptImageEffect 18` vs `packEffect 12`, +6 inside `NOISE(12)`):

### 2a. Matched-build compression (the dominant cause) — `matchedRight 53→21`

The matched builds (faithful build + own concept + rustic pack) floored at 18/19/25 with high variance
(`gh-match votes [32,40,16,20,0,0]`, `bn-match [0,0,32,0,40,76]`). Reading their recorded `items`:

- The compression is **NOT mostly `replace` misclassification.** Most matched items are correctly
  tagged `add` (missing detail). `gh-match`: WALL `add` (missing dressing), ROOF `add` ("form and field
  material already read like the concept; only edge detailing absent"), OPENING `add` (faint windows) —
  only ONE `replace` (the gate notch). `ct-match`: ALL FIVE items are `add`.
- The floor comes from **two sources at once**: (i) genuine `replace` reads where the voxel medium
  makes a faithful element read as a different thing (`bn-match`: two OPENING `replace` — "ragged voids
  rather than built doors"; `gh-match`: the gate notch "does not read as the concept's framed gate at
  all"); and (ii) a pile of **major-severity `add`** items (each −20) for detail the blocky build can't
  carry at resolution (dressing, trim bands, lattice glazing). Two majors ⇒ −40 ⇒ floor ~20.

So a faithful-but-blocky build is penalized **for being blocky** in two ways — `replace` for
stair-stepped/coarse elements that read as "a different thing," and major `add` for sub-resolution
ornament. The judge is grading a voxel render against painted ART with no tolerance for the medium gap.

### 2b. `gh-wrongpack` floored at 1 — a SHARP residual pack-MATERIAL leak (not voxel-vs-art)

The decisive datum is the **same-build contrast**. `gh-match` and `gh-wrongpack` are the SAME gatehouse
renders against the SAME gatehouse concept; only the **pack** differs (rustic → guildhall):

| state | pack | ROOF item | kind | the judge's "missing" |
|---|---|---|---|---|
| gh-match | rustic | brown gable | **add** (minor) | "form and field material already read like the concept; only edge detailing absent" |
| gh-wrongpack | guildhall | brown gable (identical) | **replace** (major) | "gray stone roof field…; the roof material is **wood, not masonry**" |

Under rustic the brown roof "reads like the concept"; under guildhall the IDENTICAL roof is `replace`
because guildhall's vocabulary lists `roof.field → deepslate_tiles` / a "lead-grey stone hip". The
guildhall **vocabulary is still leaking in as the expected MATERIAL**, overriding the concept image —
exactly the failure T-186 demoted in prose but evidently did not kill for materials. `ct-wrongpack`
(cottage, guildhall) recovered to 16 because its dominant elements (half-timber) are not where guildhall
most contradicts; the gatehouse's wood-vs-stone roof is precisely the contradiction. **This is a
TERM-side residual**, possibly amplified by the thin synthetic GATEHOUSE_PROGRAM (§3).

## 3. The fixtures, programs & blast radius

- **`style-agreement-run.mjs` SUBJECT_PROGRAMS** (`:51`): gatehouse uses a hand-written synthetic
  `GATEHOUSE_PROGRAM` ("thick masonry walls, a steep gabled roof, a single arched gate") — kept VERBATIM
  for T-182 comparability (`gh-match == A-matched`). cottage/barn load REAL recognition programs. The
  gatehouse program is generic on roof MATERIAL (just "gabled roof"), so the program grounding does not
  pin a roof material — leaving the vocabulary to fill the void (the §2b amplifier). Changing it has
  comparability blast radius; it is a FIXTURE lever, named, not a term change.
- **`src/workshop/diagnose.test.mjs`** (DG1–DG8): DG5/DG7 assert `styleProfileBlock` BODY (role→block
  lists, `timber-frame`, `pilaster`…); DG8 asserts the re-framed HEADER ("NAMING VOCABULARY", "NOT the
  standard", "CONCEPT IMAGE is the standard"). A header edit must keep DG8's substrings or update them.
- **`src/baml/fixtures.test.mjs`** FX-DB1: the rendered `DiagnoseBuild` prompt must be byte-identical to
  `src/baml/fixtures/diagnose/prompt.golden.txt`, and matches content regexes (NAMING VOCABULARY / THE
  STANDARD IS THE CONCEPT IMAGE / role→block lines). **Editing the prompt prose OR the styleProfileBlock
  header re-pins the golden** — regenerate from the production serializer (the T-186 throwaway-snippet
  procedure), never hand-edit. FX-DB2 (`reply.txt`→`expected.json`) is unaffected if `Critique` is
  untouched.
- **`src/baml/fixtures/diagnose/inputs.json`** — committed snapshot of `diagnoseRenderArgs(barn, rustic)`;
  regenerate in lockstep with the serializer so snapshot ≠ production never drifts.
- **`baml_client/`** is generated (`npm run baml:gen`, run by `pretest`); editing `department.baml`
  requires regenerating before the bridge renders. It is `.gitignore`d (T-186 progress note).

## 4. The gate that judges the term (UNCHANGED — re-run only)

`src/workshop/style-agreement.mjs` + `style-agreement-run.mjs`:
- **Decomposition** (`packVsConceptDecomposition`): 2×2 over the 9 non-middle states. `DESIGN_CELL`
  buckets pack∈{matched=`*rustic.json`, foreign=guildhall} × picture∈{right=`match`/`wrong-pack-right`,
  wrong=`same-pack-wrong`/`cross`}. `conceptImageEffect = matchedRight − matchedWrong`;
  `packEffect = matchedRight − foreignRight`. Verdict PICTURE-DRIVEN iff
  `conceptImageEffect > packEffect + NOISE(12)`; PACK-DRIVEN iff the reverse; else MIXED.
- **Agreement** (`pairwiseAgreement`): term-pick vs proxy label per pair, bucketed easy/hardMiddle.
- **Recommendation** (`recommendation`): `go=true` only if PICTURE-DRIVEN ∧ hardMiddle≥0.70 ∧ licensing;
  proxy labels ⇒ `licensing:false` ⇒ `go∈{false,null}` — REFUTE or RECOMMEND, never license.

The corpus (`src/workshop/style-corpus.mjs` → `experiments/eval-alignment/corpus/style-corpus.json`) and
the labels/pairs/instrument composites are pre-generated; the re-run needs **no new asset generation**.

**How the residual maps to the cells the fix must move:**
- 2a (matched compression) ⇒ raise `matchedRight` (gh/ct/bn-match) WITHOUT raising `matchedWrong` →
  widens `conceptImageEffect`. The crux risk: a too-broad tolerance also lifts `matchedWrong`
  (wrong-picture builds) → no spread (the ticket's named dominant failure).
- 2b (gh-wrongpack leak) ⇒ raise `foreignRight` (gh-wrongpack off 1) → shrinks `packEffect`.

## 5. Constraints & assumptions

- **Schema frozen.** `CritiqueItem` (`department/expected/present/missing/kind/severity`) stays; the
  scorer keys on it. The fix is in what the prompt tells the judge to FORGIVE, not the typed shape.
- **Scoring arithmetic frozen.** `styleFidelityScore` math is correct (E-45); the standard moved
  (T-186), now the *medium tolerance* moves — neither touches the arithmetic. No `bakeoff-score.mjs` edit.
- **`measurements/` untouched.** Term lives in `src/`; no freeze this loop ([[pin-guard-is-structural]]).
- **Re-gate is metered** (VOTES=6 ⇒ ~120 strong-tier calls, ~50 min — T-186 measured). Asset-guard-
  before-spend; `GUARD_ONLY=1` dry probe; no re-ask on malformed (a zero-token notice burns budget —
  [[spend-limit-reply-failure-mode]]). Proxy labels ⇒ the re-gate can REFUTE or RECOMMEND, never freeze.
- **Same instrument, same corpus.** Only the term changes; the gate/NOISE/corpus are held fixed so the
  T-186→T-187 delta is attributable to the tolerance alone.
