# Research — T-030-01 (pr-research-desk)

Map of what exists for the audience+message brief. Descriptive: what receipts we have,
where the message inputs live, what constraints bound the brief. No solutions here.

## The ticket in one line

Write `pr/research/audience-message-brief.md`: who the evolution-showcase video is for, the
3-second hook, the lead framing + two narrative threads, the trust beats, and the CTA — tight
enough to brief the script desk (S-031) directly, every claim tied to a real artifact.

## Where the message inputs live (the receipts)

This is a **comms** ticket: it produces no code, it *consumes* the project's existing artifacts.
The four sources the brief must ground in:

1. **The journal** — `docs/knowledge/design-learnings.md` (~1300 lines). The narrated, dated
   record of every attempt: principles P1–P15, the per-run attempt log, the corrected verdicts.
   This is the single richest receipt — it *is* the "engineered, not lucky" proof, in the
   project's own honest voice (including the retractions).
2. **The runs** — `benchmarks/temple-facade/runs/001…026/`. 26 numbered runs, each a directory
   with `summary.json` (model, seed, cost, blocks, **categorical scores + judge notes**),
   `render.png` (the head-on facade), often `round-0.png` (pre-revision), `design-doc.md`,
   `reference.png`, and a `render-3q.png` 3/4 view. These are the visual frames + the score data.
3. **The concept art** — `benchmarks/temple-facade/concepts/`. ~19 PNGs (`taj-A-flash.png`,
   `arc-A-flash.png`, `horyuji-*`, `chapelle-*`, `mausoleum-*`). Gorgeous Gemini-Flash ("Nano
   Banana") reference concepts — **NOT real Minecraft builds**. Honesty-critical distinction.
4. **The references** — `benchmarks/temple-facade/references/`: `taj_mahal.png`, `horyu_ji.JPG`,
   `St_Chapelle.png`, `arc_de_triomph.JPG`, `sys_mausoleum.JPG`. The five real-photo grounding
   anchors for the breadth beat.

Desk charter: `pr/research/README.md`. Epic: `docs/active/epics/E-12-evolution-showcase.md`.
Downstream consumer: `pr/script/README.md` (the 8-beat arc it already sketches).

## The receipts, concretely (what is true and citable)

**The hero spine — the Taj climb (one subject improving):**
- The crude start: a *capped* "modest 7×7–9×9, favor clarity over ornament" brief produced a
  **333-block gray box**; removing the cap on the same model produced an **8,018-block temple**
  (run "Temple", `v0-singleshot`). P1: "the model matches the bar you set."
- Run 003 `v2-designdoc`: design-document-first → "the best result yet, by a clear margin" —
  real color theory, $1.08, *cheaper* than the multimodal revision.
- Run 008 `vRef-designdoc`: reference-grounded (multimodal photo input) → "the visually
  strongest run." Imports a proven palette + proportion.
- Run 010 (Taj, copy-everything): regressed to near-monochrome **white** — `overall = competent`.
  The reference *stole the brief's palette* (P12 origin).
- Run 013 (Taj, craft/color split): color fixed, but the 2nd pass **detached columns** →
  proportion regressed; round-0 was the better artifact (P13/P14 origin).
- **Run 014 (Taj, one-plane + craft/color split): the first `overall = strong`, unanimous 3/3.**
  proportion strong, color strong, fidelity strong, **detail competent**. 10,013 blocks, $1.64,
  seed 11, `claude-opus-4-8`. This is the headline climb endpoint. (See `summary.json`.)
- Champion config = 014/015 (`vRefRevise-designdoc`, "NO LARGE FLAT FIELDS" menu).

**The categorical score (the on-screen overlay):**
- Rubric `v2-categorical-baml`: tiers **weak → competent → strong → exceptional**, judged
  median-of-3. Dimensions: proportion, color, detail, fidelity, overall.
- Champion band: overall **strong (3/3)**, proportion/color/fidelity strong, **detail competent**
  (the lone holdout / open climb target).
- *Why categorical exists* (a trust beat): the earlier numeric v1 rubric (1–5 mean) **saturated
  at 4 with noise ≈ 0.4** and could not resolve which technique helped — "this is exactly why we
  built the judge." The categorical rubric resolves what numeric couldn't.

**The velocity engine (thread 2, part A):**
- 26 runs across **two days** (2026-06-04 → 06-05) — "dozens of builds a day." Facade scope keeps
  each run cheap/fast (~$0.76–$2.13; a single facade head-on vs 30+ min full builds).
- Techniques **accumulate in the journal and transfer across subjects**: P12 (color from brief)
  and P13 (one connected plane) were *derived on the Taj* then **generalized off-domain in one
  night** to Hōryū-ji (019), Sainte-Chapelle (020), Arc de Triomphe (021), Sun Yat-sen mausoleum
  (022) — `overall = strong (3/3)` held on the new subjects. Compounding, transferring craft.

**The breadth beat (the method generalizes):**
- Five references / subjects: Taj · Hōryū-ji · Sainte-Chapelle · Arc de Triomphe · mausoleum.
  Different palettes (white / dark-timber / pale-stone / cream-limestone / two-tone) and
  different massing (domes / vertical pagoda tiers / Gothic vessel / single colossal arch).

**The multimodal pivot + "yep, that's real" (thread 2, part B):**
- The pivot is **text-JSON → reference image grounding** (`vRef`): feeding a real photo lifts the
  build by importing a proven palette + proportion. That is the "image-to-3D" leap.
- The `concepts/` art is **Gemini-Flash concept art, not real Minecraft** — gorgeous *reference*,
  fakeable. The honest, stronger story (epic Note): *anyone can make an AI picture; we turn it
  into a real, rotatable, buildable voxel structure.*
- The realness proof = the **actual voxel build rotating in 3-D** through our own rig
  (`prismarine-viewer` + real `minecraft-assets` textures). That turntable render is S-032 (a
  sibling story, built in parallel) — a 360° spin an AI picture can't fake.

## The trust beats (honest null results — citable failures)

- **Best-of-N is a dead end.** Run 005 (`vN-bestof`, K=4): **$5.34, ~29 min**, winner re-judged
  **3.67** — the same band as one cheap v0 (4.0, $0.76, fast). Zero quality gain at ~7× cost.
- **Stacking detail in one pass backfires.** Run 007 (`v5-detail`): overall **4.0 → 3.33**, color
  *crashed* (4 → 2.67), depth traded away (15 → 10). Dimensions trade off a fixed budget (P9).
- **The "structural ceiling" was a self-inflicted cap (retracted).** I declared a capability
  plateau from runs that all sat at *my own* relief cap; lifting the cap moved a build **3.0 →
  4.0** at *lower* cost. The journal keeps the wrong verdict visible and corrects it (P7/Verdict).
- **`detail` is the honest holdout.** Both dedicated detail levers failed (016 relief panels flat;
  017 texture grain *regressed* proportion). The persona (025) and effort (026) A/Bs each flipped
  only `detail` competent→strong vs control — "two unrelated knobs producing the same single flip
  is the signature of generation noise, not a lever" → **neither adopted.**
- **The 2nd pass is a coin-flip.** P14: the reference-compared revision helped 014/019/021/022 and
  *regressed* 013/017/020 — "judge both rounds, keep the better," never assume the later is better.
- **A whole "confirmation night."** Overnight chain S-006…S-009 **promoted nothing** — the morning
  brief says so plainly. Credibility, not a highlight reel.

## The forward vision (the end-frame)

- The **staged sculptor** (epic E-11): build relief / palette / ornament in separate validated,
  locked passes instead of one budget-constrained blob (P9's prescription). "We're the sculptor,
  not the 2D-to-3D tool" (the architectural thesis, obs 10556).
- Confirmed creative lock: a **generated Golden Gate Bridge concept** as the forward-looking
  end-frame ("Golden Gate ambition").

## Audience landscape (who could this be for)

Per the desk charter + epic, two candidate audiences already named:
- **Primary — AI/ML builders & founders**: people doing structured generation, multimodal,
  agentic/self-judging loops. What they already believe: LLM demos are cherry-picked; "it works
  in the demo" ≠ reliable; eval is hard; agent loops over-promise. They are skeptics who reward
  *method and honest measurement*, and are tired of hype reels.
- **Secondary — creative-tools / Minecraft-adjacent**: people who like the visual artifact for
  its own sake. They already believe AI "art" is easy/fake; the realness proof speaks to them.

## Constraints bounding the brief

1. **No invented metrics.** Every number/claim must trace to a run `summary.json`, the journal, or
   a named artifact. The journal itself models this discipline (it retracts overclaims).
2. **Honest, on-thesis, not a highlight reel** (epic Definition of Done) — the null results are
   *features* of the story, not omissions.
3. **One hero subject** in the spine (Taj) — resist montaging many subjects; use the breadth beat
   for generalization (epic Note).
4. **Don't conflate concept art with the real build** — the realness proof is the *voxel* build.
5. **Sequencing reality (v1 now):** today the *real* builds are rotatable-but-blockier (text-JSON
   era) and the *gorgeous* frames are concepts; v1 shows concepts as "where it's heading," and the
   real-AND-gorgeous hero payoff slots in after the sculptor ships. The brief should not promise a
   frame that doesn't exist yet.
6. **Tight enough to brief S-031 directly** — the script desk turns this into beats/captions, so
   the brief must hand off an unambiguous audience, hook, framing, threads, trust beats, CTA.

## Open questions for Design

- Which single framing **leads** (the quality climb vs the velocity vs the realness vs the
  measurement-instrument angle)? They can't all be the first sentence.
- How explicitly to foreground the null results without dampening the scroll-stopping hook.
- Primary CTA: follow vs discuss-the-method vs try-it — which one, given a skeptic audience.
