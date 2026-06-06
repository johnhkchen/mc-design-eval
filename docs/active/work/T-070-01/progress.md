# T-070-01 — full-building-showcase · Progress

## Status: implementation in progress.

## Completed

### Step 0 — preflight ✅
GL_AVAILABLE true, ffmpeg present, `building/best/artifact.json` (57,202 placements) + facade hero
(`spine-r4-hero-oneplane-014.png`, 1080²) confirmed.

### Step 1 — 360 turntable rendered ✅ (AC#1)
`node render/src/orbit-cli.mjs` (the `render:orbit` script lives in the `render/` subpackage, not root) with
`--frames 48 --start 45 --elevation 30 --size 768 --mp4 --fps 12` →
`render/out/orbit/building-e20/` (gitignored): 48 frames, **all 57,202 placed**, `orbit.mp4` encoded.
Inspected front (45°, frame.000) and back (225°, frame.024): genuinely in the round — front shows the arched
doorway + dark-oak base, back is a distinct face, the stepped roof crown reads from above. Azimuth→index:
45°→000, 135°→012, 225°→024, 315°→036.

### Step 2 — curate clip + 4 stills ✅ (AC#1)
- `orbit.mp4` → `pr/assets/rotations/spin-building-e20.mp4` (1.49 MB).
- frames 000/012/024/036 → `pr/assets/frames/building-turntable-{front,right,back,left}.png` (768², ~210–230 KB).
- `pr/assets/rotations/README.md` — added a **"Beyond facade — the full building, in the round (E-20)"**
  section: this is the **first `spin-*` whose 360° does not reveal a flat facade back** (the README itself flags
  that every prior spin did) — the in-the-round payoff. All tracked (not gitignored).

## Remaining
- Step 3 — before/after composite (`beyond-facade-before-after.png`). (AC#3)
- Step 4 — design-learnings E-20 capstone. (AC#4)
- Step 5 — `pr/assets/beyond-facade.md` handoff. (AC#5)
- Step 6 — `npm test` green + asset audit + review.md.

## Deviations from plan
- **`render:orbit` is a `render/`-subpackage script**, run as `node render/src/orbit-cli.mjs` from the repo
  root (the root `package.json` has no render scripts). No behavior change; recorded so the commands in the
  docs are runnable.
- **Narrative upgrade (rotations README):** discovered the README explicitly states prior `spin-*` clips
  "reveal that they are currently facades (flat reverse side)." The building spin is the direct answer, so the
  README entry frames it as the first non-flat-back spin — strengthens the "we broke facade-only" beat.

## Commits
1. (pending) Step 2 — building turntable: spin clip + 4 stills + README.
