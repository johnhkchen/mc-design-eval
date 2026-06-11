# T-129-01 baml-design-functions — Progress

Phase: Implement. All 8 planned steps complete; one plan deviation (recorded at step 7).

| Step | Commit | State |
| --- | --- | --- |
| 1. Four BAML sources + codegen wired (`pretest` → `baml:gen`; `baml:mint` script) | `060572e` | done |
| 2. The one bridge (`bridge.mts` batch render/parse + `bridge.mjs` spawn seam) + transport/judge guards (TG1–TG5) | `f81d2cd` | done |
| 3. Recognition migration — render sha == committed `promptSha256` (cottage AND barn, first try); runner on `bamlRender`; `buildRecognitionPrompt` retired; FX-R1–R3; `recognize:offline` byte-identical | `54b988b` | done |
| 4. Critique migration — golden captured BEFORE retirement; `critiqueRenderArgs`; loop hands round CONTEXT across the exchange seam; ISO4 bans `baml` in the pure core; B/L test groups ported; FX-C1–C3; replay+offline clean | `85a89a8` | done |
| 5. Workshop runner asks through the bridge (sibling T-127-01 had committed; clean re-read, single-file commit) | `cd03069` | done |
| 6+7. `registryDigest()` + mint runner + LIVE fixtures (vernacular, decompose — both accepted on attempt 1, T-114 ledgers with usage + full raws); FX-V1/FX-D1 | `414b508` | done |
| 8. Proof sweep + RDSPI artifacts | this commit | done |

## Deviations from plan

1. **`params` is a BAML keyword** — `WorkshopAdjustParams.params` became `spec_params
   @alias("params")` (wire format unchanged; plan's codegen-decides clause).
2. **FX-D1 could not assert rejection** — SAP never rejects a class of only array fields: every
   malformed reply (prose, null, wrong types, items missing required fields) degrades to the
   EMPTY backlog. Pinned as an explicit leniency test instead, documented in `decompose.baml`:
   **T-131's reply gate must classify the empty union as MALFORMED** (b.parse alone cannot).
3. **Mint runner implements its own bounded same-prompt loop** (T-114 semantics, identical
   ledger fields) instead of `runReplyPolicy`: `classifyReply` is sync, the bridge parse is
   async, and `judge-reply.mjs` is judge-path surface this ticket must not touch.
4. **No `--rotate-pins` needed anywhere** — recognition prompts reproduced byte-identically, so
   no committed pin moved.

## Live spend

Exactly 2 model calls (plan's budget): one per new function, strong tier
(`claude-opus-4-8`), `claude -p` subscription shim via `requestText`, pin-guard preflight
before spend, both accepted on attempt 1. Ledgers:
`src/baml/fixtures/{vernacular,decompose}/ledger.json` (full `rawTexts`, per-attempt usage,
`promptSha256`, transport noted).

## Verification at HEAD

- `npm test`: **1849/1849** (includes `pretest` codegen, 8 fixture tests, 5 guard tests).
- `npm run recognize:offline`: cottage + barn artifacts REPRODUCE byte-identically, conformance PASS.
- `npm run workshop:replay`: BYTE-IDENTICAL; `npm run workshop:offline`: re-asserted clean.
- Proof greps (all zero): retired builders referenced nowhere; judge-path files contain no baml
  token; facade-era `baml_src/` files untouched; prompt prose absent from both migrated runners;
  `ANTHROPIC_API_KEY` absent from every non-test `.mjs` under src/benchmarks/scripts.

## Concurrency note

T-127-01 (sibling session) landed its styled-house milestone interleaved with this ticket's
commits, including live workshop runs through the migrated exchange path after `cd03069` —
its records replay byte-identically, which doubles as an end-to-end check of the bridge-rendered
critique prompt on real subjects.
