# T-038-01 — Structure: file-level blueprint

The shape of the change. No source code touched — assets + docs only. Files grouped by what
produces them, with the ordering that matters.

## Created — curated assets (committed; the package for E-12)

### `pr/assets/rotations/` — 12 rock turntable clips
```
rock-dancing-man-002.mp4     rock-moai-003.mp4        rock-pineapple-004.mp4
rock-bow-and-arrow-005.mp4   rock-heart-006.mp4       rock-sword-007.mp4
rock-mushroom-008.mp4        rock-koi-009.mp4         rock-moai-010.mp4   (scale 16)
rock-moai-011.mp4 (scale 48) rock-pineapple-012.mp4   (scale 16)
rock-pineapple-013.mp4 (scale 48)
```
Each: ffmpeg-encoded from `runs/<seq>-…/turntable/frame.%03d.png` (24 frames), 12 fps, `yuv420p`,
even-scaled. Matches `orbit-clip.mjs` output convention. ~0.5–1s loops.

### `pr/assets/frames/` — 8 pair montages + 2 triptychs
```
pair-dancing-man-002.png   pair-moai-003.png       pair-pineapple-004.png
pair-bow-and-arrow-005.png pair-heart-006.png      pair-sword-007.png
pair-mushroom-008.png      pair-koi-009.png
triptych-moai-16-32-48.png         triptych-pineapple-16-32-48.png
```
Pair = `concept.png` (left) `+` `render-3q.png` (right), common height 512, clean (no text).
Triptych = three `render-3q.png` (scales 16|32|48) at common height 512, left→right ascending.

## Created — the curation manifest

### `pr/assets/sculptures.md` (~120 lines)
The E-12 deliverable manifest. Sections:
1. **Header** — what this package is (fresh-subject breadth/explosion for E-13), how it differs from
   `sequence.md` (breadth, not the temple evolution climb).
2. **Subject table** (8 rows, grouped angular → thin/linear → organic): subject · pair frame · rock
   clip · one-line fidelity read caption · categorical judgment.
3. **Triptych table** (2 rows): moai 16/32/48, pineapple 16/32/48 · triptych frame · rock clips (×3)
   · the scale read (non-monotonic).
4. **Regenerate** — the reproducible commands (orbit-cli `--oscillate`, the ffmpeg encode, the
   magick montage) so the package is rebuildable.
5. **`## E-12 handoff`** — what's delivered, how it slots into F09/F12, honesty constraints.

## Modified

### `docs/knowledge/design-learnings.md` (+~70 lines, append-only)
New top-level section `## Fidelity-vs-concept frontier (E-13 sculpture set, S-038)`, appended after
the E-11 staged-sculptor consolidation. Three subsections: frontier by form type, frontier by scale,
the image→3D framing. Cites the per-build reads + committed pair/triptych frames.

### `pr/assets/rotations/README.md` (+~12 lines)
Append a **"Sculpture set (E-13 / S-038)"** subsection to the existing table: the 12 `rock-<subject>`
clips, their source runs, and the note that sculpture frames were *already* rock-mode (no re-render).
Keeps the rotations index complete and honest about provenance.

## Untouched (explicitly)

- **No source / schema / test files.** `render/src/*`, `src/*`, `scripts/*`, `schema/*` unchanged.
  The render rig and encoder are *reused as-is*, not modified.
- **`pr/assets/sequence.md`** — the temple cut is a separate story; not edited (Design D5).
- **The run dirs** — read-only inputs. Their gitignored `turntable/` frames are the encode source
  but are not themselves committed (the mp4 is the committed artifact).
- **Ticket frontmatter** — not touched (Lisa advances phases).

## Build helper (transient, not committed)

A throwaway shell loop drives ffmpeg + magick over the 12 runs. It is *not* a committed script — the
reproducible commands live documented in `sculptures.md` / `rotations/README.md` (matching how the
temple rotations document their regen rather than shipping a bespoke script). If a committed helper
were wanted later it would land at `pr/production/`, but Design D1 keeps this offline + documented.

## Public surfaces / contracts

- **To E-12:** the contract is `pr/assets/sculptures.md` (manifest) + the committed frames/clips it
  names. Stable paths, common aspect ratios, clean (overlay-free) frames → E-12 owns typography.
- **To the journal reader:** `design-learnings.md` gains the frontier section; existing per-build
  reads remain the drill-down. The section links *down* to them, not duplicates them.

## Ordering (what must precede what)

1. Encode the 12 rock clips (independent per run; needs only the frames).
2. Build the 8 pair frames + 2 triptychs (independent; needs concept/render stills).
3. Inspect run 013 (pineapple@48) render → write its honest one-line read (gates its caption).
4. Write `sculptures.md` (needs the asset paths from 1–2 and the read from 3).
5. Append the journal section + the rotations README subsection (need the curated evidence to cite).
6. `npm test` (regression guard) → commit.

Steps 1–2 are order-independent and form the bulk; 3 is the only new-judgment step; 4–5 are the
writing; 6 is the gate.
