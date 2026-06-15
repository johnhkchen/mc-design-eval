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

### Step 3 — before/after composite ✅ (AC#3)
ImageMagick `+append`: facade hero (`spine-r4-hero-oneplane-014.png`, the run-014 strong Taj facade — text→JSON
at its best, not strawmanned) ∥ building front still, both height-matched to 1024, labeled, dark-bg caption
strip with the honest scale + verdict chip → `pr/assets/frames/beyond-facade-before-after.png` (2072×1190).
Visually verified: colourful facade left, grey gatehouse-in-the-round right. (Needed explicit
`-font /System/Library/Fonts/Supplemental/Arial.ttf` — IM had no default font.)

### Step 4 — design-learnings E-20 capstone ✅ (AC#4)
Appended `## Beyond facade — the whole structure, in the round (E-20) … · 2026-06-06` at EOF (pure append,
no other section touched). Prose + facade-vs-building table + headline (completeness, not finish) + honest
notes (the weak verdict + E-22 lens confound; the fine-detail residual w/ both measured causes) + One sentence.

### Step 5 — E-12 handoff ✅ (AC#5)
`pr/assets/beyond-facade.md` (house style, mirrors `concept-materials.md`): hero beat, asset manifest, the
truth-beside-the-chip verdict (weak as-rendered, do-not-inflate), the named residual, a proposed F12.5 E-20
coda slot (cut left to Production). All 10 referenced paths resolve (verified).

### Step 6 — verify ✅
`npm test` → **786 pass, 0 fail** (unchanged — no logic touched). Asset audit: all 6 committed assets
non-zero. Working tree clean except pre-existing ticket-frontmatter edits (Lisa's) + untracked `.claude/`.

## Deviations from plan
- **`render:orbit` is a `render/`-subpackage script**, run as `node render/src/orbit-cli.mjs` from the repo
  root (the root `package.json` has no render scripts). No behavior change; recorded so the commands in the
  docs are runnable.
- **Narrative upgrade (rotations README):** discovered the README explicitly states prior `spin-*` clips
  "reveal that they are currently facades (flat reverse side)." The building spin is the direct answer, so the
  README entry frames it as the first non-flat-back spin — strengthens the "we broke facade-only" beat.

## Commits
1. `feat(E-20 T-070-01): building 360 turntable — spin clip + 4 in-the-round stills` (+ RDSPI artifacts)
2. `feat(E-20 T-070-01): beyond-facade before/after — facade ceiling vs full building`
3. `docs(E-20 T-070-01): design-learnings — beyond-facade capstone (whole structure, honest residual)`
4. `docs(E-20 T-070-01): E-12 handoff — beyond-facade hero beat + honest verdict chip`
5. (this) review + final progress.
