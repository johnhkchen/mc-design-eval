# T-036-04 — Design

Decide *how* to execute this build and capture its evidence. The pipeline is fixed (T-035-01); the
design choices here are operational — which invocation, which scale, how the fidelity read is
structured (with special care for the thin-element question), and how categorical judgment is
recorded — all grounded in the Research findings. The siblings (notably T-036-01) set the template;
this ticket follows it and adds only what the *thin/linear* form demands.

## Decision 1 — Reuse the runner verbatim; add no code

**Chosen.** Invoke `npm run bench:sculpture -- --subject "a bow and arrow" --scale 32 --note "T-036-04 build"`.

The ticket frames T-036-* as *consumers* of the archetype, not modifiers. The runner already
validates before metering, writes the full run dir, regenerates the README gallery, and pins
attribution metadata. Anything beyond those outputs is *evidence about* the run (the fidelity read +
judgment), which belongs in the work dir, not the pipeline.

**Rejected — patch the runner/prompts to better handle thin elements** (e.g. a "thicken linear runs
to ≥2 blocks" hint, or a string-as-fence-line special case). This would (a) fork the archetype,
contradicting "reuse, don't fork"; (b) make this run non-comparable to its seven siblings; (c)
*pre-empt the very measurement* this benchmark exists to take. The whole reason bow-and-arrow is in
the set is to **expose** the thin/linear gap honestly. If the gap proves the form type is
systematically deficient, that is a *finding* for the archetype owner (S-035 / curation T-038-01),
not a silent edit here. The build prompt already asks for solid, bridged thin parts — whatever it
does with a near-sub-block shaft is the datum.

## Decision 2 — Subject string: "a bow and arrow" (verbatim from the ticket)

**Chosen.** Pass the ticket's exact phrasing. The AC quotes `--subject "a bow and arrow"` literally;
honoring it keeps `trial_id`/slug (`005-vConcept-a-bow-and-arrow`) matching the stated command and
keeps the breadth set's naming consistent.

**Rejected — "a bow and an arrow" / "a longbow with a nocked arrow" / "archery bow".** A more
specific phrasing might *help* the model (e.g. "nocked" implies the arrow on the string, a single
connected composition), but it would deviate from the AC's literal string and bias the hardest-case
measurement toward a friendlier subject. Keep the term blunt; let the model interpret.

## Decision 3 — Scale 32 (the standard), default turntable frames (24)

**Chosen.** `--scale 32`, matching the AC and the S-036 "standard scale ~32" charter. Leave `--frames`
at the runner default (24) for a smooth front-arc rock, matching the archetype's canonical cadence and
the dancing-man sibling (002). Scale variation is S-037's job, not this ticket's.

**Rejected — bump scale to rescue the thin elements.** More blocks along the longest edge *would* give
the string/shaft more pixels to survive as discrete runs — but that would conflate the thin/linear
stress-test with a scale study (S-037 owns scale), break breadth comparability across T-036-*, and
soften the exact gap the ticket wants on record. Hold scale fixed at 32; let the read *note* whether
32 starved the linear elements. (Memory: dancing-man's `recognizable` came at 32 despite thin limbs;
the bow is thinner still — that contrast is informative precisely because scale is held constant.)

## Decision 4 — Fidelity read as a dedicated artifact, with an explicit thin-element verdict

**Chosen.** Write `docs/active/work/T-036-04/fidelity-read.md` containing: (a) the concept image and
the 3/4 render referenced side by side (relative links into the run dir) — **plus the best/most
illustrative turntable frame**, since the dancing-man finding warns the fixed 45° still can misrepresent
a thin, orientation-sensitive subject; (b) one line on faithfulness; (c) where it fell short; (d) a
**dedicated "thin-element survival" subsection** answering the AC's explicit question — *did the arrow
survive? did the string survive? how chunky did each become (sub-block dropped / thickened to N
blocks / dotted/broken)?*; and (e) the **categorical judgment**. This satisfies AC#2 and AC#3 in one
reviewable place and gives curation (T-038-01) a stable per-subject file to join on.

Categorical scale (matches the breadth read the README frames — angular best, thin/organic worst):
**`faithful` | `recognizable` | `loose` | `failed`**. The ticket *predicts* the largest gap of the
set, so a *lower* bucket than the moai/dancing-man (plausibly `loose`, possibly `recognizable` if the
bow stave carries it, possibly `failed` if string+arrow both vanish and only an ambiguous arc remains)
is expected. I record what the render actually shows, not the prediction.

**Rejected — fold the read into `progress.md` only.** The read is a deliverable, not just progress;
T-038-01 needs to find it deterministically. A dedicated file is the join target.

**Rejected — a numeric 1–10 score.** AC says *categorical*; a rubric-free number is false precision
over a single subjective render. Categorical + the thin-element prose is the asked-for shape.

## Decision 5 — Evidence lives in the run dir; the work dir holds the read + provenance

`benchmarks/sculpture/runs/005-vConcept-a-bow-and-arrow/` is the canonical artifact location (the
runner owns it; the README gallery links it). `fidelity-read.md` *references* those files rather than
duplicating images — one source of truth. `progress.md` records the live run log (tokens/cost/bounds,
any retries) so a reviewer can reconstruct the run without re-executing.

## Decision 6 — Failure handling for the live run

Stage 3 enforces the AJV schema; a malformed build throws. If a stage fails (schema reject, transient
Gemini/claude error, GL hiccup), re-run the *whole* benchmark (idempotent per run dir — a new
`nextSeq()` dir each time; stale partial dirs get noted and can be removed). Do **not** hand-edit
`artifact.json` to force schema validity — that would fabricate a result the pipeline did not produce.
Record any retry and its cause in `progress.md`.

**A low-fidelity result is NOT a failure to retry.** Critically for this subject: if the string or
arrow voxel-breaks, thickens, or disappears, that is a **successful** run with a *low fidelity
bucket* — the exact measurement the ticket commissions — not a stage error to re-run. Only re-run on a
genuine *pipeline* failure (non-zero exit / thrown stage), never to "get a better-looking bow".

## What "done" looks like

- A complete `runs/005-vConcept-a-bow-and-arrow/` dir (doc, concept, schema-valid artifact, 3/4
  render, turntable frames, summary.json), README gallery updated.
- `fidelity-read.md` with concept↔render (+ illustrative turntable frame) comparison, one-line
  faithfulness, shortfall note, the **explicit thin-element survival verdict**, and a categorical
  judgment.
- `progress.md` (run log) and `review.md` (handoff). No pipeline/source code changed; `npm test`
  still green (it never touched the live path).
