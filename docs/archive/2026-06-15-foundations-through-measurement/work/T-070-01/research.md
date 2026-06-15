# T-070-01 — full-building-showcase · Research

Epic **E-20**, terminal. The job is not new pipeline code — it is to make the *leap already achieved* legible
and hand it to the E-12 showcase: text→JSON could only ever produce **one grand face** (a temple facade); the
matured pipeline (TRELLIS bulk + E-19/E-21 clean materials + E-15 surgical cage) produced a **whole structure,
in the round** — all four sides and a roof. This artifact maps what exists, what is renderable here, and the
honest tension the showcase must carry.

## What the dependency (T-069-01) actually produced — read this first

The ticket Context describes the building as "refined to **Strong+**, in the round." The dependency's measured
reality (`docs/active/work/T-069-01/review.md`, `benchmarks/sculpture/surgical-standard.md`) is **it topped out
at `weak`** and the surgical loop could not move it. Two compounding causes, both measured:

1. **The E-15 per-region LLM block-edit route does not scale to a 57k-block build.** Every one of the 4 region
   proposals failed with a "prompt too long" BamlError (~1.25M tokens vs the 1M limit) — a high-res region's
   placement list overflows the model context. No proposal → nothing to accept → the cage held the build
   **byte-identical** to `building/best`. (Memory: `surgical-edit-path-scale-limit`.)
2. **The TRELLIS GLB form target (T-067) had already dropped the defining detail** (arch ring, gable ridge,
   slit windows), so even a working editor had no per-region signal toward them.

Crucially, the `weak` verdict is **confounded by the render lens**: the E-22 finding
(`render-aliasing-not-material-speckle`) shows the scale-64 grey "noise" the judge complains about is
**texture-minification aliasing in the 512² no-AA render**, not build geometry or palette speckle (T-068
measured off-palette 0, speckle ~0; E-21 restored the 4 near-tone materials). So the honest reading is "**weak
as rendered by the current lens**," and E-22 is the open epic that fixes the lens + moves the gate to reference
resemblance.

**Implication for this ticket.** The showcase's claim is the **scale/completeness leap** (facade → whole
building in the round), which is true and legible *independent of the judge verdict*. The "Strong+" framing in
the Context is aspirational; this ticket must record the **actual verdict honestly** (AC#2) and state the
**honest residual** (AC#4: "where detail still tops out"). The leap is real; the finish ceiling is the residual.

## The build artifact

- Path: `benchmarks/sculpture/building/best/artifact.json` (7.67 MB, committed).
- `metadata.trial_id = "building-e20-scale-64"`, `prompting_method_id = "glb-voxel.v1"`, model `claude-opus-4-8`.
- **57,202 placements**; schema_version present; `palette.manifest` = 4 blocks:
  `cobblestone`, `dark_oak_log`, `deepslate_tiles`, `stone_bricks` (a disciplined, E-19/E-21-clean palette).
- Placements are `{op:"voxel", pos:[x,y,z], block}`. **Bounds** min `[-27,0,-27]` → max `[26,63,26]`,
  i.e. **dims 54 (W) × 64 (H) × 54 (D)**, footprint centered on the origin, sitting on y=0. A genuine
  free-standing structure — not a single plane.
- The subject is a **stone gatehouse** (the GLB is `glb/stone-gatehouse.glb`, gitignored). Note: the judge
  prompt frames a *temple facade*; the subject is a gatehouse at 3/4 — a recorded judge residual (T-069 note 4).

## The turntable rig (AC#1)

`render/src/orbit-cli.mjs` (`npm run render:orbit`) — already built (T-032). Takes an artifact (or a dir
containing `artifact.json`), sweeps azimuth 0→360° at fixed elevation/distance, writes frames to the
gitignored `render/out/orbit/<trial_id>/`, and **optionally encodes a clip** (`--gif`/`--mp4`) via
`maybeEncodeClip` (`render/src/orbit-clip.mjs`) when ffmpeg is on PATH.

- Exports it composes: `renderOrbit`, `oscillateAzimuths`, `defaultOrbitDir` (`render/src/orbit.mjs`),
  `maybeEncodeClip` (`orbit-clip.mjs`). There is also `orbit-chain.mjs` (multi-subject montage).
- Flags relevant here: `--frames N`, `--start DEG`, `--elevation DEG`, `--fov DEG`, `--size N`, `--mp4`,
  `--fps N`. Default size 512, elevation 35, fov 75.
- **Environment is capable:** `GL_AVAILABLE === true`, `ffmpeg` at `/opt/homebrew/bin/ffmpeg`. So a real 360
  turntable **can be produced in this session** (the dependency's T-069 work was a metered loop/judge run; this
  ticket's turntable is GL-only, no model calls).
- Mirrors `cli.mjs`: gate on GL, render, then `process.exit(0)` (prismarine-viewer holds worker threads open).
- Prior turntables live in `pr/assets/rotations/` as `spin-<subject>-<seq>.mp4` / `rock-<subject>-<seq>.mp4`
  (e.g. `spin-taj-015.mp4`, `spin-horyuji-019.mp4`). A **building** spin is the new asset — "all sides + roof,
  in the round" is the whole point, so a full 360 `spin-` clip (not a front-arc `rock-`) is the right form.

## The judge verdict (AC#2)

The categorical judge (`baml_src/judge.baml`: Weak/Competent/Strong/Exceptional) verdict is **already recorded**
by the dependency: **`weak`** at both rounds, whole-object form-IoU 0.929 flat (`surgical-standard.{md,json}`,
`benchmarks/sculpture/building/round-{0,1}/summary.json`). This ticket **records/cites** that verdict (it is the
final verdict — the loop made zero accepted edits, so `best` *is* the final build); re-running the metered judge
is unnecessary and the dependency already ran it 3-sample × 2 rounds. The honest framing (weak-as-rendered, the
E-22 lens confound) travels with it.

## The before/after vs Phase-1 facades (AC#3)

"One grand face → a complete building." The Phase-1 facades are the **temple-facade** benchmark
(`benchmarks/temple-facade/runs/…`, gitignored). The hero facade frame is **already committed** at
`pr/assets/frames/spine-r4-hero-oneplane-014.png` (1080², the run-014 `vRefRevise` Strong facade — "one
connected plane," per `pr/assets/sequence.md` F04). The "after" is a building turntable frame (a 3/4 angle that
shows depth — sides + roof). The deliverable is a **composed before/after** image in `pr/assets/frames/`.

- **Compositing tools are present:** ImageMagick (`magick`/`convert`/`montage`) and ffmpeg. No bespoke compose
  script exists (`grep` found none); a one-liner `magick … +append` / `montage` is the house pattern for these
  paired frames (cf. committed `pair-*.png`, `triptych-*.png`).
- Aspect note: the facade hero is 1080²; orbit frames default 512². To compose cleanly, render the building
  frame larger (`--size 1080`) or normalize with ImageMagick before appending.

## The design-learnings ledger (AC#4)

`docs/knowledge/design-learnings.md` (1,874 lines). Each epic closes with a titled section following a fixed
shape: `## <Title> (E-NN) — <subtitle> (S-…, T-…) · <date>`, prose + a results table + a **headline**, **honest
notes / where it didn't help**, and a **One sentence:** capstone. The most recent terminal section is **E-21**
(line 1805, concept-grounded materials). E-20 currently has *scale* sections (E-13 frontier, etc.) but **no
"beyond-facade" capstone**. This ticket appends one: what the matured pipeline enabled (a whole structure),
the build's scale (54×64×54, 57,202 blocks, 4-block palette), the standard reached (**weak as rendered**, the
E-22 lens caveat), and the honest residual (detail tops out — the surgical-edit scale limit + the TRELLIS detail
loss, both measured in T-069).

## The E-12 handoff (AC#5)

`pr/assets/` is the **Assets desk** (`pr/assets/README.md`): it curates the ordered evolution-frame sequence
the **Production desk** (`pr/production/assemble.mjs`) assembles into the video. Per-epic handoff docs already
exist as `pr/assets/<topic>.md` (`sculptures.md`, `concept-materials.md`, `value-true.md`, `glb-grounded.md`,
`form-revise.md`, …). The canonical cut is `pr/assets/sequence.md` (F01–F15, the ape→man climb; the breadth
beat ◇, rotations ⟳). This ticket adds a `pr/assets/beyond-facade.md` handoff: the **hero "we broke
facade-only" beat** (facade → whole building in the round), the assets it ships (building spin clip, the
before/after frame, curated turntable frames), the **honest verdict chip** (weak-as-rendered + the E-22 lens
note so nothing is inflated — the sequence.md norm is "show the truth beside the chip"), and where it slots
(a completeness/scale beat after the facade hero, or a new E-20 coda).

## Constraints / assumptions

- **No edits to the build, loop, target, judge, or schema.** This is a *showcase* ticket: render + compose +
  document. Zero regression surface beyond docs/assets. `npm test` must stay green (currently 786).
- **Honesty over the brief.** The "Strong+" framing is not what was measured; record `weak` (lens-confounded)
  and the residual. Inflating the verdict would violate the project's own anti-inflation norm (`sequence.md`).
- **Gitignore discipline (T-068):** the repo is already large; commit the *clip* + a few *curated frames* +
  docs, not the full gitignored frame dump or a duplicate artifact.
- **The leap is scale/completeness, not finish.** That is the true, defensible claim and the one the showcase
  should lead with; the finish ceiling is the residual, not the headline.
