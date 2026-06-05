# sequence.md — canonical evolution frame sequence

The ordered cut the Production desk assembles. Realizes `pr/script/storyboard.md` (timing) +
`pr/script/beats.md` (story) + `pr/script/script.md` (captions/overlays) as concrete, sourced,
scored frames.

- **Total runtime:** 40.0s (∈ [30, 60] LinkedIn target).
- **Master aspect:** 1:1 at 1080×1080 (production may letterbox → 4:5 vertical). Curated frames
  live in `pr/assets/frames/` because `runs/` and `concepts/` are gitignored.
- **Marks:** ▣ = hero-spine (score-overlay climb) · ◇ = breadth beat · ⟳ = rotation (real build).
- **Score column = the *real* `summary.json` score** (+ rubric). The on-screen chip is the
  storyboard's muted-autoplay simplification — shown beside the truth so nothing is inflated.

## Frame table (F01–F15)

| # | Beat | Source path | Copied frame / status | Caption (on-screen) | Real score (`summary.json`) | On-screen overlay | Dur | Marks |
|---|---|---|---|---|---|---|---|---|
| F01 | Hook | gray box `[asset: describe/regen]` → `runs/014/render.png` | `spine-r4-hero-oneplane-014.png` (target); gray box **to-generate** | Same model. Same game. The method changed. | target 014 = **strong** (3/3) | morph `333 blocks` → `STRONG·3/3` | 3.0 | ▣ |
| F02 | Climb r2 | `runs/003-v2-designdoc/render.png` | `spine-r2-designdoc-003.png` | + a design doc to build from | **overall 3.0** (rubric v1; prop 3.33·color 3.67·detail 3·fidelity 3.67) | `competent →` · `$1.08 · 1,372 blk` | 2.5 | ▣ |
| F03 | Climb r3 | `runs/008-vRef-designdoc/render.png` (alt `runs/010`) | `spine-r3-reference-008.png` (+ `…-alt-010.png`) | + a reference photo | **overall 4.0** (rubric v1; 4·4·detail 3·4) | `→ ↑` · `20,311 blk` | 2.5 | ▣ |
| F04 | Climb r4 (hero) | `runs/014-vRefRevise-designdoc/render.png` (alt `runs/015`) | `spine-r4-hero-oneplane-014.png` (+ `…-alt-detailstrong-015.png`) | + craft and color, split. One connected plane. | **overall STRONG**; proportion·color·fidelity **strong**, **detail competent** (categorical, 3/3) | `prop STRONG·color STRONG·fidelity STRONG·detail competent · 3/3` | 3.0 | ▣ |
| F05 | Trust: metric | reuse F04 + flash | `spine-r4-hero-oneplane-014.png` (reuse) | We didn't trust our first metric. So we replaced it. | — (about the rubric itself) | `mean≈4, noise≈0.4` ✕ → categorical judge | 1.5 | ▣ |
| F06 | Velocity | montage `runs/001…026` thumbs | **to-generate** (production grid) | 26 builds in two days. The craft compounds. | n/a (quantity texture) | `26 runs · 2 days · ~$0.76–$2.13 each` | 3.0 | |
| F07 | Trust: shortcuts | best-of-N / detail-stack flash | reuse / **to-generate** | Best-of-N cost 7× and gained nothing. | bestof re-judged **3.67**; detail-stack **4.0→3.33** (color 4→2.67) | `$5.34·~29min→3.67` · `4.0→3.33` | 1.5 | |
| F08 | Pivot (twist) | `runs/002/render.png` → `concepts/taj-C-flash.png` | `rotation-placeholder-002.png` → `concept-taj-C-flash.png` **`[concept]`** | Text hit a ceiling. So we changed tools. | n/a — concept art | `[concept]` · text-JSON → image→3D | 3.0 | |
| F09 | Explosion | wall of `concepts/*-C-flash.png` | `concept-{taj,horyuji,chapelle,arc,mausoleum}-C-flash.png` **`[concept]`** | Then the floodgates opened. | n/a — concept art | `[concept]` — concept art, not the build | 3.0 | ◇ |
| F10 | "Yep, that's real" | turntable spin (S-032) | `rotation-placeholder-002.png` (v1); spin **to-generate** | And it's real. Rotating in our own rig. | real build (002, text-JSON era) | `REAL · prismarine-viewer + minecraft-assets · 360°` | 4.0 | ⟳ |
| F11 | Trust: ceiling | reuse F04, `detail` highlighted | `spine-r4-hero-oneplane-014.png` (reuse) | One dimension still won't climb: detail. | **detail competent** (held; 014) | `detail: competent (held)` · "we retracted the ceiling" | 1.5 | ▣ |
| F12 | Breadth | `concepts/{horyuji,chapelle,arc,mausoleum}-C-flash.png` | `concept-{horyuji,chapelle,arc,mausoleum}-C-flash.png` **`[concept]`** | Same method, four more landmarks. Still strong. | real builds 019/021/022 = **strong 3/3** (frames are concepts) | `[concept]` · 4 landmarks · `3/3` | 3.0 | ◇ |
| F13 | Vision | Golden-Gate end-frame (S-034) | **to-generate** (S-034) **`[concept]`** | Where it's heading: the staged sculptor. | n/a — forward concept | `[concept]` · "where it's heading," not shipped | 3.0 | |
| F14 | Thesis | thesis card | **to-generate** (production) | We're the sculptor — not the 2-D-to-3-D tool. | n/a | (clean thesis card) | 2.5 | |
| F15 | CTA | CTA card | **to-generate** (production) | Following the method? The whole journal is open. | n/a | follow + comment bait | 3.0 | |

## Hero spine — the ape→man read (▣)

One subject (**Taj**) the whole climb, so the improvement reads as *method*, not subject-swap.
Score steps trace to real `summary.json` `score` fields:

1. **F01 — before/after promise.** Gray box (333 blocks, capped `claude-opus-4-8` — `[receipt:
   journal P1]`, no render on disk) ⇒ the hero (014).
2. **F02 — + design-doc grounding.** `runs/003` · overall **3.0** (rubric v1) · 1,372 blk · $1.08
   `[receipt: runs/003-v2-designdoc/summary.json]`.
3. **F03 — + reference grounding.** `runs/008` · overall **4.0** (rubric v1) · 20,311 blk · $1.64
   `[receipt: runs/008-vRef-designdoc/summary.json]`.
4. **F04 — + craft/color split + one connected plane (HERO).** `runs/014` · overall **STRONG**,
   proportion/color/fidelity **strong**, **detail competent**, unanimous 3/3 · 10,013 blk · $1.64 ·
   seed 11 · `claude-opus-4-8` `[receipt: runs/014-vRefRevise-designdoc/summary.json]`.

**Rubric honesty:** F02/F03 are scored under the **retired v1 numeric** rubric (which saturated at
mean≈4 — the very reason F05 exists); F04 is the **categorical** rubric. The on-screen chips
(`competent →`, `→ ↑`, `STRONG`) narrate this climb for muted autoplay; this table preserves the
underlying rubric so the mapping is auditable. Alt hero `runs/015` scored **detail = strong** (all
four strong) on an identical config with a noisier block grain — kept as `…-alt-detailstrong-015.png`.

## Breadth beat (◇)

The locked techniques generalize off the Taj — `F09` wall + `F12` four landmarks.

- Real off-domain builds held **strong (3/3)**: `019` Hōryū-ji (detail competent), `021` Arc (all
  strong), `022` mausoleum (detail competent) `[receipt: runs/0{19,21,22}/summary.json]`. `020`
  Sainte-Chapelle regressed proportion strong→competent on the 2nd pass `[receipt: design-learnings
  P13/P14]`.
- **The frames shown are `[concept]`** (`concept-*-C-flash.png`), captioned as concept art — the
  *real* strong scores above are the receipt, the concept art is the visual. Never let a concept
  read as the Minecraft build.

## Rotation placement (⟳)

`F10` is the **only** "real build" claim in the cut. The asset is S-032's turntable
(`render/src/orbit.mjs` `renderOrbit` → `render/out/orbit/<id>/`, gitignored). Until that clip is
produced, **v1 uses `rotation-placeholder-002.png`** — a head-on render of a real (text-JSON era)
build. Honest as a real-but-blocky build per v1-sequencing; swap in the 360° spin when it lands.
The real-AND-gorgeous payoff waits on the staged sculptor (E-11).

## Velocity receipts (real — AC #3)

Every number traces to disk; nothing invented:

- **26 runs** — `benchmarks/temple-facade/runs/001…026/` (26 dirs; `011` has no render)
  `[receipt: ls runs/]`.
- **2 days: 2026-06-04 → 06-05** — `summary.json` `date` field `[receipt: runs/*/summary.json date]`.
- **~$0.76 → ~$2.13 per run** — real min `001` = **$0.7602**, real max `021` = **$2.1251**
  (`costUsd`) `[receipt: runs/00{1}/, runs/021/ summary.json]`.
- **Block counts** on the spine overlays are exact: 003 = **1,372**, 008 = **20,311**, 014 =
  **10,013** `[receipt: summary.json blocks]`.
- **Journal growth: 1,308 lines / 27 numbered lessons / ~109 KB** — `docs/knowledge/design-
  learnings.md` `[receipt: wc -l]`.
- **Same model both ends:** `model: "claude-opus-4-8"`, `seed: 11` on every cited run — the hook's
  "same model" claim survives `[receipt: summary.json model/seed]`.

## Asset status

| Status | Frames |
|---|---|
| **Copied + normalized** (in `frames/`) | F02, F03, F04 (+alts), F08→concept, F09 wall, F12 breadth, F10 placeholder, **F13 Golden-Gate (`concept-goldengate-vision.png`, generated T-034-01)** |
| **Reference-only** (derived/reuse) | F05, F11 (reuse 014) |
| **Synthesized by the assembler** (`pr/production/assemble.mjs`, T-034-01) | F06 receipts card, F07 trust card, F14 thesis card, F15 CTA card |
| **To-generate** | F01 gray box `[describe/regen]` (rough cut substitutes hero 014 + morph-chip), F10 real spin (S-032) |

## Honesty ledger

- [x] **Concept ≠ real build** — F08/F09/F12 frames are `[concept]` (`concept-*.png`); F13
      (`concept-goldengate-vision.png`, generated T-034-01) is `[concept]`, burned with the amber
      tag in the rough cut. Only F10 claims a real build, and v1 is a flagged placeholder.
- [x] **v1-sequencing** — F13 captioned "where it's heading," not "what we shipped."
- [x] **No invented metrics** — every score/cost/block/run number above carries a `[receipt:…]` to
      a `summary.json` field, `ls`, or `wc -l`. F02/F03 rubric (v1-numeric) is named, not hidden.
- [x] **Same model load-bearing** — `claude-opus-4-8` / seed 11 at both ends of the spine.

## Duration sum-check

`3.0 + 2.5 + 2.5 + 3.0 + 1.5 + 3.0 + 1.5 + 3.0 + 3.0 + 4.0 + 1.5 + 3.0 + 3.0 + 2.5 + 3.0` =
**40.0s** ∈ [30, 60]. ✓ (~3–5s slack for the production desk's transitions/holds.)
