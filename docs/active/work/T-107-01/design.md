# T-107-01 reconstructed-milestone — Design

Goal: one named run per subject through the full reconstructed chain with the instrument frozen;
verdicts re-recorded honestly; before/after metrics + sheets; E-27 learnings + E-12 handoff. The
load-bearing discovery from Research: the `form @ roof` FAILs are judged through a broken lens —
prismarine-viewer's `getModelVariants` treats every `*_stairs` block as air
(`'oak_stairs'.includes('air')` — "st-AIR-s"), so the stair-course roofs T-104 built are invisible.
A one-line meshing fix was proven live in Research. Without it, AC #4 ("stair-course roofs …
visible") is unsatisfiable and every re-verdict re-measures the lens debt, not the epic's claim.

## Decision 1 — fix the stair lens, as an E-22-class correction (on-disk patch + tripwire)

**Chosen**: patch `viewer/lib/models.js` getModelVariants to exact-match air
(`name === 'air' || 'cave_air' || 'void_air'`), applied by an idempotent script
(`render/scripts/patch-viewer-lens.mjs`) wired as `postinstall` in `render/package.json`, plus an
import-time tripwire in the render harness: if the installed `models.js` still contains the buggy
substring check, THROW with a named error before any render. Repo idioms honored: hard version
guards (`version.mjs`), vendored-fix precedent (`render/vendor/node-canvas-webgl`), no silent
degradation.

- Why on-disk: the mesher runs inside `worker_threads` workers that `require('./models')` from the
  package dir — a runtime monkey-patch cannot reach them (Research §4).
- Why not upgrade prismarine-viewer: an upgrade moves the whole lens (atlases, meshing, E-22
  calibration) — un-scoped verdict drift across every committed render. The patch's blast radius is
  exactly "blocks whose names contain `air` and are not air", i.e. stairs only (verified against the
  1.20.1 block list).
- Why not patch-package: same effect, plus a dependency; the explicit script + tripwire keeps the
  guarantee in OUR code and fails loudly on a fresh unpatched install either way.
- Instrument-freeze argument (AC #2): thresholds, azimuths, judge contract, prompt, model — all
  untouched. This is the E-22 precedent exactly (camera resolve fixed, builds byte-identical):
  artifact SHAs don't move (GL is excluded from reproducibility decisions); only pixels change, and
  only where stairs exist. The fix is named in records and learnings; verdict movement caused by it
  is the honest re-measurement this ticket exists to take.
- Proof protocol: re-run `fixture-card` (CARD_ROWS includes 5 stair rows; read-back already passes)
  — the committed proof record + card PNG flips from "stairs-invisible" to stairs-rendered. Add a
  GL-free mesher regression test (`render/test/`): oak_stairs section emits vertices.
- Prose pins updated: `fixture-card.mjs:45` finding, `roof-program.mjs` LENS_NOTE,
  `shaped-vocab.mjs:14` comment — each now records the fix instead of the gap.

**Rejected**: leaving the lens broken and arguing geometry-by-read-back (fails AC #4 literally;
re-verdicts would re-measure T-097's debt); swapping stairs for solid wedges at render time
(falsifies the build — worse than the disease).

## Decision 2 — terminal runner `reconstructed-milestone.mjs`, consuming the committed layer

**Chosen**: a new `benchmarks/sculpture/reconstructed-milestone.mjs` + npm scripts
`reconstructed:{cottage,gatehouse,church}`, shaped like `component-skin.mjs` (the T-106 precedent):
verify component-layer pins → spawn the milestone runner (`styled:*` if the registry has a kit,
else `challenge:*` — registry data, no subject branches) → distill the terminal E-27 record. The
chain it runs IS provision → regularize → reconstruct(decompose+rebuild via pinned committed
records) → shell/skin → grammar → dressing → settle → kit-aware + multi-angle gates.

- "decompose → rebuild" in AC #1 is satisfied by CONSUMING the committed component layer with pin
  verification (drift THROWS — T-106's church staleness was caught exactly this way). In-chain
  re-cutting was **rejected**: it duplicates three standalone runners, orphans their committed
  evidence, and replaces a tripwire (pin THROW → human decision) with silent recompute.
- What the terminal runner adds over `reskin:*` (which stays as T-106's record):
  1. **Instrument confirmation** (AC #2): before spawning, capture the committed gate record's
     `contract` + judge model; after, deep-diff against the fresh record. Recorded as
     `instrument: {frozen, diffs: [], judgeModel}` — must be empty diffs, else the record names them.
  2. **Metrics before/after** (AC #3): protrusion census + ragged-column rate (pure fns from
     `src/view/shell-regularize.mjs`) measured on the pinned E-26 baseline artifact AND the fresh
     final; roof fit summary from `roof/<k>.json`; cage outcomes from the chain's regularize stage;
     church band0 from the chain record (pass or measured-cause failure).
  3. **Sheets** (AC #4): 4-azimuth before/after via the existing `renderSheet` —
     `pr/assets/frames/reconstructed-<k>-{before,after}.png`; the gate's own labeled sheet is the
     per-azimuth evidence. One epic markdown `pr/assets/reconstructed-milestone.md`.
  4. **Record**: `benchmarks/sculpture/reconstructed/<k>.{json,md}` with chain summary, verdicts,
     instrument, metrics, generalization line, `reproducible` block (milestone SHAs + distillation
     determinism), findings (church: kit-less, roof-fallback, band0 — all named).

**Rejected**: extending `component-skin.mjs` (T-106's record should stay frozen as its evidence;
the epics' terminal runners are separate by convention — challenge=E-25, styled=E-26); folding the
metrics into `styled-milestone.mjs` (cross-epic comparison is the terminal story's job, not the
chain's).

## Decision 3 — pinned E-26 baselines, snapshotted once from git history

The working tree's `styled/*` artifacts were REFRESHED by T-106 — the "before" of AC #3/#4 no longer
exists on disk. **Chosen**: extract each subject's last E-26-era final artifact from git history
(cottage/gatehouse: `styled/<k>/artifact.json` at the T-101-close commit `5574d70`…; church:
`challenge/church/artifact.json` at its last pre-T-106 commit), commit them as wrapper JSONs
`benchmarks/sculpture/reconstructed/<k>/e26-baseline.json` `{sourceCommit, sourcePath, artifact}` —
a one-time, provenance-stamped evidence input. The runner reads only committed files (offline,
deterministic, "no inline edits"); the AC's quoted numbers (cottage styled 265/21.7%) are
re-DERIVED from the snapshot, and any mismatch with the ticket's prose is a named finding, not a
constant to hit. Baseline pointers live in the runner's registry-data table (the EXTRAS-table
convention from `challenge-milestone.mjs`).

**Rejected**: `git show` at runtime (network-free but not self-contained; breaks --offline
re-assert on detached checkouts); trusting the ticket's numbers as constants (unverifiable).

## Decision 4 — run order and re-verdict protocol

1. Lens patch + tripwire + mesher test + fixture-card refresh (proof the lens is fixed FIRST —
   every later render depends on it).
2. Baseline snapshots committed.
3. `reconstructed:cottage`, `reconstructed:gatehouse` (each spawns the full styled chain: ~4 judge
   calls/subject; settle + gates re-run; committed styled/multi-angle records refresh — they are
   the chain's canonical outputs, T-106 precedent).
4. `reconstructed:church` (challenge path; expected: coverage gate THROWS at band0 unless the
   reconstructed composition moved the census — either way the record carries the re-measurement;
   0 judge calls if short-circuited).
5. Double-run byte-equality is inherited from the milestones; fresh-process `--repro` re-proof on
   each; `--offline` re-assert for the reconstructed records themselves.
6. `docs/knowledge/design-learnings.md` E-27 section (five-whys → per-ticket items → per-subject
   outcomes → over/under-reach → E-12 handoff), then review.

Verdict expectations, stated honestly in advance: stairs rendering removes the KNOWN cause of the
roof-form gap, but judges may still name residuals (ridge caps, chimney massing, gatehouse arch
read). The AC's success criterion accepts either outcome — full passes OR honestly named residuals
per angle/region/attribute. No re-rolls: one gate run per subject is the verdict; flappy-budget
re-runs are the E-26-named anti-pattern.

## Risks

- **Judge non-determinism**: verdicts are LLM calls; a marginal view can flip. Mitigation: the
  record IS the verdict (committed once); `--repro` never re-judges (established).
- **Lens fix collateral**: any committed render containing stairs will differ on re-render. Only
  re-rendered evidence changes; committed PNGs from prior epics stay as their epochs' evidence
  (convention: records pin their own renders).
- **Coverage arithmetic**: verify at implement that T-088 coverage census is block/zone-based (not
  pixel-based) so the lens fix cannot move coverage numbers — Research believes so; confirm and
  record.
- **Church chain**: if the coverage THROW happens before a final artifact lands, the church "after"
  sheet renders the last on-disk artifact with its stage named (honest, like T-106's record).
- **Working-tree hygiene**: sibling Lisa sessions touch `.lisa*`/tickets — commits stay path-scoped
  (T-106 convention).

## Acceptance-criteria trace

- AC #1 → Decision 2 (named runs, registry-only, repro inherited + --repro/--offline).
- AC #2 → Decision 2.1 instrument diff + Decision 4 one-shot verdicts.
- AC #3 → Decision 2.2 + Decision 3 baselines.
- AC #4 → Decision 1 (visibility) + Decision 2.3 sheets.
- AC #5 → Decision 4 step 6 (learnings + E-12 handoff), `npm test` green throughout.
