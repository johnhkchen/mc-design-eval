# T-037-02 — Design

Decide *how* to execute this scale-48 build and capture its evidence for the 16/32/48 study. The
pipeline is fixed (T-035-01); the design choices here are operational — which invocation, which scale,
how the fidelity note is structured for cross-scale comparison, and how categorical judgment is
recorded — all grounded in the Research findings.

## Decision 1 — Reuse the runner verbatim; add no code

**Chosen.** Invoke `npm run bench:sculpture -- --subject "a moai statue" --scale 48 --note "T-037-02 scale-48 study"`.

S-037 frames its four tickets as *consumers* of the archetype that vary only `--scale`. The runner
already validates before metering, threads `scale` into both prompt stages, writes the full run dir,
regenerates the README gallery, and pins attribution metadata. Everything this ticket needs beyond
those outputs is *evidence about* the run (the fidelity note + the cross-scale comparison), which
belongs in the work dir, not the pipeline.

**Rejected — patch the runner/prompts to exploit the larger budget** (e.g. a hint pushing the model to
"use all 48 blocks" or add detail). That would (a) fork the archetype; (b) make this run non-comparable
to the scale-16/32 siblings — destroying the *entire point* of a scale study, which is to measure the
pipeline's *unaided* behavior across resolution; (c) pre-empt the measurement. Whatever the model does
with a ~48³ budget is the datum — even if it under-uses it.

## Decision 2 — Subject string: "a moai statue" (verbatim, matched to the anchors)

**Chosen.** Pass exactly `"a moai statue"` — identical to the scale-32 anchor (run 003) and the
scale-16 sibling (run 010). The AC quotes this string literally, and **subject parity is mandatory for
a scale study**: the only variable that may change between 16/32/48 is `--scale`. Any wording drift
would confound resolution with prompt variation.

**Rejected — "moai" / "an Easter Island moai".** Even though the original smoke (run 001) used "moai",
matching the *anchors'* string is what makes the triptych valid. Deviating would compare different
subjects, not different scales.

## Decision 3 — Scale 48 (the AC), default turntable frames (24)

**Chosen.** `--scale 48`, the large end of the study (AC + S-037 charter; ≤ `SCALE_MAX` 64). Leave
`--frames` at the runner default (24) so the turntable matches the archetype's canonical cadence and
both anchors (003 and 010 used 24). The renderer fits the camera to bounds, so the larger build still
fills the still at the same apparent size — only *resolution* differs across the triptych, which is
exactly what we want to isolate.

**Rejected — a non-standard frame count, or a larger scale (e.g. 64).** The AC says 48; 48 is the
story's defined large point; changing it would break the 16/32/48 triptych S-037/T-038-01 expects.

## Decision 4 — Fidelity note as a dedicated artifact, framed for the cross-scale comparison

**Chosen.** Write `docs/active/work/T-037-02/fidelity-read.md` containing: (a) the concept image and
the 3/4 render referenced side by side (relative links into the run dir) — plus the most illustrative
turntable frame if the fixed 45° still misrepresents the build (the azimuth lesson from dancing-man
(002) and bow-and-arrow (T-036-04)); (b) one line on faithfulness *at this scale*; (c) where it fell
short; (d) an explicit **"scale-48 vs scale-32 (run 003) — and vs scale-16 (run 010 if complete)"
subsection** — the AC's required cross-scale note: did the extra budget *close the gap* (finer
features) or just add bulk; what improved, what stayed the same, what (if anything) got worse (busier
recesses, stronger value drift); block-count delta; and (e) the **categorical judgment**. This
satisfies AC#2 and AC#3 in one reviewable place and gives T-038-01 a stable file to assemble the
triptych from.

**Categorical vocabulary — chosen: report both.** Lead with `faithful | recognizable | loose | failed`
(the majority sibling scale, easy to read), and **also** map to the anchor's project `Category` enum
(`Weak | Competent | Strong | Exceptional`) so this build is directly comparable to run 003's
"Competent (form Strong)". Reporting both costs one line and prevents an apples-to-oranges scale
comparison. Expectation (recorded, not substituted for the observation): the moai is the *angular best
case*, so at 48 it should be at least as faithful as 32 — plausibly `faithful`/`Strong` on form — but
S-037's open question is whether extra budget *meaningfully* improves the read or merely scales it; the
honest answer comes from the pixels.

**Rejected — a single numeric score**, or folding the read into `progress.md` only. The AC says
*categorical*; and the read is a deliverable T-038-01 must find deterministically.

## Decision 5 — Naming the run so the scale is unambiguous (slug collision with runs 003 & 010)

The run id slug (`a-moai-statue`) and the README gallery do **not** encode scale, so this run's dir
(`NNN-vConcept-a-moai-statue`, seq ≥ 011) shares a slug with the scale-32 run 003 *and* the scale-16
run 010 — **three** rows with the same slug, separated only by the `scale` column. **Chosen:** in
`progress.md`, `fidelity-read.md`, and `review.md`, always cite the run by **seq + explicit scale**
(e.g. "run 011, scale 48") and link the exact dir; copy `summary.json.scale` into the read's run-facts
table. No runner change — the disambiguation lives in the evidence docs (and `summary.json.scale` is
the machine-readable key T-038-01 joins on).

**Rejected — encoding scale in the run id.** That is a runner change (forks the archetype, breaks the
slug contract the README/other runs rely on). The seq + `summary.json.scale` already disambiguate.

## Decision 6 — Failure handling; a saturated/under-used result is a result, not a retry

Stage 3 enforces the AJV schema; a malformed build throws → re-run the *whole* benchmark (new
`nextSeq()` dir), record the cause in `progress.md`, never hand-edit `artifact.json`. **Critically:** if
the scale-48 moai turns out **no more faithful** than scale-32 (form saturated, extra blocks spent on
bulk), or *worse* (busier face, stronger value drift), that is the **commissioned measurement**, not a
pipeline failure — do **not** re-run to "get a nicer/bigger moai." Only re-run on a genuine pipeline
error (non-zero exit / thrown stage). The model's unaided use of the larger budget *is* the finding.

## What "done" looks like

- A complete `runs/NNN-vConcept-a-moai-statue/` dir at **scale 48** (doc, concept, schema-valid
  artifact, 3/4 render, turntable frames, summary.json), README gallery updated.
- `fidelity-read.md` with concept↔render comparison, one-line faithfulness, shortfall note, the
  explicit **scale-48-vs-32(-vs-16) cross-scale subsection answering the "does more budget close the
  gap" question**, and a categorical judgment (both vocabularies).
- `progress.md` (run log, scale cited explicitly) and `review.md` (handoff). No pipeline/source code
  changed; `npm test` still green.
