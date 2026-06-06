# T-036-02 — Design

Decide *how* to satisfy the three ACs given the research reality: the pipeline exists and is
frozen, a near-identical reference run (001 `moai`) already passed, and there is no automated
sculpture judge. Grounded in research.md.

## Decision 1 — Run fresh, or reuse the 001 smoke?

### Options
- **A. Reuse 001-vConcept-moai.** Point the fidelity read at the existing run; no metered call.
- **B. Run fresh `--subject "a moai statue" --scale 32`.** A new `002-…` run dir.
- **C. Run fresh with `--subject "moai"`** to byte-match the precedent.

### Decision: **B** — run fresh with the exact ticket phrasing `"a moai statue"`.
**Why.** AC#1 is literally `vConcept --subject "a moai statue" --scale 32 runs end-to-end`. The
ticket *is* the act of running this build; reusing 001 (A) would not satisfy "runs end-to-end" for
*this* subject and would conflate T-035-01's archetype smoke with T-036-02's build deliverable.
Each E-13 build ticket is meant to produce its own run (S-036 = "8 sculptural builds"); they are
indexed by run id, so a distinct `002-vConcept-a-moai-statue` is the correct artifact. C is
rejected: the ticket names the article-noun phrasing, and matching 001's slug would collide /
mislabel. The ~$0.7 + ~8 min cost is the designed, expected cost of a build ticket.

**Risk & mitigation.** Non-determinism means the fresh build may differ from 001 (possibly worse).
That is acceptable and informative — it is *the measurement*. If the live run fails (auth, GL,
quota), the fallback is to document the failure in progress.md and, only then, fall back to reading
001 as the nearest evidence (clearly labelled as a substitute). Validate spec before billing
(`assertSculptureSpec` already does).

## Decision 2 — How to record the fidelity-vs-concept read (AC#2)?

### Options
- **A. One line in summary.json `note`.** Minimal; the runner already plumbs `--note`.
- **B. A dedicated `fidelity.md` in the run dir + the run dir's evidence.** Structured prose
  comparing `concept.png` ↔ `render-3q.png`, with the required one-liner.
- **C. Both** — `fidelity.md` for the read, and a compact `--note` so the README gallery shows it.

### Decision: **C**.
**Why.** AC#2 says "concept vs render + one line." The "one line" maps cleanly to the runner's
`--note` (which lands in summary.json and the auto-regenerated README gallery — exactly where a
curator/T-038-01 will look). The fuller "concept vs render" comparison wants more than a gallery
caption, so it lives in a `fidelity.md` next to the two images it compares. B alone hides the read
from the gallery; A alone is too thin for the comparison. C gives both the durable read and the
discoverable one-liner with no new machinery (note is an existing flag).

**Method of the read.** I will visually read both PNGs (Read tool renders images): does the voxel
build preserve the concept's *masses, proportion, silhouette, palette hierarchy*? Where did the
concept→voxel step lose or gain? One-line verdict at the top. This is the angular/monolithic
"best case" prediction being checked against reality.

## Decision 3 — "Judged (categorical)" (AC#3): automated or recorded?

### Options
- **A. Write a new `JudgeSculpture` BAML fn + runner.** Mirrors JudgeFacade.
- **B. Manual categorical judgement** using the existing `Category` vocabulary (Weak / Competent /
  Strong / Exceptional), recorded in `fidelity.md`.
- **C. Reuse `JudgeFacade` as-is on the sculpture render.**

### Decision: **B** — record a categorical judgement using the established `Category` enum.
**Why.** A is scope creep: building/validating a new BAML judge fn + tsx runner is its own ticket
(closer to the archetype/curation tickets), would touch frozen-ish surfaces, and is not required by
"Judged (categorical)" — which asks for a categorical *verdict*, not a new tool. C is wrong: the
JudgeFacade prompt is steeped in facade language ("grand TEMPLE", "bay rhythm", "head-on") that
would mis-score a freestanding object. B reuses the project's own, already-blessed categorical
vocabulary (Weak/Competent/Strong/Exceptional) applied to sculpture-appropriate dimensions
(form/proportion, palette, detail/craft, fidelity/recognizability, overall) and records it as the
judgement. It is categorical, traceable, and faithful to the AC without inventing infrastructure.
If E-13 later wants automation, T-038-01 (curation) or a dedicated archetype ticket can add
`JudgeSculpture`; I will note that as a follow-up, not do it here.

**Discriminating rubric.** Apply JudgeFacade's discipline: default ceiling is "strong";
"exceptional" is the rare one-in-ten. Judge only what the render shows. The moai is predicted
faithful, so a Competent–Strong recognizability is the expectation to test, not a foregone Strong.

## Decision 4 — What to commit

### Decision: commit the RDSPI artifacts + `fidelity.md` + the run dir's **lightweight** evidence
(`summary.json`, `design-doc.md`, prompts, `artifact.json`, `concept.png`, `render-3q.png`), mirror
of how 001 was committed. The turntable frames + `transcript.jsonl` are heavy; 001 committed them,
so for consistency I will keep the full run dir but call out in review.md that
`benchmarks/sculpture/runs/` could later be gitignored (the 001 reviewer already flagged this). I
will **not** modify `src/`, BAML, or seams — additive only. Committing happens only if the user has
asked / per repo convention; otherwise I leave changes staged-ready and note it.

## What is explicitly rejected / out of scope
- No new `JudgeSculpture` BAML fn or judge runner (Decision 3A).
- No change to `src/sculpture.mjs`, `conceptart.baml`, or any seam — T-035-01 froze them; this is a
  *consumer* ticket.
- No scale sweep (that is S-037 / T-037-*), no iteration/best-of-N (ticket says one build, B).
- No fix for the single-view back/sides limitation (documented property; image→3D is deferred).

## Success definition for Implement
A `002-vConcept-a-moai-statue` run dir with all four artifact classes (doc, concept, artifact +
3/4 render, turntable), schema-valid artifact, a `fidelity.md` carrying the concept↔render read +
one-liner + a categorical judgement, the README gallery regenerated, and `npm test` still green
(no source touched, so it must stay at the 312 baseline).
