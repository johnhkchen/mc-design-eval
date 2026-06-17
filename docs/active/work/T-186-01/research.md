# T-186-01 — RESEARCH (the concept-image-conditioning seam, mapped)

Descriptive map of the code the term lives in, the gate that judges it, and the fixtures that pin
it. No solutions here — those are `design.md`. The defect is already localized (T-185-01
`LOCALIZATION.md`); this confirms the seam against the live code and enumerates the blast radius.

## 1. What the term IS (the chain from corpus state → 0-100 score)

`experiments/eval-alignment/style-agreement-run.mjs::diagnose()` is the term, end to end:

```
diagnoseRenderArgs({program, pack, azimuths})        // src/workshop/diagnose.mjs  — serialize prompt inputs
  → bamlRender({fn:"DiagnoseBuild", args, images:{concept, renders}})   // baml_src/department.baml — the prompt
  → runTieredOp({tier:"strong", prompt, images})     // the LLM judge (claude -p shim)
  → bamlParse → Critique{items:[{department, expected, present, missing, kind, severity}]}
  → styleFidelityScore(critique)                      // src/workshop/bakeoff-score.mjs — 0-100 scalar
```

The scalar is `100 − Σpenalty`, capped by `gradedCapFor(breadth)` where breadth = # distinct departments
carrying a **wrong-style** item (`itemStyleClass` returns `"wrong-style"` when `kind==="replace"` or, by
structural fallback, `present`≠∅ ∧ `missing`≠∅). So the score is **driven by how many departments the
judge flags as present-but-WRONG**. The whole question of E-47 is: **wrong vs WHAT?**

## 2. The seam — where "expected" is defined (the defect, confirmed in code)

`diagnose.mjs::diagnoseRenderArgs` (`:91`) builds the DiagnoseBuild inputs. Two are pack-derived and
form the **"expected" standard** the judge grades against:

- `style: program?.style ?? pack.style` (`:96`) — the style LABEL, pack-derived.
- `style_profile: styleProfileBlock({ pack })` (`:102`) — emits *"THE STYLE'S CONSTRUCTION GRAMMAR
  (what a `${pack.style}` build's roof / walls / openings **should read as**…)"* — **the entire
  expected-grammar half comes from the pack.** Roof/wall/opening MATERIALS from `pack.palette` roles,
  idioms bucketed by `departmentOf`.
- `palette_block: paletteBlock({ pack })` (`:101`) — *"THE STYLE'S MATERIAL VOCABULARY (what the
  concept's blocks **should be**)"* — also pack-derived.

The BAML prompt (`baml_src/department.baml::DiagnoseBuild`, `:63`) then instructs: *"Judge it against
**THIS STYLE'S grammar above** — the SAME build is correct under one style and wrong under another."*
The concept **image** is passed (`concept: image`, rendered after `ctx.output_format`) but the prose
makes it ancillary grounding; the standard of correctness the judge fills `expected/present/missing`
against is the **pack grammar**, not the picture.

**Consequence (T-185-01 FINDINGS, VOTES=6, S-183 corpus):** `packEffect 45 ≫ conceptImageEffect 8`
→ PACK-DRIVEN. `ct-wrongpack` (faithful cottage, guildhall pack) scores a flat **0**;
`gh-samepack-classical` (rustic pack, WRONG picture) **outranks** the faithful gatehouse (61 vs 47).

`programBlock({program})` (`:33`) is also recognition-derived but carries **form** (masses, footprint,
reading summary) — legitimately the build's intended shape, not the style grammar. It is **not** the
defect; the style/grammar/palette blocks are.

## 3. The gate that judges the term (unchanged — re-run only)

`experiments/eval-alignment/style-agreement-run.mjs` (206 lines) + pure core
`src/workshop/style-agreement.mjs`:

- **Decomposition** (`packVsConceptDecomposition`): buckets the 9 non-middle states into a 2×2
  (`DESIGN_CELL`): pack ∈ {matched=`*rustic.json`, foreign} × picture ∈ {right=`match`/
  `wrong-pack-right-picture`, wrong=`same-pack-wrong-picture`/`cross`}. Reports
  `conceptImageEffect = matchedRight − matchedWrong`, `packEffect = matchedRight − foreignRight`,
  verdict PACK-DRIVEN / PICTURE-DRIVEN / MIXED at `NOISE=12`.
- **Agreement** (`pairwiseAgreement`): term-pick vs label per pair, bucketed easy / hardMiddle.
- **Recommendation** (`recommendation`): `go=false` if PACK-DRIVEN/ill-posed/only-easy; `go=true` only
  if PICTURE-DRIVEN ∧ hardMiddle≥0.70 ∧ `licensing`; `go=null` (recommend-only) when proxy labels.

**The corpus (the crux cells the fix must move):**

| state | subject | cellType | pack | concept | decomp cell |
|---|---|---|---|---|---|
| gh/ct/bn-match | all | match | rustic | own | matchedRight |
| gh-samepack-classical | gatehouse | same-pack-wrong-picture | rustic | arc-A-flash (classical) | matchedWrong |
| gh-samepack-cottage, ct-samepack-gatehouse | — | same-pack-wrong-picture | rustic | swapped | matchedWrong |
| bn-cross | barn | cross | rustic | swapped | matchedWrong |
| **gh-wrongpack, ct-wrongpack** | — | wrong-pack-right-picture | **guildhall** | own | **foreignRight** |
| gh-mid-*, ct-mid-plain | — | hard-middle | rustic | own | (excluded) |

The build (renderDir) is held per subject; **pack and concept are the varied factors** — so
picture-anchoring should: drop `matchedWrong` (right pack but the build doesn't match the swapped
concept) → raise conceptImageEffect; raise `foreignRight` (`*-wrongpack`: foreign pack but the build
DOES match its own concept) → shrink packEffect. Both crux movements come from the SAME re-anchoring.

## 4. Fixtures & tests — the blast radius of a prompt/seam edit

- **`src/workshop/diagnose.test.mjs`** (DG1–DG7): assert `diagnoseRenderArgs` content. DG5/DG7 assert
  `styleProfileBlock` BODY (`spruce_planks`, `roof.hip`, `timber-frame`, `pilaster`…) and that two
  packs differ — they do **not** assert the header line, so a header re-frame is safe; their *intent*
  (pack = within-family gradient as the EXPECTED) shifts and needs comment/assertion updates.
- **`src/baml/fixtures.test.mjs`** FX-DB1: `bamlRender(DiagnoseBuild, inputs.json)` must be
  byte-identical to `src/baml/fixtures/diagnose/prompt.golden.txt`. **Editing the prompt prose
  (department.baml) and/or the `style_profile`/`palette` headers re-pins this golden** — regenerate
  from the production serializer, never hand-edit. FX-DB2 (`reply.txt`→`expected.json`) is unaffected
  if the `Critique` schema is untouched.
- **`baml_client/`** is generated (`npm run baml:gen` = `baml-cli generate --from baml_src`, run by
  `pretest`). Editing `department.baml` requires regenerating the client before the bridge renders.
- `src/baml/fixtures/diagnose/inputs.json` is a committed snapshot of `diagnoseRenderArgs` over the
  barn program + rustic pack; its `style_profile`/`palette_block` fields must be regenerated in lockstep
  with the serializer so the snapshot ≠ production drift does not creep in.

## 5. Constraints & assumptions

- **Schema frozen.** `CritiqueItem` (`department/expected/present/missing/kind/severity`) stays — the
  scoring core keys on it. Changing the schema would re-pin every diagnose fixture and the contract
  test; the fix is in *what the prompt anchors expected on*, not the typed shape.
- **`measurements/` untouched.** The term lives in `src/`, unpromoted. No freeze this loop.
- **Re-gate is metered** (live `strong`-tier spend, VOTES=6 ⇒ ~120 model calls). Asset-guard-before-
  spend; `GUARD_ONLY=1` is the dry probe. Proxy labels ⇒ `licensing:false` ⇒ `go∈{false,null}` — the
  re-gate can REFUTE or RECOMMEND, never autonomously freeze ([[pin-guard-is-structural]]).
- **`styleFidelityScore` math is correct and stays** (E-45 recalibration). The bug is upstream: the
  judge is told the wrong standard. We change the standard, not the arithmetic.
