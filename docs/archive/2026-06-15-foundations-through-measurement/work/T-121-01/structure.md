# T-121-01 barn-proof-milestone — Structure

The ticket is mostly *runs* of existing machinery; the only code change is the shared
instrument-receipt helper (design D2). Blueprint below: files touched, interfaces, ordering, and
the artifact/record topology each phase of the run produces.

## 1. Code changes

### Created: `src/form/gate-instrument.mjs` (new, pure, ~45 lines)

The same-ruler receipt, extracted from `generated-milestone.mjs:326–344` and parameterized so the
styled and generated chains share one composition point (T-113 lesson):

```js
/** @returns {{frozen:boolean, comparedTo:string|null, diffs:string[], judgeModels:string[]}} */
export function instrumentReceipt(committedGate, freshGate, {
  comparedTo,           // e.g. "committed styled-label gate record"
  fallbackComparedTo,   // e.g. "config (no committed styled-label record)"
  beforeName, afterName // diff-string prefixes, e.g. "styled" → "generated"
}) { … }
```

Behavior (byte-compatible with the current generated-path output so unrotated records don't churn):
- `!freshGate` → `{frozen:false, comparedTo:null, diffs:["no fresh gate record"], judgeModels:[]}`.
- `!committedGate` → `{frozen:true, comparedTo:fallbackComparedTo, diffs:[]}` + fresh judge models.
- Compares `contract.{azimuths, elevationDeg, width, height, gapBudget, coverageThreshold}`
  (diff string: `` `contract.${f}: ${beforeName} ${want} → ${afterName} ${got}` ``) and flags any
  fresh judge model not among the committed record's models.
- Verdicts are deliberately NOT compared (that is `gateInstrumentDiff`'s job for `--rejudge`; a
  live re-judge legitimately moves verdicts — the receipt proves only the ruler held still).

### Created: `src/form/gate-instrument.test.mjs` (~80 lines, node --test conventions)

Cases: no fresh gate; no committed gate (fallback label, frozen true); identical contracts +
same model → `frozen: true, diffs: []`; one drifted contract field → named diff with both
prefixes; novel judge model → named diff; null-safe contract access.

### Modified: `benchmarks/sculpture/generated-milestone.mjs`

Delete local `instrumentDiff()` (lines 326–344); import `instrumentReceipt` from
`../../src/form/gate-instrument.mjs`; call site (line ~562) passes
`{comparedTo: "committed styled-label gate record", fallbackComparedTo: "config (no committed
styled-label record)", beforeName: "styled", afterName: "generated"}`. Record shape unchanged.

### Modified: `benchmarks/sculpture/styled-milestone.mjs`

Three insertions, no flow changes:
1. Import `instrumentReceipt`.
2. In `main()`, immediately **before** `spawnGate` (line ~524): read the committed gate record
   (`gateRecPath` still holds the prior pin at that point) into `committedGate`.
3. After `distillGate`: `const instrument = instrumentReceipt(committedGate, gateRec, {comparedTo:
   "prior committed styled-label gate record", fallbackComparedTo: "first styled gate run (no
   prior committed record)", beforeName: "pinned", afterName: "fresh"})`; add `instrument` to the
   milestone record beside `gate`; one line in `renderMd` summarizing
   `frozen / diffs.length` so the receipt is visible in `styled/<subject>.md`.

### Untouched (named)

- `reconstructed-milestone.mjs` keeps its local variant (distinct no-gate-ran semantics; not
  re-run by this ticket) — residual named in review.
- `multi-angle-gate.mjs`, `pin-guard.mjs`, `roof-diff.mjs`, `durable-skin.mjs`: no changes; all
  invocation-only. The pin-guard conformance sweep's writer list is unaffected (gate-instrument is
  pure; styled/generated milestones already use `guardedWriteRecord`).

## 2. Record/artifact topology produced by the runs

### Barn proof (first derivations — pin-guard writes freely)

| artifact | path |
|---|---|
| generated base / fit / plan / grammar / styled | `benchmarks/sculpture/generated/barn/{base-artifact,provision-fit,component-plan,grammar-artifact,artifact}.json` |
| milestone record + md (instrument, census, fit tables, zeroBlob, generalization, SHAs) | `benchmarks/sculpture/generated/barn.{json,md}` |
| gate record + md (4 views, kit-aware overall) | `benchmarks/sculpture/multi-angle/barn-generated.{json,md}` |
| first-ever contact sheet | `pr/assets/frames/multi-angle-barn-generated.png` |
| skin before/after frames (if GL renders) | `pr/assets/frames/durable-barn-*.png` / `styled-barn-*` per runner |
| roof-diff record + sheet (generated path; reconstructed stays named-skip) | `benchmarks/sculpture/roof-diff/barn-generated.{json,md}`, `pr/assets/frames/roof-diff-barn-generated.png` |
| `--repro` / `--offline` | exit-0 receipts against the committed record (captured in progress.md; no new files expected) |

### Legacy re-judge (rotations — every overwrite under `-- --rotate-pins`)

Per chain — `styled:cottage`, `styled:gatehouse`, `generated:church`, `generated:cottage`:

| moved | path family |
|---|---|
| verdict pins | `multi-angle/<subject>-<label>.{json,md}` |
| milestone records | `styled/<subject>.{json,md}` or `generated/<subject>.{json,md}` |
| chain artifacts | `styled/<subject>/*.json` or `generated/<subject>/*.json` |
| sheets (in place) | `pr/assets/frames/multi-angle-<subject>-<label>.png`, kit report `pr/assets/styled-<subject>-kit.md` |
| roof-diff refresh (judge-free) | `roof-diff/{cottage,church}-generated.{json,md}` + sheets (generated-path inputs moved) |

### Evidence preservation (new, committed)

- `pr/assets/frames/multi-angle-cottage-styled-t111pin.png`, `…-gatehouse-styled-t111pin.png`
  (T-115-era), `…-church-generated-prevpin.png`, `…-cottage-generated-prevpin.png` — copies of the
  prior committed sheets taken **before** each rotation.
- `docs/active/work/T-121-01/before/` — prior gate + milestone records (JSON copies), the
  comparison substrate for review.md's movement tables.

### Journal

- `docs/knowledge/design-learnings.md` — append `## E-30 First-run generalization (S-117…S-121,
  T-117-01…T-121-01) · 2026-06-11` after the E-29 section; E-12 handoff named inside.

## 3. Module boundaries & interfaces

- `gate-instrument.mjs` depends on nothing (pure JSON-in/JSON-out); consumed by two runners. It
  must NOT import from benchmarks/ (src → benchmarks direction is forbidden by convention).
- The receipt's comparator contract: caller supplies the committed record (already read), helper
  never does IO — keeps `--offline`/`--repro` modes and tests trivial.
- Gate invocation interface unchanged: milestone → `spawnGate(subject, artifactRel, label,
  extraArgs)` → gate preflights pins → judge → guarded write. Rotation is purely flag plumbing
  that already exists end-to-end.

## 4. Ordering constraints (binding for the plan)

1. **Seam before any judged run** — the styled chains' single sanctioned judge run must emit the
   receipt; there is no second run.
2. **Barn before rotations** — headline first derivations land on a quiet pin set; an early
   honest-fallback is known before legacy judge spend.
3. **Before-copies before each rotation** — the gate overwrites sheets in place.
4. **Styled re-runs before generated re-runs** — generated's comparator is the styled record
   (contract-stable either way; freshest-comparator is still the cleaner story).
5. **Roof-diff refresh after its input artifacts settle**, never before.
6. **Journal + test-suite green last**, then review.md.

## 5. Commit shape (one rotation = one commit naming retired pins)

1. `feat(E-30 T-121-01): gate-instrument receipt — shared same-ruler proof for styled+generated`
2. `feat(E-30 T-121-01): barn proof — generated:barn first run, repro/offline receipts, roof-diff`
3. `feat(E-30 T-121-01): legacy re-judge under --rotate-pins — RETIRED PINS named` (before-copies
   + rotations + roof-diff refresh + evidence frames)
4. `docs(E-30 T-121-01): design-learnings E-30 + E-12 handoff`
5. `docs(E-30 T-121-01): RDSPI artifacts`
