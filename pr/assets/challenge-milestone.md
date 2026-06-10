# E-25 challenge milestone — the whole chain, one command per subject (T-095-01)

`npm run challenge:cottage` / `challenge:gatehouse` / `challenge:church` each run the complete
concept-faithful pipeline END-TO-END with zero hand edits:

> provision (challenge subjects: GLB + committed material map, untuned) → **shell integrity**
> (T-091: debris strip, void fill, six-direction closure — a THROW gate) → **concept-derived zone
> map** (T-092; registry prior only as recorded fallback) → **full-shell zone-fill** with
> value-true blocks + kit overrides + secondaries + coherence (E-24, terminal coverage/band gates
> as THROWs) → **multi-angle same-object gate** (T-093: 4 frozen azimuths, per-view coverage
> precondition, judged contact sheet).

The contact sheet is the verdict artifact (E-25 Rule 1): `pr/assets/frames/multi-angle-<subj>-challenge.png`.
Before/after vs the witnessed E-23/E-24 state: `pr/assets/frames/challenge-<subj>-{before,after}.png`.

## Results (committed records: `benchmarks/sculpture/challenge/<subj>.{json,md}`)

| | cottage | gatehouse | church (untuned challenge) |
|---|---|---|---|
| provision | committed T-074 base | committed T-074 base | GLB+map @48 → 11,423 cells, 4-block manifest |
| shell (T-091) | 24→1 components, 958 voids filled, **CLOSED** | 23→3 (grounded kept), 820 voids, **CLOSED** | strip+repair OK, **CLOSED** |
| zone map | concept-derived (2 bands + roof) | concept-derived (1 band + roof) | concept-derived |
| skin gates (T-088/T-090) | **PASS** (band0 75% · band1 71% · roof 72%) | **PASS** (band0 74% · roof 63%) | **REFUSED — band0 wall-field 0.33 < 0.5** |
| multi-angle gate (T-093) | **FAIL** — 45° coverage (band1 0.399); 135°/225° drifted (**major form@roof**); 315° **same object** (2 minor) | **FAIL** — 45°/225° different object, 135°/315° drifted (**major form@roof + massing**) | not reached (pipeline-failed upstream) |
| reproducible | double-run byte-equal + `--repro` sha match | same | same through the failing stage |

**No subject passes the milestone yet.** That is the recorded, honest state of the epic (Rule 6) —
the gaps are *named*, per angle and region, and they are consistent: **roof form/massing at the 30°
contract elevation is THE gap** for both developed subjects (the T-093 baseline's finding, surviving
shell repair and full-shell skinning), and the **untuned provision stage** is the church's blocker.

## The church generalization finding (first contact with the pipeline)

The chain is generic end-to-end — the church entered via registry data only (see the grep below) —
and it failed *informatively*: the E-21 feature-assigner gives the corners/base/openings rules ~55%
of the church's lower exposure shell (a square tower + buttresses + many windows = edge- and
opening-rich massing), so after the preserve-respecting fill the concept's cobble wall field tops
out at 0.33 and the T-088 coverage gate refuses to ship the skin. On simpler massings
(cottage/gatehouse) secondaries are a small shell fraction and the same machinery passes. Routing:
the secondary-share problem is E-26's kit/grammar/dressed-openings scope, not a gate defect.

## Generalization check (AC: no church beyond its registry entry)

`grep -rn "church" src/ benchmarks/sculpture/*.mjs scripts/ render/src/` → **zero hits in `src/`,
`scripts/`, `render/`**; benchmark hits are exactly: the `durable-skin.mjs SUBJECTS.church` registry
entry (+ its transcription comment), the `material-map.mjs` registry row, the `resemblance.mjs`
CHALLENGE_SUBJECTS registration record, and two usage-example comments. No subject keys, constants,
branches, or thresholds in pipeline logic.

## Reproducibility (how each step is pinned)

- The provision→shell→skin stretch is a pure function of committed inputs; it executes **twice per
  invocation** and every artifact must be byte-identical (sha256s in the record);
  `challenge:<s> -- --repro` re-proves from a fresh process (verified for cottage + gatehouse).
- LLM-authored **inputs** are one-time committed records consumed read-only: material maps
  (`material-map/<s>.json`; church's generated once via `material:map -- --subject church`) and
  kit overrides (`kit/<s>.json`, T-096).
- The judge is the pinned model (`PHASE1_MODEL_ID`), one sample per view, verdicts committed in
  `multi-angle/<s>-challenge.json`. Verdict variance at the gap-budget edge is a known property of
  the instrument (T-093) — the deterministic artifact is exactly reproducible; the judgement layer
  is recorded, not seeded.

## What this does NOT claim

- Not that any subject "reads as the concept from anywhere" — the sheets show it doesn't, yet.
- Not that the church number (0.33) is a final capability verdict — it is the first untuned
  measurement, and it names the stage to fix (provision secondary-share), not a tuning knob.
- The 45° cottage coverage reject shows the per-view projection census is stricter than the
  global exposure-shell gate — a real per-angle visibility property, recorded, not reconciled.

One fix shipped on the way: the multi-angle gate now censuses the **shipped** palette (T-096 kit
overrides composed at its naming seam) — before that, kit-renamed bands censused as 0 and views
failed on naming rather than coverage.
