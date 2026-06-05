# T-037-01 — Structure

The shape of the change. This is a **build/measurement** ticket: it produces *artifacts and
provenance*, not source code. No `src/`, `benchmarks/*.mjs`, `render/`, `baml_src/`, or schema files
are created, modified, or deleted. The "structure" is the set of output files the run emits at
**scale 16** and the work-dir documents that capture the read — plus the invariants those outputs must
satisfy and the cross-scale comparison wiring.

## Files CREATED by the runner (owned by `benchmarks/sculpture/run.mjs`)

Run dir: `benchmarks/sculpture/runs/NNN-vConcept-a-moai-statue/` where `NNN` is `nextSeq()` at
invocation (currently ~`010`; a concurrent S-037 sibling may shift it — harmless, see Concurrency).
**The slug repeats run 003's** (same subject); seq + `summary.json.scale = 16` disambiguate.

| File | Producer | Contract |
|------|----------|----------|
| `design-doc.prompt.txt` | stage 1 prompt dump | exact `composeSculptureDesignDocPrompt({subject, scale:16})` text |
| `design-doc.md` | stage 1 (`requestText`) | finalized moai doc, **scale-16 budget** baked in |
| `build.prompt.txt` | stage 3 prompt dump | exact `composeSculptureBuildPrompt` text (scale 16) |
| `concept.png` | stage 2 (Nano Banana) | ONE 3/4 concept, moai isolated on solid black |
| `artifact.json` | stage 3 (multimodal seam) | **schema-valid** `DesignArtifact`, full 3-D moai, bounds ≲16³ |
| `render-3q.png` | `renderArtifact`, `SCULPTURE_VIEW_3Q` | 3/4 hero still, 0 unmapped blocks |
| `turntable/frame.NNN.png` | `renderOrbit`+`oscillateAzimuths` | front-arc rock, default 24 frames |
| `transcript.jsonl` | message accumulator | full claude `-p` message stream (gitignored) |
| `summary.json` | runner | seq, runId, subject, **scale:16**, blocks, bounds, tokens, cost, duration, note |

Also MODIFIED by the runner: `benchmarks/sculpture/README.md` — its `<!-- RUNS:START … END -->` block
regenerates to include the new row/gallery entry. Generated region ("do not edit by hand"); the edit
is expected and not hand-authored. (Two `a moai statue` rows will now appear — scales 32 and 16 —
distinguished by the `scale` column.)

Gitignored (per `benchmarks/sculpture/.gitignore`): `runs/*/transcript.jsonl`, `runs/*/turntable/`.

## Files CREATED in the work dir (this ticket's authored evidence)

`docs/active/work/T-037-01/`

| File | Phase | Purpose |
|------|-------|---------|
| `research.md` | Research | codebase + anchor map (done) |
| `design.md` | Design | operational decisions (done) |
| `structure.md` | Structure | this file |
| `plan.md` | Plan | ordered run + verification steps |
| `progress.md` | Implement | live run log: what ran, scale, tokens/cost/bounds, retries, deviations |
| `fidelity-read.md` | Implement | **AC#2/#3 deliverable** — concept↔render, faithfulness, **scale-16-vs-32 subsection**, categorical judgment |
| `review.md` | Review | handoff summary |

## `fidelity-read.md` internal structure (the deliverable's shape)

```
# T-037-01 — Fidelity-vs-concept read: "a moai statue" @ scale 16 (scale study)
## Side by side
  - Concept:   ../../../../benchmarks/sculpture/runs/NNN-…/concept.png
  - 3/4 render: ../../../../benchmarks/sculpture/runs/NNN-…/render-3q.png
  - (optional) best turntable frame if 45° still misrepresents it
## Faithfulness at scale 16 (one line)
## Where it fell short
## Scale-16 vs scale-32 (run 003)   <-- the AC's cross-scale note
  - blocks 16 vs 2402 @32; features survived / merged / dropped; bounds delta
## Categorical judgment:  faithful|recognizable|loose|failed  (+ Category enum map)  + one-line rationale
## Run facts (blocks, bounds, ops, cost, SCALE) — from summary.json, self-contained
```

Links are *relative into the run dir* — no image duplication; the run dir stays the single source of
truth, the README its gallery, this file the per-scale read T-038-01 joins on to build the triptych.

## Module boundaries (unchanged, restated for the reviewer)

- **Pure / tested:** `src/sculpture.mjs` — wording + scale wiring (the very `sculptureScaleCaps`/scale
  threading this study exercises). Untouched; its unit tests stay green.
- **Live / metered:** `benchmarks/sculpture/run.mjs` + `baml-concept.mts` — I/O, model seams, render,
  provenance. Untouched; only *invoked* (with `--scale 16`).
- **Seams used (not modified):** `requestText`, `requestDesignArtifactWithImage`
  (`src/sdk-binding.mjs`); `renderArtifact` (`render/src/render-tool.mjs`); `renderOrbit`,
  `oscillateAzimuths` (`render/src/orbit.mjs`); Nano Banana (`src/nano-banana.mjs`); AJV schema gate.

## Ordering that matters

1. Pre-flight (env + test baseline) before any metered call — fail cheap, not after billing.
2. The runner enforces stage order internally (doc → concept → build → render); I do not interleave.
3. `fidelity-read.md` and `progress.md` are written **after** the run dir exists, reading real
   `summary.json` + the actual render — never pre-written from the prediction. The scale-16-vs-32
   numbers are read from both `summary.json` files (this run + run 003), not estimated.
4. `review.md` last.

## Explicitly out of scope (no structural change)

- No prompt variants, no feature-floor for low-res, no run-id scale encoding, no curation roll-up
  (T-038-01 owns the triptych assembly), no schema/enum change for a sculpture `target`.

## Concurrency note

Sibling S-037 tickets (T-037-02/03/04) and any straggling S-036 builds may run on the same branch
concurrently (Lisa's DAG). `nextSeq()` reads the runs dir at invocation, so a concurrent sibling could
claim the seq this ticket expects (~010), pushing this run higher. Harmless — `summary.json.scale` +
the seq are the real keys, not the slug. If the observed seq differs, `progress.md` records the actual
seq and the read links the actual dir. (Same class of seq-race the sword build (007) and moai-statue
(003) documented; the README is shared and regenerated from all `summary.json` under commit locking.)
