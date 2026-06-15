# T-111-01 closure-milestone — Design

> **ADDENDUM (2026-06-10 23:05, supersedes D1's chosen option).** Commit `ccb198e` (E-29
> generate-first-provisioning + S-112…S-116) landed mid-ticket, after this design was first
> drafted. **S-113 (vocabulary-authority) owns the church settle fix** — "one role→block-set
> contract… consumed by every construction stage and both gates. The proof: the church styled
> chain settles" — and is DAG-sequenced AFTER T-111-01, whose verdicts pin E-29's targets. The
> S-113 background also upgrades the diagnosis: the disagreement is structural (each stage
> composes map + kit + value-true substitution on its own; the committed kit-presence record
> shows `bindings.frame: stone_bricks` vs `shipped.frame: polished_basalt`), so a narrow
> settle-accounting fix here would either mask or duplicate the authority module
> (`parallel-roots-duplicate-shared-deps`). **D1 therefore flips to option (a): record the
> honest refusal** — `reconstructed:church` runs end-to-end, the settle THROW is the church's
> closure measurement, its cause cited with S-113 as the named owner. D1's options (b)/(c)
> analysis is retained below as the record of why (c) was initially chosen; steps 3–4 of the
> plan (diagnostic + settle-account module) are CANCELLED — T-111 ships zero construction-code
> changes. The church's first-ever kit-presence + multi-angle verdicts (AC3) are the committed
> T-110 challenge-label ones, cited per-record; the first styled-label verdicts become S-113's
> proof obligation. D2–D7 stand unchanged.

The ticket is a measurement milestone, not a construction epic: run the three subjects through the
full reconstructed chain ONCE each under the frozen instrument, commit verdicts as judged, and write
the closure story. Design decisions are therefore mostly about *sequencing under the no-re-roll
rule* plus the one construction item the chain cannot avoid: the church settle non-convergence
(T-110 review #1 — "non-convergence is a wiring bug, never smoothed").

## D1 — Church settle: fix the wiring bug (diagnostic-first), don't record the refusal

**Options considered:**

- **(a) Record the honest refusal** (E-25 Rule 6 fallback): `reconstructed:church` exits 1 at
  settle, no styled verdicts ever exist. Rejected as the *primary* path: AC1 demands the chain
  end-to-end incl. settle; AC3 demands the church's first kit-presence + multi-angle verdicts under
  this chain. The refusal remains the recorded fallback if the measured cause turns out to be
  out-of-scope construction (we then say so with the measurement, per the S-111 fallback clause).
- **(b) Raise the settle bound or tolerate residual foreign fill**: rejected outright — that is
  smoothing, the exact anti-pattern the seam's contract names.
- **(c) Fix at the measured identity seam** — CHOSEN. The settle loop already states its own spec:
  convergence is judged "by the CHECKER'S OWN criteria" (styled-milestone.mjs:118–123). Any place
  where settle's accounting diverges from what the kit-presence checker actually tolerates is a
  wiring bug in the accounting or in the op, and fixing it is chain-side (the instrument — gate
  thresholds/azimuths/judge — is untouched; E-28 Rule 1 doesn't even apply unless a census is
  involved).

**Grounded hypotheses to measure first** (records already narrow it):

1. **Sill/lintel foreign ping-pong (H1, leading).** Dressing places ~184 lintel/sill cells on the
   church (38 openings; challenge-gate kitPresence.dressing). Lintel/sill is *deliberately
   tolerated* in settle's `gating` count (non-gating slots) because the T-090 fill legitimately
   strips them as sub-run — but every such re-fill placement lands **over** a sill block, and
   `foreignFill` counts any fill placement over a block outside `ownOf` (styled-milestone.mjs:129).
   If the sill/lintel block (kit trim `stone_bricks` → shipped `polished_basalt`) is not in the
   zone's own vocabulary as settle computes it, the tolerated ping-pong is double-counted as
   foreign, forever. 170 ≈ 184 minus apertures outside fill zones — the magnitudes match.
2. **Vocabulary space mismatch (H2).** `ownOf` is built from `gOpts.policy` (:127). The registry
   policy is declared in NAMED space ("THE one renaming point" maps it through the value-true
   substitution — durable-skin.mjs after the registry). Must verify which space `gOpts.policy`
   is in by the time settle reads it; if named-space leaks through, every shipped-name block
   (`polished_basalt` et al.) reads foreign on the church, while cottage/gatehouse may converge
   only because their substitutions are closer to identity.
3. **Frame 14 (H3).** Dressing near apertures breaks kept frame runs each iteration (the memory
   note `presence-is-a-fixpoint-not-a-census` names dressing as the run-breaker). Likely the same
   cells oscillate: dressing places sill → fill strips → frame painter wants the gap again. May
   resolve as a consequence of H1/H2; measure before touching anything else.

**Fix shape (decided):** make settle's convergence accounting **identical to the kit-presence
checker's tolerance classes** — own-vocabulary computed in shipped space from the same source the
checker uses, and fill-over-dressing-placed non-gating cells (lintel/sill sites) classified as the
checker classifies them (tolerated residue), not as foreign. If instead the measurement shows the
fill genuinely overwrites *frame lines* (real material loss — the 169/544 kit-presence gap on the
challenge build suggests the unrun op, not loss), the fix belongs in the grammar/fill exclusion
instead — decided by the diagnostic, not assumed. **Constraints:** general code (no church
constants); the zero-target (`frameWants + foreign + gating === 0`) and the bound (4) unchanged;
unit tests for the new accounting; cottage/gatehouse settle must still converge (their fresh runs
prove it live).

**Diagnostic mechanism:** a work-dir script (not committed to benchmarks/) that re-runs the
deterministic chain in-process up to settle (the runners export their stage functions; the church
intermediates on disk shortcut provision/shell) and dumps the 170/14 cells with zone, current
block, placing op, and own-vocab verdict per cell. No judge, no gate, no record writes.

## D2 — Re-run `roof:church` under the T-108/T-109 cores first

The committed `roof/church.json` was cut at 75fd30d, before end-fit (T-108) and ridge/termination/
residual (T-109). The church's failed views name form @ roof (nave ridge/edges, tower cap) — the
precise gaps those cores address. Running `npm run roof:church` (+ `--repro`, `--offline`) before
the chain is the whole point of the dependency edge. Per-component expectations: nave gable ends +
ridge rungs now eligible; tower stays a named fallback (pyramidal cap — `end-hip`/insane-gable
class); terminations may consume unfitted planes. The cage arbitrates; rollbacks are acceptable
outcomes. Cottage/gatehouse roofs are already at T-109 state (22:44/22:45) — no re-run (a re-run
would be a no-op byte-identity by determinism; `--offline` assert suffices).

## D3 — Judge economy: all construction lands first, then ONE `reconstructed:<s>` per subject

E-28 Rule 4: one judge run per view per milestone. The gate is only reached when the chain
converges, so iteration on the church fix costs renders, never judge calls. Rules adopted:

- Never run `styled:<s>` standalone once the fix is in — the gate it spawns would consume the
  milestone's single judge pass outside the reconstructed record's pre-capture. `--distill-only`
  cannot rescue the church (its prior reconstructed record is challenge-routed; carrying that
  instrument compare would be wrong).
- Order: commit the settle fix + church roof re-run, `npm test` green, THEN
  `reconstructed:cottage` → `reconstructed:gatehouse` → `reconstructed:church`, each exactly once
  live. If church settle still throws, that run consumed no judge: fix again, re-run.
- Fresh gate records overwrite the committed ones per label; the runner pre-captures the old
  contract first (that's the instrument-diff proof). Old records stay in git history.
- After each live run: `--repro` (fresh-process re-proof, judge not re-run) and `--offline`.

## D4 — "Before = E-27 reconstructed builds": copy the committed sheets before they're overwritten

The runner's before-side is pinned to the E-26 baseline; AC4 wants before/after vs **E-27**. The
E-27 reconstructed builds rendered through the same lens already exist as committed
`pr/assets/frames/reconstructed-<s>-after.png` — and the fresh runs will overwrite them. Decision:
before any live run, copy each to `pr/assets/frames/closure-<s>-before.png` (provenance = git blob
at HEAD, noted in the epic sheet); after the runs, copy the fresh after-sheets to
`closure-<s>-after.png`. No new runner — a new orchestrator would duplicate reconstructed-milestone
for one cp (rejected; the epic sheet documents provenance instead). The epic sheet
`pr/assets/closure-milestone.md` is authored prose (the reconstructed-milestone.md precedent):
verdict-movement table (E-27 verdict → E-28 verdict per subject), metrics vs the AC3 baselines,
fit errors per subject (gable/verge/ridge/per-component), instrument-diff statement, repro receipt.

## D5 — Instrument-diff per subject: expect `diffs: []`, cite the exception once

Cottage/gatehouse: pre-captured styled gate contracts are identical to config (verified on disk) —
expect `diffs: []`. Church: first styled gate record → compared to `src/config.mjs` → expect
`diffs: []`. The T-110 census-identity exception lives chain-side (coverage gates `metric:"own"`),
not in the gate contract; AC2's citation = the closure record/epic sheet references
`src/view/coverage-monotone.test.mjs` (the monotone proof) and the both-fractions reporting in the
durable-skin records. If a real contract diff appears, it is a finding, recorded, never patched.

## D6 — Verdict outcome handling

Full passes are the target; the honest outcome is whatever the judge says. Per S-111/E-28 Rule 4,
residual FAILs are recorded with the fit errors that explain them (roof record fit sections,
termination/residual evidence) — the DoD then rests with the reviewer. No conditional logic on
verdicts anywhere in code or evidence: the epic sheet reports both branches identically.

## D7 — Learnings + handoff

`design-learnings.md` gains the E-28 section following the E-26/E-27 shape: five-whys → the
finish-the-fit thesis → instrument-frozen proof (third census-identity instance + its discipline)
→ per-subject milestone outcomes (vs E-27 baselines AND verdict movement) → over/under-reach →
E-12 handoff naming `reconstructed/<s>.json`, `multi-angle/<s>-styled.json`, the closure frames,
and the components-never-collapsed rule. Written AFTER the live outcomes exist (no speculative
prose).

## Rejected alternatives (summary)

- New `closure:<s>` runner — duplicates the T-107 terminal runner for no new measurement.
- Re-running `roof:{cottage,gatehouse}` — already at-core; determinism makes it a no-op; touching
  them risks pointless artifact churn.
- Fixing the church kit/zone records or policy data to dodge settle — record/data tuning to pass a
  gate, the named anti-pattern; only legitimate if the diagnostic proves a 1:1 transcription error
  against material-map roles (then it's a correction, recorded as such).
- `--distill-only` flows for any subject this ticket — all three need genuinely fresh chains.
