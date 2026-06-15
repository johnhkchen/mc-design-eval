# T-034-01 · Structure — pr-production-desk

The blueprint: files created/modified, the assembler's internal shape, interfaces, ordering. Not
code — the shape of the code.

## File ledger

### Created — deliverables (`pr/production/`)

| File | Kind | Purpose |
|---|---|---|
| `pr/production/spec.md` | doc | format/aspect/length, caption style, pacing, music notes |
| `pr/production/assembly.md` | doc | build steps + the precise human shot-list + repro commands |
| `pr/production/post.md` | doc | LinkedIn post copy (hook, body, CTA, hashtags) |
| `pr/production/goldengate-designdoc.md` | doc | design doc fed to `baml-concept.mts` for the GG end-frame |
| `pr/production/endframe.mjs` | code | thin driver: build the GG job, shell `baml-concept.mts`, normalize → frames/ |
| `pr/production/assemble.mjs` | code | resolve F01–F15 → images, burn captions, concat → `rough-cut.mp4` |
| `pr/production/rough-cut.mp4` | binary | the rough cut (build output, **committed** — small, self-contained) |

### Created — committed asset (`pr/assets/frames/`)

| File | Source | Note |
|---|---|---|
| `concept-goldengate-vision.png` | `concepts/goldengate-base-flash.png` (gitignored) → normalized 1080×1080 | **`[concept]`** F13 end-frame |

### Created — work artifacts (`docs/active/work/T-034-01/`)

`research.md` ✓, `design.md` ✓, `structure.md` (this), `plan.md`, `progress.md`, `review.md`.

### Modified

- `pr/assets/frames/README.md` — add the `concept-goldengate-vision.png` provenance row + recipe.
- `pr/assets/sequence.md` — flip F13 asset-status from **to-generate** → copied, and (optionally)
  the F06/F14/F15 cards from to-generate → produced-by-assembler. (Light touch: status table +
  honesty-ledger F13 line.)
- *(No source under `src/` or `benchmarks/` is modified — we only **invoke** existing tooling.)*

### Not touched

`baml-concept.mts`, `conceptart.mjs`, `nano-banana.mjs`, `conceptart.baml` — reused as-is. No
ticket-frontmatter edits (Lisa owns phase/status).

---

## `pr/production/endframe.mjs` — internal shape

A single-purpose driver (~50 lines), mirroring `conceptart.mjs`'s `runCell()`:

- `JOB` — the stdin payload for `baml-concept.mts`:
  `{ designDocPath: "pr/production/goldengate-designdoc.md", images: [], targetBlocks: 48,
     model: "flash", outPath: "benchmarks/temple-facade/concepts/goldengate-base-flash.png",
     attached: GG_ATTACHED }`.
  `images: []` → the **base** variant (no reference image; we have no GG render to refine). BAML's
  `{{attached}}` carries the bridge-specific framing.
- `GG_ATTACHED` — a const string: "No photo is attached — design purely from the document above. The
  subject is the **Golden Gate Bridge**, NOT a temple: realize the document's bridge massing
  (twin towers + main cables) and its International-Orange palette; ignore any generic 'temple'
  phrasing in the instructions above." (Explicitly overrides the template's temple noun.)
- `runCell(job)` — `spawn("npx", ["tsx", "benchmarks/temple-facade/baml-concept.mts"], …)`, pipe
  `JSON.stringify(job)` to stdin, parse the stdout result record. Same contract Research §3 maps.
- After success: `magick <outPath> -filter Lanczos -resize 1080x1080
  pr/assets/frames/concept-goldengate-vision.png` (continuous-tone → Lanczos, per the asset desk
  recipe). If the generated image isn't square, center-crop first (same as the mausoleum case).
- Prints the result record (ms, model, promptChars) + the normalized path. Exits non-zero on
  failure so the operator sees it (no silent fake).
- **Invocation:** `node pr/production/endframe.mjs` (loads `.env` via `nano-banana.mjs`).

## `pr/production/assemble.mjs` — internal shape

A self-contained ffmpeg orchestrator (~150 lines). No new deps; shells `ffmpeg`/`magick`.

### Data: the frame plan (single source, derived from `sequence.md`)

A `FRAMES` array, one entry per F01–F15:
```
{ id, dur,                 // from storyboard
  caption,                 // script.md caption (burned, bottom third)
  overlay,                 // score chip / number (burned, top-left)
  concept: bool,           // → amber [concept] tag top-right
  image: { kind, ... } }   // how to obtain the 1080×1080 base image
```
`image.kind` ∈:
- `file` → a path in `pr/assets/frames/` (F02/F03/F04, F05/F11 reuse 014, F08, F10 placeholder, F13
  GG vision).
- `montage` → 5-up grid of the committed concept frames (F09 wall).
- `card` → solid-canvas text card synthesized via `magick` (F01 gray box, F06 receipts grid, F14
  thesis, F15 CTA). Each card spec carries its bg color + lines.

### Pipeline (functions)

1. `ensureBaseImage(frame, tmpdir)` → returns a 1080×1080 PNG path. `file`→ copy/verify; `montage`→
   `magick montage … -tile 3x2 -geometry +N+N` then pad to square; `card`→ `magick -size 1080x1080
   xc:<bg> -gravity … -annotate` per line.
2. `burn(baseImg, frame, tmpdir)` → `magick`/ffmpeg `drawtext`: caption (white, bottom), overlay
   chip (top-left box), `[concept]` amber tag (top-right) when `frame.concept`. Output a burned PNG.
3. `clip(burnedImg, dur, tmpdir)` → `ffmpeg -loop 1 -i img -t dur -r 30 -pix_fmt yuv420p
   -vf scale=1080:1080 clip_NN.mp4` (silent, CFR 30).
4. `concatAll(clips)` → write `concat.txt`, `ffmpeg -f concat -safe 0 -i concat.txt -c copy …` (or
   re-encode if codecs differ) → `pr/production/rough-cut.mp4`.
5. `main()` — mkdtemp, loop frames through 1–3, then 4; log per-frame line; print final duration +
   path. Graceful: a missing optional frame (e.g. GG not yet generated) → a labelled "pending" card,
   logged, never a crash (keeps the cut runnable; the AC's GG frame is generated in its own step).

### Interfaces / boundaries

- **Reads:** `pr/assets/frames/*.png` only (the self-contained bundle) — never gitignored
  `benchmarks/runs|concepts/` paths.
- **Writes:** a temp dir (auto-cleaned) + `pr/production/rough-cut.mp4`.
- **No imports from `src/`** — pure shell-out; keeps the desk decoupled from the harness.
- **Deterministic** given the frames (no `Date.now()`/random in output).

## Document structure (the three .md deliverables)

- **`spec.md`** — §Format (1:1 1080×1080 master; 4:5 letterbox recipe), §Length (40s, ∈[30,60]),
  §Caption style (lifts script.md voice rules), §Pacing (hold hook+payoffs, 1.5s trust flashes),
  §Music (mood/tempo brief + beat-sync map; no licensed track shipped), §Overlay legend.
- **`assembly.md`** — §Prereqs (ffmpeg/magick), §One-command build (`node assemble.mjs`),
  §Frame-resolution table (F01–F15 → source), §Precise shot-list (id · in/out · source · caption ·
  overlay — the human-editor branch), §GG end-frame repro (`node endframe.mjs`), §4:5 export recipe.
- **`post.md`** — §Hook line, §Body (the climb + the named null results + the pivot), §CTA (from
  script.md CTA block), §Hashtags, §Posting notes (square video, captions-on, first-comment link).

## Ordering (why this sequence)

GG design doc → `endframe.mjs` (generate the F13 image) → `assemble.mjs` (needs F13 present) →
docs reference the realized files. The three .md docs can be drafted in parallel but are finalized
after the build confirms real timings/paths. Detailed step order in `plan.md`.
