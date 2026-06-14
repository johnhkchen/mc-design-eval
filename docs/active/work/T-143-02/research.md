# Research — T-143-02 straight-ruler-reverdict-resumption

Descriptive map of the codebase as it bears on resuming T-143-01 at the cottage. No solutions
here — only what exists, where, and how it connects.

## What this ticket is

T-143-02 is the **resumption** of T-143-01. E-34's terminal story S-143 is a *measurement* run:
re-verdict three subjects (barn rustic, barn saltcrag, cottage) through the live pattern-book →
workshop → judge pipeline now that the E-34 instrument fixes have landed (T-139 straight ruler,
T-140 named lens + concept-precedence pitch, T-141 rustic headroom, T-142 witnesses, T-144 v2
budget). The two barns **already landed** under T-143-01 (commits `5d0743e`, `979d8b7`) and are to
be **cited, not re-run**. T-143-01's session died at the cottage's round-1 model exchange
(~11:14am 2026-06-12; same interruption class as T-138-01). T-143-02 therefore carries: the
**cottage** through the full loop, the **milestone recompose** over all three, the **design-learnings
E-34 section + E-12 handoff**, and the **story-level S-143 review**.

The execution shape is fully specified by T-143-01's own plan: Steps 0–2 are done (cited), and
T-143-02 = **Step 3 (cottage) + Step 4 (milestone) + Step 5 (learnings/repro) + S-143 review**.
`docs/active/work/T-143-01/plan.md` is the authoritative template; `progress.md` there is the
verbatim before-state and the barn outcomes.

## The pipeline runners (benchmarks/sculpture/)

- **`pattern-book.mjs`** — the chain orchestrator. Flags (confirmed in source, lines 28–29):
  `--subject <key> | --all`, `--repro | --offline`, `--pack packs/<style>.json`, `--ticket <id>`
  (default `T-127-01`; names the record's authority), `--rotate-pins` (ROTATE_FLAG threaded to
  `workshop.mjs`). Stages: sketch → recognition → seed → live workshop → final. `--repro` re-derives
  shas with no model/GL/spawn/writes; `--offline` adds the T-126 offlineAssert on the committed
  ledger. npm: `patternbook:cottage` (`--subject cottage`), `patternbook:repro` (`--all --repro`).
- **`workshop.mjs`** — the self-revision loop (≤6 rounds), spawned by pattern-book; emits the ledger.
  This is where the levers + proportion gate are armed and where the live model spend lives.
- **`multi-angle-gate.mjs`** — the judge. npm `gate:patternbook:cottage` expands to
  `--subject cottage --label patternbook --artifact workshop/cottage/final-artifact.json
  --reference recognition/cottage.artifact.json`. One run per view (4 azimuths), T-114 reply policy,
  decided under T-144 v2 budget (`multi-angle-budget/v2`, minor≤minorBudget=10) with legacy (≤2 gap)
  beside in `aggregate.legacy`. Companion T-100 kit-presence census rides along (this is what FAILed
  saltcrag on 5/3337 band0 cells).
- **`proportion-witness.mjs`** — per-subject ratio witness; `--subject cottage`, `--rotate-pins`,
  `--repro` (re-derives the ledger). npm `proportion:cottage`, `proportion:repro` (`--all --repro`).
- **`visibility-witness.mjs`** — per-view own-coverage witness; `--subject cottage --label
  patternbook`, `--rotate-pins`, `--repro`. npm `visibility:cottage`, `visibility:repro`.
- **`proportion-milestone.mjs`** — composes the milestone over the frozen
  `pattern-book/proportion-baselines.json` + the live records; writes milestone JSON/MD +
  `pr/assets/proportion-milestone.md`. npm `milestone:proportion`, `:repro`, `:baselines`.
- **`pattern-book-compare.mjs`** — head-to-head; writes `pr/assets/pattern-book-milestone.md`.

## Key data files & pins

- `benchmarks/sculpture/pattern-book/proportion-baselines.json` — the **frozen** pre-rotation
  baselines (T-138-02 era). Must remain byte-unchanged through this ticket (`git diff --stat`).
- `benchmarks/sculpture/retired-pins.json` — owner T-142-01, schema `retired-pins/v1`. Sanctioned-
  rotation registry keyed on `retiredSourceSha`; lets the re-derivation witnesses **SKIP (named)**
  instead of bare DIVERGES when a source was retired by a named rotation. Current entries:
  `proportion[]` = cottage (T-138-02, sha `e1abd583…`), barn (T-138-01, sha `11ec20dd…`);
  `visibility[]` = barn-patternbook (T-138-01), barn-patternbook-saltcrag (T-138-01),
  cottage-patternbook (T-138-02, sha `f5567754…`, preserved at
  `src/view/fixtures/cottage-patternbook.t127-retired.json`); `measured[]` = empty. **Note:** the
  barn T-143-01 re-runs rotated barn witness pins but `progress.md` records `proportion:repro` going
  **GREEN (was SKIP)** — the witness re-pins to the new T-143-01 ledger and re-derives it, so a
  *new* retired-pins entry was not necessarily required for the barns. The cottage rotation under
  T-143-02 will re-pin the cottage witnesses to the new T-143-02 ledger; whether a new retired-pins
  entry is needed (vs. the existing T-138-02 cottage entry) is an Implement-time observation.
- `benchmarks/sculpture/recognition/cottage.artifact.json` (731 KB) — the gate **reference** (the
  recognized building program). Present.
- `benchmarks/sculpture/workshop/cottage/final-artifact.json` (780 KB, mtime Jun 12 06:33) — the
  current committed cottage final (T-138-02 era). The cottage re-run will rotate this.
- `benchmarks/sculpture/packs/*.json` — substitution packs (saltcrag etc.). Cottage uses the
  default pack.

## Pin-guard & rotation discipline (must be honored)

Memory [[pin-guard-is-structural]]: T-119 landed `guardedWriteRecord` + preflight-before-spend in
all nine pin-writers; rotations need `--rotate-pins` in an owning ticket. The cottage run uses
`--ticket T-143-02 --rotate-pins`. Per AC, the record carries `ticket: T-143-02` (the authority that
ran it), exactly as T-138-02's cottage record carried T-138-02 while the barns carried T-138-01.

## The cottage's standing question (the headline)

Memory [[proportion-loop-bent-ruler]] + T-138-02 review finding 4: the T-138-02 cottage verdict was
**2/4 same-object, 7 minor + 4 major** — part-real roof-heaviness, part-instrument. The realized
plinth band (y3–4, 1–2 blocks wider than the walls) latched `eaveWidthFrac 0.98`'s eave detection
(recorded ratios 5.5/0.8182 vs hand-corrected ≈1.7/0.45 vs targets 1.4145/0.293), **inverting the
lever gradient**: the model aimed the correct wall-raise in 5/6 rounds (refused by the rustic
storeyHeight band + schema storeys≤4); the one accepted move was the wrong-direction `storeys:3`.
T-139 (straight ruler — eave detection ignores sub-wall skirt bands) + T-141 (rustic headroom — the
wall-raise the model aimed is now admissible, storeyHeight≤5) are the two fixes meant to un-bend
this. The epic's true question (AC3): **does the cottage residual collapse to real-only?** The honest
answer is recorded, not engineered — a PASS is not required by any AC.

Memory [[cottage-concept-ground-storey-is-stone]]: the E-25 plinth claim was refuted by crop
inspection; the real divergence is roof dominant (`dark_oak_planks`). The roof-heaviness residual is
the part-real component the straight ruler must isolate from the instrument artifact.

## Verification idiom

This repo's integration test = the runner's own `--repro`/`--offline` byte-check. The rotation-proof
bar (T-142) = witnesses **green-or-named-SKIP before AND after**, both recorded. `npm test` baseline
~2033 passing (T-144 era); no `.mjs` source changes are expected in this measurement ticket, so the
suite should stay green. Memory [[reproducibility-excludes-gl-from-decisions]]: byte-reproducible
runs gate on coverage only; resemblance is evidence.

## Constraints surfaced

- **Singular judge** (AC2 / memory [[judge-reply-policy-seam]]): one run per view; T-114 re-asks only
  on malformed replies; a clean verdict is **never re-rolled**. The saltcrag band0 FAIL was honored
  as-is — same discipline applies to the cottage.
- **No per-building constants** (E-25 Rule 3): subject keys live in data sidecars, never runner
  `.mjs`; the generalization self-grep must stay clean.
- **Baselines frozen**: the pre-existing `milestone:proportion:repro` DIVERGES is staleness (the
  committed milestone is T-138-01-era while records moved under T-138-02 + T-144) — resolved by the
  recompose, never by re-banking baselines.
- **Feasibility probed (this session):** `claude -p` (haiku) → `ok`; `render.mjs` `GL_AVAILABLE:
  true`. The cottage seed reproduces byte-identically under the new code (T-143-01 progress.md), so
  the live re-run changes only the workshop trajectory and the verdict.
- **Cost ceiling:** the cottage is the only remaining judge run for this ticket; run each step once.
