# T-144-01 Progress — glance-true-budget

Status: **Implement complete.** Full suite green (2033/2033); all four anchors hold; no committed
gate record touched; isolation/witnesses green-or-named-SKIP. Five commits, twelve files.

## Steps executed (vs plan)

| step | plan | done | commit |
|---|---|---|---|
| 0 | baseline | npm test green on entry (2020) | — |
| 1 | config `minorBudget=10` | done; contract test extended | `f2b4efe` (folded into core) |
| 2 | pure core: `budgetVerdict` + v2 aggregate + tests | done | `f2b4efe` |
| 3 | runner contract + offline tolerance | done | `bba6616` |
| 4 | head-to-head + receipts dual-report | done | `229c7bb` |
| 5 | calibration sweep + committed evidence | done | `abd33ae` |
| 6 | full regression + isolation + witnesses | done; +milestone snapshots | `665863f` |

(Steps 1 and 2 landed in one commit — the config param and its sole consumer are one coherent unit
and the contract test pins both.)

## What changed

- **`src/config.mjs`** — `MULTI_ANGLE_GATE.minorBudget = 10` added beside the kept `gapBudget: 2`,
  with the derivation in the doc comment.
- **`src/form/multi-angle-gate.mjs`** — new `MULTI_ANGLE_BUDGET_SCHEMA = "multi-angle-budget/v2"`;
  new pure `budgetVerdict()` (identity-first, severity-aware, legacy ≤2 computed beside);
  `aggregateMultiAngle` DECIDE branch rewired to it, returning additive `policy / majorCount /
  minorCount / minorBudget / legacy{}` alongside the kept `passed / gapCount / gapBudget / gaps /
  failures`. REFUSE branch **byte-unchanged**. Parser/prompt/`viewOutcomeLabel`/`gateInstrumentDiff`
  untouched.
- **`src/form/multi-angle-gate.test.mjs`** — contract test asserts `minorBudget===10`; budget cases
  rewritten for v2 (8-minor PASS, 10/11-minor boundary, drifted/coverage FAIL); **new data-driven
  anchor regression** pinning barn/saltcrag PASS, cottage FAIL, synthetic PASS; a `budgetVerdict`
  shared-core unit.
- **`benchmarks/sculpture/multi-angle-gate.mjs`** — contract block emits `minorBudget`; offline
  checker gains a tolerant `budget` clause (v2 records must carry `legacy` + numeric counts; pre-v2
  records unchanged). Render/judge/persist paths untouched.
- **`src/form/head-to-head.mjs`** + **`src/factory/receipts.mjs`** — `gateRow` carries
  `policy/legacyPassed/majorCount/minorCount/minorBudget` (null on v1); md/verdict cells render v2
  beside legacy **only when policy present** → v1 fixtures byte-identical.
- **`benchmarks/sculpture/{proportion,styled}-milestone.mjs`** — budget/resemblance snapshots widened
  additively with the v2 + legacy fields.
- **`benchmarks/sculpture/budget-calibration.mjs`** (NEW) + `package.json` `gate:calibrate` — the
  pure re-derivation sweep; reads committed records read-only, asserts anchors, writes evidence.
- **`benchmarks/sculpture/multi-angle/budget-calibration.{json,md}`** (NEW, committed) — the AC2
  evidence: both arithmetics per decided record, the derivation, the anchor assertions.

## Verification evidence

- `node --test src/form/multi-angle-gate.test.mjs` → 29/29 (was 29 pre-edit; cases rewritten).
- `npm run gate:calibrate` → `anchors ALL HOLD` (barn-patternbook PASS, saltcrag PASS,
  cottage-patternbook FAIL), exit 0; `git status` showed only the two new evidence files dirty.
- `npm run gate:multi -- --subject {barn,cottage} --label patternbook --offline` → committed v1
  records **still valid** ("contract OK", "aggregate well-formed").
- `npm run visibility:repro` → exit 0, byte-identical or named-SKIP (gatehouse-current SKIPs on its
  T-138 artifact-pin, the T-142 semantic) — unaffected by this ticket (no record changed).
- `npm test` → **2033/2033** after every code change; isolation (frozen-seam) scan inside it green.

## Deviations from plan

1. **Steps 1+2 merged into one commit** — the config parameter is meaningless without its consumer;
   the contract test pins both. No scope change.
2. **Milestone snapshots widened (Step 6 addition).** The plan flagged the milestone runners as
   "read gapCount/gapBudget which persist." On reflection AC3 names the *milestone composer* as a
   producer that must report v2-beside-legacy, so both snapshot sites were additively widened. No
   test pins those snapshots (verified); fully additive; suite stayed green.
3. **No `budget-calibration.test.mjs` written.** The plan made it optional; the four-anchor AC2 proof
   lives as a pure unit in `multi-angle-gate.test.mjs` (runs under the glob, no IO), and the sweep
   self-asserts the anchors at runtime (non-zero exit on mismatch). A separate test file would
   duplicate the same arithmetic. Folded, not skipped.

## Open items for Review

- Whether the deeper chain runners (`generated-milestone`, `challenge-milestone`) that read
  `gate.resemblance?.gapCount/gapBudget` should also carry the legacy block — they currently read the
  persisted legacy fields, which remain correct; deferred as a judgement call for review.
