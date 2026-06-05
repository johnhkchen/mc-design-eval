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

> **🏆 Current state (categorical rubric `v2`, median-of-3) — supersedes the two `v1`-era banners below.**
> Reference-grounding + a *constrained* 2nd pass moved a Taj build **competent → strong (3/3 unanimous,
> run 014)** — the first `strong` overall and a direct refutation of the old "no technique reliably moves
> the score" correction (that was a *metric* failure: the v1 1–5 mean saturated at 4, noise ≈ 0.4; the
> categorical rubric resolves what numeric couldn't, and names the lagging dimension per build). The
> load-bearing wins are **P11–P15** below; the v1-era banners are kept for history but their pessimism is
> retired. **`detail` is now the single lagging dimension** — strong on proportion/color/fidelity, only
> detail still competent. See P15 for the open frontier.
>
> **⚠️ Measurement caveat — `detail` is boundary-noisy, but the variance is PARTLY a real lever.** The
> fixed champion config scored `detail` *competent* in run 014 and *strong* in run 015 (identical prompts,
> different generation; both judged 3/3 unanimous). Part of that gap is attributable, not random: run 015
> chose a **noisier-grained block texture**, which reads as more detail — a real but small lever. So
> detail variance is partly an *exploitable signal* (block-texture grain, alongside structural relief) and
> partly irreducible generation noise. Experiments should treat **block texture as a deliberate detail
> variable**, while still not crediting the residual noise: require a detail win to be robust (strong
> across ≥2 generations, or a describable articulation/texture delta vs a baseline render), not a one-shot
> category flip. Judge-sample unanimity does not capture generation-level variance.
>
> **🎯 Rubric update — `exceptional` sharpened into a rightfully-rare apex.** Per the E-08 plan (seek
> strong→exceptional via richer anchors, NOT Elo — no public judging pool), the judge's `exceptional`
> tier is now demanding and explicitly rare for every dimension (≈1-in-10, "you would screenshot it", no
> nameable improvement; proportion = every measure inevitable, color = becomes the identity, detail = no
> flat field anywhere, fidelity = a namable landmark). The **weak/competent/strong boundaries are
> UNCHANGED**, so prior scores (incl. 014/015 `strong`) remain comparable — only the top bar rose.
> `exceptional` is now the loop's real climb target above strong, frozen for the run.

> **⚠️ Measured correction (rubric `v1`, 3-sample mean) — the metric contradicts the impressions below.**
> Scoring all four runs with the LLM-judge gives overall: v0 = **4.0**, v1 = **4.0**, v2 = **3.0**,
> v3 = **3.0**. The "design-doc is a huge jump" narrative (P4) is **not supported** — the *conventional
> colonnades* (v0/v1) scored *higher* than the creative invented-style design-docs (v2/v3), partly
> because exotic styles read less "unmistakably temple" on the **fidelity** dimension. **No prompting
> technique reliably moved the score; all cluster 3–4.** The one robust, technique-independent finding
> is the structural ceiling (P7). Treat the impression-based log entries below as hypotheses the rubric
> has now partly falsified — this is exactly why we built the judge.
>
> **Rubric caveat:** `fidelity` rewards an *unmistakable, conventional* temple, which **penalizes
> creative/exotic interpretation** — possibly in tension with the creativity goal. Decide consciously
> whether the rubric should reward convention or invention before trusting cross-style comparisons.

> **🏁 Verdict (CORRECTED — the plateau was premature; the "ceiling" was our cap).** The recurring
> failure (shallow relief + awkward crown) was a **self-inflicted prompt cap**, not a capability
> limit: *every* build pinned its depth to our "relief ~4–6" cap (actual z = 5–7) and its width/height
> to the prompt's limits. Lifting them (`v4`: width ~48, height ~40, **depth up to ~16**, deep relief
> + a full-width proportioned crown *required*) moved a design-doc build **3.0 → 4.0** — depth actually
> used = **15** — at *lower* cost ($0.91). The harness was **not** plateaued; resolution was untapped
> headroom. Best-of-N (P8) "failed" only because it sampled *capped* candidates. **Current band ≈ 4.0**
> (v0/v1/v4); **`detail` (3.33) is now the lagging dimension.** Whether 4→5 is reachable by prompting
> needs the finer **pairwise/Elo** metric (absolute-1–5 noise ≈ 0.4 can't resolve it). Two standing
> caveats: the pairwise metric, and decide **convention vs. invention** (`fidelity` rewards an obvious
> temple). Keep mining the harness before any ceiling raise.

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
4. **[CONTESTED by the rubric — see the Measured correction above.]** Ground before generating.
   Writing a *finalized
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
7. **The "structural ceiling" was a self-inflicted cap (CORRECTED).** Every build hit our relief
   cap *exactly* (depth z = 5–7 under a "relief ~4–6" prompt) and pinned width/height to the prompt's
   limits — then the judge dinged "shallow relief / awkward crown," which I misread as a capability
   ceiling and used to declare a plateau. Lifting the caps and *requiring* deep relief + a full-width
   proportioned crown (`v4`) used depth **15** and moved the score **3.0 → 4.0**. **P1 again: the model
   matched the bar we set.** Set scale and relief budgets generously and require their use; never
   mistake a cap for a ceiling. (Lesson for me: I declared a "capability ceiling" from runs that all
   sat at my own cap — check whether a recurring weakness is pinned to a prompt limit *first*.)
8. **Test-time selection (best-of-N) does not break the ceiling — plateau confirmed.** Best-of-4
   (4 parallel design-doc candidates, judge-selected) gave candidate overalls 4.0 / 3.67 / 3.33 / 3.0;
   the winner re-judged at **3.67** — the *same band as one cheap v0 (4.0, $0.76, fast)*. Selection
   bought **zero** quality gain at **~7× cost ($5.34)** and **~30× wall-clock (~29 min)** — and rate
   limits made the "parallel" K=4 run effectively serial, so the free-iteration economics hold for
   dollars but **break on wall-clock**. The structural ceiling (P7) caps the best sample too. Scaling
   test-time compute on this harness is a dead end; the next lever is the ceiling raise, not more
   sampling or prompting. **(Scope corrected — see P7/Verdict:** best-of-N sampled *capped* builds, so
   it couldn't beat the cap. Selection wasn't the lever; **resolution** was. Re-test best-of-N over
   *high-res* builds before concluding test-time selection is dead.)
9. **You can't stack quality dimensions in one monolithic pass — they trade off.** Pushing surface
   ornament hard (`v5`: fluting, dentils, coffers, "2–3 blocks per material for micro-texture")
   *backfired*: overall **4.0 → 3.33**. `detail` didn't move (3.33), **color crashed** (4 → 2.67 — the
   "related blocks" micro-texture collapsed into a near-monochrome orange field with no hierarchy), and
   the model **traded relief depth away** (15 → 10) to afford the ornament. A single hand-authored JSON
   has a fixed budget; ask for more of one thing and it robs another. This is the strongest argument
   for **incremental structured I/O** (MCP tool-calls / a robust parser): build relief, palette, and
   ornament in separate validated passes, not one monolithic, budget-constrained blob. `detail` looks
   like the one genuinely sticky dimension under monolithic prompting — a prime target for the
   structured approach. (Also: a heavy prompt made the build stage return prose instead of JSON once —
   the seam now retries once on malformed output, but that is a band-aid; structured I/O is the fix.)
10. **The structured-output failures are NARRATION, not truncation.** Raw build output captured
    directly: the model leads with prose ("Looking at this, I'll build the Temple of …"), then the
    JSON object, then a prose feature-summary. `stop_reason` was end_turn (never max_tokens), and the
    JSON itself is tiny (~98 ops) — the build never overflows, it *narrates*. Severity is stochastic:
    mild (recoverable), total (v5: "Done. The…", prose only), or confusing (vBAML: BAML's SAP
    mis-located the object → "missing style/palette"). A dumb `first-{ … last-}` brace-slice recovered
    the exact output SAP choked on — so the robust fix is **pre-slice to the brace span before
    parsing** (BAML's SAP is *not* a magic bullet for this prose-wrap; feed it the sliced object).
    Assistant-prefill with `{` would suppress the preamble entirely (future option). **[Resolved P11:
    Opus follows a strong instruction — `withSchemaInstruction` now forbids preamble explicitly and
    routes reasoning to `style.rationale`; the brace-slice + retry stay as backstops. Prefill rejected
    by the user: "Opus is very good at following instructions, just make the prompt reflect that."]**

11. **Tell the model what the SYSTEM already enforces — a silent invariant is a latent failure or a
    quality leak.** Three separate failures this session were the harness enforcing a rule the
    generation prompt never stated: (a) the voxel builder rejects unequal-delta `line` ops (a diagonal
    `[0,0,0]→[7,10,0]` has no unambiguous lattice voxelization) — crashed the build *and*, on a separate
    seam, the revision, until the constraint was written into both `facade.baml` and the JSON Schema's
    `linePlacement.description`; (b) recesses must be carved by *exclusion* (no air op) — burying a block
    behind a solid fill does nothing; (c) the brief demands color but the design-doc prompt told the
    model to copy the reference (P12). The fix each time was **surface the constraint into the
    prompt/schema that the generator sees**. Proactively audit every system-enforced invariant
    (`box`/`fill`/`voxel` geometry, the palette whitelist, valid block-state values, last-writer-wins
    overlap) and confirm the prompt states it. A constraint enforced only at validation/render time is a
    failure waiting to happen; one enforced only in the renderer's *behavior* (not the prompt) is a
    silent quality cap.
12. **A grounding reference supplies CRAFT, not COLOR — separate them at every stage.** A reference
    photo is a *visual* anchor that beats a text instruction: told to "derive the palette from the
    reference's actual colors," the model copied a white Taj to a near-monochrome white build, silently
    overriding the brief's explicit "distinctive, COLORFUL look" — and the leak was *upstream* at the
    design-doc stage, so the downstream revision faithfully kept the white. Splitting **craft**
    (proportion / massing / silhouette / relief / ornament ← reference) from **color** (← brief) at the
    design-doc *and* revision stages — "the reference is a CRAFT reference, NOT a color reference; color
    comes from the brief even if the reference is white" — restored colorful builds and drove `color`
    **competent → strong** (a real terracotta/gold/blue dominant-supporting-accent scheme). Generalizes:
    **when a strong exemplar conflicts with the brief on any axis, name which axis comes from which
    source** — don't let the image silently win every axis.
13. **A reference in a different DIMENSIONALITY than the target needs an explicit translation rule, not
    literal matching.** The Taj is a 3-D building whose minarets are freestanding at the plinth corners;
    told to "match the reference's silhouette," the model copied that literally and the minarets became
    **floating columns** in a single flat elevation — proportion regressed `strong → competent` (run
    013). The clause **"a facade is ONE connected plane; borrow the reference's RHYTHM, not its 3-D
    standalone parts; engaged masses bonded to the body, never freestanding pillars"** fixed it. Same
    shape as P11/P12: the model needs the translation rule made explicit, because the default is literal
    copying.
14. **The reference-compared 2nd pass is double-edged — net-positive ONLY once its freedom is fenced;
    A/B by judging both rounds.** The *same* revision regressed proportion in run 013 (detached masses)
    and *lifted* it `competent → strong` in run 014 (after the one-plane clause of P13) — it developed
    the crown (squat dome → proper onion dome) and refined the iwan arch while keeping masses connected.
    The way to *know* is to judge **round-0 AND the post-revision render** and compare per-dimension;
    don't assume the later pass is better. A revision earns its third call only when its degrees of
    freedom are constrained (honor the doc + one plane + keep the brief's color). Refines P3 ("anchor the
    revision or it drifts") with a second failure mode: it also *over-converges on the reference* unless
    fenced.
15. **Quality dimensions fall one at a time, and `detail` is the last holdout.** Across the Taj arc
    (010 competent → 014 strong) proportion, color, and fidelity all reached *strong*; **`detail` stayed
    competent** — large flat brick/niche/plinth fields persist, and the "NO LARGE FLAT FIELDS" prompt
    clause helped *less* than the structural one-plane clause. This echoes P9 (you can't stack all
    dimensions in one monolithic pass — they trade off a fixed JSON budget). The likely path to
    *exceptional* detail is a **dedicated, fenced ornament pass** (structured/incremental I/O) that
    *only* adds surface relief to flat fields without spending budget elsewhere — not another global
    "add more detail" instruction.

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

### temple-facade 005 · `vN-bestof` (K=4) · 2026-06-04
Best-of-4 design-doc candidates, judge-selected (the test-time-selection / plateau test).
(2,273 blocks, **$5.34**, **~29 min** wall-clock, 126k/124k tok.)
- **Candidate overalls:** 4.0 / 3.67 / 3.33 / 3.0 → winner re-judged **3.67**.
- **Result: the plateau held.** The best of 4 lands in the *same band as a single v0* (4.0, $0.76,
  fast). Selection bought no quality gain at ~7× cost and ~30× wall-clock; rate limits serialized the
  "parallel" run; the winner still shows the universal shallow-relief + awkward-crown weakness.
- **→** Test-time selection does not break the structural ceiling (P8). The harness-efficiency phase
  is plateaued — image-to-voxel ceiling raise is the justified next move (after a finer metric).
  **[Superseded by run 006 — the "ceiling" was a resolution cap; not plateaued. See Verdict / P7.]**

### temple-facade 006 · `v4-designdoc-highres` · 2026-06-04
Same design-doc stage as v2; the build prompt LIFTS the scale/relief caps and REQUIRES deep relief +
a full-width crown. (9,376 blocks, **$0.91**, depth **15** vs v2's 7; W=48, H=40.)
- **Result: the cap was the ceiling.** Overall **3.0 → 4.0** (proportion 3.33→4, color 3.67→4,
  fidelity 3.67→4). The build genuinely used the depth — recessed portal, projecting pilasters, a
  stepped full-width crown — and cost *less* than capped v2.
- **Didn't:** `detail` only 3.33 — now the lone lagging dimension at the 4.0 band; 4.0 ≈ v0/v1, so it
  matched the best band rather than exceeding it.
- **→** The "structural ceiling" (P7) and the plateau verdict were premature — a self-inflicted cap.
  The harness still has headroom. Next: probe `detail` at high-res, and move to a pairwise metric to
  see whether 4→5 is reachable.

### temple-facade 007 · `v5-designdoc-detail` · 2026-06-04
v4 high-res + a hard surface-ornament/micro-texture push (one variable: detail). (6,985 blocks, $1.07.)
- **Result: regression.** Overall **4.0 → 3.33**. `detail` unmoved (3.33), `color` crashed (4 → 2.67:
  micro-texture "related blocks" → a near-monochrome orange field), depth traded away (15 → 10),
  proportion 4 → 3.67. The ornament is visibly there (fluting, dentils, coffers) but reads as
  well-articulated *monochrome* — no contrast to register as "detail."
- **Note:** the heavy prompt made the build stage emit prose once ("Done. The …") instead of JSON;
  the seam now retries once on malformed output (band-aid; structured I/O is the real fix).
- **→** Single-pass quality dimensions trade off (P9). `detail` is sticky under monolithic prompting;
  v4 (4.0) remains the high-water mark. The next gain needs **incremental structured I/O** (MCP /
  BAML), not more stacked instructions.

### temple-facade 008 · `vRef-designdoc` · 2026-06-04
Design doc grounded in a REFERENCE PHOTO (Sun Yat-sen Mausoleum) via multimodal input, then the v4
high-res build. (153 ops → 20,311 blocks, $1.64.)
- **Result: the visually strongest run — but the rubric can't prove it.** The doc *read* the photo
  and derived its palette ("complementary, cool blue vs warm gold over white" → `calcite` white,
  `blue_concrete` cobalt roof, `gold_block` inscriptions, `blue_glazed_terracotta` ridge) and its
  triple-arch + tiered-roof + stepped-base massing. The render is unmistakably mausoleum-grounded and
  the most refined facade yet. Overall **4.0 — same band as v4** (judge noise ~0.4 can't resolve it).
- **→** Reference grounding is a strong quality lever (imports a proven palette + proportion). The
  bottleneck is now the METRIC: the absolute 1–5 rubric saturates at 4 and can't rank vRef vs v4 —
  the **pairwise/Elo judge** is the gating next instrument. (`--ref` makes this concept-art-ready.)

### temple-facade 010 · `vRefRevise-designdoc` (Taj Mahal) · 2026-06-04
Reference-grounded design doc → build → a 2nd pass that compares the build to the reference and
improves toward it. (10,566 blocks, $2.09; categorical judge v2.) **Result: `overall = competent`**
(proportion *strong*, fidelity *strong*, color *competent*, detail *competent*; per-sample
competent/competent/strong).
- **The 2nd pass optimized the wrong target.** It made the build markedly more Taj-like (cleaner
  massing, banded minarets, proper recessed iwan → *strong* proportion+fidelity) but **regressed to
  near-monochrome white**, losing the warm terracotta fields that round-0 actually had. The judge
  caught it unprompted: *"the brief explicitly asks for a COLORFUL scheme, and this is essentially a
  white build… reads close to monochrome."*
- **Root cause is upstream, not the revision.** The design doc *itself* committed to "Near-
  **monochromatic white**" because `composeReferenceDesignDocPrompt` said "derive the palette from the
  reference's actual colors" — a white Taj → white palette, silently overriding the brief's explicit
  "distinctive, COLORFUL look." The revision then faithfully "honored the document." **A grounding
  image steals the brief's palette: the visual anchor beats the text instruction.**
- **→ Fix (commit 63b36ad):** separate **craft** (proportion/massing/relief/ornament → from the
  reference) from **color** (→ from the brief) at *both* the design-doc and revision stages. Reference
  reframed as "a CRAFT reference, NOT a color reference"; the revision now treats a build that drifted
  white as a regression to FIX. Re-run validates whether craft-grounding survives without the palette
  capture. Generalizes P-ref: ground form, never let a pale reference collapse the build to white.

### temple-facade 013 · `vRefRevise-designdoc` (Taj, craft/color split) · 2026-06-04
Re-run after commit 63b36ad (reference = craft, brief = color) + the line-op constraint fixes
(822b104 BAML, 00c1358 schema). **The color fix worked**: the doc opened "the reference is white —
information, not mandate" and committed to teal/gold (Warped/Prismarine + gold portal) — colorful, no
white regression. But two new findings:
- **The 2nd-pass revision REGRESSED proportion (`strong → competent`).** Judged both rounds: round-0
  (pre-revision build) = proportion **strong**, the post-revision render = proportion **competent**;
  every other dimension identical (color/detail competent, fidelity strong, overall competent for
  both). The revision **detached the columns from the wall** into freestanding pillars, breaking the
  integrated bay rhythm round-0 had. **round-0 was the better artifact; the revision actively hurt
  it.** The 2nd pass is double-edged (cf. v3 lesson), now with direct A/B evidence.
- **Why it detaches: a 3-D building reference doesn't map onto a flat facade.** The Taj's minarets are
  genuinely freestanding at the plinth corners; told to "match the reference silhouette," the model
  copies that — and in a single elevation those minarets become floating columns. Literal silhouette-
  matching to a 3-D reference is wrong for a facade.
- **New ceiling on color:** even colorful, the judge reads teal+gold as "a single cool family, not a
  dominant/supporting/accent scheme" (the doc's violet/Purpur accent got dropped in build/revision).
- **→** Best config for the Taj so far is **vRef craft/color split WITHOUT the 2nd pass** (= round-0:
  strong proportion + colorful). Candidate instrument fixes: (a) judge both rounds, keep the better
  (treat the revision as a candidate, not a mandate); (b) revision prompt must forbid detaching
  integral masses — a facade is ONE connected plane; (c) carry the doc's full accent set into the
  build so color clears "single family". P10/narration + line-op seams both held this run.

### temple-facade 014 · `vRefRevise-designdoc` (Taj, one-plane + no-flat-fields) · 2026-06-04
Re-run after commit 2b430bc (revision: a facade is ONE connected plane, integrated bays not
freestanding pillars; build+revision: NO LARGE FLAT FIELDS). **First `overall = strong` — and
unanimous (3/3 samples).** (10,013 blocks, $1.64.)
- **The 2nd pass finally EARNED its keep.** A/B by judging both rounds: round-0 = proportion
  *competent*, post-revision render = proportion **strong** — the exact inverse of run 013, where the
  revision *regressed* proportion. The one-plane constraint stopped the column-detaching: the revision
  now develops the crown (squat dome → proper onion dome on a drum) and refines the iwan arch while
  keeping every mass bonded. Net-negative → net-positive from a single prompt clause.
- **Color reached *strong*** (was competent): the craft/color split produced a real multi-hue scheme —
  terracotta brick dominant, gold supporting, lapis-blue accent — read as a true dominant/supporting/
  accent harmony, not "a single cool family". Craft from the Taj (massing, dome, iwan), color from the
  brief: working as designed.
- **Remaining ceiling = detail (still *competent*).** The no-flat-fields clause helped less than the
  one-plane clause; brick fields and niche interiors still read somewhat flat. Detail is now the
  single dimension between *strong* and *exceptional* — the next lever.
- **Score arc across the Taj runs:** 010 (copy-everything, white) competent → 013 round-0 (craft/color
  split) competent, revision regressed → **014 strong (3/3)**. The wins were all "tell the model what
  the system/brief already requires": color≠reference, lines are lattice-constrained, a facade is one
  plane.

### vBAML (parked) · BAML as a token-efficient library over claude -p
Modular API spike: `b.request` renders a TERSE `output_format` (whole prompt ~551 tok vs our ~2,077-
tok JSON Schema) and `b.parse` SAP-parses — both proven on the subscription via `claude -p`. The
full high-res run FAILED because SAP mis-parsed the narration-wrapped output (P10); fixed by
pre-slicing the brace span before `b.parse`. Input-token win is real; revisit when token cost bites.
