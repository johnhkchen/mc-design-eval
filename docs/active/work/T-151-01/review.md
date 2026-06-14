# T-151-01 Review — instrument-only-pin-guard

Handoff for a human reviewer. What changed, how it's tested, what to watch.

## Summary

Pin-guard's freeze signal moved from "**tracked-in-git ⇒ pin**" to "**on the instrument allowlist
AND tracked ⇒ pin**." Draft creation artifacts (`generated/*`, `workshop/*` pre-verdict,
`recognition/*`, chain intermediates) now regenerate with no `--rotate-pins`; the frozen instrument
(judge verdicts, ratified packs, committed baselines/milestones, the kit, `retired-pins.json`) still
refuses silent overwrite. The masked-error catch in the generated runner now surfaces the real
cause. The change is purely a *narrowing* — the predicate only ANDs in a condition, so the frozen
set can only shrink (E-36 Rule 1, surgical).

## Files changed

| File | Change |
|---|---|
| `src/form/pin-guard.mjs` | +`INSTRUMENT_ALLOWLIST` + `isInstrumentPath`; `decidePinWrite` param `tracked`→`frozen`; `guardedWriteRecord`/`preflightPins` AND in `isInstrumentPath`; header comment |
| `src/form/pin-guard.test.mjs` | A1-A6/E1 `frozen` rename; D fixture `pin.json`→`my-baseline.json`; new Group G (G1-G6) |
| `benchmarks/sculpture/generated-milestone.mjs` | catch block restructured (AC4) — *landed via sibling commit `c08d0db`, see below* |
| `docs/knowledge/pin-rotation-policy.md` | §1 "What a pin is" rewritten to the allowlist |
| `docs/active/work/T-151-01/*` | RDSPI artifacts |

Commits: `6fe0278` (core + tests + policy + work artifacts); AC4 hunk in `c08d0db`.

## Acceptance criteria — status

- **AC1 (allowlist, not git-tracked):** ✅ `INSTRUMENT_ALLOWLIST` + `isInstrumentPath` is the one
  named, documented place; all three decision points (`decidePinWrite`/`guardedWriteRecord`/
  `preflightPins`) freeze via `instrument ∧ tracked`. Policy doc §1 mirrors it.
- **AC2 (drafts need no flag):** ✅ Unit G2 (tracked draft write → `action:"write"`), G3 (draft
  preflight → empty ledger). Behavioral: the five real barn paths from the live incident all report
  `instrument=false` / `tracked=true` → preflight passes with no flag, no throw (proven via node
  one-liner against the working tree).
- **AC3 (frozen set still refuses):** ✅ Unit G4 (multi-angle verdict guardedWriteRecord refuses,
  rotate writes), G5 (verdict + `packs/*.json` + baseline + `retired-pins.json` all refuse in
  preflight, rotate → ledger). C1-C4 (kit-sweep regression fixture) unchanged and green.
  Reproducibility-by-replay unchanged: `decidePinWrite`'s byte-identical → `skip-identical` path is
  untouched, so a committed measurement still replays byte-for-byte.
- **AC4 (un-swallow the mask):** ✅ The `generated-milestone.mjs` catch logs the original cause +
  sets exit code BEFORE any guarded write, and wraps the failure-record writes in a nested try/catch
  (secondary note, never replaces `e`). With AC2 the draft record write no longer throws anyway; the
  wrap is the durable guarantee.
- **No new ceremony / `npm test` green / instrument contract untouched:** ✅ No new files, flags, or
  manifests. `npm test` → 2119/2119. Judge-isolation (`domainRefusal`/`GATE_RECORD_NAMESPACES`) and
  the rotation flag are untouched.

## Test coverage

- **Pure/unit (no git, no model):** decidePinWrite matrix (renamed), `isInstrumentPath` membership
  matrix (G1 — 10 instrument paths, 10 drafts), preflight narrowing (G3/G5). The bulk.
- **Integration (tmpdir + injected trackedSet):** guardedWriteRecord draft-free (G2) and
  instrument-refuse-then-rotate (G4), mirroring the existing Group D pattern.
- **Conformance/isolation:** re-run unchanged (33/33 with the two guard suites) — the pin-writer ban
  list and judge isolation are undisturbed.
- **Gaps (acceptable):** no full end-to-end `generated:barn --skip-gate` chain run is asserted in CI
  (it needs GL/the heavy deterministic chain — that proof belongs to S-152, which already landed the
  render-beside-concept path). AC2 is instead proven at the guard boundary (the exact decision the
  bug was about) via G2/G3 + the real-path one-liner. This is the right altitude: the unit tests are
  the contract; the chain is S-152's concern.

## The kit decision (the one judgment call — review this)

The epic's headline allowlist names four families; the kit is a fifth, added under E-36's explicit
honesty clause (line 124: "a draft load-bearing for a committed measurement joins the allowlist with
the reason recorded — case by case"). Justification, recorded inline in `INSTRUMENT_ALLOWLIST` and
in design.md: the kit is an **input-of-record** to every committed styled/challenge/generated
verdict; freeing it would let a `kit:extract` sweep silently change the basis of committed
measurements, breaking reproducibility-by-replay (E-36 Rule 3); and the founding T-119 incident (the
`pin-guard.test.mjs` C1 fixture) *is* a kit sweep — keeping the kit frozen keeps that regression
meaningful with zero test rewrite. The kit is never re-extracted in a normal creation loop, so the
freeze costs the de-frozen creation loop nothing. **If a reviewer disagrees**, removing the kit
entry is a one-line change — but C1-C4 must then be re-pointed and the replay-basis risk accepted.

## Open concerns / watch items

1. **Shared-file commit sweep (informational).** The AC4 hunk in `generated-milestone.mjs` was
   committed by sibling S-152 (`c08d0db`), not by this ticket's commit. Verified intact in HEAD;
   `git diff` for the file is empty. No action needed. Flagged so the diff for `6fe0278` does not
   appear to be "missing" AC4.
2. **Baseline/milestone suffix breadth.** The `-baseline(s)`/`-milestone` regex is intentionally
   inclusive (also freezes `cleanliness-baseline.json`, `form-baseline.json`). This is the *safe*
   direction (freezing one extra committed measurement beats freeing a real one). Verified
   collision-free against committed `generated/`, `styled/`, `challenge/` draft names (all
   subject-named, none carry these suffixes). If a future draft is ever named `*-milestone.json`, it
   would be wrongly frozen — a naming-convention tripwire worth a comment, not a code change today.
3. **Sibling milestone runners' catch blocks** (styled/challenge/reconstructed) have the same
   pattern but now write *draft* records (free) — no masking risk remains, so they were left
   untouched (Rule 2). If any later writes an instrument record, apply the same defensive wrap.

## Reproducibility / safety note

The change cannot newly freeze anything previously free — it only adds a conjunct. Worst case is
under-freezing a draft, which is the intended direction. The instrument's reproducibility-by-replay
of committed measurements is unchanged (byte-identical path untouched; the four named frozen families
all still refuse).
</content>
