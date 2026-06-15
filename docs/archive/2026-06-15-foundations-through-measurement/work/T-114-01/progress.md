# T-114-01 — judge-reply-robustness — Progress

## Completed

- **Step 0 — baseline**: `npm test` green (1499/1499); church-challenge offline re-assert OK
  (REFUSAL `unparsed:-x-z` recorded, record shape valid). Working tree carried unrelated
  sibling-ticket files → all commits path-scoped.
- **Step 1 — pure policy** (`cff6839`): `src/form/judge-reply.mjs` + 18-case suite. classifyReply
  / nextAction / runReplyPolicy; `MAX_REPLY_ATTEMPTS = 3` (1 ask + 2 re-asks); ledger entries with
  per-attempt parse status, usage, source; seeded attempts count toward the bound; transport
  throws are malformed attempts; rawReply clipped at 400. Structural no-re-roll proofs: parsed
  entry anywhere ⇒ `nextAction` "final" for every bound; first-ask-parses ⇒ askCount 1;
  seeded-parsed ⇒ zero asks.
- **Step 2 — instrument tripwire** (`7a0ae52`): `gateInstrumentDiff` added to the gate pure core
  (only addition — prompt/parser/aggregate untouched) + 5 test cases (26 total in the module
  suite). Parsed views must be byte-equal *entirely* (usage included); the unparsed view
  completing to verdict+replies is the one allowed change.
- **Step 3 — live wiring** (`8f16550`): runner judges through `judgeThroughPolicy` (one thunk per
  view, prompt built once, pinned model); `replies[]` persisted on every judged view; offline
  gains guarded `replies`/`rejudge` checks. Pre-T-114 records re-asserted valid (church REFUSAL +
  synthetic-hut PASS).
- **Step 4 — gate:rejudge** (`642b8e1`): `--rejudge` mode + npm script. Pin check before any
  metered call; refuses fully-parsed records ("re-judging parsed verdicts is impossible by
  construction"); zones/coverage/kitPresence copied, never recomputed; write refused unless
  instrument-diff empty. Guard rails verified live: cottage-styled (no unparsed) and an absent
  record both refuse, exit 2.
- **Step 5 — the AC run** (`cf95751`): `npm run gate:rejudge -- --subject church --label
  challenge`. Recovered on attempt 2 — ledger `[(1, malformed, committed), (2, parsed, live)]`;
  verdict "different object" (3 major). Aggregate **decided FAIL** (gaps 11/2; all four views
  named in failures), kit-aware FAIL, exit 1. Verified: the three parsed views byte-identical
  (json-equality per view vs HEAD), instrument fields all equal, `rejudge.instrumentDiff: []`,
  offline re-assert green under the new ledger checks, `npm test` 1499/1499.

## Deviations from plan

- None of substance. One test fixture fix mid-step-2 (the mutation "clear the gaps" was a no-op
  on a zero-gap fixture view — replaced with a verdict-string mutation). The `--rejudge` branch
  sits *before* the `--offline` branch in `main()`; both flags together behave as rejudge (noted
  in review as a non-issue: the modes are disjoint in every script/doc).
- The in-dir sheet PNG turned out to be gitignored (`multi-angle/**/*.png`); the committed sheet
  is the `pr/assets/frames` copy, as the existing convention already had it. Plan's artifact list
  adjusted accordingly.

## Remaining

- review.md (Review phase artifact).
