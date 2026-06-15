# T-114-01 — judge-reply-robustness — Review

## What changed (5 commits, all path-scoped)

| Commit | Files | Change |
|---|---|---|
| `cff6839` | `src/form/judge-reply.mjs` (new), `src/form/judge-reply.test.mjs` (new) | The pure reply policy: classify / nextAction / runReplyPolicy, `MAX_REPLY_ATTEMPTS = 3`, ledger semantics, seeding, transport-throw handling |
| `7a0ae52` | `src/form/multi-angle-gate.mjs`, `src/form/multi-angle-gate.test.mjs` | `gateInstrumentDiff` (pure addition — prompt/parser/aggregate byte-untouched) + 5 cases |
| `8f16550` | `benchmarks/sculpture/multi-angle-gate.mjs` | Live path judges through the policy (`replies[]` on every judged view); guarded offline `replies`/`rejudge` checks; header |
| `642b8e1` | same runner, `package.json` | `--rejudge` mode + `gate:rejudge` script |
| `cf95751` | `multi-angle/church-challenge.{json,md}`, `pr/assets/frames/multi-angle-church-challenge.png` | The AC run's committed record |

No files deleted. No schema bump (`multi-angle-gate/v1` + additive fields, T-100 precedent).

## Acceptance criteria — status

1. **Reply schema validation, pure, unit-tested** — DONE. `classifyReply(text, parse)`: parsed ⇒
   final verdict; parser throw ⇒ malformed, a distinct state carrying the parser's evidence.
   `parseMultiAngleVerdict` itself unchanged.
2. **Bounded re-ask on malformed only; every reply committed** — DONE. Declared limit
   `MAX_REPLY_ATTEMPTS = 3` (1 initial + 2 re-asks); the ask thunk closes over the fixed prompt +
   pinned model once, so re-asks are byte-identical (explicitly NOT the sdk-binding artifact-retry
   pattern, which mutates the prompt). Synthetic tests: recovers on attempt 2; exhausts to null
   verdict ⇒ existing `unparsed` ⇒ REFUSAL. `replies[]` with per-attempt parse status / usage /
   source persisted on the view.
3. **No re-roll by construction** — DONE, three structural proofs in the unit suite: a parsed
   entry anywhere makes `nextAction` return "final" for *every* bound; first-ask-parses ⇒ exactly
   one ask; a seeded parsed reply ⇒ **zero** asks ("the policy cannot be invoked on a parsed
   reply"). Runner-level: `gate:rejudge` hard-refuses a record with no unparsed view (verified
   live, exit 2).
4. **The church 225° regression** — DONE. `npm run gate:rejudge -- --subject church --label
   challenge`: recovered on attempt 2 (ledger seeds the committed truncated reply as attempt 1);
   verdict "different object", 3 major gaps. Aggregate `REFUSAL (unparsed:-x-z)` → **decided
   FAIL** (gaps 11/2, failures name all four angles), kit-aware FAIL, exit 1. The three parsed
   views verified byte-identical against HEAD before committing.
5. **I/O handling only; instrument-diff; npm test green** — DONE. No threshold/azimuth/contract/
   prompt/model change (`git diff` on the pure core shows only the `gateInstrumentDiff` addition).
   `record.rejudge.instrumentDiff: []` committed in the record; the offline mode now re-asserts
   it, plus the ledger invariants (bounded; parsed only in last position — the no-re-roll rule is
   auditable on the committed artifact itself). `npm test` 1499/1499 after every commit.

## Test coverage

- **New unit coverage**: 18 cases (judge-reply) + 5 cases (gateInstrumentDiff). The policy suite
  includes the real parser over the church truncation shape, seeding, the bound arithmetic,
  transport throws, clipping, and input validation. All offline.
- **Offline integration**: pre-T-114 committed records (church REFUSAL-shaped, synthetic-hut
  PASS-shaped) re-assert green through the extended checks; the re-judged record re-asserts green
  through the *active* ledger/rejudge checks.
- **Gaps (known, accepted)**:
  - `rejudgeMain` and `judgeThroughPolicy` are impure runner code — not unit-tested (project
    convention: benchmarks are outside the test glob; spec §4 metered seams untested). Their
    decision logic is all delegated to the unit-tested pure functions.
  - The artifact-pin-mismatch refusal was code-reviewed (sha check ordered before any
    render/metered call) but not exercised — doing so requires mutating a committed artifact.
  - The transport-throw path was unit-tested but has not occurred live.

## Open concerns / notes for a human reviewer

1. **The church challenge record is now an honest FAIL, not a pass.** Expected and stated in the
   plan: the other three views were already "drifted (major)". The E-29 closure milestone's open
   `unparsed:-x-z` seam is closed; the roof-form/massing gaps it names are the already-known
   T-112 territory.
2. **Seeded ledger ↔ bound interaction**: the committed malformed reply counts as attempt 1, so a
   re-judge gets at most 2 live asks. Deliberate (the bound spans the view's whole history), but
   it means a twice-re-judged record could exhaust without any live ask ever being allowed again
   — which is the correct reading of "bounded", just worth knowing.
3. **`--rejudge` takes precedence over `--offline`** if both flags are passed (the branch sits
   first). The combination appears nowhere; an explicit mutual-exclusion error would be a one-line
   hardening if wanted.
4. **The sibling E-22 seam** (`benchmarks/sculpture/resemblance.mjs`) still has the old
   single-parse shape. The policy module is parser-parameterized precisely so that adoption is
   mechanical — separate ticket if wanted.
5. **`view.judge.usage` now means "the final attempt's usage"** (per-attempt usage lives in
   `replies[]`); on a re-judged view the original usage is preserved in `replies[0].usage`. No
   consumer reads `judge.usage` programmatically (checked: only the md/record writers).
6. Working tree still carries unrelated sibling-ticket modifications (`styled-milestone.mjs`,
   `styled/church.*`, `.lisa*`, ticket files) — untouched by this ticket's commits.

## How to re-verify quickly

```
node --test src/form/judge-reply.test.mjs src/form/multi-angle-gate.test.mjs   # pure proofs
npm run gate:multi -- --subject church --label challenge --offline             # record + ledger re-assert
npm test                                                                       # 1499/1499
git show cf95751 -- benchmarks/sculpture/multi-angle/church-challenge.json     # the spliced view
```
