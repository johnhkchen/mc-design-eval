# T-101-01 styled-milestone — Review

The E-26 terminal milestone. One named command per subject now takes committed concept inputs to a
styled, kit-aware-gated build end-to-end; the cottage's kit claim is **closed and proven** (every
recognized ingredient present at its grammar/dressing sites, zero gaps, deterministic, reproducible);
the resemblance verdict still fails on the pre-existing E-25 roof-form gap. Three ACs need explicit
reviewer decisions — listed first.

## Decisions a human reviewer must make

1. **AC2 is partial — accept or hold.** "Both gates pass on the cottage": the kit-aware check
   PASSES with zero gaps; the resemblance verdict FAILS 12/2 (major form@roof at 3 obliques; the
   135° view is same-object/2-minor… judges call the timber framing *minor zoning* — the
   ingredients visibly arrived). The failure is the E-25 roof-form finding, orthogonal to E-26's
   claim, and was predicted in this ticket's plan risk register. Nothing was weakened or re-rolled.
   The epic's definition of done allows "pass **or explicit reviewer acceptance**" — this is the
   acceptance request. (A roof-form fix is form-stage work, E-15/E-16 territory, out of scope here.)
2. **AC3 church — accept the named blockage.** Church cannot reach kit extraction: `kit-extract`
   needs a committed zone-map record; zone derivation runs inside the skin chain; the chain fails
   the T-088 skin gate (band0 stone 0.33 < 0.5 — the recorded E-25 provision finding). The styled
   run writes `pipeline-failed @ kit` naming that whole chain rather than minting a kit nothing
   can consume. "Kits auto-extracted" is therefore unmet *for church specifically*, by upstream
   blockage, not by wiring — review whether that reading of AC3's escape clause stands.
3. **The own-materials coverage change (gate semantics).** The per-view T-088 precondition in
   `multi-angle-gate.mjs` now censuses dominant + declared preserve (T-090's band-evidence set)
   instead of dominant-only. Justification: the dominant-only census REJECTed all four styled
   cottage views (band1 dominant 23% but own materials 96%) — it counted the kit's supplied frame
   and shutters as under-coverage and never let the judge see the styled build, making the epic
   undecidable. The change is strictly monotone (own ⊇ dominant: every previously passing view
   still passes; pre-T-101 committed records remain valid), foreign leakage still fails, and both
   fractions are reported in new records. Still: it touches a gate seam — confirm the reasoning.

## What changed

**Code** (composition + two pure seam fixes; `src/form/kit-presence.mjs` untouched — T-100 state):
- `benchmarks/sculpture/styled-milestone.mjs` — NEW terminal runner: kit (committed, sha-pinned) →
  `runChain` (provision?/shell/skin, reused from E-25 by export) → `grammarStage` (reused from
  T-098 by export) → T-099 dressing (pure cores, the T-100 recipe) → **settle** (the same grammar
  op re-run to its own bounded fixpoint; non-convergence THROWS) → the kit-aware gate via its own
  CLI (label `styled`). Double-run byte-compare across all five stage artifacts; `--repro` /
  `--offline`; honest `pipeline-failed` records; exit code = the gate's verdict. Zero subject
  keys/branches (grep recorded below).
- `benchmarks/sculpture/challenge-milestone.mjs` — `runChain` exported (1 word).
- `benchmarks/sculpture/placement-grammar.mjs` — gated core extracted as exported `grammarStage`
  (+ `renderSheet`); `runGrammar` is a thin wrapper; behavior proven unchanged
  (`grammar:{cottage,gatehouse} -- --offline` byte-identical post-refactor).
- `src/view/zone-fill.mjs` `ownCoverage` + `src/view/face-resemblance.mjs` `coverageGate
  metric:"own"` + the gate's per-view precondition wired to them (decision 3 above).
- `package.json` `styled:{cottage,gatehouse,church}`; `.gitignore` styled working renders.

**Records & evidence** (committed): `benchmarks/sculpture/styled/{cottage,gatehouse,church}.{json,md}`
+ stage artifacts (`shell-`, `grammar-`, final per completing subject);
`multi-angle/{cottage,gatehouse}-styled.{json,md}`; `pr/assets/frames/styled-<subj>-{before,after}.png`
(4-azimuth sheets, before = the committed kit-less build), `multi-angle-<subj>-styled.png` (contact
sheets), `pr/assets/styled-<subj>-kit.md` (kit + presence verdict). `docs/knowledge/
design-learnings.md` gained the E-26 section (five-whys, recognize-don't-match, fixture path,
fixpoint gate, the two seams, outcomes, E-12 handoff).

## Results per subject (the milestone's findings)

| | chain | reproducible | kit presence | resemblance | overall |
|---|---|---|---|---|---|
| cottage | COMPLETE (settle ×1) | double-run + `--repro` byte-identical (`6c94b04ce488…`) | **PASS, 0 gaps** (door/light = named detector skips) | FAIL 12/2 — major form@roof ×3; 135° same-object | FAIL (resemblance) |
| gatehouse | COMPLETE (settle ×2) | byte-identical (`3ea1c65bd03a…`) | **PASS** + 4 named skips (kit ships no opening treatments) | FAIL 12/2 — form/massing, 2 different-object views | FAIL (resemblance) |
| church | pipeline-failed @ kit (named upstream chain) | n/a | n/a | n/a | FAIL (named) |

The epic's complaint is closed where it can be measured: the cottage build now carries
smooth-sandstone panels, the spruce frame on its lines, trapdoor shutters, and fence-infilled
windows **because the concept shows them**, and a deterministic checker proves each one at its
sites. The styled build is a fixpoint of its own grammar (the settle guarantee), so "present" means
"re-running the pipeline changes nothing."

## Test coverage

- Suite 1215 → **1217**, green (+`ownCoverage`, +`coverageGate metric:"own"`; default-metric callers
  proven byte-identical by existing tests). No tests modified or deleted; `kit-presence.test.mjs`
  net unchanged (a speculative test was added and removed with its refuted fix — see progress D1).
- Refactor proof: T-098 committed records re-verify byte-identically through the extraction.
- Integration (deterministic): per-run double-run; `--repro` fresh-process; `--offline` on all
  three records; `kit-extract --offline` re-cited (the AC4 extraction pin).
- Integration (metered): one live gate run per completing subject; single pinned-model sample per
  view, verdicts committed, no re-rolls. (The first cottage run's verdict was superseded by the
  post-seam-fix run — a code fix, not a re-roll; both runs' outcomes are in the git history.)
- Coverage gaps: the settle loop's non-convergence THROW and the empty-aperture no-op path have no
  unit test (no current subject exercises them); the styled runner itself is composition and is
  exercised by the three live runs + offline/repro modes rather than unit tests.

## Open concerns / known limitations

1. **Roof form is still THE gap** (cottage + gatehouse resemblance). Routes to form-stage work, not
   materials. The 135° cottage view passing same-object is the first real-subject pass at a judged
   azimuth on a styled build.
2. **Settle vs dressing recolors**: the settle pass can strip isolated dressing jamb recolors (the
   fill's run rule wins — recorded in counts, visually minor). If lintel/sill framing should beat
   the run rule, that's a future contract change in zoneFill, not the checker.
3. **Gatehouse kit ships no opening treatments** — dressing places ~0 there and presence records
   four named skips. Honest untuned behavior; a richer gatehouse kit is a kit-extraction question.
4. **Door detection** (cottage doorway is not a through-hole) remains a named skip — T-099 D7
   detector gap, untouched here.
5. **Judge variance at the gap budget** is a named instrument property (memory: budget-edge
   flappy); all verdicts here are far from the budget edge except the cottage 135° view.
6. **Grep record** (AC3): `grep -nE "cottage|gatehouse|church|synthetic"
   benchmarks/sculpture/styled-milestone.mjs` → hits only the usage-comment block (lines 40–44);
   zero code paths.

## Commits (this ticket)

`632cab1` runChain export · `56d687c` grammarStage/renderSheet extraction · `c8b9d4a` styled runner
+ church named precondition · `3ad152c` the two seam fixes (own-coverage + settle) · `5574d70`
cottage records · `1ae1955` gitignore convention · `2201052` gatehouse/church + grep + formatting ·
`eba1c02` design-learnings E-26.
