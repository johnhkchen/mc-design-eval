# T-016-01 · Structure — file-level changes

The blueprint. What is created, modified, deleted — and the exact shape of each change.

## Modified

### `benchmarks/temple-facade/conceptart.mjs` (code)
Two surgical edits, no structural change to the script:

1. **Default literal (line 71).**
   - From: `const variant = arg("variant", "A");`
   - To:   `const variant = arg("variant", "C");`
   - Effect: omitting `--variant` now selects the C (render-only) cell. `VARIANTS` map, `arg`,
     `runCell`, loop, and output-path logic are all untouched — C is already a fully-wired entry.

2. **Header comment (lines 1–13), two touch-ups so the file's own docs match the new default:**
   - Update the usage examples so the first/no-flag example reflects C-as-default (e.g. show
     `node …/conceptart.mjs --ref=taj   # all refs default to C (render-only)` or add a
     "# default" note), and keep the explicit `--variant A/B/C` examples for the other variants.
   - Annotate the variant list (the `A/B/C/base` enumeration) to mark **C** as the committed default
     and one clause on why (render-only ⇒ reliable black background ⇒ cleanly segmentable; cannot
     copy the reference). This is the inline record of the lock; no `DEFAULT_VARIANT` constant is
     introduced (see design.md Decision 1).

No other line changes. `TARGET_BLOCKS = 48`, `model` default `flash`, `REFS`, and the variant
closures stay exactly as-is.

### `docs/knowledge/design-learnings.md` (journal)
Append one new section after the existing
`## Stage-1 concept-art · input-variant matrix (E-09, T-015-01) · 2026-06-05` block (currently the
last section, starting line 885). New heading:

```
## Stage-1 concept-art · default variant LOCKED (E-09, T-016-01) · 2026-06-05
```

Body shape (kept tight, ~20–30 lines):
- **Lock:** `conceptart.mjs` now defaults to **C (render-only)** when `--variant` is omitted; states
  why in one sentence (segmentation reliability + no reference-copying), linking back to the
  T-015-01 matrix evidence.
- **All-reference confirmation table / list:** one line per reference —
  `taj / horyuji / chapelle / arc / mausoleum` — each marked **holds** or **weakened + why**, graded
  on background / fidelity / inspiration / segmentation against the matrix baseline.
- **Net:** whether the lock is safe to keep (expected: holds 5/5) or which cell to watch.

## Created

### `benchmarks/temple-facade/concepts/<ref>-C-flash.png` × 5 (regenerated)
`taj-C-flash.png`, `horyuji-C-flash.png`, `chapelle-C-flash.png`, `arc-C-flash.png`,
`mausoleum-C-flash.png`. These filenames already exist from T-015-01; the confirmation run overwrites
them in place with fresh draws produced **via the new default path** (no `--variant`). Bytes differ
(non-deterministic generation); the profile must match the matrix (black bg, doc palette).

### RDSPI work artifacts under `docs/active/work/T-016-01/`
`research.md` (done), `design.md` (done), `structure.md` (this file), `plan.md`, `progress.md`,
`review.md`.

## Deleted
None.

## Not touched (explicit boundaries)
- `baml_src/conceptart.baml`, `baml_client/**` — no prompt change ⇒ no `npm run baml:gen`.
- `src/nano-banana.mjs`, `benchmarks/temple-facade/baml-concept.mts` — generation mechanics unchanged.
- `schema/**`, `src/**`, `scripts/**` — outside scope; `npm test` must stay green as a guard.
- Variants A / B / base and the `taj-A-flash-seg.png` overlay — preserved for matrix reproducibility
  and S-017 robustness work.

## Ordering of changes (where it matters)
1. **Smoke first, then lock?** — Order is: make the code edit (default flip + comment) first, then run
   the confirmation *with no `--variant`*. The confirmation must exercise the edited default, so the
   edit precedes the run. (Running before the edit would silently use the old default A and prove
   nothing.)
2. Smoke-gate one ref (taj) before the remaining four (fail fast on env/wiring).
3. Journal entry is written **after** all five are viewed (it records the per-ref verdicts).
4. `npm test` last, as the collateral-damage guard, then commit.

## Public interface impact
- CLI contract: `--variant` flag still accepts `A|B|C|base`; only the *omitted-flag* behavior changes
  (A→C). Documented in the header comment. No caller in the repo relies on the old omitted-flag
  default (the matrix scripts pass explicit `--variant`), so this is a safe behavioral change.
