# T-185-01 — Structure

File-level blueprint. The terminal act is **branch-selected at Implement time** by
`results/style-agreement.json :: recommendation.go`. Below: the dispatcher, then the two branch trees. **No path
under `measurements/` is written by this loop** — the PROMOTE branch *stages* an apply-script the human runs.

## Always (both branches)

### Read — `experiments/eval-alignment/results/style-agreement.json` (produced by T-184-01)
The verdict. Fields consumed: `recommendation.{go,label,rationale}`, `decomposition.{conceptImageEffect,
packEffect,verdict,cells,perSubject}`, `agreement.byBucket.{easy,hardMiddle}.{n,agree,rate}`,
`interLabel.verdict`, `concordance.tau`, `labelSource`, `licensing`. If absent, monitor until the sibling run
lands it (do not regenerate — [[ticket-double-dispatch]]).

### Created — `docs/active/work/T-185-01/FINDINGS.md`
The full-strength verdict read: decomposition table (pack vs picture, pooled + per-subject), bucketed agreement
(easy vs hard-middle SEPARATELY), inter-label self-consistency, concordance, the recommendation + licensing
caveat, and **the branch chosen with the evidence cited** (AC #1). Honest numbers, not hoped-for ones.

## Branch A — GO-LEANING (`go === null`, PICTURE-DRIVEN + hard-middle clears bar)

Stage a complete, sign-off-ready guarded PROMOTE package under `docs/active/work/T-185-01/promotion-package/`.
Nothing here is under `measurements/`; nothing is committed into the frozen instrument.

### Created — `promotion-package/style-distance/` (the exact frozen-copy bytes, STAGED)
- `bakeoff-score.frozen.mjs` — a byte-exact copy of `src/workshop/bakeoff-score.mjs` (the recalibrated scorer:
  `PENALTY`, `WRONG_STYLE`, `styleFidelityScore`, `itemStyleClass`, `gradedCapFor`, `critiqueEvidence`). The
  copy carries a header naming the source commit + that it is a frozen measurement copy.
- `diagnose-build.golden.json` — the concept-conditional `DiagnoseBuild` golden: the rendered prompt (verbatim,
  for the gatehouse-self-concept anchor) + the pinned reply text. The replay artifact.
- `style-distance.md` — the human-readable twin (house style): what the term is, the recalibration history
  (E-45/T-181/T-182), the gate evidence summary, the frozen constants in prose.
- `style-distance.json` — the machine record twin: `{schema:"measurements/style-distance/v1", source:{commit,
  paths}, constants:{PENALTY,WRONG_STYLE,gradedCap:"max(40,100-12·breadth)"}, gateEvidence:{...from results...},
  promotedFrom:"T-185-01", licensingNote}`.

### Created — `promotion-package/promote.mjs` (the human's apply-script; idempotent, guarded)
- Dry-run by default: prints the exact `measurements/style-distance/` files it WOULD write + the PinGuard
  membership check (`isInstrumentPath` returns true for each target). `--apply` performs the copy via
  `guardedWriteRecord({root, rel:"measurements/style-distance/…", content})` (first write is unpinned → writes
  freely; freezes on commit). Reads `process.argv` directly (no flag-swallow). NOT in `npm test`.

### Created — `promotion-package/verify-replay.mjs` (byte-repro proof; AC)
- (1) Re-reads `src/workshop/bakeoff-score.mjs`, strips the frozen-copy header, diffs the body bytes against
  `bakeoff-score.frozen.mjs` → must be identical. (2) Re-renders the `DiagnoseBuild` prompt for the anchor and
  diffs against `diagnose-build.golden.json.prompt` → identical (the prompt is deterministic; the reply is
  pinned, not re-called). Exit non-zero on any drift. Re-runnable before AND after the human applies.

### Created — `promotion-package/README.md` (the sign-off checklist)
The exact reviewer steps: read `FINDINGS.md`; run `node verify-replay.mjs` (green); run `node promote.mjs`
(dry-run, inspect); confirm the corpus gate + human labels; run `node promote.mjs --apply`; commit (records
freeze on commit); re-run `verify-replay.mjs` against the applied pin. Names the human gates explicitly
([[pin-guard-is-structural]]).

### NOT modified — `src/form/pin-guard.mjs`
The `MEASUREMENTS_PREFIX` allowlist already covers `measurements/style-distance/` (Research §PinGuard). The
package documents this; the apply-script asserts it. No edit to the freeze surface (smaller blast radius).

## Branch B — DO-NOT-PROMOTE (`go === false`: PACK-DRIVEN | ill-posed | only-easy | inconclusive)

A precise localization + a follow-on stub. Nothing staged for freezing.

### Created — `docs/active/work/T-185-01/LOCALIZATION.md`
The concept-image-conditioning localization: the exact seam (`src/workshop/diagnose.mjs::diagnoseRenderArgs`
feeds `style` from `program.style ?? pack.style`; `styleProfileBlock(pack)` derives the expected grammar from
the PACK; `concept`+`renders` are mere images) → the confound (the term grades against a pack-derived spec, so
its signal rides the pack). The falsifiable repair: condition the wrong-style call on the
**rendered-build-vs-concept-image** match, not pack/material agreement. Cites the decomposition numbers proving
PACK-DRIVEN. A sharp negative, not a soft partial.

### Created — `docs/active/tickets/T-186-01.md` (the follow-on stub)
A ready ticket (frontmatter: `phase: ready`, `depends_on:[T-185-01]`, new story `S-186` under E-46 or its
successor) scoping the concept-image-conditioning fix: claim, the seam from `LOCALIZATION.md`, the AC (the term
must read the picture — re-run the T-184 decomposition and show `conceptImageEffect` dominates). Plus a story
file `docs/active/stories/S-186.md` if the epic structure needs it. (Exact ids confirmed against
`docs/active/epics/README.md` at Implement time.)

### NOT modified — anything under `measurements/`, `src/workshop/bakeoff-score.mjs`, `diagnose.mjs`
The negative changes no code (the fix is the follow-on's scope). [[anti-hedge-falsifiable-commitment]].

## Modified (both branches) — docs bookkeeping
- `docs/active/work/T-185-01/{progress.md,review.md}` — RDSPI artifacts.
- Possibly `docs/active/ROADMAP.md` / `docs/active/epics/README.md` — mark S-185 outcome (additive; only if the
  repo convention expects it; confirm at Implement time, no pin paths).

## Ordering & boundaries
1. Read verdict → write `FINDINGS.md` (always).
2. Dispatch on `go`: Branch A (stage package) XOR Branch B (localization + stub).
3. Assert `git status --porcelain measurements/` EMPTY (structural, both branches).
4. `npm test` green; commit; `progress.md`; `review.md`.

The only IO that could ever touch `measurements/` is `promote.mjs --apply`, which a human invokes. This loop
never runs it.
</content>
