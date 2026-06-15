# T-038-01 — Plan: ordered, verifiable steps

Six steps, each independently verifiable, sized to commit atomically. Verification criteria stated
per step. Testing strategy at the foot.

## Step 1 — Encode the 12 rock turntable clips

For each of the 12 runs, ffmpeg-encode `turntable/frame.%03d.png` (24 frames) →
`pr/assets/rotations/rock-<subject>-<seq>.mp4`, matching `orbit-clip.mjs` params:
`ffmpeg -y -framerate 12 -i frame.%03d.png -pix_fmt yuv420p -vf scale=trunc(iw/2)*2:trunc(ih/2)*2`.

Subject→run map: dancing-man 002, moai 003, pineapple 004, bow-and-arrow 005, heart 006, sword 007,
mushroom 008, koi 009, moai 010 (s16), moai 011 (s48), pineapple 012 (s16), pineapple 013 (s48).

**Verify:** 12 mp4s exist, each non-zero, `ffprobe` reports 24 frames @ 12 fps (~2.0s). Spot-check
one plays / has video stream.

## Step 2 — Build the 8 pair frames + 2 triptychs

Pairs (×8): `magick concept.png render-3q.png` side-by-side at common height 512 →
`pr/assets/frames/pair-<subject>-<seq>.png`. Use `+append` after normalizing height
(`-resize x512`). Concept left, render right.

Triptychs (×2): the three `render-3q.png` for moai (010|003|011) and pineapple (012|004|013), each
`-resize x512` then `+append` →
`pr/assets/frames/triptych-{moai,pineapple}-16-32-48.png`. Ascending scale left→right.

**Verify:** 10 PNGs exist; `magick identify` shows height 512; pair widths ≈ concept_w(@512)+512;
triptych widths ≈ 3×512-ish. Eyeball one pair + one triptych to confirm correct images/order.

## Step 3 — Inspect run 013 (pineapple@48) and write its read

Read `runs/013-…/render-3q.png` + `concept.png` + `summary.json` (12176 blocks). Form an **honest
one-line fidelity read** for the caption + journal. This is the only build with no prior read.
Record it in `progress.md` and reuse it verbatim in `sculptures.md` and the journal scale section.

**Verify:** the read is grounded in the actual render (cite what is/ isn't visible), consistent with
the non-monotonic frontier or noting honestly if it deviates.

## Step 4 — Write `pr/assets/sculptures.md`

The manifest (Structure §"sculptures.md"): header, 8-subject table (grouped angular → thin/linear →
organic, each with pair frame + rock clip + one-line caption + categorical judgment), 2-triptych
table with the scale read, a Regenerate block (orbit-cli + ffmpeg + magick commands), and the
`## E-12 handoff` section.

**Verify:** every asset path in the doc resolves to a file created in Steps 1–2; captions trace to a
per-build read; the angular/thin/organic grouping makes the frontier legible by row order.

## Step 5 — Journal + rotations README

(a) Append `## Fidelity-vs-concept frontier (E-13 sculpture set, S-038)` to
`docs/knowledge/design-learnings.md` — frontier by form type, by scale (triptychs, non-monotonic
mechanism), and the image→3D / sculptor framing; cite per-build reads + the committed frames.
(b) Append a "Sculpture set (E-13 / S-038)" subsection to `pr/assets/rotations/README.md` listing the
12 rock clips + source runs + the "frames were already rock-mode" provenance note.

**Verify:** the journal section reads as the *measured case* for image→3D (AC#2); cites real builds;
the rotations index now covers the sculpture clips.

## Step 6 — Test + commit

Run `npm test` (the regression gate). Then commit the assets + docs.

**Verify:** `npm test` green. `git status` shows the 12 mp4s, 10 pngs, `sculptures.md`,
the two doc edits — and **no** source/schema/test changes.

## Testing strategy

- **No new unit tests.** This ticket adds no executable code — it produces media + prose. Unit tests
  would have nothing to assert. (Memory *T-037-01 testing strategy*: live runs/curation are
  integration-style, not unit-tested.)
- **`npm test` as a regression guard (AC#4).** Confirms the unrelated artifact-schema + unit suite
  still passes — i.e. the curation didn't disturb the toolchain. Expected: unaffected (docs/assets
  only).
- **Asset integrity checks** substitute for unit tests: per-clip `ffprobe` frame/fps assertion
  (Step 1), per-frame `magick identify` dimension assertion (Step 2). These are the verifiable
  "does the artifact meet spec" checks for media deliverables.
- **Honesty review** (AC: gaps shown not hidden): Step 4/5 captions must name the failures
  (heart/koi wrong-form, moai@48 poor, the angle-gated stills) — verified by reading the manifest
  against the per-build reads, not a machine check.

## Commit shape

One feature commit: `feat(E-13 T-038-01): sculptural best-of curation — 12 rock clips, 8 pair
frames, 2 triptychs, fidelity-frontier journal + E-12 handoff`. Assets and docs together (one
coherent deliverable). Co-authored trailer per repo convention.

## Risks / mitigations

- **Run 013 read could contradict the prediction** → that's fine; report what the render shows
  (honesty AC), don't force the narrative (Step 3).
- **ffmpeg even-scale**: render frames are 512×512 (even) — no padding issue; the `scale=trunc`
  guard is a no-op but kept for convention parity.
- **mp4 size in git**: 24-frame 512² clips are small (tens of KB); acceptable, matches the temple
  rocks already committed.
