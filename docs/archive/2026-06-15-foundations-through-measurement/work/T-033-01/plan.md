# T-033-01 — Plan: pr-assets-desk

Ordered, independently-verifiable steps. Testing here is verification (file/dim/receipt checks);
there is no repo unit suite for a docs/assets ticket.

## Step 1 — Normalize the spine renders into `frames/` (point filter)

Five voxel renders → 1080² nearest-neighbor:
- `003,008,010,014,015/render.png` → `frames/spine-…-{003,008,010,014,015}.png`.
- Command per file: `magick SRC -filter point -resize 1080x1080 DST`.

**Verify:** `sips -g pixelWidth -g pixelHeight` on each = 1080×1080; 5 files present.

## Step 2 — Normalize the concept frames into `frames/` (Lanczos; mausoleum crop-first)

- `taj,horyuji,chapelle,arc/…-C-flash.png` → `magick SRC -filter Lanczos -resize 1080x1080 DST`.
- `mausoleum-C-flash.png` (1376×768) → `magick SRC -gravity center -crop 768x768+0+0 +repage
  -filter Lanczos -resize 1080x1080 DST`.

**Verify:** 5 concept files at 1080×1080; mausoleum visually centered (spot-check byte size > 0).

## Step 3 — Copy the rotation placeholder

`runs/002/render.png` → `frames/rotation-placeholder-002.png` (point, 1080²).

**Verify:** file present at 1080×1080; name says "placeholder".

## Step 4 — Write `frames/README.md`

Provenance + the three `magick` recipes + concept-≠-real + reuse + placeholder notes.

**Verify:** mentions all 11 files; states concepts are gitignored Gemini-Flash art copied for the
bundle.

## Step 5 — Write `pr/assets/sequence.md`

The deliverable, structured per `structure.md` §sequence.md (header, F01–F15 table, hero spine,
breadth, rotation, velocity receipts, asset-status, honesty ledger, sum-check).

Pull every number live from source before writing the row:
- scores ← each `summary.json` `score` field (+ rubric tag);
- block counts ← `blocks`; cost min/max ← `costUsd`;
- captions/overlays ← `script.md`; durations ← `storyboard.md`.

**Verify (AC map):**
- **AC #1** — table has all of: source path, copied-frame, caption, real score, overlay, duration;
  `marks` column flags hero-spine / breadth / rotation. ✔ when every F01–F15 row is complete.
- **AC #2** — every "copied frame" cell names a file that exists in `frames/` at the common 1080²
  aspect. ✔ by cross-checking `ls frames/`.
- **AC #3** — velocity block cites 26 runs / 2-day window / $0.76–$2.13 / journal size, each with a
  `[receipt:…]` resolving to a real field. ✔ by re-reading `summary.json`/`wc -l`.
- **AC #4** — concept rows tagged `[concept]`; `F13` "where it's heading"; honesty ledger all four
  boxes checked against the actual sequence. ✔ by inspection.

## Step 6 — Full cross-check pass (pre-commit gate)

Single script:
1. Every `source path` token in sequence.md resolves on disk.
2. Every `frames/…png` referenced exists and is 1080×1080.
3. The three printed block counts (1372 / 20,311 / 10,013) re-read equal from `summary.json`.
4. Cost min/max (`001`=0.7602, `021`=2.1251) re-read equal.
5. `git status` shows the 5 concept copies as **new tracked** files (they were untracked sources).

Any mismatch → fix sequence.md, re-run. This is the honesty gate.

## Step 7 — Write `progress.md`, then commit

- `progress.md`: steps done, any deviation, AC coverage.
- Commit: `feat(pr): canonical evolution frame sequence + curated frames (T-033-01)`.
- Commit body: list `sequence.md`, `frames/README.md`, the 11 frames; note concepts copied because
  gitignored; note F10 placeholder + S-032 upgrade.

## Testing strategy summary

| What | How verified | When |
|---|---|---|
| Frame dimensions | `sips -g pixelWidth -g pixelHeight` = 1080×1080 | Steps 1–3, 6 |
| Frame count / names | `ls pr/assets/frames` = 11 + README | Step 6 |
| Score accuracy | re-read `summary.json` `score`/`blocks`/`costUsd` | Steps 5–6 |
| Velocity reality (AC#3) | run count `ls`, dates `date` field, `wc -l` journal | Steps 5–6 |
| Honesty (AC#4) | concept tags, v1-sequencing wording, ledger | Steps 5–6 |
| Committability | `git status` shows concept copies tracked | Step 6 |

## Rollback / risk

- Lowest-risk ticket type (additive docs+images). Worst case: a wrong number in sequence.md →
  caught by Step 6 cross-check before commit.
- Only real judgment call already settled in design: 1:1 master aspect + nearest-neighbor for
  voxels. If production wants 4:5, it letterboxes from the square master — no re-source needed.
