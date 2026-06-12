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

> **🌅 Morning brief — overnight chain S-006…S-009 consolidated (2026-06-05, T-014-01).**
> **Champion: UNCHANGED** — committed HEAD, the 015 "NO LARGE FLAT FIELDS" menu, `vRefRevise-designdoc`.
> **No lever promoted.** Categorical band the next chain starts from (median-of-3): overall **strong (3/3)**
> · proportion **strong** · color **strong** · fidelity **strong** · **detail competent** (the lone holdout
> / climb target). Exemplar render run 014 (Taj); re-confirmed off-domain on 019/021/022.
> **What moved:** nothing in the champion — a *confirmation* night. **P12** (color from brief) and **P13**
> (one connected plane) generalized to four new references (019 Hōryū-ji, 020 Sainte-Chapelle, 021 Arc, 022
> mausoleum), holding overall strong 3/3; P12 got its first partial *colorful-reference* datum (022 two-tone).
> **What didn't:** **detail** stayed competent (both dedicated detail levers failed — 016 relief panels flat,
> 017 texture grain regressed proportion). The two knob A/Bs **both completed but produced NO credible
> effect**: persona-ON (025) and effort-HIGH (026) each flipped **only `detail` competent→strong** vs their
> controls (023/024) — a single-dimension single-step move on the one P15 boundary-noisy dimension; two
> independent knobs producing the *identical* flip is the signature of generation noise, not two levers, so
> **neither is adopted** (effort-HIGH also cost +31% wall-clock for it). P14 regressed once (020).
> **Spot-check renders:** 020 round-0 vs render (the P14 regression — recessed portal+rose → flat gold slab);
> 021 render (the lone detail "lift" = whack-a-mole, gold around openings but a flat arch void); 022 vs 008
> render (cumulative progress on the founding reference).
> **Single next experiment:** a **whole-facade fenced ornament pass** (the P15 cure) — a detail-only revision
> that audits *every* plane wider than ~6 blocks and adds relief without spending budget elsewhere. It
> targets the sole lagging dimension (detail → exceptional). Cited run IDs: 008/014/016/017/019/020/021/022/
> 023/024/025/026.

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
    source** — don't let the image silently win every axis. **Scope (runs 013/019/020/021):** confirmed
    load-bearing across FOUR *pale* reference palettes — white (Taj), dark-timber (Hōryū-ji), pale-stone
    (Sainte-Chapelle), cream-limestone (Arc de Triomphe): in every case `color` reached `strong` from the
    brief, not the reference (run 021 doc: *"No white wall: the reference's pale stone is translated into
    warm desert stone"*). The *converse* — whether the clause is a harmless no-op under a *genuinely
    colorful* reference image — was **untested through run 021** (run 020 intended to test it but the
    supplied Sainte-Chapelle image was a grey-stone *exterior*; every reference through 021 read pale to the
    model). **Run 022 (Sun Yat-sen Mausoleum) supplies the first PARTIAL converse evidence:** a genuinely
    *two-tone* reference (saturated cobalt roof + white stone + gold), where reference and brief broadly
    *agree* on "be colorful." There P12 **held as a near-neutral no-op** — color came from a brief-
    structured blue↔gold↔vermilion scheme (pre-P12 run 008 *also* derived "blue-white-gold" off the same
    photo, so the reference simply hands you color) — **while its white-collapse half still mattered**: the
    dominant *material* area is white granite, and P12 is what kept the model from collapsing to it (blue
    became the dominant roof, white the field). **So under an already-colorful reference P12 is, so far,
    harmless-and-still-protective, not idle.** A *fully polychrome* reference test remains open (blue+white
    is two-tone, not polychrome), but the "is it a no-op under agreement" question is no longer wholly
    untested. **Scope: load-bearing across FOUR pale conflict references AND near-neutral-but-protective on
    ONE two-tone agreement reference (mausoleum, run 022).** **Chain verdict (T-014-01): PROMOTE / reinforce
    — four off-domain confirmations in one night (019/020/021/022), `color = strong` every time, no leak;
    the only open scope is the still-untested *fully-polychrome* reference (022 was two-tone, the closest
    yet).**
13. **A reference in a different DIMENSIONALITY than the target needs an explicit translation rule, not
    literal matching.** The Taj is a 3-D building whose minarets are freestanding at the plinth corners;
    told to "match the reference's silhouette," the model copied that literally and the minarets became
    **floating columns** in a single flat elevation — proportion regressed `strong → competent` (run
    013). The clause **"a facade is ONE connected plane; borrow the reference's RHYTHM, not its 3-D
    standalone parts; engaged masses bonded to the body, never freestanding pillars"** fixed it. Same
    shape as P11/P12: the model needs the translation rule made explicit, because the default is literal
    copying. **Generalized (run 019, Hōryū-ji):** the same clause, unmodified, also resolves *vertical*
    standalone parts — a freestanding five-storey **pagoda** folded into a crowning tiered spire on one
    connected plane (proportion held `strong` through the 2nd pass). P13 covers stacked-tier/tower
    references, not only lateral corner-towers — it is a rule about dimensionality, not about minarets.
    **Chain verdict (T-014-01): PROMOTE / reinforce — held across pagoda tiers (019), Gothic verticality
    (020), a single colossal opening (021), and stacked roof-eaves + battered wing-walls (022); proportion
    never regressed *from* the rule. Caveat: the detachment hazard itself was UN-exercised on 021/022 (those
    references have no freestanding parts), so the headline is corroborated there, not re-stressed.**
14. **The reference-compared 2nd pass is double-edged — net-positive ONLY once its freedom is fenced;
    A/B by judging both rounds.** The *same* revision regressed proportion in run 013 (detached masses)
    and *lifted* it `competent → strong` in run 014 (after the one-plane clause of P13) — it developed
    the crown (squat dome → proper onion dome) and refined the iwan arch while keeping masses connected.
    The way to *know* is to judge **round-0 AND the post-revision render** and compare per-dimension;
    don't assume the later pass is better. A revision earns its third call only when its degrees of
    freedom are constrained (honor the doc + one plane + keep the brief's color). Refines P3 ("anchor the
    revision or it drifts") with a second failure mode: it also *over-converges on the reference* unless
    fenced. **Chain verdict (T-014-01): SCOPE — reference-dependent ≈coin-flip; this chain held/lifted
    019/021/022 and regressed 020 (`strong → competent`: a recessed portal + rose traded for a flat gold
    slab). Running tally: helped 014/019/021/022, regressed 013/017/020. The standing "judge both rounds,
    keep the better" fix is now strongly indicated and *symmetric* — it would keep the render on 021
    (detail-lifted) and round-0 on 020 (regression-guarded).**
15. **Quality dimensions fall one at a time, and `detail` is the last holdout.** Across the Taj arc
    (010 competent → 014 strong) proportion, color, and fidelity all reached *strong*; **`detail` stayed
    competent** — large flat brick/niche/plinth fields persist, and the "NO LARGE FLAT FIELDS" prompt
    clause helped *less* than the structural one-plane clause. This echoes P9 (you can't stack all
    dimensions in one monolithic pass — they trade off a fixed JSON budget). The likely path to
    *exceptional* detail is a **dedicated, fenced ornament pass** (structured/incremental I/O) that
    *only* adds surface relief to flat fields without spending budget elsewhere — not another global
    "add more detail" instruction. **The flat-field failure is whack-a-mole (run 021, Arc de Triomphe).**
    Pointed at the Arc's broad attic and spandrels — the literal fields the menu clause names — the lever
    *did* articulate them (gold-framed rondel band; gold spandrel/archivolt ornament). But the model then
    relocated blankness to the **largest unnamed surface**: the 2nd pass *enlarged* the central arch into a
    single huge flat blue void (same enlarge-a-feature move as run 020's gold pediment), and the brick
    flanks stayed plain. So a *named-field* clause clears the field you name and the blankness migrates;
    `detail` even flipped competent→strong on that run, but the notes confirm the broad fields stayed flat
    (the strong is dense ornament *around openings* + P15 boundary noise, not filled fields). This is the
    strongest argument yet that the cure is a **whole-facade** ornament pass that audits *every* plane
    wider than ~6 blocks, not a clause that lists example fields the model can satisfy locally while
    opening a new one elsewhere. **Chain verdict (T-014-01): REINFORCED; both dedicated detail levers
    DISCARDED — S-006 relief panels (run 016) left `detail` competent; S-010 texture grain (run 017) left
    `detail` competent AND regressed `proportion` strong→competent. Neither met the robust-lift promotion
    bar, so the champion is unchanged. New corroboration of the noise caveat: the persona (025) and effort
    (026) A/Bs EACH flipped only `detail` competent→strong vs control, and both treatment arms emitted MORE
    output (busier build) — two unrelated knobs producing the same single-`detail` flip, mediated by output
    size, is exactly the generation-noise / "busier-reads-as-detail" signature, NOT a real lever. The cure
    remains a whole-facade fenced ornament pass, not incidental verbosity or another menu clause.**

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

### temple-facade 019 · `vRefRevise-designdoc` (Hōryū-ji — generalization stress test, T-007-01) · 2026-06-05
**Generalization run, not a tuning run.** Ran the **champion as-is** (committed HEAD: the 015 "NO
LARGE FLAT FIELDS" detail menu) on a reference *deliberately unlike* the domed Taj that P11–P15 were
derived on: `references/horyu_ji.JPG` — the Hōryū-ji Kondō + **five-storey wooden pagoda**, a vertical
tiered timber complex with a **near-monochrome** dark-wood / white-plaster / grey-tile palette and two
**freestanding, fully 3-D** masses. Purpose: judge whether **P12** (color from the brief, not the
reference) and **P13** (a facade is ONE connected plane; borrow rhythm, not 3-D standalone parts)
*generalize* off-domain. Both are tested, not assumed.
- **Inherited-champion note (attribution).** Neither detail experiment promoted, so the champion is the
  committed 015 menu: S-006's relief panels (run 016 `detail=competent`) were never committed; S-010's
  texture-grain edit left the tree dirty but **run 017 regressed `proportion` strong→competent with
  `detail` still competent** — a non-promotion. Reverted that WT edit to HEAD before launch so this is a
  clean champion run, comparable to the 014/015 Taj baseline. (The P12 color-hold and P13 one-plane
  blocks are byte-identical across menu/texture variants anyway — orthogonal to this test.)
- **A/B (median-of-3, both rounds judged per P14; all samples unanimous):**

  | dim | round-0 (build) | render (2nd pass) |
  |-----|-----------------|-------------------|
  | proportion | strong | strong |
  | color | strong | strong |
  | detail | competent | competent |
  | fidelity | strong | strong |
  | **overall** | **strong (3/3)** | **strong (3/3)** |

  4,953 blocks, 31,809/47,581 tok, $1.52, 688s. The 2nd pass **held every dimension** (no lift, no
  regression); it restyled the body (open red colonnade + white bays + torii-like door → enclosed
  two-storey vermilion wall with white window insets) while preserving massing and palette.

- **P12 — HELD (generalizes to a monochrome reference).** The timber/white/grey palette did **not**
  leak. The doc opened *"white plaster, dark wood, gray tile — information, not mandate"* and committed
  to a vermilion-dominant / jade-green-eaves / gold-accent / grey-ground complementary scheme; the judge
  calls color *"the build's strength … a disciplined, classic palette."* This is the **strongest
  off-domain confirmation of P12 yet**: the Taj it was derived on was *white*; here the reference is
  white **+ dark wood + grey tile** (a fuller monochrome temptation, and timber is a "wooden temple
  obviously = brown" trap) and the craft/color split still held. **Verdict: P12 holds across reference
  palettes; no scoping needed.**

- **P13 — HELD (generalizes to a different dimensionality: vertical tiered → one plane).** No floating
  pagoda, no detached tiers, no sky between masses. The model translated the freestanding 5-storey tower
  into a **crowning tiered spire on a single connected elevation** ("fold the pagoda's diminishing
  tiered spire into the crown rather than copying it as a detached tower") and the freestanding Kondō
  into the body — exactly the borrow-rhythm-not-standalone-parts move. Crucially, **proportion stayed
  `strong` through the 2nd pass** — the *inverse* of Taj runs 013/017, where the reference-compared
  revision detached masses and regressed proportion. P13 was authored against *lateral* standalone parts
  (corner minarets); it generalized unmodified to *vertical, stacked* standalone parts (pagoda tiers).
  **Verdict: P13 holds; it covers stacked-tier/tower references, not only corner-tower references.**

- **Why both held off-domain without an edit:** P12/P13 are framed as *translation rules the model
  applies before generating* ("information not mandate"; "one connected plane; tiers fold into the
  crown"), not as Taj-specific facts. A rule generalizes; a fact does not. This is the same shape as
  P11/P12/P13's origin (the model needs the rule made explicit, then applies it to whatever reference
  it sees). **No prompt edit was warranted** (neither pre-registered trigger fired); `npm test` 133/133
  green throughout; tree left clean on the champion.

- **One real blemish (recorded, not a P12/P13 failure): a cross-form finial.** The gold crown renders
  as a Latin-cross-like shape atop an East-Asian pagoda massing; the judge flags it as *"an oddly
  syncretic signal that muddies the cultural identity."* It cost nothing categorically (`fidelity`
  stayed strong) but is a genuine identity slip — a *crowning-motif* hazard distinct from P12/P13. The
  build prompt asks for a "crowning element" generically; with an East-Asian reference the model reached
  for a cross-section finial. **Candidate future lever (not actioned, out of scope here):** the build/
  revision could ask the crown's *motif* to stay consistent with the reference's tradition. Filed, not
  fixed — this is a generalization run.

- **Detail held at `competent` (both rounds), as expected.** Large flat white window/wall panels persist
  ("undifferentiated white window panels read as empty"). Consistent with **P15** (detail is the lone
  holdout; the no-flat-fields *menu* clause helps less than structural clauses) and the P15 noise caveat
  (single generation; not the dimension under test). The texture-grain lever that *would* target this is
  S-010's, which did not promote — so the holdout stands.

**Net:** P11–P15's reference-grounding principles are **not Taj-specific** — they generalized in one
shot to a vertical, monochrome, multi-mass wooden-pagoda reference, holding `overall = strong (3/3)` on
both rounds. P12 (color) and P13 (one plane) are now confirmed across **palette** *and* **dimensionality**
axes. The remaining frontiers are unchanged: `detail`'s flat fields, and a newly-surfaced *crowning-motif
fidelity* hazard when the reference is strongly culturally marked.

### temple-facade 020 · `vRefRevise-designdoc` (Sainte-Chapelle — inverse-condition test, T-008-01) · 2026-06-05
**Generalization run, not a tuning run.** Ran the **champion as-is** (committed HEAD, 015 menu; tree was
already clean — **no revert needed**, unlike run 019) on `references/St_Chapelle.png`. 4,068 blocks,
33,106/66,402 tok, **$2.02**, 929s.

- **PREMISE DISCREPANCY — read this first.** The ticket framed Sainte-Chapelle as the **inverse of the
  Taj/Hōryū-ji conflict case**: a reference that is *"polychrome stained glass — already colorful, so
  reference and brief AGREE on color,"* predicting the P12 color-hold clause would be a **near-no-op** and
  color *"strong regardless."* **The provided image is not that.** `St_Chapelle.png` is the **EXTERIOR**
  of the chapel (Vincennes): **pale grey/cream limestone** under a dark slate-blue roof; the famous
  polychrome glass is an *interior* feature and reads from outside only as dark tracery voids. The
  stage-1 design doc confirms the model saw it as **pale**: *"The reference is pale honey limestone under
  a slate-blue roof — I take its structure, not its pallor."* **So this was a THIRD conflict-condition
  run (pale reference vs colorful brief), not the agreement case the ticket assumed.** The hypothesis
  *"P12 is neutral when the reference agrees"* is therefore **refuted on its premise — untestable on this
  image**, because the image never presented agreement.

- **A/B (median-of-3, both rounds judged per P14):**

  | dim | round-0 (build) | render (2nd pass) |
  |-----|-----------------|-------------------|
  | proportion | **strong** | competent |
  | color | strong | strong |
  | detail | competent | competent |
  | fidelity | **strong** | competent |
  | **overall** | **strong (3/3)** | **competent** |

- **P12 — HELD, and load-bearing (NOT neutral here).** `color = strong` in **both** rounds off a pale
  grey-stone reference: the doc took *structure not pallor* and committed to a warm split-complementary
  scheme — **terracotta-brick dominant, eggplant-purple roofs supporting, gold accent, blue glass
  secondary** ("genuinely colorful and harmonious, a Flemish/Hanseatic guildhall identity," per the
  judge). The color-hold clause **fired and worked**; it was not idle. **Verdict: P12 was additive, not
  neutral — scoped to pale references it now holds across THREE palettes (white Taj / dark-timber
  Hōryū-ji / pale-stone Sainte-Chapelle).** What the ticket actually wanted to test — neutrality under a
  *genuinely polychrome reference IMAGE* — **remains UNTESTED** (would need the Sainte-Chapelle *interior*
  or a similarly saturated exterior). Filed as the open P12 question; see scope note on P12 below.

- **P13 / one connected plane — HELD under Gothic verticality.** Nothing detached: the soaring 1.6:1
  massing, flanking turret-gables, pinnacles and finials all stayed **bonded into a single elevation** in
  both rounds (no sky between masses, no freestanding pillars). Gothic verticality did **not** break the
  one-plane rule. round-0 proportion = **strong**.

- **But the 2nd pass REGRESSED (P14's double-edge returns) — round-0 was the better artifact.** Unlike
  run 019 (where the revision held every dimension), here it dropped **proportion strong→competent,
  fidelity strong→competent, overall strong→competent**, holding only color/detail. *Why:* round-0 had a
  **deep recessed gold-voussoir portal + a central rose/oculus**; the 2nd pass **replaced them with a
  large flat gold pediment slab** — the judge's *"inert field … carries no relief or ornament … the one
  easy improvement I can name"* — and shrank the entrance to a small plain door. The revision substituted
  an articulated, well-proportioned crown for a blank panel. This is the **unfenced double-edge of P14**:
  given freedom, the revision over-converged on a simplified silhouette and *lost* round-0's best
  features. Direct A/B (round-0 strong, render competent) is exactly the evidence P14 says to collect.
  **Reinforces the standing candidate fix: judge both rounds and keep the better — the 2nd pass must not
  be assumed an improvement** (cf. runs 013, 017 regressions vs 014, 019 holds — it is reference-
  dependent and currently a coin-flip).

- **Detail / S-006 transfer to tracery — did NOT lift (competent, both rounds).** The dense Gothic
  tracery (rose medallion, lancets, crockets) was *present* but the **flat-field ceiling persisted** —
  round-0 had "large flat orange shafts and flat blue side panels"; the render concentrated the failure
  into the **one big flat gold pediment**. The S-006 relief-panel lever (un-promoted) did not transfer;
  consistent with **P15** (detail is the lone holdout; the no-flat-fields *menu* clause is weaker than
  structural clauses). Read with the P15 single-generation caveat.

- **No prompt edit.** Neither pre-registered trigger fired (color did not go monochrome; nothing
  detached). The regression is the *known* P14 double-edge + the P15 flat-field ceiling, not a new P12/P13
  failure — so a minimal generalizing edit was **not** warranted (this is a generalization run, not a
  tuning run). `npm test` 133/133 green; tree left clean on the champion.

**Net:** A pale-stone Gothic reference adds a third palette point confirming **P12 is robust and
load-bearing across pale references** (not neutralized) — but the ticket's *true* inverse hypothesis (P12
idle under a *colorful* reference image) is **still untested**, because the supplied image was a
grey-stone exterior, not the polychrome interior. The sharpest finding is **P14's double-edge resurfacing
hard**: an unambiguous round-0 `strong (3/3)` → render `competent` regression driven by the 2nd pass
trading a recessed portal + rose for a flat gold slab. The "keep the better round" fix is now strongly
indicated, not just noted.

### temple-facade 021 · `vRefRevise-designdoc` (Arc de Triomphe — single-opening generalization, T-011-01) · 2026-06-05
**Generalization run, not a tuning run.** Ran the **champion as-is** (committed HEAD, 015 menu; tree
already clean — **no revert needed**, like run 020) on `references/arc_de_triomph.JPG`: the Arc de Triomphe,
a Roman triumphal arch whose identity is a **single colossal opening** in a near-square pier-block —
**massing unlike any prior reference** (no minarets/towers like the Taj, no tiered pagoda like Hōryū-ji, no
soaring Gothic vessel like Sainte-Chapelle). Pale **cream-limestone** palette; broad flat **attic band**
(rondel/shield reliefs) and tall **spandrel panels** (concentrated high-relief groups) over otherwise plain
ashlar — i.e. the *classic flat-field structure* the ticket targets. 12,696 blocks, 30,973/71,671 tok,
**$2.13**, 1006s. Earlier strong run (009) re-run under the current champion (cumulative-progress check).

- **A/B (median-of-3, both rounds judged per P14):**

  | dim | round-0 (build) | render (2nd pass) |
  |-----|-----------------|-------------------|
  | proportion | strong | strong |
  | color | strong | strong |
  | detail | **competent** | **strong** |
  | fidelity | strong | strong |
  | **overall** | **strong** | **strong (3/3)** |

  round-0 perSample [strong, competent, strong]; render perSample [strong, strong, strong].

- **P12 (color) — HELD, load-bearing; a FOURTH pale-reference confirmation.** `color = strong` both rounds
  off a *pale cream-limestone* reference. The stage-1 doc ("Temple of the Solar Triumph") opened *"No white
  wall: the reference's pale stone is translated into warm desert stone"* and committed to a complementary-
  accented scheme — **Smooth Red Sandstone** dominant, **Polished Granite** supporting, **Gold** accent,
  **Lapis Lazuli** cold-strike (arch vault + attic recesses); both judges read it as "disciplined,
  committed, non-monochrome." So the model read the image as **pale** → this was again **conflict, not
  agreement**, and the color-hold clause **fired and worked**. P12 now holds across **four pale palettes**
  (white Taj / dark-timber Hōryū-ji / pale-stone Sainte-Chapelle / **cream-limestone Arc**). **The genuine
  agreement case — a truly polychrome reference IMAGE — remains UNTESTED** (every supplied reference so far
  has read pale to the model); still the open P12 question.

- **P13 (proportion) — HELD strong on the single-arch massing; but the detachment mode was UN-EXERCISED.**
  The lone-opening massing got a coherent, legible silhouette (plinth → great arch between framed side bays
  → coffer band + dentil/crenellated cornice); `proportion = strong` both rounds. Two notes: (a) the Arc has
  **no freestanding parts**, so P13's *detachment* hazard (the thing it was authored against on Taj minarets
  / Hōryū-ji pagoda tiers) was **never presented** — this run tests proportion-coherence on a novel massing,
  not detachment, so it only *lightly* corroborates P13's headline claim; (b) crucially the **2nd pass did
  NOT regress proportion** here — the *inverse* of runs 013/017/020 — even though it **oversized the central
  arch** (judge: "side bays feel squeezed against the oversized arch"), a sub-categorical blemish that did
  not cost a category. A single colossal opening is well within the champion's proportion competence.

- **Detail / attic + spandrel flat fields (the headline AC #2 read) — MIXED: the NAMED fields resolved, but
  the flat-field CLASS migrated; the categorical lift is partly P15 noise.**
  - **Attic band — RESOLVED:** both rounds render it as an **articulated row of gold-framed coffer/rondel
    panels** (the doc's rondel shields), not a blank wall. The detail clause filled the specific field the
    ticket named.
  - **Spandrels — RESOLVED:** gold archivolt + spandrel ornament flank the arch crown in both rounds.
  - **But a large flat field PERSISTS, relocated.** Both judges flag it: round-0 — "the large blue infill
    panels are unbroken flat fields … side bays … flat"; render — "the **enormous central tympanum is one
    large flat lattice field**, the brick side fields are fairly plain." The 2nd pass **enlarged the central
    arch** (the same enlarge-a-feature-into-a-flat-field move as run 020's gold pediment), so the dominant
    flat field became the **giant blue arch void** itself + plain brick flanks.
  - **Category:** `detail` went **competent → strong** across the 2nd pass — the **first time the revision
    LIFTED detail** (cf. it held competent on 014/019/020, never rose). Read with the **P15 noise caveat**:
    the render's unanimous detail=strong is driven by the **dense gold ornament around every opening**, not
    by the broad fields being filled (the notes confirm the broad fields stayed flat). So the honest verdict
    is **"named attic/spandrel fields resolved; flat-field class did NOT — it migrated to the arch void; the
    categorical strong is partly the known detail boundary noise,"** which is **consistent with P15**, not a
    refutation. The flat-field holdout is now best described as *whack-a-mole*: the lever articulates the
    field you name, the model relocates blankness to the largest unnamed surface (here, the oversized arch).

- **P14 (2nd-pass double-edge) — a HOLD/LIFT case** (held proportion/color/fidelity strong, lifted detail
  competent→strong; only cost the oversized-arch blemish, no category hit). Running tally: helped/held **014,
  019, 021**; regressed **013, 017, 020** — still reference-dependent (~coin-flip), but a clean "2nd pass
  earned its keep" point on a brand-new massing. The "judge both rounds, keep the better" fix would have
  kept the *render* here (detail-lifted) — so the fix is symmetric, not just a regression guard.

- **No prompt edit.** Neither pre-registered trigger fired (color did not go monochrome; nothing detached /
  no top-heavy attic). Detail was fenced out of the trigger set by design (expected P15 holdout, tuned only
  under the S-006/S-010 ≥2-generation gate, not patched off one run). `npm test` 133/133 green before and
  after; tree left clean on the champion (zero source diff).

**Net:** the champion's reference-grounding principles **generalize to a single-colossal-opening massing**
they were never derived on — `overall = strong` on **both** rounds, with **P12 confirmed across a fourth
pale palette** and **proportion holding through a 2nd pass that, for once, didn't regress it**. The sharpest
finding is on detail: the "NO LARGE FLAT FIELDS" lever **resolves the specific field you point it at** (the
attic rondels, the spandrels) but **does not eliminate the flat-field class** — the model relocates blankness
to the largest unnamed surface (here the oversized blue arch void), and the categorical detail=strong is
partly P15's known boundary noise. The flat-field ceiling is a *whack-a-mole*, reinforcing P15's call for a
**dedicated, fenced ornament pass over the whole facade** rather than a global "add more detail" menu clause.

### temple-facade 022 · `vRefRevise-designdoc` (Sun Yat-sen Mausoleum — cumulative-progress on the FOUNDING reference, T-012-01) · 2026-06-05
**Cumulative-progress measurement, not a generalization run.** Ran the **champion as-is** (committed HEAD,
015 menu; tree already clean — **no revert needed**) on `references/sys_mausoleum.JPG` — **the reference
that first proved grounding (run 008)**. Unique value: run 008 (`vRef-designdoc`, **no 2nd pass**) predates
*every* technique invented since — the craft/color split (P12), one-plane (P13), NO-LARGE-FLAT-FIELDS, the
high-res deep-relief build, the constrained 2nd pass (P14) — **and** was scored on the now-retired **v1
numeric (1–5 mean)** rubric. Same image, same brief, same seed (11); **only the accumulated pipeline
differs**. So this is the chain's one true "how far has technique moved a *fixed* reference" probe.
11,325 blocks, 32,038/42,093 tok, **$1.41**, 640s.

- **A/B (median-of-3, both rounds judged per P14; all samples unanimous 3/3):**

  | dim | round-0 (build) | render (2nd pass) |
  |-----|-----------------|-------------------|
  | proportion | strong | strong |
  | color | strong | strong |
  | detail | competent | competent |
  | fidelity | strong | strong |
  | **overall** | **strong (3/3)** | **strong (3/3)** |

  The 2nd pass **held every dimension** (no lift, no regression — like run 019, *unlike* the 020 Sainte-
  Chapelle regression) and made a real *qualitative* gain inside `detail=competent`: it added **framed
  recessed panels along the base/podium, pilaster strips between the bays, upturned gold roof-corner
  brackets, and a stronger gold string-course** over round-0's plainer walls. A constrained revision that
  develops the build without detaching anything — P14's good edge.

- **008-vs-now comparison (the headline) — read on two rubric-independent legs, because v1 numeric and v2
  categorical are NOT commensurable** (v1 saturated at 4, noise ≈0.4, "same band as v4"; v2 names the
  lagging dimension). **A "008's 4/5 → strong" equation would be invalid** — so:
  - **Leg 1 — failure-named (rubric-independent).** Run 008's own v1 judge named two concrete defects:
    *"the columned portico is shallow"* and *"the wide blank base register feels under-detailed."* The 022
    render **measurably improved both, without fully resolving either.** The base register is no longer
    blank — the 2nd pass gave it framed panels + a string-course + a stair surround (vs 008's plain wall);
    the portals are now framed recessed niches rather than a flush portico. **But** the judge still reads
    *"the wall plane and base are large flat fields with shallow, drawn-on relief rather than carved
    depth"* — so the *relief-depth / flat-field class* (008's underlying complaint) **persists as the lone
    holdout**, exactly the P15 ceiling. Cumulative verdict: technique moved the named defects from *absent*
    to *present-but-shallow*; it did not break the flat-field ceiling.
  - **Leg 2 — categorical on its own terms.** Under the v2 rubric that resolves what v1 couldn't, the
    mausoleum reaches **overall strong (3/3), both rounds** — proportion/color/fidelity strong, `detail`
    the named holdout. That places this founding reference in the **same strong band as the best Taj (014)
    and Hōryū-ji (019) runs**, and identifies *detail* as the one thing between it and exceptional —
    information the v1 4/5 (which dinged "detail 3/5" but couldn't say it was the *sole* gap) could only
    hint at. The cumulative gain the v2 instrument can actually *name*: **color became a disciplined
    dominant/supporting/accent harmony** (not just "uses color"), proportion got a coherent base→body→crown,
    and the 2nd pass articulated the base — while detail stayed the holdout 008 already had.

- **P12 — HELD, and this is the chain's FIRST mildly-colorful / partial-AGREEMENT reference.** Every prior
  P12 stress was a *pale* near-monochrome reference (white Taj / dark-timber Hōryū-ji / pale-stone Sainte-
  Chapelle / cream Arc) — all *conflict* cases. The mausoleum is genuinely two-tone: **saturated cobalt
  glazed-tile roof + white granite + gold tablets**. So reference and brief broadly *agree* on "be
  colorful" — the long-open **neutrality side of P12** (run 020 wanted it, never got it) finally gets
  **partial** evidence. The stage-1 doc ("Temple of the Cobalt Ascendant") is the tell: *"The reference
  hands me one true color — that cobalt roof — and I commit to it boldly rather than collapsing to its
  white walls,"* committing to a **blue↔gold complementary + vermilion** scheme. The render landed
  `color=strong` both rounds: *"a disciplined East Asian scheme of dominant pale stone walls, supporting
  cobalt tile roof, gold cornices/eave ornaments and vermilion doorways as accents — harmonious and
  culturally coherent."* **Nuance worth recording:** because the reference is *already* colorful, the
  color-hold clause did **less rescuing here than on the pale references** — note that pre-P12 run 008
  *also* derived a "blue-white-gold" scheme off this same photo and scored `color=4` (the reference simply
  hands you color). BUT P12's *white-collapse* half still mattered: the dominant *material* area is white
  granite, and the model could have collapsed to it (the Taj failure); instead it took the blue as the
  dominant *roof* and white as the *field*. **Verdict: P12 held; under a colorful reference it is at worst
  a harmless no-op (the brief gets its color anyway) and at best still prevents the white-collapse of a
  two-tone reference — the first (partial) confirmation of the colorful-reference side. A *fully*
  polychrome-reference neutrality test is still open (blue+white is two-tone, not polychrome).**

- **P13 — HELD (stacked-tier roof + battered wing-walls → one connected plane).** The reference's
  **double-eaved (two stacked) blue hipped roof** folded into a coherent **two-tier crown**, and the
  flanking **battered buttress wing-walls** became the engaged base/body — no floating roof tier, no
  detached wing, no sky between masses, in *either* round. Proportion stayed **strong through the 2nd pass**
  (the inverse of the 013/017/020 detach-and-regress pattern). P13 was authored on lateral minarets,
  generalized to vertical pagoda tiers (019), and now covers **stacked roof eaves + engaged buttresses** —
  it is a rule about *not detaching masses*, and it held. (The model stylized the battered walls as a
  rectangular body rather than reproducing their inward batter — a craft simplification, not a P13
  detachment failure.)

- **Detail — `competent` both rounds, the P15 holdout, as expected (NOT a trigger).** The 2nd pass *did*
  articulate the base (framed panels, pilasters, string-course) and the roof is genuinely rich (tile rows,
  gold dougong dentil course, upturned corner brackets) — but the broad white wall/base fields still read
  *"flat … shallow, drawn-on relief rather than carved depth."* This is the same lagging dimension run 008
  had (detail 3/5 then) and that every v2 run has had — read with the P15 single-generation caveat.
  Consistent with the run-021 *whack-a-mole* finding: relief concentrates where you point it (roof, niches)
  and blankness relocates to the largest unnamed surface (here the white wall planes).

- **No prompt edit.** Neither pre-registered trigger fired: color did not go monochrome/grey and was
  brief-structured (no color trigger); nothing detached and the 2nd pass held proportion (no proportion
  trigger); detail's flat-field persistence is the *expected* P15 holdout, explicitly fenced out of the
  trigger set (not a bug to patch off one run). `npm test` 133/133 green throughout; tree left clean on the
  champion.

**Net:** On the reference that *first proved grounding*, the accumulated technique moved run 008's two
named defects from **absent to present-but-shallow** (base register now panelled, portico now framed-
recessed) and lifted the build to **overall strong (3/3) on both rounds** under the categorical rubric —
the same band as the best Taj/Hōryū-ji runs — **but did not break the flat-field/relief-depth ceiling**,
which remains the single holdout 008 already had. The genuinely new datum is **P12's first colorful-
reference point**: under a two-tone (cobalt+white+gold) reference where brief and image *agree* on color,
P12 held as a near-neutral no-op that still guards the white-collapse half — the first partial evidence on
the neutrality question the chain has carried open since run 020. P14's 2nd pass, for the second run
running (019, now 022), *held* every dimension rather than regressing — the "keep the better round" fix is
indicated but the revision is genuinely reference-dependent (held 019/022, regressed 013/017/020).

### temple-facade 024 + 026 · `vRefRevise-designdoc` (Taj — `--effort` default-vs-high A/B, T-009-01) · 2026-06-05
**The deliberation-knob A/B.** `claude -p` exposes **no `--temperature`**; `--effort` (reasoning effort,
levels `low|medium|high|xhigh|max`) is the only deliberation tunable. Ran the **champion as-is** on
`references/taj_mahal.png`, **same seed (11)**, full 3-stage pipeline, twice: **024 = DEFAULT** (no
`--effort` flag — the genuinely unchanged path) vs **026 = HIGH** (`--effort high`). Rubric + brief
immutable. Both rounds judged per P14 (round-0 = build, render = 2nd pass), median-of-3.

- **Wiring (AC #1).** `--effort` was already plumbed into `requestText`/`requestTextWithImage` (stage 1)
  but **absent from the two artifact fns** the build/revision use. Added one guarded line —
  `if (effort) args.push("--effort", String(effort));` — to `requestDesignArtifact` and
  `requestDesignArtifactWithImage` (mirrors the existing `requestText` line; `effort===undefined` ⇒ args
  byte-identical ⇒ default path unchanged), and threaded a `--effort` flag through `run.mjs`
  (parseArgs → ctx → all 3 stage calls → `summary.effort`). **`npm test` 133/133 green.** Diff is the
  one-knob analogue of T-013-01's `--system-prompt` wiring.

- **A/B (categorical, both rounds of both runs):**

  | dim | DEFAULT 024 build | DEFAULT 024 render | HIGH 026 build | HIGH 026 render |
  |-----|:-:|:-:|:-:|:-:|
  | proportion | strong | strong | strong | strong |
  | color | strong | strong | strong | strong |
  | **detail** | **competent** | **competent** | **strong** | **strong** |
  | fidelity | strong | strong | strong | strong |
  | overall | strong | strong | strong | strong |

- **Cost.** Wall-clock **723s → 946s (+31%, 1.31×)**; output tokens **53,970 → 71,208 (+32%)**; build ops
  121→163, 2nd-pass ops 147→202. Higher effort bought a **busier, more verbose build** at a real latency
  premium; input-token footprint was flat, so the spend is all generation-side.

- **Verdict: NOT A REAL LEVER (do not adopt; effectively *not worth the latency*).** Only **one** of four
  dimensions moved (detail competent→strong, both rounds) — **below the pre-registered ADOPT bar (≥2 dims
  a full step, none regressed)** — and detail is **exactly the dimension Decision D down-weights as noise**
  (P15: the lagging flat-field holdout that swings run-to-run with build verbosity). The decisive evidence
  is the **cross-knob coincidence**: the *independent* persona A/B (run 025, T-013-01) flipped the **same
  single `detail` competent→strong** and **also** emitted more output. **Two unrelated knobs producing the
  identical lone-`detail` flip, both mediated by output size, is the "busier-reads-as-detail" generation-
  noise signature — not a deliberation effect.** The render notes confirm it: 026's broad iwan/wall fields
  still read flat ("little relief," "shallow"), the detail=strong coming from denser ornament *around
  openings*, not filled fields — the same P15 whack-a-mole. At **n=1**, a lone move in the noisy dimension
  at +31% wall-clock does not clear the noise floor. **No default changed.** A confirmer (n>1) could test
  whether `--effort high`'s extra ornament ever survives as *real relief*, but the prior is now strongly
  "no"; the cure for `detail` remains a **whole-facade fenced ornament pass** (P15), not incidental
  verbosity from a deliberation knob. Already distilled into P15 and "Tunable parameters" by the T-014-01
  consolidation: `--effort high` ≈ +31% latency / +32% output for **no robust rubric lift** on this config.

### Consolidation · overnight chain S-006…S-009 · 2026-06-05 (T-014-01 — synthesis, NOT a trial)
A distillation pass over the night's runs (no new trials; no champion tie to break, so no re-judge). The
chain ran, in dependency order: two detail-lever tuning experiments → four generalization runs → two knob
A/Bs. **Champion is UNCHANGED** (committed HEAD, the 015 "NO LARGE FLAT FIELDS" menu): nothing the night
tested cleared its promotion bar. Per-principle verdicts are recorded inline on **P12/P13/P14/P15** above
(`Chain verdict (T-014-01)`); the champion band + morning brief are the **🌅 banner** at the top of
Principles. This entry captures the runs that have **no standalone entry** of their own.

**Detail levers — BOTH DISCARDED (the night's hard negative; promotion rule from T-006/T-010 unmet).**

| story / run | mechanism | proportion | color | detail | fidelity | overall | outcome |
|-------------|-----------|-----------|-------|--------|----------|---------|---------|
| S-006 / 016 | relief panels | strong | strong | **competent** | strong | strong 3/3 | non-promotion; never committed |
| S-010 / 017 | texture grain | **competent** (regressed) | strong | **competent** | strong | strong (2/3) | non-promotion; **harmful to proportion**; reverted |

Neither moved `detail` to a robust *strong*; S-010 actively cost a category on proportion. The champion
stays the 015 menu and `detail` stays the lone holdout (P15). The likely real cure is a *whole-facade fenced
ornament pass*, not a menu clause or texture swap.

**Generalization runs — already journaled in full above (019/020/021/022); one-line recap for the index:**
- **019 Hōryū-ji** (T-007): strong 3/3 both rounds; **P12 held**, **P13 held** (pagoda tiers → one plane),
  2nd pass held every dimension.
- **020 Sainte-Chapelle** (T-008): round-0 **strong 3/3 → render competent** (the P14 regression — flat gold
  pediment slab); P12 held (pale stone, a *conflict* case, not the agreement case the ticket assumed — the
  image was a grey exterior); P13 held.
- **021 Arc de Triomphe** (T-011): strong both rounds, **detail competent→strong** on the render (whack-a-mole
  — named fields fill, blankness migrates to the oversized arch void); P12 held (4th pale palette).
- **022 Sun Yat-sen mausoleum** (T-012): strong 3/3 both rounds; **P12's first partial colorful-reference
  datum** (two-tone cobalt — near-neutral but still guards white-collapse); P13 held; cumulative progress on
  the founding-reference (run 008) moved its two named defects *absent → present-but-shallow*.

**Knob A/Bs — BOTH COMPLETED, BOTH show NO credible effect (not adopted).** Both finished during this
consolidation (the treatment arms were still running when the chain reached S-014). Median-of-3 final renders:

| knob | control | treatment | proportion | color | detail | fidelity | overall | cost / wall-clock Δ |
|------|---------|-----------|-----------|-------|--------|----------|---------|----------------------|
| persona (S-013) | OFF 023 | ON 025 | strong=strong | strong=strong | **competent→strong** | strong=strong | strong 3/3 both | $1.81→$2.18 |
| effort (S-009) | DEFAULT 024 | HIGH 026 | strong=strong | strong=strong | **competent→strong** | strong=strong | strong 3/3 both | $1.71→$2.14, **+31% wall-clock (+223s)** |

**Verdict: inconclusive, lean noise — adopt NEITHER as default.** Both knobs moved *only* `detail`, by *one
step*, on the single dimension P15 flags as boundary-noisy (competent↔strong at identical config — cf. 014 vs
015). Two *independent* treatments (an unrelated master-architect persona; a higher reasoning-effort token)
producing the *identical* single-`detail` flip is the signature of a shared confound, not two distinct levers
— and both treatment arms emitted more output (busier builds), so the bump tracks generation size, the known
"busier-reads-as-detail" effect, not deliberation quality. Per the pre-registered, effect-size-calibrated
rubric (T-013/T-009 design), a single-dimension single-step flip is *within noise → no credible effect*; a
confirmer (N>1 per arm, or round-0 attribution) would be required before crediting either, and effort-HIGH's
+31% latency makes it a poor trade for a noisy flip. **The wiring DID land** (additive, inert by default,
uncommitted in the working tree): `--system-prompt`/`system` param (T-013) and `--effort` (T-009) are plumbed
through `src/sdk-binding.mjs` + `run.mjs`; finishing or re-confirming each is one command + a judge.

---

## Stage-1 concept-art · input-variant matrix (E-09, T-015-01) · 2026-06-05

First run-the-test of the E-09 stage-1 concept chain (Nano Banana / Gemini Flash). **Goal:** pick the
strongest INPUT VARIANT for the concept generator — what we attach to the image model. Resolution held
CONSTANT at 48 blocks (not the variable). **Eyeball-only**; 17 cells generated against the current
`FacadeConceptPrompt`, no source/prompt change. Variants: **A**=[reference] only, **B**=[reference,
ourRender], **C**=[ourRender] only, **base**=[] (doc text only). References: taj, horyuji, chapelle, arc,
mausoleum (each with its `vRefRevise` design doc + prior prismarine render). Images under
`benchmarks/temple-facade/concepts/<ref>-<variant>-flash.png`.

**Decision: default variant = C (render only).** *Rationale, grounded in the images:* C was the only
variant that produced the required black segmentation background on all 5/5 references, whereas A failed
to white on `taj-A`/`horyuji-A` and B failed to white on `chapelle-B`/`arc-B` (a white backdrop merges
with the structure's light edges and, on `arc-B`, with the arch void itself — fatal for the downstream
TRELLIS segmentation this stage exists to serve). C's palette was doc-correct in every cell because it
refines *our own* render, which already obeys the doc — while A bled the reference's palette straight in
(`taj-A` rendered the dome in **white marble**, the exact color the doc deliberately refuses, in gold).
C cannot copy a reference it never sees, so it alone is immune to the figural-relief copying that gave
`arc-A` literal **gold human figures**. And C stayed voxel-honest — bold concentric block rings for the
`chapelle-C` rose window where `chapelle-B` slid into fine tracery filigree. C confirms the ticket's
prior; it wins on all three stage-1 targets at once (fidelity, inspiration-not-blueprint, voxel detail).

**Per-variant synthesis:**
- **Most voxel-honest → C.** Bold block ornament throughout; no filigree (cf. `chapelle-B`).
- **Most faithful (palette + massing) → C.** Doc palette in 5/5; A bleeds reference palette.
- **Best segmented → C.** 5/5 correct black bg; A and B each go white on 2/5.
- **A** — richest character but two hard failures: unreliable background (2/5 white) and literal
  reference-copying (white Taj dome; Arc human figures). Strong only when the reference is plain
  (`chapelle-A`, `mausoleum-A` were clean on black).
- **B** — "everything attached" did not dominate: the reference still dragged 2/5 to white, pulled in
  filigree (`chapelle-B`) and frieze text (`mausoleum-B`). The render didn't reliably win the tug-of-war.
- **base** — black bg both controls, but no architectural grounding and **text-prone** (`taj-base`
  produced calligraphy in the band). A weak fallback, not a default.

**Background reliability (the decisive axis):** A 2/5 white · B 2/5 white · C **0/5 white** · base 0/2.

**Prompt weaknesses observed (input to S-017):**
1. **Black-background demand is overridden by an attached reference photo.** Whenever a real-building
   photo is attached (A, and B), the model sometimes adopts the photo's neutral/white studio backdrop —
   4 cells total. Only C (no photo) was 5/5 black. S-017 should harden the black-bg clause specifically
   for the image-attached path, or accept that C's no-reference input is what makes segmentation robust.
2. **"NO text" is too weak for buildings with a signature inscription.** The mausoleum produced
   plaques/glyphs across A/B/C (`mausoleum-C` even rendered a garbled "GY/RU" Latin plaque); `taj-base`
   produced calligraphy. Strengthen to: replace any nameplate/inscription/calligraphy with a blank or
   rosette panel.
3. **Figural-relief copying survives the "inspiration only / no figures" clauses** when the reference is
   figure-heavy (`arc-A` gold human figures). Reinforces choosing an input (C) that never sees the photo.

**Net + next:** C is the recommended default — S-016 should lock it in `conceptart.mjs` and regression-
check all 5 references. S-017 inherits the three prompt weaknesses above (black-bg robustness, text
suppression, figure suppression), most of which only bite the reference-attached variants — a structural
argument for C beyond this matrix. `npm test` 133/133 green; no source/prompt/rubric edit this ticket.

**Why 016/017/023/024/025/026 have no standalone entries above:** they are non-promotions (levers) and
no-credible-effect completes (knobs) — recorded here by reference rather than as six separate write-ups, a
proportional record. Their `summary.json` files under `benchmarks/temple-facade/runs/<id>-vRefRevise-designdoc/`
are the durable evidence; every number above is reproducible from them.

**Net + next:** a confirmation night — the reference-grounding principles (P12/P13) generalized cleanly to
four new massings/palettes, but **detail did not move** and is now the *only* thing between the champion and
exceptional. Three dead ends were ruled out this chain (relief panels, texture grain, and — on noisy n=1 —
persona/effort knobs), all pointing the same way: the single recommended next experiment is a **whole-facade
fenced ornament pass** (detail-only revision auditing every plane wider than ~6 blocks). Cheap follow-ons:
land the "judge-both-rounds-keep-the-better" P14 fix, and re-confirm the two knobs with N>1 if their detail
flip is worth chasing. `npm test` 133/133 green; no rubric/brief edit.

## Stage-1 concept-art · default variant LOCKED (E-09, T-016-01) · 2026-06-05

**Lock:** `benchmarks/temple-facade/conceptart.mjs` now defaults to variant **C (render-only)** when
`--variant` is omitted (was `A`). C was the matrix winner (T-015-01): it is the only variant that
reliably yields a black background (cleanly segmentable for TRELLIS) and, seeing only our own
doc-grounded prismarine render, cannot copy a reference photo or inherit its palette. The header
comment records the lock; A/B/base are retained for matrix reproducibility and S-017.

**All-reference confirmation** (regenerated via the *defaulted* command — no `--variant` — Flash, 48
blocks; each cell logged `[C/flash]`, 1 img, confirming the default resolves to C):

- **taj — holds.** Black bg; gold dome (doc palette, not the reference's white marble), red sandstone,
  blue+yellow inlay, blue tile mosaics; disciplined massing on a plinth; cleanly segmentable. Matches
  matrix C (Hi/Hi/Hi).
- **horyuji — holds (on re-draw).** *First draw drifted to a white background* — the exact regression
  signal T-015-01 flagged to watch. A single re-draw came back **black**, so this is confirmed a
  non-deterministic lottery draw, **not a tendency** (the saved cell is black: two-story pagoda, red
  columns, teal roofs, gold brackets, stone plinth — doc-correct, clean). Logged because the prompt's
  black-bg demand is still only probabilistic; S-017's job to harden.
- **chapelle — holds.** Near-black bg; rose window as chunky concentric rings (no fine filigree —
  filigree was the chapelle-B failure, absent here); orange body, gold framing, blue; segments clean.
- **arc — weakened.** Black bg holds (the decisive axis), but **gold human figures appeared in the
  side niches** — matrix arc-C was abstract block niches. Figural-relief detail crept in even though C
  never sees the reference photo (sourced from our own render / the doc). Inspiration-not-blueprint
  axis weakened; segmentation unaffected. Feeds S-017 (figural suppression is a known prompt gap).
- **mausoleum — holds (with known caveat).** Black bg; doc palette (blue tiled roofs, white body, gold
  brackets, red doors); clean symmetric massing on a stepped plinth. The gold **nameplate plaque with
  glyph-like text** persists above the central arch — this is the reference-driven text weakness the
  matrix already recorded across *all* variants, not a C-specific regression. S-017 prompt fix.

**Net:** 4/5 hold cleanly; the lone white drift (horyuji) re-drew black, confirming the matrix's
"tendency, not lottery" basis; arc's figural niches are the one genuine weakening and even there the
black background (segmentation) survives. The lock on **C is safe to keep** — it remains the best
default on every reference. Two draws to watch, both already on S-017's list (probabilistic black-bg;
figural/text suppression) and neither unique to the locked default. `npm test` green.

## Stage-1 concept-art · segmentation + resolution hardened (E-09, T-017-01) · 2026-06-05

**Goal:** make every reference (default variant C, Flash, 48 blocks) pass two pipeline-critical
properties — **segmentation** (cleanly isolable subject) and **resolution discipline** (no sub-block
figures / text / filigree) — by tightening `baml_src/conceptart.baml` (`FacadeConceptPrompt`) only.
Eyeball audit (each PNG VIEWed). Inherited the three weaknesses S-015/S-016 flagged.

**Round-0 audit (default-C images, pre-edit):**

| ref       | segmentation                                   | resolution discipline                       |
|-----------|------------------------------------------------|---------------------------------------------|
| taj       | PASS (black, crisp)                            | PASS                                        |
| horyuji   | PASS (black, crisp)                            | PASS                                        |
| chapelle  | **FAIL** — bg dark *navy*, blue spires merge   | borderline — gable star/finial filigree     |
| arc       | PASS (black, crisp)                            | **FAIL** — gold human figures in both niches |
| mausoleum | PASS (black, crisp white)                      | **FAIL** — gold glyph nameplate above arch  |

**Prompt diff (3 clause tightenings in `FacadeConceptPrompt`, two iterations):**
1. **Figures (HARD LIMIT #1).** Added a doc-OVERRIDE + replacement target: "NO human, animal, or
   deity figures, NO soldiers … EVEN IF the document places statues or figures in niches/panels —
   render every such niche as a BLANK or bold ROSETTE panel, never a figure." (The HARD LIMITS block
   now opens by stating it overrides the design document.)
2. **Text (HARD LIMIT #2).** Named the specific offender + a frieze clause (added iter-2 after the
   glyph relocated): "… specifically NO nameplate, signboard, plaque, cartouche, or inscribed tablet
   … Friezes and bands carry plain color-blocking or bold rosettes ONLY — never a row of glyph-like
   square characters or symbol panels."
3. **Filigree (HARD LIMIT #3).** "… NO star-burst or thin spiked finials. Cap towers, gables, and
   pinnacles with a SIMPLE chunky block, not a fine spike."
4. **Segmentation clause.** "Background must be SOLID #000000 black — NEVER white, light, grey, navy,
   or any coloured/gradient backdrop … the OUTERMOST elements — spires, finials, pinnacles, roof
   crest — must be a bright, high-contrast palette color (e.g. gold or warm light stone), never a
   dark or dim one, so the top edge cannot vanish into the black field."

**Iteration note (a wording trap worth recording):** the *first* segmentation rewrite listed "white,
light stone" as example edge colors right next to the background instruction; chapelle **and**
mausoleum then drew on a **white background** (and mausoleum relocated its glyph into the door
frieze). Lesson: naming "white" anywhere near the background clause nudges a white backdrop. Iter-2
removed "white" from the edge examples and front-loaded an explicit "NEVER white/light/grey/navy"
ban — black returned on both. White bg is technically rembg-isolable, but it created a *light-on-
light* risk for the light-bodied mausoleum, so black is the safer, consistent target.

**Final audit (all 5 regenerated under the identical final prompt):**

| ref       | segmentation                              | resolution discipline                              |
|-----------|-------------------------------------------|----------------------------------------------------|
| taj       | PASS — black, crisp gold/orange/blue      | PASS — bold color-blocking, chunky mosaics         |
| horyuji   | PASS — black, crisp red/teal/white        | PASS — chunky finial; central panel a geometric medallion |
| chapelle  | PASS — black; gable/spire edges gold-framed (dark-on-dark gone) | PASS — chunky rose window, no filigree |
| arc       | PASS — black, crisp                        | PASS — niches now gold SUNBURST rosettes (no figures) |
| mausoleum | PASS — black, light body crisp on black   | PASS — rosette frieze, geometric roof medallion (no glyph text) |

**Verdict: all 5 references are cleanly segmentable AND resolution-disciplined** under the locked
default (C / Flash / 48). The figure leak (arc) and the legible-glyph/nameplate leak (mausoleum) are
closed at the root (prompt), not per-reference; the dark-on-dark merge (chapelle) is resolved by a
reliable pure-black background plus gold-framed outermost edges.

**Residual / watch:** generation stays non-deterministic — "held" means the prompt no longer invites
the leak and a fresh draw is clean, not a statistical guarantee. Two references (horyuji, mausoleum)
converge on a chunky **concentric-square / maze medallion** in the former-nameplate panel — this is
the intended "replace text with bold geometric ornament" behavior (block-scale, no legible letters),
recorded here so a future reviewer doesn't mistake it for residual glyph text. `npm test` 133/133
green. Prompt diff committed + client regenerated (`npm run baml:gen`); concepts saved under
`benchmarks/temple-facade/concepts/` (gitignored, reproducible).

## Stage-1 concept-art · CONSOLIDATION + stage-2 handoff (E-09, T-018-01 — synthesis, NOT a trial) · 2026-06-05

**Stage 1 of the E-09 image→3D pipeline is DONE.** This is the terminal section of the stage-1 chain:
it distills S-015 (input-variant matrix) → S-016 (lock default) → S-017 (harden segmentation +
resolution) into one durable record and states the contract stage 1 hands to stage 2 (TRELLIS). No new
experiment; no rubric/brief edit; no re-generation (the T-017-01 final audit, below, is the freshest
evidence and is already on record). The three predecessor sections above are the per-ticket trail;
this is the conclusion.

**Locked artifacts — confirmed this ticket (working tree clean against each commit):**
- `baml_src/conceptart.baml` — the strong, locked `FacadeConceptPrompt`, committed **33de8c8**
  (T-017-01). Carries all three hardening clauses: HARD-LIMITS-override-the-doc (figures → blank/
  rosette), named text offenders + frieze clause (nameplate/plaque/cartouche/glyph-row → blank/
  color-blocking), and pure-black bg + bright outermost edges.
- `benchmarks/temple-facade/conceptart.mjs` — default variant **C** (render-only), committed
  **565f32f** (T-016-01), matching the S-016 decision. A/B/base retained for matrix reproducibility.
- `baml_client/**` regenerated via `npm run baml:gen` (gitignored; source-of-truth is `baml_src/`).

**Best input variant = C (render-only) — and *why*, structurally.** C attaches only our own
doc-grounded prismarine render — never the reference photo. That single fact is the whole argument:
the two failure modes that *require* a photo to trigger become **impossible by construction** — C
cannot copy the reference's palette (A rendered the Taj dome in the doc-forbidden **white marble**;
C used the doc's gold), and C cannot copy figural relief (A grew literal **gold human figures** on the
Arc). And because nothing imports a studio backdrop, the background is reliably black. The matrix
*measured* this: background reliability — the segmentation precondition — was A 2/5 white · B 2/5
white · **C 0/5 white**. C also stayed the most voxel-honest (bold block rings for the Sainte-Chapelle
rose window where B slid into filigree). So C wins fidelity, inspiration-not-blueprint, and
segmentation simultaneously — not by scoring marginally higher, but because its no-photo input removes
the *mechanism* of the other variants' failures. B's "attach everything" did **not** dominate: the
reference still dragged 2/5 to white and pulled in filigree/text. The lesson generalizes — **for a
segmentation-critical concept stage, feed the model your own controlled render, not the wild
reference.**

**What makes a concept voxel-ready (the four criteria TRELLIS needs):**
1. **Isolated** — one subject, a head-on front elevation, centered with a margin on every side, fully
   visible (not cropped). No ground plane, shadow, sky, or surroundings.
2. **Cleanly-segmentable** — SOLID `#000000` black background (never white/light/grey/navy/gradient);
   the OUTER silhouette (spires, finials, pinnacles, roof crest) in **bright** palette colors so the
   edge can't vanish into the black; dark tones reserved for recessed interior areas only.
3. **Resolution-disciplined** — every feature a few whole blocks at ~48 wide. No sub-block figures,
   statues, text/glyphs, filigree, or thin finials. These are HARD LIMITS that **override the design
   document** — a niche the doc fills with a statue is rendered as a blank/rosette panel, not the
   literal motif.
4. **Faithful + colorful** — the doc's massing, proportion, style, and above all its **palette**; it
   is deliberately colorful, never a white or monochrome wall.

**The load-bearing prompt rules (do NOT remove these — each is tagged with the leak it closes):**
- **HARD LIMITS block opens by stating it OVERRIDES the design document.** Without this, figures the
  doc names in niches survive (arc grew gold figures even under variant C, which never saw the photo —
  the leak was the doc's own language, so the override is the only fix).
- **Name the specific text offender + a frieze clause.** "NO text" alone was too weak for
  inscription-bearing buildings (mausoleum produced plaques/glyphs across all variants). Naming
  nameplate/signboard/plaque/cartouche/tablet AND adding "friezes carry plain color-blocking or
  rosettes ONLY — never glyph-like square characters" was needed (the glyph relocated into the frieze
  after only the first was added).
- **Pure-black bg + bright outermost edges, in the same clause.** Black alone isn't enough — a
  dark-navy bg plus blue spires (chapelle) merged dark-on-dark; requiring bright (gold/warm-stone)
  outermost elements fixes the vanishing top edge.
- **Wording trap — keep "white"/"light" OUT of the background paragraph.** Listing "white, light
  stone" as example *edge* colors next to the background instruction caused chapelle **and** mausoleum
  to draw a **white background**. Front-load an explicit "NEVER white/light/grey/navy" ban and keep
  light-color examples away from the bg clause.

**Final audit (T-017-01, all 5 regenerated under the identical locked prompt — the standing evidence):**
taj ✓✓ · horyuji ✓✓ · chapelle ✓✓ · arc ✓✓ · mausoleum ✓✓ (segmentation ✓, resolution-discipline ✓
for each). This is why no re-generation was done here: a fresh single draw would only add
non-determinism risk on top of an already-clean audited set.

**Residual caveats (honest):**
- **Generation is non-deterministic.** "Held" means the prompt no longer *invites* the leak and a
  fresh draw is clean — **not** a statistical guarantee. horyuji drifted white once in T-016-01 and
  re-drew black. *If a reference regresses on a later run, redraw before re-editing the prompt.*
- **The former-nameplate panel converges on a chunky concentric-square / maze medallion** (horyuji,
  mausoleum). This is the *intended* "replace text with bold geometric ornament" behavior — block-
  scale, no legible letters — not residual glyph text. Recorded so a reviewer doesn't mistake it. A
  stricter bar would route that panel to a plain rosette explicitly.
- **No automated segmentation/resolution metric** exists — verification is human VIEW. If stage 1 is
  ever run at scale, a bg-purity histogram + a small figure/text classifier is the natural follow-on
  (out of scope here).

**Handoff to stage 2 (TRELLIS).** The locked stage-1 default (`conceptart.mjs` no-flag → variant C,
Flash, 48 blocks, `FacadeConceptPrompt` @33de8c8) guarantees TRELLIS a concept image that is
**isolated** (single front-elevation subject, centered with margin, no ground/shadow/surroundings),
**cleanly-segmentable** (pure-black `#000000` field with a bright high-contrast outer silhouette, so
rembg / TRELLIS's own masking lifts the subject without eroding edges or swallowing the void),
**resolution-disciplined** (block-scale ornament only — no sub-voxel figures, text, or filigree for
reconstruction to choke on or hallucinate depth from), and **faithful + colorful** (the design doc's
massing and palette, never a flat monochrome wall that would give TRELLIS no shape cues). In short:
stage 2 can consume the stage-1 PNG directly — segment it, reconstruct a clean voxel mesh from a
disambiguated subject, and trust that every feature it sees is meant to become whole blocks. Stage 1
is closed; the E-09 chain advances to TRELLIS reconstruction.

`npm test` 133/133 green. No source/prompt/rubric/brief edit this ticket — confirm-only synthesis; the
durable product is this section.

---

## E-10 worked example — canonical palette extraction (T-021-01)

The S-021 extractor (`src/color/palette-extract.mjs`, CLI `npm run palette:extract`) answers
"**which real blocks does this facade use?**" — decode → drop near-black background → cluster the
foreground in CIE-Lab → match each centroid to the nearest survival full-cube block (S-019 table via
the S-020 engine) → merge by block, sort by coverage. Run here on the locked stage-1 default
concept, **`taj-C-flash.png`** (1024², a baseline JPEG despite the `.png` name).

**Discover mode** (`--k 10`, full 305-block set) — *the canonical palette of the Taj facade:*

```
chiseled_red_sandstone 13% · dark_oak_log 13% · dark_prismarine 13% · gold_block 13% ·
orange_terracotta 13% · pumpkin 13% · lapis_block 6% · tinted_glass 6% · bookshelf 6% ·
mangrove_log 6%        (mean ΔE 6.2, over 51% of frame = foreground)
```

Reads true: warm sandstone/terracotta/pumpkin body, **gold_block** domes, **lapis_block** accents, a
**dark_prismarine** teal trim — a believable, buildable, survival-obtainable palette. Mean ΔE ≈ 6 is
a *good* fit (the worst single match is the dark-navy anti-alias halo between the black void and the
blue, → tinted_glass at ΔE 16). The image's invented/over-resolved colors are gone: every row is a
real block.

**Validate mode** (`--whitelist palettes/neoclassical.json`) — *score the facade against a declared
manifest:* the warm-stone/quartz neoclassical palette is a **poor** fit for the Taj's saturated
colors — **mean ΔE jumps to ~27**, gold collapses onto `glowstone` (ΔE 27), blues onto
`chiseled_stone_bricks` (ΔE 41). This is the **palette-vs-fidelity tradeoff made measurable**:
discover ΔE 6 vs validate-against-the-wrong-palette ΔE 27 is exactly the design lever the matcher was
built to expose. (21 stairs/slab/pane ids in the manifest aren't full-cube blocks, so they're
reported in `missing` and skipped — the table is full-cube-only by construction.)

**Two durable observations.**
- **Coverage is dyadic under median-cut, by construction.** A population-halving median split makes
  leaf coverages cluster around 1/8, 1/16… regardless of which box is split. Coverage only becomes a
  *dominance* signal after the same-block **merge** step — clearly visible in validate mode, where a
  constrained palette merges four gold-ish clusters into one `glowstone` row at 50%. For richer
  dominance weighting on flat fields, k-means (or a mean/largest-gap split) is the future lever; the
  metric/clusterer seams are already pluggable.
- **Background removal is a tolerance, not an equality.** The "pure-black `#000000`" stage-1 field
  decodes to `[1,1,1]`-ish under JPEG; an exact test would leak the whole margin into the palette.
  Default drop = within RGB-radius 24 of `dropColor`. Collateral: genuinely near-black *foreground*
  is also dropped — acceptable because the locked stage-1 prompt bans dark backgrounds and mandates
  bright silhouettes; `--drop none` opts out for non-black-bg inputs.

`npm test` 182/182 green (+16 over the E-10 color layer). The durable products are the extractor + CLI
and this worked example: a concrete "blocks in this facade" readout that grounds the concept image to
a real, palette-disciplined block set — application point #1 of the CIE-Lab matcher, no 3-D work.

## E-10 worked example — image → real-block grid (T-022-01)

The S-022 grid sampler (`src/color/image-grid.mjs`, CLI `npm run grid:build`) is the spatial sibling
of the extractor: not "which blocks?" but "**lay this facade out on a block grid.**" Decode →
area-downsample to N×M → per cell, average the *foreground* pixels → match to the nearest real block;
mostly-background cells become **air**. Dithering OFF. Run on the same locked concept,
**`taj-C-flash.png`** (1024²), at the held-constant **n = 48**.

**Discover mode** (full 305-block set) — `48×48 grid · 1202/2304 cells filled · 57 blocks · mean ΔE
6.47 · outOfPalette 0`. The swatch render (gitignored PNG) is a *visibly recognizable* low-res Taj:
gold onion dome, central pointed-arch iwan, symmetric two-storey window banks, corner chhatris, a
green plinth. Top fields: `orange_terracotta` 14% / `dark_prismarine` 14% (teal trim+ground) /
`chiseled_red_sandstone`+`smooth_red_sandstone` ~16% body / `gold_block`+`raw_gold_block` domes /
`lapis_block` window glass. Same warm-sandstone-with-gold reading the extractor gave — and the grid
*places* it. **The 48-cell width is the literal detail cap**: the dome's curve, the arch's point, and
the window mullions are all resolved to exactly as much detail as 48 columns allow and no more — the
E-10 thesis (2) made visible.

**Palette adherence (spec §9), measured not assumed.** `outOfPalette` is computed by independently
testing every filled cell's block against the candidate key set. Discover → **0** (every cell is a
real obtainable block). Validate vs `palettes/neoclassical.json` → **0** by construction
(`nearestLab` can only return a manifest block), and the result still surfaces the **21** non-full-cube
manifest ids (stairs/slabs/panes/`lantern`/`end_rod`) as `missing` — the table is full-cube-only.
Validate collapses the facade onto 4 blocks at mean ΔE **28.8** (`glowstone` 47%, `redstone_lamp` 23%,
`light_gray_concrete`, `chiseled_stone_bricks`) — the same palette-vs-fidelity tradeoff the extractor
exposed, now per-cell: a clean grid, but a poor color fit against the wrong manifest.

**Extracted-vs-declared** (`comparePalettes`, discover `usedBlocks` vs neoclassical `.blocks`):
`present 1` (`redstone_lamp`), `missing 42`, `added 56`. Read: the Taj concept honored almost none of
the *neoclassical* doc — which is the **correct** answer, because the Taj brief is not neoclassical.
The comparison here is illustrative of the metric, not a verdict on the concept; run against the
concept's *own* manifest it becomes the real "did the image honor the doc?" signal — high `present`,
low `added` = faithful; large `added` = the image invented materials the doc never declared.

**Two durable observations.**
- **Air is load-bearing.** A silhouette on near-black means ~48% of cells are background. Mapping
  them to "nearest block to black" would yield a solid rectangle and make adherence/coverage
  meaningless. A foreground-coverage threshold (default 0.5, averaging *only* foreground pixels so
  edge cells report the facade color, not a black-muddied blend) is what makes the grid a facade.
- **Show the block, not the pixel.** The swatch paints each cell with its *matched block's* table
  color, not the source pixel — so the visualization is an honest preview of what would actually be
  placed (the resolution + palette reduction), not a thumbnail of the input.

`npm test` 196/196 green (+14). Output is byte-deterministic (grid JSON and swatch PNG identical
across runs). Durable products: the grid sampler + CLI + swatch viz and this worked example —
application point #2 of the CIE-Lab matcher, still no 3-D work (that is E-09's path).

## E-10 — color-layer consolidation + E-09 reuse hook (S-023, T-023-01)

Terminal E-10 section: not a trial, a **consolidation**. It reconciles the four color modules built by
the parallel S-019/S-020/S-021/S-022 tickets, removes the one intentional duplication, and confirms
the boundary that lets Epic E-09 reuse this layer. No new capability, no render.

**What the color layer delivers.** A bottom-up stack, engine ← table ← adapters:
- **Engine — `cielab.mjs` (S-020):** the portable color core. sRGB→Lab, ΔE, and
  `nearest`/`nearestLab` argmin over a caller-supplied `[{key, lab}]` palette. **Zero imports** (not
  even a Node builtin).
- **Table — `block-table.mjs` + `block-lab-table.json` (S-019):** every full-cube, survival-obtainable
  1.20.1(-effective-1.20.2) block → a representative color → Lab. Build path uses `minecraft-assets` +
  `pngjs` (build-time-only, lazy); the runtime path pulls zero Minecraft deps.
- **Adapters:** `palette-extract.mjs` (S-021) answers *"which real blocks does this facade use?"*
  (canonical palette extraction); `image-grid.mjs` (S-022) answers *"lay this facade on a block grid"*
  (real-block grounding, per-cell). Both sit on the engine + table.

So the headline products are **canonical palette extraction + real-block grounding** of any concept
image, palette-disciplined to obtainable blocks.

**Conversion / ΔE / clustering choices (consolidated).**
- *Conversion:* 8-bit sRGB → CIE-Lab under **D65** (inverse-gamma → linear-sRGB/XYZ matrix → Lab
  companding). Single source of truth in `cielab.mjs`; the table re-applies a 3-decimal `round3` only.
- *ΔE:* **CIE76** (Euclidean in Lab) is the default and is sufficient for nearest-block matching; the
  metric is **pluggable** (`nearest(…, {metric})`) so CIEDE2000 can be swapped in without touching
  call sites. (Not done — a future ticket.)
- *Clustering (extractor):* deterministic **median-cut in Lab**, box selection scored by **count ×
  range** (so spread, not just population, drives the split), then same-block merge. Known property:
  population-halving makes leaf coverages dyadic (~1/8, 1/16…); coverage becomes a *dominance* signal
  only after merge. k-means is the open lever; the clusterer/metric seams are already pluggable.
- *Background:* a **tolerance, not an equality** — JPEG renders "pure black" as `[1,1,1]`-ish, so a
  near-black field is dropped within an RGB radius; near-black *foreground* is documented collateral
  (`--drop none` opts out), acceptable because the locked stage-1 prompt mandates bright silhouettes.
- *Table scope:* **full-cube only** by construction; manifest stairs/slabs/panes are surfaced as
  `missing`, not matched.

**Extracted-vs-declared (the measurable finding).** Run on the locked concept `taj-C-flash.png`, the
extractor/grid's `comparePalettes(used, declared)` against `palettes/neoclassical.json` reports
`present 1 / missing 42 / added 56` — the Taj concept honors **~1 of 43** neoclassical blocks. That is
the **correct** answer (the Taj brief is not neoclassical), so here the number is *illustrative of the
metric*, not a verdict. Run against a concept's **own** declared manifest it becomes the real fidelity
signal: **high `present` / low `added` = the image honored the doc; large `added` = the image invented
materials the doc never declared.** Paired with the discover-vs-validate ΔE gap (taj-C: discover mean
ΔE ≈6 vs validate-against-the-wrong-palette ≈27–29), the layer makes the **palette-vs-fidelity
tradeoff measurable**.

**Reuse boundary (the load-bearing claim, now enforced).** `cielab.mjs` is the **portable voxelizer
color core** — deliberately the one module with zero mc-design-eval / Minecraft / DesignArtifact
knowledge. It takes a palette as plain `[{key, lab}]` data and returns a key; it never touches block
ids, artifacts, files, or the network. This is no longer just a header promise: `reuse-boundary.test.mjs`
**statically scans** the engine's imports (fails on any relative or `minecraft-*`/`prismarine-*`
specifier; asserts the set is empty today) **and** functionally proves `nearest`/`nearestLab` work
against a literal palette with no block-table import in the test's own graph. The S-019↔S-020 conversion
duplication is gone — `block-table.srgbToLab` now delegates to the engine (output byte-identical, table
unchanged), so there is exactly one copy of the color math, in the portable module.

**Handoff to E-09 stage 4.** This color layer **is E-09's voxelizer color core.** When E-09's pipeline
(concept art → TRELLIS reconstruction → voxel grid) reaches **stage 4** (voxel grid → `DesignArtifact`),
it holds a per-design palette drawn from the S-019 block→Lab table (plain `{key, lab}` data) and, for
each voxel's surface color, calls **`nearest(surfaceRgb, designPalette)`** (or `nearestLab` if it
already holds a Lab centroid) → a block key → places that block in the `DesignArtifact`. It is the exact
2-D match the extractor (S-021) and grid (S-022) perform, **one dimension up** — voxel surface colors
instead of image pixels — and it reuses the *same* engine unchanged. No new color math, no Minecraft
import added to the engine; the boundary test guarantees the import stays safe from E-09's tree.

`npm test` **200/200** green (+4 boundary/usage tests over the 196 from T-022-01). E-10's color layer is
complete and reuse-ready; the next color work is downstream in E-09's voxelizer, not here.

## E-11 — staged-sculptor consolidation (S-029, T-029-01)

Terminal E-11 section: not a trial, a **consolidation** (the analog of E-10's T-023-01). It wires the five
sibling modules into one demonstrated loop, confirms the form boundary that lets a GLB source drop in, and
distills the learning. No new capability, no model call on the hot path.

**The staged spine — turn *form* into a *good* build the way a builder works: stage it.** A facade is built
as a sequence of passes, each operating on the **locked** output of the one before:

```
form ──MassingSource──▶ massing ──▶ material-noise ──▶ self-shadow relief ──▶ diagnostic critic
                       (occupied)    (material)         (relief)              (routes, never re-emits)
```

- **`build-state` + `orchestrator` + `compile` (the spine, T-024):** a sparse `{occupied, material, relief}`
  facade grid with a per-field **lock set**; stages are pure `apply(state, intent) → state`; `runStages`
  locks exactly the fields a stage changed on accept; `compile` emits one `voxel` per occupied cell at
  `[x, y, relief]`. The whole loop is reachable from one barrel (`src/sculptor/index.mjs`).
- **massing (T-025), material-noise (T-027), relief (T-028)** are the three craft passes; **review (T-026)**
  is the diagnostic critic. `staged-loop.mjs` (T-029) sequences them — adding **zero** new capability, just
  the wiring + a baseline metric.

**The lock chain IS the P14 cure — now demonstrated end-to-end.** The old failure (P14, runs 013/017/020) was
a blanket "improve" 2nd pass that *detached masses* and regressed a strong build — "improve" was destructive.
The staged loop makes it **additive by construction**: `mass` locks `occupied`, `material` locks `material`
over the locked occupancy, `relief` locks `relief` over the material-locked state. A later pass that tries to
change a locked field throws `LockViolationError` at the write (and is rejected at accept as defense in
depth). Each pass can only **add a field within bounds**; none can undo a prior one. The critic encodes the
same cure on the read side — it **routes** a defect to the responsible pass to re-run over the locked state,
it never emits a fresh artifact ("routes, never re-emits", a cure encoded in a type). The consolidation run
confirms all three fields lock, in order (`lockLog: massing → material → relief`).

**The two seed passes (fake depth without leaving the voxel lattice).**
- **material-noise** ("fake shading through materials"): per surface a **same-hue block set** (the run-015
  effect — mix stone / stone_bricks / chiseled_stone_bricks) chosen by a deterministic per-cell hash, varied
  by height so light breaks top-to-bottom. The k-nearest set is an upgrade of E-10's single-block match via
  the portable ΔE engine — the one E-10 coupling, and it leaves the engine untouched.
- **self-shadow relief** ("fake depth through Z"): each feature gets a legal integer Z move from a closed
  vocabulary (recess/window → −1, trim/cornice/frame/lip/eave/base → +1) plus simple cornice auto-detection.
  Recesses are **carved by exclusion** — compile emits one voxel per cell and a recess just shifts that lone
  voxel to z=−1, so a back block is never buried behind a front fill ([[facade-recess-by-exclusion]]).

**The less-flat result (cite `reliefMetrics`).** `reliefMetrics` is a pure projection of a state's relief —
the quantitative flatness signal (parallels `proportionsOf`; never stored, cannot drift). A massing-only (or
material-only) state is **all-flat** — every cell `relief === 0`, so `coverage === 0` and `variance === 0`.
On the demonstrated 4×5 facade (18 occupied cells, one window recess + an auto-detected cornice):

| signal | massing-only (baseline) | composed (massing→material→relief) |
|--------|-------------------------|------------------------------------|
| relief coverage | 0 | **0.17** |
| relief variance | 0 | **0.16** |
| relief range | 0 | **2** (z=−1 recess .. z=+1 cornice) |
| manifest | 1 block (gray) | **3 blocks** (same-hue set) |

So the composed build is **measurably less flat** than the massing-only baseline — non-zero relief coverage
*and* Z-variance where the baseline has neither. The composed artifact passes the live AJV gate and **renders**
to a valid PNG (headless GL). **Recorded critic diagnosis:** on the textured + relieved facade a `flat` defect
routes to **`relief`** (state-driven disambiguation — already textured, so it wants depth, not material); a
clean render yields `[]`. This is the same flatness signal the critic's `flat→relief` route is judged against —
the loop and its diagnostic agree on the metric.

**Input-agnostic — "we are the sculptor" (the E-09 reuse hook).** The **only form dependency is
`MassingSource`** (`{width, height, occupied()}` in build coords). `conceptGridSource` is the *single*
concept-grid-aware function — it adapts the E-10 image→block grid (`{grid, n, m}`, null-means-air, top-down
rows) into that contract and is the only place those specifics live; it does not even import image-grid (it
duck-types the shape). The middle passes (material, relief) and the bookends (review, compile) carry **no
concept-grid import at all**, so a GLB voxelizer that emits the same three members is a **drop-in** — the
material/relief/review stages never learn where the occupancy came from. This is no longer a header promise:
`src/sculptor/reuse-boundary.test.mjs` **statically scans** every downstream module's imports (fails on any
`image-grid` / `palette-extract` / `nano-banana` / `expand` / `briefs` specifier) **and** functionally proves
a literal gridless `MassingSource` runs the whole loop to a valid artifact with no concept-grid code in the
test's own graph. Same two-pronged enforcement as E-10's color-engine boundary.

**Handoff.** The staged sculptor is complete and input-agnostic. The wired live critic (`runStagedLoop`
defaults to the BAML categorical judge + headless render) is the loop S-029's consumer drives; the automated
suite renders live but stubs the metered judge (per T-026's design). The next form source is E-09's GLB
voxelizer — it plugs into `MassingSource`, and the boundary test guarantees the middle/review stay unchanged.

`npm test` **302/302** green (+11 over the 291 from T-028/T-032: 7 staged-loop end-to-end tests + 4 reuse
boundary tests). E-11's staged-sculptor framework is shipped.

## Fidelity-vs-concept frontier (E-13 sculpture set, S-038) · 2026-06-05

The `vConcept` sculpture pipeline (term → Nano-Banana 3/4 concept → **text→JSON** build → real voxel
render) run across **12 builds**: 8 fresh subjects @ scale 32 (T-036-01…08) and a moai + pineapple
**16/32/48** scale study (T-037-01…04). Curated into `pr/assets/sculptures.md` (concept↔render pairs +
rock turntables + the two triptychs). This is the **measured case for image→3D / the staged sculptor
(E-11) / TRELLIS (E-09)**: where text→JSON holds, and where it cannot. Per-build evidence:
`docs/active/work/T-036-0{1,3,4,5,6,7,8}/fidelity-read.md`, `runs/003-…/fidelity.md`,
`docs/active/work/T-037-0{1,2,3}/fidelity-read.md`, and run 013 inspected in T-038-01.

### The frontier, by form type

Text→JSON reliably carries **palette + part-inventory**; what it loses is **geometry** — and *which*
geometry it loses tracks the form type:

- **Angular / faceted → realizes best.** **Moai** (run 003): faithful form, every signature cue
  transfers (stepped brow, eye sockets, nose ridge, set mouth, topknot, plinth) — judged **Competent,
  form Strong**, the series' best case; only `gray_concrete` drifts darker than the pale tuff (value,
  not form — see *concept-image-not-color-value-preview*). **Sword** (run 007): faithful cruciform,
  part-for-part; the one loss is the tip *stepping* rather than tapering to a point. Voxels are
  axis-aligned boxes — a subject *made of* axis-aligned planes is a near-isomorphism.
- **Thin / linear → recognizability is angle-gated.** **Bow & arrow** (run 005), the hardest case:
  the complete part inventory survives in the exact palette, but 1-wide elements foreshorten — at the
  fixed 45° hero azimuth the arrow collapses to a speck; **only the turntable reads it**. The
  dancing-man's kicked leg and the sword's tip show the same 1-wide fragility. The *parts* are there;
  the *still angle* hides them. (See *Fixed 45° hero azimuth actively misleading for orientation-
  sensitive subjects*.)
- **Smooth / organic → palette + parts kept, *line* lost.** **Heart** (run 006, **loose**): right
  material vocabulary, **wrong form** — the lobed teardrop became a rectangular block and the aortic
  arch **never built as a loop** (its single strongest "real heart" cue), so it reads as an abstract
  shrine. **Koi** (run 009): right Kohaku palette + every named mass, but the swimming **S-curve** and
  membranous fins flatten to a straight chunky body + stepped slabs — reads as koi only **broadside**.
  **Mushroom** (run 008) and **pineapple** (run 004) survive better (their defining mass is a
  blob, not a line) but still terrace the dome / wash out the lattice. The voxel grid cannot hold a
  **continuous curve** — the exact thing organic identity lives in.

**One sentence:** text→JSON keeps *what a thing is made of* and *what parts it has*, and loses *line*
(organic) and *point* (thin) — the two geometries a box lattice can't represent.

### The frontier, by scale (the two triptychs)

`triptych-moai-16-32-48.png` and `triptych-pineapple-16-32-48.png` isolate the scale variable (shared
concept, three block budgets). They make **opposite** cases — the non-obvious result:

- **Moai (angular): non-monotonic, peaks at 32.** @16 the carved face still reads (graceful
  coarsening); @32 is best (face + topknot + plinth); **@48 regresses to a near-featureless dark
  monolith** — given ~6300 blocks the model spent them on coarse fills, not on resolving the face.
  Bigger ≠ better (see *sculpture-fidelity-non-monotonic-in-scale*).
- **Pineapple (organic): rewards the budget, ~monotonic up.** @16 blocky but a bold checker; @32
  rounded body but a **faint** lattice (low value contrast); **@48 is best** — the only scale that
  delivers *both* a rounded ovoid *and* a legible brown-diamond skin (12176 blocks bought form **and**
  pattern). Cost: the crown's thin fronds fragment into floating tips. (At @16 a tighter budget also
  forced a *bolder* palette that read better than @32 — *low-scale-can-improve-pattern-read*.)

**The sharpened law:** the **sign of the scale effect is form-type-dependent**. An angular,
single-dominant-mass subject can *waste* a large budget on coarse fills; an organic, textured subject
*converts* extra blocks into both form and pattern. "Scale up for fidelity" is **not** a safe default.

### Why this is the image→3D case

Across all 12: palette and part-inventory are solved; **geometry is the ceiling**. Organic line, thin
points, and reliable blocks→detail conversion are precisely what a **single-view text→JSON build cannot
guarantee** — and precisely what an **image→3D** model (TRELLIS, E-09) or a **staged geometric sculptor**
(E-11) exists to supply. The honest failures (heart, koi, moai@48) are not bugs to hide; they are the
**measured motivation** for the next stage. The package hands E-12 the visual proof — wins, gaps, and
the scale frontier, side by side.

## E-14 value-true co-design — the drift, measured then killed (S-042, T-042-01) · 2026-06-05

The E-13 frontier left one failure that was *not* geometry: **value drift**. The moai realized as
**Competent, form Strong** — the series' best case — yet its `gray_concrete` body rendered far darker than
the pale-tuff value the concept previewed (*concept-image-not-color-value-preview*). E-14 closed that one
moving part with a **palette co-design loop**: the concept previews against the *real* block values
(S-040, `.v2` swatch-grid concept), and the build *places* the value-true block, not the model's
name-by-hue pick (S-041, `snapArtifactToValueTrue` — the model owns form + where, the engine owns which
block). S-042 is the **measurement**: a concept↔render **Δvalue gate** (`src/color/value-gate.mjs`) scores
how far the *built* palette sits from the palette the *concept previewed* — the drift E-13 could only see
*after* the render, now a number computed up front (mean ΔE over the realized palette, flagged > 6 CIE76).

### Before/after — concept↔render mean ΔE (`.v1` name-by-hue → `.v2` value-matched)

| subject | E-13 verdict | ΔE before | ΔE after | closure | gate after | E-14 verdict |
|---|---|---|---|---|---|---|
| **moai** (angular) | Competent — drifted value | 6.97 | 2.31 | **4.66 (66.9%)** | ✓ clear | **closed** |
| **sword** (angular) | Recognizable — near-true | 3.98 | 2.65 | 1.33 (33.4%) | ✓ clear | already-near-true |
| **pineapple** (organic) | Organic — line softens | 10.34 | 8.55 | 1.79 (17.3%) | ⚠ flagged | narrowed |

(`benchmarks/sculpture/codesign-ab.{md,json}`, offline over the committed runs — no model call, no GL.)

### The moai close (the headline)

The documented drift scores **6.97 before — over the gate** — and the value-matched build pulls it to
**2.31, clearing it**: `gray_concrete` (L24.3) → `deepslate_bricks` (L29.8), **+5.5** toward the value the
concept showed. The body block now sits **1.75–2.35 ΔE** from the concept's `copper_ore`/`deepslate_bricks`
clusters instead of a value the render would have exposed as a surprise. **The one E-13 non-geometry
failure is killed.**

### Honest notes — where value-true *didn't* help, and what it cost

- **The gate is partly tautological — and we say so.** `.v2`'s low ΔE is *partly by construction*: the
  T-041 snap targeted this exact realized palette. The gate's real value is as a **regression/threshold
  flag** and a record of the **residual**, not a surprise-free proof. The proof it isn't vacuous: the
  **pineapple stays flagged after** (8.55 > 6) — value-matching *narrowed* but did not *close* the organic
  case. The corrective re-place is *recommended* there but does **not** auto-fire: a second snap against
  the same palette is idempotent; the real lever is a new palette-aware concept or a wider extractor `k`.
- **The sword was already near-true.** At 3.98 before it never tripped the gate — value-true *confirms*
  rather than *rescues* an angular subject whose model picks (iron/gold/andesite) already render at value.
  The contract earns its keep on the *drifting* case, not uniformly.
- **It cost segmentation.** The render-side palette can't be read from the render PNG: the
  prismarine-viewer scene dominates it (~79% `glass`). The gate sidesteps this with the **placed-manifest
  proxy** (a real full-cube block renders as itself — the T-039 table invariant), which is segmentation-
  free but *coverage-blind to the 2-D layout* — it weights by placement count, not by on-screen area. A
  true pixel-accurate render read still needs sculpture/background segmentation (deferred).
- **Many-to-one collapse persists (the T-041 residual).** When the concept's realized palette has fewer
  clusters than the model's manifest, several model blocks snap to one realized block (moai mid-grays →
  `copper_ore`); the gate's per-block ΔE keeps that residual visible (`chiseled_nether_bricks` still 10.5
  ΔE on the moai) rather than averaging it away.

**One sentence:** the palette co-design loop **measurably kills the moai value drift** (66.9% gap closure,
gate cleared) and gives every future build a **concept↔render Δvalue gate**, while honestly showing the
contract *confirms* the already-true, only *narrows* the organic, and trades pixel-accurate render reads
for a segmentation-free placement proxy.

## E-15 surgical form revision — the gap measured, the cage that won't fake it (S-047, T-047-01) · 2026-06-05

E-14 closed the one E-13 miss that was *not* geometry (value drift). E-15 turns to geometry: the
silhouettes that never match the concept — the koi's S-curve body that flattens to a straight one, the
heart's aortic arch that never closes. The epic built a **surgical revision loop**: a form-fidelity metric
(silhouette **IoU**, T-043-01) makes the gap a number; a region-lock + section-observe (T-044-01) frames
one defect at a time; a deterministic **accept-gate** (T-045-01) keeps an edit only if it *raises* the
metric, else rolls it back and **locks** the region; an **LLM block-editor** (T-046-01) proposes the
freeform `add/remove/move/swap`. T-047-01 closes it with the **form-target seam**
(`src/form/form-target.mjs`) the accept step consults — a concept/heuristic target *today*, a documented
**GLB (image→3D) adapter point** for later — swappable with **no change** to observe/diagnose/accept.

### Before/after — E-13 baseline whole-object IoU → after surgical revision

| subject | E-13 IoU (before) | after | Δ | proposed (rolled-back) | kept? | verdict |
|---|---:|---:|---:|---:|---|---|
| **koi** (flattened S-curve) | 0.481 | 0.481 | 0.000 | 0.481 | ✗ rolled-back | **held** |
| **heart** (open aortic arch) | 0.347 | 0.347 | 0.000 | **0.345** ⚠ | ✗ rolled-back | **held** |

(`benchmarks/sculpture/form-revise-ab.{md,json}` — the measured loop trace — vs `form-baseline.json`, the
T-043-01 "before." Verdict is categorical and deterministic, no model call: `improved | held | regressed`.)

### The honest read (the headline)

**Neither subject improved, and that is the result.** The koi's proposed edit left the whole silhouette
unmoved; the heart's *regressed* it (0.347 → 0.345) and the accept-gate **rejected it** — the per-region
signal fell (0.384 → 0.379), so the cage rolled it back and kept the original. The loop rolled back **2 of
2** and changed no build. The proof the gate is real is that it **said no** to a regressing edit; a loop
that "improves" everything is measuring nothing. The surgical cage measured the form gap and **declined to
keep an edit it could not earn.**

### Honest notes — where surgical revision *didn't* help, and what it cost

- **The signal is whole-object, single-view — the ceiling.** The accept number is one 3/4 render's
  silhouette IoU vs a **flat Nano-Banana concept**. A small in-region block edit barely moves a
  *whole-object* outline, and a flat concept offers no honest **region-vs-region** target to hill-climb (a
  true region IoU needs a 3-D→2-D projection of the target). This is exactly what the **GLB form-target
  seam** exists to lift: a real 3-D target projects a per-region silhouette the loop can chase. The seam is
  wired (`liveFormScore({ formTarget })` → `resolveFormTarget`); the GLB itself is deferred (E-09), and the
  adapter point `glbFormTarget` throws with that note. **Swapping it in needs no loop change** — that is the
  T-047-01 deliverable, proven by the demo consuming the seam and by `form-target.test.mjs`.
- **It cost metered iterations for two rolled-back edits.** The LLM-edit route is a `claude -p` call per
  region; here it bought two rejections. That is the honest price of proving the cage *rejects*, not a bug.
- **IoU is necessary, not sufficient.** Two shapes can share an outline; silhouette IoU is the cheap form
  number paired with the color gate, not a complete form judge (the T-043-01 caveat, carried).
- **The cage's value is structural, not a leaderboard bump.** What E-15 ships is a *loop that cannot
  regress a build* (accept-if-improved + region-lock + the target seam), plus the metric to know when a
  future better target (GLB) finally moves these two. The number didn't move; the machinery that will move
  it — honestly — is in place.

**One sentence:** E-15 makes the form gap a number and wraps it in a cage that **keeps only edits that
raise it** (koi/heart: 2-of-2 rolled back — the gate rejected a regressing heart edit), shipping the
**form-target seam** (concept today, GLB-ready) as the forward lever while honestly showing that
whole-object single-view IoU is too blunt for local edits to climb until that better target lands.

## E-16 GLB-grounded form — image→3D, grounded then refined (S-053, T-053-01 — synthesis, NOT a trial) · 2026-06-05

Terminal E-16 section: not a trial, a **consolidation** (the analog of E-14's T-042-01 and E-15's
T-047-01). E-15 left the form gap measured against a **flat Nano-Banana concept** and concluded the
whole-object single-view IoU was too blunt for local edits to climb *until a better (3-D) target lands*.
E-16 lands it: a real **TRELLIS GLB** (image→3D, `glb/{koi,heart}.glb`) becomes the target, and the epic
asks three measured questions — answered here head-to-head, residual shown not hidden
(`benchmarks/sculpture/glb-grounded-ab.{md,json}`, a pure offline consolidator over the three arms'
committed records — no re-measurement).

### The three-way — whole-object IoU vs the GLB target (E-13 concept as cross-ref)

The comparability spine is **silhouette IoU vs the GLB** (the only axis all three arms share): text→JSON
is the un-edited E-13 build scored against the GLB; GLB-voxel is the voxel build's own `silhouetteIoU`;
surgical is the post-loop whole-object IoU. vs-concept is carried only where it was measured (text→JSON).

| subject | method | IoU vs GLB | IoU vs concept | Δ vs text→JSON | categorical |
|---|---|---:|---:|---:|---|
| **koi** | text→JSON (E-13) | 0.472 | 0.481 | — | poor |
|  | GLB-voxel (T-051-01) | 0.622 | — | **+0.150** | fair |
|  | GLB-voxel + surgical (T-052-01) | 0.614 | — | +0.142 | fair (regressed) |
| **heart** | text→JSON (E-13) | 0.456 | 0.347 | — | poor |
|  | GLB-voxel (T-051-01) | 0.877 | — | **+0.421** | strong |
|  | GLB-voxel + surgical (T-052-01) | 0.877 | — | +0.421 | strong (held) |

(Bands are an IoU reading aid: poor < 0.50 · fair < 0.70 · good < 0.85 · strong ≥ 0.85; surgical rows
append the deterministic loop verdict. **No fresh LLM perceptual judge was re-run** — consistent with the
E-15 consolidation; the categorical is the IoU band + the loop's `improved|held|regressed`.)

### The three answers (the headline)

1. **Did the 3-D target move the E-15 loop on text→JSON builds? — Partly, 1 of 2.** With `glbFormTarget`
   swapped for the flat `conceptFormTarget` and *nothing else changed* (the seam invariant T-047-01
   promised), the **heart improved** (0.456→0.462 vs GLB, the edit cleared the gate and was kept) while
   the **koi held** (0.472→0.472, rolled back). E-15's flat concept moved **0 of 2** and *rejected* a
   regressing heart edit; the 3-D target is what gave the heart a per-region signal worth keeping. **The
   better target moved the loop where the flat one could not — on 1 of 2.**
2. **Did voxelization beat text→JSON on form? — Yes, decisively.** Against the same GLB: koi
   **0.472→0.622 (+0.150)**, heart **0.456→0.877 (+0.421)**. Voxelizing the image→3D mesh is a far larger
   form win than any surgical edit on a text→JSON build. This is the epic's real payload: the path to good
   *form* is **grounding the geometry in a 3-D reconstruction**, not editing a text-authored build.
3. **Did surgical tweaks add capability on the voxel set, and at what cost? — No net whole-object gain.**
   The koi cleaned one region locally (the chunky caudal fin, region IoU 0.513→0.528, *accepted*) but the
   whole-object silhouette **regressed** (0.622→0.614 — the local clean did not transfer); the heart
   **rolled back both** regions (held 0.877). Cost: one `claude -p` LLM-edit call per `curve` region (koi
   1 kept / 1 rolled, heart 0 / 2). **Once voxelization captures the form, local single-view surgical
   edits have little headroom and can slightly hurt the whole-object outline** — the E-15 single-view
   ceiling persists even with a 3-D target *and* a voxel base.

### Honest notes — where grounding *didn't* help, and what it cost

- **Voxelization is not perfect form.** koi 0.622 is only *fair* — a thin caudal fin voxelizes into a
  chunky stack; the metric is a single 3/4 view; rotation/axis is **not** corrected and translation+uniform
  scale are normalized out. heart 0.877 is *strong* but still < 1. The win is large and real, not total.
- **The surgical layer is a wash on an already-grounded build.** The E-15 cage still earns its keep — it
  **refused** every edit that didn't raise the per-region signal and **rolled back the koi's whole-object
  regression candidates** (P14 held: accepted regions lock, non-improving tweaks roll back). But on a base
  that already scores 0.622–0.877, the headroom for a local single-view edit is small, and the one
  *accepted* per-region clean (koi fin) did **not** transfer to the whole silhouette. That divergence is
  not a gate bug; it is the honest limit of per-region single-view IoU as a hill-climb signal.
- **It cost metered model calls for little form movement.** The two surgical arms spent `claude -p`
  LLM-edit calls per `curve` region and bought one kept local edit (koi) that the whole object didn't
  reward, plus three rollbacks. The cheap, decisive lever was **Arm B (voxelization)**, which needs no
  per-region model loop at all (koi 12.6s, heart 20.5s of deterministic voxelize+color).
- **No perceptual judge was re-run.** A consolidation should not manufacture new model evidence; the
  categorical is the deterministic verdict + the IoU band. A perceptual head-to-head would be a new trial.

**One sentence:** E-16 grounds the form loop in a real image→3D GLB and measures the honest answer —
**voxelizing the mesh is the decisive form win** (koi +0.150, heart +0.421 vs text→JSON), a **3-D target
moves the surgical loop where the flat concept couldn't** (1 of 2), and **surgical refinement on the
already-grounded voxel set adds no net whole-object gain** (koi regressed, heart held) — the path to form
is grounding the geometry, not editing the text→JSON build, and the cage that won't fake it still holds.

## Consolidation sweep (E-17) — what each technique bought, across all 7 subjects

E-16 measured 2 subjects (koi, heart). E-17 generalizes the whole arc to **all 7 sculptural subjects** by
running one canonical ladder and scoring every rung the same way:

```
R0 text→JSON  →  R1 glb-voxel  →  R2 +material-clean  →  R3 +surgical
```

against each subject's own image→3D GLB. The data spine is `benchmarks/sculpture/sweep-ablation.json`
(T-056-01); the legible scorecard + per-subject march-of-progress strips are `pr/assets/sweep.md` +
`pr/assets/frames/march-*.png` (T-057-01). The headline is the **per-technique average of the marginal
column** — what each technique added, meaned over the 7 subjects:

| technique | rung | n | avg ΔformIoU | avg ΔvalueΔE | improved/held/regressed | verdict |
|---|---|---:|---:|---:|:---:|---|
| **glb-voxel** (form grounding) | R0→R1 | 7 | **+0.238** | −7.16 | 7/0/0 | won-form |
| **material-clean** (palette) | R1→R2 | 7 | +0.000 | **−4.53** | 0/7/0 | won-value |
| **surgical** (per-region) | R2→R3 | 7 | −0.001 | +0.00 | 0/6/1 | wash |

**The one legible picture.** Form is bought **once**, by voxelization: grounding the geometry in the
image→3D GLB lifts silhouette IoU **+0.238 on average across all 7 subjects** (range +0.124 pineapple →
+0.421 heart), and it improved **every** subject (7/7). This is the E-16 finding (koi +0.150, heart +0.421)
holding at breadth — not a two-subject fluke. The two later rungs are **not** form levers and the sweep
says so in numbers.

**Where a rung didn't help (shown, not dropped).**
- **material-clean buys no form** (avg ΔformIoU +0.000) — it is a pure **value** lever, cleaning the
  realized palette toward the GLB's canonical material values (avg ΔvalueΔE −4.53). Caveat: its R2/R3
  `value ΔE` residual is **0 by construction** — it snaps to the GLB's *own* texture palette, so the
  metric is partly tautological. The honest win is the R1→R2 cleanup, not the zero.
- **surgical is a net wash** on an already-grounded build: avg ΔformIoU **−0.001**, with **0 of 7
  subjects improved** and one **regression** (bow-and-arrow −0.004). A single-view per-region accept-gate
  rarely lifts the whole-object silhouette once voxelization has captured the form — the E-15/E-16
  single-view ceiling persists at breadth. The P14 cage still earns its keep (it rolls back non-improving
  tweaks), it simply has almost no headroom here.

**The residual.** Voxelization is the decisive, cheap, deterministic lever (no model loop); it lands the
form in one step but is not *perfect* form — the hardest subjects stay only *fair* (moai 0.565,
bow-and-arrow 0.469/0.473, koi 0.623) where thin or fine-relief geometry voxelizes coarsely and the metric
is a single normalized 3/4 view. The remaining gap is a **voxelization-fidelity** problem (resolution /
multi-view / axis), not a palette or per-region-edit problem — material-clean and surgical have already
shown they cannot close it. **One sentence:** across 7 subjects, grounding geometry in the GLB voxelization
is the whole form win (+0.238 avg IoU, 7/7), material-clean is a value-only cleanup (−4.53 avg ΔE, 0 form),
and surgical refinement is an honest wash (−0.001 avg, one regression) — the arc's value is bought by where
the geometry comes from, and the instrument shows the rungs that bought nothing as buying nothing.

## Surface coherence & thin form (E-18) — the speckle/leak killed, the thin form recovered, the boundary named (S-061, T-061-01)

E-17 left the glb-voxel build winning on form but with two surface gaps: **speckle** (each voxel samples
the TRELLIS texture independently → scattered blocks) and **palette leakage** (material-clean snapped to
the GLB's own texture palette, not the design doc, so builds used far more blocks than intended). It also
left one **thin-form** failure (bow-and-arrow voxelizes worst; sub-voxel members drop out). E-18 closed
the surface gaps with **material-region segmentation** (T-058) under an **augmented design-doc palette**
(design-doc manifest ∪ ≤2 gated secondary, enforced by `assertPaletteDiscipline`, T-058-02/03) and the
thin gap with **thin-preserving voxelization** (`voxelizeGlbThin`, T-059). T-060 combined them and
re-measured all 7 subjects on five axes vs the E-17 R1 (glb-voxel) and R2 (material-clean) baselines.
Spine: `benchmarks/sculpture/e18-remeasure.json`; scorecard + before/after composites:
`pr/assets/surface-and-thin.md` + `pr/assets/frames/{speckle-heart,speckle-koi,thin-bow-and-arrow}.png`.
Each fix read against the baseline that isolates it (form via R1 — colour never moves a silhouette;
speckle + discipline via R2):

| fix | isolating Δ | n | avg Δ | improved/held/regressed | verdict |
|---|---|---:|---:|:---:|---|
| **material segmentation** (speckle) | E18−R2 speckle | 7 | **−0.180** | 7/0/0 | won-clean |
| **palette discipline** (off-pal + distinct) | E18−R2 off-pal | 7 | **−2791** | 7/0/0 | won-discipline |
| **thin voxelization** (form) | E18−R1 form IoU | 7 | −0.004 | 4/0/3 | routed tradeoff |

**The two clean wins.** Speckle is the decisive, most uniform win in the record: E18 halves R2's smoothed
surface (avg **0.30 → 0.13**) and drops it on **all 7** subjects (R1 0.44 → E18 0.13). Palette discipline
holds at **off-palette 0 on all 7** vs R2's avg ~2790 leak — R2 snaps to the GLB's *own texture* palette
(k≈8) while E18/R1 snap *within* the augmented design-doc palette; distinct ≤ R2 everywhere (avg 6.4 → 5.4).
The before/after pairs (`speckle-heart.png`, `speckle-koi.png`) show the scattered surface resolving into
clean material regions.

**The thin form recovered (bow-and-arrow).** Thin preservation lifts bow-and-arrow **0.473 → 0.526** and
coalesces its 4 severed components into 1 (`thin-bow-and-arrow.png`); koi +0.080, heart +0.020, moai +0.030.

**Where it didn't help (shown, not dropped).**
- **Form IoU is a routed tradeoff, net −0.004.** The conservative surface trace adds a ~1-voxel shell to
  *every* subject, so it over-thickens the 3 already-solid forms — **dancing-man −0.10, pineapple −0.06,
  mushroom −0.05** — while recovering the thin/organic ones. Net avg form IoU is flat (0.76 across R1/R2/E18).
  This spread is not a defect; it is the evidence for routing.
- **Value ΔE rose, and it is a real cost — not the R2 tautology.** R2's value ΔE is 0 *by construction*
  (it snaps to the texture it is scored against). E18's value ΔE (avg **8.67 vs R1 5.47**) is the honest
  price of the tighter design-doc palette drifting from the GLB texture (koi +11.82, dancing +2.63 vs R1).
  Recorded as a cost of discipline, not hidden behind R2's zero.

**The form-type-routing rule (the deliverable).** Image→3D voxelization is not universal. The per-subject
form Δ says thin preservation helps organic/thin and hurts already-solid; and **sword never enters the
voxel path at all** — TRELLIS 500s on the thin blade across 4 attempts (incl. after trimming to fill the
frame; `glb/README.md`), yet sword's text→JSON build was one of the better E-13 ones (the faithful
cruciform). So the pipeline routes by form type: **bulky/organic → image→3D → voxelize (with thin
preservation where members are sub-voxel); thin/angular → text→JSON.** The instrument now knows which
path each subject belongs on.

**The residual.** Form IoU is unchanged on average — E-18 was a *surface and connectivity* epic, not a
form-fidelity one; the hardest subjects (moai 0.59, bow 0.53, koi 0.71) are still only fair, the same
voxelization-resolution ceiling E-17 named. Thin preservation is currently applied universally; the honest
next lever is to **route it by form type** (skip the shell on already-solid subjects) rather than tune it.
**One sentence:** E-18 kills the speckle (−0.18 avg, 7/7) and the palette leak (off-pal → 0, 7/7) cleanly,
recovers the thin form where it was severed (bow 0.473 → 0.526, 4→1 components) at the honest cost of a
small value-ΔE rise (8.67 vs 5.47) and a ~1-voxel over-thickening of already-solid subjects — and the real
deliverable is the **form-type-routing rule** the sword boundary makes unavoidable.

## Voxel cleanup (E-19) — the busy build made as clean as text→JSON (S-066, T-066-01)

E-18 left the GLB-voxel build *winning on form* but **busy**: it leaked off the design-doc palette into the
GLB's own texture (k≈8 median-cut → busy textured blocks like `nether_quartz_ore`, `coral_brain`, `mycelium`),
carried TRELLIS **stray geometry** (moai's two duplicate statues + bridge bars), and **over-thickened** the
already-solid subjects with a universal thin shell. E-19 closed that backlog with three fixes, each on its own
ticket, then **T-066 composed all three into one build and measured the honest before/after** vs the busy E-18
seg build (`glb-voxel-seg/`, re-scored on the fixed T-062 metrics). Spine:
`benchmarks/sculpture/e19-cleanup.{md,json}`; build: `benchmarks/sculpture/e19-build/`; before/after composites:
`pr/assets/frames/e19-{moai,heart,koi}-{before,after}.png` + the handoff `pr/assets/voxel-cleanup.md`.

**The backlog — each item closed, by number.**

| # | fix | what it bought (busy → E-19) | verdict |
|---|---|---|---|
| **T-062** | fixed cleanliness metrics (fragmentation speckle + `strayVoxelStats`) | the scoreboard this epic is judged on | closed |
| **T-063** | stray-voxel pruning (`pruneStrays`, relative floor) | **moai stray 2023 → 0, largest-frac 0.52 → 1.0, components 6 → 1** | closed (gated, see below) |
| **T-064** | variance-aware flat palette + true-axis gradient banding + `keepFloor` | **off-palette 1149 → 0 avg (7/7); busy textured blocks gone; distinct ≤ busy (mushroom 6→5)** | closed |
| **T-065** | per-subject thin routing (`voxelizeRouted`) | **solids de-thickened (occupancy −8,428 cells); form IoU recovered** (dancing-man 0.814→0.914, mushroom 0.929→0.98 vs universal thin) | closed (wired here) |

**The headline — is GLB-voxel colour now as clean as text→JSON? Yes, on colour cleanliness.** Every E-19 build
is **0 off-palette** (busy avg 1149; moai 887 / heart 1174 / mushroom 5981 → 0) — it snaps *within* the
augmented design-doc palette, exactly like a text→JSON build, enforced by `assertPaletteDiscipline`. Speckle is
**≤ 0.045 on all 7** (avg 0.024 < the 0.05 clean bar); distinct holds at 5.43 avg. The busy textured blocks
(`nether_quartz_ore`, `coral_brain`, `mycelium`) are gone from every manifest. The before/after pairs show it:
moai's busy red-speckled ore → matte design-doc palette, heart's purple/gold texture-leak vessels → in-palette.

**The two honest caveats (where "as clean as text→JSON" is qualified).**
- **value ΔE rose (avg 7.19 → 9.81; moai 14.05, koi 17.55).** This is the design-doc-palette **discipline
  cost**, the same ablation tautology E-18 named: the busy build's value ΔE is low *because* it snapped to the
  GLB texture it is scored against; E-19's tighter palette must drift. text→JSON pays the identical price —
  this is a property of *having* a fixed palette, not a GLB-voxel defect. Reported, not hidden.
- **moai is geometrically clean but not a clean moai.** Pruning drops the two *fully-detached* masses
  (stray 2023→0) but the kept largest 6-connected component is *itself* a tangle of partial statues the bridge
  bars hold together — **the moai GLB is the hallucination** (TRELLIS reconstructed 3 statues from a 3-view
  contact sheet). So moai's form IoU *falls* vs its own corrupt reference (0.565 → 0.416); **stray/component is
  moai's honest signal, not IoU.** The real fix is upstream — regenerate the GLB from a *single-view* concept —
  a separate ticket; pruning is the no-op safety net once that lands.

**The consolidation finding (composing fixes surfaces new conflicts).** Naively stacking T-065 routing + T-063
pruning **regressed pineapple −0.096 form IoU**. In E-18 the universal thin pass bridged pineapple's crown into
one component, so pruning was a no-op; under routing, solids go to *plain* `voxelizeGlb`, the crown tips
disconnect into 11 tiny components (45 cells), and `pruneStrays`' relative floor (tuned for moai's *gross*
duplicate masses) **clipped silhouette-load-bearing crown geometry**. Fix: a **prune gate** — apply pruning
only to a real multi-mass hallucination (`largestFraction < 0.9`). moai (0.52) qualifies; near-single-mass
solids (pineapple 0.987 / heart 0.986 / mushroom 0.998 / koi 0.976) keep their incidental specks. Pineapple
recovered to 0.907; moai keeps its full stray fix. **Lesson: a relative-floor prune calibrated for one form
clips legitimate detached detail on another — gate it on the presence of an actual hallucination, not on
"any stray".**

**The net.** form IoU **held** (busy avg 0.763 → E-19 0.761; only the reference-corrupt moai regresses;
routing recovered the universal-thin solid losses), off-palette **eliminated** (7/7 → 0), strays **fixed where
real** (moai), materials **flat** (busy blocks gone), at the documented value-ΔE discipline cost.
**One sentence:** E-19 makes the GLB-voxel build's colour as disciplined as text→JSON (off-palette 0/7,
speckle ≤ 0.05, busy blocks gone) and removes the stray hallucination where it is real (moai 2023→0) — the
residue is a measurement tautology (value ΔE) and one corrupt GLB (moai), both with named upstream fixes, plus
the reusable lesson that **a prune tuned for gross hallucination must be gated off incidental disconnection**.

## Concept-grounded materials (E-21) — the mean-colour collapse restored by feature, and where it over-reaches (S-074, T-074-01) · 2026-06-06

Through E-19 every block was chosen by **nearest mean colour** (`segmentMaterials`). That single authority has
one structural failure: it **collapses near-tone-distinct materials**. Two regions the concept shows as
*different materials* but *similar tone* — stone-brick walls vs cobblestone corner buttresses, smooth tuff body
vs a coursed-brick plinth — both snap to the same grey block, and the deliberate masonry distinction the design
*intended* disappears. Mean colour cannot tell brick from cobble; it only sees grey ≈ grey. **Material identity
is semantic, not chromatic** — it is *what the material is for* (texture, grain, coursing, architectural role),
which colour throws away.

**The fix is an authority swap, not a colour fix.** E-21 replaced mean-colour with a three-stage
concept-grounded pipeline: **T-071** — an LLM reads the concept image and *names the real survival block per
visible region* by material intent (the map: `material-map/{subject}.json`); **T-072** — each named block is
placed by **geometric feature** (flat-face / edge-corner / roof / base / opening-recess), so a block lands on
the feature it is *for*, not where its colour happens to match; **T-073** — a refine pass corrects visible
mis-zoning against the concept. **T-074** measured it: per subject one GLB-voxel build under two authorities —
`before` = colorimetric (the E-19 mean-colour path) → `after` = concept-grounded (map → feature-assign) — on
the **same GLB and the same map-palette universe**, so the *only* variable is the authority. Spine:
`benchmarks/sculpture/concept-materials-ab.{md,json}`; handoff `pr/assets/concept-materials.md`.

| subject | kind | distinct | speckle | off-pal | near-tone collapsed→restored | true-by-feature | judge |
| ------- | ---- | -------- | ------- | ------- | ---------------------------- | --------------- | ----- |
| gatehouse | architectural | 5→5 | 0.006→0.035 | 0→0 | 3→3 (sep 4) | ✓ | **restored** |
| cottage | architectural | 7→6 | 0.002→0.093 | 1416→0 | 3→0 (sep 1) | ✗ | **over-reach** |
| moai | sculpture | 5→3 | 0.005→0.079 | 1492→0 | 1→0 (sep 0) | ✗ | **over-reach** |
| pineapple | sculpture | 4→4 | 0.021→0.073 | 0→0 | 3→2 (sep 2) | ✗ | **over-reach** |

**The headline — the collapse IS fixable by authority, on the 1:1 case. gatehouse restores cleanly.** The
colorimetric build merged its four near-tone materials toward grey; the concept-grounded build places all four
back on the feature each is *for* — `stone_bricks` on flat-face walls, `cobblestone` on edge-corner quoins,
`deepslate_tiles` on the roof, `dark_oak_planks` in the opening recesses. **Every block dominates its intended
feature** (true-by-feature ✓), 4 near-tone pairs separated, off-palette stays 0, distinct holds at 5 (no
bloat). The grey-blob walls become brick-walls-with-cobble-corners — the exact failure E-21 set out to fix,
measured restored. Across all four subjects, near-tone pairs collapsed by colorimetry **10 → restored 5**.

**The LLM's right to add a missing concept material back — justified growth, not bloat (AC#4).** distinct grew
on *no* subject and shrank on three; the *one* addition across all four (moai's `stone_bricks` plinth) is
**concept-justified** — the base shows a tiled coursed grid the smooth `gray_concrete` column does not, a
genuine near-tone material the design-doc omitted. The build adds a block **only** where the concept shows one
the prior palette missed, bounded by the map, never sliding back toward the 305-block table. Growth is gated by
concept evidence, not free.

**Where it over-reaches — two named, reusable boundaries (the honest negative, AC#5).** Over-reach is not noise
or regression; it is exactly the two places a *geometric* assigner cannot carry a *concept-justified* material:

1. **Two materials, one architectural role — the SHARED-RULE LIMIT (cottage).** The map is concept-honest but
   assigns **two materials to one `placementRule`** (`stone_bricks` + `white_terracotta` both `walls`;
   `spruce_planks` + `dark_oak_planks` both `roof`). T-072 places **one block per geometric feature**, so the
   second same-role material has no distinct feature to land on — `white_terracotta` spills to the base,
   `dark_oak_planks` to the opening recess. The materials are *justified*, not invented; **geometry alone
   cannot separate two materials that share one role.** Needs a sub-feature selector (same family as the
   unplaced `trim`-accent gap).
2. **Organic forms lack the architectural feature vocabulary (moai, pineapple).** The flat-face / edge-corner /
   roof / base / recess classifier was built for buildings; on an organic monolith or an ovoid-with-fins it is
   ill-defined, so a justified block leans on the colour fallback and mis-zones (moai's plinth bricks land on
   edge-corners; pineapple's crown `green_concrete` dominates edge-corner cells). The near-tone pair is real
   and *named in the map* — the assigner just can't place it on a form its feature vocabulary doesn't describe.

**The deeper finding (carry forward).** Near-tone material identity is carried by **geometry (feature
assignment), not colour** — which is why it is *invisible to a render*, and why the T-073 render-based refine
pass (which corrects visible mis-zoning) cannot see it and is cited, not re-run per subject. The boundary of
E-21 is therefore not "does the LLM name the right material" (it does — every map is concept-honest) but
"**can the feature classifier place it**" — and that fails precisely on two-materials-one-role and on organic
forms. Both are upstream feature-vocabulary tickets, not authority defects.

**One sentence:** E-21 swaps the material authority from collapse-prone mean-colour to a concept-grounded
LLM-map placed by geometric feature, and on the architectural 1:1 case (gatehouse) it restores every near-tone
distinction the colour build merged — cleanly, truly, with concept-justified growth only — while the three
over-reaches honestly mark the assigner's two real boundaries (two-materials-one-role, and the architectural
feature classifier on organic forms).

## Beyond facade — the whole structure, in the round (E-20) (S-070, T-070-01) · 2026-06-06

The terminal E-20 record, and the answer to the oldest honest note in the journal. Phase 1's ceiling was a
**facade**: text→JSON, at its best (run-014 `vRefRevise`, a unanimous **strong** 3/3), produced **one grand
face** — a temple front, a single connected plane, with a *flat reverse side*. Every committed `spin-*.mp4`
made this literal: rotate the build and the back falls away (`pr/assets/rotations/README.md` says so outright —
"the full-360 `spin-*` clips reveal that they are currently facades"). That flat back is what motivated the
whole-structure / sculptor arc (E-11) and the image→3D pivot (E-13→E-21).

E-20 closes that arc. The matured pipeline — **TRELLIS bulk reconstruction** (E-16/E-17) + **E-19/E-21 clean,
concept-grounded materials** + the **E-15 surgical cage** + the high-res voxel build (T-068) — produced a
**complete building, in the round**: a stone gatehouse, **54×64×54**, **57,202 blocks**, a disciplined
**4-block palette** (`stone_bricks` / `cobblestone` / `deepslate_tiles` / `dark_oak_log`), with **four real
sides and a stepped roof**. `spin-building-e20.mp4` is the **first `spin-*` whose 360° does not reveal a flat
back** — the thing text→JSON could not do, made legible in a single rotation.

| dimension | facade (text→JSON best, run-014) | full building (E-20) |
| --------- | -------------------------------- | -------------------- |
| extent    | one face — a connected plane, flat back | **54×64×54** — 4 sides + a stepped roof, real back |
| blocks    | ~10,013                          | **57,202** |
| palette   | designed, colourful (Taj)        | 4 clean blocks (E-19/E-21-disciplined) |
| how built | text→JSON, single view           | image→3D (TRELLIS) → voxel → clean materials → surgical cage |
| verdict   | **strong** (facade, unanimous 3/3) | **weak** — *as rendered by the 512² no-AA lens* (E-22 confound) |

**The headline — the leap is completeness, not finish.** The defensible, measured claim is *scale*: a whole
structure where there was only a face. It does **not** depend on the judge verdict and is visible to anyone who
watches the turntable. The build is genuinely in the round; the facade era is over.

**Honest notes — where detail tops out (the residual, not hidden).**
- **The verdict is `weak`, and it is render-lens-confounded.** The categorical judge returned **weak** at
  whole-object form-IoU **0.929** (final; the surgical loop accepted **zero** edits, so `building/best` *is* the
  final build — `benchmarks/sculpture/surgical-standard.{md,json}`). But the judge's core complaint — the crown
  "dissolves into a chaotic grey jumble" — is **texture-minification aliasing in the 512² no-AA render**, not
  build geometry or palette speckle (T-068: off-palette 0, speckle ~0; E-21 restored the 4 near-tone
  materials). Per the E-22 finding (*render aliasing ≠ material speckle*), the honest reading is "**weak as
  rendered by the current lens**"; E-22 fixes the lens and moves the gate to reference resemblance, which may
  lift this materially. The verdict is recorded faithfully; it is not purely a property of the build.
- **Fine architectural detail still tops out (the genuine residual).** Two compounding, *measured* causes
  (T-069-01): (1) the **E-15 per-region LLM block-edit route does not scale** to a 57k-block build — every
  region proposal failed with "prompt too long" (~1.25M tokens vs the 1M limit), because a high-res region's
  placement list overflows the model context (memory: `surgical-edit-path-scale-limit`); (2) the **TRELLIS form
  target had already dropped the defining detail** upstream (T-067: arch ring, gable ridge, slit windows), so
  even a working editor had no per-region signal toward them. The *bulk* is right and complete; the *fine
  relief* (window reveals, cornices, the arch voussoirs) is where quality tops out — and refining it needs a
  better upstream mesh + a region representation the editor can fit in context, both out of E-20's scope.

**One sentence:** E-20 ends the facade era — the matured pipeline builds a complete 54×64×54, 57,202-block
structure with a real back and roof (the first `spin-*` that proves it), and the leap is *completeness*, with
the honest residual that fine detail still tops out at **weak as-rendered** — confounded by the 512² render lens
(E-22) on top of the genuine ceilings of a 1M-context surgical editor and a detail-lossy TRELLIS target.

## Faithful render + resemblance gate (E-22) — the lens was broken, the green metric measured nothing (S-075/076/077, T-075…077-01) · 2026-06-06

This is a **measurement-methodology** learning, not a per-build score. E-22 found that the thing we were
judging was partly an artifact of *how we photographed*, and that the proxy metric we signed off on never
measured the actual goal. It fixes both and re-photographs the headline builds honestly.

**Root cause — clean build, broken lens.** The scale-64 gatehouse rendered as grey *static* on the roof, and
the proxy metrics blamed the build (a "speckle" / material-noise reading). It was **texture-minification
aliasing**: at scale 64 the build's surface samples far more texel-detail than 512² can hold, so point-sampling
the oversized raster down to 512² produced salt-and-pepper noise — *the lens, not the blocks*. The block-level
palette metrics read **clean** the whole time because the build genuinely is clean; the noise was injected at
the final downscale. Memory: `[[render-aliasing-not-material-speckle]]`. The lesson — **a proxy that scores the
artifact but not the photograph of it will defend a broken lens forever.**

**The fix — SSAA ×3 (T-075-01).** Render into an N×-larger framebuffer (1536² at N=3) and **box-average** down
to the fixed 512² contract (`render/src/render.mjs` `DEFAULTS.supersample=3`; pure math in
`src/render-supersample.mjs`). Quantified on the *same, byte-identical* scale-64 gatehouse artifact: high-freq
energy **690.9 → 197.5, −71.4%**. The before/after (`pr/assets/gatehouse-lens-{before,after}.png`, fresh renders
via `supersample:1` vs `:3`) is the proof: the roof goes from static to clean grey planes with the build
untouched. **No build was shrunk or edited to make this happen** (Rule 3) — only the camera's resolve changed.

**The gate that replaced green-metric sign-off (T-076-01).** The old metrics (form-IoU thresholds, value-ΔE,
speckle) read *perfect on the static* — they answered "is the artifact internally clean?", never "does the build
**look like** its references?". E-22 replaces sign-off-by-number with a **reference-anchored resemblance gate**:
a **triptych** `concept | mesh | minecraft` rendered through one shared lens (the verdict a human inspects —
Rule 2), a **categorical judge** that rules `same object | drifted | different object` and **names exactly one
gap** (region + attribute — Rule 7), with the perceptual numbers demoted to *diagnostics that explain* the
verdict. References (concept image + GLB) are **immutable inputs** (Rule 1); the prompt + thresholds are **frozen**
(Rule 5). The pure scorer/judge-parser/aggregator are unit-tested; the GL render + metered judge are verified by
a live run, never by the suite.

**What re-photographing changed about prior verdicts (honest, including worse — T-077-01).** Four headline
builds, fixed lens, metered judge:

| subject | verdict | named residual gap | meshIoU | note |
| ------- | ------- | ------------------ | ------- | ---- |
| gatehouse | `drifted` | form @ upper roof / gable | 0.929 | the static cleared, but a **real** form gap remained — the roof reads chunky vs the concept's clean gable. The aliasing was hiding a true drift; clearing the lens did **not** flip it to "same object". |
| cottage | `drifted` | **material zoning** @ upper-story walls → **E-21** | 0.929 | bulk form faithful; the material *placement* drifts — a material-identity finding, routed, **not edited here**. |
| moai | `different object` | form @ overall body (connected masses + horizontal rails) | **0.417** | the honest **worse** result. The e19 moai form genuinely collapsed (low meshIoU, fused masses) — a verdict the green metrics never surfaced. Reported, not suppressed. |
| pineapple | `drifted` | **palette** @ fruit body → **E-21** | 0.908 | strong organic form (cross-hatch recovers); the *palette* drifts — routed to E-21. |

Tally: **3 drifted / 1 different object**, **2 material-drift findings routed to E-21** (cottage zoning,
pineapple palette), **2 form gaps not routed** (E-22 does not edit form — a form gap is the honest build
verdict, owned by the build pipeline). **The fixed lens made nothing look better than it is** — the gatehouse
static cleared but its form drift stayed, and the moai got an *honest worse* verdict the proxy had masked.

**The routing rule (E-22 charter).** E-22 **photographs + judges**; it does **not** edit form or materials
(Rule 3). A gap on a **material axis** (`palette` / `material zoning`) is a **finding routed to E-21**
(`docs/active/work/T-077-01/e21-material-findings.md`); a `form`/`massing` gap is reported as a residual but
**not** routed (it is the build's honest verdict, not a material-identity defect). Encoded once in the pure
`consolidateResemblance` (`src/form/resemblance.mjs`), unit-tested both ways.

**One sentence:** E-22 proves the grey static was the *lens* not the build (−71.4% HF energy on an untouched
artifact via SSAA ×3), retires green-metric sign-off for a reference-anchored **triptych + categorical-verdict +
named-gap** gate, and re-photographs the four headline builds honestly — 3 drifted / 1 different object, two
material gaps routed to E-21, with the moai's *worse* verdict kept rather than hidden (Rule 7).

## 2.5-D interaction sector (E-23) — view-matched-to-task, two paths, the gate-switch (S-083, T-083-01) · 2026-06-06

The terminal E-23 learning, proven on **one** build (`npm run milestone:cottage` → a hollow, accurate,
room-divided cottage). The arc before this could make a face *look* right (E-22 lens + resemblance gate) but
every build was a **solid mass**: no interior, and the LLM either drowned in ~57k voxels or edited blind. E-23
is the **abstraction that fixed the interaction**, not a new score.

**View-matched-to-task — hand the model the view the task needs, not the world.** Each op gets a *task-shaped*
2.5-D projection through the E-22 fixed lens: a **plan/top** view to author a floorplan, an **elevation** to
judge a face, a **3/4** to read massing. The model looks at one legible image, not a voxel dump
(`[[twodee-interaction-sector]]`). Reading any angle is in scope (Path R); *painting* needs the unambiguous
back-projection of Path P. This is what makes a small model viable on a building-scale subject.

**Two paths — program vs judgement — and when each wins.**
- **Program path** (deterministic generator; bulk placement is the program's job): the **hollow carve**
  (`markHollowable` → `carveArtifact`, flatten-by-exclusion, no air op — `[[facade-recess-by-exclusion]]`) and
  the **N×M floorplan** (`generateFloorplan` partitions the footprint, places floors at storey lines + grid
  walls + doorways-by-exclusion). The LLM **authors/steers** a tiny spec; the program emits the hundreds of
  placements. Use it where the work is *bulk, geometric, and verifiable* — 978 voxels carved, 395 placed, none
  hand-touched.
- **Judgement path** (the LLM acts on a face): **spray-paint** — project the front to the grid, splat a
  per-cell material target (concept where it is the truth, GLB where the concept is silent), back-project to
  recolor surface placements. Use it where the work is *perceptual and local* — restoring the half-timber band
  the 3-D feature placer collapsed (plaster `8 → 315`). Paint is geometry-safe, so it composes cleanly *before*
  the program stages.

**The gate-switch at the craft→design line — the headline.** The gate is not one thing; it **changes with
whether a reference exists**:
- **Resemblance** governs the **exterior** — there *is* a concept to match, so score the painted face against
  it (front 0.25 → 0.40, E-22 per-face accept-if-closer, P14-safe).
- **Plausibility** governs the **interior** — "break the shell into rooms" is **invention**; there is nothing
  to resemble, so gate six *internal-consistency* constraints (rooms valid + non-overlapping + reachable;
  floors at the storey lines; storey count matches the read; grid fits the envelope) — all PASS, with a named
  residual.
The exact same build crosses the line, so the milestone reports **both** gates side by side. That switch —
resemblance where there's a reference, plausibility where there isn't — is the E-23 thesis.

**Right-sized-model results — which ops ran light, and the rubric.** The chain fired exactly two metered
calls, one per tier: the **hollowable-mass detector on Haiku** (light — a bounded classification scoped to one
3/4 view, over the candidate mass the geometric read already isolated) and the **floorplan author on Opus**
(strong — authoring a generator, the design reasoning). The scoping rubric (single-sourced in
`src/model-tier.mjs` `OP_ROUTING`): **light** = a narrow detector/classification scoped to ONE view over a
bounded candidate set; **strong** = cross-view judgement, authoring a generator, or material zoning. Detectors
go light; *making new structure* goes strong. This is the first place the project does real multi-model
agentic engineering — and it held on a building-scale build.

**Where it over/under-reaches (honest — Rule 7).**
- **The exterior is held *provably*, the interior is gated by *plausibility* not truth.** The carve and fill
  both pass `exteriorHeld` (the 10-camera surface digest is invariant — the hollow + rooms are literally
  invisible from outside), but the interior has *no reference*, so plausibility is the ceiling, not resemblance.
- **The +x side is accepted by construction** — the concept never shows a side, so its GLB splat has no
  per-face resemblance delta. The *front* face is no longer the gap; the side is the named exterior residual.
- **`openings-align` is steered, not verified** — the front-most ortho march can't read a recessed door as a
  hole, so interior-door↔exterior-door alignment trusts the LLM's `frontDoor`, not geometry. A depth pass
  would close it.
- **No stair** — reachability is per-storey; vertical circulation is the obvious next reach.
- **The cutaway is a render-only section** (`src/view/cutaway.mjs`, flatten-by-exclusion) — the real artifact
  is never edited to flatter the view (Rule 3); the section exists only to photograph the hollow + grid.
- **The authoring is non-deterministic** — the floorplan author returns 2×2 / 2×3 / 3×3 across runs (all
  gate-passing); the generator + gates are deterministic given a spec. A seed would pin a Phase-2 sweep.

**One sentence:** E-23 proves the 2.5-D interaction sector on a single cottage — task-shaped views feed two
paths (program: carve + N×M fill, 978 voxels removed / 395 placed; judgement: spray-paint, plaster 8→315),
the gate **switches** from exterior resemblance (0.25→0.40) to interior plausibility (six constraints PASS) at
the craft→design line, and the ops are model-scoped (detector on Haiku, author on Opus) — exterior held
*provably* the whole time, with the side-by-construction, steered-openings, and no-stair residuals named.

### Correction (T-079-02) — the splat must be ∩ structural-zone, not color-only · 2026-06-06

The "plaster 8→315" figure above was a **regression dressed as a win**. The shipped T-079-01 spray-paint
recolored *every* in-palette surface cell — a color-only splat with **no storey mask** — so plaster
(`white_terracotta`) smeared across the base, the upper storey, **and** the roof (per-band: y0:65 … y24:10,
315 total), plus floating painted strays from painting an un-sealed surface. It read as a **pink blob**, not a
stone-base / plaster-band / wood-roof cottage. The color-only splat was *more sophisticated* than the
T-079-01 POC that restricted plaster to the upper-storey band — and **worse**, because it dropped the
structural constraint.

The lesson: **splat must be ∩ structural-zone.** Color chooses *which block within a zone*; the structural
read chooses *which zone allows it*. The fix adds `structuralZones(occ)` (base/upper/roof from floor lines +
the top-exposed roof shell — geometry, *not* the current dominant blocks, which already encode the collapse),
and `paintFace` gains a zone gate: a plaster target on a base/roof cell is **rejected, not painted**. Measured
on the sealed cottage, surface plaster by zone went from the smear `{base:96, upper:134, roof:80}` (unmasked)
to `{base:0, upper:134, roof:0}` (masked) — plaster confined to the upper storey. Two more discipline points
fell out: **seal before paint** (so no stray is painted — the floating blocks were paint on un-sealed
geometry), and the **guard is structural** (a base/roof-plaster THROW), not the marginal resemblance number —
a `0.25→0.40` gain must not be able to rubber-stamp a zone-wrong skin (`[[twodee-interaction-sector]]`).

## E-24 durable high-quality results — the pipeline reproduces it, or it isn't a result (S-089, T-089-01) · 2026-06-10

The epic's origin: the good cottage skin (cream plaster band, ~77% coverage) existed only as an agent's
**inline hand-edit** (e8062fa) — `npm run spray:paint` regenerated the bad 9%-splat version. E-24 closes
that gap stage by stage, and this consolidation proves it end-to-end: **one named command per subject**
(`npm run skin:cottage` / `skin:gatehouse`, `benchmarks/sculpture/durable-skin.mjs`) composes value-true
block selection → seal → full-shell zone-fill → secondaries splat → coherent surface → coverage-aware
gate, on the **cottage and the gatehouse**, with no hand edits anywhere in the path.

**A splat cannot establish a dominant — fill first, polish second (T-085).** The concept-color splat
converted only 9–13% of the upper wall to plaster (quantization collapses cream/stone near-tones;
concept→face stretch misaligns the bands); replayed today on the exposure census it reads **5%**. The
deterministic zone-fill lays each zone's dominant on the skin *first* (upper lands at **88%** after the
full pass), and the splat is demoted to secondaries whose palettes exclude every field material — it can
never repaint the coat back to stone. On the gatehouse the same inversion shows on the roof: splat-only
**44%** deepslate → zone-filled **100%**.

**Value-true selection is a hue fix, honestly reported (T-086).** The E-21 map names blocks by rationale;
nothing checked the name against the concept's rendered value. The selection engine (chroma-weighted,
within the role's material family, prior kept absent clear margin) switched the cottage's plaster
`white_terracotta → sandstone` (the pink a* axis eliminated) and field `stone_bricks → tuff`; on the
gatehouse it switched the wall field `stone_bricks → polished_basalt` (true ΔE **9.49 → 4.9**) and kept
everything else (deepslate below-margin, dark_oak prior-is-best, thin-sample keeps). The trade is real and
recorded: value fidelity is bought with texture identity (tuff is flatter than dressed ashlar; basalt adds
vertical striping) and with *named-set* resemblance (the perceptual material-set score counts renamed
blocks as misses).

**The coverage-aware gate catches "looks the same" (T-088).** Coverage is a **precondition**, not a
tie-breaker: the splat-only replay is REJECTED on both subjects regardless of its resemblance delta, and
the final skin must pass or the runner **throws** — a failing skin cannot write a record. The proof both
ways is in each record (`coverageGate.splatOnly.passed: false`, `final.passed: true`).

**The durable rule (Rules 1+2): reproducibility is part of the result.** No LLM call is on the path — the
concept PNG and the material-map roles are committed upstream artifacts, frozen data. Every live run
executes the deterministic core **twice** and requires byte-identical artifacts; the artifact's sha256 is
recorded and `--offline` re-asserts it (plus gates + AJV) against the committed record. Cottage
`722af44b…` (9,707 placements), gatehouse `8a30c191…` (10,598).

**Where it over- and under-reaches (Rule 5, honest):**
- **Resemblance did not jump — and that's the finding.** Refreshed triptychs judge both subjects
  `drifted` (cottage gap: material zoning@roof; gatehouse: form@walls/roofline). Front-face resemblance
  evidence: cottage 0.35 → 0.30 (the sandstone band reads slightly *further* from the concept under the
  per-face metric than the grey splat did), gatehouse 0.344 → 0.344. E-24's claim is **coverage,
  coherence, value-truth, and reproducibility** — the resemblance ceiling is form + zoning work (E-25/E-26
  territory), and pretending otherwise would re-commit the "marginal delta rubber-stamps a skin" sin.
- **The census is the exposure shell (T-090), but the salt strip still judges the projection skin** — an
  off-dominant speck visible only obliquely survives the strip (it was filled by the base coat, so the
  residue is bounded, but the strip's instrument lags the fill's).
- **Roof-course bumps remain** (no-delete contract): cottage smoothness 0.827, gatehouse 0.784 — cleaner
  courses, not perfect ones.
- **Thin-sample roles stay unvalidated** (gatehouse cobblestone 3 cells, door planks 11; cottage chimney
  bricks) — the floor keeps the prior, which is the *absence* of a value judgement, not a pass.
- **The gatehouse "E-23 baseline" is a counterfactual** — no splat-only skin ever shipped for it; the
  replay shows what that path *would* have produced (labeled as such in the record).
- **Per-zone gate thresholds remain YAGNI** — 0.5 held on both subjects (weakest passing zone: base 71%);
  a legitimately secondary-heavy zone would still fail honestly-good skins someday.

**One sentence:** E-24 ends with the thing it was missing at the start — two subjects whose high-quality
skins (dominants established 88–100%, value-true blocks, coherent courses, gate-passing) are produced by
**one reproducible pipeline command** with the residuals named, instead of by an agent's hand.

## Subject roster refresh — retirement is a measurement decision (E-25 / T-094-01)

**Moai is retired; the concept was the defect.** The `runs/003` concept image shows **three statues in
one frame** on a black background. TRELLIS reconstructed it as a fragmented mesh (the smoke gate now
quantifies it: voxelized @48, **3 components, largestFraction 0.52**); the build was judged "different
object" mostly on debris and duplicate masses — verdicts that say nothing about design capability. The
lesson is upstream of every score: **a weird concept makes every downstream verdict ambiguous**, and no
amount of gate sophistication recovers it. Moai is moved to a `RETIRED SUBJECTS` block in
`benchmarks/sculpture/resemblance.mjs` (rationale inline, history and artifacts untouched); the live
resemblance roster is gatehouse + cottage + pineapple.

**Concepts now pass a sanity checklist BEFORE registration.** Recorded beside the image
(`runs/<id>/concept-checklist.md`), one row per attempt per item: single building · clean background ·
one canonical 3/4 view · ≥3 distinct material zones · readable silhouette · no environmental clutter ·
**bulky throughout** (no thin freestanding members — the TRELLIS thin-subject 500 / sword lesson).
Regeneration happens before registration; once registered the concept is **immutable** (E-25 Rule 2).
The checklist earned its keep immediately: the church's attempt 1 was rejected for a thin gold cross
finial *before* the TRELLIS call was spent; attempt 2 (steered via the BAML job's `attached` note,
failed attempt preserved on disk) passes all seven items.

**Church is the registered challenge subject (E-25 Rule 3).** Cottage and gatehouse both shaped the
pipeline; passing on them cannot prove generalization. The church — a village church with a square
bell tower: two attached masses, two roof forms (pitched nave + pyramidal tower cap), four material
zones, bulky throughout — was provisioned concept-first via the new `provision-concept.mjs` (vConcept
building mode stages 1+2, **deliberately no build**), minted to `glb/church.glb` via the TRELLIS
client, and smoke-checked with the new `glb-smoke.mjs` at the working scale 48: **26-conn 1 component,
largestFraction 1.0000** (48×37×40, 11,423 cells; 6-conn 0.955 reported only — cleaner than the
gatehouse's 0.83). The gate was validated both ways first: gatehouse passes reproducing its recorded
numbers; moai fails. Registration is `CHALLENGE_SUBJECTS` in `resemblance.mjs` — concept path, GLB
path, scale, **nothing else**: no material map, no build, no skin, no runner consumes it yet. The whole
point is that when the pipeline runs it, it runs it untuned.

## The concept-faithful pipeline ran end-to-end — and the milestone names what still fails (E-25, T-095-01)

**One command per subject now runs the whole chain.** `challenge:{cottage,gatehouse,church}` compose
the epic's stages in order — provision (challenge subjects only) → shell integrity (T-091) →
concept-derived zone map (T-092) → full-shell zone-fill with value-true + kit + secondaries +
coherence (E-24) → the multi-angle same-object gate (T-093) — with the deterministic stretch executed
twice per invocation and byte-compared, a `--repro` fresh-process re-proof, and gate failures recorded
as `pipeline-failed` results rather than tuned away. The records are
`benchmarks/sculpture/challenge/<subj>.{json,md}`; the sheets are the deliverable
(`pr/assets/frames/multi-angle-<subj>-challenge.png`).

**Full-shell + closure survived; roof FORM is still THE gap.** Shell repair (cottage 24→1 components,
958 voids; gatehouse 23→3, 820 voids; both CLOSED) and the exposure-shell skin gates (all bands ≥ 63%)
pass on both developed subjects — plan-view coverage ≠ skinned is fixed at the *material* level. The
judge then fails both subjects the same way it failed the T-093 baseline: **major form/massing@roof at
the 30° contract elevation** (cottage 2× drifted + 1 coverage; gatehouse 2× different-object + 2×
drifted). One genuine improvement: the cottage's 315° view now reads **same object** (2 minor gaps) —
the first real-subject view ever to pass a judged azimuth. Zoning and value-truth were never the
oblique problem; voxel roof *form* is, and no amount of skinning fixes it.

**Concept-derived zoning beats priors, and shifts under repair — recorded, not gated.** The derivation
re-run on the shell-repaired builds diverges from the committed unrepaired-build records (cottage band1
y7..13 → y7..16): band extents are a function of geometry, so the chain records the derived map + a
diff vs the committed record instead of asserting agreement across different geometry. Honesty
preserved, determinism preserved.

**The church generalization run failed exactly where it should.** The pipeline is provably generic —
`grep church` hits registry data only — and the untuned run produced a *named* blocker, not noise: the
E-21 feature-assigner hands corners/base/openings ~55% of the church's lower shell (tower + buttresses
+ many windows), the concept's cobble wall field tops out at 0.33, and the T-088 coverage gate refuses
to ship the skin. Over-reach honestly stated: the E-24 skin machinery generalized; the E-21 provision
stage did not. The secondary-share problem routes to E-26 (kit grammar, dressed openings), not to gate
tuning.

**Instrument lesson: name spaces must compose at every seam.** The multi-angle gate censused the NAMED
policy through the value-true substitution but was blind to T-096's kit overrides — every kit-renamed
band measured 0 and views failed on *naming*, not coverage. The fix is at the gate's single renaming
point (kit overrides composed over the substitution, allowed-guarded). Symmetric lesson to "recognition
beats snap": any new renaming layer must be applied at every consumer's naming seam, or downstream
instruments silently measure the wrong block.

## Concept style kit (E-26) — recognize the blocks, place them by grammar, gate on their presence (S-096…S-101, T-101-01) · 2026-06-10

**The five-whys that opened the epic.** The original complaint: the cottage concept's instantly
identifiable ingredients — smooth sandstone panels, a timber frame, trapdoor shutters, fence-infilled
windows — were absent from builds that nevertheless *passed gates*. Why ×5 bottoms out in a contract
error: E-21's material map asked the model **which color** each role should be, not **which block**
the concept depicts. Concept art depicts *nameable blocks* (a Minecraft artist drew trapdoors, not
"medium-brown rectangles"); mean-color matching collapsed near-tone-distinct materials and silently
dropped every non-cube fixture. The fix is recognition: T-096 extracts a **kit** ({block, role,
formClass, whereUsed, confidence}) from the concept by multimodal recognition, validated against the
survival vocabulary, with values **verified** in chroma-weighted CIE-Lab (flag-for-review after
removing the shared concept-shading offset — never a silent color-snap). Recognition beats snap:
smooth_sandstone replaced the white_terracotta snap on cottage band1; trapdoor/door/lantern were
recovered; the fence the model couldn't name was recorded as an honest fallback and later derived by
species (spruce_trapdoor → spruce_fence), reversibly.

**The fixture path exists and the lens has one named hole.** T-097 proved placement + render for
trapdoors, fences, slabs, doors, lanterns with CARD_ROWS as the block-state vocabulary — and proved
by read-back that NO stair block renders at any state in prismarine-viewer 1.33.0. Stairs stay out
of kits until the lens is fixed; that's an instrument boundary, not a design choice.

**Placement is grammar, not paint.** T-098 binds the kit to structural sites — frame block on the
frame lines (corner posts, eave/rake crowns, floor-line beams), panels and courses re-realized
through zoneFill itself — under the T-090-01 contract proven not assumed: `frameRefilled` MUST be 0
(the frame is an honored declared secondary of every band it crosses). T-099 dresses the
concept-declared apertures (measured on the raw pre-seal reference; the skin's sealed panes are
re-opened by last-write-wins) with kit treatments; every conflict is named, unfulfilled slots are
recorded, and shutters hang by Minecraft-compass ground truth.

**The gate that doesn't enumerate can't demand.** The 512px judge names "material zoning," never
"missing trapdoor shutters" — so missing ingredients hid behind verdicts for four epics. T-100's
kit-presence checker enumerates by the **fixpoint rule**: an ingredient is present at its sites iff
re-running the pure op that supplies it is a no-op there. Absences come back named
(`missing: spruce_trapdoor shutters @ openings 3/4`); tolerated geometry is inherited from the ops
that define it; the verdict composes as resemblance AND presence — both run, both reported.

**The terminal milestone (T-101): one named run, and the two seams only composition could surface.**
`styled:{cottage,gatehouse,church}` runs kit (committed record, pinned by its raw reply) → shell →
skin → grammar → dressing → settle → the kit-aware gate, double-run byte-compared, `--repro`/
`--offline` proofs, honest `pipeline-failed` records. Composing the stages end-to-end surfaced two
instrument seams no single-stage run could see:
1. **Dominant-only per-view coverage rejected the styling itself.** The styled band1 at 45° is 23%
   dominant but **96% own materials** (frame + logs + panels) — the T-088 per-view census, built for
   monolithic plaster fields, counted the kit's supplied ingredients as under-coverage and never
   called the judge. Fix: census **own materials** (dominant + declared preserve — exactly T-090's
   band-evidence set). Strictly monotone (anything that passed still passes); foreign leakage still
   fails.
2. **The dressing perturbs the grammar's own read.** Re-opening panes changes the frame-line
   geometry near apertures (one chimney-adjacent cell flipped to paintable) and breaks kept runs
   (6 own-vocabulary residue cells). The styled chain now re-runs the SAME grammar op to its own
   bounded fixpoint (**settle**: cottage 1 iteration, gatehouse 2) — the styled build is a no-op for
   the op the checker re-runs, and the settle is the post-dressing cleanliness pass T-100 predicted.

**Milestone outcomes — the kit claim closed; form did not.** Cottage: kit presence **PASS, zero
gaps** (door/light are named detector skips), all four views reach the judge, resemblance FAIL
12/2 — major form@roof at three obliques, while the timber framing reads as *minor zoning*: the
ingredients are now visibly there, and the residual gap is the E-25 roof-form finding, untouched by
styling (as predicted — no amount of skinning or dressing fixes voxel form). Gatehouse, untuned:
kit presence PASS with the kit's own four named skips (it ships no opening treatments); resemblance
FAIL 12/2 with two different-object views (form/massing — its E-25 result). Church, untuned: blocked
at the named kit precondition — kit extraction needs a committed zone-map record, zone derivation
runs inside the skin chain, and the chain still fails the T-088 skin gate (band0 stone 0.33 < 0.5,
the E-25 provision finding); the styled record names the whole dependency chain rather than
inventing a kit nothing validates.

**Over-reach, honestly.** The shared-shading offset in kit value-verification is a judgment call
calibrated on this data (whitelist-quantization circularity noted in T-096). The species-fence
derivation is policy, not recognition. The checker tolerates own-vocabulary sub-minRun residue —
principled (the fill's cleanliness contract) but it widens what "present" accepts. The settle pass
can undo isolated dressing jamb recolors (the run rule wins — recorded, visible in counts).
Under-reach: door detection still can't see the cottage's non-through doorway (skip, not absence);
stairs are lens-blocked; the roof-form gap needs a form-stage fix (E-15/E-16 territory), not a
material one; church needs the E-21 provision stage generalized before any styling applies.

**E-12 handoff.** The scoring layer should consume, per subject: `benchmarks/sculpture/styled/
<subj>.json` (the chain record: stage evidence, settle, sha256s), `multi-angle/<subj>-styled.json`
(per-view verdicts + `kitPresence` + `overall`), and `pr/assets/styled-<subj>-kit.md` (the kit with
its presence verdict). The deterministic presence verdict is the accountability instrument (cheap,
named, reproducible); the judge is the perceptual one (metered, pinned-model, single-sample) —
score them as components, never collapse them: the epic's lesson is that one number hid the other
for four epics.

## Parametric reconstruction (E-27) — the reference is the spec, not the substrate (S-102…S-107, T-107-01) · 2026-06-10

**The five-whys that opened the epic.** E-25/E-26 closed with `form @ roof` named at every oblique
azimuth on cottage and gatehouse, untouched by styling — and why ×5 bottoms out in a *substrate*
error: the chain treated the decimated mesh as geometry to copy rather than a spec to read. Spikes
enter at voxelization (the styled cottage carried 265 protrusions / 21.7% ragged columns; the bare
shell 276 / 23.9%); every downstream stage inherited them, and re-authored surfaces passed gates
while mesh-inherited ones failed. E-27 rebuilt the middle of the chain around parameters: a
regularization cage (T-102 — morphological open/close under per-azimuth IoU no-regress gates;
close does the work, cross-SE can't shave spikes), blob→components (T-103 — slab decomposition
with arbitration), roof as a *program* (T-104 — fitted gables emitting stair courses, the
attempt-ladder letting the cage arbitrate glb-vs-voxel pitch instead of tuned constants), a shaped
vocabulary (T-105 — stairRun/slabStep/archRing as subject-agnostic generators; the arch ring is
full cubes, the Minecraft-native arch), and a chain that CONSUMES the component layer at four
seams with pin-THROW staleness tripwires (T-106).

**The terminal ticket found the lens lying again (T-107).** The T-106 verdicts still FAILed on
roof form — but the judge was looking at a notched solid wedge, because **no stair block had ever
rendered**: T-097 pinned "stairs-invisible" as a viewer limitation, and T-107's root-cause hunt
landed on one line — prismarine-viewer's `getModelVariants` short-circuits any block whose *name
contains the substring* `air`, and every `*_stairs` name does (st-**air**-s). The stair models were
always present in blocksStates; only the lookup dropped them. The fix is one exact-name line,
applied on disk (the mesher runs in worker threads — a monkey-patch can't reach it) by a
postinstall script with an import-time tripwire that THROWS before any render through an unpatched
install, plus a GL-free mesher regression suite and a re-cut fixture card (stair rows visible,
25/25 read-back unchanged). This is the second E-22-class lesson: **when a verdict resists a form
fix, audit the lens before the build** — render aliasing in E-22, mesh deletion here, both judged
honest geometry as drift.

**Instrument frozen, and proven frozen.** The re-verdicts were taken with zero contract diffs: the
terminal runner pre-captures the committed gate record's contract + judge model, deep-diffs after
the run, and records the diff (empty, all subjects; judge pinned `claude-opus-4-8`). The per-view
coverage precondition is censused on the occupancy's diagonal projection, not pixels, so the lens
fix *cannot* move coverage arithmetic — only the judge's eyes changed, and only where stairs exist.
One gate run per subject is the verdict; no re-rolls (the flappy-budget anti-pattern).

**Milestone outcomes — form moved; it did not close.** Against the pinned E-26 baselines
(provenance-stamped snapshots from history; the cottage baseline re-derives the motivating census
exactly):
- **Cottage** (styled chain): protrusions **265→51**, ragged **21.7%→6.8%**; kit presence PASS;
  135°/225° now judge **same object** (they were the E-26 failures); resemblance still FAIL 10/2 —
  major form@roof at 45°/315° names the *gable-end massing*, a true voxel-form gap, not lens debt.
- **Gatehouse** (styled chain): protrusions **118→25**, ragged **14.1%→9.9%**; kit presence PASS;
  315° same-object; the 225° "colonnade instead of arched doorway" major gap is **gone** — the
  generated arch reads as *minor* form; still FAIL 11/2 with major form@roof at three views
  (ridge + upper edges).
- **Church** (challenge chain, kit-less by registry): the refusal REPRODUCES at the skin coverage
  gate, band0 stone=0.327 < 0.5, and the record carries its measured cause — the defined wall
  field is 59% polished_basalt vs the concept's stone declaration, on-slab ≈ off-slab: a
  **material-assignment divergence** (E-21 territory), not blob noise. The reconstruction itself
  moved the shell census 602→202 spikes, 24.3%→14.0% ragged. Roof program is a named fallback
  (every fitted gable pair insane on the blob); no kit, no zone-map — all registry data, all named.

**Over-reach, honestly.** The lens fix changes every future render containing stairs — prior
epochs' committed PNGs stand as their eras' evidence (records pin their own renders), but
cross-epoch pixel comparisons now straddle two lenses; the instrument-diff record is the receipt
that thresholds/azimuths/judge never moved. Cage outcomes are distilled from the *standalone*
regularize records (the chain re-cuts in-process; the church standalone record is stale by the
T-106 finding and labeled so in the terminal record). The roof-fit summary separates "fit error"
from "ladder-rejection divergence" only after a first mislabel (glb pitch 7.47 vs adopted voxel
1.88 is the *rejection cause*, not a build error) — fixed via `--distill-only`, which rebuilds the
record from committed outputs without re-rolling the judge. Under-reach: the remaining
form@roof majors (cottage gable ends, gatehouse ridge) are genuine geometry gaps the component fit
hasn't reached; the church needs the E-21 assignment generalized (or a kit) before any verdict can
exist; stairs in *kits* (T-096 scope) remain unexplored now that the lens permits them.

**E-12 handoff.** The showcase layer should consume, per subject:
`benchmarks/sculpture/reconstructed/<subj>.json` (the terminal record: instrument confirmation,
census deltas vs the pinned E-26 baseline, roof fit, cage outcomes, refusal re-measurement, sheet
paths), `multi-angle/<subj>-styled.json` (per-view verdicts + kit presence + overall), and
`pr/assets/frames/reconstructed-<subj>-{before,after}.png` beside
`pr/assets/reconstructed-milestone.md` (the epic sheet). The march-of-progress frame pair is
before/after at the same four azimuths through the SAME fixed lens — and the story beat is the
census table next to the verdict movement: deterministic metrics moved an order of magnitude,
perceptual verdicts moved two views and one major gap; score them as components, never collapse
them.

## Component-fit closure (E-28) — finish the fit, then ask the question (S-108…S-111, T-111-01) · 2026-06-10

**The five-whys that opened the epic.** E-27 closed with every FAIL converted into named, specific
gaps — gable ends, verges, eaves, ridge lines, silhouette residue, and a church that had never
reached its gates. Why ×5 on "form @ roof persists" bottoms out in *unfinished construction*, not
mis-measurement: the roof program fitted side planes but improvised its ends and ridge, the
regularized blob still carried unconsumed plane fragments, and protrusion judgments were blanket
protections rather than per-mass GLB evidence. E-28's thesis — **finish the fit** — built each
missing piece as cage-arbitrated construction: per-gable-end GLB fits with anchor-bounded windows
(T-108: triangle on the fitted face plane, verge/rake as open-underside sheet courses, eaves ending
at fitted tips), ridge as the side-planes' intersection with the GLB apex line recorded as evidence
never applied as height (T-109), unconsumed planes clamped to their own fitted planes, a
silhouette-residual pass that removes only what the GLB refutes at some azimuth (membership =
spill-free at EVERY azimuth — 30° cameras hide near-side warts), and the church unblocked by its
two measured causes (T-110: the band0 census was kit-blind — third instance of the class — and the
whole-mass roof fit needed to run per component).

**The instrument stayed frozen, third exception included.** The T-110 coverage-census fix moved the
gate to the role-family metric (`ownCoverage`, `metric:"own"`) under E-28 Rule 1 discipline:
monotone proven by committed-record replay + an own ⊇ dominant property test
(`src/view/coverage-monotone.test.mjs`), both fractions reported in every new record, committed
records untouched. The closure runs then proved the freeze the usual way: pre-captured contract
deep-diffed per subject — **`diffs: []` on cottage and gatehouse, judge `claude-opus-4-8` pinned;
the church never reached its gate, so its instrument is untouched by construction**. One judge run
per view, verdicts committed as judged (the 4/4-drifted gatehouse included).

**Milestone outcomes — construction landed; verdicts did not flip.**
- **Cottage**: 3/4 gable ends fitted (faceRmse 1.0–1.5), ridge rung accepted
  (`end-fitted-voxel-pitch-ridge-fit`, apex shortfall now a record value: Δ −1.404/−2.113),
  4 terminations, chimney exempt-shown. Verdict: FAIL 10/2 — the two same-object views (135°/225°)
  **held**, and the 45° major changed kind (form → roof-vs-walls *massing*); 315° form major
  remains. Census 51→86 spikes vs E-27 — measured cell-by-cell: +38 = 36 `spruce_planks` + 2
  `dark_oak_log` in the roof band, i.e. the **declared** verge sheets/caps the full-occupancy
  census counts by design (ragged improved 6.8→6.3%).
- **Gatehouse**: ladder accepted voxel-pitch gable-ends; ridge intersect invalid (named, as-built
  stands); 7 terminations; both residual masses GLB-exempt (flat band @ y31.5). Verdict: FAIL 12/2,
  **4/4 drifted** — the judge names the "extra protruding masses" the GLB corroborates. The
  membership test is per-mass; the judge sees per-column. That divergence is the finding.
- **Church**: first roof cut under the new cores (nave `end-fitted-gable-ends` accepted, ridge
  Δ +0.378; tower fallback named — *a pyramidal cap is not a ridge pair*; 12/14 terminations;
  18 residual cells removed with azimuth evidence) — then the first kit-routed styled chain
  **refused at settle**, still wanting frame 13 / foreign fill 168 after 4 re-runs. The cause is
  structural, the construction-side twin of the census-identity class: grammar and dressing each
  compose map + kit + value-true substitution on their own, and disagree about ~170 cells
  (`stone_bricks` bound vs `polished_basalt` shipped). Recorded, not tuned.

**Over-reach, honestly.** Fitted construction was *necessary* (the E-27 verdicts named it) but on
this evidence **not sufficient to flip a perceptual verdict**: deterministic fits moved (fit
errors recorded everywhere), perceptual majors moved kind or persisted, and one subject regressed a
view — score them as components, never collapse them. The naive ≥4/6-faces census now counts
declared sheet/cap cells as "spikes"; the number is honest but its *meaning* changed — any future
census comparison must read the declared-cell ledger beside it. Under-reach, all named and now
owned by E-29: hip/pyramid caps (the tower), per-column silhouette membership (the gatehouse
masses), one material-vocabulary authority (the church settle; S-113's proof is "the chain
settles"), and judge-reply robustness (the 225° unparsed REFUSAL — a parse failure is not a
verdict).

**E-12 handoff.** The showcase layer should consume, per subject:
`benchmarks/sculpture/reconstructed/<subj>.json` (terminal record: per-view
angle/region/attribute/severity verdicts, instrument diff, census vs pinned baseline, roof fit,
refusal cause), `multi-angle/{cottage,gatehouse}-styled.json` + `multi-angle/church-challenge.json`
(the church's first and only gate verdicts, REFUSAL included), `roof/<subj>.json` (fit errors:
per-end faceRmse/overhang, ridge Δ, terminations, residual decisions), and
`pr/assets/frames/closure-<subj>-{before,after}.png` beside `pr/assets/closure-milestone.md`. The
story beat is the *kind* of movement: E-27 moved census numbers an order of magnitude; E-28 moved
fit errors from "improvised" to "measured"; the remaining gap between measured geometry and
perceptual same-object is E-29's question, with its targets pinned to these verdicts.

## Generate-first (E-29) — the inversion measured, and what a fourth subject taught it (S-112…S-116, T-116-01) · 2026-06-11

**The inversion thesis, machine-checked.** E-29 asked whether the pipeline should stop repairing
voxelized TRELLIS blobs and instead *generate* the build from fitted parameters, demoting the blob
to fit evidence and cage target. T-115 ran the head-to-head on all three legacy subjects under the
frozen ruler: zero blob cells in every artifact (`assertGeneratedProvenance` + the
regenerate-from-record byte proof), `instrument.diffs: []` on all three, one judge run per view.
The verdict (`pr/assets/generate-first.md`): **a peer on the judge** (cottage 12 vs 10 gaps,
gatehouse 12 = 12, church 12 = 12 — and the church runs end-to-end on this path where the T-111
repair chain refused pre-gate), **strictly cleaner under the craft censuses** (spikes 86→53 /
43→26 / 204→62; church ragged 15.9%→9.9%), every loss traced to a named fit refusal. Roof FORM
remains THE seam on every azimuth of every subject — unchanged since E-27, now measured on fully
authored roofs.

**The fourth subject (T-116-01) — first-run generalization is gated by the weakest lens.** A
checklist-clean tithe barn (S-094 passed attempt 1; inn→barn fallback decision recorded with
code-grounded reasons) registered as pure registry data — and the generate-first milestone **did
not run**: the T-092 zone lens refused the concept (`no-field-cells` — cobblestone, the only
walls-rule field block, dominates zero quantized rows; the cobble panels quantize into
stone_bricks, ΔL 2.082 — the E-21 near-tone collapse surfacing in the zone lens), kit-extract
hard-requires derived bands (kit.mjs:122), the generated runner hard-requires kit
(generated-milestone.mjs:476). Meanwhile the untuned repair chain *tolerated* the same unreadable
concept via the named policy fallback and carried the barn to an honest FAIL 12/2 (4/4 drifted —
the gatehouse profile). **That asymmetry is the epic's sharpest scaling result: the repair path
degrades gracefully under lens failure; generate-first's preconditions concentrate eleven epics of
lens-hardening risk into the first run.** Per E-25 Rule 3 the contracts were not relaxed; the
stall is the measurement. The pinned bar (cottage T-111 profile: kit PASS, ≥2/4 same-object,
≤10 gaps) is recorded as not reached — never judged.

**Which path scales — the honest answer.** On *craft*, generate-first, decisively: authored
geometry has nothing to exorcise. On *judge resemblance*, neither yet: roof-form fitting coverage
is the single address for both. On *robustness to new subjects*, today, the repair path — by
design accident, not virtue: its fallbacks are named and graceful where generate-first's
preconditions are hard throws. The route forward is not to soften E-25 Rule 3 but to finish the
E-26 move on the last color-matcher: the zone lens should *recognize* bands (the kit already
recognizes blocks) instead of color-matching rows; the kit precondition could then keep its
contract and still bootstrap any checklist-clean concept. One more named over-reach: the S-094
checklist gates concept GEOMETRY but not LENS READABILITY — a pre-registration zone-extraction
smoke (concept + map + conditioned evidence occupancy) would have caught this before the TRELLIS
spend. And one under-reach worth keeping: the glb-smoke single-component gate failed the barn at
every scale on ONE floating mesh cell (largestFraction ≥0.9813 everywhere) while the chain's own
`shellStage` conditioning strips it — the strict gate over-fires on sub-speck debris; the
conditioned-evidence probe is the truer read (named deviation in `runs/017-…/concept-checklist.md`).

**The T-111 residual ledger, closed out.** (1) *Gatehouse 4/4-drifted / per-mass membership*:
open by instrument-freeze; both paths sit at 12/2 with roof-form majors — routed to the roof-form
epic with everything else at that address. (2) *Spike-census declared-cell ledger*: the
generated-path records census beside declared cells — cottage 53 spikes with 80 declared
sheet-cells, gatehouse 26 with 0, church 62 with 17 declared cap-cells (vs T-111 repair 86/43/204
with the cottage's 36+2 declared verge/cap cells) — E-12 must read `census.declared` beside the
naive numbers or census deltas lie. (3) *Church verdicts*: both seams closed upstream — settle by
T-113 (vocabulary authority; 1 iteration), the challenge 225° REFUSAL by T-114 (re-judged under
the bounded reply policy to a decided FAIL). Cited, no work here. (4) *Stale reskin pins*:
attempted this ticket and **reverted with a finding** — T-111's "cheap, named" re-cut assumption
was wrong: `component-skin.mjs` is not read-only distillation, it re-runs the chain *and the
judge*. The re-cut runs re-judged all three styled gates (cottage moved 10→11 gaps with the 135°
same-object flipping to drifted — the known budget-edge flap) and overwrote the pinned verdict
records that T-111/T-115 instrument-diffs and this epic's tables cite. Adopting those verdicts
would be the re-roll E-28 Rule 4 forbids, so the commit was reverted and every pin restored
byte-identically; the fresh verdicts are recorded here narratively and nowhere else. Routed: pin
rotation needs its own policy ticket (which verdicts become canonical, plus an explicitly
read-only distillation mode), not an improvised rotation inside a milestone ticket.

**Pins are now structurally protected (E-30, T-119-01).** The two T-116 incidents (the reskin
re-cut that silently re-ran the judge; the swallowed-`--` kit sweep) closed into mechanism, not
vigilance: every record write in the nine pin-writing runners goes through the pin-guard
(refuse-by-default, byte-identical always passes, `--rotate-pins` explicit, preflight before any
model/judge spend — a swallowed flag now fails CLOSED), and `component-skin.mjs --distill-only`
rebuilds reskin records from committed outputs through a pure distiller whose import graph cannot
reach the judge. The binding rules live in **`pin-rotation-policy.md`** (citable; enforced by the
S-119 conformance sweep). T-111 residual 4 is **decided** there: styled verdict pins retained as
canonical (one judge run per view), the three stale `component-skin/*` summaries rotated
judge-free with the retired pins named in the commit — the distillation also surfaced that ALL
three reskin records (not church alone) had drifted from the milestone records they cite.

**E-12 handoff.** Per legacy subject: `generated/<subj>.{json,md}` (terminal generate-first record:
fit + refusals, zero-blob proof, cage evidence, head-to-head row), `multi-angle/<subj>-generated.
{json,md}` + sheets `pr/assets/frames/multi-angle-<subj>-generated.png`, kit reports
`kit/<subj>.md`. For the barn: `runs/017-…/concept-checklist.md` (registration + decisions),
`challenge/barn.{json,md}` + `multi-angle/barn-challenge.{json,md}` + sheet (the untuned
first-contact comparator), `zone-map/barn.{json,md}` (the refusal record with the stall's cause),
and the fourth-subject section of `pr/assets/generate-first.md` (the comparison table + the
robustness-asymmetry finding). The story beat: E-27 moved censuses, E-28 moved fit errors from
improvised to measured, E-29 moved the *build* from repaired evidence to authored parameters — and
its fourth subject relocated the frontier from the generator to the lenses that feed it.

## First-run generalization (E-30) — the stalled proof runs, and what it cost to get there (S-117…S-121, T-117-01…T-121-01) · 2026-06-11

**The weakest-lens finding, closed at its root (T-117).** E-29 ended with `generated:barn` never
starting: the zone lens color-matched rows and the barn's cobble panels quantize into stone_bricks
(ΔL 2.082 — the E-21 near-tone collapse, surfaced one lens downstream). The fix was the same move
E-26 made on the kit: *recognize, don't color-match* — `fieldResolution` derives a bare
feature-key → walls-key resolution entirely from the committed map's `placementRule` rows and
`nearTonePairs`, engaging only from the exact prior failure state (rung-1 empty + field blocks
present), with roof keys never eligible. The barn's zone map derived from the concept on the first
post-fix run (`zone-map/barn.json`, band0 cobblestone share 1.0); the legacy maps regenerated
byte-identically. The lens was the last color-matcher in the chain; nothing was tuned.

**Diff-then-fit (T-118) and the instrument that refuses flattery.** The roof-region diff
(`roof-diff/*`, GLB-anchored, per-region per-azimuth) was built BEFORE any refit — and then
refuted every refit it was supposed to license: cottage ridge height was already right, gatehouse
intersect-resolution would have *lowered* a correct ridge, the church pyramid stays refused by
design. The only landed change was an evidence repair (`fitRidgeLine` protrusion exclusion —
chimney-polluted apex lines). The discipline held in T-121's re-judge: the generated-cottage
cross-gable ridge (`gable-roof-2-roof-3`, mean delta **−4.015**, the −3.445-class signal T-118
named) is **still open** — the repair fixed the *reading*, not the build; the generated ridge sits
~4 cells low. Standing target, now with a receipt at both ends.

**Pins and registration became preconditions, not hopes (T-119/T-120).** Every record write in the
pin-writing runners refuses by default (`--rotate-pins` explicit, preflight-before-spend, swallowed
flags fail closed); `registration:smoke` runs the REAL lens against proxy geometry before any
TRELLIS spend; the glb-smoke gate gained a declared speck budget. The barn entered T-121 with
smoke-pass receipts and immutable inputs — and the F1 byte-match tripwire fired mid-ticket exactly
as designed when the legacy milestone records rotated under it (reskin distillations re-rotated
judge-free via `--distill-only`).

**The barn proof (T-121) — first contact found three more lens/op defects, then judged honestly.**
`generated:barn` stalled three times before its first verdict, each stall a generalization defect
in machinery that legacy subjects never exercised, each fixed by a rule the codebase already
stated: (1) the band census y-binned the steep gable's wall cells (and the wall-top course one
notch above the committed zone-map eave) into the roof zone — `planCensusZoneOf` gained the DUAL
of its own roof-program rule (generator-provenance mass cells census `roof:gable`, measured never
gated; undefined cells still gate, so spikes survive); (2) `sealRoof`'s most-common-top-block read
declared the WALL field "the roof" (gable tops out-project the roof planes on a steep gable) and
stripped the program's slab/stair eave courses — the stage-8 course rule now applies to the seal
(program footprint filtered, never auto-"fixed"); (3) the kit's only trim and roof cubes carry
first-run `flagged-mismatch` value checks, and the grammar milestone hard-required a binding —
`bindKit` now separates `all-flagged` (a review state: degrade to the recorded no-op, its own
documented contract) from `no-candidate` (still a wiring-bug throw). The flags STAND; nothing
shipped, nothing tuned. Then the chain ran end-to-end: zero-blob PASS (6513 cells, regenerated
byte-identically), settle 0 iterations, `--repro`/`--offline` receipts exist for the first time,
**verdict vs the pinned T-116 bar: kit presence PASS · resemblance FAIL 12/2, 0/4 same-object** —
major form@roof on every azimuth, the roof-diff agreeing (4416px, roof share 35.1%, worst +x+z).
The same 12/2 first-contact profile as the church. One honest wart: the committed record's
generalization grep reads `clean:false` — it caught a code COMMENT this ticket added (the word,
not a branch); comments reworded for every later run, the record not re-rolled to launder an
evidence field.

**The legacy re-judge — the ruler held, the holds did not.** One judge run per view under
`--rotate-pins`, instrument receipts `diffs: []` on all four records (the receipt now lives in
`src/form/gate-instrument.mjs`, one composition point, styled-milestone finally emits it):
gatehouse 12/2→12/2 (held), church 12/2→12/2 (held), cottage styled **10/2→12/2** — the T-111
135°/225° same-object holds did not survive the re-cut (the budget-edge flap T-111/T-116 named,
now on a moved artifact: this ticket's seal/census fixes are in every chain), cottage generated
12/2 with one hold → 12/2 with none. Movement is build+judge by receipt, never gate drift. The
honest reading: **no legacy verdict beat its profile**; the epic's gains are upstream of the judge.

**Over/under-reach, named.** Over-reach: hoping the T-118 evidence repair would close the
cross-gable through a re-judge — it measurably did not (fit repair ≠ build repair). Under-reach:
the pinned bar (≥2/4 same-object, ≤10/2) has now never been met by any generate-first run; roof
FORM is still THE seam, unchanged since E-27, and kit-presence "PASS" on the barn is a fixpoint
over what *shipped* — with frame/course unshipped (all-flagged) the check is honest but thin; a
presence semantics for flagged-kit subjects is an open seam. The win this epic actually banked:
a never-tuned subject now goes concept → registered → derived → generated → skinned → judged with
receipts at every stage, and every stall it hit is now a named, regression-tested rule.

**E-12 handoff.** Barn first-evers: `generated/barn.{json,md}` (zero-blob proof, fit refusals,
census + fit-error tables), `multi-angle/barn-generated.{json,md}` + sheet
`pr/assets/frames/multi-angle-barn-generated.png`, `roof-diff/barn-generated.{json,md}` + sheet
`pr/assets/frames/roof-diff-barn-generated.png`, durable/styled frames. Legacy before/after:
fresh sheets at the canonical `multi-angle-<subj>-<label>.png` paths beside the retired pins
preserved as `…-t111pin.png` / `…-t115pin.png` / `…-prevpin.png`; prior records under
`docs/active/work/T-121-01/before/`. The story beat: E-29 proved the generator; E-30 proved the
*pipeline around it* — and relocated the frontier again, from the lenses to roof form itself.

## Pattern-book builder (E-31) — recognition over reconstruction, judged once (S-123…S-127, T-127-01) · 2026-06-11

**The thesis, banked.** Eleven epics of metrology tried to *reconstruct* the concept — fit the
mesh, diff the roof, close the ridge — and the frontier kept relocating into roof form. E-31
inverted the stance: the model **recognizes** the concept's forms (T-125: concept + conditioned
sketch → a `building-program/v1` in the pack's vocabulary), canonical pattern-book realizations
**substitute** for fitted geometry (T-124 registry constructs — clean by construction), and the
model **revises its own work** in a conformance-caged workshop (T-126) that is structurally
unable to reach the frozen judge. T-127 ran it end-to-end and convened the judge once per
subject — the epic's only judge calls.

**The chain.** `npm run patternbook:<subj>`: committed sketch → committed recognized program
(re-asserted byte-identically, never re-sampled) → seed under the declared budget (6 rounds, the
fixture calibration) → workshop loop → final build + consumption plan + chain record.
`patternbook:repro`/`:offline` replay the whole chain byte-identically (no model, no GL).
Judging stays outside: `gate:patternbook:<subj>`; `src/workshop/isolation.test.mjs` scans the
chain runner itself, and the pin-guard's workshop-domain refusal covers every write. All
milestone records were first writes — no pins rotated, nothing retired; one superseded
(never-committed) cottage gate run is named below.

**The head-to-head, whichever way it fell** (committed: `pattern-book/head-to-head.{json,md}`,
sheets side by side in `pr/assets/pattern-book-milestone.md`):

| subject | pattern-book | metrology best (generated, T-122) | read |
| --- | --- | --- | --- |
| barn | FAIL **8/2, all 8 MINOR — same-object 4/4**, kit presence PASS | FAIL 12/2, majors on every view — 0/4 | the roof-form seam (E-27→E-30's frontier) is GONE: a roof authored as a program reads as a solid shingled mass at every azimuth |
| cottage | FAIL by coverage — **judge never called** (band1 invisible at the contract lens) | FAIL 10/2 — 2/4 | the build is legal, conformant, and proportioned wrong: eaves + jetty bury the upper storey at 30° elevation |

The barn verdict is the epic's claim landing: **every view same-object** on a never-tuned
subject, zero major gaps, and the residual minors are window dressing (literally: long-wall
openings vs the concept's doored stone wall) — against a metrology best that never got a single
same-object view. And it was the **seed draft**: the workshop accepted nothing on the barn.

**What the model's own revision loop did and didn't catch.** Cottage (5 accepted, declared done):
round 1 it named the concept's signature — half-timbering — and pursued it for four rounds
(roof trim adjust + dark-oak stud paints), all cage-clean. What it never did: touch the
*geometry* params that caused the defect it ALSO named four times ("eaves swallow the upper
storey") — it painted walls it could not make visible. Barn (0 accepted, budget-exhausted):
round 1 the cage **saved the build** from a wrong read (the model wanted the roof spruce; its
own round-2 critique reversed: dark oak matched); round 2 the cage **blocked a right read**
(wooden wagon doors — the T-126 static-band-declarations limit, confirmed live exactly as
predicted); round 3 it reached for `re-recognize` (unwired, S-125 seam — second recorded
demand); rounds 4–6 it fixated on repainting one door bay. The loop's value on real subjects is
real but bounded by its action vocabulary: it sees proportion and aperture truths it cannot act
on. That is a **measured limit of the model's revision reach**, not of its visual judgement —
its critiques were right about every defect the judge (or the lens) later named.

**The instrument lesson (chain-side, gate untouched).** The first cottage gate run
coverage-rejected all four views: 632 spruce-stair roof courses censused as foreign because the
pattern-book chain had not persisted its consumption plan — the roof course family enters the
frozen gate's vocabulary ONLY via `componentPlan.roof.family` (the T-106/T-113 contract; zero
judge calls were spent, the run was superseded in place, untracked — the T-125 precedent). Fix:
`componentPlanFrom(program)` — the program is the authority; roof cells + family persist beside
the final artifact, `--plan-only` backfills, `--repro` re-derives and byte-compares. The re-run
then told the deeper truth: the 87 "upper-band" cells the first census saw were gable triangles
(program-owned roof); the true upper wall has **zero visible cells** at the contract elevation.
The lens did not lie — the proportions are the defect, and the workshop's own ledger had
already said so.

**Over/under-reach.** Over: expecting a budget-6 paint-and-params loop to act on massing
critique — the actions exist (`adjust-params` can reshape the shell and roof) but the model
never aimed them at proportions; nothing in the prompt teaches that reach. Under: the ticket's
bar — beat cottage 10/2 (2/4) and barn 12/2 (0/4) — **met on the barn, decisively; missed on
the cottage**, with the cause named per view (band1 occlusion → coverage refusal; the
arithmetic "0 gaps" row carries an explicit under-statement warning in the table). Named next
rungs, all with recorded demand: declarations that co-move with accepted actions (the barn lost
a correct wagon-door read to it), the `re-recognize` applier (reached for twice now), and a
proportion-aware revision action or prompt.

**E-12 handoff.** `pr/assets/pattern-book-milestone.md` (both sheets side by side per subject),
`pr/assets/frames/multi-angle-{cottage,barn}-patternbook.png`,
`pr/assets/frames/workshop-{cottage,barn}-{before,after}.png`, the one-table
`pattern-book/head-to-head.md`. The story beat: E-29/E-30 proved a pipeline that measures;
E-31 proved a builder that *recognizes* — and on the subject where both ran clean, recognition
won at a glance.

## Brush factory (E-32) — design once, reuse many, measured (S-128…S-132, T-128-01…T-132-01) · 2026-06-11

**The thesis, and the receipt.** E-31 proved a builder that recognizes; E-32 claimed the
*capability compounds*: a style is formed in language space (diegetic materials, ratified once),
the factory specifies its missing brushes, AI coding implements each once through the registry's
single door, and a building in the new style composes from the registry — each later style
cheaper because the library grows. T-132 ran the whole stack on one genuinely new style
(`saltcrag`, a granite-coast fishing village grown from the committed T-129 material story) and
banked the numbers in **one table** (`benchmarks/sculpture/factory/receipts.{json,md}`,
`npm run factory:receipts`, byte-deterministic re-run):

registry **19 → 22** · saltcrag's brush demand **14 = 11 pre-existing + 3 factory-built**
(reuse **79%**; 7 of the 11 also sit in rustic's own pack list) · backlog accepted on ask 1
(3 work items, 15 needs already covered, 0 demotions) · draft rework **4 minor notes, 0
spec-wrong** · cost shape **13 model calls end-to-end** (formation 3 + backlog 1 + recognition
1 + workshop 4 + gate 4; ratification and brush-implementation are zero-spend) · frozen gate:
**same-object 4/4, 8 gaps all minor — the exact profile of rustic's best on the same subject**
· instrument receipt frozen, `diffs: []` · replay `patternbook:saltcrag:repro`/`:offline`
byte-identical.

**Diegetic precedence held where optics kept failing.** The whole formation surface is text —
the story's geology/timber/wealth/roofing economy cite into every palette role
(`packs/drafts/saltcrag/`, raw replies committed), no image enters anywhere
(formation-guard pins it), and the value check runs on the committed block-Lab table. The judge
then looked at a barn whose walls turned from rustic's cobble/plaster to saltcrag's
rubble/limewash and said **same object at every azimuth**, flagging material zoning exactly
once, minor. Vernacular reasoning chose materials a TRELLIS texture read never could (the
T-121/T-122 flagged-mismatch lesson, closed from the other side).

**The substitution seam is at recognition, not compile — found live.** The design assumed the
committed rustic barn program would compile under the saltcrag pack. A pure dry-run refuted it
in minutes: programs are pack-stamped and role vocabularies are *per-pack* (rustic's program
speaks `wall.dressing`/`roof.trim`; saltcrag's palette has neither). The honest seam: the
conditioned sketch is the shared, pack-free form evidence; **recognition is pack-conditioned**
(`recognize.mjs --pack`, records namespaced per pack via `recognitionRels`), and everything
downstream speaks one pack. Cost: one extra model ask per (subject × style) — visible in the
cost shape, cheap, and the program contract stays whole. Chain-side the same move:
`--pack` is invocation data on `pattern-book.mjs`/`workshop.mjs`, every record path derives
once (`chainRels`), rustic's committed paths pinned unsuffixed (relocating committed pins is a
re-roll by another name).

**A bug class the growth itself exposed.** The formation replay and `form-style --offline`
derived drafts against the *live* registry — green for the registry's whole static life, and
drifted the moment the first factory brush landed. Replays now recover the registry **as
recorded** from the committed decompose inputs (`ownedNamesFromRegistryDigest`). The general
lesson for a system whose library grows: *any* replay that reads a mutable table is a drift
waiting for the table's first mutation; record the state, derive from the record.

**What the factory got right.** The decompose prompt steered dedup upstream (15 of 18 needs
arrived pre-classified as parametrization notes; the code gate stayed idle and is pinned by
tests); the three work items were genuinely uncovered (thatch's thick rounded-eave mass,
clinker's proud/flush lap, limewash's aspect-aware partial coat — none expressible by the 19);
and the drafts were implementable nearly as written — all four rework notes are interface
reshapes to house conventions (zoneOf lens, direction array, preserve-by-block), zero
re-specification. T-131's quality metric finally has data, and it is good.

**What it got wrong / the named seams.** (1) **Timing**: the formed pack can only seat brushes
that exist at formation time, so saltcrag's own building never used its three new brushes —
they compound *forward*, into the next style or a re-formed saltcrag; the receipts table names
this rather than implying the building used them. (2) **Kit presence is still the styled
path's contract**: a program build supplies no concept-declared apertures, so presence reports
skip→FAIL noise beside an all-minor resemblance read (T-127 concern, now twice-measured — a
presence contract for program builds is an open seam). (3) **Ratification ran
autonomous-provisional** (the ticket's planner sanction, stamped as such with the taste pass
pending) — the gate's meaning survives only if a human actually takes that pass. (4) The
**gap-budget arithmetic** again under-credits an all-minor 4/4 profile (both styles' bests
read FAIL at 8/2) — the same gate-policy question E-31 deferred, now with two data points.

**E-12 handoff.** `benchmarks/sculpture/factory/receipts.{json,md}` (the one table),
`multi-angle/barn-patternbook-saltcrag.{json,md}` + sheet
`pr/assets/frames/multi-angle-barn-patternbook-saltcrag.png` beside the rustic-best sheet,
chain record `pattern-book/barn--saltcrag.{json,md}`, the ratified pack `packs/saltcrag.json`
(+ formation records under `packs/drafts/saltcrag/`), the backlog drafts + rework log under
`docs/active/backlog/`. The story beat: one sentence of place ("a fishing village on a cold
coast") became a ratified palette, three new tools, and a building the frozen judge reads as
the same barn at every angle — for thirteen model calls.

## Measured proportion loop (E-33) — the eyes learned to measure, the hands learned to aim, and the ruler bent (S-133…S-138, T-133-01…T-138-02) · 2026-06-12

**The thesis.** E-31 proved recognition; E-32 proved the style stack compounds. E-33 asked
whether the loop can hold a *quantity*: measure the concept's proportions (T-133), declare them
as gate targets (T-135), give the workshop geometry levers that can move them (T-134/T-136),
and re-run the three pattern-book subjects with the check armed — does the form read right
*because the loop made it so*? The terminal evidence is
`pattern-book/proportion-milestone.{json,md}` + `pr/assets/proportion-milestone.md` (baselines
quoted pre-rotation, both gap-budget arithmetics beside every verdict, byte-reproducible).

**Measured beats estimated, by a lot (T-133's numbers).** The estimated cottage seed sat at
ridge:eave 2.25 / roofShare 0.5556 against sketch targets 1.4145 / 0.293; the measured re-seed
lands 1.55 / 0.3548 (Δrel 0.59 → 0.096 on the headline ratio). The barn's estimated seed was
nearer (2.4444 vs target 2.1) and the measured seed only trims it (2.4) — measurement pays
most where estimation guessed worst. Footprints came in measured exactly (27×32 on the
cottage, residual 0).

**Eyes-to-hands closed on the first live run (the barns).** With the proportion check armed
and the T-136 levers live, the rustic barn's critique aimed `eaveHeight:12` (round 1) and
`depth:26` (round 2), both ACCEPTED by the cage, final ratios inside tolerance
(2.1667/0.5385/1.7143 vs 2.1/0.5238/1.8462 — Δrel 0.164→0.0318, 0.1281→0.0281, 0.0833→0). The
saltcrag barn repeated the same aims on its own pack. Proportion-flavored gaps fell 4 → 1;
the survivor is the rustic pack's class-1 pitch ceiling — *pack data*, not loop failure,
flagged to the reviewer. This is the T-127 finding closing: when the check names the delta,
the model reaches for the lever that moves it.

**The steep door was built, tested, and never walked through.** `roofIdiomForPitch` plus the
re-aim at both seams (geometry lever, measured snap) is real and unit-proven (G3b/G3c/G3d,
MP14) — but both committed sketches are TRELLIS-flattened to ≤45° (the T-123 facet-normal
lesson from the other side), so no measured demand exceeded pitch 1: the cottage measured
tan(tilt) 0.7143, snapped to class 1, residual recorded. The unlock compounds forward; no
2026-06 run used it. Honest both ways: the ledgers prove the door opens, and prove nobody
needed it.

**The cottage is the epic's true finding: the loop hill-climbed a bent ruler.** The armed
check measures the *realized occupancy* (`proportionRatios` → `maskProportions`), and the
realized cottage carries a decorative plinth band at y3–4 that is 1–2 blocks wider than its
walls. `eaveWidthFrac: 0.98` admits only that band as an eave candidate, so the instrument
read eave≈4–5 where the build's true eave is ~12–15: recorded final 5.5/0.8182 vs a
corrected-by-hand read of ≈1.7/0.45 (still off target — the judge's two drifted views name
the same roof-heaviness — but not absurd). Worse than a wrong number, an *inverted gradient*:
with the eave pinned to the plinth, every wall-raise only grows totalH, so the cage scored
the model's correct aims as regressions. The ledger shows the model aiming the right lever in
5/6 rounds (`eaveHeight:24`, `storeys:6×4`, `storeys:4×4`) — refused by the rustic
storeyHeight band and the schema's storeys≤4 cap — and the one ACCEPTED move is the
wrong-direction `storeys:3` that improved the misread ratio. Same family as the T-118
roof-diff inversion and the T-122 steep-gable top-block misread: when an instrument's
heuristic latches the wrong feature, the loop optimizes the artifact, faithfully. The defect
is *flagged, not repaired* — re-shaping `proportionRatios` mid-milestone would re-derive
conformance under every committed replay; the fix needs an owning ticket (eave detection must
ignore sub-wall skirt bands, or measure per-mass walls instead of whole-silhouette extents).

**Where the epic over- and under-reached, honestly.** (1) Tolerance 0.15 is uncalibrated —
the barns pass inside it and read same-object 4/4; nothing yet ties the band to what a
stranger's glance forgives. (2) The ≤2 gap budget again reads FAIL over decided all-minor
profiles (barns 8/2; cottage 11/2 with 4 majors) — three E-31/E-32 data points now say the
identity arithmetic and the budget arithmetic disagree; per Rule 3 the recalibration is the
reviewer's, both arithmetics sit beside every verdict in the milestone record. (3) The
program-level ratios (seed, prefix-replay diagnostics) and the occupancy-level check are two
lenses on one quantity; the cottage proves they can disagree by 3× — any future gate work
must name which lens it gates on. (4) The witness-degradation prediction ("named SKIPs after
rotation") was half right: the SKIP guard covers artifact pins only; rotated *gate records*
make `visibility:repro` DIVERGE and geometry-bearing ledgers make `proportion:repro` throw
(`replayLedger` wants the pack) — both tripwires fire truthfully, neither names retirement;
pre-existing since the barn rotations (proven at a `caf0d13` worktree), now expressed on all
three subjects, owners needed.

**E-12 handoff.** `pr/assets/proportion-milestone.md` (the glance page: concept beside sheet,
before/after/target ratio rows, lever citations, both arithmetics) + its JSON record;
baselines with retired pins named in `pattern-book/proportion-baselines.json`; chain records
`pattern-book/{barn,barn--saltcrag,cottage}.{json,md}` with ledgers beside them; the gate
records under `multi-angle/`; the head-to-head re-composed on the rotated verdicts
(`pr/assets/pattern-book-milestone.md`). The story beat: taught to measure, the loop fixed
two barns on its first try — and on the third building it obeyed a bent ruler so precisely
that the failure names exactly which instrument to fix next.
