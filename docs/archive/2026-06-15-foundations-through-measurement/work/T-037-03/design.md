# T-037-03 — Design

Decide *how* to execute this scale-16 pineapple build and capture its evidence for the 16/32/48 study.
The pipeline is fixed (T-035-01); the design choices here are operational — which invocation, which
scale, how the fidelity note is structured for cross-scale comparison, and how categorical judgment is
recorded — all grounded in the Research findings. This mirrors the proven T-037-01 (moai@16) design,
re-pointed at the organic anchor (run 004, pineapple@32).

## Decision 1 — Reuse the runner verbatim; add no code

**Chosen.** Invoke
`npm run bench:sculpture -- --subject "a pineapple" --scale 16 --note "T-037-03 scale-16 study"`.

S-037 frames its four tickets as *consumers* of the archetype that vary only `--scale`. The runner
already validates before metering, threads `scale` into both prompt stages, writes the full run dir,
regenerates the README gallery, and pins attribution metadata. Everything this ticket needs beyond
those outputs is *evidence about* the run (the fidelity note + the cross-scale comparison), which
belongs in the work dir, not the pipeline.

**Rejected — patch the runner/prompts to "help" the low-res organic build** (e.g. forcing a minimum
cross-hatch contrast or a frond-count floor at small scale). That would (a) fork the archetype; (b)
make this run non-comparable to the scale-32 anchor (run 004) and the scale-48 sibling (T-037-04) —
destroying the *entire point* of a scale study, which is to measure the pipeline's *unaided* behavior
across resolution; (c) pre-empt the measurement. Whatever the model does with a ~16³ budget — including
the predicted loss of the diamond skin and crown — **is the datum**.

## Decision 2 — Subject string: "a pineapple" (verbatim, matched to the anchor)

**Chosen.** Pass exactly `"a pineapple"` — identical to the scale-32 anchor (run 004) and the AC. **
Subject parity is mandatory for a scale study**: the only variable that may change across 16/32/48 is
`--scale`. Any wording drift (e.g. "a ripe pineapple", "pineapple fruit") would confound resolution
with prompt variation and break the triptych T-037-04 / T-038-01 expect.

**Rejected — any embellished phrasing.** Even a "better" subject string would compare different
subjects, not different scales.

## Decision 3 — Scale 16 (the AC), default turntable frames (24)

**Chosen.** `--scale 16`, the small end of the study (AC + S-037 charter). Leave `--frames` at the
runner default (24) so the turntable matches the archetype's canonical cadence and the anchor (run 004
used 24). The renderer fits the camera to bounds, so the smaller build still fills the still — only
*resolution* differs, which is exactly what we want to isolate.

**Rejected — a non-standard frame count or a tighter scale (e.g. 12).** The AC says 16; 16 is the
story's defined small point; changing it would break the 16/32/48 triptych S-037/T-038-01 expect.

## Decision 4 — Fidelity note as a dedicated artifact, framed for the cross-scale comparison

**Chosen.** Write `docs/active/work/T-037-03/fidelity-read.md` containing: (a) the concept image and
the 3/4 render referenced side by side (relative links into the run dir) — plus **the most illustrative
turntable frame** if the fixed 45° still misrepresents the build. This is *especially* likely for the
pineapple: run 004 found the 45° hero shows a **corner**, the worst angle for a cardinal-face pattern,
and the cross-hatch read best near-frontal (`frame.018`, az ≈ 5°). So a cardinal frame will probably be
cited here too; (b) one line on faithfulness *at this scale*; (c) where it fell short; (d) an explicit
**"scale-16 vs scale-32 (run 004)" subsection** — the AC's required cross-scale note: what survived the
~⅛ volume budget (body? banding? did the cross-hatch / crown collapse as predicted?), block-count delta
(this run vs 3314), bounds delta; and (e) the **categorical judgment**. This satisfies AC#2 and AC#3 in
one reviewable place and gives T-038-01 a stable file to assemble the organic leg of the triptych from.

**Categorical vocabulary — chosen: report both.** Lead with `faithful | recognizable | loose | failed`
(directly comparable to run 004's **`recognizable`**), and **also** map to the project `Category` enum
(`Weak | Competent | Strong | Exceptional`) so the organic legs are comparable to the moai legs (which
used the enum). Reporting both costs one line and keeps the whole S-037 matrix on one footing.
Expectation (recorded, *not* substituted for the observation): the pineapple is the *organic
middle-of-frontier* case, and run 004 explicitly predicted that at 16 "the cross-hatch almost certainly
disappears and the thin frond crown is at risk of collapsing to a green cap." So the likely outcome is
a **steeper** drop than the angular moai showed — plausibly down to `loose` (body survives, both
signature details lost) rather than `recognizable`. The read records whichever the pixels show.

**Rejected — a single numeric score**, or folding the read into `progress.md` only. The AC says
*categorical*; and the read is a deliverable T-038-01 must find deterministically.

## Decision 5 — Naming the run so the scale is unambiguous (slug collision with run 004)

The run id slug (`a-pineapple`) and the README gallery do **not** encode scale, so this run's dir
(`NNN-vConcept-a-pineapple`, seq ~012) shares a slug with the scale-32 run 004. **Chosen:** in
`progress.md`, `fidelity-read.md`, and `review.md`, always cite the run by **seq + explicit scale**
(e.g. "run 012, scale 16") and link the exact dir; copy `summary.json.scale` into the read's run-facts
table. No runner change — the disambiguation lives in the evidence docs (and `summary.json.scale` is
the machine-readable key T-038-01 joins on). Same approach T-037-01 used for the moai's run-003 collision.

**Rejected — encoding scale in the run id.** That is a runner change (forks the archetype, breaks the
slug contract the README/other runs rely on). The seq + `summary.json.scale` already disambiguate.

## Decision 6 — Failure handling; a coarse result is a result, not a retry

Stage 3 enforces the AJV schema; a malformed build throws → re-run the *whole* benchmark (new
`nextSeq()` dir), record the cause in `progress.md`, never hand-edit `artifact.json`. **Critically:** a
*low-fidelity, coarse* scale-16 pineapple — a plain banded barrel with a collapsed crown and no visible
diamond skin — is the **commissioned measurement**, not a pipeline failure. Do **not** re-run to "get a
nicer pineapple." Only re-run on a genuine pipeline error (non-zero exit / thrown stage). If the
cross-hatch and crown vanish, that *is* the finding (judgment `loose` as observed) — and it is exactly
the organic-degradation signal S-037 was built to capture.

## What "done" looks like

- A complete `runs/NNN-vConcept-a-pineapple/` dir at **scale 16** (doc, concept, schema-valid
  artifact, 3/4 render, turntable frames, summary.json), README gallery updated.
- `fidelity-read.md` with concept↔render comparison (+ a cardinal turntable frame if the 45° still
  under-shows the pattern), one-line faithfulness, shortfall note, the explicit **scale-16-vs-32
  cross-scale subsection**, and a categorical judgment (both vocabularies).
- `progress.md` (run log, scale cited explicitly) and `review.md` (handoff). No pipeline/source code
  changed; `npm test` still green (baseline this session: 312 pass / 0 fail).
