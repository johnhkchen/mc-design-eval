# T-034-01 · Plan — pr-production-desk

Ordered, independently-verifiable steps. Each step ends in a commit. AC map at the bottom.

## Step 1 — Golden-Gate design doc

Write `pr/production/goldengate-designdoc.md`: head-on front elevation of the Golden Gate Bridge as
a Minecraft-block facade — twin Art-Deco towers, stepped setbacks, the main suspension cables as
bold block catenaries, deck/portal between the towers. Palette: **International Orange** primary,
warm-stone/grey accents, bright silhouette (no dark outline → segments on black). Massing/proportion
section, palette section, bold-block ornament section (no figures/text/filigree — aligns with the
template hard-limits). ~target 48 blocks wide.

- **Verify:** file reads as a coherent facade doc; explicitly names "Golden Gate Bridge" + "not a
  temple"; palette stated. **Commit:** `docs(T-034-01): Golden-Gate end-frame design doc`.

## Step 2 — `endframe.mjs` driver + generate the F13 image

Write `pr/production/endframe.mjs` (Structure §endframe). Run it: `node pr/production/endframe.mjs`.
It shells `baml-concept.mts` (BAML prompt → Nano Banana flash), writes
`concepts/goldengate-base-flash.png`, then normalizes → `pr/assets/frames/concept-goldengate-vision.png`
at 1080×1080.

- **Verify:** stdout shows a real result record (ms>0, model `gemini-3.1-flash-image-preview`,
  promptChars>0); `concept-goldengate-vision.png` exists, `sips` reports 1080×1080; eyeball it reads
  as a Golden-Gate facade on black, International-Orange, no temple. If the live call fails, retry;
  if still failing, record the rendered prompt + repro and proceed with a labelled pending card
  (do **not** fabricate). **Commit:** `feat(T-034-01): generate Golden-Gate vision end-frame (F13)`
  (includes the driver + the committed PNG).

## Step 3 — `assemble.mjs` + build `rough-cut.mp4`

Write `pr/production/assemble.mjs` (Structure §assemble): the `FRAMES` plan (F01–F15 from
`sequence.md`), `ensureBaseImage`/`burn`/`clip`/`concatAll`. Build:
`node pr/production/assemble.mjs`.

- **Verify:** `rough-cut.mp4` exists; `ffprobe` duration ≈ 40s (±2s for CFR rounding); 1080×1080;
  plays; spot-check that F13 is the GG frame and concept frames carry the `[concept]` tag. Re-run is
  idempotent. **Commit:** `feat(T-034-01): assemble rough-cut.mp4 from the 15-frame sequence`.

## Step 4 — `spec.md`

Write `pr/production/spec.md` (Structure §spec): format/aspect/length, caption style (lift
script.md), pacing, music notes, overlay legend, 4:5 export recipe. Cite the real 40.0s and the
∈[30,60] check.

- **Verify:** a human could set up a timeline from it; aspect + length + caption rules unambiguous;
  no hype adjectives (matches locked voice). **Commit:** `docs(T-034-01): production spec`.

## Step 5 — `assembly.md`

Write `pr/production/assembly.md` (Structure §assembly): prereqs, one-command build, frame-resolution
table, the **precise shot-list** (the human-editor branch — id · in/out · source path · caption ·
overlay), GG repro, 4:5 export. Reference `rough-cut.mp4` as the produced artifact.

- **Verify:** both branches present (the built MP4 **and** the shot-list); every F01–F15 row has a
  concrete source; timings sum to 40s. **Commit:** `docs(T-034-01): assembly plan + shot-list`.

## Step 6 — `post.md`

Write `pr/production/post.md`: hook line, body (the climb + named null results F05/F07/F11 + the
pivot), CTA (verbatim from script.md CTA block — follow-for-method + comment bait, **no "try it"**),
3–5 hashtags, posting notes. On-thesis (sculptor, not 2-D→3-D tool); receipts-forward; no product
promise.

- **Verify:** hook ≤ ~1 line; body names ≥2 null results + the pivot; CTA has no product promise;
  hashtags 3–5; honest. **Commit:** `docs(T-034-01): LinkedIn post copy`.

## Step 7 — Wire the bundle (update upstream provenance)

Update `pr/assets/frames/README.md` (add `concept-goldengate-vision.png` row + Lanczos recipe) and
`pr/assets/sequence.md` (F13 asset-status to-generate → copied; honesty-ledger F13 line; note
F06/F14/F15 cards produced by the assembler). Light, surgical edits.

- **Verify:** provenance table includes the GG frame; sequence.md status table is current and the
  honesty ledger still holds. **Commit:** `docs(T-034-01): wire GG end-frame into asset bundle`.

## Step 8 — Review

Self-assess → `review.md` (files changed, test/verification coverage, open concerns, honesty
re-check). Stop after writing it (Lisa handles transitions).

---

## Testing / verification strategy

No unit-test harness fits doc + media deliverables; verification is **artifact inspection + tool
exit codes**, which the steps above bake in:

- **endframe.mjs** — success = a real Nano Banana result record + a 1080×1080 PNG that visually
  reads as the GG facade. The transport (`baml-concept.mts` → `nano-banana.mjs`) is already exercised
  by the committed `concept-*-C-flash.png` series, so the path is proven; only the new job/doc is new.
- **assemble.mjs** — success = `ffprobe` confirms a ~40s 1080×1080 playable MP4; idempotent re-run.
  Manual spot-check of caption/overlay/`[concept]` burns on 2–3 frames.
- **Docs** — the AC bar is "a human could produce/post from them": checked by the per-step verify
  criteria (unambiguous format, complete shot-list, no-product CTA).
- **Honesty** — a final pass against the `sequence.md`/`beats.md` honesty ledger: concept≠build,
  v1-sequencing, no invented metrics, same-model. Done in Step 6/7 and re-stated in `review.md`.

## Risks / mitigations

- **Live API failure** (Step 2) — retry; else document repro + labelled pending card, never
  fabricate. This is the only network-dependent step; everything else is deterministic local tooling.
- **ffmpeg/magick filter quirks** (drawtext font path, concat codec mismatch) — keep clips uniform
  (same codec/fps/pix_fmt) so `concat -c copy` works; fall back to re-encode concat if needed.
- **Scope creep on the cut** — the rough cut is explicitly *rough* (hard cuts, burned captions); the
  polished edit (motion graphics, licensed music, xfades) is the documented human step.

## AC coverage map

| AC | Steps |
|---|---|
| spec/assembly/post complete | 4, 5, 6 |
| rough cut (mp4) OR shot-list | 3 (mp4) **and** 5 (shot-list) |
| GG vision end-frame generated + placed | 1, 2 (generate), 3 (placed as F13), 7 (wired) |
| honest & on-thesis | 6 (post), 7 (ledger), 8 (review re-check) |
