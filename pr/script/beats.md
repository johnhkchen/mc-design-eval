# Beats — evolution-showcase video

> **The thesis, one line:** *Same model, same game — what changed was the method. We made an LLM
> climb from a 333-block gray box to a "strong"-rated facade by adding one technique at a time,
> and we measured every step with a judge we built because we didn't trust our first metric.*

Source of truth: `pr/research/audience-message-brief.md` (the receipts) + `pr/script/README.md`
(the 8-beat arc). This file is the filled-in arc, expanded to **15 frames (F01–F15)**.

**How to read this file:** beats map to frame IDs `F01–F15`; the *same* IDs appear in
`storyboard.md` (timing) and `script.md` (captions/VO). Every factual claim carries a
`[receipt: …]` traceable to brief §9 / a run `summary.json` / the journal. Invent nothing.

---

## Beat 1 — Hook (Thread A) · `F01`

**Cold open, no preamble.** The crude **333-block gray box** snaps to the **strong-rated Taj
facade** (run 014). One line of tension over it: *"Same model. Same game. The method changed."*

- **Technique unlocked:** none yet — this is the before/after promise. The tension is "same
  model" (pre-empts the skeptic's "you just used a better model").
- **Score step:** n/a (gray box) → **strong (3/3)** previewed.
- **Receipts:** gray box = capped brief on `claude-opus-4-8` → **333 blocks**
  `[receipt: journal P1 / attempt log]`. Facade = **run 014**, same model/path, uncapped +
  grounded → `overall = strong`, unanimous **3/3**
  `[receipt: runs/014-vRefRevise-designdoc/summary.json]`.
- **Frame note:** the gray box has no guaranteed render on disk — `F01` is tagged
  `[asset: describe/regenerate]` for the asset desk (S-033). Do **not** open on the score
  numbers, the rotation, or the concept art (brief §2 guard).

---

## Beat 2 — The measured climb (Thread A) · `F02 F03 F04` (+ trust flash `F05`)

The same subject improving, one technique per rung, the categorical score overlay rising
**competent → strong**. This is the caption spine.

**Rung 2 — `F02` · + design-doc grounding**
- **Technique unlocked:** giving the model a written design doc to ground the build.
- **Score step:** the "best result yet" rung.
- **Receipts:** **$1.08**, **1,372 blocks** `[receipt: runs/003-v2-designdoc/summary.json]`.

**Rung 3 — `F03` · + reference grounding (photo → build)**
- **Technique unlocked:** grounding on a reference *image* so the build inherits real proportion.
- **Score step:** the "visually strongest" rung.
- **Receipts:** **20,311 blocks**, **$1.64** `[receipt: runs/008-vRef-designdoc/ (journal)]`.

**Rung 4 — `F04` · + craft/color split + one connected plane (the hero)**
- **Technique unlocked:** splitting craft (from the reference) and color (from the brief), and
  the "a facade is one connected plane" fix.
- **Score step:** **strong (3/3)** — the climb's endpoint.
- **Receipts:** `overall = strong`, perSample **[strong, strong, strong]**; dimensions
  **proportion strong · color strong · fidelity strong · detail competent**; **10,013 blocks**,
  **$1.64**, seed 11, `claude-opus-4-8` `[receipt: runs/014-vRefRevise-designdoc/summary.json]`.
- **Honest note:** `detail` is **competent**, not strong — caption the overlay with the *real*
  per-dimension words; don't smooth them. (This is the seed of trust beat 3 / `F11`.)

**Trust flash `F05` (rides under the first score overlay):** see "Trust spine" below.

> **Rung 1** (uncap → 8,018-block temple `[receipt: v0-singleshot (journal)]`) is folded into the
> velocity engine beat (`F06`) as the "what happens when you just remove the cap" step, so the
> climb frames stay grounded-technique frames.

---

## Beat 3 — The velocity engine (Thread B) · `F06`

The compounding that *powered* the climb: dozens of builds a day; techniques accumulate in the
journal and **transfer** across subjects.

- **Technique unlocked:** cheap facade-scope runs → fast iteration → a journal of reusable craft.
- **Receipts:** **26 runs across two days** (2026-06-04 → 06-05) `[receipt: runs/ 001–026]`; each
  run **~$0.76–$2.13** vs 30+ min full builds; rung-1 uncap → **8,018-block temple**
  `[receipt: v0-singleshot (journal)]`. The two biggest wins (color-from-brief; one-connected-
  plane) derived on the Taj, then **generalized in one night** to Hōryū-ji (019), Sainte-Chapelle
  (020), Arc de Triomphe (021), mausoleum (022), all holding `overall = strong (3/3)`
  `[receipt: journal runs 019–022]`.

---

## Beat 4 — The pivot / plot twist (Thread B) · `F08` (+ trust flash `F07`)

Text-only JSON hits its ceiling → **change tools** → the **image-to-3D pivot**, the visual leap.

- **Technique unlocked:** **image→3D pivot** — ground on a reference image; the build inherits a
  proven palette + proportion instead of hallucinating from text.
- **Receipts:** the leap is from text-JSON era (e.g. `runs/002`) to a reference-grounded build;
  the gorgeous target frame is a **`[concept]`** (Gemini-Flash `concepts/taj-C-flash.png`), shown
  as "where it's heading," **not** a real build `[receipt: brief §8 honesty guard]`.
- **Trust flash `F07` lands just before this** (the ceiling motivates the tool change) — see
  "Trust spine".

---

## Beat 5 — The explosion (Thread B) · `F09`

A wall of high-quality, palette-disciplined "bet-you-can't-do-this" builds.

- **Technique unlocked:** the accumulated journal craft applied at speed across subjects.
- **Receipts / honesty:** the wall is built from **`[concept]`** frames
  (`concepts/*-C-flash.png`) — captioned as concepts, the reference art, not Minecraft
  `[receipt: brief §8]`. The *real* proof is the next beat.

---

## Beat 6 — "Yep, that's real" (Thread B) · `F10`

The payoff: the **actual voxel build rotating in 3-D**, rendered through *our own rig*
(`prismarine-viewer` + real `minecraft-assets` textures) — a 360° spin an AI picture can't fake.

- **Technique unlocked:** the turntable/orbit render — we control the rig; it's true-to-Minecraft.
- **Receipts:** rig = `prismarine-viewer` + `minecraft-assets` `[receipt: CLAUDE.md / spec]`. The
  rotation asset itself is **S-032** (built in parallel); this beat only *marks where it appears*.
- **Honesty:** this is the **only** frame that claims a real, rotatable build. Per v1-sequencing,
  it's the real-but-blockier (text-JSON era) build today; the real-AND-gorgeous hero payoff slots
  in after the sculptor (E-11) ships `[receipt: brief §8 / epic notes]`.

---

## Beat 7 — Breadth (Thread B) · `F12`

The five references generalize — the method isn't Taj-specific.

- **Technique unlocked:** transfer — the same locked techniques carry off-domain.
- **Receipts:** Taj · Hōryū-ji · Sainte-Chapelle · Arc · mausoleum `[receipt: references/]`;
  019/020/021/022 held `strong (3/3)` `[receipt: journal runs 019–022]`. Frames are
  **`[concept]`** (`concepts/{horyuji,chapelle,arc,mausoleum}-C-flash.png`), captioned as concepts.

---

## Beat 8 — The vision (Thread A + B) · `F13 F14` (+ CTA `F15`)

Close on where the climb is heading: the **staged sculptor** (E-11) — relief, palette, ornament
built in separate *locked, validated* passes instead of one budget-constrained blob (the cure for
the detail ceiling).

- **`F13`** — the forward end-frame: a **generated Golden Gate Bridge concept** (the "Golden-Gate
  ambition"). Captioned **"where it's heading"** — `[concept]`, generated by S-034, **not** a
  shipped build `[receipt: brief §6 / §8 v1-sequencing]`.
- **`F14`** — the thesis card: **"we're the sculptor, not the 2-D-to-3-D tool."** The closing
  emotional beat, ambition earned by the measured climb `[receipt: brief §6]`.
- **`F15`** — the CTA (see script.md): follow-for-the-method + comment bait; try-it soft-pedaled.

---

## Trust spine — the credibility flashes (≤1–2s each, not a wallow)

These *are* the differentiator for a skeptic audience; the null results are the proof of method.

1. **`F05` — we replaced our own metric.** The first numeric rubric **saturated at mean ≈ 4,
   noise ≈ 0.4** — it couldn't tell which technique helped. We built the **categorical judge**
   (weak/competent/strong/exceptional, median-of-3). *Why it builds trust:* the score overlay the
   viewer is watching exists *because* we distrusted the easy metric.
   `[receipt: journal "Measured correction" / rubric v2-categorical-baml]`.
2. **`F07` — we killed our own shortcuts.** Best-of-N (4 candidates, judge-selected) cost
   **$5.34, ~29 min**, re-judged **3.67 — the same band as one $0.76 one-shot.** Stacking surface
   detail in one pass *regressed* quality **4.0 → 3.33** (color crashed **4 → 2.67**). *Why:* we
   show our dead ends, so the wins are believable.
   `[receipt: runs/005-vN-bestof/ (journal P8); runs/007-v5-designdoc-detail/ (journal P9)]`.
3. **`F11` — the honest ceiling.** `detail` is still only **competent** — both dedicated detail
   levers *failed* (016 flat, 017 regressed proportion); an overnight loop **promoted nothing**;
   the "structural ceiling" we once declared was our own cap — we **retracted it**. *Why:* we name
   the thing that won't climb, on the hero frame itself.
   `[receipt: journal P7/P15 + morning brief]`.

---

## Honesty ledger (carried downstream to S-033 / S-034)

- [ ] **Concept ≠ real build.** Every `concepts/*.png` frame (`F08 F09 F12 F13`) is captioned
      **`[concept]`** — Gemini-Flash reference art, not Minecraft. The only "real build" claim is
      the rotation, `F10`.
- [ ] **v1-sequencing.** The vision (`F13`) is captioned "where it's heading," not "what we
      shipped." No promise of the post-sculptor real-AND-gorgeous frame.
- [ ] **No invented metrics.** Every number above traces to a `[receipt:…]` in brief §9. If it
      isn't in a `summary.json` or the journal, it does not go on screen.
- [ ] **Same model is load-bearing.** The hook claim "same model" must survive — it's
      `claude-opus-4-8` at both ends `[receipt: runs/014 summary.json]`.
