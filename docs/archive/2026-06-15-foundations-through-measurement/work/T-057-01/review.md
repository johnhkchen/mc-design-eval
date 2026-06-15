# T-057-01 Review — consolidation-scorecard-and-march

The terminal E-17 ticket: turn the T-056-01 data spine into one legible scorecard + one per-subject
visual + the durable journal entry — honestly. Presentation/attribution layer, no new trials, no new
metrics. **Done; `npm test` 540/540.**

## What changed

### Created
- `src/form/montage.mjs` — pure RGBA row compositor (`montageRow`); pastes N equal-stride panels
  left→right with `gap`px gutters. No pngjs/GL/files.
- `src/form/montage.test.mjs` — 4 pure tests (paste, gutter, unequal-height top-align, input guards).
- `src/form/scorecard.mjs` — pure attribution layer over the spine: `TECHNIQUES`, `meanPresent`,
  `attributeTechniques` (per-technique mean of the marginal column + verdict tally), `assembleScorecard`
  (spine JSON → `{md, json}` scorecard, `scorecard/v1`). Imports only `ablation.mjs`.
- `src/form/scorecard.test.mjs` — 6 pure tests; test 5 **pins the headline averages** (+0.238 / +0.000 /
  −0.001 form; −7.16 / −4.53 / 0 ΔE) against the real 7-subject marginals inlined in the test.
- `benchmarks/sculpture/sweep-scorecard.mjs` — the I/O runner: reads `sweep-ablation.json`, writes
  `pr/assets/sweep.md` (+ E-12 handoff), stitches `pr/assets/frames/march-<subj>.png` × 7.
- `pr/assets/sweep.md` — the scorecard + handoff (tracked).
- `pr/assets/frames/march-<subject>.png` × 7 — the R0→R3 strips (tracked; source renders gitignored).

### Modified
- `docs/knowledge/design-learnings.md` — new "Consolidation sweep (E-17)" section.
- `pr/assets/frames/README.md` — march-frame provenance block + regen recipe.

### Deleted
None.

## Design rationale (the one decision worth re-checking)

The scorecard **consumes the already-assembled spine JSON verbatim** rather than re-deriving metrics
from renders. This is deliberate: the spine is T-056-01's single source of truth, and a re-derivation
would risk the scorecard drifting from the record. The cost is that the scorecard inherits the spine's
caveats (notably the R2/R3 `valueΔE = 0` snap-to-canonical tautology) — surfaced explicitly in the
honesty notes rather than papered over.

The form/value split is the attribution the ticket asked for: averaging each technique's **marginal
column** (not the absolute rung level) is what isolates "what did *this technique* buy." It yields the
legible answer — voxelization is the whole form win (+0.238, 7/7), material-clean is value-only, surgical
is a wash.

## Test coverage

- **Pure logic — fully covered, in `npm test`:** `montageRow` (pixel paste math, 4 tests) and the
  scorecard assembler (averaging, thresholds, verdict tallies, null-tolerance, the pinned headline
  numbers, 6 tests). 540/540 total (530 prior + 10).
- **Not unit-tested (by design):** the runner's PNG decode/encode + file I/O. It is deterministic
  (pngjs `PNG.sync`), reads gitignored renders, and is verified manually (the 7 frames stitched, one
  visually inspected, the scorecard read back). It stays out of the `src/**/*.test.mjs` glob so the
  test suite needs no fixtures on disk.

**Gap:** no test asserts the runner correctly maps the four rung render paths or the gutter color — a
path typo would silently skip a frame (logged, not failed). Mitigated by the runner's explicit
per-subject log line and the committed outputs; a future smoke test could decode `march-koi.png` and
assert width 2066. Low risk (outputs are committed and inspected).

## Open concerns / limitations

- **The march strips carry no burned-in rung labels.** By convention (matching `triptych-*`/`pair-*`),
  labels live in `sweep.md` / the README, not the pixels. If the E-12 desk wants captions, that is a
  production-overlay step, not a regen.
- **Frame regen needs local rung builds.** The composites are committed, so consumers never need the
  gitignored source renders; but anyone *re-running* `sweep-scorecard.mjs` must have the R0–R3 builds on
  disk. The runner degrades gracefully (skips + warns, still writes the scorecard). Documented in the
  README.
- **The valueΔE=0 tautology is real and flagged, not fixed.** Material-clean snapping to the GLB's own
  palette makes its residual structurally 0; the scorecard reports the R1→R2 *cleanup* as the honest win
  and labels the zero as tautological. A non-tautological palette metric (e.g. vs a fixed reference) would
  be a new measurement, out of scope for a consolidation.
- **No new perceptual judge.** Consistent with the E-16 discipline — the categorical is the deterministic
  IoU verdict, not a re-run model. The scorecard manufactures no new evidence.

## Honesty check (AC #5) — passed

The scorecard and journal both state, in numbers: material-clean form +0.000, surgical −0.001 with
**bow-and-arrow −0.004 / 0-of-7 improved**, and the snap-to-canonical caveat. Nothing dropped; every
average reports n. The instrument shows the rungs that bought nothing as buying nothing.

## For the human reviewer

Highest-leverage things to eyeball: (1) `pr/assets/sweep.md` — does the AVG row read as the honest
headline? (2) one `march-*.png` — does the R0→R3 progression read left→right? (3) the
`design-learnings.md` E-17 section — voice/numbers consistent with the E-16 entry above it. The pure
cores are small and fully tested; the runner is mechanical I/O.
