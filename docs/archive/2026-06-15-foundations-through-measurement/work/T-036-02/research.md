# T-036-02 — Research

Run `vConcept` on **a moai statue** at scale ~32 (E-13 / S-036). This is a **build ticket**:
the pipeline already exists (T-035-01, `phase: done`); the job is to *run it* on this subject,
save the artifacts, and record a fidelity-vs-concept read plus a categorical judgement.

Descriptive only — what exists, where, how it connects. No solutions here.

## What the ticket asks for

Acceptance criteria (verbatim shape):
1. `vConcept --subject "a moai statue" --scale 32` runs end-to-end → **doc + 3/4 concept + 3-D
   `DesignArtifact` + 3/4 render + rock turntable**; artifacts saved.
2. A **fidelity-vs-concept** read recorded (concept vs render + one line).
3. **Judged** (categorical); renders/clips saved.

Form note from the ticket: a moai is an **angular, monolithic** sculpture — *text-JSON's best
case* — so the prediction is a faithful, recognizable build. It is also the **scale-study hero**
(S-037 will rebuild it at 16 and 48). "One build (best-of = B)" — a single shot, no iteration.

## The pipeline (already built — T-035-01)

`vConcept` sculpture mode is a NAMED, VERSIONED archetype: term → freestanding 3-D voxel object.
Three model stages + a render stage, chained in `benchmarks/sculpture/run.mjs`:

1. **Imagined design doc** — `composeSculptureDesignDocPrompt({subject, scale})`
   (`src/sculpture.mjs`) → `requestText` (`src/sdk-binding.mjs`, the `claude -p` shim). Writes
   `design-doc.prompt.txt` + `design-doc.md`. No reference photo.
2. **3/4 concept image** — `benchmarks/sculpture/baml-concept.mts` (run via `npx tsx`): BAML
   `SculptureConceptPrompt` (`baml_src/conceptart.baml`) rendered to TEXT, piped to **Nano Banana**
   (Gemini, `src/nano-banana.mjs`) → one 3/4 concept on solid black. Writes `concept.png`.
3. **3-D build** — `composeSculptureBuildPrompt({subject, scale, designDoc, runId, model})` →
   `requestDesignArtifactWithImage` (multimodal `claude -p`, grounded on `concept.png`). Schema-
   enforced `DesignArtifact`. Writes `build.prompt.txt` + `artifact.json`.
4. **Render** — `renderArtifact` (3/4 hero still `render-3q.png`, view `SCULPTURE_VIEW_3Q` =
   az 45 / el 30 / fov 45) + `renderOrbit` over `oscillateAzimuths` (rock turntable, front
   hemisphere only) → `turntable/frame.NNN.png`. Both from `render/src/{render-tool,orbit}.mjs`.

The runner also writes `transcript.jsonl` + `summary.json` and regenerates the README gallery.

### Pure surface (`src/sculpture.mjs`, unit-tested)
- `VCONCEPT_SCULPTURE` descriptor (`id` = `vconcept-sculpture.v1`, single-sourced from
  `src/config.mjs`).
- Bounds: `SCALE_MIN=8`, `SCALE_MAX=64`, `DEFAULT_SCALE=32`. scale 32 is the default, in range.
- `assertSculptureSpec` (fail-before-billing on bad subject/scale), `sculptureScaleCaps`
  (per-axis caps = scale on every axis), `runIdForSubject` (slug → `NNN-vConcept-<slug>`).
- `sculptureMetadata` / `metadataPinLines` — pins `trial_id`, `prompting_method_id`, `model_id`,
  `seed=17`, `server_state_id`. **`metadata.target` deliberately UNSET** (live schema enum is
  `house|path|landscape`; a sculpture is none → would fail AJV — see memory
  "prompt-vs-live-artifact-schema").
- The two prompt builders (doc + build), both invert every facade assumption (full x/y/z, in the
  round, explicit "NOT a facade/relief/front plane", single-view limitation stated to the model).

### Entry point & flags
`npm run bench:sculpture -- --subject "<term>" --scale <N> [--frames N] [--note "..."]
[--model id] [--effort ...]`. `parseArgs` defaults: scale 32, frames `TURNTABLE.frames` (24),
model `PHASE1_MODEL_ID` (`claude-opus-4-8`). `nextSeq()` reads `runs/` → next run is **002**.

## The reference run that already exists

`benchmarks/sculpture/runs/001-vConcept-moai/` — T-035-01's AC#1 smoke, subject **`moai`**
(not "a moai statue"), scale 32. summary.json: **3414 blocks, 0 unmapped, schema-VALID**, bounds
min `[-6,0,-5]` max `[6,31,7]` (height 31 ≈ scale 32 longest edge), tok 20578/18096, $0.6632,
~8.4 min, concept via gemini-3-pro-image-preview (21s). The design-doc came out
"Monochrome-with-warm-crown" (gray concrete body, andesite/cobblestone shading, red nether brick
pukao). This is a working precedent: the exact same code path on a near-identical subject.

**Difference vs this ticket:** T-036-02 specifies `--subject "a moai statue"` (the article + noun
phrasing), which is a *different* run id (`002-vConcept-a-moai-statue`) and a fresh generation.

## "Judged (categorical)" — what exists

`baml_src/judge.baml` defines `JudgeFacade(brief, render) -> FacadeScore` with a `Category` enum
(**Weak / Competent / Strong / Exceptional**) across dimensions proportion/color/detail/fidelity/
overall. It is **facade-specific** — there is **no `JudgeSculpture`** BAML fn. The facade judge
runner is `benchmarks/temple-facade/judge-runs.mjs` (`npm run bench:judge`); no sculpture
equivalent exists. So "categorical" judgement for a sculpture is currently a **manual/recorded**
read using the same Category vocabulary, not an automated BAML call.

## Fidelity-vs-concept read — what exists

The README "Known limitations" already frames the **fidelity frontier**: angular/faceted subjects
(moai, sword) realize best in text-JSON; thin/linear and smooth-organic forms have the largest
concept→voxel gap, "recorded per run for the E-13 fidelity read." So the fidelity read is the
comparison of **`concept.png` (stage 2) vs `render-3q.png` (stage 4)** plus one line — the format
the ticket names. No structured schema for it yet; it lives in run-dir prose (and feeds T-038-01
curation downstream).

## Environment / runnability (verified)

- `claude` shim present (`/Users/johnchen/.local/bin/claude`), subscription-authed — Stage 1 & 3.
- `GEMINI_API_KEY` present in `.env`; `src/nano-banana.mjs` reads it from `process.env` OR `.env`
  directly (no dotenv needed) — Stage 2.
- `baml_client/` is generated (gitignored) — `SculptureConceptPrompt` importable by the tsx stage.
- `render/src/{render-tool,orbit}.mjs` present; `oscillateAzimuths` + `renderOrbit` exported —
  Stage 4 (headless GL).
- `npx tsx` works (global `tsx` absent, but the runner spawns `npx tsx`).

## Constraints & assumptions

- **Live & metered + non-deterministic.** Two `claude -p` calls + one Gemini image + GL render.
  Cost ~$0.7, ~8 min, by the 001 precedent. Output varies run-to-run (seed pins server state, not
  model sampling).
- **Single-view limitation** is inherent (back/sides imagined) — a documented property, not a bug.
- **`metadata.target` stays unset** by design; the join key is the run id + summary.json.
- **Additive only.** This ticket should add a `runs/002-…/` dir + a fidelity read; it must not
  touch `src/sculpture.mjs`, the BAML fns, or any seam (T-035-01 froze those). README gallery
  regenerates automatically.
- The root `.gitignore` does NOT ignore `benchmarks/sculpture/runs/` (001 was committed), so a new
  run dir is trackable — but heavy frames/transcript may warrant selective commit (see 001's note).
