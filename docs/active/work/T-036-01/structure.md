# T-036-01 — Structure

The shape of the change. This is a **build/measurement** ticket: it produces *artifacts and
provenance*, not source code. No `src/`, `benchmarks/`, `render/`, `baml_src/`, or schema files are
created, modified, or deleted. The "structure" is therefore the set of output files the run emits and
the work-dir documents that capture the read — plus the exact invariants those outputs must satisfy.

## Files CREATED by the runner (owned by `benchmarks/sculpture/run.mjs`)

Run dir: `benchmarks/sculpture/runs/002-vConcept-a-dancing-man/` (seq `002` follows moai's `001`;
slug from `runIdForSubject`).

| File | Producer | Contract |
|------|----------|----------|
| `design-doc.prompt.txt` | stage 1 prompt dump | the exact `composeSculptureDesignDocPrompt` text |
| `design-doc.md` | stage 1 (`requestText`) | finalized object design doc, no photo, ≤~350 words |
| `build.prompt.txt` | stage 3 prompt dump | the exact `composeSculptureBuildPrompt` text |
| `concept.png` | stage 2 (Nano Banana) | ONE 3/4 concept, object isolated on solid black |
| `artifact.json` | stage 3 (multimodal seam) | **schema-valid** `DesignArtifact`, full 3-D object |
| `render-3q.png` | `renderArtifact`, `SCULPTURE_VIEW_3Q` | 3/4 hero still, 0 unmapped blocks |
| `turntable/frame.NNN.png` | `renderOrbit`+`oscillateAzimuths` | front-arc rock, default 24 frames |
| `transcript.jsonl` | message accumulator | full claude `-p` message stream |
| `summary.json` | runner | seq, runId, subject, scale, blocks, bounds, tokens, cost, duration, note |

Also MODIFIED by the runner: `benchmarks/sculpture/README.md` — its `<!-- RUNS:START … END -->`
block regenerates to include row/gallery `002`. This is a generated region (the runner stamps
"do not edit by hand"); the edit is expected and not hand-authored.

## Files CREATED in the work dir (this ticket's authored evidence)

`docs/active/work/T-036-01/`

| File | Phase | Purpose |
|------|-------|---------|
| `research.md` | Research | codebase map (done) |
| `design.md` | Design | operational decisions (done) |
| `structure.md` | Structure | this file |
| `plan.md` | Plan | ordered run + verification steps |
| `progress.md` | Implement | live run log: what ran, tokens/cost/bounds, retries, deviations |
| `fidelity-read.md` | Implement | **AC#2/#3 deliverable** — concept↔render, faithfulness line, shortfall, categorical judgment |
| `review.md` | Review | handoff summary |

## `fidelity-read.md` internal structure (the deliverable's shape)

```
# T-036-01 — Fidelity-vs-concept read: "a dancing man" (scale 32)
## Side by side
  - Concept:  ../../../benchmarks/sculpture/runs/002-…/concept.png
  - 3/4 render: ../../../benchmarks/sculpture/runs/002-…/render-3q.png
## Faithfulness (one line)
## Where it fell short
## Categorical judgment:  faithful | recognizable | loose | failed   (+ one-line rationale)
## Run facts (blocks, bounds, ops, cost) — copied from summary.json for a self-contained record
```

Links are *relative into the run dir* — no image duplication; the run dir stays the single source of
truth, the README its gallery, this file the per-subject read curation (T-038-01) joins on.

## Module boundaries (unchanged, restated for the reviewer)

- **Pure / tested:** `src/sculpture.mjs` — wording + scale wiring. Untouched. Its tests stay green.
- **Live / metered:** `benchmarks/sculpture/run.mjs` + `baml-concept.mts` — I/O, model seams, render,
  provenance. Untouched; only *invoked*.
- **Seams used (not modified):** `requestText`, `requestDesignArtifactWithImage`
  (`src/sdk-binding.mjs`); `renderArtifact` (`render/src/render-tool.mjs`); `renderOrbit`,
  `oscillateAzimuths` (`render/src/orbit.mjs`); Nano Banana (`src/nano-banana.mjs`); AJV schema gate.

## Ordering that matters

1. Pre-flight (env + test baseline) before any metered call — fail cheap, not after billing.
2. The runner enforces stage order internally (doc → concept → build → render); I do not interleave.
3. `fidelity-read.md` and `progress.md` are written **after** the run dir exists, reading real
   `summary.json` + the actual render — never pre-written from the prediction.
4. `review.md` last.

## Explicitly out of scope (no structural change)

- No new prompt variants, no scale sweep (S-037), no curation roll-up (T-038-01), no turntable→mp4
  encode (the runner emits frames; a clip is a separate concern), no schema/enum change to admit a
  sculpture `target` (deliberately omitted — see Research).
