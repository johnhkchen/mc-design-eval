# T-166-01 — Structure

File-level blueprint. The shape of the code, not the code. Ordering where it matters.

## Files created

### `src/workshop/bakeoff-score.mjs` — the pure scoring core (in `npm test`)
PURE: no GL / IO / Date / random / model. The decisions a reviewer must trust live here, single-sourced
from `DEPARTMENTS`. Exports:

- `export const BAKEOFF_SCHEMA = "bakeoff/v1"` — the evidence tag.
- `regionToDepartment(text) → { department, matched }` — lowercase keyword map onto `DEPARTMENTS`:
  - ROOF: `roof | gable | ridge | eave | thatch | dormer | pitch`
  - OPENING: `door | window | arch | opening | gate | lintel | voussoir | jamb`
  - CHIMNEY: `chimney | flue | stack`
  - ROOM: `floor | interior | room | hollow | storey`
  - WALL: `wall | facade | plinth | quoin | corner | masonry | timber | frame | ashlar | pilaster`
  - default `{ department: "WALL", matched: false }` (the lossiness flag — the fused path doesn't type).
  First-keyword-wins is fine here (free text); ambiguity is not an error (unlike `departmentOf`).
- `worstDepartmentOfDispatch(dispatch) → string` — `dispatch[0].department`; throws on empty (a dispatch
  with no items is not a routing — mirrors `resolveDispatch`).
- `worstDepartmentOfFusedReply(reply) → { department, matched, region }` — pick the first `severity:"major"`
  issue (else the first issue), run `regionToDepartment` on its `region`. Throws on no issues.
- `styleFidelityScore(critique) → number` — `clamp(100 − Σ penalty, 0, 100)`, major=20 minor=8. Empty
  critique → 100 (nothing wrong).
- `critiqueEvidence(critique) → { score, nItems, nMajor, departments, missing }` — the reported bundle;
  `missing` = the non-empty `missing` strings (the qualitative crater).
- `dispatchCorrectness(rows) → { split, fused, n, perState }` — aggregate `{ground, splitDept, fusedDept}`
  rows into correctness counts/rates for each path. Pure reducer over the harness's collected results.

Penalty constants exported (`PENALTY = {major:20, minor:8}`) so the test and the FINDINGS cite one source.

### `experiments/eval-alignment/bakeoff.mjs` — Claim 1 live harness (NOT in `npm test`)
Mirrors `route-smoke.mjs`'s seams. Shape:
- `STATES[]` literal: `{ key, concept, renderDir, programPath|programInline, pack, ground, why }`. Real
  programs for barn/cottage/barn--saltcrag; a small inline synthetic program for gatehouse/baseline.
- For each state × `VOTES`:
  - **split:** `diagnoseRenderArgs` → `bamlRender(DiagnoseBuild, images)` → `runTieredOp` → `bamlParse` →
    `routeRenderArgs` → `bamlRender(RouteCritique)` → `runTieredOp` → `bamlParse` → `resolveDispatch` →
    `worstDepartmentOfDispatch`.
  - **fused:** `critiqueRenderArgs` → `bamlRender(CritiqueWorkshopRound, images)` → `runTieredOp` →
    `bamlParse(CritiqueWorkshopRound)` (or `parseWorkshopReply`) → `worstDepartmentOfFusedReply`.
  - Collect a row `{ key, ground, splitDept, fusedDept, fusedMatched }`.
- `dispatchCorrectness` → console summary + write `results/bakeoff.json` (states, rows, totals, verdict
  string). One model call per layer per path, no re-ask (spend caution).
- Guard: every asset path `existsSync` or throw before any spend.

### `experiments/eval-alignment/clean-wrong-style.mjs` — Claim 2 live harness (NOT in `npm test`)
- `BUILD` = the 4 gatehouse/new-roof renders. `PROGRAM` = inline synthetic gatehouse program (frozen,
  shared by all conditions). `CONDITIONS[]`: A(matched, rustic concept, rustic pack), B(wrong, classical
  concept, guildhall pack), C(control, classical concept, rustic pack); plus an optional 2nd wrong-style
  concept (chapelle/mausoleum) to triangulate.
- For each condition × `VOTES=3`: `diagnoseRenderArgs({program, pack})` (style flows from pack since the
  synthetic program carries no `style`) → DiagnoseBuild call → `critiqueEvidence`. Mean score + per-vote.
- Spread A−B, A−C, B−C reported beside the E-38 scalar baseline (read from
  `results/wrong-style-probe.json`).
- **Renders beside both concepts** (AC): `renderBesideConcept` needs an *artifact*; the gatehouse has no
  `final-artifact.json`. Fallback: compose the existing gatehouse render PNG beside each concept PNG with a
  tiny local image-compose (reuse `composeBesideConcept` if it accepts panels, else a minimal sharp/jimp
  compose) → `results/clean-vs-matched.png`, `results/clean-vs-wrongstyle.png`. No model call.
- Write `results/clean-wrong-style.json` (conditions, per-vote scores, evidence bundles, spreads, verdict).

### `docs/active/work/T-166-01/FINDINGS.md` — the honest record (AC3)
Leads with how each claim could fail; states which way each landed, with numbers + the `missing` evidence +
render paths; names the localized next gate for whichever failed (collapse split / deeper epic / clean-
build prerequisite). The anti-hedge artifact.

### `docs/active/work/T-166-01/{research,design,structure,plan,progress,review}.md`
The RDSPI artifacts.

## Files modified

- `package.json` — two scripts: `"bakeoff": "node experiments/eval-alignment/bakeoff.mjs"`,
  `"clean-wrong-style": "node experiments/eval-alignment/clean-wrong-style.mjs"`. Additive; no existing
  script touched.

## Files NOT touched (the wall)

- The frozen scalar instrument, the multi-angle gate, `src/baml/transport-guard*`, `loop.mjs`,
  `baml_src/*`, `diagnose.mjs`, `route.mjs`, `critique.mjs` — **no edits**. The bake-off only *reads*
  these seams. `bamlRender/bamlParse` for `DiagnoseBuild`/`RouteCritique`/`CritiqueWorkshopRound` already
  exist (FNS rows). No new `baml_client` importer → TG3 unchanged.

## Module boundaries / interfaces

- The harnesses depend on `bakeoff-score.mjs` (pure) + the existing render-arg serializers + the BAML
  bridge + `runTieredOp`. `bakeoff-score.mjs` depends only on `DEPARTMENTS` (`src/pack/departments.mjs`).
- The synthetic gatehouse program is a **harness constant**, not a fixture under `benchmarks/` — it exists
  only to fill `programBlock` and is held fixed; it is not a recognition output and is labelled as such.

## Ordering

1. `bakeoff-score.mjs` + its test (pure, gates `npm test` green) — first, nothing else depends on a model.
2. `clean-wrong-style.mjs` (Claim 2 — the headline, fewest calls) + run + evidence.
3. `bakeoff.mjs` (Claim 1) — confirm ground-truth labels by render inspection first + run + evidence.
4. `FINDINGS.md` from the real numbers.
5. `package.json` scripts (can land with step 1).
</content>
