# Progress — T-008-01: ground-on-sainte-chapelle

Live tracker. **Scoreboard + verdicts are filled ONLY from actual judge output — no placeholder scores.**

## Step status

| # | step | status |
|---|------|--------|
| 1 | Confirm champion (tree clean vs HEAD — no revert) | ✅ done — `git diff --stat HEAD` empty; 015 menu + P12/P13 blocks present |
| 2 | `npm test` pre-run gate | ✅ done — 133/133 pass |
| 3 | Live Sainte-Chapelle run (`020-vRefRevise-designdoc`) | ✅ done — 4,068 blocks, $2.02, 929s; render auto-judged overall=competent |
| 4 | Judge round-0 (helper, median-of-3) | ✅ done — round-0 overall=strong (3/3) |
| 5 | Read color/proportion/detail from render; trigger check | ✅ done — **no trigger fired** (color strong; nothing detached) |
| 6 | Conditional minimal edit | ✅ N/A — no edit (no trigger); tree clean, no source diff |
| 7 | Journal attempt-log entry | ✅ done — run-020 entry appended; P12 scoped in Principles |
| 8 | progress.md + review.md | ✅ done |

## Run facts (`020-vRefRevise-designdoc`)
- Reference: `references/St_Chapelle.png` — **Sainte-Chapelle de Vincennes EXTERIOR**: pale grey/cream
  limestone, dark slate-blue roof, rose window + lancets reading as dark tracery voids, pinnacles/turret.
- **Premise discrepancy (research/Design C):** the ticket framed this as the *agreement* case ("already
  colorful"); the provided image is the **grey-stone exterior**, not the polychrome interior. The stage-1
  `design-doc.md` confirms the model read it as **pale**: *"The reference is pale honey limestone … I take
  its structure, not its pallor."* → **Path 2: this is effectively a second conflict-condition run.**
- Config: **champion** (committed HEAD, 015 "NO LARGE FLAT FIELDS" menu). Tree clean — **no revert
  needed** (unlike T-007-01).
- Stage-1 doc ("Temple of the Sevenfold Dawn"): warm split-complementary — **Red Sandstone** dominant,
  **Blue Terracotta** supporting (roof/spires), **Gold** + **Blue/Red Stained Glass** accents. P12 split
  honored at the doc stage (took structure, not pallor); the render must confirm the build/2nd-pass kept
  the color.

## A/B scoreboard (median-of-3, rubric `v2-categorical-baml`)

| dimension | round-0 (build) | render (2nd pass) |
|-----------|:---------------:|:-----------------:|
| proportion | **strong** | competent |
| color | strong | strong |
| detail | competent | competent |
| fidelity | **strong** | competent |
| **overall** | **strong (3/3)** | **competent** |

round-0 perSample: [strong, strong, strong]. render perSample: [strong, competent, competent].

## Verdict (grounded in `render.png` + `round-0.png`)
- **P12 (color) — HELD, load-bearing, NOT neutral.** `color = strong` both rounds off a *pale* grey-stone
  reference (the model read "pale honey limestone … I take its structure, not its pallor" and built a
  terracotta/eggplant/gold/blue split-complementary scheme). The ticket's "agreement → P12 neutral"
  hypothesis is **refuted on its premise**: the supplied image was the grey-stone EXTERIOR, not the
  polychrome interior, so it presented *conflict*, not agreement. P12 now confirmed across a third pale
  palette (white/timber/pale-stone). The genuine agreement case remains **untested**.
- **Proportion (P13/verticality) — one-plane HELD; but 2nd pass REGRESSED proportion.** Nothing detached
  (P13 intact under Gothic verticality), yet the revision dropped proportion strong→competent by trading
  round-0's recessed gold-voussoir portal + central rose for a **large flat gold pediment slab**. The
  P14 double-edge resurfaced: **round-0 was the better artifact.**
- **Detail (S-006 transfer) — did NOT lift (competent both rounds).** Tracery present but flat fields
  persist (now the inert gold pediment). P15 holds.

## Deviations from plan
- Step 1 found the tree **already clean** (no revert), unlike T-007-01's texture-grain revert.
- Steps 1–3 executed before/while artifact authoring (to gate + overlap the metered run).
- The **reference-premise discrepancy** (Design C) is a substantive deviation from the ticket's framing —
  surfaced honestly rather than treating Sainte-Chapelle as the agreement case by fiat.
