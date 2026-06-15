# T-070-01 — full-building-showcase · Structure

The blueprint. This ticket ships **no source logic** — it is render + compose + document. So "structure" here
is the **set of artifacts produced**, the **commands/tools that produce them**, their **paths and formats**,
and the **ordering** (some artifacts feed others). No module boundaries or public interfaces change; the only
"interface" is the existing `render:orbit` CLI and ImageMagick, both used as-is.

## Files & artifacts — created / modified / untouched

### Created — committed assets

| Path | Format | Produced by | AC |
| ---- | ------ | ----------- | -- |
| `pr/assets/rotations/spin-building-e20.mp4` | mp4, 48 frames @ 12 fps, 768² | `render:orbit … --mp4` | #1 |
| `pr/assets/frames/building-turntable-front.png` | PNG 768² (45° / 3-4 hero) | curated from orbit out | #1 |
| `pr/assets/frames/building-turntable-right.png` | PNG 768² (135°) | curated from orbit out | #1 |
| `pr/assets/frames/building-turntable-back.png` | PNG 768² (225°) | curated from orbit out | #1 |
| `pr/assets/frames/building-turntable-left.png` | PNG 768² (315°) | curated from orbit out | #1 |
| `pr/assets/frames/beyond-facade-before-after.png` | PNG, 2-up (facade ∥ building) | ImageMagick `+append` | #3 |
| `pr/assets/beyond-facade.md` | markdown handoff | authored | #5 |

### Created — work artifacts (this dir)

`research.md` ✓, `design.md` ✓, `structure.md` (this), `plan.md`, `progress.md`, `review.md`.

### Modified

| Path | Change | AC |
| ---- | ------ | -- |
| `docs/knowledge/design-learnings.md` | **append** a terminal `## Beyond facade … (E-20)` section (~40 lines) | #4 |
| `pr/assets/rotations/README.md` | one-line index entry for `spin-building-e20.mp4` | #1 (house norm) |
| `.gitignore` | (only if needed) confirm `render/out/` stays ignored; commit curated frames explicitly | — |

### Untouched (zero regression surface)

`benchmarks/sculpture/building/best/artifact.json` (the build — read-only), `src/revise/*`,
`src/form/*`, `baml_src/judge.baml`, the schema, `render/src/orbit*.mjs` (used, not edited),
`pr/assets/sequence.md` (the Production contract — the handoff *proposes* a slot, does not edit the table),
`package.json`, every test. **`npm test` stays 786 green.**

## The turntable render — exact invocation (AC#1)

```
npm run render:orbit -- \
  --artifact benchmarks/sculpture/building/best/artifact.json \
  --frames 48 --start 45 --elevation 30 --size 768 \
  --mp4 --fps 12 \
  --out render/out/orbit/building-e20
```

- Writes 48 frames + `clip.mp4` into `render/out/orbit/building-e20/` (gitignored).
- `--start 45` ⇒ frame index `0` ≈ azimuth 45° (3/4 front hero); with 48 frames the 7.5°-spaced azimuths put
  side/back/side near indices 12/24/36. The four curated stills are the closest frames to **front 45°,
  right 135°, back 225°, left 315°** — picked after inspecting `onFrame` azimuth logs (the CLI prints each
  frame's azimuth).
- Then: copy `clip.mp4` → `pr/assets/rotations/spin-building-e20.mp4`; copy the four chosen frames →
  `pr/assets/frames/building-turntable-{front,right,back,left}.png`.
- Gate: `GL_AVAILABLE === true` (verified) and ffmpeg present (verified) — both checked in Research.

## The before/after composite — exact recipe (AC#3)

Inputs: `pr/assets/frames/spine-r4-hero-oneplane-014.png` (1080², facade hero, committed) ∥
`pr/assets/frames/building-turntable-front.png` (768², produced above).

```
# normalize both to height 1080 on a common background, label, append side-by-side
magick pr/assets/frames/spine-r4-hero-oneplane-014.png -resize x1080 \
  -gravity South -background '#101014' -splice 0x64 \
  -fill white -pointsize 40 -annotate +0+10 'FACADE — text→JSON ceiling' /tmp/bf-left.png
magick pr/assets/frames/building-turntable-front.png -resize x1080 \
  -gravity South -background '#101014' -splice 0x64 \
  -fill white -pointsize 40 -annotate +0+10 'FULL BUILDING — in the round' /tmp/bf-right.png
magick /tmp/bf-left.png /tmp/bf-right.png +smush 24 -background '#101014' \
  pr/assets/frames/beyond-facade-before-after.png
```

- `+smush 24` (or `+append` after padding) gives a 24-px gutter; `#101014` matches the desk's dark frame bg.
- Fallback if `+smush` unavailable: `magick … +append`. Exact annotation text may be tuned in Implement; the
  structure is two labeled, height-matched tiles, building on the right (the climb reads left→right).
- Output is a single committed PNG — the canonical `pair-*`-style handoff unit.

## The design-learnings section — shape (AC#4)

Append at EOF (after the E-21 section, line ~1874). Fixed house shape:

```
## Beyond facade — the whole structure, in the round (E-20) (S-070, T-070-01) · 2026-06-06

<2–3 para: the leap — text→JSON's ceiling was one grand face (temple-facade benchmark); the matured
 pipeline (TRELLIS bulk + E-19/E-21 clean materials + E-15 cage) produced a complete building in the round.>

| dimension | facade (text→JSON best) | full building (E-20) |
| --------- | ----------------------- | -------------------- |
| extent    | one face (a plane)      | 54×64×54, 4 sides + roof |
| blocks    | ~10k (run-014)          | 57,202 |
| palette   | …                       | 4 clean blocks (cobble/dark-oak-log/deepslate-tiles/stone-bricks) |
| verdict   | STRONG (facade, 3/3)    | weak — *as rendered by the 512² no-AA lens* (E-22) |

**The headline …** (the leap is completeness, not finish)
**Honest notes — where detail tops out …** (surgical-edit 1M-context scale limit; TRELLIS detail loss; the
  E-22 render-lens confound on the verdict)
**One sentence:** …
```

Numbers are sourced: blocks/dims/palette from the artifact (Research); verdict/IoU from
`surgical-standard.{md,json}`; facade STRONG from `sequence.md` F04.

## The E-12 handoff — shape (AC#5)

`pr/assets/beyond-facade.md`, mirroring `concept-materials.md`:

```
# Beyond facade — we broke facade-only (E-20 hero handoff)

**Beat:** one grand face → a complete building, in the round.
**Assets:** spin-building-e20.mp4 (⟳), beyond-facade-before-after.png, building-turntable-{4}.png
**Verdict chip (truth beside the chip):** weak — as rendered by the 512² no-AA lens; aliasing≠geometry (E-22).
  Scale chip: 54×64×54 · 57,202 blocks · 4 clean blocks.
**Where it slots:** a completeness/scale coda after the facade-hero spine — candidate F-slot in sequence.md,
  marked ⟳ (real building rotation). Do NOT inflate the verdict.
**Receipts:** surgical-standard.{md,json}; building/best/artifact.json; T-069-01 review.
```

## Ordering (dependencies between artifacts)

1. **Render turntable** (orbit CLI) → frames + clip. *Blocks 2, 3.*
2. **Curate** clip → rotations/; pick + copy 4 stills → frames/. *Blocks 3, 5.*
3. **Compose** before/after (needs the front still). *Blocks 5.*
4. **Append** design-learnings E-20 section (independent of render — can run anytime; do after so block counts
   are confirmed against the artifact).
5. **Author** `beyond-facade.md` handoff (references all assets above) + rotations README line.
6. **Verify** (`npm test`; asset existence/size checks) → `review.md`.

Each of 1–5 is an atomic commit; 6 is the final verification + review. If GL/ffmpeg were *unavailable* (they
are not), the fallback is to document the exact commands + cite `building-refined.png` (the committed 512²
still) as the interim hero — recorded here as the contingency, not the path taken.
