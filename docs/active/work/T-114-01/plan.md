# T-114-01 — judge-reply-robustness — Plan

Six steps, each independently verifiable; steps 1–4 are offline-committable; step 5 is the one
live, metered run (the church 225° re-judge). Baseline first.

## Step 0 — Baseline (no commit)

- `npm test` at HEAD → record pass/fail count (expected green; T-112/T-113 sessions left it green).
- `npm run gate:multi -- --subject church --label challenge --offline` → expect the committed
  REFUSAL record to re-assert OK (this is the *before* proof the offline checks accept the
  pre-`replies[]` shape — it must STILL pass after step 3).
- Note: working tree carries unrelated modified files from sibling tickets
  (`styled-milestone.mjs`, `church.json/md`, `.lisa*`, ticket files). **Commits must be
  path-scoped** — only files this ticket touches; never `git add -A`.

## Step 1 — `src/form/judge-reply.mjs` + `src/form/judge-reply.test.mjs`

The pure policy module and its suite, exactly per structure §1–2.

Verify: `node --test src/form/judge-reply.test.mjs` — all cases green, including the three
structural no-re-roll proofs (parsed-anywhere ⇒ `nextAction` "final"; first-ask-parses ⇒
`askCount===1`; seeded-parsed ⇒ zero asks) and the AC pair (recovers on attempt 2; exhausts to
null verdict after 3 all-malformed entries).

Commit 1: `feat(E-29 T-114-01): judge-reply policy — malformed is a state, verdicts are final`

## Step 2 — `gateInstrumentDiff` in `src/form/multi-angle-gate.mjs` + test cases

Append the export (structure §3); extend `src/form/multi-angle-gate.test.mjs` (structure §4).
Build the test fixtures as a minimal 4-view record literal + structuredClone mutations.

Verify: `node --test src/form/multi-angle-gate.test.mjs` — new cases green, all 2xx existing
assertions untouched and green (`git diff` on the module shows pure addition).

Commit 2: `feat(E-29 T-114-01): gateInstrumentDiff — the re-judge's untouchable set, unit-pinned`

## Step 3 — Runner live-path wiring + offline additions + header

`benchmarks/sculpture/multi-angle-gate.mjs` per structure §5 (live block swap, per-attempt
logging, guarded `replies`/`rejudge` offline checks, header paragraph).

Verify (all offline — no metered call):
- `npm test` green (runner isn't in the test glob, but imports must still parse: `node --check`
  equivalent via the offline run below).
- `npm run gate:multi -- --subject church --label challenge --offline` → still OK (record
  predates `replies[]`; guards must skip, not fail).
- Same offline re-assert for one PASS-shaped record (`--subject synthetic-hut --label current`)
  to cover the other branch.

Commit 3: `feat(E-29 T-114-01): gate judges through the reply policy — every reply a ledger entry`

## Step 4 — `--rejudge` mode + npm script

Runner branch per structure §5; `package.json` gains `gate:rejudge`.

Verify offline (the mode's guard rails, cheap and unmetered):
- `npm run gate:rejudge -- --subject cottage --label styled` (or any fully-parsed committed
  record) → must **throw** "no unparsed view" with no file written, nonzero exit.
- `npm run gate:rejudge -- --subject church --label nonexistent` → "committed record absent".
- Artifact-pin negative: not easily testable without mutating a committed file — covered instead
  by code review of the pre-metered sha check ordering (sha check before any render/judge).

Commit 4: `feat(E-29 T-114-01): gate:rejudge — completes I/O on a committed record, parsed verdicts untouchable`

## Step 5 — The church 225° re-judge (LIVE, metered — the AC run)

```
npm run gate:rejudge -- --subject church --label challenge
```

Expected: sha pin OK; one target (`-x-z`); ledger seeded with the committed truncated reply;
1–2 live attempts; on recovery the aggregate becomes **decided** (almost certainly FAIL — the
three parsed views are "drifted"; honesty, not a pass, is the deliverable); `overall` decided FAIL
(kitPresence already failing); `rejudge.instrumentDiff === []`; exit code 1.

Post-run verification:
- `npm run gate:multi -- --subject church --label challenge --offline` → OK under the new checks
  (replies ledger well-formed, no-entry-after-parsed, rejudge block consistent).
- `git diff benchmarks/sculpture/multi-angle/church-challenge.json` — eyeball: the three parsed
  views byte-identical; changes confined to the `-x-z` view (`replies[]`, verdict, judge),
  `aggregate`, `overall`, `rejudge`, sheet bytes, md.
- `npm test` green.

If the policy *exhausts* (2 more truncations): the record keeps REFUSAL but now carries the full
ledger — commit that honestly, note it in review.md as the open concern, and do NOT raise the
bound or mutate the prompt (the rule held; that outcome is the policy working).

Commit 5: `feat(E-29 T-114-01): church 225° re-judged under the policy — REFUSAL resolved to a decided verdict`
(or, on exhaustion: `…— REFUSAL stands, ledger committed`)

## Step 6 — progress.md upkeep + review.md

`progress.md` updated after each commit (step, deviation notes). Then the Review-phase artifact.

## Testing strategy summary

| Layer | Mechanism | Step |
|---|---|---|
| Reply policy (classify / nextAction / driver / seed / transport / clip) | unit, synthetic thunks | 1 |
| No-re-roll by construction | unit ×3 (the AC proof) | 1 |
| Instrument diff | unit, record fixtures | 2 |
| Live wiring regression | offline re-asserts of committed records (old shape must stay valid) | 3 |
| Re-judge guard rails | CLI negative runs (no-unparsed, absent record) | 4 |
| The AC run | live metered re-judge + offline re-assert + manual record diff | 5 |
| Whole-suite | `npm test` after every commit | all |

## Risks / contingencies

- **Live reply truncates again**: bounded by design; commit the ledgered REFUSAL (step 5 note).
- **Sibling-session file contention**: only `package.json` and the runner are shared surfaces;
  path-scoped commits + re-run `git status` before each commit.
- **Sheet labeling**: node-canvas absence degrades to unlabeled sheet (existing fallback) — not a
  blocker; record `labeled:false` as the live path already does.
- **`recordMd` regression**: md is regenerated for an existing committed record — diff the md to
  confirm only the table row + new section change.
