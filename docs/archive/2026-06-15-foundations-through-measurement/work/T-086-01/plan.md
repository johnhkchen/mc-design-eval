# T-086-01 — value-true-block-selection — Plan

Ordered, independently verifiable steps. Each step ends `npm test`-green and is committed
atomically. AC mapping at the end.

## Step 1 — `gridFromPixels` cellMeans opt

- Edit `src/color/image-grid.mjs`: in the cell loop, when `opts.cellMeans` is true, build a
  parallel `m×n` rows array — filled cell → its foreground mean `[r,g,b]` (floats), air → null —
  and attach it to the result as `cellMeans`. Default path unchanged (no key added when off).
  One-line module-header note.
- Tests in `src/color/image-grid.test.mjs`: (a) default result has no `cellMeans` key; (b) with
  the opt on a synthetic 2-cell image, the filled cell's mean matches the constructed foreground
  color and the air cell is null.
- Verify: `npm run test:unit` green.
- Commit: `feat(T-086-01): image-grid optional per-cell foreground means (cellMeans)`.

## Step 2 — pure core: families, metric, sampler, decision

- Create `src/color/value-select.mjs` per structure.md: constants (`VALUE_SELECT_SCHEMA`,
  `CHROMA_WEIGHT=2`, `SWITCH_MARGIN=0.15`, `MIN_CELLS=24`, `SAMPLE_GRID_N=96`), `familyOf`,
  `isExcludedCandidate`, `familyCandidates` (memoized table), `weightedDeltaE`,
  `estimateBorderColor`, `sampleRoleSwatches`, `selectValueTrueBlock`, `selectValueTrueMap`.
  Selection = `nearestFlat` with the weighted metric (reuse, no new engine math); reported ΔE =
  true ΔE76 + {dL,da,db} components for both named and chosen.
- Create `src/color/value-select.test.mjs`: the 7 test groups from structure.md (family
  classification + precedence; exclusions; candidates; metric; border estimate; sampler;
  decision matrix incl. floor/margin/not-in-table). Use the real committed table where it makes
  tests stronger (family membership), synthetic palettes for the decision matrix.
- Verify: `npm run test:unit` green.
- Commit: `feat(T-086-01): value-true block selection core (families + chroma-weighted pick)`.

## Step 3 — runner, npm script, gitignore

- Create `benchmarks/sculpture/value-select.mjs` per structure.md (§1 sample → §2 select → §3
  cottage substitution proof with best-effort GL → §4 record + md; `--offline` assert mode).
- `package.json`: add `value:select`. `.gitignore`: add the `value-select/**/*.png` block.
- Verify (no live run yet): `node --check` on the runner; `npm test` green.
- Commit: `feat(T-086-01): value:select runner (concept swatch → per-role value-true map)`.

## Step 4 — live cottage run + committed record

- `npm run value:select` — expect: plaster row switched off `white_terracotta` to a truer cream
  (design prediction: `sandstone`; the RUN's numbers are the record), base stone likely switches
  (predicted `tuff`), planks/log roles keep, cobblestone/bricks keep on thin-sample. Renders are
  best-effort; a GL failure is a recorded gap, not a blocker.
- Inspect `value-select/cottage.{json,md}`, the recolored `cottage/artifact.json`, and (if GL
  cooperated) the front before/after PNGs — the pink→cream shift should be visible.
- Verify: `npm run value:select -- --offline` exits 0; `npm test` green.
- Commit: `feat(T-086-01): cottage value-true selection record — plaster pink→cream` (record +
  artifact + md; PNGs stay local per .gitignore).

## Step 5 — review artifact + ticket hygiene

- `progress.md` kept current throughout (deviations documented as they happen).
- Write `review.md` (changes, coverage, open concerns); do NOT touch ticket frontmatter.

## Testing strategy

- **Unit (pure, `npm run test:unit`):** all selection logic — families, exclusions, metric,
  border estimate, sampler, switch policy — plus the image-grid extension. No GL, no network,
  no fixtures beyond synthetic buffers and the committed Lab table.
- **Integration (manual, recorded):** the live `value:select` run on the cottage is the
  integration test; its committed JSON record is the evidence, `--offline` re-asserts it
  deterministically forever after (mirrors `spray:paint --offline`).
- **Regression:** full `npm test` after every step (980+ existing tests; the image-grid change
  is opt-in so existing consumers are provably unaffected by its default-off path).

## Risks / contingencies

- **GL unavailable at step 4:** record the render gap (spray-paint precedent); the AC's
  "visible in a re-render" is then satisfied by re-running renders when GL is available — note
  it in review.md as an open concern. The numeric before/after ΔE is recorded regardless.
- **Live numbers differ from design predictions** (e.g. a different sandstone wins): fine — the
  engine's choice with the committed constants IS the result; update the record/md honestly.
  Only a no-switch on plaster would breach the AC; design showed a 21% margin, well clear of
  the 15% threshold.
- **Sibling collision:** T-085-01 edits `spray-paint.mjs` + `face-paint`/`structural-read`
  territory; this ticket touches none of those. Shared file risk ~0 (`package.json` scripts
  block + `.gitignore` are append-only edits; merge conflicts there are trivial).

## AC mapping

- AC1 (value-true selection per role, E-14 engine, pure, unit-tested) → Steps 1–2.
- AC2 (family-bounded, no full-table snap; per-role chosen block + value-ΔE recorded) → Steps
  2–4 (familyCandidates + the record's rows).
- AC3 (cottage: plaster → truer cream, ΔE before/after, re-render) → Step 4.
- AC4 (`npm test` green) → every step.
