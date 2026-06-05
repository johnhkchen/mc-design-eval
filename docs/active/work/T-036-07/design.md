# T-036-07 — Design

Decide *how* to execute this build and capture its evidence. The pipeline is fixed (T-035-01); the
design choices here are operational — which invocation, which scale, how the fidelity read is
structured, and how the categorical judgment is recorded — all grounded in the Research findings. This
ticket mirrors the established sibling pattern (T-036-01..06); the deviations below are subject-driven,
not pipeline-driven.

## Decision 1 — Reuse the runner verbatim; add no code

**Chosen.** Invoke
`npm run bench:sculpture -- --subject "a mushroom" --scale 32 --note "T-036-07 build"`.

The ticket and T-035-01's review both frame T-036-* as *consumers* of the archetype, not modifiers of
it. The runner already validates before metering, writes the full run dir (`design-doc.md`,
`concept.png`, `artifact.json`, `render-3q.png`, `turntable/`, `transcript.jsonl`, `summary.json`),
regenerates the README gallery, and pins attribution metadata. Anything this ticket needs beyond those
outputs is *evidence about* the run (the fidelity read + judgment), which belongs in the work dir, not
in the pipeline.

**Rejected — patch the runner or prompts for "organic curves" / "mushroom hints".** A subject-specific
tweak (e.g. "make the cap overhang the stem", or "prefer `red_mushroom_block`") would (a) fork the
archetype, contradicting "reuse, don't fork", (b) make this run non-comparable to its seven siblings,
and (c) pre-empt the *measurement* this benchmark exists to take. The mushroom is included precisely as
the **forgiving organic** control point on the fidelity frontier; hand-holding the prompt would erase
the signal of how well the *unmodified* archetype handles an easy organic form. If the cap fails to
overhang, that is a *finding* for the archetype owner (S-035 / curation T-038-01), not a silent edit.

## Decision 2 — Subject string: "a mushroom" (verbatim from the ticket AC)

**Chosen.** Pass the AC's exact phrasing. AC#1 quotes `--subject "a mushroom" --scale 32` literally, so
I honor it so the `trial_id`/slug (`008-vConcept-a-mushroom`) matches the ticket's stated command and
the breadth set reads consistently. Deliberately **not** elaborated to "a red toadstool" or "an Amanita
mushroom" — the generic term is the brief; specializing it would change the measured subject and let me
cherry-pick an easier/harder variant.

**Rejected — disambiguating the species/color.** Tempting (an *Amanita* with white-spotted red cap is
the most iconic, most recognizable mushroom), but the brief says "a mushroom" and the whole pipeline's
job is to let the *model* imagine the subject from the bare term. Forcing a species pre-empts the
concept stage's interpretation, which is part of what's being measured.

## Decision 3 — Scale 32 (the standard), default turntable frames

**Chosen.** `--scale 32`, matching the AC and the S-036 "standard scale ~32" charter. Scale variation
is S-037's job, not this ticket's. Leave `--frames` at the runner default (24) so the turntable matches
the archetype's canonical cadence and is comparable to the dancing-man/heart runs (also 24).

**Rejected — drop scale to test the "easy" claim at low resolution, or bump it for a smoother dome.**
Either would conflate the organic-forgiving control point with a scale study and break breadth
comparability. Hold scale fixed; let the fidelity read *note* whether 32 was enough for a smooth
cap-overhang or whether the dome stair-stepped into a cone.

## Decision 4 — Fidelity-vs-concept read as a dedicated artifact

**Chosen.** Write `docs/active/work/T-036-07/fidelity-read.md` containing: (a) the concept image and
the 3/4 render referenced side by side (relative links into the run dir), (b) one line on faithfulness,
(c) where it fell short — **with explicit attention to the cap-overhang / dome-vs-cone read** (the
"organic blob" loss the ticket's form note implies), and (d) the **categorical judgment**. This
satisfies AC#2 and AC#3 in one reviewable place and gives curation (T-038-01) a stable file to join on
per subject.

Categorical scale (matches the sibling convention so all eight builds share one schema):
**`faithful` | `recognizable` | `loose` | `failed`**. The ticket *predicts* "reasonably faithful", so
the expected bucket is **`recognizable`** (strong) or even **`faithful`** — this is the friendly
organic case. I record what the render actually shows, not the prediction — if the cap overhangs the
stem and the silhouette reads clearly it could reach `faithful`; if the dome collapses to a cone or
lollipop it drops to `recognizable`/`loose`.

**Rejected — fold the read into `progress.md` only.** The read is a deliverable, not just progress;
T-038-01 curation needs to find it deterministically. A dedicated file is the join target.

**Rejected — a numeric 1–10 score.** AC says *categorical*; a rubric-free number would be false
precision over a single subjective render. Categorical + one line of prose is the asked-for shape.

## Decision 5 — Watch for two subject-specific reads explicitly

**Chosen.** In the fidelity read I will specifically check and report:

1. **Cap overhang (the gestalt cue).** Per memory *voxel-onion-dome-and-bay-framing*, a dome that does
   not overhang its base reads as a pyramid/cone. The mushroom's single strongest "it's a mushroom" cue
   is the cap flaring **wider than the stem**. If the render shows a cap that sits flush or narrower
   than the stem, the build reads as a tree/lollipop/nail — I call that out as the primary shortfall.

2. **Block vocabulary (a craft observation).** Note whether the model used literal `*_mushroom_block` /
   `mushroom_stem` blocks or built the cap from terracotta/concrete, and whether the chosen cap block
   renders the bright concept red or a darker maroon (memory *concept-image-not-color-value-preview*).
   This is a craft note, not a pass/fail — both are schema-valid.

**Rejected — pre-judging the palette or the overhang.** I do not assume the model gets the overhang
right or wrong; I inspect the actual render and report what I see. The point is to *look* for these two
things, not to assert them.

## Decision 6 — Evidence lives in the run dir; the work dir holds the read + provenance

`benchmarks/sculpture/runs/008-vConcept-a-mushroom/` is the canonical artifact location (the runner
owns it and the README gallery links it). The work dir's `fidelity-read.md` *references* those files
rather than duplicating images, keeping one source of truth. `progress.md` records the live run log
(token/cost/bounds, any retries) so a reviewer can see what actually happened without re-running.

## Decision 7 — Failure handling for the live run

Stage 3 enforces the AJV schema; a malformed build throws. If a stage fails (schema reject, transient
Gemini/claude error, GL hiccup), re-run the *whole* benchmark (it is idempotent per run dir — a new
`nextSeq()` dir each time; stale partial dirs get noted and can be removed). Do **not** hand-edit
`artifact.json` to force schema validity — that would fabricate a result the pipeline did not produce.
Record any retry and its cause in `progress.md`. Given the mushroom is the *forgiving* case, a hard
failure is unlikely; if it nonetheless fails to read as a mushroom at scale 32 after a fair attempt,
**that is itself the recorded finding** (a surprising negative on the easy control point would be a
strong signal for the archetype owner) — not a reason to tweak the prompt.

## What "done" looks like

- A complete `runs/008-vConcept-a-mushroom/` dir (doc, concept, schema-valid artifact, 3/4 render,
  turntable frames, summary.json), README gallery updated.
- `fidelity-read.md` with concept↔render comparison, one-line faithfulness, shortfall note **including
  the cap-overhang / dome-vs-cone read**, the block-vocabulary craft note, and a categorical judgment.
- `progress.md` (run log) and `review.md` (handoff). No pipeline/source code changed; `npm test` still
  green (it never touched the live path).
