# T-070-01 — full-building-showcase · Plan

Ordered, independently-verifiable steps. No source logic → the "tests" are **verification gates** (asset
exists / right size / non-empty / parses) + the standing `npm test` 786 green. Each step is an atomic commit.

## Step 0 — preflight (no commit)

- Confirm `GL_AVAILABLE === true` and `ffmpeg` on PATH (both verified in Research; re-check at run time).
- Confirm `benchmarks/sculpture/building/best/artifact.json` present (7.67 MB, 57,202 placements).
- Confirm committed inputs exist: `pr/assets/frames/spine-r4-hero-oneplane-014.png` (1080² facade hero).
- **Verify:** all three present; abort to the contingency (cite `building-refined.png`) only if GL/ffmpeg gone.

## Step 1 — render the 360 turntable (AC#1)

```
npm run render:orbit -- --artifact benchmarks/sculpture/building/best/artifact.json \
  --frames 48 --start 45 --elevation 30 --size 768 --mp4 --fps 12 \
  --out render/out/orbit/building-e20
```

- Capture the `onFrame` azimuth log (the CLI prints `frame i/48 @ <az>° …`) to map indices → azimuths.
- **Verify:** 48 PNGs + a clip in `render/out/orbit/building-e20/`; clip non-empty; each frame's `placed` > 0
  (a non-empty render). Eyeball the front/side/back/roof reads — confirm it is genuinely in the round.
- *No commit yet* (output is gitignored); curation in Step 2 produces the committed assets.

## Step 2 — curate clip + 4 stills → assets (AC#1) · **commit**

- Copy `render/out/orbit/building-e20/clip.mp4` → `pr/assets/rotations/spin-building-e20.mp4`.
- Pick the frames nearest **45° (front/3-4 hero), 135° (right), 225° (back), 315° (left)** from the azimuth
  log; copy → `pr/assets/frames/building-turntable-{front,right,back,left}.png`.
- Add a one-line entry to `pr/assets/rotations/README.md`.
- **Verify:** `file` reports mp4 + four 768² PNGs; `ls -la` shows non-zero sizes; README lists the clip.
- **Commit:** `feat(E-20 T-070-01): building 360 turntable — spin clip + 4 curated in-the-round stills`.

## Step 3 — compose the before/after vs the Phase-1 facade (AC#3) · **commit**

- Run the ImageMagick recipe (structure.md): height-match facade hero (1080²) ∥ building front still, label
  each, append with a gutter on the dark desk bg → `pr/assets/frames/beyond-facade-before-after.png`.
- **Verify:** output exists, is a valid PNG, visibly 2-up (facade left, building right), labels legible.
- **Commit:** `feat(E-20 T-070-01): beyond-facade before/after — facade ceiling ∥ full building`.

## Step 4 — design-learnings E-20 capstone (AC#4) · **commit**

- Append the `## Beyond facade … (E-20) (S-070, T-070-01) · 2026-06-06` section at EOF, house shape (prose →
  table → headline → honest notes → One sentence). Numbers sourced from the artifact + `surgical-standard.json`
  + `sequence.md` F04. The honest residual = surgical-edit 1M-context scale limit + TRELLIS detail loss + the
  E-22 render-lens confound on the `weak` verdict.
- **Verify:** section is headed/dated, table renders, no other section altered (`git diff` shows a pure append).
- **Commit:** `docs(E-20 T-070-01): design-learnings — beyond-facade capstone (whole structure, honest residual)`.

## Step 5 — E-12 handoff doc (AC#5) · **commit**

- Author `pr/assets/beyond-facade.md` (structure.md shape): hero beat, assets shipped, the **honest verdict
  chip** (weak as-rendered + E-22 lens note + scale/block chips), where it slots in `sequence.md` (proposed
  coda, marked ⟳), receipts. Explicitly flag the truth-beside-the-chip norm.
- **Verify:** every path the doc references resolves (the clip, the 4 stills, the before/after, the receipts);
  the verdict is stated as `weak` (not inflated).
- **Commit:** `docs(E-20 T-070-01): E-12 handoff — beyond-facade hero beat + honest verdict chip`.

## Step 6 — final verification + review (AC: "npm test green") · **commit**

- `npm test` → expect **786 pass, 0 fail** (no logic touched).
- Asset audit: list all 7 created/modified committed paths with sizes; confirm none are zero-byte.
- `git status` clean except the intended ticket files.
- Write `review.md` (changes, test coverage, open concerns — lead with the verdict-honesty + render-lens
  confound, and the "this is a scale leap, not a finish leap" framing).
- **Commit:** `docs(E-20 T-070-01): review — beyond-facade showcase handoff`.

## Testing strategy

- **Unit:** none added (no source logic). The suite must stay green and untouched (786); any drop is a
  regression to investigate, not to absorb.
- **Verification gates (per step above):** existence + format + size + visual sanity of each asset; pure-append
  check on design-learnings; path-resolution check on the handoff. These are the acceptance evidence for a
  render+compose+document ticket.
- **Honesty gate (cross-cutting):** every place the verdict appears, it reads `weak` with the E-22
  lens caveat; the headline is the scale/completeness leap, never "Strong+". This is checked by reading the
  three authored docs against each other before the final commit.

## Risks & mitigations

| risk | mitigation |
| ---- | ---------- |
| Orbit render slow/OOM on 57k blocks at 768² | 48 frames is modest; if slow, drop to `--size 640` / `--frames 36` (still in-the-round). Recorded as a deviation if used. |
| `clip.mp4` not encoded (ffmpeg edge) | ffmpeg verified present; if it fails, encode the curated frames manually via `ffmpeg -i frame-%03d.png`; worst case ship the 4 stills + document. |
| ImageMagick `+smush` unsupported | fall back to `+append` after explicit `-extent` padding (both present). |
| Verdict inflation creep | the honesty gate in Step 6; the handoff explicitly says "do not inflate." |
| Repo size (T-068) | commit the clip + 4 stills + 1 composite only; full frame dump stays gitignored. |

## Definition of done (maps to the 5 ACs)

1. ✅ `spin-building-e20.mp4` (full 360, all sides + roof) + 4 curated stills committed.
2. ✅ final categorical verdict **recorded** (`weak`, IoU 0.929) with the E-22 lens caveat — in the
   design-learnings section + the handoff chip (citing `surgical-standard.{md,json}`).
3. ✅ `beyond-facade-before-after.png` (one grand face → complete building) in `pr/assets/frames/`.
4. ✅ design-learnings.md gains the **beyond-facade (E-20)** section (pipeline / scale / standard / residual).
5. ✅ `pr/assets/beyond-facade.md` E-12 handoff; **`npm test` green (786)**.
