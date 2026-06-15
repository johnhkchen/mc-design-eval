# T-033-01 — Research: pr-assets-desk

Map of what exists for assembling the canonical evolution frame sequence. Descriptive only.

## Ticket in one line

Realize the storyboard as a committed asset bundle: write `pr/assets/sequence.md` (ordered
`F01–F15` frame list — source path → caption → score → duration, with hero-spine / breadth /
rotation placements marked) and copy/normalize the chosen frames into `pr/assets/frames/` at a
common aspect. Velocity numbers must be real; the cut must stay honest per the epic's v1-sequencing.

## Upstream artifacts (the frame set is already decided)

This is the **fourth** desk in the `pr/` pipeline. The 15-frame structure is fixed upstream; the
assets desk only *sources, copies, scores* it — it does not re-author beats.

- `pr/assets/README.md` — this desk's charter (job, output contract, sourcing list).
- `pr/script/beats.md` — the story: 15 frames `F01–F15`, each with a `[receipt: …]` and the
  honesty ledger (concept≠real, v1-sequencing, no invented metrics, "same model" load-bearing).
- `pr/script/storyboard.md` — timing: total **40.0s**, aspect-agnostic, per-frame durations and
  the two "marked beats" the AC echoes (score-overlay spine `F01→F04`+`F05`/`F11`; rotation `F10`).
- `pr/script/script.md` — per-frame `caption:` / `VO:` / `overlay:` text (muted-autoplay copy).
- `pr/production/README.md` — the downstream consumer (assembles the cut from this sequence).

The frame IDs `F01–F15` are the join key across beats / storyboard / script / sequence.

## Source assets on disk

### Spine renders (one hero subject = Taj)
`benchmarks/temple-facade/runs/<id>/render.png` — **512×512 PNG**, head-on facade renders.
- **26 run directories** exist: `001`–`026` (`ls -d …/runs/*/` → 26). Run `011` has **no**
  `render.png` (only 25 renders on disk); all others render.
- Storyboard-referenced spine frames all present: `003` (81 KB), `008` (64 KB), `010` (40 KB),
  `013` (57 KB), `014` (66 KB), `015` (51 KB), plus `001`/`002` (text-JSON era).
- **Git status anomaly:** `.gitignore:17` ignores `benchmarks/temple-facade/runs/`, **but 70 run
  files are already git-tracked** (`git ls-files …/runs/` → 70) — they were committed *before* the
  ignore rule, so gitignore never untracked them. So spine renders are, in practice, already in
  the repo. The ticket/README still treat them as gitignored and ask for curated copies — copying
  into `pr/assets/frames/` makes the PR bundle self-contained regardless of that history.

### Concept frames (Gemini-Flash reference art — NOT Minecraft)
`benchmarks/temple-facade/concepts/<subject>-C-flash.png`.
- Five subjects needed: `taj` `horyuji` `chapelle` `arc` `mausoleum` — all present.
- **1024×1024** except `mausoleum-C-flash.png` = **1376×768** (the lone non-square source).
- `.gitignore:20` ignores `concepts/` **and they are NOT tracked** (`git ls-files …/concepts/` →
  0). So unlike the renders, concept frames must be **copied in to be committable** — this is the
  load-bearing reason the AC says "copy frames into `frames/`".

### Rotation asset (F10) — from S-032
`render/src/orbit.mjs` (`renderOrbit`) writes N azimuth frames to `render/out/orbit/<id>/`
(**gitignored**, `render/out/` is build output). No committed rotation sample exists; only test
leftovers `render/out/test-orbit/frame.00{2,3}.png` (128²). Per beats `F10` note, v1 may
placeholder with a real-but-blocky **head-on** render captioned as the real build, upgrading to
the spin when S-032's clip is produced.

## Scores — authoritative source

The per-run **`score`** field inside each `summary.json` is the truth (the top-level `overall`/
`perSample`/`dimensions` keys are **null** — do not read those). Two rubrics coexist:

- **`rubric: "v1"` (numeric, saturated ~4):** `003` → overall **3.0** (prop 3.33 / color 3.67 /
  detail 3 / fidelity 3.67); `008` → overall **4.0** (4/4/3/4). These are the *old metric* the
  trust beat `F05` says we distrusted.
- **Categorical (weak/competent/strong/exceptional, median-of-3):** `014` → overall **strong**
  (proportion / color / fidelity **strong**, **detail competent**) — the hero; `015` → **all
  strong** (detail strong, the noisier-grain variant); `019`/`022` → strong (detail competent);
  `021` → all strong.

`docs/knowledge/design-learnings.md` (1308 lines, 27 numbered lessons, ~109 KB) corroborates the
narrative (run 014 = "first strong"; detail = lone holdout; 019/020/021/022 off-domain
confirmations; best-of-N and detail-stack null results). It is the *journal*, not the score store.

## Velocity receipts (real numbers, for AC #3)

- **Run count: 26** (`runs/001`–`026`).
- **Timeline: 2 days, 2026-06-04 → 06-05** — `summary.json` carries a `date` field; the earliest
  runs read `2026-06-04`. (Renders were committed on 2026-06-04 per `git log`.)
- **Per-run cost: ~$0.76 → ~$2.13** — real min `001` = `$0.7602`, real max `021` = `$2.1251`
  (`costUsd` field). Matches the storyboard's `~$0.76–$2.13`.
- **Block counts match the overlays:** `003`=1372, `008`=20,311, `014`=10,013.
- **Journal growth: 1308 lines / ~109 KB / 27 lessons** in `design-learnings.md`.
- **"Same model" is true at both ends:** every cited `summary.json` has `model:
  "claude-opus-4-8"`, `seed: 11` — the hook's load-bearing claim survives.

## Honesty constraints (carried from beats ledger)

- **Concept ≠ real build:** `F08 F09 F12 F13` are `[concept]` — must be captioned as concept art,
  never as a Minecraft build. The **only** "real build" claim is the rotation `F10`.
- **v1-sequencing:** `F13` (Golden-Gate) is "where it's heading", not "what we shipped".
- **No invented metrics:** every on-screen number must trace to a `summary.json`/journal receipt.

## Assets with no copyable source (must be flagged, not fabricated)

- `F01` **gray box (333 blocks)** — no render on disk; journal-P1 attempt. `[asset:
  describe/regenerate]`. Morph *target* is `014` (which we do have).
- `F06` **velocity montage** — a derived grid of `runs/001…026` thumbs; production assembles it.
- `F10` **rotation** — S-032 output is gitignored; v1 placeholder = a head-on render.
- `F13` **Golden-Gate concept** — generated later by S-034; not yet on disk.
- `F14`/`F15` **thesis / CTA cards** — production-generated text cards.

## Tooling available

`sips`, `magick`/`convert` (ImageMagick), `ffmpeg` all on PATH — normalization to a common aspect
is a local image op, no new dependency.

## Constraints & assumptions

1. Storyboard is **aspect-agnostic**; the common aspect is the assets desk's choice (production
   picks the final 1:1 vs 4:5 crop). Square is the least-destructive common denominator (renders
   and 4/5 concepts are already square).
2. This is a **docs/assets** ticket — no source code, no repo test-suite changes. Verification is
   file existence + dimensions + git-tracked + receipt cross-check.
3. The sequence must record the **real** score (with rubric tag) alongside the storyboard's
   simplified on-screen chip, so the honesty chain stays auditable.
