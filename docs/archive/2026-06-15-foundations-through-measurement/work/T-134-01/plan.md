# T-134-01 — steep-pitch-construct — Plan

Phase artifact 4/6. Ordered, independently verifiable steps; one commit per step (or tight pair).
Test command throughout: `npm test` (full) / `node --test <file>` (focused). Suite baseline at
start: green (~1924 pass, T-132 close).

## Step 1 — extract `gableRecord` into roof-generate (pure refactor)

- Move `gableRecord` + `colsOf` from `src/pack/idiom-registry.mjs` to `src/view/roof-generate.mjs`
  (exported, JSDoc); registry imports them.
- Verify: full suite green, zero behavior change (registry construct tests already pin emission).
- Commit: `refactor(T-134-01): gableRecord moves beside its consumer (roof-generate)`.

## Step 2 — the brush module + its proof

- Write `src/view/roof-steep.mjs` per structure §1 (gates → delegate → steep invariant).
- Write `src/view/roof-steep.test.mjs` ST1–ST9 per structure §2. Write tests against the *contract*
  (tops, states, caps, refusal messages), not incidental cell order — except ST8 which pins order.
- Verify: `node --test src/view/roof-steep.test.mjs` green; full suite green (module not yet
  registered — no ripples expected).
- Commit: `feat(E-33 T-134-01): roof.gable.steep construct — 2:1/3:1 mixed block/stair courses,
  named refusals, steep invariant`.

## Step 3 — through the registry door

- Registry entry (structure §5, entry only — tightening is step 4), card specs (§6), SYNTH_SPECS
  (§7), brush-count baseline 22→23 (§8).
- Run full suite; fix every ripple pin it names (registry-size asserts, card coverage, BAML
  registry fixture if any — test/fixture updates only, the T-132 checklist).
- `npm run brush:catalog` — regenerate; confirm record.json brushCount 23 and the new plots
  render with `unmapped` empty; commit regenerated catalog outputs.
- Verify formation replay unharmed: `node --test src/pack/formation*.test.mjs` (registry-as-
  recorded path) green.
- Commit: `feat(E-33 T-134-01): roof.gable.steep through the door — card, catalog 23, baselines`.

## Step 4 — demand-side surfaces

- `roofGableConstruct` pitch ≤ 1 named refusal + paramsSchema maximum (idiom-registry).
- `ROOF_LAYOUTS` row; `roofBlocks` steep→gable fallback; `REALIZABLE_PITCHES` {0.5,1,2,3} +
  message.
- Add focused tests where the seam is new: roof.gable refusal message; roofBlocks fallback
  (specific row absent → gable row used, field-match rule intact); style-pack accepts a pack
  declaring 3, still rejects 1.5 (likely extend existing style-pack/compile tests in place).
- Verify: full suite green (expect ripples in program-validation error-text pins; update tests).
- Commit: `feat(E-33 T-134-01): steep demand surfaces — layouts row, blocks fallback, gable
  tightened to ≤1, pitch vocabulary {0.5,1,2,3}`.

## Step 5 — the barn evidence runner

- `benchmarks/sculpture/steep-pitch.mjs` per structure §3 + the two npm scripts.
- Run `npm run steep:barn:saltcrag` — expect before (pitch 1) + after (pitch 2) artifacts, double-
  run sha match, conformance recorded (courses-even PASS on the after build), 4-view before/after
  sheets in pr/assets/frames. Inspect renders: silhouette visibly steepens; stairs draw (T-107
  lens patch active — if treads are missing in the render, stop and check the lens guard before
  touching anything).
- Run `npm run steep:barn` (rustic) — expect before reproduced + the named stairs-null refusal
  recorded honestly (exit 0).
- Re-run with `--repro`: byte-identical. Sanity: committed pins untouched (`git status` shows
  only new paths + frames).
- Commit: `feat(E-33 T-134-01): steep-pitch evidence on the barn — saltcrag silhouette steepens,
  rustic refusal named`.

## Step 6 — closing sweep

- Full `npm test` green; `npm run patternbook:offline` + `patternbook:saltcrag:offline` (committed
  chain replay unharmed by the registry/compile changes); `npm run brush:catalog -- --check` if a
  check mode exists, else re-run and `git diff --stat` empty.
- progress.md finalized; review.md written (phase 6).
- Commit: docs + any stragglers: `docs(E-33 T-134-01): RDSPI artifacts`.

## Testing strategy summary

- **Unit (new)**: roof-steep ST1–ST9 — the brush contract, orientation-exhaustive, composition
  partners (caps, verges, gable ends, dormers, courses-even), refusals, determinism.
- **Unit (extended in place)**: roof.gable refusal; roofBlocks fallback; style-pack vocabulary;
  registry/contract/count pins.
- **Integration (scripted, committed evidence)**: steep-pitch runner — committed program → seed →
  patched seed → conformance → renders; double-run sha; --repro.
- **Regression**: full suite; offline replays (patternbook both packs, formation tests).
- **Not tested (named)**: steep hip/pyramid (refused-by-omission, declared); judge verdicts
  (S-138 owns); rustic barn steep realization (blocked on its stair family — S-133 finding).

## Verification criteria (the AC, restated checkable)

1. Registry has `roof.gable.steep`; catalog 23; card committed; classes {2,3} realizable,
   others named-refused; tests exhaustive over orientation; unmapped empty (catalog + runner
   builds prove states).
2. ST2–ST6 green (ridge caps, verges, gable ends, dormers, courses-even on steep).
3. `pr/assets/frames/steep-barn--saltcrag-{before,after}.png` committed; after-silhouette
   visibly steeper; record names the demand evidence honestly.
4. No judge calls anywhere; `--repro` byte-identical; no per-building constants in src (subject
   data stays in runner/registry data, the durable-skin convention); `npm test` green.
