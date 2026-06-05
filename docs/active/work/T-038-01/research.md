# T-038-01 — Research: sculptural best-of curation

Epic E-13 / story S-038. The **terminal** ticket of the sculpture arc — gated on all 12 builds
(T-036-01…08 subjects, T-037-01…04 scale studies). Descriptive map of what exists and how it
connects. No solutions here.

## What the ticket asks for (restated)

1. Collect the **8 subject builds** (scale 32) + the **4 scale builds** (moai/pineapple @16 & @48).
2. For each build: pair **concept image ↔ build render**, and a **rock turntable** (front-arc).
3. Assemble the moai & pineapple **16/32/48 triptychs**.
4. Caption each (subject + one-line fidelity read).
5. Journal the **fidelity-vs-concept frontier** in `docs/knowledge/design-learnings.md`: which form
   types text→JSON realizes well (angular: moai, sword) vs poorly (thin/organic: bow & arrow, koi,
   heart), and how fidelity tracks scale (the triptychs).
6. Hand the curated package to **E-12** (`pr/assets/`) as fresh-subject breadth/explosion content.

## The 12 builds (the source of truth)

All live under `benchmarks/sculpture/runs/` with committed provenance. Run dir → subject / scale:

| seq | run dir | subject | scale | blocks | fidelity verdict (from the per-build read) |
|----|---------|---------|------|-------|--------------------------------------------|
| 002 | `…a-dancing-man` | dancing man | 32 | 1073 | faithful palette + pose; 3/4 still under-sells (turntable rescues) |
| 003 | `…a-moai-statue` | moai | 32 | 2402 | **Competent** overall, **form Strong** — text-JSON best case |
| 004 | `…a-pineapple` | pineapple | 32 | 3314 | faithful form/palette; cross-hatch skin under-reads (low value contrast) |
| 005 | `…a-bow-and-arrow` | bow & arrow | 32 | 411 | complete part list, recognizability **angle-gated**; thin/linear stress |
| 006 | `…human-heart` | anatomical heart | 32 | 2648 | right palette/parts, **wrong form** (lobed teardrop + aortic loop lost) |
| 007 | `…a-sword` | sword | 32 | 166 | faithful cruciform; taper steps not a point — angular best case #2 |
| 008 | `…a-mushroom` | mushroom | 32 | 4411 | faithful every element; cap terraced (organic-curve loss) |
| 009 | `…a-koi-fish` | koi | 32 | 1997 | right palette/parts, **wrong line** (S-curve + membranous fins lost) |
| 010 | `…a-moai-statue` | moai | 16 | 732 | faithful form, **graceful coarsening** — small end of triptych |
| 011 | `…a-moai-statue` | moai | 48 | 6283 | **Poor** — near-black featureless monolith; face does not read |
| 012 | `…a-pineapple` | pineapple | 16 | 332 | recognizable; **lattice reads *better* than @32**; body lost rounding |
| 013 | `…a-pineapple` | pineapple | 48 | 12176 | (read not yet written — implement must inspect the render firsthand) |

Note the **slug collision**: moai runs 003/010/011 and pineapple runs 004/012/013 share a slug;
the join key is **seq + `summary.json.scale`** (see memory *scale-study-cost-and-slug-collision*).
The 8 subjects are runs 002–009; the 4 extra scale builds are 010–013; runs 003 & 004 do
double duty (subject **and** triptych mid-point).

## Run-dir contents & the gitignore boundary (critical)

`benchmarks/sculpture/.gitignore`:
```
runs/*/transcript.jsonl
runs/*/turntable/
```
So per run, **committed**: `concept.png`, `render-3q.png`, `artifact.json`, `summary.json`,
`design-doc.md`, `*.prompt.txt`. **Gitignored** (bulky, reproducible): `transcript.jsonl` and the
**24 `turntable/frame.NNN.png` frames**.

Implication for curation: the concept/render stills are already in git, but the **turntable frames
are not** — so any rock clip handed to E-12 must be an **encoded artifact committed elsewhere**
(the established pattern: frames gitignored, curated clips committed under `pr/assets/rotations/`).

## Turntable frames — already rock-mode

Every run's `summary.json.turntable` = `{ frames: 24, centerDeg: 45, amplitudeDeg: 40, mode:
"rock" }`. The 24 frames on disk are **already the front-arc oscillation** the ticket wants — they
were produced by the shared orbit rig (`oscillateAzimuths` + `renderOrbit`), the same one
`render/src/orbit-cli.mjs --oscillate` drives. So the rock turntable does **not** need
re-rendering (which would need headless GL); the frames need **encoding** to mp4. All 12 runs have
the full 24 frames present (verified).

## Existing rendering / encoding tooling

- `render/src/orbit-cli.mjs` — `--oscillate --amplitude 40 --center <c> --frames N --fps --mp4`.
  The reproducible regeneration path (needs `GL_AVAILABLE`).
- `render/src/orbit-clip.mjs` — `maybeEncodeClip(dir, …)`: best-effort ffmpeg encode of a
  `frame.%03d.png` sequence → mp4 (`-framerate 12 -pix_fmt yuv420p -vf scale=even`). Never throws;
  degrades to "frames only" if ffmpeg absent. **This is the convention to match** for the clips.
- `render/src/orbit-chain.mjs` — ffmpeg `concat -c copy` montage of clips sharing params.
- Local tooling verified present: `ffmpeg` (8.x), `magick`/`montage`/`convert` (ImageMagick).

## Where curated assets live (the E-12 / PR desk conventions)

`pr/assets/` is the assets desk. `pr/assets/README.md` states the rule plainly: *"`runs/` and
`concepts/` are gitignored, so reference by path + copy chosen frames in."*

- `pr/assets/frames/` — curated, **committed** stills (derived/normalized to a common aspect).
  Existing inhabitants are temple-facade hero/concept frames (`spine-*`, `concept-*`).
- `pr/assets/rotations/` — curated, **committed** `rock-*.mp4` / `spin-*.mp4` clips. README documents
  the rock (front-arc, never shows flat back) vs spin (full 360°) distinction; **rock is preferred
  for the hero** because sculptures share the single-view-reconstruction limitation (back inferred).
- `pr/assets/sequence.md` — the **temple-facade** evolution cut (F01–F15). This is a *different*
  story (the architectural climb); the sculpture breadth/explosion content is a **new, parallel**
  curation, not an edit to this sequence.
- `pr/production/assemble.mjs` consumes `pr/assets/frames/*` + `rotations/*` deterministically.

## The fidelity evidence already on disk

Per-build fidelity reads (the captions' source):
- Subjects: `docs/active/work/T-036-0{1,3,4,5,6,7,8}/fidelity-read.md`; moai@32 read is
  `benchmarks/sculpture/runs/003-…/fidelity.md` (form **Strong**, overall **Competent**).
- Scale: `docs/active/work/T-037-0{1,2,3}/fidelity-read.md` (moai@16 graceful, moai@48 poor,
  pineapple@16 lattice-survives). **pineapple@48 (T-037-04) has no fidelity read yet** — research,
  design, structure, plan exist but not progress/review; implement must inspect run 013 firsthand.

## The frontier the journal must capture (from the reads + memory)

- **Angular/faceted → high fidelity**: moai (@32 Strong form), sword (clean cruciform). Text→JSON's
  best case.
- **Thin/linear → angle-gated**: bow & arrow, sword taper, dancing-man limbs — 1-wide elements
  survive but foreshorten/fragment; the fixed 45° hero still under-sells, turntable rescues.
- **Smooth-organic → form loss**: heart (lobed teardrop + aortic loop gone), koi (S-curve + fins
  gone), mushroom cap (terraced), pineapple body (cubic). Palette/parts kept, *line* lost.
- **Scale is non-monotonic** (memory *sculpture-fidelity-non-monotonic-in-scale*): bigger scale ≠
  better; moai @48 *regressed below* @16 (model under-spends a large budget on coarse fills). And
  *low scale can improve pattern read* (pineapple lattice clearer @16 than @32 — bolder palette
  under a tighter budget). The triptychs are the visual proof.

## `design-learnings.md` shape

~1300 lines, append-only "Attempt log (newest last)" plus thematic `## ` sections (E-09/E-10/E-11
consolidations). The new **fidelity-vs-concept** section appends as a top-level `## ` near the end,
consistent with the E-11 staged-sculptor consolidation that already closes the file.

## Constraints / assumptions

- **Honesty AC**: the concept↔render *gaps* must be shown, not hidden (heart/koi/moai@48 are the
  honest failures — they belong in the package, captioned as such).
- **`npm test` green**: test = `scripts/validate-artifact.mjs` self-test + schema examples +
  `test:unit`. This ticket touches **docs + assets only — no source/schema** — so the suite should
  be unaffected; the AC is a regression guard, not new tests.
- Encoding the already-rendered frames (not re-running GL) keeps the work deterministic and offline.
