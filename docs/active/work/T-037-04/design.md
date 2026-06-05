# T-037-04 — Design

Decide *how* to execute this scale-48 pineapple build and capture its evidence for the 16/32/48 study.
The pipeline is fixed (T-035-01); the design choices here are operational — which invocation, which
scale, how the fidelity note is structured for cross-scale comparison, and how categorical judgment is
recorded — all grounded in the Research findings. This mirrors the proven T-037-02 (moai@48) design,
re-pointed at the organic anchor (run 004, pineapple@32) and the scale-16 organic sibling (run 012).

## Decision 1 — Reuse the runner verbatim; add no code

**Chosen.** Invoke
`npm run bench:sculpture -- --subject "a pineapple" --scale 48 --note "T-037-04 scale-48 study"`.

S-037 frames its four tickets as *consumers* of the archetype that vary only `--scale`. The runner
already validates before metering, threads `scale` into both prompt stages, writes the full run dir,
regenerates the README gallery, and pins attribution metadata. Everything this ticket needs beyond
those outputs is *evidence about* the run (the fidelity note + the cross-scale comparison), which
belongs in the work dir, not the pipeline.

**Rejected — patch the runner/prompts to exploit the larger budget** (e.g. a hint pushing the model to
"use all 48 rows for the cross-hatch" or to individuate the fronds). That would (a) fork the archetype;
(b) make this run non-comparable to the scale-16/32 siblings — destroying the *entire point* of a scale
study, which is to measure the pipeline's *unaided* behavior across resolution; (c) pre-empt the
measurement. Whatever the model does with a ~48³ budget — including the moai@48-style under-spend, if it
recurs — **is the datum**. (This is doubly important here: the headline S-037 question is precisely
whether more budget helps the organic form; "helping" the build would answer it by fiat.)

## Decision 2 — Subject string: "a pineapple" (verbatim, matched to the anchors)

**Chosen.** Pass exactly `"a pineapple"` — identical to the scale-32 anchor (run 004), the scale-16
sibling (run 012), and the AC. **Subject parity is mandatory for a scale study**: the only variable that
may change across 16/32/48 is `--scale`. Any wording drift (e.g. "a ripe pineapple", "pineapple fruit")
would confound resolution with prompt variation and break the triptych T-038-01 expects.

**Rejected — any embellished phrasing.** Even a "better" subject string would compare different
subjects, not different scales.

## Decision 3 — Scale 48 (the AC), default turntable frames (24)

**Chosen.** `--scale 48`, the large end of the study (AC + S-037 charter; ≤ `SCALE_MAX` 64). Leave
`--frames` at the runner default (24) so the turntable matches the archetype's canonical cadence and
both organic comparators (run 004 used 24; run 012 will too). The renderer fits the camera to bounds, so
the larger build still fills the still at the same apparent size — only *resolution* differs across the
triptych, which is exactly what we want to isolate.

**Rejected — a non-standard frame count, or a larger scale (e.g. 64).** The AC says 48; 48 is the
story's defined large point; changing it would break the 16/32/48 triptych S-037/T-038-01 expect.

## Decision 4 — Fidelity note as a dedicated artifact, framed for the cross-scale comparison

**Chosen.** Write `docs/active/work/T-037-04/fidelity-read.md` containing: (a) the concept image and the
3/4 render referenced side by side (relative links into the run dir) — **plus the most illustrative
turntable frame**, which is *especially* likely to be needed here: run 004 found the 45° hero shows a
**corner** (the worst angle for a cardinal-face cross-hatch) and the pattern read best near-frontal
(`frame.018`, az ≈ 5°). So a cardinal frame will probably be cited; (b) one line on faithfulness *at this
scale*; (c) where it fell short; (d) an explicit **"scale-48 vs scale-32 (run 004), vs scale-16 (run
012 if complete)" subsection** — the AC's required cross-scale note: did the extra budget *close the
gap* (a finer diamond lattice that finally reads, more individuated fronds, a smoother ovoid) or just
add bulk / regress like the moai@48; block-count and ops delta; feature-by-feature (body / cross-hatch
skin / banding / frond crown) improved/same/worse; value drift over more surface; and (e) the
**categorical judgment**. This satisfies AC#2 and AC#3 in one reviewable place and gives T-038-01 a
stable file to assemble the organic leg of the triptych from.

**Categorical vocabulary — chosen: report both.** Lead with `faithful | recognizable | loose | failed`
(directly comparable to run 004's **`recognizable`**), and **also** map to the project `Category` enum
(`Weak | Competent | Strong | Exceptional`) so the organic legs are comparable to the moai legs (which
used the enum) and the whole S-037 matrix sits on one footing. Reporting both costs one line.
Expectation (recorded, *not* substituted for the observation): two live hypotheses, and the pixels
decide between them. (i) **Pattern helps** — at 48 the cross-hatch finally has enough rows to register,
fronds individuate, and the build is *more* faithful than 32 (→ `faithful`/`Strong`). (ii) **Organic
ceiling / moai-echo** — the wash-out is a *value/hue* problem not a *resolution* one, so the lattice
stays invisible; and/or the model under-spends the big budget (as it did for the moai@48), giving a
bigger-but-not-finer barrel (→ `recognizable` at best, possibly `loose`). Given the moai@48 regression
and run 004's note that the diamonds vanish on *value* grounds, hypothesis (ii) is the more likely prior
— but this is exactly what the build is run to settle.

**Rejected — a single numeric score**, or folding the read into `progress.md` only. The AC says
*categorical*; and the read is a deliverable T-038-01 must find deterministically.

## Decision 5 — Naming the run so the scale is unambiguous (slug collision with runs 004 & 012)

The run id slug (`a-pineapple`) and the README gallery do **not** encode scale, so this run's dir
(`NNN-vConcept-a-pineapple`, seq ≥ 013) shares a slug with the scale-32 run 004 *and* the scale-16 run
012 — **three** rows with the same slug, separated only by the `scale` column. **Chosen:** in
`progress.md`, `fidelity-read.md`, and `review.md`, always cite the run by **seq + explicit scale**
(e.g. "run 013, scale 48") and link the exact dir; copy `summary.json.scale` into the read's run-facts
table. No runner change — the disambiguation lives in the evidence docs (and `summary.json.scale` is the
machine-readable key T-038-01 joins on). Same approach T-037-02 used for the moai's 003/010/011 trio.

**Rejected — encoding scale in the run id.** That is a runner change (forks the archetype, breaks the
slug contract the README/other runs rely on). The seq + `summary.json.scale` already disambiguate.

## Decision 6 — Failure handling; a saturated/regressed result is a result, not a retry

Stage 3 enforces the AJV schema; a malformed build throws → re-run the *whole* benchmark (new
`nextSeq()` dir), record the cause in `progress.md`, never hand-edit `artifact.json`. **Critically:** if
the scale-48 pineapple turns out **no more faithful** than scale-32 (form saturated, extra blocks spent
on bulk, cross-hatch still washed), or *worse* (the moai@48 pattern — under-spent budget, value drift
dominating a bigger surface), that is the **commissioned measurement**, not a pipeline failure — do
**not** re-run to "get a nicer/bigger pineapple." Only re-run on a genuine pipeline error (non-zero exit
/ thrown stage). The model's unaided use of the larger budget *is* the finding, and a plateau or
regression is exactly the "organic ceiling" signal S-037 was built to capture.

## What "done" looks like

- A complete `runs/NNN-vConcept-a-pineapple/` dir at **scale 48** (doc, concept, schema-valid artifact,
  3/4 render, turntable frames, summary.json), README gallery updated.
- `fidelity-read.md` with concept↔render comparison (+ a cardinal turntable frame if the 45° still
  under-shows the pattern), one-line faithfulness, shortfall note, the explicit **scale-48-vs-32(-vs-16)
  cross-scale subsection answering the "does more budget close the gap / is there an organic ceiling"
  question**, and a categorical judgment (both vocabularies).
- `progress.md` (run log, scale cited explicitly) and `review.md` (handoff). No pipeline/source code
  changed; `npm test` still green (baseline this session per sibling runs: 312 pass / 0 fail).
