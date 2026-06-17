# T-185-01 — Review

**Terminal act of the E-46 / E-38→E-46 measurement arc — COMPLETE.** The T-184-01 gate verdict came back
**`DO-NOT-PROMOTE` (`go=false`)**: the recalibrated style-distance term is **PACK-DRIVEN** on the S-183
decoupling corpus. The matching act (Branch B) ran: the residual is localized precisely and a follow-on epic is
scoped. **Nothing under `measurements/` was touched** — the freeze stays the human act it always was.

## What changed

This loop **changed no code.** It read the sibling T-184-01 verdict, recorded it at full strength, and wrote the
DO-NOT-PROMOTE deliverable (a precise negative + the next epic's seam). The arc's promotion is *not* executed —
because the evidence says the term is measuring the wrong thing.

### The verdict (full strength — see `FINDINGS.md`)

- **Decomposition PACK-DRIVEN:** `conceptImageEffect = 8` vs `packEffect = 45` (pooled, 3 subjects). Swapping the
  *picture* (right→wrong, pack held) costs 8; swapping the *pack* (matched→foreign, picture held) costs 45.
  - `matchedRight 53`, `matchedWrong 45`, `foreignRight 8`. `ct-wrongpack` (faithful build, wrong pack) = **0**.
  - Gatehouse `conceptImageEffect = −12`: the wrong-picture build (59) *outscored* the faithful one (47).
- **Hard-middle agreement `1/5 (0.20)`** against **LABELABLE** ground truth (proxy self-consistency 0.9 — the
  gate is sound, the term is wrong). Easy `2/3`, overall `3/8`, `tau = −0.14`. The damning pairs: E1/H3/H5 the
  term ranks a wrong-picture (or wrong-subject) build above the faithful one because it wears the right pack.
- **Licensing:** proxy labels (`licensing:false`) can only refute — but the result is negative, so the freeze
  was never on the table this loop regardless.

## Files created / modified / deleted

**Created — work artifacts:**
- `docs/active/work/T-185-01/{research,design,structure,plan}.md` — RDSPI planning (committed `36ad0a1`).
- `docs/active/work/T-185-01/FINDINGS.md` — the full-strength verdict read + branch chosen, evidence cited (AC #1).
- `docs/active/work/T-185-01/LOCALIZATION.md` — the concept-image-conditioning residual at the exact seam
  (`diagnose.mjs::styleProfileBlock`/`diagnoseRenderArgs`) + the falsifiable repair + the re-gate bar.
- `docs/active/work/T-185-01/{progress,review}.md`.

**Created — the follow-on stub (Epic→Story→Ticket trio):**
- `docs/active/epics/E-47-concept-image-conditioned-style-distance.md`
- `docs/active/stories/S-186.md`
- `docs/active/tickets/T-186-01.md` (`phase: ready`, `depends_on: [T-185-01]`)

**Modified:**
- `docs/active/epics/README.md` — E-47 row added; decision tail updated (E-46 done → DO-NOT-PROMOTE; E-47 active).

**Deleted / `measurements/` / `src/`:** none / untouched / untouched (verified `git status --porcelain` empty
for both `measurements/` and `src/`).

## Test coverage

- `npm test` **green: 2302 / 2302** (re-run this loop). Branch B added no `src/**/*.test.mjs` because it changed
  no code — the gate arithmetic the verdict rests on is already unit-tested in T-184-01's
  `src/workshop/style-agreement.test.mjs` (SA1–SA6).
- The empirical evidence — the population decomposition + agreement — is the T-184-01 metered run, captured at
  full strength in `FINDINGS.md` and reproducible by re-running `style-agreement-run.mjs` on the committed S-183
  corpus (the gate is a fixture, not a unit test).
- **Branch A (PROMOTE-prep) was NOT exercised** — the verdict routed to Branch B. Its blueprint (the staged
  `promotion-package/` with `promote.mjs`/`verify-replay.mjs`) remains in `structure.md` as the template the
  E-47 re-gate will use *if* it licenses a GO.

## Open concerns / TODOs

1. **The term is not promoted, by design — and should not be until E-47.** The residual is real and structural
   (the diagnosis grades against a pack-derived spec). T-186-01 / S-186 / E-47 scope the fix: anchor the
   expectation on the concept image, then re-run the *same* gate. No work is lost — the corpus + harness + pure
   agreement core all stand.
2. **`results/style-agreement.json` is T-184-01's deliverable**, not committed by this loop
   ([[ticket-double-dispatch]]); the path is gitignored (evidence reproducible by re-run). T-184-01's own loop
   should record its FINDINGS/review — that ticket is separate.

## Critical issues to surface for human review

- **No autonomous freeze occurred, and none should have.** `measurements/` is verified clean. The arc's deferred
  promotion stays deferred — correctly — because the term failed the gate ([[pin-guard-is-structural]],
  [[anti-hedge-falsifiable-commitment]]).
- **This is a sharp negative, not a soft partial.** The E-45 recalibration fixed the *mechanism*
  (`replaceContrast +0.245`) but the term still reads materials, not the picture (`packEffect 45 ≫
  conceptImageEffect 8`). Recorded plainly, neither inflated nor self-flagellating
  ([[calibrated-honesty-not-hype-or-brutality]]). The honest read: the measurement arc's *gate* worked exactly
  as designed — it caught a term that would have frozen the wrong ruler.
- **Next action is E-47 / T-186-01** (ready to schedule): make the term picture-conditioned, re-gate, and only
  then — behind human sign-off — promote.

## Honest bottom line

T-185-01 did its one job: it read the gate and did the matching thing. The gate said the recalibrated term reads
the pack, not the picture; so the term was **not** promoted, the residual was localized at the exact seam, and
the fix was scoped into a new epic. The frozen instrument is untouched. The arc reaches a clean, falsifiable,
publishable conclusion — a DO-NOT-PROMOTE that protects the instrument from freezing the wrong measure.
</content>
