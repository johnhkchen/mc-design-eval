# T-036-05 — Design

Decide *how* to execute this build and capture its evidence. The pipeline is fixed (T-035-01); the
design choices here are operational — which invocation, which scale, how the fidelity read is
structured, and how the categorical judgment is recorded — all grounded in the Research findings. This
ticket mirrors the established sibling pattern (T-036-01..04); the deviations below are subject-driven,
not pipeline-driven.

## Decision 1 — Reuse the runner verbatim; add no code

**Chosen.** Invoke
`npm run bench:sculpture -- --subject "an anatomically correct human heart" --scale 32 --note "T-036-05 build"`.

The ticket and T-035-01's review both frame T-036-* as *consumers* of the archetype, not modifiers of
it. The runner already validates before metering, writes the full run dir (`design-doc.md`,
`concept.png`, `artifact.json`, `render-3q.png`, `turntable/`, `transcript.jsonl`, `summary.json`),
regenerates the README gallery, and pins attribution metadata. Anything this ticket needs beyond those
outputs is *evidence about* the run (the fidelity read + judgment), which belongs in the work dir, not
in the pipeline.

**Rejected — patch the runner or prompts for "organic curves".** A subject-specific tweak (e.g. a
"prefer rounded silhouettes / step the radius per layer" hint) would (a) fork the archetype,
contradicting "reuse, don't fork", (b) make this run non-comparable to its seven siblings, and (c)
pre-empt the *measurement* this benchmark exists to take. The whole point of including a hard
organic-curve subject is to **measure** where the text-JSON archetype breaks; smoothing the prompt to
flatter the heart would erase the very signal S-036 is collecting. If organic forms prove
systematically deficient, that is a *finding* for the archetype owner (S-035 / curation T-038-01), not
a silent edit here.

## Decision 2 — Subject string: "an anatomically correct human heart" (verbatim from the ticket AC)

**Chosen.** Pass the AC's exact phrasing. AC#1 quotes
`--subject "an anatomically correct human heart" --scale 32` literally, so I honor it so the
`trial_id`/slug (`006-vConcept-an-anatomically-correct-human-heart`) matches the ticket's stated
command and the breadth set reads consistently.

**Rejected — the Context line's shorter "an anatomically-correct heart".** The Context paragraph and
the AC differ slightly in wording; the AC's `--subject` value is the operative command, so I use it
verbatim. (The hyphenation "anatomically-correct" in Context is prose, not a CLI arg.)

## Decision 3 — Scale 32 (the standard), default turntable frames

**Chosen.** `--scale 32`, matching the AC and the S-036 "standard scale ~32" charter. Scale variation
is S-037's job (the moai is the scale-study hero at 16/48), not this ticket's. Leave `--frames` at the
runner default (24) so the turntable matches the archetype's canonical cadence and is comparable to
the dancing-man run (also 24).

**Rejected — bump scale to give the chambers/vessels more blocks.** A heart *might* read better with
more blocks for the great vessels, but changing scale here would conflate the organic-curve stress
test with a scale study and break breadth comparability. Hold scale fixed; let the fidelity read
*note* if 32 starved the vessels or merged the lobes.

## Decision 4 — Fidelity-vs-concept read as a dedicated artifact

**Chosen.** Write `docs/active/work/T-036-05/fidelity-read.md` containing: (a) the concept image and
the 3/4 render referenced side by side (relative links into the run dir), (b) one line on
faithfulness, (c) where it fell short — **with explicit attention to the organic-curve loss** the
ticket asks for (AC#2: "one line on the organic-curve loss"), and (d) the **categorical judgment**.
This satisfies AC#2 and AC#3 in one reviewable place and gives curation (T-038-01) a stable file to
join on per subject.

Categorical scale (matches the sibling convention so all eight builds share one schema):
**`faithful` | `recognizable` | `loose` | `failed`**. The ticket *predicts* "large gap expected", so
the expected bucket is **`loose`** (or `recognizable` at best). I record what the render actually
shows, not the prediction — if the lobed silhouette + vessels + red read clearly it could reach
`recognizable`; if it collapses to an undifferentiated red blob it is `loose` or `failed`.

**Rejected — fold the read into `progress.md` only.** The read is a deliverable, not just progress;
T-038-01 curation needs to find it deterministically. A dedicated file is the join target.

**Rejected — a numeric 1–10 score.** AC says *categorical*; a rubric-free number would be false
precision over a single subjective render. Categorical + one line of prose is the asked-for shape.

## Decision 5 — Watch for the concept-vs-render value gap explicitly

**Chosen.** Per memory *concept-image-not-color-value-preview*, the Nano Banana concept previews
**hue** but not **value/brightness** — a heart's whole identity is its **red**, and the named block the
model picks (e.g. `red_terracotta` vs `red_concrete` vs `redstone_block`) can render markedly darker or
duller than the bright arterial red the concept shows. I will call this out specifically in the
fidelity read if present, because for *this* subject the color is doing more recognizability work than
for any prior sibling (moai = stone gray, dancing man = earth/gold — both forgiving of value drift; a
heart that renders brown-maroon instead of red loses its single strongest cue).

**Rejected — pre-judging the palette.** I do not assume the model picks a bad block; I inspect the
actual render and report the gap only if it materializes. The point is to *look* for it, not to assert
it.

## Decision 6 — Evidence lives in the run dir; the work dir holds the read + provenance

`benchmarks/sculpture/runs/006-vConcept-an-anatomically-correct-human-heart/` is the canonical
artifact location (the runner owns it and the README gallery links it). The work dir's
`fidelity-read.md` *references* those files rather than duplicating images, keeping one source of
truth. `progress.md` records the live run log (token/cost/bounds, any retries) so a reviewer can see
what actually happened without re-running.

## Decision 7 — Failure handling for the live run

Stage 3 enforces the AJV schema; a malformed build throws. If a stage fails (schema reject, transient
Gemini/claude error, GL hiccup), re-run the *whole* benchmark (it is idempotent per run dir — a new
`nextSeq()` dir each time; stale partial dirs get noted and can be removed). Do **not** hand-edit
`artifact.json` to force schema validity — that would fabricate a result the pipeline did not produce.
Record any retry and its cause in `progress.md`. If the heart is genuinely unbuildable as a
recognizable object at scale 32 after a fair attempt, **that is itself the recorded finding** (judgment
`loose` or `failed`) — exactly the "large gap" data point the ticket exists to capture — not a reason
to tweak the prompt.

## What "done" looks like

- A complete `runs/006-vConcept-an-anatomically-correct-human-heart/` dir (doc, concept, schema-valid
  artifact, 3/4 render, turntable frames, summary.json), README gallery updated.
- `fidelity-read.md` with concept↔render comparison, one-line faithfulness, shortfall note **including
  the organic-curve loss line**, and a categorical judgment.
- `progress.md` (run log) and `review.md` (handoff). No pipeline/source code changed; `npm test` still
  green (it never touched the live path).
