# T-036-03 — Structure

The shape of the change. This is a **build/measurement** ticket: it produces *artifacts and
provenance*, not source code. No `src/`, `benchmarks/*.mjs`/`*.mts`, `render/`, `baml_src/`, schema,
or config files are created, modified, or deleted. The "structure" is the set of output files the run
emits and the work-dir documents that capture the read — plus the invariants those outputs must
satisfy.

## Files CREATED by the runner (owned by `benchmarks/sculpture/run.mjs`)

Run dir: `benchmarks/sculpture/runs/004-vConcept-a-pineapple/` (seq `004` follows moai `001`,
dancing-man `002`, moai-statue `003`; slug from `runIdForSubject`).

| File | Producer | Contract |
|------|----------|----------|
| `design-doc.prompt.txt` | stage 1 prompt dump | the exact `composeSculptureDesignDocPrompt` text |
| `design-doc.md` | stage 1 (`requestText`) | finalized object design doc, no photo, ≤~350 words |
| `build.prompt.txt` | stage 3 prompt dump | the exact `composeSculptureBuildPrompt` text |
| `concept.png` | stage 2 (Nano Banana) | ONE 3/4 concept, pineapple isolated on solid black |
| `artifact.json` | stage 3 (multimodal seam) | **schema-valid** `DesignArtifact`, full 3-D object |
| `render-3q.png` | `renderArtifact`, `SCULPTURE_VIEW_3Q` | 3/4 hero still, 0 unmapped blocks |
| `turntable/frame.NNN.png` | `renderOrbit`+`oscillateAzimuths` | front-arc rock, default 24 frames |
| `transcript.jsonl` | message accumulator | full claude `-p` message stream (gitignored) |
| `summary.json` | runner | seq, runId, subject, scale, blocks, bounds, tokens, cost, duration, note |

Also MODIFIED by the runner: `benchmarks/sculpture/README.md` — its `<!-- RUNS:START … END -->`
block regenerates to include row/gallery `004`. A generated region (stamped "do not edit by hand");
the edit is expected, not hand-authored.

Per `benchmarks/sculpture/.gitignore`: `runs/*/transcript.jsonl` and `runs/*/turntable/` are ignored
(bulky); the committed per-run provenance is the doc/concept/artifact/render-3q/summary, matching the
T-036-01 commit.

## Files CREATED in the work dir (this ticket's authored evidence)

`docs/active/work/T-036-03/`

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
# T-036-03 — Fidelity-vs-concept read: "a pineapple" (scale 32)
## Side by side
  - Concept:   ../../../../benchmarks/sculpture/runs/004-…/concept.png
  - 3/4 render: ../../../../benchmarks/sculpture/runs/004-…/render-3q.png
  - (optional best turntable frame, if it reads better than the fixed 45° still)
## Faithfulness (one line)
## Where it fell short          ← focus on the two named stressors: cross-hatch skin + spiky crown
## Categorical judgment:  faithful | recognizable | loose | failed   (+ one-line rationale)
## Run facts (blocks, bounds, ops, cost) — copied from summary.json for a self-contained record
## Note for the scale study (S-037) + curation (T-038-01)
```

Links are *relative into the run dir* — no image duplication; the run dir stays the single source of
truth, the README its gallery, this file the per-subject read that S-037 and T-038-01 join on.

## Module boundaries (unchanged, restated for the reviewer)

- **Pure / tested:** `src/sculpture.mjs` — wording + scale wiring. Untouched; its 10 tests stay green.
- **Live / metered:** `benchmarks/sculpture/run.mjs` + `baml-concept.mts` — I/O, model seams, render,
  provenance. Untouched; only *invoked*.
- **Seams used (not modified):** `requestText`, `requestDesignArtifactWithImage`
  (`src/sdk-binding.mjs`); `renderArtifact` (`render/src/render-tool.mjs`); `renderOrbit`,
  `oscillateAzimuths` (`render/src/orbit.mjs`); Nano Banana (`src/nano-banana.mjs`); AJV schema gate.

## Ordering that matters

1. Pre-flight (env + test baseline) before any metered call — fail cheap, not after billing. (Done:
   312 pass, keys/shim/GL present.)
2. The runner enforces stage order internally (doc → concept → build → render); I do not interleave.
3. `fidelity-read.md` and `progress.md` are written **after** the run dir exists, reading the real
   `summary.json` + the actual render — never pre-written from the prediction.
4. `review.md` last.

## Explicitly out of scope (no structural change)

- No new prompt variants, no cross-hatch/crown-specific tuning, no scale sweep (that is S-037), no
  curation roll-up (T-038-01), no turntable→mp4 encode, no schema/enum change to admit a sculpture
  `target` (deliberately omitted — see Research).
