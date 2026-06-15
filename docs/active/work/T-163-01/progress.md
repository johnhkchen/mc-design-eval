# T-163-01 — Progress

## Completed (all plan steps)

- **Step 1 — `src/pack/departments.mjs` + DPT1/DPT2/DPT4.** Pure `.mjs`: `DEPARTMENTS`
  (CHIMNEY/OPENING/ROOF/ROOM/WALL, frozen+sorted), `departmentOf` (counts SPECIFIC predicate
  matches; throws on >1 = "serves two departments"; falls through to WALL), `departmentToIdioms`
  (validates dept, sorted), `departmentPartition`. Tests green (DPT3 stubbed-in then validated in
  Step 3). Commit `6715c9c`.
- **Step 2 — `baml_src/department.baml`.** `enum Department`, `CritiqueItem`, `Critique`,
  `DiagnoseBuild` carrier (stub prompt). `npm run baml:gen` regenerates `baml_client` with
  `DiagnoseBuild` present in `parser.ts`/`*_request.ts`. Commit `c9236db`.
- **Step 3 — DPT3.** Reads `baml_src/department.baml`, regexes the `enum Department { … }` body,
  asserts the value set === `DEPARTMENTS`. Green. (Folded into the same test file; landed with the
  test commit `6715c9c` already containing DPT3 and the partition independence — the `.baml` only
  needed to exist for it to pass, which Step 2 provided.)
- **Step 4 — bridge FNS + fixtures + CC1–CC3.** `bridge.mts` gains the `DiagnoseBuild` FNS entry
  (no new `baml_client` importer). Fixtures `reply.txt` / `expected.json` (minted from the parser,
  not hand-authored) / `reply-bad-department.txt`. `critique-contract.test.mjs` green. Commits
  `c9236db` (bridge) + `9f83b99` (test + fixtures).
- **Step 5 — full suite.** `npm test` → **2200/2200 pass**. transport-guard TG1–TG5 green.

## Deviation from plan — the "reject" fixture (recorded)

Plan Step 4 assumed an unknown `department` enum value would make `b.parse` **reject**. Empirically
(BAML 0.222.0 SAP) it does **not**: the offending item is **dropped**, yielding `{ items: [] }` —
the all-array-fields leniency (FX-D1's family). Bare prose with no JSON object, however, **does**
reject.

This is a genuine finding, not a blocker, and it strengthens the contract's honesty:
- **CC2** now pins the drop-to-empty behavior and documents that **the `Department` typing is a
  filter, not a gate** — S-164's reply gate must classify an emptied `items` list as malformed
  (b.parse alone won't flag it), exactly as the decompose runner must (FX-D1).
- **CC3** pins that bare prose rejects.

No schema change was needed — the finding is about SAP coercion semantics, which the tests now
document rather than the prompt forcing.

## Not done (correctly out of scope)

- No diagnostic prompt body, no runner, no creation-loop wiring (S-164).
- No render/golden pin for `DiagnoseBuild` (its prompt is a stub S-164 rewrites — pinning bytes now
  would guarantee an immediate break; render-pinning starts in S-164).
- Proportion routing not implemented — recorded as a separate axis for S-164/166 to consume.

## Files touched

Created: `src/pack/departments.mjs`, `src/pack/departments.test.mjs`,
`baml_src/department.baml`, `src/baml/critique-contract.test.mjs`,
`src/baml/fixtures/critique-contract/{reply.txt,expected.json,reply-bad-department.txt}`.
Modified: `src/baml/bridge.mts` (one FNS entry).
