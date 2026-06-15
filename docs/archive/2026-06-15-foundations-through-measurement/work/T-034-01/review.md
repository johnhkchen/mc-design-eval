# T-034-01 · Review — pr-production-desk

Handoff for a human reviewer. The terminal link of the E-12 evolution-showcase chain: an output
spec, an assembly plan, a real rough cut, the LinkedIn post, and a freshly-generated Golden-Gate
vision end-frame.

## What shipped

### New deliverables — `pr/production/`
- **`spec.md`** — format (1:1 1080×1080 master + 4:5 letterbox recipe), length (40.0s ∈ [30,60]),
  caption style (lifted from the locked `script.md` voice), pacing, overlay legend, music brief +
  beat-sync map. No licensed track shipped (out of scope); the cut is silent by design.
- **`assembly.md`** — both AC branches: **(A)** one-command rough cut + frame-resolution table +
  known simplifications, and **(B)** the precise human shot-list with mm:ss in/out timings. Plus the
  GG-regen command and the 4:5 export recipe.
- **`post.md`** — hook, body (the climb + the three named null results + the pivot), CTA verbatim
  from `script.md` (follow-for-method + comment bait, **no "try it"**), 3–5 hashtags, posting notes,
  honesty self-check.
- **`goldengate-designdoc.md`** — the design doc fed to the concept tooling; explicitly "Golden Gate
  Bridge, not a temple," International-Orange silhouette.
- **`endframe.mjs`** — drives the existing `baml-concept.mts` → Nano Banana (flash) path with the GG
  doc + an `attached` override of the template's "temple" noun; normalizes to a committed 1080×1080.
- **`assemble.mjs`** — resolves F01–F15 → images (committed frames + concept montages + synthesized
  cards + the GG end-frame), burns caption / overlay / `[concept]`, concats → `rough-cut.mp4`.
- **`rough-cut.mp4`** — the deliverable: **40.00s**, 1:1 1080×1080, H.264, 1.5 MB, captions burned.

### New committed asset
- **`pr/assets/frames/concept-goldengate-vision.png`** — the F13 vision end-frame (1080×1080),
  generated live this session (9.5s, 6,812-char prompt, `gemini-3.1-flash-image-preview`).

### Modified (provenance wiring)
- `pr/assets/frames/README.md` — GG frame provenance row + regen recipe.
- `pr/assets/sequence.md` — F13 to-generate → copied; F06/F07/F14/F15 marked assembler-synthesized;
  honesty-ledger F13 line updated.

### Work artifacts
`research.md`, `design.md`, `structure.md`, `plan.md`, `progress.md`, this `review.md`.

### Commits (on `main`, the Lisa RDSPI pattern)
`feat: generate Golden-Gate vision end-frame` · `feat: assemble rough-cut.mp4` · `docs: production
spec` · `docs: assembly plan + shot-list` · `docs: LinkedIn post copy` · `docs: wire GG end-frame
into asset bundle`.

## Acceptance criteria — status

| AC | Status | Evidence |
|---|:--:|---|
| `spec.md`/`assembly.md`/`post.md` exist & complete | ✅ | all three present; a human can set a timeline + post from them; assembly carries both the build command and a precise shot-list |
| Rough cut (mp4) **OR** shot-list | ✅✅ | **both** — `rough-cut.mp4` (40.00s, verified by `ffprobe`) **and** the §B shot-list |
| Golden-Gate vision end-frame generated & placed as closing shot | ✅ | live Nano-Banana generation → `concept-goldengate-vision.png`; placed as F13 in the cut (verified in extracted frame) — ties the "a perfect scan still needs a sculptor" thesis |
| Honest & on-thesis | ✅ | climb + 3 null results in the post; concepts tagged `[concept]`; rotation the only real-build claim; GG = "where it's heading," not shipped; no product promise |

## Verification performed

- **Generation:** `endframe.mjs` printed a real result record; output visually inspected — reads as
  the Golden Gate Bridge (twin orange Art-Deco towers, block-catenary cables, central portal) on
  black, not a temple.
- **Rough cut:** `ffprobe` confirms 40.00s / 1080×1080; extracted frames at F01/F04/F08/F13 confirm
  caption band + overlay chip + amber `[concept]` tag all burn legibly. Re-run is idempotent.
- **Numbers:** every on-screen/post figure traces to `pr/assets/sequence.md`'s receipts (which trace
  to run `summary.json` / `ls` / `wc -l`). Nothing invented.

## Open concerns / known limitations

1. **F10 is still a placeholder, not the spin.** `rotation-placeholder-002.png` is a head-on render;
   the real 360° turntable (S-032 `renderOrbit`, gitignored `render/out/orbit/<id>/`) must be swapped
   in before this is the *strongest* possible cut. Honest as-is per v1-sequencing (it's a real
   build), but it's the one frame whose claim ("rotating") the asset doesn't yet fully show.
2. **F01 morph & F06 grid are rough-cut substitutions.** A still cut can't morph or show a live
   thumbnail grid; both are documented as human-editor restorations in `assembly.md`. The rough cut
   is honest but not the final visual the storyboard imagines for these two frames.
3. **The "temple" noun in the BAML template.** The rendered GG prompt still literally contains
   "temple facade" once; the design doc + `attached` override dominate and the output is correct, but
   a future cleanup could parameterize the subject noun in `FacadeConceptPrompt` if non-temple
   concepts become common. Not blocking — output verified correct.
4. **Generation is non-deterministic.** Re-running `endframe.mjs` yields a different concept; the
   committed PNG is the chosen take. The raw is gitignored, so the committed normalized frame is the
   record of truth.
5. **No audio / no licensed music** — out of scope by design; `spec.md` gives the editor a brief.
6. **Burn-font glyphs** are ASCII-sanitized in the rough cut (`-> up x .`); the rich glyphs
   (`→ ↑ ✕ ·`) are documented for the final and preserved in `spec.md`/`sequence.md`.

## Flag for human attention

Nothing blocking. Before posting: **(a)** swap in the real S-032 rotation for F10 if available;
**(b)** decide 1:1 vs 4:5 for the LinkedIn upload (recipe in `spec.md`); **(c)** optionally add the
music bed + F01 morph in a real editor. The rough cut + the three docs are post-ready as a v1.
