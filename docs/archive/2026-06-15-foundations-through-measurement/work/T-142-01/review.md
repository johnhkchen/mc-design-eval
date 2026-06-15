# T-142-01 Review — witness-pin-policy

Handoff for a human reviewer. The three witness/record families that sat FAIL-not-SKIP at HEAD
(S-138 review, concern 3) now exit 0 — each non-green leg a *named* SKIP citing its retiring ticket,
each genuine divergence still a FAIL. No judge ran, no chain re-ran, the gate namespace was never
written. `npm test` 2030/0.

## What changed

| file | change |
|------|--------|
| `src/form/witness-repro.mjs` *(new)* | Pure `classifyWitnessRepro` (the shared SKIP-vs-FAIL core) + `retiredEntry` + `WITNESS_REPRO_VERDICT`. A witness reproduces against its PINNED source: a *registered* retirement SKIPs (named); an *unchanged* source that diverges FAILs (corruption); an *undeclared* change FAILs. |
| `src/form/witness-repro.test.mjs` *(new)* | WR1–WR6 + RE — the AC3 regression: SKIP on registered rotation, FAIL on corruption, FAIL on unregistered change, GREEN on clean repro, missing-source handling, registry lookup. One core ⇒ both witness families covered. |
| `benchmarks/sculpture/retired-pins.json` *(new)* | The "retired pins named" registry — `{slug, retiredSourceSha, ticket, reason}` per family. A data **sidecar** so subject keys never enter a runner's `.mjs` source (the generalization self-grep stays clean). |
| `benchmarks/sculpture/proportion-witness.mjs` | Thread the committed pack into both `replayLedger` calls (geometry-bearing E-33 ledgers replay); classify repro on the pinned ledger sha; SKIP returns the OK sentinel (`true`, not `null`). |
| `benchmarks/sculpture/visibility-witness.mjs` | Classify repro on the pinned gate-record sha; consume only **git-tracked** component-plans. |
| `benchmarks/sculpture/measured-proportions.mjs` | Pin the chain seed (`inputs.chainSeed`); classify repro on it (future seed rotation → named SKIP). |
| `benchmarks/sculpture/measured/{cottage,barn}.{record,program,md}` | Rotated: `before` refreshed, seed pinned, program refreshed for T-141's pack. |
| `benchmarks/sculpture/visibility/cottage-challenge.{json,md}` | Rotated: plan-less census (untracked plan excluded). |

The fix in one line: **the gatehouse-current SKIP precedent ("a changed pinned input → SKIP, not a
witness") promoted from "artifact pin" to "any pinned source," made pure and testable, with the
retiring tickets named in a committed registry.**

## Acceptance criteria — evidence

1. **The three seams fixed** ✓ — proportion threads the pack; visibility's SKIP guard extends from
   artifact pins to record pins (3 pattern-book legs SKIP named, never a bare DIVERGES); measured's
   `before` refreshed under explicit `--rotate-pins`, retired values quoted (progress.md), `after`/
   `target` never re-banked. The cottage-challenge stray-file provenance **resolved by exclusion**
   (the witness reads only tracked inputs; the untracked plan is dropped → reproducible in any
   worktree, and the exclusion even cleared the prior census drift).
2. **Green-or-named-SKIP at HEAD** ✓ — `proportion:repro` / `visibility:repro` / `measured:repro` /
   `measured:offline` all exit 0 (verified `echo $?`). Every SKIP names its retired pin + owning
   ticket (T-138-01 / T-138-02). cottage-challenge resolved (named in the commit + this doc).
3. **The SKIP-vs-FAIL regression test** ✓ — `witness-repro.test.mjs` in `npm test`: a rotated pin
   yields a named SKIP (WR1/WR5), a corrupted record still FAILs (WR2/WR2b), an unregistered change
   FAILs (WR3/WR3b). The pure core serves both families. Reinforced by runner-level adversarial
   checks (drop a registry entry → FAIL+exit 1, for both proportion and visibility).
4. **Rotation-proof bar declared** ✓ — design.md states **Invariant RP-1**: a subsequent sanctioned
   rotation must yield a named SKIP, via `classifyWitnessRepro` + the registry; the rotation's owner
   adds its entry; an unregistered change deliberately still FAILs. No judge runs; no chain re-runs;
   isolation scan green; `npm test` green.

## Test coverage
- **Unit (npm test):** 10 new tests (`witness-repro.test.mjs`) — full SKIP/FAIL/GREEN matrix incl.
  the "entry must not rescue a corruption" and "entry for a different sha still FAILs" edges. Full
  suite 2030/0 (baseline 2020 + 10).
- **Integration:** the four exit-coded runs are the acceptance harness (not in `npm test` — they
  read `benchmarks/` records). All exit 0.
- **Adversarial:** registry-drop FAIL checks for both runners; cottage-challenge clean-worktree sim.
- **Gap:** measured's classify is wired but its registry section is empty (T-142 *refreshes*; the
  SKIP arm activates only when a future rotation registers a retirement). It is exercised by the
  *pure* test, not yet end-to-end on a measured record — by construction (no measured retirement has
  occurred). T-143's rotation is the first end-to-end exercise of measured's SKIP arm.

## Open concerns / known limitations

1. **T-141-01 landed mid-flight (the one to glance at).** A sibling thread committed `e908d76`
   (rustic `storeyHeight` max→5) **during** this ticket, moving the measured **program** record
   (the storeyHeight-5 packBand excursion conflict vanished). The measured rotation absorbed it
   alongside T-138's seed. All inputs are committed and consistent, but T-142 `depends_on`
   [T-139, T-140] — **not** T-141, which also feeds the measured derivation. This is a **missing DAG
   edge** (same class as the T-139↔T-140 shared-file edge those reviews flagged). The rotated
   measured records now reflect HEAD's pack; if T-141 is itself still settling, re-verify
   `measured:repro` after it closes. Recommend E-34 add the T-141→T-142 edge (or sequence the pack
   and the measured-pin tickets).
2. **`--all` live rotation can't reach record-less subjects.** `measured --all --rotate-pins`
   pipeline-fails on gatehouse/church (no recognition program) and exits before barn. Rotations
   were run per-subject. A future hardening could make live `--all` skip record-less subjects like
   `--repro` does; out of scope here.
3. **cottage-challenge is now plan-less.** The re-census no longer consumes the component-plan
   refinement (it was untracked). The numbers changed (and improved — drift cleared), but the
   witness measures a slightly coarser zoning than the plan-ful record did. If a future ticket wants
   the plan-ful census back, it must **commit the plan with provenance** (regenerated from a
   committed chain) — then the tracked-only rule consumes it automatically. `reconstructed-artifact
   .json` in that dir remains an untracked, unrelated stray (not a witness input).
4. **Registry shas are 64-char literals in JSON.** Correct but opaque; a typo would read as an
   unregistered change → FAIL (fail-closed, which is the right direction). The values were copied
   programmatically from the committed records, not by hand.

## Verdict
All four ACs met; four runs exit 0 with named SKIPs; `npm test` green; the diff is scoped to two new
`src/form/witness-repro*` files, three runner edits, the registry sidecar, and the explicitly-owned
data rotations — nothing under the gate namespace. The instrument now SKIPs (named) when a sanctioned
rotation retires what it pins, and still FAILs when a record is genuinely corrupt. The single process
flag worth a human glance is Concern 1 (the concurrent T-141 landing and its missing DAG edge).
