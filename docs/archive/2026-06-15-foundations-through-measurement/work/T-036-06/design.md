# T-036-06 — Design

Decide *how* to execute this build and capture its evidence. The pipeline is fixed (T-035-01); the
design choices here are operational — which invocation, which scale, how the fidelity read is
structured, and how categorical judgment is recorded — all grounded in the Research findings.

## Decision 1 — Reuse the runner verbatim; add no code

**Chosen.** Invoke `npm run bench:sculpture -- --subject "a sword" --scale 32 --note "T-036-06 build"`.

The ticket and T-035-01's review both frame T-036-* as *consumers* of the archetype, not modifiers of
it. The runner already validates before metering, writes the full run dir (`design-doc.md`,
`concept.png`, `artifact.json`, `render-3q.png`, `turntable/`, `transcript.jsonl`, `summary.json`),
regenerates the README gallery, and pins attribution metadata. Anything this ticket needs beyond those
outputs is *evidence about* the run (the fidelity read + judgment), which belongs in the work dir, not
in the pipeline.

**Rejected — patch the runner or prompts for "thin objects".** A blade-specific tweak (e.g. minimum
blade length, edge-thinning hints) would (a) fork the archetype, contradicting "reuse, don't fork",
(b) make this run non-comparable to its seven siblings, and (c) pre-empt the *measurement* this
benchmark exists to take. The build prompt already pushes SOLID/connected geometry, which is exactly
what a single-piece sword needs. If thin objects prove systematically deficient, that is a *finding*
for the archetype's owner (S-035 / curation T-038-01), not a silent edit here.

## Decision 2 — Subject string: "a sword" (verbatim from the ticket)

**Chosen.** Pass the ticket's exact phrasing. The AC quotes `--subject "a sword"` literally, so I
honor it to keep `trial_id`/slug (`006-vConcept-a-sword`) matching the ticket's stated command.

**Rejected — "a longsword" / "a medieval sword" / "a knight's sword".** A more specific term might
yield a more iconic concept, but it would deviate from the AC's literal string and reduce breadth
comparability (each sibling uses its ticket's bare term). The genericness of "a sword" is itself part
of the measurement: can the pipeline pick a recognizable archetype from a bare noun?

## Decision 3 — Scale 32 (the standard), default turntable frames

**Chosen.** `--scale 32`, matching the AC and the S-036 "standard scale ~32" charter. Scale variation
is S-037's job, not this ticket's. Leave `--frames` at the runner default (24) so the turntable
matches the archetype's canonical cadence; the moai smoke used 8 only as a fast smoke. 24 frames over
a ±40° front arc gives a smooth rock for the record.

**Rejected — bump scale for a thin object.** A longer blade *might* read better with more y-budget,
but changing scale here would conflate the thin-object stress-test with a scale study and break
breadth comparability. Hold scale fixed; let the fidelity read *note* if 32 starved the blade.

## Decision 4 — Fidelity-vs-concept read as a dedicated artifact

**Chosen.** Write `docs/active/work/T-036-06/fidelity-read.md` containing: (a) the concept image and
the 3/4 render referenced side by side (relative links into the run dir), (b) one line on
faithfulness, (c) where it fell short, and (d) the **categorical judgment**. This satisfies AC#2 and
AC#3 in one reviewable place and gives curation (T-038-01) a stable file to join on per subject.

Categorical scale (matches the breadth read the README frames — angular best, organic worst):
**`faithful` | `recognizable` | `loose` | `failed`**. The ticket *predicts* "reads recognizably with
some thinning loss", so `recognizable` is the expected bucket; I record what the render actually
shows, not the prediction.

**Rejected — fold the read into `progress.md` only.** The read is a deliverable, not just progress;
T-038-01 curation needs to find it deterministically. A dedicated file is the join target.

**Rejected — a numeric 1–10 score.** AC says *categorical*; a rubric-free number would be false
precision over a single subjective render. Categorical + one line of prose is the asked-for shape.

## Decision 5 — Evidence lives in the run dir; the work dir holds the read + provenance

`benchmarks/sculpture/runs/006-vConcept-a-sword/` is the canonical artifact location (the runner owns
it and the README gallery links it). The work dir's `fidelity-read.md` *references* those files rather
than duplicating images, keeping one source of truth. `progress.md` records the live run log
(token/cost/bounds, any retries) so a reviewer can see what actually happened without re-running.

## Decision 6 — Failure handling for the live run

Stage 3 enforces the AJV schema; a malformed build throws. If a stage fails (schema reject, transient
Gemini/claude error, GL hiccup), the design is: re-run the *whole* benchmark (a new `nextSeq()` dir
each time; stale partial dirs get noted and can be removed). Do **not** hand-edit `artifact.json` to
force schema validity — that would fabricate a result the pipeline did not produce. Record any retry
and its cause in `progress.md`. If the sword is genuinely unbuildable at scale 32 after a fair
attempt, that is itself the recorded finding (judgment `loose`/`failed`), not a reason to tweak the
prompt.

## Decision 7 — Inspect the render honestly, including the turntable

The dancing-man sibling taught that the fixed 45° still can misrepresent a build whose signature axis
is off-camera. A sword is long and thin: depending on the model's chosen orientation, the canonical
3/4 still may foreshorten the blade. **Chosen:** in addition to `render-3q.png`, read a couple of
turntable frames before judging, and if a frame shows the sword more truthfully than the canonical
still, cite it in the fidelity read (an existing output, no new artifact). Record the orientation the
model picked and whether 45° flatters it — a candidate cross-subject finding for curation.

## What "done" looks like

- A complete `runs/006-vConcept-a-sword/` dir (doc, concept, schema-valid artifact, 3/4 render,
  turntable frames, summary.json), README gallery updated.
- `fidelity-read.md` with concept↔render comparison, one-line faithfulness, shortfall note, and a
  categorical judgment.
- `progress.md` (run log) and `review.md` (handoff). No pipeline/source code changed; `npm test`
  still green (it never touched the live path).
