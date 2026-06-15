# T-095-01 challenge-milestone — Review

The E-25 terminal milestone now exists as a machine-checkable chain: one named command per subject
runs shell-integrity → concept-derived zoning → the E-24 full-shell skin → the multi-angle gate,
reproducibly, with the church entering via registry data only. **The honest headline: no subject
passes the gate yet** — the milestone's value this ticket is that every gap is now *named*, per
subject, stage, angle, and region, by the instrument itself.

## What changed (6 commits)

| Commit | Substance |
|---|---|
| church material map | `material-map.mjs`: generic `--subject` filter (the regeneration guard) + church row + a latent-bug fix (`generatedFrom` was a 2-subject ternary). `material-map/church.{json,raw.json}` generated ONCE and committed — the pin for the only LLM-authored input on the church path. |
| challenge-milestone runner | **NEW** `benchmarks/sculpture/challenge-milestone.mjs` (~470 lines, impure wiring only): data-gated provision (GLB+map+scale via the T-074 pure cores) → T-091 shell cores → exported `buildSkin` (def transform `{build: shellPath, zoneMapRecord: null}`, uniform across subjects) → spawned T-093 gate (frozen contract, `--label challenge`). Double-run byte-equality, `--repro` fresh-process sha re-proof, `--offline` re-assert, pipeline-failed recording (Rule 6). + `challenge:*` npm scripts, gitignore stanza. |
| gate kit-fix | `multi-angle-gate.mjs`: the shipped-palette mapping now composes T-096 kit overrides over the value-true substitution (allowed-guarded) at its single renaming point. Before: kit-renamed bands censused as **0** and every view failed on *naming*. Threshold/azimuths/judge untouched; the pre-substitution baseline still censuses in its own palette. |
| cottage+gatehouse milestones | Committed records/artifacts/frames. Cottage: shell 24→1 comps + 958 voids, CLOSED; skin gates PASS; gate **FAIL** (45° coverage band1 0.399; 135°/225° drifted, major form@roof; **315° same-object, 2 minor** — the first real-subject judged azimuth ever to pass). Gatehouse: 23→3 + 820 voids, CLOSED; skin PASS; gate **FAIL** (2× different-object + 2× drifted; form@roof + massing). |
| church milestone | `durable-skin.mjs SUBJECTS.church` (registry DATA: paths, scale 48, prior transcribed 1:1 from the committed map) + `zone-map.mjs` sweep now DEFERS a throwing subject (generic; explicit `--subject` still throws; existing records regenerate byte-identical). Church run: provision 11,423 cells, shell CLOSED, **skin REFUSED at T-088** — band0 wall-field 0.33 < 0.5; `challenge/church.json` records `pipeline-failed` honestly. |
| docs | `pr/assets/challenge-milestone.md` (E-12 handoff: results table, named gaps, grep, pinning statement, NOT-claims) + the E-25 section in `design-learnings.md`. |

No deletions. Untouched by design: shell-integrity/durable-skin/zone-map committed records,
spray-paint, value-select, resemblance, all E-22/E-24 evidence, all of `src/`.

## Acceptance criteria — status

1. **One named run per subject, end-to-end, no inline edits** — ✅ `challenge:{cottage,gatehouse,church}`;
   every stage is an existing unit-tested pure core or a spawned frozen-contract runner.
2. **All three pass the gate, ≤2 named minor gaps** — ❌ **none passes; all gaps named** (the AC's
   own fallback: recorded results name angle/region/attribute, Rule 6). Cottage 8 gaps/budget 2
   (major form@roof ×2 + one per-view coverage reject); gatehouse 12 (form@roof + massing);
   church never reaches the gate (T-088 refusal at band0 0.33). **The epic's DoD therefore rests
   with the reviewer**: accept the named gaps and route follow-ups (roof form → S-087/S-090
   successors; church provision secondary-share → E-26), or hold E-25 open.
3. **Generalization grep** — ✅ recorded in the handoff: zero hits in `src/`/`scripts/`/`render/`;
   benchmark hits are the three registry entries + two usage comments.
4. **Reproducibility** — ✅ double-run byte-equality per invocation; `--repro` fresh-process sha
   match verified (cottage, gatehouse; church reproduces through its failing stage); pins stated:
   committed material maps/kits consumed read-only; judge = pinned model, single sample, committed
   verdicts (variance at the budget edge is a named instrument property, not seeded away).
5. **Before/after vs E-23/E-24** — ✅ `challenge-<s>-{before,after}.png` (witnessed grey-roof /
   pink-patch artifacts re-rendered at the 225° witness angle) beside the sheets.
6. **design-learnings + handoff + npm test** — ✅ both docs committed; suite 1156/1156 green at
   every commit boundary.

## Test coverage

- **No new unit tests, by repo convention**: the runner is impure wiring over already-tested pure
  cores; verified by its built-in proofs (double-run, `--repro`, `--offline`, terminal THROWs) +
  three live runs. The gate kit-fix is exercised by the live cottage/gatehouse gate runs (coverage
  went 0 → measured on kit-renamed bands) — **no unit test pins `policyInShippedPalette`'s kit
  composition** (it is runner-local); if E-26 builds the kit-aware gate it should promote that seam.
- zone-map's defer path is exercised live (church) but not unit-tested (runner, same convention).

## Open concerns / for human attention

1. **AC2 is the reviewer's call now** (above). The sheets to eyeball:
   `pr/assets/frames/multi-angle-{cottage,gatehouse}-challenge.png`.
2. **The kit-blind-gate class of bug**: T-093's committed `*-current` gate records were produced
   against pre-kit artifacts and are still valid as history, but re-running `gate:multi` against
   today's durable artifacts without this fix would have under-measured. Any future renaming layer
   must be composed at every naming seam (journal lesson).
3. **Cottage 45° coverage reject (band1 0.399)** while the global exposure-shell gate passes at
   0.71: per-view projection census is stricter than the global census. Real per-angle visibility
   property; worth a look at whether the 45° view genuinely under-shows the upper band.
4. **Zone-map divergence under repair** (cottage band1 y7..13 → y7..16) is recorded, not gated —
   deliberate (D5). If the repaired-shell chain becomes canonical, re-pin the zone-map records.
5. **Church `--repro`** exits via the pipeline throw rather than a sha comparison (no committed
   shas exist for a failed chain) — consistent but slightly ugly; tidy if the church chain ever
   completes.
6. **Working-tree noise from sibling sessions** (tickets, `.lisa*`, some frames) was never staged;
   all six commits are path-scoped.
