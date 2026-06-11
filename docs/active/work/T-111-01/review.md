# T-111-01 closure-milestone — Review (handoff)

## What this ticket did

Asked and answered the E-28 arc's question under the frozen instrument: **do cottage, gatehouse,
church now pass the full multi-angle gate?** Answer: **no** — recorded with the receipts that say
exactly why, per E-28 Rule 4's fallback ("honestly named residuals with the fit errors that explain
them; the DoD then rests with the reviewer"). This is a *measurement* ticket: **zero source-code
changes shipped** (see deviation), all six commits are live records, evidence, and docs.

## Commits (all on `main`)

| Commit | Content |
|---|---|
| `2afb53f` | closure-<subj>-before.png ×3 — byte-copies of the E-27 reconstructed sheets pre-captured before the re-runs overwrote them |
| `0064dfd` | `roof:church` first cut under the T-108/109 cores: nave ACCEPTED `end-fitted-gable-ends` (ridge Δ +0.378), tower honest fallback (pyramidal cap), 12/14 terminations, residual 18 cells removed (refuted @ +x+z) / 5-cell mass exempt; `--repro` MATCH (b107b729df7b), `--offline` OK |
| `cb4ef4b` | cottage closure chain: gate FAIL 10/2, **135°/225° same object held**, 45° major form→massing, kit presence PASS, instrument `diffs: []` |
| `25a80cb` | gatehouse closure chain: gate FAIL 12/2, **4/4 drifted** (315° regressed), roof-form major everywhere, kit presence PASS, instrument `diffs: []` |
| `f4f996b` | church closure chain: honest refusal @ settle (frame 13 / foreign fill 168 after 4 re-runs), instrument untouched (no gate ran); previously-untracked styled/church/* artifacts committed |
| `166b8e7` | closure-after frames ×3, `pr/assets/closure-milestone.md`, design-learnings **E-28 section + E-12 handoff** |

## Acceptance criteria status

1. **One named npm run per subject, full chain, reproducible, registry-only** — DONE.
   `reconstructed:{cottage,gatehouse,church}`; double-run byte-equality in-runner; fresh-process
   `--repro`: cottage MATCH `33ffd0c825a0…`, gatehouse MATCH `a8b4c58e3571…`, church honestly
   "pipeline-failed — nothing to reproduce" (exit 1); `--offline` re-asserts all three; self-grep
   `subjectKeysInRunner: []` embedded per record. **Caveat:** the church chain end-to-end *refuses
   at settle* — the full-chain run exists and is the record; the gate stage was not reached.
2. **Instrument-diff committed per subject** — DONE, cleaner than the allowance: `diffs: []` on
   both gated subjects (deep-diff vs committed pre-run records; judge `claude-opus-4-8` pinned);
   church "untouched (no gate ran)". The T-110 census-identity exception produced zero contract
   diffs; its monotone proof (`src/view/coverage-monotone.test.mjs`) and both-fractions reporting
   are cited in the epic sheet and learnings. One run per view, no re-rolls — the 4/4-drifted
   gatehouse verdict was committed as judged.
3. **Verdicts + receipts per subject** — DONE. Per-angle/region/attribute in
   `reconstructed/<subj>.json`; fit errors (cottage ends faceRmse 1.541/1.116/1.038 + refused
   cross-lo; gatehouse `end-hip`×2/`end-fit-insane` + invalid ridge intersect named; church nave
   accepted / tower fallback / ridge Δ +0.378); cage outcomes (terminations 4/7/12 accepted,
   residual decisions with per-azimuth spill evidence); census vs E-27 baselines — cottage
   51/6.8% → 86/6.3%, gatehouse 25/9.9% → 43/8.1%, church 202/14.0% → 204/15.9%, with the spike
   rises **measured cell-by-cell** to the declared verge-sheet/cap cells (36 spruce_planks +
   2 dark_oak_log on cottage). The church's first-ever kit-presence + multi-angle verdicts are the
   committed T-110 challenge-label ones (REFUSAL `unparsed:-x-z`, kit FAIL 169/544), cited as such;
   no styled-label verdicts exist yet (settle refusal precedes the gate).
4. **Contact sheets + before/after vs E-27 to pr/assets** — DONE.
   `closure-<subj>-{before,after}.png` ×3 (before = E-27 builds @ ccb198e, same lens), gate sheets
   for the two gated subjects, `closure-milestone.md` as the epic sheet. Full passes were the
   target; the recorded result is the honest fallback, residuals named with their fit errors.
5. **design-learnings E-28 section + E-12 handoff; npm test green** — DONE (166b8e7);
   validator + **1431/1431** unit tests + run-twice byte-equality receipts green at close.

## Deviation (the one that matters)

The original design chose to FIX the church settle non-convergence (a chain-side wiring bug). Mid-
ticket, commit `ccb198e` (E-29 + S-112…S-116) landed and assigns that fix to **S-113
vocabulary-authority** — "one role→block-set contract… the proof: the church styled chain settles"
— DAG-sequenced *after* T-111-01, whose verdicts pin E-29's targets. Plan steps 3–4 were cancelled
(addenda in design/structure/plan; progress deviation 1): fixing here would duplicate or mask
S-113's scope (`parallel-roots-duplicate-shared-deps`). The fresh refusal (13/168, shifted from
T-110's 14/170 only by the new roof) is itself evidence the split is structural, not roof-coupled.

## Test coverage assessment

No new code → no new unit tests; the suite stayed green at every commit boundary. Live coverage is
the project's standing seam convention: double-run byte-equality, fresh-process `--repro`,
`--offline` asserts — all exercised and recorded this ticket. **Gap carried forward:** the settle
loop's accounting is still inline in styled-milestone.mjs (untestable as-is); extracting it as a
pure tested core was designed here (structure.md §A, cancelled) and is ready material for T-113-01.

## Open concerns for a human reviewer

1. **Gatehouse regressed a view** (3/4 → 4/4 drifted, gapCount 11 → 12) despite better fits and
   census. The judge now names the two GLB-backed "protruding masses" T-109 exempt-showed —
   per-mass membership vs the judge's per-column perception is the named divergence (E-29/S-112
   territory; the memory note `multi-angle-gate-findings` flags budget-edge flappiness too). No
   re-roll was taken; the verdict stands.
2. **The spike census's meaning shifted**: declared open-underside sheet/cap cells now read as
   "spikes"/"ragged" in the naive full-occupancy census (counted-never-hidden, T-108 review #1).
   The numbers beside the E-27 baselines are honest but not like-for-like without the declared-cell
   ledger; the epic sheet says so explicitly. If E-12 scores census deltas, it must read the ledger.
3. **The church has no styled-label verdicts** — by design this ticket records the refusal rather
   than fixing S-113's seam early. The challenge-label REFUSAL (unparsed 225°) also still stands;
   S-114 owns the re-ask policy. Anyone reading "closure" should see: closure = the question
   answered with receipts, not the gates passed.
4. **`reskin:<subj>` distillation records were not re-cut** after the fresh chains (the chain
   verifies the component layer in-process; the milestone runner reports pins pinned). If a
   downstream consumer reads `component-skin/<subj>.json` pins against the NEW milestone shas, it
   should re-distill first — cheap, named, and deliberately left out of this measurement ticket.
5. **E-29 target pinning can proceed**: the verdicts E-29's S-115/S-116 baseline against are now
   committed (this was the sequencing dependency named in its epic doc).
