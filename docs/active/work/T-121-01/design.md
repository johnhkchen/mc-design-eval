# T-121-01 barn-proof-milestone — Design

Four decisions shape this ticket: (1) the scope of the legacy re-judge, (2) how the
`diffs: []` instrument receipts are produced for chains that lack a native receipt, (3) run
ordering and pin-rotation mechanics, (4) how evidence/before-after is preserved. Everything else
(barn run, receipts, journal) is execution of machinery that already exists.

## D1 — Legacy re-judge scope

**Options considered:**

- **(a) Exactly the three named profile chains** — `styled:cottage`, `styled:gatehouse`,
  `generated:church` (the records behind the AC's comparison baselines 10/2, 12/2, 12/2-generated).
- **(b) The three named chains + `generated:cottage`.** T-118's findings explicitly deferred the
  generated-cottage cross-gable ridge fix (−3.445, "the strongest single fixable signal the
  instrument found") to S-121 because "re-running that chain re-judges; S-121 owns verdicts". The
  fix is already landed in `fitRidgeLine`; only the judged re-run is missing.
- **(c) Every label for every legacy subject** (challenge, current, styled, generated ×3) — 24
  judge views.

**Decision: (b).** (a) leaves the T-118→S-121 handoff dangling in the epic's terminal ticket —
E-30 closes with its strongest known fixable signal un-actioned, which fails the AC's own "the
T-118 diff deltas cited beside each verdict" spirit. (c) re-rolls verdicts nobody owns: the AC
names cottage/gatehouse/church "through their chains" and the policy requires the owning ticket to
name what it rotates — challenge/current/cross labels have no named baseline or handoff, so they
stay pinned. (b) is exactly the named baselines plus the one explicitly deferred run; all four are
cottage/gatehouse/church chains, within the AC's wording, and each is one judge run per view.

Rotated verdict pins (named here per policy §2 "AC must name the records"):
`multi-angle/{cottage-styled, gatehouse-styled, church-generated, cottage-generated}.{json,md}`,
plus each chain's milestone records and artifact JSONs
(`styled/{cottage,gatehouse}.json`-family + `styled/{cottage,gatehouse}/*.json`,
`generated/{church,cottage}.json`-family + `generated/{church,cottage}/*.json`), plus the
roof-diff records whose inputs move (`roof-diff/{cottage,church}-generated.{json,md}` at minimum —
judge-free instrument refresh). Barn writes are first derivations — no rotation needed.

## D2 — Instrument receipts (`diffs: []`) for the styled chains

The AC requires "instrument-diff receipts per subject (`diffs: []`)". The receipt that exists is
the milestone-record `instrument` field (generated-milestone.mjs:326–344; reconstructed-milestone
has the same): contract fields (azimuths/elevation/width/height/gapBudget/coverageThreshold) +
judge-model set vs a committed gate record — the "same ruler" proof that verdict movement is
attributable to the build/judge, not to instrument drift. `styled-milestone.mjs` has no such field.

**Options:**

- **(a) Add the `instrument` receipt to styled-milestone.mjs**, mirroring the
  generated/reconstructed precedent: read the prior committed `multi-angle/<subject>-styled.json`
  **before** spawning the gate (the gate overwrites it under rotation), compute the contract+model
  diff against the fresh gate record, store `{frozen, comparedTo, diffs, judgeModels}` in the
  styled milestone record. Small, pure comparison; unit-testable.
- **(b) Compute receipts ad hoc** (node one-liners) into `docs/active/work/T-121-01/receipts/`.
- **(c) Use `gateInstrumentDiff`** as the receipt function.

**Decision: (a), with the comparison extracted to a shared pure helper.** (c) is the wrong tool:
`gateInstrumentDiff` byte-compares parsed verdicts (it exists so `--rejudge` can prove it changed
nothing) — a live re-judge legitimately changes verdicts, so it can never return `[]` here. (b)
produces a receipt that doesn't live beside the record and leaves the styled seam open for every
future re-judge; the epic's whole arc is moving one-off checks into the runners. (a) is ~30 lines:
extract the existing field-diff logic from generated-milestone into
`src/form/gate-instrument.mjs` (pure, exported `instrumentReceipt(committedGate, freshGate)`),
import from styled-milestone (new field) and generated-milestone (replace local copy — one
composition point, same lesson as T-113's vocabulary authority). Generated chains keep their
existing comparator (the committed styled-label record); the styled chain compares to its own
prior committed record.

Receipt comparators per run: cottage-styled & gatehouse-styled → their own pre-rotation records;
church-generated & cottage-generated → the committed `<subject>-styled.json` (the native
comparator; cottage-styled will already be re-pinned by then, contract unchanged either way).

## D3 — Run ordering and rotation mechanics

**Order: code seam → barn proof → legacy re-judges → evidence/journal.**

1. **Instrument-receipt seam first** (D2a + unit tests, commit) — the styled re-runs must emit
   receipts on their one sanctioned judge run; there is no second run to retrofit them.
2. **Barn proof** (`generated:barn` live → `--repro` → `--offline` → `diff:roof` barn) — all first
   derivations, independent of legacy pins. Running barn before any rotation keeps the headline
   run uncontaminated by mid-flight pin churn, and an early failure (honest-fallback path) is
   known before judge spend on legacy.
3. **Legacy re-judges**, one chain at a time, each invoked as
   `npm run <chain> -- --rotate-pins` (the `--` matters; npm swallows flags otherwise —
   fail-closed by design). Before each run, copy the prior gate record + sheet aside for
   before/after evidence (D4). Styled runs before generated runs so the generated comparator is
   the freshest styled record (contract-stable either way).
4. **Roof-diff refresh** for the paths whose artifacts moved (judge-free), then evidence + journal.

Rejected alternative — `gate:rejudge` for the legacy runs: it completes **unparsed** views only;
all 16 legacy views are parsed, so it is a structural no-op. The live gate run with
`--rotate-pins` is the sanctioned path (policy §2; preflight-before-spend already in the gate).

Failure posture (the AC's honest-fallback convention): if the barn chain throws, the runner
commits a `status: "pipeline-failed"` record — that record plus named causes is the deliverable,
and the DoD rests with the reviewer. If a legacy verdict regresses (budget-edge flap risk on
cottage 135°/225°), it is recorded as movement with the roof-diff deltas beside it — no re-roll,
no retry. Malformed judge replies follow T-114 (bounded same-prompt re-asks) and nothing else.

## D4 — Evidence preservation (before/after vs prior pins)

The gate overwrites `pr/assets/frames/multi-angle-<slug>.png` in place; git history keeps the old
bytes but the AC wants visible "legacy vs their prior pins". **Decision:** before each rotation,
copy the committed sheet to `pr/assets/frames/multi-angle-<slug>-t111pin.png` (cottage/gatehouse;
the T-111/T-115-era pins) and `-prevpin.png` (church/cottage generated), and copy the prior gate
records into `docs/active/work/T-121-01/before/` (the T-118 `artifacts/before/` precedent). Barn
gets first-ever sheets — no before exists; the contact sheet itself is the deliverable. Census and
fit-error tables ship in `generated/barn.md` (renderMd already produces them) and are excerpted in
the journal. Roof-diff sheets are already committed per subject; re-derived ones land at the same
paths.

## D5 — Journal & E-12 handoff

`docs/knowledge/design-learnings.md` gains `## E-30 First-run generalization … · 2026-06-11`
following the E-29 section: the weakest-lens finding closed (T-116 stall → T-117 role-aware lens),
the diff-then-fit discipline (T-118: instrument refuted every pre-named refit), pin protection
(T-119), registration smoke (T-120), and per-subject outcomes from this ticket — honest on
over/under-reach (e.g. if barn misses the bar, the named causes ARE the finding). E-12 handoff =
the committed `pr/assets/frames/` set (barn first-ever sheets + legacy before/after) named
explicitly in the section and in review.md, per T-101/T-111 precedent.

## Out of scope (named)

- Re-running challenge/current/cross-label gates (no owner; D1c rejected).
- Any tuning in response to verdicts (E-30 owns generalization, not score-chasing; one run each).
- roof-program / reconstructed-path re-runs (T-118 proved placements byte-identical there).
- Pin-guarding roof-diff.mjs's writes (worth a future conformance ticket; this ticket rotates its
  records under sanction and names them in the commit).
