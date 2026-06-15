# T-037-01 — Design

Decide *how* to execute this scale-16 build and capture its evidence for the 16/32/48 study. The
pipeline is fixed (T-035-01); the design choices here are operational — which invocation, which scale,
how the fidelity note is structured for cross-scale comparison, and how categorical judgment is
recorded — all grounded in the Research findings.

## Decision 1 — Reuse the runner verbatim; add no code

**Chosen.** Invoke `npm run bench:sculpture -- --subject "a moai statue" --scale 16 --note "T-037-01 scale-16 study"`.

S-037 frames its four tickets as *consumers* of the archetype that vary only `--scale`. The runner
already validates before metering, threads `scale` into both prompt stages, writes the full run dir,
regenerates the README gallery, and pins attribution metadata. Everything this ticket needs beyond
those outputs is *evidence about* the run (the fidelity note + the cross-scale comparison), which
belongs in the work dir, not the pipeline.

**Rejected — patch the runner/prompts to "help" low-res builds** (e.g. a feature-floor hint forcing a
minimum face-feature block count at small scale). That would (a) fork the archetype; (b) make this run
non-comparable to the scale-32 anchor and the scale-48 sibling — destroying the *entire point* of a
scale study, which is to measure the pipeline's *unaided* behavior across resolution; (c) pre-empt the
measurement. Whatever the model does with a ~16³ budget is the datum.

## Decision 2 — Subject string: "a moai statue" (verbatim, matched to the anchor)

**Chosen.** Pass exactly `"a moai statue"` — identical to the scale-32 anchor (run 003). The AC quotes
this string literally, and **subject parity is mandatory for a scale study**: the only variable that
may change between 16/32/48 is `--scale`. Any wording drift would confound resolution with prompt
variation.

**Rejected — "moai" / "an Easter Island moai".** Even though the original smoke (run 001) used "moai",
matching the *anchor's* string (run 003, "a moai statue") is what makes the triptych valid. Deviating
would compare different subjects, not different scales.

## Decision 3 — Scale 16 (the AC), default turntable frames (24)

**Chosen.** `--scale 16`, the small end of the study (AC + S-037 charter). Leave `--frames` at the
runner default (24) so the turntable matches the archetype's canonical cadence and the anchor (run 003
used 24). The renderer fits the camera to bounds, so the smaller build still fills the still — only
*resolution* differs, which is exactly what we want to isolate.

**Rejected — a non-standard frame count or a tighter scale (e.g. 12).** The AC says 16; 16 is the
story's defined small point; changing it would break the 16/32/48 triptych S-037/T-038-01 expects.

## Decision 4 — Fidelity note as a dedicated artifact, framed for the cross-scale comparison

**Chosen.** Write `docs/active/work/T-037-01/fidelity-read.md` containing: (a) the concept image and
the 3/4 render referenced side by side (relative links into the run dir) — plus the most illustrative
turntable frame if the fixed 45° still misrepresents the build (the azimuth lesson from dancing-man
(002) and bow-and-arrow (T-036-04)); (b) one line on faithfulness *at this scale*; (c) where it fell
short; (d) an explicit **"scale-16 vs scale-32 (run 003)" subsection** — the AC's required cross-scale
note: what features survived the ~⅛ volume budget, what merged/dropped, block count delta; and (e) the
**categorical judgment**. This satisfies AC#2 and AC#3 in one reviewable place and gives T-038-01 a
stable file to assemble the triptych from.

**Categorical vocabulary — chosen: report both.** Lead with `faithful | recognizable | loose | failed`
(the majority sibling scale, easy to read), and **also** map to the anchor's project `Category` enum
(`Weak | Competent | Strong | Exceptional`) so this build is directly comparable to run 003's
"Competent (form Strong)". Reporting both costs one line and prevents an apples-to-oranges scale
comparison. Expectation (recorded, not substituted for the observation): the moai is the *angular best
case*, so even at 16 it should **degrade gracefully** — likely still `recognizable`/`Competent` but
coarser, with face features the first casualty.

**Rejected — a single numeric score**, or folding the read into `progress.md` only. The AC says
*categorical*; and the read is a deliverable T-038-01 must find deterministically.

## Decision 5 — Naming the run so the scale is unambiguous (slug collision with run 003)

The run id slug (`a-moai-statue`) and the README gallery do **not** encode scale, so this run's dir
(`NNN-vConcept-a-moai-statue`, seq ~010) shares a slug with the scale-32 run 003. **Chosen:** in
`progress.md`, `fidelity-read.md`, and `review.md`, always cite the run by **seq + explicit scale**
(e.g. "run 010, scale 16") and link the exact dir; copy `summary.json.scale` into the read's run-facts
table. No runner change — the disambiguation lives in the evidence docs (and `summary.json.scale` is
the machine-readable key T-038-01 joins on).

**Rejected — encoding scale in the run id.** That is a runner change (forks the archetype, breaks the
slug contract the README/other runs rely on). The seq + `summary.json.scale` already disambiguate.

## Decision 6 — Failure handling; a coarse result is a result, not a retry

Stage 3 enforces the AJV schema; a malformed build throws → re-run the *whole* benchmark (new
`nextSeq()` dir), record the cause in `progress.md`, never hand-edit `artifact.json`. **Critically:** a
*low-fidelity, coarse* scale-16 moai is the **commissioned measurement**, not a pipeline failure — do
**not** re-run to "get a nicer moai." Only re-run on a genuine pipeline error (non-zero exit / thrown
stage). If features collapse, that *is* the finding (judgment `loose`/`recognizable` as observed).

## What "done" looks like

- A complete `runs/NNN-vConcept-a-moai-statue/` dir at **scale 16** (doc, concept, schema-valid
  artifact, 3/4 render, turntable frames, summary.json), README gallery updated.
- `fidelity-read.md` with concept↔render comparison, one-line faithfulness, shortfall note, the
  explicit **scale-16-vs-32 cross-scale subsection**, and a categorical judgment (both vocabularies).
- `progress.md` (run log, scale cited explicitly) and `review.md` (handoff). No pipeline/source code
  changed; `npm test` still green.
