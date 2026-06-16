# T-167-01 Research — Assemble and label the defect corpus

Epic **E-40** / Story **S-167**. Descriptive map of what exists for building the labeled corpus that
E-40's style-distance severity term validates against. No solutions here.

## What the corpus is for (the downstream contract)

The corpus is shared infrastructure consumed by two later tickets, so its shape is constrained by how
they read it:

- **S-168 / T-168-01** adds a *style-distance* severity term to `styleFidelityScore`
  (`src/workshop/bakeoff-score.mjs`). It needs labeled states where a *present-but-wrong-style* element
  should cap the score — i.e. the **wrong-style pairs** with a human `moreFaithful` verdict to validate
  against.
- **S-169 / T-169-01** re-runs the crater bake-off and reports corpus agreement. It needs the
  per-state `worstDepartment` ground truth that `dispatchCorrectness(rows)` already compares against
  (its `ground` field; `bakeoff-score.mjs:132`).

So the corpus must carry, per state: a concept path, a render dir, and labels. Single-defect states
carry `{worstDepartment, confidence}`; wrong-style pairs carry `{matchedConcept, wrongStyleConcept,
moreFaithful, confidence}`. One top-level `rater` field (single-rater honesty, no aggregation).

## The scoring core this binds to (`src/workshop/bakeoff-score.mjs`, 158 lines, PURE)

- `DEPARTMENTS` is single-sourced from `src/pack/departments.mjs`:
  `["CHIMNEY","OPENING","ROOF","ROOM","WALL"]` (frozen, derived from the idiom registry). The corpus's
  `worstDepartment` must be a member, or the dispatch metric can't compare it.
- `styleFidelityScore(critique)` = `100 − Σ penalty(severity)`, `PENALTY = {major:20, minor:8}`. It
  counts **missing-element presence only** — there is no term for a present-but-wrong-style element.
  This is precisely the blindness E-40 fixes and the corpus must be able to expose.
- `dispatchCorrectness(rows)` scores a path "correct" when its worst-defect department equals
  `r.ground`. That `ground` is the per-state `worstDepartment` label we are producing.
- The module is PURE (no GL/IO/Date/random/model) and runs under the `src/**/*.test.mjs` glob. A
  corpus *loader* that reads a committed JSON file is a different purity class — see the loader idiom
  below.

## The Layer-A critique schema (`baml_src/department.baml`)

`enum Department { ROOF WALL OPENING CHIMNEY ROOM }` mirrors `DEPARTMENTS` (pinned by
`src/pack/departments.test.mjs`). `CritiqueItem` carries `{department, expected, present, missing,
severity}`. **Proportion/massing is explicitly NOT a department** (the recorded S-163 decision: no
registry idiom resizes a mass; proportion rides the mass `adjust-params` levers, off this contract).
Consequence for the corpus: a state whose *worst* defect is massing/proportion has **no single
department** — it is the off-contract axis, and the falsifiable claim warns it may force multi-label.

## Existing harnesses that already enumerate states (reuse, don't reinvent)

- `experiments/eval-alignment/clean-wrong-style.mjs` — claim-2 referee. Holds a **clean gatehouse build
  FIXED** + a synthetic gatehouse program FIXED, varies (concept, style_profile): A matched rustic
  gatehouse, B classical arc-A + guildhall, B2 gothic chapelle + guildhall, C control. It already wrote
  `results/clean-wrong-style.json` (DID NOT CRATER — the E-39 finding the corpus must let E-40 attack).
  This is the template for the **wrong-style pairs**.
- `experiments/eval-alignment/wrong-style-probe.mjs` (E-38) — held build fixed, varied concept under
  the *scalar* defect-eval; came back flat → identity-blind. Confound: scored a *defective* gatehouse
  against same-style concepts. The corpus's job is to fix that under-powering with **clean** builds.
- `experiments/eval-alignment/defect-eval.mjs` — the defect-dominated scalar; enumerates cottage
  round-1/4/final + barn round-1/final with a `worstDefect.axis` field. Ground truth from the human:
  cottage states FLAT (all D-), barn states FLAT (worse, roofless), cottage > barn.

## Asset inventory (verified on disk this session)

Concepts (all present): `runs/014-…cottage/concept.png`, `runs/015-…gatehouse…/concept.png`,
`runs/017-…tithe-barn…/concept.png`; wrong-style: `temple-facade/concepts/arc-A-flash.png`,
`chapelle-A-flash.png` (plus taj/mausoleum/horyuji variants).

Build renders (4 azimuths `view-±x±z.png` unless noted), **inspected directly**:

| render dir | what I see vs its concept | candidate worst dept | axis |
|---|---|---|---|
| `builds/barn/round-1` | roofless open box, ragged walls | ROOF (missing) | roof presence |
| `builds/barn/round-3`, `…/final` | **visually identical** to round-1 | — | duplicate frames |
| `builds/barn/new-roof` | roof present + reads; walls riddled with holes | WALL | structural integrity |
| `builds/cottage/new-roof` | roof + stone base; plain upper storey, no half-timber relief, no chimney | WALL | surface relief |
| `builds/cottage/round-1` | chaotic / collapsed roof + holes | ambiguous | massing/chaos |
| `builds/cottage/round-3`, `…/final` | near-identical; cream→pink infill is sub-threshold | — | palette (sub-threshold) |
| `builds/gatehouse/new-roof` | clean stone gatehouse, gable roof OK; gaping front gate, no arch/frame | OPENING | opening |
| `builds/gatehouse/baseline` | 1 view only | — | (thin coverage) |

Notes on coverage: barn rounds 1–6/final are **non-unique frames** (confirmed by prior observation +
direct view). `*/autonomy` and `barn--saltcrag/*` have **0 view PNGs** (no renders) — unusable.
`*/final` dirs have only **1 azimuth**.

## The loader idiom in this repo

`ajv` (Ajv2020 strict + addFormats) is the contract gate everywhere: `src/artifact.mjs`,
`src/pack/style-pack.mjs` (memoized validator, non-throwing parse + fail-fast assert, `formatErrors`
reused), `src/recognition/program.mjs`. JSON Schemas live in `schema/*.schema.json`. Loaders that
`readFileSync` a committed file and have a `*.test.mjs` beside them are the norm
(`loadBlockTable`, `loadStylePack`) and run under `npm test` (`test:unit` = `node --test
"src/**/*.test.mjs"`). `npm test` also runs `pretest`→`baml:gen` and two artifact validations.

## Constraints & assumptions surfaced

- **No padding** (AC): excluded candidates must be logged with a reason; duplicate barn frames and the
  chaotic cottage round-1 are the obvious exclusions.
- **Not gated on the roof** (AC): wrong-style pairs must sit on a *clean* build (gatehouse/new-roof has
  a roof; cottage/new-roof has a roof) so the pair tests style distance, not a missing-roof confound.
- **Single rater** is sanctioned; record it as a limitation, not inter-rater agreement.
- **Reading the corpus must need no model spend** — labels are committed data; the loader is pure I/O +
  schema, runnable in `npm test`.
- Open risk for the falsifiable claim: massing/proportion has no department, so a massing-worst state
  can't get a single `worstDepartment` — that axis is represented only as an *excluded/flagged* state,
  which is itself the honest finding ("dispatch metric may need multi-label").
