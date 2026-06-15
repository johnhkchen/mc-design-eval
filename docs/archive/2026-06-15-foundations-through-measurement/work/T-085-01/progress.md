# T-085-01 zone-fill-dominant — Progress

All plan steps complete. Three commits, as planned.

## Completed

- **Step 1–2 (Commit `921b53e`)** — `src/view/zone-fill.mjs` (pure: `zoneFill`, `surfaceZoneHistogram`,
  `FILL_FACES`; memoized run-flood) + `src/view/zone-fill.test.mjs` (9 tests on the synthetic two-storey
  hut, including the three AC-named behaviors). All tests passed first run; full suite green.
- **Step 3–4 (Commit `d0041b4`)** — `benchmarks/sculpture/spray-paint.mjs` rewired:
  `ZONE_MATERIALS` → `ZONE_POLICY {dominant, preserve, splat}` + `LEGACY_ZONE_MATERIALS` (baseline replay
  only); §0c base coat (`zoneFill` → `based`/`occBased`); §1/§2/§4/§5 re-pointed at the base-coated build;
  §2b adds the splat-only baseline → `zones.coverage.splatOnly`; record gains `fill{}` +
  `zones.coverage{splatOnly, zoneFilled}`; `renderMd` zone-fill section; `--offline` asserts
  zoneFilled.upper > splatOnly.upper. `stripOffZonePlaster` now takes the global manifest set (the
  secondary-only splat sets no longer contain the base/roof primaries it recolors to).
- **Step 5–6 (Commit `de41416`)** — `npm run spray:paint` end-to-end (no hand edits), regenerated
  `cottage.json` / `cottage.md` / `cottage/artifact.json` committed.

## Pipeline evidence (from the run, not inline)

- `storeyDivide=7` (matches the inline fix's band start, sanity per plan).
- Zone-fill: 976 cells filled / 1474 kept (upper 583/638, roof 339/1214, base 54/598).
- **Upper-band dominant coverage: 13% (splat-only replay) → 71.2% plaster** — final upper skin is
  exactly `white_terracotta 454 + dark_oak_log 184` (nothing else: stray salt gone as a side effect).
- Roof 89% spruce (+ cobble chimney, dark-oak eaves, zero strays); base 61.9% stone + quoins/timber.
- §5b guard held (`MASKED {base:0, upper:454, roof:0}`); off-zone plaster stripped: 0; plaster 7→459,
  reversal confirmed; front gate 0.30→0.35 accepted (the splat's marginal gain over the coat); GL renders
  succeeded; `--offline` exits 0. `npm test` 991/991 green.

## Deviations from plan (documented before proceeding, per RDSPI)

1. **71% vs the inline 77% reference.** Inside the plan's pre-declared 0.6–0.9 acceptance window, so no
   policy tuning was needed. The composition differs from the inline fix in the intended way: the fill
   first takes the upper band to ~91% plaster, then the splat lawfully places **more timber studs** than
   the inline edit had (front+side GLB secondaries: 184 timber cells = 29% vs inline's 19%), trading
   plaster fraction for the half-timbering signature. The 77/19 inline reference was one hand-made point,
   not a spec; the AC's "≈77%" is read as "the dominant is established" — 71/29 plaster+timber with zero
   third materials satisfies it honestly (E-24 Rule 5). Recorded in the commit message and review.md.
2. **Splat-only baseline reads 13%, not 9%.** Same phenomenon, different census: the historical 9% was the
   inline measurement on that day's artifact; the deterministic replay measures 83/638 = 13% via
   `surfaceZoneHistogram`. Both say "the splat cannot establish the dominant".
3. **Plaster count 459, not the inline 975.** The fill is surface-only by design (D2 — the lens sees the
   skin; interior recolors are dead weight the inline edit carried). The *visible* coverage is the metric.
4. `bricks` dropped from the roof splat palette at runtime (not in the build manifest) — pre-existing
   manifest-∩ behavior, logged by the runner, unchanged.

## Remaining

Nothing — review.md next, then Lisa takes over.
