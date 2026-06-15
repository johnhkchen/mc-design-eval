# T-036-03 — Design

The pipeline is fixed (T-035-01); the design choices here are operational — invocation, scale, how
the fidelity read is structured, how categorical judgment is recorded — grounded in Research and
mirroring the established T-036-01 pattern so the eight builds stay breadth-comparable.

## Decision 1 — Reuse the runner verbatim; add no code

**Chosen.** Invoke `npm run bench:sculpture -- --subject "a pineapple" --scale 32 --note "T-036-03 build"`.

The ticket and T-035-01's review frame T-036-* as *consumers* of the archetype, not modifiers. The
runner already validates before metering, writes the full run dir, regenerates the README gallery, and
pins attribution metadata. Anything beyond those outputs is *evidence about* the run (the fidelity
read + judgment), which belongs in the work dir, not the pipeline.

**Rejected — patch the runner/prompts for "patterned organic" subjects.** A pineapple-specific tweak
(e.g. a cross-hatch texture hint, or thinning the crown) would (a) fork the archetype, contradicting
"reuse, don't fork", (b) break comparability with the seven siblings, and (c) pre-empt the very
*measurement* this benchmark exists to take. Whether block-scale texture conveys pineapple skin is the
finding; engineering it in would fabricate the answer.

## Decision 2 — Subject string: "a pineapple" (verbatim from the ticket AC)

**Chosen.** Pass the ticket's exact phrasing. The AC quotes `--subject "a pineapple"` literally, so the
`trial_id`/slug becomes `004-vConcept-a-pineapple`, matching the stated command. The S-037 scale study
will reuse this exact subject string at 16/48, so phrasing must be stable across the trio.

**Rejected — "pineapple" / "a ripe pineapple".** Marginal wording could shift the imagined doc and,
worse, *desync this hero from its own scale-study siblings*. No reason to deviate from the AC's string.

## Decision 3 — Scale 32 (the standard); default turntable frames (24)

**Chosen.** `--scale 32`, matching the AC and the S-036 "standard scale ~32" charter. This run is the
**scale-study hero**: it is the 32-block midpoint that S-037's 16 and 48 builds bracket. Holding it at
the standard scale and the canonical 24-frame ±40° rock keeps it the clean reference. (The moai *smoke*
used 8 frames only as a fast smoke; the per-subject builds use the runner default 24, as T-036-01 did.)

**Rejected — vary scale or frames here.** Scale variation is S-037's job; doing it here would conflate
the texture/rounded-form test with a scale study and break breadth comparability. The fidelity read may
*note* whether 32 blocks were enough to carry the cross-hatch and crown, which directly seeds S-037.

## Decision 4 — Fidelity-vs-concept read as a dedicated artifact

**Chosen.** Write `docs/active/work/T-036-03/fidelity-read.md` containing: (a) the concept image and
the 3/4 render referenced side by side (relative links into the run dir, plus any turntable frame that
reads better, as T-036-01 did), (b) one line on faithfulness, (c) where it fell short — focused on the
two named stressors: **cross-hatch skin** and **spiky crown**, (d) the **categorical judgment**, and
(e) run facts copied from `summary.json`. This satisfies AC#2 and AC#3 in one reviewable place and
gives curation (T-038-01) and the scale study (S-037) a stable per-subject file to join on.

Categorical scale (same as T-036-01, matching the README's breadth framing — angular best, organic
worst): **`faithful` | `recognizable` | `loose` | `failed`**. The ticket *predicts* "moderate
fidelity", so `recognizable` is the expected bucket; I record what the render actually shows, not the
prediction.

**Rejected — fold the read into `progress.md` only.** The read is a deliverable, not just progress;
T-038-01 and S-037 need to find it deterministically. **Rejected — a numeric 1–10 score.** AC says
*categorical*; a rubric-free number would be false precision over a single subjective render.

## Decision 5 — Evidence lives in the run dir; the work dir holds the read + provenance

`benchmarks/sculpture/runs/004-vConcept-a-pineapple/` is the canonical artifact location (the runner
owns it and the README gallery links it). The work dir's `fidelity-read.md` *references* those files
rather than duplicating images, keeping one source of truth. `progress.md` records the live run log
(tokens/cost/bounds, any retries) so a reviewer can see what happened without re-running.

## Decision 6 — Failure handling for the live run

Stage 3 enforces the AJV schema; a malformed build throws. If a stage fails (schema reject, transient
Gemini/claude error, GL hiccup), re-run the *whole* benchmark — it is idempotent per run dir (a fresh
`nextSeq()` dir each time; stale partial dirs get noted and removed). Do **not** hand-edit
`artifact.json` to force schema validity — that would fabricate a result the pipeline did not produce.
Record any retry and its cause in `progress.md`. If the pineapple genuinely fails to read at scale 32
after a fair attempt, that is itself the recorded finding (judgment `loose`/`failed`), not a reason to
tweak the prompt — and it would be an important signal for the scale study (does 48 rescue it?).

## What "done" looks like

- A complete `runs/004-vConcept-a-pineapple/` dir (doc, concept, schema-valid artifact, 3/4 render,
  turntable frames, summary.json), README gallery updated.
- `fidelity-read.md` with concept↔render comparison, one-line faithfulness, shortfall note on the
  cross-hatch + crown, and a categorical judgment.
- `progress.md` (run log) and `review.md` (handoff). No pipeline/source code changed; `npm test` still
  green (it never touched the live path).
