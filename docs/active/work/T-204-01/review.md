# T-204-01 — Review: roof to its picture (slate colour + correct pitch)

Story **S-204** / Epic **E-52**. The E-50/E-49 roof residuals, finished. Two coupled fixes — colour and pitch
— both **landed**, with the result led by how it could have failed (anti-hedge).

## Outcome in one line

**Both ACs met on the primary branch, not the fallback:** the roof lands value-true dark slate
(2106/2106 `deepslate_tiles`, confirmed on the glance), and a real, tolerance-gated pitch lever brings the
measured `ridgeToEave` from 1.55 → **1.25** (closer to the concept 1.35) so the framing scale flag **clears**
(after `relief_walls`: 1.32 unflagged vs the old 1.6316 flagged-major).

## Files changed

| File | Change |
|------|--------|
| `src/view/roof-generate.mjs` | + `gableRidgeForRatio` (pure, exported): tolerance-gated ridge/pitch for a target proportion; ridge follows the chosen pitch's clean apex |
| `src/view/roof-generate.test.mjs` | + RR1–RR5 unit tests for the lever |
| `experiments/eval-alignment/picture-climb.mjs` | + `leverGable`; wired into `apply_gable_roof` + `recolor_roof`; extended `ROOF_MATERIAL_PROBE` with slate census + framing before/after + synthetic lever fire; +2 imports |

Work artifacts: `research.md`, `design.md`, `structure.md`, `plan.md`, `progress.md`, this `review.md`,
`roof-evidence.log`, `recolored-beside.png` (the slate glance). No `src/`/`measurements/` deletions.

## Acceptance criteria

1. **recolor_roof lands value-true dark slate, wall geometry untouched; glance confirms.** ✓ — census
   2106/2106 `deepslate_tiles`; reconcile `timber dark_oak_planks → stone deepslate_tiles`; the glance reads
   dark charcoal-slate beside the concept. No colour code change was needed — recognition's material map
   already chose the value-true dark family; the gap was only that `recolor_roof` never *ran* (T-201 `maxRounds`).
2. **Pitch lever brings the gable to ~1.35 and the scale flag clears — or named limit.** ✓ (primary branch) —
   measured 1.55 → 1.25 (|Δ vs concept| 0.20 → 0.10); after relief 1.32, **flagged:false** (vs old 1.6316
   flagged major). before/after reported in `roof-evidence.log`.
3. **If recolor is rolled back, the E-50 department-dominant override keeps it.** ✓ verified — covered by
   `climb-gate.test.mjs:176–190` (ROOF major cleared while a WALL major is promoted → `accept`, reason
   "ROOF cleared a major") and `:151` (`TOOL_DEPARTMENTS.recolor_roof === ["ROOF"]`). No live climb needed
   (the gate is pure); no new test required.
4. **Recorded honestly; judged on the dimensionless ratio, not pixels.** ✓ — all pitch claims are
   `ridgeToEave` ratios from `framingReport`; colour judged on the glance + block census.
5. **`npm test` green; frozen instrument untouched.** ✓ — 2405/2405; `git status measurements/` clean.

## Test coverage & gaps

- **Unit (in `npm test`):** the only new *logic* — `gableRidgeForRatio` — is covered by RR1 (in-tol no-op),
  RR2 (correcting fire moves toward target), RR3 (ridge = chosen pitch's clean apex; too-flat → steeper
  class), RR4 (degenerate input, no throw), RR5 (supported pitch class).
- **Integration (zero-spend, captured not asserted):** the `ROOF_MATERIAL_PROBE` run is the real-build
  evidence (census + framing before/after + glance). The roof hands live in `experiments/**`, outside the
  `npm test` glob — by repo convention — so they are exercised by the probe, not CI.
- **Gap:** no automated regression pins the gatehouse's *measured* post-lever `ridgeToEave` (1.25); it is
  recorded in `roof-evidence.log` and reproducible via the probe. A CI pin would couple the suite to GL —
  intentionally avoided (the reproducibility-excludes-GL rule).

## Deviation from the plan (and why it's a better result)

design.md predicted the lever would be a **byte-identical no-op on the gatehouse** (honest gable 1.55 within
tol). The run **refuted** this: the lever's own estimate (1.63) is just out of its 0.2 tol, so it **fires**
and rebuilds at pitch 0.5. This is the *primary* AC branch, not the named-limit fallback — and it is **not**
the "fake a lever" the ticket forbids, because 1.25 is genuinely **closer** to the concept than 1.55 (we moved
an at-the-tolerance-edge roof toward the picture, we did not push an on-target roof off-target). Full reasoning
in progress.md.

## Open concerns for the human reviewer

1. **Lever vs eye disagree on eave height.** `gableRidgeForRatio` estimates `eaveHeight = eaveY − floor + 1`;
   `framing.eaveYOf` uses taper detection. They differ by ~0.08 in ratio, which is why the lever fires while
   the eye reads pitch-1 as (barely) in-tol. Both candidate pitches still rank the same by the eye, so the
   verdict holds — but the two should share **one** proportion definition. Worth a small follow-up.
2. **Pitch granularity is coarse.** Supported classes {0.5, 1} bracket the gatehouse target (1.25 / 1.55); no
   class hits 1.35 exactly, so the gable now errs slightly shallow (−0.10, within tol). Acceptable for "to its
   picture"; a finer lever would centre it.
3. **The relief/`eaveYOf` measurement pollution is real and remains** (→ **T-202**). The lever clears the
   gatehouse flag by improving the roof + adding margin; it does **not** fix the underlying proud-detail
   sensitivity of the framing eave read — the same family as T-202's `eaveRingClosure` collapse. T-202 should
   still land; this ticket does not touch `eaveYOf` (scope discipline).
4. **Other subjects.** The lever only edits this gatehouse-scoped runner (`CFG`/`PROGRAM_PATH` are
   gatehouse). It is principled and tolerance-gated, so matched subjects should be unaffected — but it was not
   exercised on cottage/barn here. T-205 (the M1 capstone re-climb) is the natural place to confirm at scale.

## Verdict

The roof reaches its picture on **both** axes — colour (value-true dark slate, on the glance) and pitch (the
lever brings the proportion toward the concept and clears the scale flag). The named caveats (lever/eye eave
disagreement, pitch granularity, the deferred T-202 measurement fix) are recorded, not hidden. Converges with
T-202/T-203 at the T-205 capstone.
