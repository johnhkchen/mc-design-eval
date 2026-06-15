# T-038-01 — Review: sculptural best-of curation

Handoff for a human reviewer. The terminal link of the E-13 sculpture arc (S-038) — gated on all 12
builds. A **curation + journaling** ticket: no source code, only derived committed assets + two doc
edits. Commit `cfd5663`.

## What changed

**Created — curated assets (the package for E-12):**
- `pr/assets/rotations/rock-<subject>-<seq>.mp4` ×12 — front-arc rock turntables (12 fps, 24 frames,
  `yuv420p`), ffmpeg-encoded from each run's already-rock-mode `turntable/` frames. 28–76 KB each.
- `pr/assets/frames/pair-<subject>-<seq>.png` ×8 — concept↔render side-by-side, common height 512.
- `pr/assets/frames/triptych-{moai,pineapple}-16-32-48.png` ×2 — render-only, scale ascending.
- `pr/assets/sculptures.md` — the captioned manifest (8 subjects grouped angular→thin→organic + 2
  triptychs) with a `## E-12 handoff` section.

**Modified:**
- `docs/knowledge/design-learnings.md` (+~55 lines) — new `## Fidelity-vs-concept frontier` section:
  frontier by form type, frontier by scale (the opposite-triptych finding), the image→3D framing.
- `pr/assets/rotations/README.md` (+~22 lines) — "Sculpture set" subsection indexing the 12 clips +
  their already-rock-mode provenance.

**Work artifacts:** `docs/active/work/T-038-01/{research,design,structure,plan,progress,review}.md`.

**Untouched (verified by `git status`):** no `src/`, `render/src/`, `scripts/`, `schema/`, or test
files. The render rig + encoder were *reused as-is*.

## Acceptance criteria

- **AC1 — curated sequence (8 subjects + 2 triptychs, each pair + rock turntable, captioned, stored
  for E-12):** ✅ `pr/assets/sculptures.md` + the 12 clips + 10 frames under `pr/assets/`. Clips
  committed; frames curated.
- **AC2 — `design-learnings.md` fidelity-vs-concept section (frontier by form type + scale, framed as
  the image→3D case):** ✅ appended, with per-build evidence + the non-monotonic-but-form-dependent
  scale law.
- **AC3 — explicit E-12 handoff (what's delivered + how it slots in):** ✅ `## E-12 handoff` in
  `sculptures.md` (F09 explosion, F12 breadth, the new scale beat, the image→3D turn) + honesty
  constraints.
- **AC4 — honest (gaps shown), `npm test` green:** ✅ heart/koi/moai@48 are *in* the package, captioned
  as failures; `npm test` **312/312** green.

## Test coverage

- **`npm test` = 312/312 green** — the regression gate (AC4). The suite is artifact-schema self-tests
  + unit tests; this ticket adds no executable code, so the suite is unaffected (confirmed).
- **No new unit tests** — correct: media + prose have nothing to unit-assert (consistent with the
  project's curation-is-integration stance). Coverage substitutes used instead:
  - per-clip `ffprobe` → 24 frames @ 12 fps verified;
  - per-frame `magick identify` → height-512 dimensions verified;
  - **firsthand visual inspection** of run 013 (the only build lacking a prior fidelity read) and both
    triptychs, recorded in `progress.md`.

## Notable finding (beyond the plan)

The two triptychs make **opposite** scale cases, confirmed by viewing both renders directly:
- **Moai (angular):** non-monotonic, peaks @32; **@48 regresses** to a near-featureless dark monolith.
- **Pineapple (organic):** **@48 is best** — the only scale with both a rounded body and a legible
  lattice.

So the prior "fidelity is non-monotonic in scale" sharpens to: **the sign of the scale effect is
form-type-dependent** (angular single-mass can waste a big budget; organic-textured converts it).
This is now the spine of the journal's scale subsection and a candidate memory update.

## Open concerns / limitations

1. **pineapple@48 (run 013) had no prior fidelity-read.md** (T-037-04 stopped after plan). I wrote an
   honest read firsthand (`progress.md` Step 3) rather than back-fill T-037-04's artifact — that
   ticket's Review remains its own to close. Low risk; the read is grounded in the actual render.
2. **Two category enums coexist** in the captions: the S-036 reads use `faithful/recognizable/loose`;
   the moai@32 read (run 003) uses `Weak/Competent/Strong/Exceptional`. The manifest reports each
   build's verdict *as authored* and labels which enum — not reconciled into one scale (out of scope;
   would mean re-judging). Flagged for a future normalization if E-04/E-05 want a single axis.
3. **Rock-only, no `spin-*`.** Deliberate (single-view reconstruction — don't parade the inferred
   back). If E-12 wants the flat-back honesty beat for sculptures, the spin variant is a one-command
   regen (documented in `sculptures.md`); none generated here.
4. **Frames carry no burned-in captions** — by design (E-12 owns typography, matching `sequence.md`).
   A reviewer expecting captioned frames should look to the doc tables, not the PNGs.
5. **mp4s in git** (~0.6 MB total) — consistent with the temple rocks already committed; acceptable.

## For the human reviewer

Highest-leverage read: `pr/assets/sculptures.md` (the manifest + handoff) and the new
`design-learnings.md` section. The visual claims are checkable against
`pr/assets/frames/triptych-*.png` and the rock clips. Nothing here blocks E-12; the package is
self-contained and the toolchain is untouched.
