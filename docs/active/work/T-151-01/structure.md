# T-151-01 Structure — file-level blueprint

Three production edits, two test edits, one doc edit. No new files, no deletions (E-36 Rule 2 — no
new ceremony). All logic concentrates in `pin-guard.mjs`.

## Files touched

| File | Change | Why |
|---|---|---|
| `src/form/pin-guard.mjs` | **modify** | add `INSTRUMENT_ALLOWLIST` + `isInstrumentPath`; narrow freeze to `instrument ∧ tracked` in `guardedWriteRecord` + `preflightPins`; rename `decidePinWrite` param `tracked`→`frozen`; refresh header comment | the core |
| `benchmarks/sculpture/generated-milestone.mjs` | **modify** | restructure the `catch` (lines ~534-545): surface original cause first, wrap failure-record writes defensively | AC4 |
| `src/form/pin-guard.test.mjs` | **modify** | rename `tracked:`→`frozen:` in decidePinWrite cases; add Group G (instrument allowlist + draft-free + frozen-set refusal regressions) | AC1-AC3 coverage |
| `src/form/pin-guard.conformance.test.mjs` | **none expected** | domain/structure-level; verify still green | regression |
| `docs/knowledge/pin-rotation-policy.md` | **modify** | §1 "What a pin is" → instrument allowlist; add E-36 note | AC1 "one documented place" |

## `src/form/pin-guard.mjs` — internal shape

Public surface **added**:
- `export const INSTRUMENT_ALLOWLIST` — frozen array of `{ reason, match(rel)→bool }` (see design).
- `export function isInstrumentPath(rel)` — `INSTRUMENT_ALLOWLIST.some(e => e.match(rel))`.

Public surface **changed**:
- `decidePinWrite({ frozen, exists, currentContent, nextContent, rotate })` — param `tracked`
  renamed to `frozen`; the early return reason becomes `"unpinned (draft — not a frozen
  instrument)"`. Decision matrix otherwise byte-identical.

Public surface **unchanged**: `refusalMessage`, `domainRefusal`, `GATE_RECORD_NAMESPACES`,
`PinGuardError`, `loadTrackedSet`, `isTracked`, `ROTATE_FLAG`, `POLICY_DOC`.

Internal wiring **changed** (two lines):
- `guardedWriteRecord`: `const tracked = isTracked(set, rel)` → `const frozen = isInstrumentPath(rel)
  && isTracked(set, rel)`; pass `frozen` into `decidePinWrite`; the rotation log-line still keys off
  `frozen` (only frozen pins are "ROTATING").
- `preflightPins`: `const committed = pins.filter(p => p.tracked)` →
  `const frozen = pins.filter(p => p.tracked && isInstrumentPath(p.rel))`; messages/return use the
  narrowed list. The `domainRefusal` block above it is unchanged (judge isolation is independent).

Ordering inside `preflightPins`: domain-refusal check first (unchanged), then the instrument∩tracked
freeze check. A draft path with a workshop-domain gate violation must still throw on the domain
ground — preserved because the domain block runs first and is untouched.

Header comment: replace the "'committed pin' is LITERAL: the path is git-tracked" bullet with the
instrument∩tracked rule and a pointer to `INSTRUMENT_ALLOWLIST`; keep the byte-identical / fail-closed
/ before-spend bullets.

## `benchmarks/sculpture/generated-milestone.mjs` — catch block

Replace lines ~534-545 with:

```js
} catch (e) {
  console.error(`[${def.key}] PIPELINE FAILED at ${track.stage}: ${e.message}`);  // cause FIRST
  process.exitCode = 1;
  const record = { schema: RECORD_SCHEMA, subject: def.key, status: "pipeline-failed",
    stage: track.stage, error: e.message, inputs: {...}, note: "..." };
  try {
    await writeRec(recPath, JSON.stringify(record, null, 2) + "\n");
    await writeRec(join(OUT_DIR, `${def.key}.md`), renderMd(record));
  } catch (writeErr) {
    console.error(`[${def.key}] (failure record not persisted: ${writeErr.message})`);
  }
  return;
}
```

Invariants: original `e.message` is always printed before any guarded write; a throw from the
failure-record write is caught and logged as a *secondary* note, never replaces the original cause.
`record`/`inputs`/`note` content is preserved verbatim — only control flow changes.

## `src/form/pin-guard.test.mjs` — new Group G

Append after Group F. New tests (pure where possible — injected `trackedSet`, no real git):

- **G1 `isInstrumentPath` membership matrix.** asserts true for: `benchmarks/sculpture/multi-angle/
  cottage-styled.json`, `.../kit/barn.json`, `.../retired-pins.json`, `packs/rustic.json`,
  `benchmarks/sculpture/pattern-book/facade-baselines.json`, `.../proportion-milestone.json`,
  `.../facade-milestone.json`, `cleanliness-baseline.json`. false for: `generated/barn.json`,
  `.../generated/barn/artifact.json`, `.../generated/barn/component-plan.json`, `packs/drafts/x/
  draft.json`, `packs/README.md`, `.../workshop/barn.json`, `.../recognition/barn.program.json`,
  `.../styled/cottage.json`, `.../zone-map/barn.json`.
- **G2 draft write is FREE even when tracked (the AC2 core).** tmpdir; `trackedSet =
  new Set(["benchmarks/sculpture/generated/barn/artifact.json"])`; differing
  `guardedWriteRecord` → `action: "write"`, bytes change, no throw.
- **G3 draft preflight does not throw (AC2).** `preflightPins({ pins: [{ rel:
  "benchmarks/sculpture/generated/barn/artifact.json", tracked: true }], rotate: false })` returns
  `{ refused: [], rotating: [] }`.
- **G4 instrument tracked still refuses (AC3) — guardedWriteRecord.** tmpdir verdict path in
  `trackedSet`; differing write → `PinGuardError` mentioning `--rotate-pins`; rotate:true writes.
- **G5 instrument tracked still refuses (AC3) — preflightPins** for each of: a multi-angle verdict,
  `packs/rustic.json`, `proportion-baselines.json`, `retired-pins.json` — all `tracked:true` →
  throw; with `rotate:true` → rotation ledger.
- **G6 `decidePinWrite` honors `frozen` rename.** `frozen:false` ⇒ write; `frozen:true` differing ⇒
  refuse (guards the param rename).

Existing edits: A1-A6 and E1 swap `tracked:` → `frozen:`. C1-C4 (kit fixture) **unchanged** —
kit is on the allowlist, so they stay green as-is (this is the regression proof for the kit
decision).

## `docs/knowledge/pin-rotation-policy.md` — §1 rewrite

Replace the "any git-tracked record under the runner output families" definition with: "A pin is a
git-tracked record on the **instrument allowlist** (`src/form/pin-guard.mjs` `INSTRUMENT_ALLOWLIST`):
judge verdict records (`multi-angle/`), ratified packs (`packs/*.json`), committed baseline/milestone
measurements, the kit vocabulary, and `retired-pins.json`. Draft creation artifacts (`generated/*`,
`workshop/*` pre-verdict, `recognition/*`, chain intermediates) are **not** pins and regenerate
freely (E-36 / S-151). Frozen once measured; draft until then." Keep §2 (rotation rule) and the rest
verbatim.

## Ordering of changes (for atomic commits)

1. pin-guard.mjs (allowlist + predicate + wiring + rename + header) — self-contained, run unit tests.
2. pin-guard.test.mjs Group G + the `tracked`→`frozen` renames — lock behavior.
3. generated-milestone.mjs catch block — AC4.
4. pin-rotation-policy.md — doc of record.

Steps 1-2 are the load-bearing pair and must land together green. 3 and 4 are independent and can
follow.

## Out of scope (other milestone runners' catch blocks)

Only `generated-milestone.mjs` is named by AC4. Sibling runners (styled/challenge/reconstructed)
have similar catch patterns but write *draft* records that are now free — no masking risk remains.
Note in Review; do not touch (Rule 2).
</content>
