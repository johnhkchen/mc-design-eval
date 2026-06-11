# T-111-01 closure-milestone — Plan

> **ADDENDUM (post-`ccb198e`, see design.md):** Steps 3 and 4 are **CANCELLED** — the church
> settle fix is S-113/T-113-01 scope (sequenced after this ticket); T-111 ships zero code
> changes. Step 5's church hypothesis flips: `reconstructed:church` is EXPECTED to record the
> honest settle refusal (exit 1, no judge consumed, instrument untouched-by-construction). Step
> 7's church row cites the committed T-110 challenge-label verdicts as the first-ever church
> gate verdicts and names S-113 as the residual's owner. All other steps unchanged.

Eight steps, each independently verifiable and atomically committable. Judge economy is the
binding constraint (E-28 Rule 4): construction (steps 1–4) fully lands before any chain that can
reach a gate (steps 5–6). Live-run hypotheses are stated up front so deviations are named, not
discovered in the commit log.

## Step 0 — Concurrency + baseline sanity (no commit)

- Re-check no sibling session on this ticket (work-dir mtimes, minutes-old commits).
- `npm test` at HEAD → expect validator + 1431 unit tests green (T-109 close state).
- Verify: exit 0. If red, stop and report — this ticket adds measurement on top of a green base.

## Step 1 — Evidence pre-capture (commit: chore)

- `cp pr/assets/frames/reconstructed-<s>-after.png pr/assets/frames/closure-<s>-before.png` for
  the three subjects (the committed E-27 reconstructed builds through the fixed lens — about to be
  overwritten by fresh runs).
- Snapshot for the epic sheet (into work dir notes): current verdict/aggregate fields of the three
  committed `reconstructed/<s>.json` + `multi-angle/*` records, and HEAD sha.
- Verify: 3 new PNGs exist, byte-equal to their sources.

## Step 2 — `roof:church` under the T-108/T-109 cores (commit: feat)

- `npm run roof:church` → fresh `roof/church.{json,md}` + `roof/church/artifact.json` + frames.
- Then `npm run roof:church -- --repro` (expect MATCH) and `-- --offline` (expect OK).
- Hypotheses: nave gains end-fit/ridge rungs (cage-arbitrated; rollback acceptable and named);
  tower remains a named fallback (pyramidal cap); terminations consume unfitted planes; unmapped
  stays 0; protrusion deltas recorded. NO expectation that the cage accepts anything specific —
  outcomes are whatever the cage says.
- Verify: exit 0, `status` truthful, per-component sections present, repro MATCH, offline OK.
- Commit record + artifact + frames + md.

## Step 3 — Diagnose the church settle populations (no commit; findings → progress.md)

- Write `docs/active/work/T-111-01/diagnose-settle.mjs`; re-run the deterministic chain in-process
  to settle entry (church), dump the frame-14 and foreign-170 cells with
  `{pos, zone, cur, fillBlock, dressingSlot, ownVocabVerdict}`.
- Decide H1 (sill/lintel tolerated-class double-count) vs H2 (named-space policy leak) vs other,
  with counts. The decision criterion: which classification, applied to the dump, zeroes the
  foreign count **without** masking any cell that the kit-presence checker would flag as missing
  kit material.
- Verify: the dump's totals reproduce 14/170 exactly (same accounting as the committed error
  message) — otherwise the diagnostic itself is wrong; fix it before concluding anything.

## Step 4 — Settle accounting fix (commit: feat + tests)

- `src/view/settle-account.mjs` + `settle-account.test.mjs` per structure.md §A; wire
  styled-milestone.mjs settle loop to it; apply the measured fix (H1: toleratedSites from the
  dressing's non-gating placements; H2: pass the substituted policy; other: plan deviation named
  first).
- Tests must include: empty-toleratedSites equivalence with the old accounting (regression pin);
  the church-shaped tolerated case; a genuinely-foreign cell still counted; determinism.
- Re-run the step-3 diagnostic with the new accounting: expected foreign → 0 (or the residue is
  real and the fix moves to the responsible op — named deviation).
- `npm test` green (expect ≥1431 + new tests).
- Verify before commit: `git diff` touches NO gate-side file (multi-angle-gate.mjs,
  src/form/multi-angle-gate.mjs, src/config.mjs, kit-presence core).

## Step 5 — The three live chains, one judge pass each (commit per subject: feat)

Order: cottage → gatehouse → church.

- `npm run reconstructed:<s>` (live). The runner pre-captures the committed gate contract, spawns
  styled-milestone (full chain, double-run byte-equality), spawns the gate (ONE judge call per
  view), distills the terminal record with the instrument diff + census vs the pinned E-26
  baseline + sheets.
- Hypotheses (recorded, not enforced): cottage/gatehouse verdict movement at the previously
  drifted roof-form views after T-108/109 fits; settle converges on all three (cottage/gatehouse
  iterations ≤ previous; church now converges); church gets its first styled-label gate +
  kit-presence verdicts; instrument `diffs: []` for all three.
- If church settle STILL throws: no judge was consumed; record the honest failure, return to
  step 3/4 as a named deviation, re-run. Verdicts, once judged, stand as judged — no re-rolls for
  any reason.
- Verify per subject: runner exit code truthful (0 gated / 1 refused), `instrument.frozen` true
  (or finding recorded), census after-side present, sheets copied to pr/assets.
- Commit per subject: reconstructed + styled + multi-angle records, artifacts (incl. the
  previously-untracked `styled/church/*`), frames. Verdicts committed exactly as judged.

## Step 6 — Reproducibility receipts (commit: docs/chore if any delta)

Per subject: `npm run reconstructed:<s> -- --repro` (fresh-process re-proof; judge NOT re-run;
expect milestone re-proof exit 0) then `-- --offline` (expect: milestone shas MATCH, baseline
pinned, sheets present, instrument frozen/untouched). Also `roof:{cottage,gatehouse} -- --offline`
(unchanged-core assert). Record outcomes in progress.md; any FAIL is a stop-and-diagnose, not a
re-run-until-green.

## Step 7 — Closure evidence + learnings (commit: docs)

- `cp` fresh after-sheets → `pr/assets/frames/closure-<s>-after.png` ×3.
- Author `pr/assets/closure-milestone.md`: verdict-movement table (E-27 committed verdicts →
  fresh E-28 verdicts, per azimuth), metrics vs AC3 baselines (cottage 51/6.8%, gatehouse 25/9.9%,
  church 202/14.0%), fit errors per subject (gable/verge/ridge/per-component from the roof
  records), instrument statement (3× `diffs: []` or the named exception with the monotone proof
  cited: `src/view/coverage-monotone.test.mjs`, both fractions in durable-skin records),
  reproducibility receipt, generalization self-grep results.
- `docs/knowledge/design-learnings.md` E-28 section (E-26/E-27 shape): five-whys, finish-the-fit
  thesis, third census-identity instance + discipline, per-subject outcomes (honest, both
  branches), over/under-reach, E-12 handoff (records + sheets + components-never-collapsed).
- Verify: every number in the authored docs traceable to a committed record (no hand-derived
  figures without a named source).

## Step 8 — Review (review.md; final commit: docs)

- Final `npm test` green; `git status` clean of strays (no working-tree leftovers beyond Lisa's
  own files); review.md summarizing changes, test coverage, open concerns (esp. verdict residuals
  and anything the fix deviated on).

## Test strategy summary

- **Unit (new)**: settle-account pure core — classification, equivalence pin, determinism.
- **Unit (existing)**: full suite green at every commit boundary (steps 0, 4, 8 minimum).
- **Integration/live**: the three chains themselves + double-run byte-equality (in-runner) +
  `--repro` fresh-process + `--offline` asserts — the project's standing seam convention for
  impure wiring.
- **Non-goals**: no tests asserting judge verdicts (LLM output is evidence, not a test target);
  no render-pixel assertions (GL excluded from decisions).

## Risks / contingencies

1. **Diagnostic refutes both H1 and H2** → the fix moves to the measured op; structure.md §A
   contingency; named deviation before any edit.
2. **Cottage/gatehouse settle behavior changes under the new accounting** → caught by the
   equivalence-pin unit test before any live run; if live divergence still appears, it throws
   pre-gate (no judge cost) and is diagnosed.
3. **Church chain hits a NEW downstream stage failure post-settle** (e.g. gate coverage
   precondition) → honest record, exit 1, judge possibly partially consumed per view already
   rendered — accepted; verdicts/refusals stand as judged (Rule 4).
4. **Roof:church regression vs 75fd30d record** (new cores produce worse cage outcomes) → the
   cage's verdict stands; record it; the closure story reports it as measured.
5. **Long runtimes** — chains are tens of minutes each; run sequentially, never in parallel (the
   chain runners share record paths only per subject, but renders/judges are metered).
