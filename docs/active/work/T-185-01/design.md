# T-185-01 — Design

One decision tree, two branch deliverables, one hard constraint (no autonomous freeze). Lead with how it fails
(anti-hedge): the ticket fails if I promote on equivocal evidence, if I touch `measurements/` autonomously, or
if the staged pin doesn't replay byte-identically. The design makes each of those structurally hard.

## Decision 0 — what "do the matching thing" means when run autonomously

**The branch is selected by `results.recommendation.go` ∈ {false, null}** (never `true` — proxy fallback;
Research §"decisive structural fact"). So the terminal act is **never the freeze itself**. Two acts:

| `go`  | verdict label | T-185-01 autonomous act |
|-------|---------------|--------------------------|
| `null`| GO-LEANING (recommend-only) | **STAGE** the exact guarded PROMOTE package + gate-evidence summary for human sign-off; `measurements/` untouched |
| `false`| DO-NOT-PROMOTE / ill-posed / inconclusive | write the **concept-image-conditioning localization** + a follow-on ticket stub; `measurements/` untouched |

Rejected alternative: "interpret GO-LEANING as license and freeze." Refused — the ticket and
[[pin-guard-is-structural]] are explicit; an autonomous freeze is the one act forbidden. The package-for-sign-off
*is* the PROMOTE branch's honest deliverable in a loop.

## Decision 1 — how to obtain the verdict (the blocking dependency)

**Options.** (a) Re-run the harness myself; (b) **read the sibling run's `results/style-agreement.json`**, waiting
for it; (c) decide on the partial log.

**Chosen: (b).** The T-184-01 metered run is live and owns the spend ([[ticket-double-dispatch]]). Re-running
(a) doubles ~120 metered calls and risks a same-prompt collision; deciding on the partial log (c) is exactly the
VOTES=2 artifact mistake E-44 already made (T-173's 28 collapsed at VOTES=6). I read the committed results JSON;
if absent, I monitor until it lands (the run writes it atomically at the end via `writeFile`). The implement
step is a thin dispatcher over that file — it does no scoring of its own.

## Decision 2 — the PROMOTE-prep package (GO-LEANING branch)

**What a frozen ADD must contain** (from the ticket + Research §freeze surface): a frozen copy of the
recalibrated scorer surface (`PENALTY`, `WRONG_STYLE`, `styleFidelityScore`, `itemStyleClass`, `gradedCapFor`)
and the concept-conditional `DiagnoseBuild` golden, under `measurements/style-distance/`, plus a PinGuard
allowlist entry.

**Options for staging.** (a) Write the files straight into `measurements/style-distance/` (VIOLATES the
no-autonomous-freeze rule); (b) **stage the package under `docs/active/work/T-185-01/promotion-package/` plus an
idempotent `promote.mjs` apply-script that a human runs with `--apply` to perform the guarded copy**; (c) only
describe it in prose.

**Chosen: (b).** The package is *real and reviewable* (the exact bytes that will be frozen) but lands nowhere
near `measurements/` until a human runs `node …/promote.mjs --apply` (which calls `guardedWriteRecord`). This
satisfies "prepare the exact guarded pin + gate evidence; the reviewer confirms" literally. Prose alone (c)
fails "the exact guarded pin prepared." Direct write (a) is the forbidden act.

**PinGuard allowlist entry:** Research established `MEASUREMENTS_PREFIX = "measurements/"` already covers
`measurements/style-distance/` — **no code edit is needed to freeze it**; the new committed records are
auto-frozen. So the "allowlist entry" is satisfied by the prefix; the package documents this explicitly (and the
apply-script verifies `isInstrumentPath("measurements/style-distance/…")` returns true) rather than editing
`pin-guard.mjs` (a smaller, safer freeze surface — [[vocabulary-authority-one-composition-point]]).

**Byte-reproducible replay:** the package includes a `verify-replay.mjs` that (1) re-derives the frozen scorer
copy from `src/workshop/bakeoff-score.mjs` and diffs bytes, and (2) re-renders the `DiagnoseBuild` prompt and
diffs the committed golden text — proving determinism *before* the human applies, and re-runnable *after*. This
discharges the AC's "post-pin byte-reproducible replay verified" ([[repro-is-determinism-not-vs-committed-draft]]).

## Decision 3 — the DO-NOT-PROMOTE localization (go:false branch)

**Options.** (a) Implement the full concept-image-conditioning fix now; (b) **write a precise localization note
naming the exact conditioning seam + a follow-on ticket stub**; (c) a vague "needs more work" note.

**Chosen: (b).** The ticket says "the residual named precisely … a sharp, publishable negative — not a soft
partial," not "fix it." The fix is the next epic's scope. (a) over-reaches a terminal-act ticket and risks an
unvalidated change to the live scorer; (c) violates anti-hedge. The localization pinpoints
`diagnoseRenderArgs`/`styleProfileBlock` (style spec is pack-derived; the picture is only evidence) and states
the falsifiable repair: the term must condition on the rendered-build-vs-image match. The follow-on stub is a
ready ticket file under `docs/active/tickets/` (new story/epic id as appropriate) so the arc continues cleanly.

## Decision 4 — what gets committed vs. left for the human

**Committed (this loop):** the work artifacts (R/D/S/P/progress/review), and — per branch — either the
`promotion-package/` (staging dir + scripts, all OUTSIDE `measurements/`) or the localization note +
follow-on ticket stub. **Never committed autonomously:** anything under `measurements/`. The
`git status --porcelain measurements/` check is the structural assertion (run in Implement + Review).

## Decision 5 — recording honesty (the AC's "recorded honestly")

The verdict goes into `FINDINGS.md`/`review.md` at **full strength**: the actual `conceptImageEffect`,
`packEffect`, decomposition verdict, bucketed agreement (easy vs hard-middle SEPARATELY), inter-label
self-consistency, concordance, and the `recommendation` — with the licensing caveat (proxy can refute, not
license) stated plainly. No promotion on equivocal evidence; a GO-LEANING is reported as *recommend-only*, not
dressed up as a GO ([[calibrated-honesty-not-hype-or-brutality]]).

## Falsifiable claim & the verdict map (anti-hedge)

T-185-01 yields a clear verdict + the matching act. **Fails if:** evidence is equivocal and I promote anyway
(I don't — `go:false`/INCONCLUSIVE/MIXED all route to DO-NOT-PROMOTE or recommend-only-staging); or the staged
pin doesn't replay byte-identically (`verify-replay.mjs` catches it → back out, do not stage). The one act that
touches `measurements/` is deferred to the human, by construction. The deliverable is either a sign-off-ready
guarded promotion package or a precisely-named negative — both complete, neither soft.
</content>
