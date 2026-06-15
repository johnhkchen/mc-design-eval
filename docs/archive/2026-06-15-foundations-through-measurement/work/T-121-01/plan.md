# T-121-01 barn-proof-milestone — Plan

Five steps, each independently verifiable and atomically committable. Steps 2–3 spend judge calls
(~20 views total: barn 4, legacy 16) — each is one run per view, no re-rolls; T-114 bounded
re-asks apply to malformed replies only. The honest-fallback convention governs every judged step:
a miss with named causes is a valid deliverable; the only invalid outcome is a re-roll or an
unrecorded result.

## Step 1 — gate-instrument receipt seam (code, judge-free)

1. Create `src/form/gate-instrument.mjs`: pure `instrumentReceipt(committedGate, freshGate,
   {comparedTo, fallbackComparedTo, beforeName, afterName})` per structure §1 — byte-compatible
   output with the current generated-path field shape.
2. Create `src/form/gate-instrument.test.mjs` (6 cases: no-fresh, no-committed fallback, frozen
   clean, contract drift named, novel judge model named, null-safe contracts).
3. `generated-milestone.mjs`: replace local `instrumentDiff` with the import (same call-site
   semantics, prefixes `styled`→`generated`).
4. `styled-milestone.mjs`: read committed gate record before `spawnGate`; compute receipt after
   `distillGate`; add `instrument` to the record beside `gate`; surface one line in `renderMd`.

**Verify:** `node --test src/form/gate-instrument.test.mjs` green; full `npm test` green
(baseline 1601 + new); `node --check` both runners.
**Commit 1:** `feat(E-30 T-121-01): gate-instrument receipt — shared same-ruler proof (styled +
generated milestones)`.

## Step 2 — barn proof run (first derivations, 4 judge views)

1. `npm run generated:barn` — live chain: evidence → fit → generate (zero-blob machine check +
   regenerate-from-record) → skin → grammar/dressing/settle → kit-aware multi-angle gate.
   In-process double-run byte-equality is built in; exit code = verdict, but a thrown chain still
   writes a `status: "pipeline-failed"` record (that record + named causes = honest fallback).
2. Inspect `generated/barn.json`: `status`, `zeroBlob.passed === true`, `generation.findings`
   (named omissions only), `instrument.frozen === true` with `diffs: []` (fallback comparator —
   barn has no styled-label record), `generalization` clean, `reproducible.sha256` present;
   gate record `multi-angle/barn-generated.json` + sheet `pr/assets/frames/multi-angle-barn-generated.png`.
3. `npm run generated:barn -- --repro` → expect exit 0 (fresh-process SHA match vs committed
   record). First `--repro` receipt for barn.
4. `npm run generated:barn -- --offline` → expect exit-0 validation pass. First `--offline` receipt.
   (Both receipts captured verbatim in progress.md — these modes validate, they don't write.)
5. `npm run diff:roof -- --subject barn` (confirm exact CLI from `roof-diff.mjs` head before
   running) — generated path measured for the first time; reconstructed path stays a named skip.
6. Score against the pinned bar (kit presence PASS, ≥2/4 same-object azimuths, ≤10/2 gap profile):
   met or missed with named causes per angle/region/attribute, the roof-diff deltas cited beside
   the verdict.

**Verify:** records above exist and are internally consistent; repro/offline exit 0; barn verdict
+ named causes written into progress.md at this step (not deferred to review).
**Commit 2:** `feat(E-30 T-121-01): barn proof — generated:barn first run, repro/offline receipts,
roof-diff first measurement`.

## Step 3 — legacy re-judge, once, under rotation (16 judge views)

Order: `styled:cottage` → `styled:gatehouse` → `generated:church` → `generated:cottage`
(styled before generated; see structure §4). For **each** chain:

1. Preserve before-state: copy `pr/assets/frames/multi-angle-<slug>.png` →
   `…-t111pin.png` (cottage/gatehouse styled; T-111/T-115-era pins) or `…-prevpin.png`
   (church/cottage generated); copy `multi-angle/<slug>.json` and the milestone record into
   `docs/active/work/T-121-01/before/`.
2. Run `npm run <chain> -- --rotate-pins` (the `--` is load-bearing; a swallowed flag fail-closes
   at the gate's preflight — if that happens, fix invocation, do not bypass).
3. Record per-chain in progress.md: fresh verdict (gapCount, same-object views, kit), artifact
   SHA moved-or-held vs the prior pin, `instrument.diffs === []` (the AC receipt), and the
   T-118 roof-diff delta that explains any movement or residual.

Then judge-free refresh of the diff instrument where its inputs moved:
`npm run diff:roof -- --subject cottage` and `-- --subject church` (generated-path artifacts
re-derived; reconstructed paths re-verify byte-identical). Expected headline: the cottage
cross-gable −3.445 closes (the T-118 fitRidgeLine fix finally judged — the explicit S-121
deferral).

**Comparisons recorded against:** cottage 10/2 with 135°/225° holds; gatehouse 12/2; church 12/2
generated; cottage-generated prior pin (T-118-handoff run). Movement either direction is recorded
as-is; the budget-edge flap (cottage holds) is a known risk, not a defect to retry.

**Verify:** all four fresh gate records committed; every `instrument.diffs` empty (if NOT empty,
that is an instrument-drift finding — stop, name it, do not hand-edit records); before-copies
present; roof-diff records byte-stable on unchanged paths.
**Commit 3:** `feat(E-30 T-121-01): legacy re-judge under --rotate-pins — one run per view` with a
RETIRED PINS section naming every rotated record (T-119 policy §2, the 0eb35c6 precedent):
`multi-angle/{cottage-styled,gatehouse-styled,church-generated,cottage-generated}.{json,md}`,
`styled/{cottage,gatehouse}.{json,md}` + artifact JSONs, `generated/{church,cottage}.{json,md}` +
artifact JSONs, `roof-diff/{cottage,church}-generated.{json,md}`, kit reports + sheets.

## Step 4 — journal + E-12 handoff (judge-free)

1. Append `## E-30 First-run generalization (S-117…S-121, T-117-01…T-121-01) · 2026-06-11` to
   `docs/knowledge/design-learnings.md`, after E-29: the weakest-lens finding closed (T-116 stall
   → T-117 role-aware lens), the diff-then-fit discipline (T-118 instrument refuted every
   pre-named refit; only the evidence repair survived), pin protection + registration smoke as
   preconditions for first-run subjects (T-119/T-120), per-subject outcomes from steps 2–3 with
   the diff deltas — honest on over/under-reach in both directions.
2. E-12 handoff paragraph: the committed `pr/assets/frames/` set (barn first-ever sheets; legacy
   before/after pairs) named explicitly.
3. `npm test` full suite — green is an AC.

**Verify:** suite green; learnings section cites real record paths (no invented numbers).
**Commit 4:** `docs(E-30 T-121-01): design-learnings E-30 — first-run generalization + E-12 handoff`.

## Step 5 — review + RDSPI artifacts

`progress.md` is maintained continuously from step 1 (per-step outcomes, deviations with
rationale). Write `review.md`: changed-file summary, verdict movement tables (before/after per
subject), test coverage assessment, open concerns (e.g. reconstructed-milestone's local
instrumentDiff variant, roof-diff's unguarded writes, any missed bar with named causes).
**Commit 5:** `docs(E-30 T-121-01): RDSPI artifacts — barn proof milestone (research through review)`.

## Testing strategy

- **Unit:** `gate-instrument.test.mjs` only — the sole new pure code. Everything else this ticket
  touches is run-orchestration whose outputs are themselves the test artifacts (records with
  built-in double-run/zero-blob/generalization assertions).
- **Integration:** the runs are the integration tests — `--repro` and `--offline` are explicit
  re-verification harnesses and both must pass for barn; rotation preflight failures are
  fail-closed checks of the pin machinery.
- **Regression:** full `npm test` after step 1 and step 4; roof-diff byte-stability on unchanged
  paths in step 3.

## Risks & responses

| risk | response |
|---|---|
| Barn chain throws mid-stage | pipeline-failed record + named causes = the deliverable (honest fallback); still run legacy steps |
| Judge reply malformed | T-114 ledger, ≤3 same-prompt asks, never a prompt mutation (judge-reply seam memory) |
| Cottage 135°/225° holds flip (budget-edge flap) | record movement honestly with diff deltas; no re-roll |
| Styled artifact SHA moves vs pin (era drift) | named residual — receipt still proves the ruler held; movement explained or flagged |
| `--rotate-pins` swallowed by npm | fail-closed preflight; re-invoke with `--` (memory: npm-run-flag-swallowing) |
| GL/render flake | renders are evidence, never the gate; REFUSE (exit 2) is recorded, not retried into a verdict |
| `instrument.diffs` non-empty | instrument-drift finding: stop that leg, name it in progress/review — do not hand-edit |
