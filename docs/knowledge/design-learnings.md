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
3. **Self-critique sharpens craft; anchor it to the design doc or it drifts bland.** A *generic*
   "improve it" revision (v1) tightened proportion/geometry but converged the palette toward a
   safe white/blue/gold. Anchoring the revision to the finalized design document — "honor the
   palette, motifs, and concept; do not genericize" (v3) — keeps the craft gains *without* the
   bland drift: run 004 cleaned the cornice, the recessed portal, and the column rhythm while
   preserving the teal↔amber scheme. **Never run a bare "improve it"; always anchor the revision
   to the doc.** (Cost: the revision is a 3rd call for an incremental gain over an already-strong
   v2 — use it when polish matters.)
4. **Ground before generating — the biggest single lever (confirmed).** Writing a *finalized
   design document* first — lore; the architectural **reason** the temple looks that way; a
   color-theory palette (dominant / supporting / accent + named harmony + a reason for restraint);
   motifs; features; proportion ratios — then building *from it* produced the best result by far:
   a coherent, identity-rich facade with **tasteful** color. It hit the color sweet spot that
   "be colorful" (garish, P2) and pure self-critique (bland, P3) both missed, and cost *less*
   than the multimodal revision. The build faithfully realizes a good doc. **Make
   design-doc-first the default**; reasoning is cheaper and more effective than re-generation.
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

### temple-facade 003 · `v2-designdoc` · 2026-06-04
Design-document-first, then build. (1,372 blocks, 2 calls, $1.08 — *cheaper* than v1.)
- **Result:** "Temple of the Hidden Spring" — an invented Maqari highland-desert *pishtaq* facade:
  ochre sandstone body, cream framing, a recessed turquoise glazed *iwan* with an eight-point-star
  motif, flanking blind niches, stepped merlon cresting, one gold finial. (`design-doc.md` = the
  reasoning; `render.png` = the build.)
- **Worked — the best result yet, by a clear margin.** The doc produced *real color theory* (a
  restrained **complementary** ochre↔turquoise + analogous gold scheme, with a stated reason for
  the restraint), a distinctive cultural identity, recurring motifs, and proportion ratios — and
  the build *faithfully realized* all of it. Colorful **and** tasteful: the sweet spot v0 (garish)
  and v1 (bland) both missed. And it was cheaper than the multimodal revision.
- **Didn't:** still blocky; the "arches" are stepped turquoise panels, not true pointed arches
  (voxel/medium limit, P6); geometry could be tighter.
- **→** Grounding before generation is the strongest lever found (P4 confirmed, now default).
  Next: design-doc-first **+** a multimodal tightening pass (combine P3 + P4) to also clean the
  geometry — does grounding survive a revision without going bland?

### temple-facade 004 · `v3-designdoc-revise` · 2026-06-04
Design-doc → build → **identity-preserving** multimodal revision. (3 calls, 959 blocks, $1.80.)
- **Result:** "Temple of the Tidewright" — teal-glaze body, sandstone piers, white dentil cornice,
  amber-gold finial/lintel, a recessed central portal. (`round-0.png` = the build; `render.png` =
  the revised final.)
- **Worked — grounding SURVIVED the revision.** The revision tightened geometry, proportion, the
  cornice, and the recessed portal *while keeping* the teal↔amber palette and concept — none of
  v1's bland drift. Answers the open question: yes, *if* the revision is told to honor the doc.
- **Didn't:** the revised facade is slightly more austere than its own round-0 (cleaner but a touch
  less vibrant); 3 calls = most expensive yet ($1.80); arches still stepped (P6); the gain over an
  already-strong v2 is incremental.
- **→** Identity-preserving revision is the most refined process, at higher cost (P3 updated). Open
  questions: is the 3rd call worth it vs just v2? And does higher `--effort` on the *doc* stage beat
  *adding* a revision? → an `--effort` sweep is the next axis (temperature still needs the API path).
