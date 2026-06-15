# T-055-01 — progress: material-clean-pass (E-17 rung R2)

All six plan steps complete. `npm test` 522/522 green. Live R2 sweep ran on all 7 subjects with the
expected before/after noise drop and steady form IoU. No deviations from the plan.

## Step status

| step | status | commit | notes |
| ---- | ------ | ------ | ----- |
| 1. Refactor `keysToArtifact` (DRY seam) | ✅ done | `refactor(E-17 T-055-01): extract keysToArtifact …` | behavior-preserving; R1 tests pass unchanged |
| 2. `material-clean.mjs` pure core + GLB wrapper | ✅ done | (folded into step 3 commit) | reuses E-10/E-11/E-16 primitives; no new color math |
| 3. `material-clean.test.mjs` (pure, AJV round-trip) | ✅ done | `feat(E-17 T-055-01): materialCleanVoxel …` | 8 tests; `npm test` 522/522 |
| 4. `.gitignore` + `glb-voxel-clean.mjs` runner | ✅ done | `feat(E-17 T-055-01): glb-voxel-clean runner …` | parses, side-effect-free import |
| 5. Live 7-subject R2 sweep + roll-up | ✅ done | `feat(E-17 T-055-01): R2 material-clean builds …` | artifacts + r2.{md,json} durable; renders ignored |
| 6. Determinism + hygiene + review | ✅ done | `docs(E-17 T-055-01): R2 progress + review` | `--offline` zero-diff; no secret leak |

## Acceptance criteria — evidence

- **AC #1 — palette extracted from the GLB texture (E-10), not from noisy per-voxel samples.**
  `extractTexturePalette` (`src/form/material-clean.mjs`) delegates to E-10 `extractPaletteFromPixels`
  on the decoded baseColor texture → value-true blocks (snap target uses each entry's **block** Lab,
  `blockColor.lab`). Unit-tested: a 2-dominant-color noisy atlas → a small (≤k) palette, every block a
  real table block, each with a 3-d Lab. The per-voxel samples are never clustered.
- **AC #2 — `materialCleanVoxel(build, opts) → DesignArtifact` (extract + snap + denoise + optional E-11);
  passes the AJV gate.** Implemented; pipeline is extract → `sampleSurfaceColors` → `snapColorsToPalette`
  → `denoiseVoxelKeys` → (optional `applyMaterialTexture`) → `keysToArtifact`. Test asserts the synthetic
  output passes the real `assertArtifact`. The live runner asserts all 7 (no skips).
- **AC #3 — unit-tested on synthetic noisy color; pure, GL-free.** `material-clean.test.mjs` (8 tests,
  `src/**` → collected by `npm test`): palette extraction, snap shrinks distinct count (gradient 22 → k),
  denoise absorbs a speck (distinct → 1, speckle → 0, occupancy unchanged, tie keeps current),
  `speckleScore`, end-to-end round-trip, `applyMaterialTexture` stays in-table, `keysToArtifact` parity.
- **AC #4 — applied to all 7 R1 builds → R2 builds + renders in `glb-voxel-clean/<subject>/`; before/after
  noise drop recorded; form IoU steady.** `r2.md`:

  | subject | distinct R1→R2 | speckle R1→R2 | form IoU R1→R2 |
  | ------- | -------------- | ------------- | -------------- |
  | dancing-man | 18 → 5 | 0.528 → 0.275 | 0.914 → 0.914 |
  | moai | 43 → 5 | 0.643 → 0.248 | 0.565 → 0.565 |
  | pineapple | 24 → 5 | 0.549 → 0.250 | 0.907 → 0.907 |
  | bow-and-arrow | 34 → 8 | 0.706 → 0.366 | 0.473 → 0.473 |
  | heart | 91 → 7 | 0.692 → 0.343 | 0.877 → 0.877 |
  | mushroom | 92 → 7 | 0.522 → 0.301 | 0.980 → 0.980 |
  | koi | 71 → 8 | 0.723 → 0.350 | 0.622 → 0.623 |

  Distinct-block count down on every subject (the speckle, gone); spatial speckle ≈ halved; form IoU
  holds to ±0.001 (koi +0.001 GL rounding, the rest identical) — the clean did not break the shape.
- **AC #5 — `npm test` green.** 522/522 (was 514; +8 new tests).

## Deviations from plan

None of substance. Two small in-plan refinements:
- The texture-palette *description* is **not** stamped on the artifact (the schema's `style` is
  `additionalProperties:false`); the runner re-derives it via `extractTexturePalette` and records it in
  `summary.json` (`paletteDescription`). This was anticipated in design.md (Decision 7 surfaces metrics
  via the runner's summary, not the artifact).
- The synthetic "noisy color" fixtures use a gray+tan gradient (fragments to 22 blocks against the full
  305-table) rather than a single hue band (which collapses to one block both ways and wouldn't
  demonstrate the shrink). Same intent, sharper signal.

## Verification log

- `node --test src/form/glb-voxel-build.test.mjs` → 8/8 after the refactor (behavior-preserving).
- `node --test src/form/material-clean.test.mjs` → 8/8.
- `npm test` → 522/522.
- Live sweep: 7/7 subjects, ~112s total; `assertArtifact` passed for all 7.
- `--offline` re-run → **zero diff** on `r2.{md,json}` (deterministic core).
- Secret hygiene: `MODAL_ENDPOINT_URL` count in the runner = 0; regen branch shells to `trellis-glb.mjs`
  which inherits the env and never prints it. Absent-GLB path skips, not crashes (the present-GLB run
  never reached it; logic mirrors the proven R1 runner).
