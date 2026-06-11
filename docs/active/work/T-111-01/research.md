# T-111-01 closure-milestone — Research

Descriptive map of what exists for the E-28 terminal question: do cottage, gatehouse, church now
pass the full multi-angle gate — every azimuth same-object, ≤2 named minor gaps — with the freeze
proven. No solutions proposed here.

## 1. The named run already exists

`npm run reconstructed:<subject>` → `benchmarks/sculpture/reconstructed-milestone.mjs` (the E-27
terminal runner, T-107-01). Per subject it: (1) pre-captures the committed gate record's contract +
judge model; (2) verifies the component layer via `componentLayer(key, def)` (component-skin.mjs:54);
(3) spawns the chain — **styled-milestone.mjs when `def.kitRecord` exists on disk, else
challenge-milestone.mjs** (registry data, reconstructed-milestone.mjs:215); (4) deep-diffs the fresh
gate contract + judge model against the pre-capture (`instrumentDiff`, :71 — or vs `src/config.mjs`
for a first gate record); (5) census before/after on the pinned `reconstructed/<subj>/e26-baseline.json`
(present for all three subjects); (6) copies before/after sheets to `pr/assets/frames/
reconstructed-<subj>-{before,after}.png`. Flags: `--repro` (fresh-process re-proof, judge NOT
re-run), `--offline` (re-assert committed record), `--distill-only` (rebuild record from committed
outputs, judge NOT re-run). Self-grep proves no subject keys (:184).

**Routing change since E-27:** T-110 created `kit/church.json`, so `reconstructed:church` now routes
to the **styled** runner for the first time (E-27 ran it through challenge). Gate label becomes
`styled` → gate record `multi-angle/church-styled.json` does not exist → the instrument diff for the
church compares against `src/config.mjs` (the first-record branch).

## 2. Chain state per subject (on disk, 2026-06-10 ~22:50)

| record | cottage | gatehouse | church |
|---|---|---|---|
| `roof/<s>.json` | accepted, 22:45 (T-109: ridge rung ACCEPTED `end-fitted-voxel-pitch-ridge-fit`, terminations −78/+6, chimney exempt) | accepted, 22:44 (T-109: ridge intersect invalid (named), 11 terminations incl. area-151 flat top, 2 protrusions GLB-exempt) | accepted, **21:48 — cut at 75fd30d, BEFORE T-108 end-fit + T-109 ridge/termination/residual cores** (T-110 review #4: re-run is T-111 territory) |
| `styled/<s>.json` | gated 20:52, gate FAIL (10 gaps; kit presence PASS) | gated 20:58, gate FAIL (11 gaps; kit presence PASS) | **pipeline-failed @ settle 21:57**: "frame 14, foreign fill 170, gating dressing 0" |
| `challenge/<s>.json` | gated (16:23 era) | gated | gated 21:54 (T-110 first complete chain) |
| `multi-angle/<s>-styled.json` | FAIL: 2/4 drifted (+x+z, −x+z), all majors form/zoning @ roof+walls | FAIL: 3/4 drifted, majors form @ roof/ridge/upper edges | absent (first contact is this ticket) |
| `multi-angle/church-challenge.json` | — | — | REFUSAL `unparsed:-x-z` (3/4 drifted, form @ roof); kitPresence FAIL: `polished_basalt frame @ 169/544` |
| `reconstructed/<s>.json` | gated 20:54 (E-27 state) | gated 20:58 | gated 21:02 (challenge-routed, pre-kit) |

All three reconstructed records are **stale by intent**: T-108/T-109 regenerated the cottage and
gatehouse roof artifacts (shas 477399990e7c / 6ed2580cff4c — T-109 review #3), and the church kit
record changes its routing. The styled chain **re-cuts shell/reconstruction in-process** and verifies
component-layer pins against its in-chain shell (drift THROWS); the roof record/artifact is consumed
from disk (`roof/<s>.json` + `roof/<s>/artifact.json`), so the fresh chain picks up the T-108/109
roofs automatically. `reskin:<s>` (component-skin.mjs) is a distillation record with its own pins.

## 3. The chain stages (styled-milestone.mjs)

provision (challenge subjects; church `provision:{scale:48}`) → shell (componentStrip → rebuild →
fillVoids → plugClosure, THROWS) → cage (regularizeShell, IoU-gated) → reconstruct (pinned component
layer: decompose + roof + shaped; drift THROWS) → skin (value-true → kit overrides → seal → zones →
fill → coherence → gates; coverage gate now `metric:"own"` after T-110) → grammar (T-098;
frameRefilled MUST be 0) → dressing (T-099 apertures + kit treatments) → **settle** (T-100 fixpoint)
→ gate (spawned `multi-angle-gate.mjs --label styled`). Deterministic stages double-run, byte-equal
or no record; `--repro` re-proves fresh-process; LLM inputs (kit) committed one-time; judge pinned.

## 4. The settle non-convergence (the open seam, T-110 review #1)

styled-milestone.mjs:110–155. Settle re-runs grammar+dressing to fixpoint (≤4 iterations) by the
kit-presence checker's own criteria: `frameWants` (frame.painted+adopted), `foreign`
(fill placements over blocks **outside the zone's own vocabulary** — `ownOf` is built from
**`gOpts.policy`**, i.e. the registry fallback policy `{dominant, ...preserve}` per zone,
:127–133), `gating` (infill/shutters/door/light slots). Church: 4 iterations, still wants frame 14 /
foreign 170 / gating 0 → THROW (honest record, exit 1).

Measured correlates: kit presence names `polished_basalt` frame lines 169/544 missing (challenge-label
gate record); the foreign count is 170. T-110 hypothesized "grammar and dressing disagree about ~170
cells' zone vocabulary". Note the asymmetry: `ownOf` derives from the **registry policy** (transcribed
1:1 from `material-map/church.json` roles, pre-value-true names), while the fill/grammar operate on
the **live band-derived vocabulary** after value-true renaming (`polished_basalt` is the value-true
substitution of the church frame). Whether the 170 cells are a policy-vocabulary mismatch, a real
frame/fill ping-pong, or both, is not yet measured — no diagnostic exists that names the 170 cells'
zones/blocks. The settle comment pins the contract: "Non-convergence is a wiring bug, never smoothed."

## 5. The gate (frozen instrument)

`multi-angle-gate.mjs`: per view (4 azimuths +x+z/+x−z/−x−z/−x+z, elev 30°, 512², gapBudget 2,
coverageThreshold 0.5 — all from `MULTI_ANGLE_GATE` in src/config.mjs, no runner flags) — T-088
coverage precondition (`ownCoverage`, metric "own" — already so pre-T-110 at the gate, obs 14235),
then ONE judge call (`PHASE1_MODEL_ID`), triptych concept|mesh|view. Unparsed reply → recorded
verbatim (rawReply, parseError) → aggregate REFUSAL, never resampled. Kit presence (T-100) re-runs
the chain's own grammar op — pass ⇔ supplying-op no-op. `overall` = composeKitAwareVerdict (both
components, never collapsed). The church 225° REFUSAL stands as judged; T-110 review #2 assigns the
re-judge (a fresh chain run → fresh gate run, judged once) to this ticket.

## 6. The census-identity exception (AC2's only allowed diff)

E-28 Rule 1 (docs/active/epics/E-28-component-fit-closure.md:48): gate-side change permitted only for
a measurement-identity bug, monotone, both fractions reported, committed records stay valid. Third
instance = church band0 (T-110): coverage gates moved to role-family `ownCoverage`/`metric:"own"`,
monotone proof = `src/view/coverage-monotone.test.mjs` (record replay + own ⊇ dominant property).
Both fractions are in durable-skin failure messages and records. The multi-angle gate **contract**
fields (azimuths/elevation/size/gapBudget/coverageThreshold) were untouched by T-110 — the committed
cottage/gatehouse styled gate records carry the identical contract, so the instrument diff is
expected `diffs: []`; the exception citation covers the chain-side coverage gates.

## 7. Baselines and evidence conventions

- AC3 baselines (E-27 close): cottage **51 spikes / 6.8%** ragged, gatehouse **25 / 9.9%**, church
  **202 / 14.0%** (design-learnings.md:2323–2338; pr/assets/reconstructed-milestone.md). Census basis
  = `protrusionCensus` (≥4/6 exposed faces) + `raggedColumnRate` over full artifact occupancy
  (reconstructed-milestone.mjs:63). The runner's before-side is the pinned **E-26** baseline; AC4's
  "before/after vs the E-27 reconstructed builds" needs the E-27-state artifacts, which are the
  current committed `styled/<s>/artifact.json` / chain outputs at HEAD (pre-re-run) — capturable
  before the fresh runs overwrite them.
- Sheets: `renderSheet` (shared, placement-grammar.mjs) → 4-azimuth contact sheet; gate writes
  `pr/assets/frames/multi-angle-<s>-<label>.png`. .gitignore excludes only `styled/**/*.png`;
  artifacts and records are tracked (`benchmarks/sculpture/styled/church/` is currently untracked
  because the failed chain wrote intermediates but git hasn't staged them).
- `pr/assets/reconstructed-milestone.md` is the E-27 epic sheet convention: verdict-movement table,
  metrics table, evidence + reproducibility receipt.

## 8. design-learnings + E-12 handoff conventions

`docs/knowledge/design-learnings.md` ends with E-27 (:2287–2363). Established section shape:
five-whys → thesis → key findings → "Instrument frozen, and proven frozen" → "Milestone outcomes"
(per-subject, vs baselines) → "Over-reach, honestly" → "E-12 handoff". E-12 is the scoring/showcase
layer (not an epic doc): the handoff names the exact records/sheets it should consume and the rule
"score components, never collapse them". S-111.md confirms: journal + E-12 handoff; full passes the
target, honestly named residuals with their fit errors the acceptable fallback (E-28 Rule 4: one
judge run per view, verdicts committed).

## 9. Constraints and assumptions

- E-25 Rule 3: no subject keys/constants/branches in runners — subjects are registry data
  (self-grep recorded). E-25 Rule 6: pipeline-failed IS a result, exit 1, recorded.
- E-28 Rule 4: one judge run per view per milestone; a fresh chain run produces fresh verdicts
  (judged once); committed prior verdicts are never overwritten retroactively (separate labels).
- Determinism: GL rendering is excluded from decisions (reproducibility gates on byte-equality of
  artifacts/records, judge/GL evidence-only); `--repro` re-proof is judge-free by design.
- Test suite: 1431 unit tests + validator green at HEAD (T-109 close). Render suite 42/42 non-live.
- `npm test` runtime ≈ minutes; full styled chain per subject ≈ tens of minutes incl. judge calls
  (4/subject) — sequential per-subject runs are the precedent (T-107/T-110 sessions).
- Sibling-session check: T-109-01 work dir last touched 22:48, its review committed (746f44a); no
  live thread on T-111-01 (work dir absent before this session).

## 10. Open questions carried to Design

1. Does closure require **fixing** the church settle seam (chain-side wiring bug — legal under the
   freeze) or recording the refusal (honest fallback)? AC1 demands the full chain end-to-end per
   subject incl. settle; a settle THROW never reaches the gate, so the church's first styled verdicts
   exist only if settle converges.
2. Should `roof:church` re-run under the T-108/109 cores before the chain (T-110 review #4 says the
   committed record predates them; church majors are all form @ roof — exactly what S-108/S-109
   built)?
3. How to capture "before = E-27 reconstructed builds" for AC4 given the runner's before-side is
   pinned to E-26 (git-pinned snapshot of the current HEAD artifacts vs a new evidence script).
4. Whether `reskin:<s>` re-distillation is required after the roof re-runs, or whether the chain's
   in-process verification suffices (the milestone runner only reports pins pinned/ABSENT).
