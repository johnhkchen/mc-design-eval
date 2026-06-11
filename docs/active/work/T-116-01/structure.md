# T-116-01 fourth-subject-milestone — Structure

Zero pipeline-code changes is the AC; the shape of this ticket is **data entries, committed
records, and documents**. No new modules, no changed interfaces, no deletions.

## Modified files (the only executable-file edits — all DATA blocks)

1. `benchmarks/sculpture/durable-skin.mjs` — one new SUBJECTS entry after `church:` (line ~214):
   ```
   barn: {
     key: "barn",
     build: "challenge/barn/base-artifact.json",      // minted by challenge provision (church precedent)
     concept: "runs/017-vBuilding-<slug>/concept.png",
     glb: "glb/barn.glb",
     map: "material-map/barn.json",
     valueSelectRecord: null,
     zoneMapRecord: null,            // → "zone-map/barn.json" after the zone:map step
     kitRecord: "kit/barn.json",
     provision: { scale: 32 },
     policy: { base/upper/roof … },  // transcribed 1:1 from material-map/barn.json roles
     legacy: { base/upper/roof … },  // same source, E-23 counterfactual form
     plasterInvariant: null,
     frontDir: "+z", sideDir: "+x",
     generated: { scale: 32 },
   }
   ```
   The `policy`/`legacy` blocks cannot be written until `material-map/barn.json` exists — ordering
   constraint (see Plan). The entry lands once, then `zoneMapRecord` flips null→path in a later step
   (the only edit to an already-registered field; church precedent T-110).
2. `benchmarks/sculpture/kit-extract.mjs` — one entry in its SUBJECTS DATA array (line ~40):
   `{ key: "barn", concept: <run-017 path>, map: "material-map/barn.json",
      zoneMapRecord: "zone-map/barn.json" }`.
3. `benchmarks/sculpture/material-map.mjs` — one entry in its SUBJECTS DATA array (line ~40):
   `{ key: "barn", runDir: <runs/017-…> }` (matching the existing entries' shape — confirm exact
   fields against the cottage/church entries when editing).
4. `package.json` — two script lines, mirroring existing per-subject pattern:
   `"challenge:barn"`, `"generated:barn"`. (zone:map / kit:extract / multi-angle-gate take
   `--subject` flags; no scripts needed. No `styled:barn` / `reconstructed:barn` — out of scope.)
5. `pr/assets/generate-first.md` — two new columns (barn gen-first, barn untuned-challenge
   comparator) on the existing 15-row table + a fourth-subject paragraph.
6. `docs/knowledge/design-learnings.md` — append the **Generate-first (E-29)** section after E-28
   (line ~2430), E-28's heading/format conventions.

## Created files — committed records (each produced by its standing runner, never hand-authored)

| Path | Producer | Notes |
|---|---|---|
| `benchmarks/sculpture/runs/017-vBuilding-<slug>/design-doc.prompt.txt`, `design-doc.md`, `concept.png` (+ `concept-attempt-N.png` if regenerated) | provision-concept.mjs | immutable once registered |
| `…/runs/017-…/concept-checklist.md` | hand-written sign-off (church format) | S-094 checklist verdicts + glb-smoke single-mass sign-off + GLB sha pin + **the inn-vs-barn decision and reasons** |
| `benchmarks/sculpture/glb/barn.glb` | trellis-glb.mjs | **gitignored binary** (per glb/ convention); sha recorded in checklist |
| `benchmarks/sculpture/material-map/barn.{json,raw.json}` | material-map.mjs | raw reply committed beside processed (E-24 Rule 2) |
| `benchmarks/sculpture/challenge/barn/base-artifact.json` + the chain's shell/record/md siblings | challenge-milestone.mjs | base is the bootstrap dependency; the rest is the comparator |
| `benchmarks/sculpture/multi-angle/barn-challenge.{json,md}` (if the chain reaches the gate) | multi-angle-gate.mjs (spawned) | comparator verdicts, committed as judged |
| `benchmarks/sculpture/zone-map/barn.{json,md}` | zone-map.mjs `--no-render` | must land `source: "concept"` |
| `benchmarks/sculpture/kit/barn.{json,raw.json,md}` | kit-extract.mjs | kit/v1; the E-12 kit report |
| `benchmarks/sculpture/generated/barn.{json,md}` + its artifact/fit-record/component-plan files (same layout as `generated/{cottage,church}…`) | generated-milestone.mjs | THE milestone record |
| `benchmarks/sculpture/multi-angle/barn-generated.{json,md}` | gate (label `generated`) | first-run verdicts |
| `pr/assets/frames/*barn*.png` gate/contact sheets | runners | E-12 handoff |
| `benchmarks/sculpture/component-skin/{cottage,gatehouse,church}.json` | component-skin.mjs (`reskin:*`) | **modified** — re-cut pins (residual 4) |
| `docs/active/work/T-116-01/{research,design,structure,plan,progress,review}.md` | this ticket | RDSPI artifacts |

PNG renders under `generated/`, `challenge/`, `zone-map/<subj>/` stay gitignored per existing
stanzas (verify `.gitignore` covers `challenge/barn/` and `generated/` patterns generically — they
are directory-pattern based; if a stanza is cottage/gatehouse/church-enumerated, extend the DATA
list in `.gitignore`, which is registry-equivalent).

## Module boundaries (unchanged, asserted)

- The registry remains the single composition point for subjects (E-25 Rule 3); the S-113
  vocabulary authority (`composeVocabulary`/`ownSetsOf`) composes role→block-sets from the new
  map/kit exactly as for the other three — the conformance sweep already enforces this; no edits.
- The frozen gate contract is untouched: any run this ticket makes must report
  `instrument.diffs: []` (or church's documented exception class, not expected here).
- `generated-milestone.mjs` self-grep must return `subjectKeysInRunner: []` with the new key
  present in SUBJECTS — verified before registration by grepping the runner source for the key.

## Ordering constraints (binding for Plan)

1. Concept run dir → GLB → glb-smoke **before** any registration (checklist gates regeneration,
   which is forbidden after).
2. `material-map/barn.json` **before** the durable-skin registry entry (policy/legacy transcription
   needs it) — but the material-map.mjs DATA entry must exist before its run (data lists in
   kit-extract.mjs/material-map.mjs don't import durable-skin's registry; they can land first).
3. Registry entry + `challenge:barn` script **before** the challenge run; challenge base **before**
   `zone:map`; `zone-map/barn.json` (concept-derived) **before** `kit:extract`; kit **before**
   `generated:barn`.
4. `reskin:*` re-cuts are independent of the barn track (legacy subjects) — may run any time after
   preflight, but committed as their own step.
5. Journal/epic-sheet edits last (they cite the committed verdicts).

## Test surface

No new unit tests: every changed executable file is changed only in DATA blocks, and the rule
"the suite must never pull GL / the metered render" excludes all live stages. The suite itself
(1514 tests incl. the S-113 conformance sweep) is the regression net and must stay green at every
commit boundary. Live verification is the standing seam convention per runner: checklist + smoke
gates, double-run byte-equality, fresh-process `--repro`, `--offline` re-asserts, instrument-diff,
self-grep — each lands inside the committed records themselves.
