# T-214-01 — Review: the re-climb + the can-it-finish verdict (E-55 capstone)

**Epic E-55 / Story S-214.** Handoff for a human reviewer. **One line:** ran the metered gatehouse climb twice
with the T-213 winning rule (`trimmedMean` + `improving`); the rule fixed the median-discards-minority defect
live (the +12 gable kept where the median rolled it), but **M1 did not land** — both runs stalled at the FORM
phase before the detail phase (the +48 arch) was reached, because the **form-move closure gate** reproducibly
rolls back `close_shell`. The accept-rule is removed as the confound it has been since E-38; the next binding
constraint is named and upstream. Zero metered API; subscription shim only; frozen instrument untouched.

## What changed (no source; artifacts + ephemeral renders only)

| Path | Type | Content |
|---|---|---|
| `docs/active/work/T-214-01/{research,design,structure,plan}.md` | new | RDSPI design artifacts |
| `docs/active/work/T-214-01/trajectory.json` + `climb.log` | new (run 1) | metered climb 1: `14→…→22`, stalled |
| `docs/active/work/T-214-01/trajectory-2.json` + `climb-2.log` | new (run 2) | metered climb 2: `16→16→16→16`, agent-done |
| `docs/active/work/T-214-01/verdict.md` | new | **the deliverable** — M1 not landed, ceiling named |
| `docs/active/work/T-214-01/{progress,review}.md` | new | this handoff |
| `builds/gatehouse/picture-climb/round-*/` | regenerated | beside-concept + 4-azimuth renders (gitignored) |

`src/**`, `experiments/**`, `measurements/**`, `benchmarks/**` **byte-unchanged** (`git status` empty for all).
No file added to `npm test`. The two rule knobs are env-vars — no runner edit (they were wired in T-213).

## Verdict against the falsifiable claim (anti-hedge — led with how it failed)

Claim: "the re-climb carries the dressing compound to a KEPT M1 build, mostly autonomously → the architecture
can finish." **REFUTED**, in the ticket's own predicted failure mode: *"the rule keeps the glance-better moves
but the build still misses M1 (a downstream gap, accept-rule removed as confound → name the architecture
ceiling cleanly)."* That is exactly what happened — except the gap is **upstream** (the form gate), not
downstream (a hand).

- ✅ **The rule keeps the glance-better move.** Run 1 r3: `apply_gable_roof` `[36,0,8]` → `trimmedMean = 22` →
  KEPT (+8). The median would take 8 → tie → rolled back (the T-211 defect). Fixed and firing live.
- ✅ **The build still misses M1.** Open colonnade + brown gable; no closed walls, no arched gate. Stranger
  does not recognize the gatehouse.
- ✅ **Reproducible (2/2).** Both runs stall with the form never closing (`closureLast = 0.667`).
- ✅ **The winning rule did NOT regress frozen runs.** Default-OFF; `npm test` 2446/2446; source boundary clean.

## The named ceiling (the substance for the reviewer)

The detail phase was never reached because `close_shell` is reproducibly rolled back by `formCredit`'s
no-new-major guard: the featureless closed shell reads to the picture-critique as introducing a major (the
absent arched gate — which is *detail*, gated behind form-readiness, so the major is premature). 2 of 3 recorded
runs (this ticket's 2 + T-211's 1) roll close_shell back; T-211 (median) was the lucky keep. Compounding it, once
the gable is applied first, its roof cells dilute footprint coverage below close_shell's trust floor (0.27 <
0.5), so the shell can never close. **The form gate, not the per-move accept-rule, is what stops the climb.**

## Test coverage

- **`npm test` 2446/2446 green** before and after — this ticket adds no source and no suite test. The default-OFF
  byte-identity of the rule (the load-bearing safety guarantee) is asserted by the T-213 unit tests CG-AGG1 /
  CG-BWI1, re-run green here.
- **The runs are their own integration evidence** (the picture-climb out-of-suite convention): both completed
  cleanly (exit 0, not abort), 0 votes timed out, reproducible verdict. `trajectory*.json` carry every per-vote
  `scores` array, gate reason, and closure — the verdict is replayable from them.

### Gaps / not covered
- **The detail phase was never exercised this ticket.** The +48-arch rescue (the aggregator's headline payoff)
  is proven only in the T-212 *offline* corpus, not live — because the live climb never reached it. Naming this
  plainly rather than claiming the live arch keep is the anti-hedge requirement.
- **n=2 live runs** (+ T-211 = 3 total). The close_shell rollback is structural-looking (2/2 + plausible) but
  not proven over a large sample; a form-gate fix should confirm it.

## Open concerns / handoff (E-55 closes; successor named)

1. **The reviewer decision is in `verdict.md`:** M1 by another route needs a FORM-PHASE fix, not a per-move-gate
   fix. Two candidate routes: (a) a form gate that tolerates a featureless closed shell (don't reject close_shell
   for a *detail* major it isn't allowed to build yet); (b) seed the climb from an already-closed shell so the
   detail phase — where trimmedMean rescues the arch — is reached. Successor epic (E-56 generalization, or a
   dedicated form-phase epic).
2. **The E-54 stop-line stands.** No gatehouse-specific fix was made. The accept-rule arc (E-38→E-55) is
   complete: the per-move median was the confound, trimmedMean removes it, and the *next* constraint is now
   isolated and upstream — which is the clean close the arc was for.
3. **For the human reviewer — the one thing to check:** confirm the glance call on
   `builds/gatehouse/picture-climb/round-3/beside-concept.png` (brown gable on an open colonnade = not M1) and
   the close_shell-rollback reason in both `climb.log` files (r1: "closure rose but blocked (new major /
   net-grow)"). If you trust one thing, trust that the rule kept the gable the median rolls AND the form still
   never closed — both are in the logs verbatim.

## Bottom line

The architecture can keep the glance-better move; it cannot yet *finish* a subject to M1 — and now we know why,
and it is not the thing seven epics chased. The per-move accept-rule is fixed and removed as the confound; the
form-move closure gate is the next binding constraint, named cleanly. **E-55 delivered its answer: the ceiling
is real, upstream of the rule, and the route past it is a form-phase change, not another gatehouse fix.**
