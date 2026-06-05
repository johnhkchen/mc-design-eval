# T-037-04 — Structure

The shape of the change. This is a **build/measurement** ticket: it produces *artifacts and
provenance*, not source code. No `src/`, `benchmarks/*.mjs`, `render/`, `baml_src/`, or schema files
are created, modified, or deleted. The "structure" is the set of output files the run emits at
**scale 48** and the work-dir documents that capture the read — plus the invariants those outputs must
satisfy and the cross-scale comparison wiring.

## Files CREATED by the runner (owned by `benchmarks/sculpture/run.mjs`)

Run dir: `benchmarks/sculpture/runs/NNN-vConcept-a-pineapple/` where `NNN` is `nextSeq()` at
invocation (≥ `013`; 012 is the in-flight scale-16 sibling on disk, and concurrent S-037 siblings may
shift it higher — harmless, see Concurrency). **The slug repeats runs 004 and 012** (same subject);
seq + `summary.json.scale = 48` disambiguate.

| File | Producer | Contract |
|------|----------|----------|
| `design-doc.prompt.txt` | stage 1 prompt dump | exact `composeSculptureDesignDocPrompt({subject, scale:48})` text |
| `design-doc.md` | stage 1 (`requestText`) | finalized pineapple doc, **scale-48 budget** baked in |
| `build.prompt.txt` | stage 3 prompt dump | exact `composeSculptureBuildPrompt` text (scale 48) |
| `concept.png` | stage 2 (Nano Banana) | ONE 3/4 concept, pineapple isolated on solid black |
| `artifact.json` | stage 3 (multimodal seam) | **schema-valid** `DesignArtifact`, full 3-D pineapple, bounds ≲48³ |
| `render-3q.png` | `renderArtifact`, `SCULPTURE_VIEW_3Q` | 3/4 hero still, 0 unmapped blocks |
| `turntable/frame.NNN.png` | `renderOrbit`+`oscillateAzimuths` | front-arc rock, default 24 frames |
| `transcript.jsonl` | message accumulator | full claude `-p` message stream (gitignored) |
| `summary.json` | runner | seq, runId, subject, **scale:48**, blocks, bounds, tokens, cost, duration, note |

Also MODIFIED by the runner: `benchmarks/sculpture/README.md` — its `<!-- RUNS:START … END -->` block
regenerates to include the new row/gallery entry. Generated region ("do not edit by hand"); the edit is
expected and not hand-authored. (**Three** `a pineapple` rows will now appear — scales 32, 16, and 48 —
distinguished by the `scale` column.)

Gitignored (per `benchmarks/sculpture/.gitignore`): `runs/*/transcript.jsonl`, `runs/*/turntable/`.

## Files CREATED in the work dir (this ticket's authored evidence)

`docs/active/work/T-037-04/`

| File | Phase | Purpose |
|------|-------|---------|
| `research.md` | Research | codebase + anchor map (done) |
| `design.md` | Design | operational decisions (done) |
| `structure.md` | Structure | this file |
| `plan.md` | Plan | ordered run + verification steps |
| `progress.md` | Implement | live run log: what ran, scale, tokens/cost/bounds, retries, deviations |
| `fidelity-read.md` | Implement | **AC#2/#3 deliverable** — concept↔render, faithfulness, **scale-48-vs-32(-vs-16) subsection**, categorical judgment |
| `review.md` | Review | handoff summary |

## `fidelity-read.md` internal structure (the deliverable's shape)

```
# T-037-04 — Fidelity-vs-concept read: "a pineapple" @ scale 48 (scale study)
## Side by side
  - Concept:   ../../../../benchmarks/sculpture/runs/NNN-…/concept.png
  - 3/4 render: ../../../../benchmarks/sculpture/runs/NNN-…/render-3q.png
  - best/cardinal turntable frame (45° hero shows a corner — cite a near-frontal frame for the pattern)
  - anchors: run 004 (@32) render; run 012 (@16) render if complete
## Faithfulness at scale 48 (one line)
## Where it fell short
## Scale-48 vs scale-32 (run 004), vs scale-16 (run 012)   <-- the AC's cross-scale note
  - blocks/ops @48 vs 3314 blk / 213 ops @32 vs @16; did extra budget CLOSE THE GAP or just add bulk/regress?
  - feature-by-feature: body ovoid / cross-hatch diamond skin / segmentation banding / frond crown — improved/same/worse
  - bounds delta; value drift (orange-on-yellow) over larger surface — better (more rows) or worse (more flat area)?
  - the headline: is there an "organic ceiling" (pattern is a value/hue problem scale can't fix), or a moai-style regression?
## Categorical judgment:  faithful|recognizable|loose|failed  (+ Category enum map)  + one-line rationale
## Run facts (blocks, bounds, ops, cost, SCALE) — from summary.json, self-contained
```

Links are *relative into the run dir* — no image duplication; the run dir stays the single source of
truth, the README its gallery, this file the per-scale read T-038-01 joins on to build the triptych.

## Module boundaries (unchanged, restated for the reviewer)

- **Pure / tested:** `src/sculpture.mjs` — wording + scale wiring (the very `sculptureScaleCaps`/scale
  threading this study exercises). Untouched; its unit tests stay green.
- **Live / metered:** `benchmarks/sculpture/run.mjs` + `baml-concept.mts` — I/O, model seams, render,
  provenance. Untouched; only *invoked* (with `--scale 48`).
- **Seams used (not modified):** `requestText`, `requestDesignArtifactWithImage`
  (`src/sdk-binding.mjs`); `renderArtifact` (`render/src/render-tool.mjs`); `renderOrbit`,
  `oscillateAzimuths` (`render/src/orbit.mjs`); Nano Banana (`src/nano-banana.mjs`); AJV schema gate.

## Ordering that matters

1. Pre-flight (env + test baseline) before any metered call — fail cheap, not after billing.
2. The runner enforces stage order internally (doc → concept → build → render); I do not interleave.
3. `fidelity-read.md` and `progress.md` are written **after** the run dir exists, reading real
   `summary.json` + the actual render — never pre-written from the prediction. The scale-48-vs-32
   numbers are read from both `summary.json` files (this run + run 004), and vs run 012 if its
   `summary.json` exists by then.
4. `review.md` last.

## Explicitly out of scope (no structural change)

- No prompt variants, no budget-exploitation hint for high-res, no run-id scale encoding, no curation
  roll-up (T-038-01 owns the triptych assembly), no schema/enum change for a sculpture `target`.

## Concurrency note

Sibling S-037 tickets (T-037-01/02/03) and any straggling S-036 builds may run on the same branch
concurrently (Lisa's DAG). `nextSeq()` reads the runs dir at invocation, so a concurrent sibling could
claim the seq this ticket expects (~013), pushing this run higher. Harmless — `summary.json.scale` + the
seq are the real keys, not the slug. If the observed seq differs, `progress.md` records the actual seq
and the read links the actual dir. (Same class of seq-race the sword build (007) and moai-statue trio
(003/010/011) documented; the README is shared and regenerated from all `summary.json` under commit
locking.) Notably the scale-16 sibling (run 012) may finish during this ticket — if so its
`summary.json` becomes available and the cross-scale note can cover all three points (16/32/48).
