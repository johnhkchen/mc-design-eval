# T-151-01 Progress — instrument-only-pin-guard

## Status: implementation complete, all tests green (2119 pass / 0 fail)

## Done

### Step 1+2 — pin-guard.mjs + tests (the core)
- `src/form/pin-guard.mjs`:
  - Added `INSTRUMENT_ALLOWLIST` (frozen `{reason, match}[]`) + `isInstrumentPath(rel)` — the one
    named, documented place (AC1). Five families: multi-angle verdicts, `packs/*.json` (not
    `packs/drafts/*`), `-baseline(s)`/`-milestone` records, `retired-pins.json`, and the kit
    (honesty-clause add, reason recorded inline).
  - Renamed `decidePinWrite` param `tracked`→`frozen`; early-return reason now "unpinned (draft —
    not a frozen instrument)".
  - `guardedWriteRecord`: `frozen = isInstrumentPath(rel) && isTracked(set, rel)`.
  - `preflightPins`: `frozen = pins.filter(p => p.tracked && isInstrumentPath(p.rel))`. **Zero
    caller edits** — callers keep passing `tracked: isTracked(...)`; the narrowing is internal.
  - Header comment rewritten to the instrument∩tracked rule.
- `src/form/pin-guard.test.mjs`:
  - A1-A6, E1: `tracked:`→`frozen:` rename.
  - D: synthetic pin switched from `pin.json` (no longer an instrument) to `my-baseline.json` (flat
    instrument path) so the guardedWriteRecord matrix still exercises a frozen pin.
  - Added **Group G** (G1-G6): allowlist membership matrix, draft-write-free (AC2 core), draft
    preflight no-throw (AC2), instrument-still-refuses guardedWriteRecord + preflight (AC3), the
    `frozen` rename guard.
  - C1-C4 (kit-sweep regression fixture) **unchanged and green** — proof the kit-on-allowlist call
    keeps the founding T-119 regression meaningful.

### Step 3 — generated-milestone.mjs catch block (AC4)
- Restructured the `catch (e)` at ~535: original cause logged FIRST + `process.exitCode = 1`, then
  the failure-record `writeRec`s wrapped in a nested try/catch that logs a secondary note on
  failure. A guard refusal can never again mask the real chain behavior.
- **Note (shared-file commit sweep):** this hunk was swept into sibling commit `c08d0db`
  (`feat(T-152-01): auto render-beside-concept …`) when S-152 staged the same file. Verified intact
  and correct in `HEAD:benchmarks/sculpture/generated-milestone.mjs` (the AC4 comment + nested
  try/catch are present). AC4 is landed; attribution differs. No action needed — re-committing would
  be a no-op (`git diff` is empty for the file). This is the exact shared-file hazard the memory
  note describes; flagged, not fought.

### Step 4 — pin-rotation-policy.md §1 (AC1 doc)
- Rewrote §1 "What a pin is" to the instrument allowlist; named the draft families as explicitly NOT
  pins; cited E-36 / "frozen once measured." §2+ untouched.

## Verification
- `node --test pin-guard.test.mjs pin-guard.conformance.test.mjs isolation.test.mjs` → 33/33 green.
- `npm test` → 2119/2119 green.
- Behavioral (real repo): the five live-incident barn draft paths all report `instrument=false`
  (tracked=true) → `preflightPins` returns empty ledger with **no flag, no throw**;
  `retired-pins.json` still throws. AC2 + AC3 proven against the actual files.

## Deviations from plan
- Planned 3 commits; AC4 landed via sibling's commit (sweep) instead of its own. The remaining
  changes (pin-guard core + tests + policy doc) commit together as one — they are the load-bearing
  pair and the doc is trivially coupled.
- D-test fixture rename (`pin.json`→`my-baseline.json`) was an unplanned but necessary consequence of
  the freeze-narrowing (a bare `pin.json` is no longer an instrument). Documented in structure.md's
  spirit; benign.

## Remaining
- Review.md (next phase).
</content>
