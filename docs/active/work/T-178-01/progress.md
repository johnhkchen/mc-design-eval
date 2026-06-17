# T-178-01 — Progress

## Status: complete. Crater re-run executed at VOTES=6; result is a sharp NON-separation (collapse).

## Step 1 — harness: VOTES env-overridable + scoreStd — DONE (commit f6ec27a)
`experiments/eval-alignment/corpus-referee.mjs`, three additive edits:
- `const VOTES = Number(process.env.VOTES ?? 2)` (default unchanged → prior reproductions byte-identical).
- `std` helper beside `mean`; `scoreStd` emitted per condition in `runCrater`.
- `±std` + `(votes=N)` surfaced in the CRATER verdict console line.
Verified with a `GUARD_ONLY=1 VOTES=6` dry-run (parses, loads, guard line prints for faithful-covered). No
`src/` or `measurements/` change.

## Step 2 — the metered run — DONE
```
CRATER_BUILD=builds/gatehouse/faithful-covered CRATER_ONLY=1 VOTES=6 \
REFEREE_OUT_DIR=docs/active/work/T-178-01 \
REFEREE_RESULTS=experiments/eval-alignment/results/corpus-referee-faithful-covered.json \
npm run corpus-referee
```
24 image-diagnose calls (4 conditions × 6 votes), strong tier. Full console captured in `run-votes6.log`.
Result:
```
CRATER:  A=13±12  B=0±0  B2=0±0  C=5±7  (votes=6)  -> DID NOT CRATER
KIND:    contrast=-0.20  -> NO CONTRAST
```

## Step 3 — read + audit — DONE
Per-vote scores: A `[0,4,20,28,28,0]`, B `[0×6]`, B2 `[0×6]`, C `[8,20,0,4,0,0]`.
Per-item: matched earns **WALL:replace 6/6** + **OPENING:replace 6/6** (+ ROOF:replace 3/6) **against its own
concept** — the *same* department pattern as the wrong-style B-arc. The term does not discriminate.
Glance: build roof is brown dark_oak; concept roof is grey stone (a real, secondary roof-color divergence).

## Step 4 — verdict + FINDINGS — DONE
`FINDINGS.md` written. Verdict: **DID NOT CRATER / COLLAPSED → DO-NOT-PROMOTE, RE-CALIBRATE the measure.**
T-173-01's 28 shown to be a VOTES=2 sampling artifact; its build-is-the-gate hypothesis refuted. Localization:
the `replace`→cap mechanic is not concept-conditional (a *measure* defect), not a build defect. No freeze step
spelled out — promotion correctly blocked.

## Step 5 — regression guard + commit — DONE
`npm test` → **2283 pass / 0 fail** (the TG26 sibling failure noted under T-177-01 is since resolved).
`git status measurements/` clean. Result JSON + work artifacts committed (8bf8091); harness edit (f6ec27a).

## Deviations from plan
- None of substance. No unit test added (planned: the change is a metered harness not in the suite; std
  verified by eye against the raw `votes[].score`). Outcome is the opposite of the bet — recorded as the
  finding, not retried at higher votes (anti-hedge: a non-separation is the valuable result).
