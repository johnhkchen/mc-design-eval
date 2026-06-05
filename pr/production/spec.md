# spec.md — output spec for the evolution-showcase video

The format/aspect/length/caption/pacing/music brief the rough cut realizes and the human editor
finishes from. Numbers trace to `pr/script/storyboard.md` and `pr/assets/sequence.md`.

## Format & aspect

- **Master:** **1:1 square, 1080×1080**, H.264 / `yuv420p`, 30 fps. Chosen because every curated
  frame in `pr/assets/frames/` is already 1:1 1080×1080 — the master resamples nothing and matches
  `sequence.md`'s declared master. Square autoplays well in the LinkedIn feed.
- **Vertical (4:5) option:** LinkedIn favours 4:5 for feed real estate. Don't re-shoot — letterbox
  the square master:
  ```sh
  # 1:1 1080×1080 → 4:5 1080×1350, pillar/letterbox on a dark field (no crop, nothing lost)
  ffmpeg -i rough-cut.mp4 -vf "scale=1080:1080,pad=1080:1350:0:135:color=#0c0c0c" -c:a copy rough-cut-4x5.mp4
  ```
  (Or center-crop to 4:5 if the editor prefers fill over letterbox — the frames have margin to
  spare.) Decision deferred to the human upload step; 1:1 is the safe default.

## Length

- **Total: 40.0s**, inside the **30–60s** LinkedIn target. The rough cut measures **40.00s** by
  construction (per-frame holds summed from the storyboard). ~3–5s of slack remains in the budget
  for the human editor's transitions/holds without leaving the window.

## Caption style (inherited from `pr/script/script.md` — voice is locked)

- **Declarative, receipts-forward, skeptic-respecting.** Short sentences. A real number wherever
  the brief has one. **No hype adjectives** ("stunning / revolutionary / amazing" are banned — the
  climbing score does the bragging).
- **On-screen caption** (`caption:`): terse, ≤ ~8 words, written for **muted autoplay**. Burned
  bottom-third on a translucent black band, centered, bold sans (Arial Bold in the rough cut).
- **Overlay chip** (`overlay:`): the score chip / number / tag, top-left, small, white with a black
  stroke for legibility over any frame. It must **not** duplicate or contradict the caption.
- **`[concept]` tag:** amber, top-right, on **every** concept frame (F08, F09, F12, F13). This is a
  hard honesty requirement — a concept must never read as the Minecraft build.
- **VO** (`script.md` `VO:` lines) is **optional** — record it or drop it; the cut works muted.

## Pacing (from `storyboard.md`)

- **Hold the hook and the two payoffs** so they register: F01 hook (3.0s), F08 pivot (3.0s), F10
  rotation (4.0s — the longest, the only real-build claim).
- **Trust flashes are fast** — F05/F07/F11 at 1.5s each: a beat long enough to read the overlay, not
  a wallow. They ride on frames that already exist (reuse 014 / cards).
- **Climb rungs ~2.5–3s** (F02–F04) so the rising score overlay is readable.
- Per-frame durations (authoritative, sum = 40.0s):
  `F01 3.0 · F02 2.5 · F03 2.5 · F04 3.0 · F05 1.5 · F06 3.0 · F07 1.5 · F08 3.0 · F09 3.0 ·
   F10 4.0 · F11 1.5 · F12 3.0 · F13 3.0 · F14 2.5 · F15 3.0`.

## Overlay legend (what the chips mean)

| Chip | Meaning |
|---|---|
| `333 blocks → STRONG 3/3` | the hook morph: capped gray box ⇒ run 014 (unanimous strong) |
| `competent →` / `→ ↑` / `prop·color·fidelity STRONG · detail competent · 3/3` | the categorical climb F02→F03→F04 |
| `mean≈4 noise≈0.4 ✕ → categorical judge` | F05 — the saturated v1 numeric rubric we retired |
| `$5.34 · ~29min → 3.67` · `4.0→3.33` | F07 — best-of-N and detail-stack null results |
| `REAL · prismarine-viewer + minecraft-assets · 360°` | F10 — the only real-build claim |
| `detail: competent (held)` | F11 — the honest, un-climbed dimension |
| `[concept]` | F08/F09/F12/F13 — Gemini-Flash reference art, NOT the build |

> The rough cut burns ASCII-sanitized overlay text (`->`, `up`, `x`, `.`) to avoid missing-glyph
> boxes in the burn font; the human editor restores the rich glyphs (`→ ↑ ✕ ·`) in the final.

## Music notes

- **No licensed track ships** with this desk (music licensing is the human/video-tool step, out of
  scope per `pr/production/README.md`). The rough cut is **silent**.
- **Brief for the editor:** restrained, forward-moving, builder-documentary feel — *not* a hype
  EDM drop. ~90–110 BPM. Let the track build under the climb (F02–F04), drop to near-silence under
  the trust flashes (F05/F07/F11) so the null-result captions land, lift again at the pivot (F08)
  and the rotation payoff (F10), and resolve clean under the thesis/CTA (F14/F15).
- **Sync map (beat → frame):** intro ≈ F01; first lift ≈ F02–F04; breakdown ≈ F05; re-enter ≈ F06;
  twist hit ≈ F08; peak ≈ F10; resolve ≈ F13–F15. Keep VO (if used) over music-bed, ducked.
