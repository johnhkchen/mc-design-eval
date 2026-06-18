# T-204-01 — Plan: ordered, independently-verifiable steps

Each step commits atomically and leaves `npm test` green. Verification is concrete.

## Step 1 — Pure helper `gableRidgeForRatio` (+ tests)
**Files:** `src/view/roof-generate.mjs`, `src/view/roof-generate.test.mjs`.
- Add the exported pure function per structure.md §A; reuse the module's `roundHalf`.
- Tests (in `roof-generate.test.mjs`):
  - **RR1 in-tolerance no-op:** `eaveHeight=9, perp=11, targetRatio=1.35` (gatehouse-like) ⟹
    `changed:false`, `pitch===1`, `ridgeY===eaveY+floor(perp/2)` (byte-identical guarantee).
  - **RR2 correcting fire:** a clearly out-of-tol case (e.g. `eaveHeight=6, perp=20, targetRatio=1.2`) ⟹
    `changed:true`, `pitch < 1`, `ratioAfter` closer to target than `ratioBefore`, `|ratioAfter−target|` ≤
    `|ratioBefore−target|`.
  - **RR3 cap:** achievedRise never exceeds `floor(perp/2)` (no roof taller than half-perp run).
  - **RR4 degenerate input:** `perp=0` or `eaveHeight=0` ⟹ no throw, `changed:false`, sane pitch-1 default.
  - **RR5 pitch snaps to a supported class:** returned `pitch ∈ {0.5,1,2,3}`.
- **Verify:** `node --test src/view/roof-generate.test.mjs` green; full `npm test` green.
- **Commit:** `feat(T-204-01): pure gableRidgeForRatio lever + tests`.

## Step 2 — Wire the lever into both roof hands (byte-safe)
**File:** `experiments/eval-alignment/picture-climb.mjs`.
- Add imports: `gableRidgeForRatio` (roof-generate), `targetRatiosOf` (framing) — confirm exact existing
  import lines first.
- Edit `apply_gable_roof` (line 107) and `recolor_roof` (line 170) per structure.md §B; compute `eaveHeight`
  from `occ.bounds.min[1]`; log the lever only when `changed`.
- **Verify byte-identical for gatehouse:** run `ROOF_MATERIAL_PROBE=1` before and after the wiring and confirm
  the recolored/gable occupancy roof cells are unchanged (the lever reports `changed:false` for the
  gatehouse). Print the lever decision to confirm the no-op path.
- **Commit:** `feat(T-204-01): wire tolerance-gated pitch lever into roof hands (byte-safe)`.

## Step 3 — Evidence probe (zero-spend) + run it
**File:** `picture-climb.mjs` (extend `ROOF_MATERIAL_PROBE`).
- Add the framing before/after (honest gable vs relief build), the recolor roof-cell census, and the
  synthetic lever-fire print per structure.md §C.
- **Run:** `ROOF_MATERIAL_PROBE=1 node experiments/eval-alignment/picture-climb.mjs` (GL needed for renders;
  the framing/census/lever prints need no GL — if GL is absent, capture the non-render evidence and report the
  render gap honestly, do not claim a glance that didn't render).
- Capture stdout/stderr to `docs/active/work/T-204-01/roof-evidence.log`; copy the `recolored-beside.png`
  glance into the work dir if rendered.
- **Expected evidence:**
  - `recolor_roof` reason: `timber dark_oak_planks → stone deepslate_tiles (concept reads stone)`.
  - roof-cell census: 100% `deepslate_tiles` (colour landed, value-true).
  - honest gable framing: `ridgeToEave ≈ 1.55, flagged:false`.
  - relief build framing: `ridgeToEave ≈ 1.63, flagged:true` (the measurement artifact, named).
  - synthetic lever: `changed:true`, ratio moved toward target (lever exists).
- **Commit:** `feat(T-204-01): roof evidence probe — slate census + framing before/after + lever fire`.

## Step 4 — Gate coverage (only if gap)
**File:** `src/workshop/climb-gate.test.mjs`.
- Read existing recolor_roof / department-dominant coverage. If no explicit recolor_roof keep-on-regression
  case, add one; else reference the existing case in review.md.
- **Verify:** `npm test` green.
- **Commit (if added):** `test(T-204-01): recolor_roof department-dominant keep assertion`.

## Step 5 — Review
- Write `review.md`: files changed, what landed (colour ✓), what is a named residual (pitch — measurement
  artifact, T-202 family), the lever proven on a synthetic case, test coverage + gaps, the E-50 override
  status, and the honest M1 read.
- **Final verify:** `npm test` green; `git status measurements/` clean.

## Testing strategy

- **Unit (in `npm test`):** the pure lever (`gableRidgeForRatio`) — RR1–RR5. This is the only new *logic*; the
  hands are integration glue outside the glob.
- **Integration (manual, zero-spend):** the probe run is the real-build evidence (census + framing + glance) —
  captured to the work dir, not asserted in CI.
- **Regression guards:** byte-identical gatehouse geometry (Step 2 verify); `npm test` green each step;
  `measurements/` untouched.

## Risk register

- **GL unavailable** → renders skip; census/framing/lever evidence still lands; report honestly (anti-hedge).
- **Lever accidentally fires on gatehouse** (would change byte output) → caught by Step 2 verify; if it fires,
  the in-tol threshold is wrong — fix the helper, not the hand.
- **`relief_walls` throws on the closed gabled build** (it expects a specific state) → if so, fall back to
  reading the relief framing straight from `T-201-01/trajectory.json` (r4 = 1.6316) and cite it; the artifact
  is already on disk.
- **Scope creep into `eaveYOf`** → forbidden; T-202. Name only.
