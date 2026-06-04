# Design learnings — what makes LLM Minecraft builds good

The project's running corpus of what works and what doesn't when prompting the model to
design builds. Reviewed and updated by Claude after each benchmark attempt. This file lives
in `docs/knowledge/` so lisa injects it into agent context — so the lessons feed *forward*
into how we prompt the next iteration.

**Principles** is the distilled, load-bearing knowledge — read it first. **Attempt log** keeps
the per-run reasoning behind each principle. Renders live in
`benchmarks/temple-facade/runs/<id>/render.png`; this file is the interpretation of them.

---

## Principles (distilled)

1. **The model matches the bar you set.** Briefs that cap scope ("modest 7×7–9×9", "favor
   structural clarity over ornament") produced a 333-block gray box; removing the cap on the
   *same* model/path produced an 8,018-block temple. Invite ambition explicitly; never cap
   size or ornament unless that is the thing under test.
2. **"Be colorful" ≠ good color.** A bare instruction to use color drove *over-saturated,
   garish* facades — many hues, no hierarchy. Color needs a **rationale**: a dominant +
   supporting + accent scheme with a named harmony (analogous / complementary / triadic), not
   just permission. Ask for color *theory*, not color *quantity*.
3. **Visual self-critique sharpens craft but drifts to convention.** One multimodal revision
   (render → see → re-emit) clearly improved proportion and geometry and added a real pediment,
   and it *reined in* over-coloring well — but it converged the palette toward a safe,
   conventional white/blue/gold. Use it as a "tighten & make tasteful" pass; guard against
   blandness (tell it to *preserve* boldness).
4. **Grounding before generation (testing).** Shooting straight into block placement yields
   shallow, generic results. Hypothesis: a **design-document-first** stage — lore/setting, the
   architectural *reason* a temple of that tradition looks that way, a color-theory palette,
   motifs, features, proportion — *finalized before building* — raises quality. (Benchmark
   approach `v2-designdoc`; result pending in the log below.)
5. **Granularity: facade + frontal shot.** Full builds with multi-phase iteration ran 30+ min;
   a single facade photographed head-on (`view: azimuth 0, elevation 0`) generates in ~one
   short call and is directly comparable run-to-run. Keep the benchmark at facade scope.
6. **The medium caps geometry.** Voxels make true curves/entasis impossible; results default to
   "45° at best." Push explicitly for varied roof pitch via slab+stair combos, stepped
   curves/arches, and `voxel`+block-`state` trim — but accept a hard ceiling vs. code-generated
   builds (mc-bench often has the model write a *program*; our declarative contract does not).

## Tunable parameters (and what's actually reachable)

- **`claude -p` exposes no `--temperature`.** The subscription shim can't vary it. True
  temperature sweeps need the **metered API path** (API key) — a cost/quality trade to decide
  before running them.
- **`--effort`** (reasoning effort) is the available deliberation knob on `claude -p`, and is
  plausibly more impactful for design than temperature. **`--system-prompt`** can inject a
  persona/grounding.
- Record `model` / `effort` / `temperature` / `seed` per run (in `summary.json`) so any
  variation is attributable. The approach label captures the *strategy* (single-shot vs
  multimodal-revision vs design-doc-first).

---

## Attempt log (newest last)

### Temple (full build) · `v0-singleshot` · 2026-06-04
Uncapped, detail-inviting prompt after diagnosing the hobbled house brief.
- **Result:** 8,018-block classical temple (colonnade, stylobate, gabled roof). 1 call, ~$1.01.
- **Worked:** removing the size/ornament cap — the model has the capability when invited.
- **Didn't:** still blocky ("mostly 45°"); no color (monochrome quartz under classical insistence);
  full builds too slow to iterate.
- **→** Pivot to facades + frontal shot; loosen style; nudge color. (Principles 1, 5, 6.)

### temple-facade 001 · `v0-facade` · 2026-06-04
Open style + "be colorful" single-shot facade, head-on render. (2,908 blocks, 1 call, $0.76.)
- **Result:** a busy, eclectic facade — teal/orange columns, gold, green entablature.
- **Worked:** fast; genuinely colorful (escaped the quartz trap); readable frontal framing.
- **Didn't:** **very basic; weak color theory** — many hues without hierarchy; proportion crude.
- **→** "Be colorful" overshoots into garish; color needs a justified scheme. (Principle 2.)

### temple-facade 002 · `v1-multimodal` · 2026-06-04
Draft → render head-on → critique prompt → re-emit improved. (1,820 blocks, 2 calls, $1.69.)
- **Result:** cleaner, well-proportioned — fluted white columns, blue bays, gold trim, a proper
  pediment, tidy base. (`round-0.png` = draft, `render.png` = revised.)
- **Worked:** the revision **reined in over-coloring** and improved proportion, geometry, and the
  crowning element — "decent moves".
- **Didn't:** palette converged to a conventional white/blue/gold (lost the draft's boldness).
- **→** Self-critique = good tightening pass, but tends to convention. (Principle 3.)

### temple-facade 003 · `v2-designdoc` · (pending)
Design-document-first: write a finalized design doc (lore, architectural rationale, color-theory
palette, motifs, features), then build from it. Testing Principle 4.
- **Result:** _(to be filled after the run — render.png + design-doc.md in the run dir)_
