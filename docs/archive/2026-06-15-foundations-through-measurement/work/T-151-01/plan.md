# T-151-01 Plan — ordered, verifiable steps

Four commits. Each is independently testable; steps 1+2 land together (the load-bearing pair).
Verification command throughout: `node --test src/form/pin-guard.test.mjs
src/form/pin-guard.conformance.test.mjs src/workshop/isolation.test.mjs`, then full `npm test`.

## Step 0 — baseline (no commit)

- Run the three guard test files; confirm green at HEAD. Record counts.
- `npm test` baseline count (sibling tickets are active on this branch — note the number so a later
  regression is attributable, not blamed on this ticket; see memory: shared-file commit sweep).

## Step 1 — pin-guard.mjs: allowlist + predicate + wiring + rename

Edits (one file):
1. Add `INSTRUMENT_ALLOWLIST` (frozen `{reason,match}[]`) and `isInstrumentPath(rel)` exports, placed
   near the top after `POLICY_DOC` / before `GATE_RECORD_NAMESPACES` (keep domain logic grouped).
2. Rename `decidePinWrite` param `tracked`→`frozen`; update its early-return reason to
   `"unpinned (draft — not a frozen instrument)"`.
3. `guardedWriteRecord`: `const frozen = isInstrumentPath(rel) && isTracked(set, rel)`; pass `frozen`
   into `decidePinWrite`; rotation-log line keys off `frozen`.
4. `preflightPins`: narrow `committed` → `frozen = pins.filter(p => p.tracked && isInstrumentPath(p.rel))`;
   update the message/return to the narrowed list. Leave the `domainRefusal` block first & untouched.
5. Header comment: swap the "git-tracked = pin" bullet for the instrument∩tracked rule + pointer.

Verify: module imports clean (`node -e "import('./src/form/pin-guard.mjs')"`). Unit tests run in
Step 2 (they need the new Group G + renames).

## Step 2 — pin-guard.test.mjs: Group G + renames (commit with Step 1)

1. Swap `tracked:`→`frozen:` in A1-A6 and E1.
2. Append Group G (G1-G6 per structure.md). Import `isInstrumentPath`, `INSTRUMENT_ALLOWLIST` (and
   `PinGuardError` already imported).
3. Confirm C1-C4 (kit fixture) untouched and **green** — the kit-on-allowlist proof.

Verify:
- `node --test src/form/pin-guard.test.mjs` — all green, including new G1-G6.
- The AC2 proof lives in G2/G3 (tracked draft writes free); AC3 in G4/G5; AC1 in G1.

Commit 1 (Steps 1+2): `feat(T-151-01): pin-guard fires on instrument allowlist, not git-tracked`.

## Step 3 — generated-milestone.mjs: un-swallow the masked error (AC4)

1. Restructure the `catch (e)` at ~534-545 per structure.md: `console.error(PIPELINE FAILED …)` +
   `process.exitCode = 1` **first**; build `record`; wrap the two `writeRec` calls in a nested
   try/catch logging a secondary note on failure; `return`.
2. Preserve `record`/`inputs`/`note` content verbatim.

Verify:
- `node -c` / import-smoke the runner doesn't statically import sdk-binding (conformance already
  guards this — re-run conformance test).
- Behavioral check (AC2 end-to-end, GL-independent): `npm run generated:barn -- --skip-gate` should
  reach the chain and persist `generated/barn/*` with **no PinGuardError** (the draft is now free).
  If GL/chain is unavailable in-env, at minimum confirm the run no longer throws a *pin* error
  before the chain; capture stderr. (Render proof itself is S-152's job — do not block on it.)
- `git diff` shows only the catch block changed.

Commit 2: `fix(T-151-01): generated-milestone surfaces chain cause, never masks via guarded write`.

## Step 4 — pin-rotation-policy.md: §1 rewrite (AC1 "one documented place")

1. Rewrite §1 "What a pin is" to the instrument allowlist (point at
   `pin-guard.mjs INSTRUMENT_ALLOWLIST`); name the draft families as explicitly **not** pins; cite
   E-36 / "frozen once measured."
2. Leave §2+ verbatim.

Verify: prose matches code; no test depends on the doc text (grep `pin-rotation-policy` in tests —
only `POLICY_DOC` constant references the path, not content).

Commit 3: `docs(T-151-01): pin-rotation policy §1 = instrument allowlist (E-36)`.

## Step 5 — full-suite gate + AC checklist

1. `npm test` — must be green. If new failures appear, bisect against the Step-0 baseline; sibling
   tickets share this branch (re-Read files before edits; verify green before each commit — memory:
   shared-file commit sweep).
2. Walk the ACs:
   - **AC1** ✓ `isInstrumentPath` + `INSTRUMENT_ALLOWLIST`; guard decides via instrument∩tracked.
   - **AC2** ✓ G2/G3 unit + the `generated:barn --skip-gate` no-pin-error behavior.
   - **AC3** ✓ G4/G5 (verdict, pack, baseline, retired-pins all refuse; rotate writes); C1-C4 still
     green (kit). Reproducibility-by-replay path (`decidePinWrite` byte-identical → skip-identical)
     unchanged.
   - **AC4** ✓ Step 3 catch restructure; original cause surfaced; secondary write defended.
   - **No new ceremony** ✓ no new files/flags; instrument contract + domain isolation untouched.

## Testing strategy

- **Unit (pure, no git, no model):** decidePinWrite matrix (rename), isInstrumentPath matrix (G1),
  preflight narrowing (G3/G5). Fast, deterministic — the bulk of coverage.
- **Integration (tmpdir + injected trackedSet, no real git):** guardedWriteRecord draft-free (G2) +
  instrument-refuse (G4). Mirrors the existing Group D pattern.
- **Conformance/isolation:** re-run unchanged — proves the freeze-narrowing didn't disturb the
  pin-writer ban list or judge isolation.
- **Behavioral (best-effort, env-permitting):** `generated:barn --skip-gate` no longer pin-errors.
  Not a hard gate (GL/chain may be absent); the unit/integration tests are the contract.

## Rollback / risk

- If full suite goes red from a sibling's concurrent edit on a shared file, re-Read and re-apply
  only this ticket's hunks; never sweep another ticket's uncommitted work.
- The change only ANDs a condition into the freeze predicate — worst case it under-freezes a draft
  (the intended direction); it cannot newly freeze something previously free.
</content>
