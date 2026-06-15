# T-131-01 design-backlog-factory — Progress

Implement-phase journal. Plan steps executed in order; deviations recorded inline as they
happened. Two sessions touched this phase: the original (died after Step 4's first, refused
live attempt, ~15:10) and the recovery session (this one, ~17:20) which completed Step 4
and wrote this file plus review.md.

## Step 1 — shared async reply policy ✅ (commit ff508f9)

`src/baml/reply-policy.mjs` (`runAsyncReplyPolicy`, `MAX_REPLY_ATTEMPTS`) +
`src/baml/reply-policy.test.mjs` (bounded re-asks, parsed-is-final, ledger shape).
`scripts/mint-baml-fixture.mjs` refactored onto it in the same commit; committed fixtures
under `src/baml/fixtures/` untouched; ledger field names/order preserved. T-114 constants
imported FROM the frozen judge core — the judge path gains nothing (TG4 green).

## Step 2 — pure factory module ✅ (commit af05235)

`src/factory/backlog.mjs` + `src/factory/backlog.test.mjs`:

- `enforceRegistryDedup` — AC3 both ways: owned-name item demoted to a parametrization
  note (+ `demotions[]` ledger entry); new-name item kept; unknown `existing_brush` on a
  note → `warnings[]`; clean input → no-op. Unit-tested in both directions.
- `assertNonEmptyBacklog` — the FX-D1 classifier: empty union (no items, no notes) is
  MALFORMED, not a verdict, so it consumes a re-ask instead of being accepted.
- `lisaScanDirs` / `isOutsideScanDirs` — parsed from the REAL `.lisa.toml`; the test
  asserts `docs/active/backlog` is outside every scan dir (AC1's config assertion),
  plus synthetic inside/outside verdicts and prefix-collision safety.
- `renderDraft` / `renderNotes` / `backlogFiles` — every draft carries the six
  quality-contract sections + checkboxed ACs; no `id:` / `story:` / `phase:` keys
  anywhere in a rendered draft (lisa-vocabulary absence is tested); deterministic bytes.
- `packSummary` moved here from the mint script (same commit, no orphaned duplicate);
  pinned byte-equal to the committed decompose fixture's `style_summary`.

## Step 3 — runner + promotion doc ✅ (commit 9d2a99f)

`scripts/design-backlog.mjs` (live / `--offline` / `--rotate-pins`; records preflighted
before any spend per T-119; drafts pin-guarded per-file at write time — a committed reply
makes drafts re-derivable spend-free), `docs/active/backlog/README.md` (human-only
promotion flow + the rework log table, E-32 Rule 3 language), `package.json`
`backlog:generate`. No-spend verifications passed: missing `--pack` → usage error;
`--offline` before records → clear refusal; TG2 green; `npm test` green.

## Step 4 — live proof against rustic ✅ after one refused run (commit 71249e5)

**Deviation (journaled):** the first live run (15:10) was refused 3×/3 — every reply was
the subscription notice "You've hit your monthly spend limit", zero tokens, classified
MALFORMED by FX-D1 as designed. The ledger with `accepted: false` and the full raw texts
was written to disk and the runner exited 1, exactly per the plan's risk contingency. The
session died before committing it or writing progress/review.

**Recovery (this session):** `npm test` confirmed green (1875), a minimal shim probe
confirmed the spend limit had lifted, then the live run was re-issued with
`--rotate-pins` — rotation sanctioned by the plan ("the run is this ticket's own live
proof") since the refused records were uncommitted and superseded. Result:

- **Accepted on attempt 1** — 4 brush drafts (`window.lattice`, `opening.door`,
  `roof.fascia`, `dressing.pier`), **19 parametrization notes**, 0 demotions, 0 warnings.
- `fixturePromptMatch: true` (registry digest unchanged since the fixture mint —
  recorded, not asserted).
- Full raw reply (14,099 chars) committed in `ledger.json` `rawTexts`.
- `--offline` replay: **5/5 byte-identical, 0 drifted, exit 0**.
- `git status` clean of writes outside `docs/active/backlog/` + the work dir.
- `npm test` green after the run (1875 pass / 0 fail).

Note on the refused ledger: it was never committed (the session died first), and rotation
overwrote it on disk; its content (3× spend-limit raws) is reproduced in this journal and
in review.md rather than in git history. The plan's "ledger committed anyway" applied to
a refusal that *ends* the run — here the re-run superseded it under the same ticket.

**Deviation from the fixture precedent:** the plan expected drafts echoing the fixture
(opening-fill, corner-dressing, buttress). The live model decomposed differently — 4 new
brushes + 19 notes mapping needs onto brushes the registry already owns. 0 demotions
means the prompt steered dedup upstream; the code gate's behavior remains pinned by
Step 2's unit tests (both directions), so AC3 does not depend on this run exercising it.

## Step 5 — review ✅ (this commit)

This file + `review.md`. Remaining half of AC5 is a human act by design: promote ≥1
draft from `docs/active/backlog/` into `docs/active/tickets/`, let lisa execute it, and
record rework in the README table + the draft's `rework:` frontmatter. The factory may
not promote its own output (E-32 Rule 3).
