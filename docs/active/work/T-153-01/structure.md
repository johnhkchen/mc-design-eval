# T-153-01 Structure — file-level blueprint

Three files modified. No files created or deleted. No schema, no new module, no new flag. Pure
edits inside the `--repro` and `--offline` mode blocks of the three milestone runners.

## Files modified

### 1. `benchmarks/sculpture/generated-milestone.mjs`

**`--repro` block (≈495–517).** Replace the fresh-vs-committed comparison with a fresh-vs-fresh
determinism proof.

- Remove: `const rec = ...reproducible.sha256`, `want`, and the `got === want` boolean.
- Keep the pipeline-failed short-circuit (a recorded failure has nothing to reproduce — but it now
  reads the record only to detect that state, not to compare shas).
- New body: run `generatedChain(def, kitRec, paths, {})` **twice**; compare the two results'
  `gen.artifact` / `grammar.final` / `styled` / `fitSerialized` via `JSON.stringify` (mirror the
  in-process double-run stage list). `same` ⇔ the two fresh runs are byte-identical.
- Message: `fresh-process chain is DETERMINISTIC (two runs byte-identical)` / `NON-DETERMINISTIC`.
- `process.exitCode = 1` only on non-determinism.

**`--offline` block (≈457–486).** Drop draft-sha equality from the `ok` decision.

- In `checks`, remove `base`/`grammar`/`styled`/`fit` (the `=== want.*` lines).
- Keep `schema`, `zeroBlob`, `gate`, `sheet`, and the `assertArtifact` loop.
- Compute the draft-sha comparison separately as an informational `draftsMatch` boolean (not in
  `ok`); print it as `drafts MATCH/DIFFER recorded shas (informational; drafts are free under E-36)`.

### 2. `benchmarks/sculpture/challenge-milestone.mjs`

**`--repro` block (≈392–411).** Same reframe.

- Remove `rec`/`want`/`got === want`.
- Run `runChain(def, paths)` twice; compare `base` (when `def.provision`), `shell.artifact`,
  `reconstruction?.composed?.artifact ?? null`, `skin.final` between the two runs (mirror the
  double-run stage list at 420–425).
- Message: DETERMINISTIC / NON-DETERMINISTIC; exit 1 on non-determinism.
- Update the leading comment (393–394) from "compare against the committed shas" to "prove the chain
  is deterministic across two fresh runs (E-36: drafts are free; the judge pin is still the committed
  gate record)".

**`--offline` block (≈373–389).** Drop draft-sha equality from `ok`.

- Remove `shell`/`final`/`base` (`=== rec.reproducible.sha256.*`) from `checks`.
- Keep `skinGate`, `closure`, `gate`, `sheet`, and the `assertArtifact` loop.
- Informational `draftsMatch` line as above.

### 3. `benchmarks/sculpture/styled-milestone.mjs`

**`--repro` block (≈392–419).** Same reframe.

- Remove `rec`/`want`/`got === want`.
- Run `runChain`/styled chain twice (whatever `repro` currently calls to produce `r`); compare
  `base`/`shell`/`reconstructed`/`skinFinal`/`grammarFinal`/`styled` between the two runs.
- Message + exit-code reframe to determinism.

**`--offline` block (≈343–365).** Drop draft-sha equality from `ok`.

- Remove `shell`/`grammar`/`styled`/`base` (`=== want.*`) from `checks`.
- Keep `schema`, `kit`, `gate`, `overall`, `sheet`, `evidence`, and the `assertArtifact` loop.
- Informational `draftsMatch` line.

**Header comment (lines ≈25, 43–44).** Update the doc lines that describe `--repro`/`--offline` as
"compare sha256s" / "re-assert the committed record + artifacts" to the new determinism /
measurement-integrity semantics (small, keeps the file's self-documentation honest).

## Module boundaries / interfaces

- No exported function signatures change. `generatedChain`, `runChain`, `styledStretch`,
  `assertArtifact`, `sha256`, `artifactJson` are reused exactly as-is.
- No change to `src/form/pin-guard.mjs`, the gate, the cage, or any pure core.
- `rec.reproducible.sha256` remains **written** by the live path (unchanged) — only its *use as a
  gate* is removed; it survives as provenance and as the informational drift line's reference.

## Ordering of changes

The three runners are independent; order does not matter functionally. For reviewable commits:
1. `generated-milestone.mjs` (the live E-36 example — T-150-01 gable fix).
2. `challenge-milestone.mjs`.
3. `styled-milestone.mjs` + header-comment touch-ups.

Each is independently `node --check`-able and the suite stays green after each (no test depends on
the removed vs-committed behavior).

## Test surface

- No new tests are strictly required (the freeze sites are CLI mode blocks, not unit-tested pure
  functions). The existing suite must stay green.
- Optional hardening (Plan decides): a tiny unit assertion is not natural here because the mode
  blocks are I/O-bound CLI flow. Instead, **behavioral verification** in Implement: run
  `generated:barn -- --repro` (now DETERMINISTIC-green on the improved chain) and
  `generated:barn -- --offline` (measurement checks still gate; informational drift line prints).

## What is explicitly NOT touched (recorded KEEPs, AC4)

`benchmarks/sculpture/workshop.mjs` (replay-of-trace), `src/workshop/loop.mjs` & `replay.mjs`
(glance hill-climb + ledger integrity), `src/view/shell-regularize.mjs` (IoU vs GLB = glance),
`src/form/multi-angle-gate.mjs` / `benchmarks/sculpture/relief-calibration.mjs` and the
`*-monotone.test.mjs` (instrument re-derivation). The in-process double-run in each milestone runner
stays (determinism).
