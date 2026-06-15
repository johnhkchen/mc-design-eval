# T-077-01 Progress — resemblance-consolidation

Implement-phase log. Followed `plan.md` step by step; committed incrementally. No deviations from the plan.

## Completed

- **Step 1 — supersample passthrough** (`30f7923`). `renderArtifact` now forwards `opts.supersample` to
  `renderBuild` — *only when defined*, so an absent value still hits `DEFAULTS.supersample=3` (an explicit
  `undefined` would have clobbered the default via the spread → silent fall to ss=1; guarded). This is the
  lens lever the before/after needs.
- **Step 2 — pure aggregator** (`32b6af6`). `consolidateResemblance` + `RESEMBLANCE_CONSOLIDATION_SCHEMA` +
  `MATERIAL_GAP_ATTRS` in `src/form/resemblance.mjs`; 4 unit tests (routing both ways, unknown-verdict,
  null-gap no-route, empty/determinism). 812 → 816 pass.
- **Step 3 — SUBJECTS table** (`d…`). Generalized to explicit `concept/artifact/committedRender/glb` paths;
  added cottage + moai + pineapple; `resolveSubject()` resolves against the sculpture root. Removed the now
  unused `RUNS_DIR`/`BUILDING_DIR`. Verified all four resolve + score via `--offline` (GL-/model-free).
- **Step 4 — consolidation driver** (`…`). `benchmarks/sculpture/resemblance-consolidation.mjs` +
  `resemblance:consolidate` npm script. Offline wiring check passed end-to-end: 4 perceptual rows, the
  before/after render (HF 690.9→197.5, −71.4% — reproduces T-075 exactly via the fresh ss=1/ss=3 renders),
  reports + E-21 findings + asset copy all produced.
- **Step 5 — live run** (`…`). `node …/resemblance-consolidation.mjs` (4 metered judge calls + GL renders).
  Real verdicts: gatehouse `drifted` (form @ roof), cottage `drifted` (material zoning @ upper walls → E-21),
  moai `different object` (form @ body, meshIoU 0.417 — the honest *worse*), pineapple `drifted` (palette @
  fruit → E-21). Tally 3 drifted / 1 different object; 2 E-21 findings. Triptychs + before/after inspected
  visually (Rule 2): the before shows roof static, the after is clean — same build.
- **Step 6 — design-learnings** (`…`). Appended the "Faithful render + resemblance gate (E-22)" section:
  root cause, SSAA fix, the gate that replaced green-metric sign-off, and the honest re-photographing table
  (incl. the moai worse verdict). `npm test` green after.

## Deviations
None. The plan's offline-first verification (Steps 3–4) caught path-resolution and wiring issues before any
metered spend; the live run (Step 5) needed no re-runs (all four verdicts parsed cleanly — no `"unparsed"`).

## Acceptance criteria — status

| AC | Status | Evidence |
|----|--------|----------|
| #1 fixed render + gate on gatehouse + cottage + 2 sculptures; triptychs saved | ✅ | `benchmarks/sculpture/resemblance/{gatehouse,cottage,moai,pineapple}-triptych.png` (+ per-subject minecraft/perceptual/verdict/resemblance) |
| #2 per-subject report `resemblance-consolidation.{md,json}`: verdict + named residual gap | ✅ | both files in `resemblance/`; verdict + gap per subject; Rule-7 named gaps |
| #3 gatehouse before/after — same artifact, old lens (static) vs fixed lens (clean), for E-12 | ✅ | `pr/assets/gatehouse-lens-{before,after}.png` + work-dir copies; HF 690.9→197.5 (−71.4%) |
| #4 material-drift gaps → finding routed to E-21, not fixed here | ✅ | `docs/active/work/T-077-01/e21-material-findings.md` (cottage zoning, pineapple palette); form gaps NOT routed |
| #5 design-learnings.md gains the E-22 section (root cause, fix, gate, re-photographing incl. worse) | ✅ | "Faithful render + resemblance gate (E-22)" section |
| #6 E-12 handoff (`pr/assets/`: before/after + triptychs); `npm test` green | ✅ | 6 PNGs in `pr/assets/`; **816 pass / 0 fail** |

## Honesty notes (carried into the reports, not hidden)
- The fixed lens made **nothing** look better than it is: the gatehouse static cleared but its form drift
  stayed; the moai got an *honest worse* verdict (`different object`) the green metrics had masked.
- `conceptIoU` + zone ΔE remain depressed by the concept's approximate 3/4 view (T-076 concern #1) — they are
  diagnostic; `meshIoU` (exact view) is the trustworthy form number; the triptych + judge are the verdict.
- Single judge sample (T-076 concern #3); `samples` reserved, not raised here.
