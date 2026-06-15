# T-132-01 factory-milestone — Plan

Ten steps, each a commit boundary; a spend interruption at any boundary strands nothing.
Code seams land before any model spend; every live run is preceded by a shim probe and a
pin preflight; every record is verified replayable before the next step builds on it.

## Step 0 — Preflight (no commit)
- Sibling check (lisa-same-ticket-concurrency): mtimes under `packs/drafts/`, `packs/`,
  `docs/active/work/T-130-01/`; recent commits. If a T-130 session is actively writing
  (mtimes < ~10 min), monitor until quiet before consuming its outputs; never co-write.
- Baseline: `npm test` green (expect ~1893 pass); `npm run patternbook:repro` and
  `patternbook:offline` green (the byte-assert this ticket must not break).
- Spend probe: one minimal `claude -p 'ok'` through the shim; a zero-token notice reply
  means the monthly limit is back — stop and record (spend-limit-reply lesson).
- Record in progress.md: registry **before** snapshot (`brushNames()` — expect 19 + names),
  current git ref.

## Step 1 — Pack parameterization seam (commit 1)
- `seed.mjs`: `DEFAULT_PACK_REL`, `packNs`, `chainRels` (+ unit tests: rustic → legacy
  unsuffixed paths; other slug → `--slug` suffix everywhere; bad slug throws).
- `pattern-book.mjs`: `--pack`/`--ticket` flags, seamPack/buildPack split, paths via
  `chainRels`, workshop spawn passthrough; repro/offline/plan-only honor `--pack`.
- `workshop.mjs`: `--pack` flag, per-invocation subject derivation, namespaced pins.
- `package.json`: the five new scripts (structure §A).
- **Verify**: new units green; `npm test` full green; `patternbook:repro` + `:offline`
  byte-identical (proves committed rustic behavior unmoved); `isolation.test.mjs` green
  (both runners rescanned); grep both runner sources for `saltcrag|barn--` → no hits.

## Step 2 — Acquire the ratified saltcrag pack (commit 2 if produced here)
- If `packs/saltcrag.json` exists (sibling delivered): verify instead of produce —
  `node scripts/validate-pack.mjs packs/saltcrag.json`, ratification field present,
  `formation-replay.test.mjs` green, draft records present under `packs/drafts/saltcrag/`.
- Else: probe shim, then `npm run style:form -- --story-replay vernacular --slug saltcrag`
  (stage 1 free from the committed fixture; 3 live stages, ≤3 asks each, full raws
  ledgered), inspect the draft README (the ratification sheet: near-tone report, role
  coverage, idiom seeds), then
  `npm run style:ratify -- --style saltcrag --by "lisa/T-132-01 (planner sanction via ticket AC)" --note "provisional — autonomous run; human taste pass pending (T-130 step 7 posture)"`.
- **Gate before proceeding**: saltcrag `palette[].role` set ⊇ roles used by
  `recognition/barn.program.json`, and `idioms[]` ⊆ `brushNames()` ∪ (backlog items to be
  built) — if a load-bearing role is missing, that is a formation finding: record it,
  re-form once with the same brief (a fresh run, not a record edit), never hand-patch a pack.
- **Verify**: `npm test` green (replay test now sweeps the saltcrag draft byte-identically).

## Step 3 — Saltcrag backlog (commit 3)
- Probe shim; `node scripts/design-backlog.mjs --pack packs/saltcrag.json`.
- **Verify**: drafts + records under `docs/active/backlog/`; ledger `accepted: true`, dedup
  counts recorded; `--offline` re-run byte-identical; `npm test` green (scan-dir assertion).
- Record in progress.md: items vs notes counts (the factory's specification of the gap).

## Step 4 — Promotion (commit 4)
- For each saltcrag **new-brush work item**: stamp draft frontmatter
  (`promoted_by: planner-sanction/T-132-01`, date, `ticket: T-132-01`), add README rework-log
  row (rework: pending). Audit the parametrization notes against the registry (the T-131
  review's unaudited-mapping concern) — a wrongly-demoted genuine need gets promoted too,
  named as an audit finding.
- **Verify**: drafts remain outside scan dirs (nothing moves into `docs/active/tickets/`);
  `npm test` green.

## Step 5 — Implement the gap brushes (one commit per brush)
- Per draft, in backlog order: technique source (`src/view/…`), unit tests (draft's test
  plan), registry entry through the single door (kind, composition, paramsSchema accepting
  `{}`, preview, source+tests paths). Record any divergence from the draft's sketch in the
  draft's `rework:` + README row (the T-131 quality metric, measured at last).
- **Verify per brush**: its units green; `validateBrushRegistry` + brush-door conformance
  green; full `npm test` green. After the last brush: `npm run brush:catalog` regenerated;
  registry **after** count recorded in progress.md.

## Step 6 — The building (commit per run)
- Probe shim; `npm run patternbook:barn:saltcrag` — seam verify (rustic) → seed under
  saltcrag (conformance must pass or the chain refuses to spend) → workshop live (≤6
  ledgered rounds) → component plan → chain record. All first writes (namespaced).
- **Verify**: record status not `pipeline-failed`; generalization grep `clean: true` in the
  record; `npm run patternbook:saltcrag:repro` and `:offline` — committed program + ledger
  replay **byte-identical** (the AC's named npm run); rustic `patternbook:repro` still green.
- If seed conformance fails (e.g. a saltcrag idiom param the realizer rejects): honest
  `pipeline-failed` record is committed as evidence; fix forward in the *brush/params* (a
  code defect) or record a formation finding — never weaken the gate.

## Step 7 — The frozen-gate run (commit)
- Probe shim; `npm run gate:patternbook:barn:saltcrag` — the epic's only judge call: fresh
  renders, 4 views, coverage precondition, T-114 reply policy, instrument receipt.
- **Verify**: record + md + sheet written (first writes); `instrument.frozen` with
  `diffs: []`; every view's `replies[]` within budget; offline re-assert
  (`gate:multi -- --subject barn --label patternbook-saltcrag --offline`). If a view
  refuses 3×: `gate:rejudge` completes the committed record (judge-reply seam), no re-roll.
- Expected shape (named in advance, design D5): same-object likely holds (same program
  form), palette attributes diverge by construction — the verdict is recorded as it falls.

## Step 8 — Receipts (commit)
- `src/factory/receipts.mjs` + tests (synthetic-input units: counts, reuse fraction =
  |saltcrag idioms ∩ rustic idioms| / |saltcrag idioms| alongside newly-built count, rework
  rows, byte-stability) + `scripts/factory-receipts.mjs`; run `npm run factory:receipts`.
- **Verify**: `receipts.{json,md}` — one table: registry 19→N, reuse fraction, draft-rework
  measure, cost shape (model calls per stage from the ledgers), verdict + conformance side
  by side, honest worse/better line vs barn-patternbook (rustic best). Re-run → byte-identical.

## Step 9 — Journal + E-12 handoff (commit)
- `docs/knowledge/design-learnings.md`: `## Brush factory (E-32)` — the
  design-once-reuse-many thesis with the receipts numbers; diegetic-materials precedence in
  practice (story→palette citations); what the factory got right/wrong (over/under-reach,
  e.g. demotion aggressiveness, rework found); the frozen-gate finding named. **E-12
  handoff** block: consumable paths (receipts, gate records/sheets, chain records, pack).
- **Verify**: `npm test` full green; AC trace written into progress.md.

## Step 10 — Review (review.md, no further code)
- Files created/modified/deleted; test coverage + gaps; open concerns ranked (provisional
  ratification pending human taste pass; rustic drafts still unpromoted; any spend refusals;
  gate-policy questions deferred).

## Testing strategy (summary)
- **Unit**: packNs/chainRels, receipts composer, each new brush (its draft's test plan).
- **Structural guards** (must stay green, unchanged): isolation scan, brush-door, formation
  guards, transport guards, pin-guard domain tests.
- **Integration (exit-coded, not in npm test)**: rustic patternbook repro/offline before and
  after step 1; saltcrag repro/offline after step 6; gate offline after step 7.
- **Live evidence**: ledgers + raw replies committed at every spending stage (the T-114
  shape) — the run itself is the integration test, replayable forever.

## Risks & fallbacks
- **Spend limit returns**: stop at the current commit boundary, ledger the refusal,
  progress.md names the resume point (artifact-insurance).
- **Sibling delivers saltcrag mid-step-2**: consume theirs; ours never starts (check before
  spending, not after).
- **Backlog yields 0 new brushes**: steps 4–5 collapse to the notes audit; reuse fraction
  1.0 is the receipt; the epic's claim is tested by the table either way.
- **Gate coverage-refuses** (cottage precedent): the verdict is recorded honestly with
  per-view causes; the comparison row carries the under-statement warning the head-to-head
  composer already implements.
