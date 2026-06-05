# Audience & message brief — evolution-showcase video

> **The message, in one sentence:** *Same model, same game — what changed was the method. We made
> an LLM climb from a 333-block gray box to a "strong"-rated facade by adding one technique at a
> time, and we measured every step with a judge we built because we didn't trust our first metric.*

**How to use this brief (S-031):** write for the **primary audience** (§1), open on the **hook**
(§2), build captions on the **Thread-A ladder** (§4), drop the **trust beats** as quick flashes
(§5), land on the **vision** (§6) and the **CTA** (§7). Don't invent a number — pull every figure
from the **receipts table** (§9). Honesty guards in §8 are mandatory, not optional.

---

## 1. Audience

**Primary — AI/ML builders & founders.** People shipping structured generation, multimodal
pipelines, and agentic / self-judging loops. **What they already believe:** LLM demos are
cherry-picked; "it works in the demo" ≠ reliable; evaluation is the hard part everyone hand-waves;
agent loops over-promise and under-measure. They are *skeptics by trade.*

- **They reward:** method, honest measurement, a number with a receipt, someone who shows their
  dead ends.
- **They punish:** highlight reels, vibes-as-evidence, "trust me it's better," and a model swap
  dressed up as a technique.

**Secondary — creative-tools / Minecraft-adjacent.** They already believe AI "art" is easy and
fake. They're served *for free* by the crude→stunning visual and the "yep, that's real" rotation —
**no separate message.** S-031 writes one script, for the primary; the secondary is a pull, not a
second audience.

---

## 2. The 3-second hook

**Cold open, no preamble:** the **333-block gray box** snaps to the **strong-rated Taj facade**
(run 014). One line of tension over it:

> **"Same model. Same game. The method changed."**

**Why it's true (the two receipts behind the morph):**
- the gray box = a *capped* brief ("modest 7×7–9×9, favor clarity over ornament") on
  `claude-opus-4-8` → 333 blocks (journal P1).
- the facade = run 014, the **same model/path**, uncapped + grounded → `overall = strong`,
  unanimous **3/3** (`runs/014-vRefRevise-designdoc/summary.json`).

"Same model" is load-bearing: it pre-empts the skeptic's first dismissal ("you just used a better
model"). We didn't — we changed the *method*.

**Do NOT open on:** the score numbers (too abstract for second 1), the 3-D rotation (it answers a
question the viewer hasn't asked yet — save it for the payoff), or the concept art (it's the
*fakeable* thing; opening there spends our honesty before we've earned it).

---

## 3. The lead framing

**Lead with the engineered, *measured* quality climb.** The throughline: *we treated LLM build
quality as an instrument problem — make the same model climb from a gray box to a "strong" facade
by adding one technique at a time, and measure every rung with a categorical judge.* The judge is
the credibility engine; it's why the climb is science, not vibes.

Everything else hangs off this spine, so nothing is lost — **demoted, not dropped:**
- **Autonomous self-judging overnight loops** → a *trust/method* beat (§5), deliberately paired
  with the night that **promoted nothing**, so the autonomy reads as disciplined, not "marking its
  own homework."
- **The multimodal image-to-3D pivot** → the mid-video **plot twist** in Thread B (§4), not the
  lead (as a lead it reads as "we switched to images" and loses the climb spine).
- **Velocity ("dozens of builds a day")** → the **engine** of the climb, Thread B (§4) — speed is
  *why* the climb was possible, not the headline itself.

---

## 4. The two threads (woven)

### Thread A — the measured climb (the caption spine)

The backbone the on-screen captions sit on. Each rung = one technique added; the categorical score
overlay rises competent → **strong**.

| Rung | Technique added | Score (overall) | Receipt |
|------|-----------------|-----------------|---------|
| 0 | *capped* brief (the gray box) | n/a — 333 blocks | journal P1 / attempt log |
| 1 | uncap + invite ambition | 8,018-block temple | `v0-singleshot` (journal) |
| 2 | **+ design-doc grounding** | "best result yet," $1.08 | `runs/003-v2-designdoc/` |
| 3 | **+ reference grounding** (photo→build) | "visually strongest" | `runs/008-vRef-designdoc/` |
| 4 | **+ craft/color split + one connected plane** | **strong (3/3)** | `runs/014-vRefRevise-designdoc/` |

Run 014 is the climb's endpoint to show: proportion **strong**, color **strong**, fidelity
**strong**, `detail` **competent** (the honest holdout — see §5). Caption the overlay with the
*real* per-dimension words; don't smooth them.

### Thread B — velocity & "yep, that's real"

- **Velocity:** 26 runs across **two days** (2026-06-04 → 06-05). Facade scope keeps each run
  cheap and fast (~$0.76–$2.13 vs 30+ min full builds) — that's what let the climb happen.
- **Techniques compound and *transfer*.** The two biggest wins (color-from-the-brief; "a facade is
  one connected plane") were derived on the Taj, then **generalized off-domain in one night** to
  four new subjects — Hōryū-ji (019), Sainte-Chapelle (020), Arc de Triomphe (021), Sun Yat-sen
  mausoleum (022) — holding `overall = strong (3/3)`. Craft that accumulates in the journal and
  carries to the next building.
- **The pivot (plot twist):** text-only JSON hits its limits → **ground on a reference image** →
  the build inherits a proven palette + proportion. The visual leap.
- **The explosion:** a wall of high-quality, palette-disciplined "bet-you-can't-do-this" builds.
- **"Yep, that's real":** the **actual voxel build rotating in 3-D**, rendered through *our own
  rig* (`prismarine-viewer` + real `minecraft-assets` textures) — a 360° spin an AI picture can't
  fake. *(The turntable render is S-032, built in parallel.)*

**How they weave:** Thread A is the intellectual payoff (it got measurably better); Thread B is the
spectacle (it got fast, it's real). They converge on the sculptor vision (§6).

---

## 5. Trust beats (the credibility spine — quick flashes, not a wallow)

These *are* the differentiator. For this audience, the null results are the proof of method.

1. **We didn't trust our own metric, so we replaced it.** The first numeric rubric (1–5 mean)
   **saturated at 4 with noise ≈ 0.4** — it couldn't tell which technique helped. We built the
   **categorical judge** (weak/competent/strong/exceptional, median-of-3) to resolve what numbers
   couldn't. *Receipt:* journal "Measured correction" banners + rubric `v2-categorical-baml`.
2. **We killed our own shortcuts.** Best-of-N (4 candidates, judge-selected) cost **$5.34 and ~29
   minutes** and re-judged at **3.67 — the same band as one $0.76 one-shot.** Zero gain. And
   stacking surface detail in one pass *regressed* quality **4.0 → 3.33** (color crashed 4 → 2.67).
   *Receipts:* `runs/005-vN-bestof/`, `runs/007-v5-designdoc-detail/` (journal P8/P9).
3. **The honest ceiling.** `detail` is still only **competent** — the one dimension that won't
   climb; both dedicated detail levers *failed* (016 flat, 017 regressed proportion); an entire
   overnight loop **promoted nothing**; and the "structural ceiling" we once declared turned out to
   be our own cap — we **retracted it** in the journal. *Receipt:* journal P7/P15 + morning brief.

Cadence note (per the epic): these are credibility *flashes*, ~1–2s each, not a self-flagellation
montage.

---

## 6. The vision / end-frame

Close on where the climb is heading: the **staged sculptor** (epic E-11) — build relief, palette,
and ornament in separate *locked, validated* passes instead of one budget-constrained blob (the
cure for the detail ceiling). The forward-looking end-frame is a **generated Golden Gate Bridge
concept** — the "Golden Gate ambition." The thesis line: **"we're the sculptor, not the 2-D-to-3-D
tool."** This is the closing emotional beat — ambition earned by the measured climb that preceded
it.

---

## 7. The CTA

- **Primary — follow for the method.** *"I'm publishing the whole journal — the principles, the
  null results, the climb. Follow if you build with LLMs and want the receipts."* Pins the ask to
  a real, linkable artifact (`docs/knowledge/design-learnings.md`).
- **Secondary — discuss (comment bait).** *"Which technique would you have bet on? We were wrong
  about best-of-N."* Invites others to be wrong too; exploits LinkedIn's comment-weighted reach.
- **Soft-pedal "try it."** There's no packaged tool yet; promising one breaks the honesty contract
  and the v1-sequencing reality (§8). Don't make a product CTA there's no product to back.

---

## 8. Honesty guards (carry these downstream)

- **Concept ≠ real build.** The `concepts/*.png` are *Gemini-Flash concept art* — gorgeous
  *reference*, not Minecraft. The "yep, that's real" proof applies **only** to the voxel build
  rendered through our rig. Caption every concept frame *as a concept.*
- **v1-sequencing caveat.** Today the *real* builds are rotatable-but-blockier (text-JSON era) and
  the *gorgeous* frames are concepts. v1 shows concepts as "where it's heading"; the
  real-AND-gorgeous hero payoff slots in **after** the sculptor (E-11) ships. Don't promise a frame
  that doesn't exist yet.
- **No invented metrics.** Every number traces to §9. If it's not in a `summary.json` or the
  journal, it doesn't go on screen.

---

## 9. Receipts table (the anti-fabrication backstop)

Every claim S-031 may use, with its source. Pull from here; invent nothing.

| Claim | Value | Source |
|-------|-------|--------|
| capped brief → gray box | 333 blocks | journal P1 / attempt log |
| uncapped → temple | 8,018 blocks | `v0-singleshot` (journal) |
| design-doc grounding "best yet" | $1.08, 1,372 blocks | `runs/003-v2-designdoc/summary.json` |
| reference grounding "strongest" | 20,311 blocks, $1.64 | `runs/008-vRef-designdoc/` (journal) |
| **the strong endpoint** | overall **strong**, perSample [strong,strong,strong] | `runs/014-vRefRevise-designdoc/summary.json` |
| run 014 dimensions | proportion/color/fidelity strong, **detail competent** | same |
| run 014 facts | 10,013 blocks, $1.64, seed 11, `claude-opus-4-8` | same |
| best-of-N null | $5.34, ~29 min, re-judged 3.67 | `runs/005-vN-bestof/` (journal P8) |
| detail-stacking regression | 4.0 → 3.33, color 4 → 2.67 | `runs/007-v5-designdoc-detail/` (journal P9) |
| numeric metric saturated | mean ≈ 4, noise ≈ 0.4 | journal "Measured correction" |
| transfer / generalization | strong (3/3) on 019/020/021/022 | journal runs 019–022 |
| run count / window | 26 runs, 2026-06-04→06-05 | `runs/` (001–026) |
| five subjects | Taj · Hōryū-ji · Sainte-Chapelle · Arc · mausoleum | `references/` |
| rig | `prismarine-viewer` + `minecraft-assets` | CLAUDE.md / spec |
| rubric | v2 categorical, median-of-3 | `summary.json` `score.rubric` |

---

## 10. Handoff to S-031 (the script desk)

You have everything to write the beats:
1. **Who** → §1 (primary = LLM-builder skeptic; secondary is a free pull).
2. **First frame + first words** → §2 (gray box → run 014; *"Same model. The method changed."*).
3. **Caption spine** → §4 Thread-A ladder (rung → technique → score → run ID).
4. **Where the credibility flashes go** → §5 (three trust beats, ~1–2s each).
5. **What you can claim** → §9 receipts table (invent nothing).
6. **Ending + ask** → §6 vision + §7 CTA.

This brief is the **filled-in version of the 8-beat arc already in `pr/script/README.md`** — they
are consistent: hook → measured climb → velocity engine → pivot → explosion → "yep, that's real" →
breadth → vision. Use the README's arc as the skeleton; use this brief for the *content* and the
*receipts*. This is an internal brief — the published **post copy is S-034's** job, not yours.
