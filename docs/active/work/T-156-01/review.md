# T-156-01 — Review (archive-retired)

Handoff for a human reviewer. E-37 / S-156: archive the retired `benchmarks/sculpture/` sediment so
the live tree reads as the canonical spine only — **archive, not delete**; reference-checked first.

## What changed (one commit: `d684212`)

A single, reference-checked archival commit on top of T-155-01 (`e8b4f71`). All moves are `git mv`
(byte-identical blobs, `git log --follow` walks through them).

### Moved into `benchmarks/sculpture/_archive/` — 48 runners + 18 output trees
- **Superseded standalone chains:** `styled-milestone`, `challenge-milestone`,
  `reconstructed-milestone`, `regularize-shell`, `pattern-book`, `pattern-book-compare`.
- **Retired-epic sediment (E-13→E-24):** the `glb-voxel*` family + `surgical-standard`; `e18-*`/`e19-*`;
  `sweep-ablation`/`sweep-scorecard`; the `*-ab` A/B experiments; the material/palette epoch
  (`material-correct/assign/map`, `secondary-palette`, `palette-discipline`, `value-select`,
  `value-match-ab`, `concept-ab`, `concept-materials-ab`, `codesign-ab`, `resemblance*`,
  `surface-coherence`); `building-*`; the baselines + spikes (`cleanliness-baseline`, `form-baseline`,
  `provision-concept`, `detector-routing`, `form-routing`, `voxelize-sanity`, `view-layer-proof`,
  `facade-relief-proof`); the E-23 `hollow-cottage`/`hollow-cottage-milestone`/`floorplan-cottage`.
- Live top-level runners: **~90 → 41**. Full manifest in `benchmarks/sculpture/_archive/README.md`.

### Modified in place — references updated (E-37 Rule 2)
- **Source-scan conformance tests** (each `readFileSync`s the listed runner paths) repointed to
  `_archive/…`, so they *still enforce* the door/pin-guard/vocabulary invariants on the archived
  sources: `src/form/pin-guard.conformance.test.mjs` (PIN_WRITERS),
  `src/pack/brush-door.conformance.test.mjs` (ALLOWED), `src/form/material-vocabulary.conformance.test.mjs`
  (CONSUMERS + VOCAB_FED), `src/workshop/isolation.test.mjs` (the judge-seam scan of `pattern-book.mjs`).
- **Pure-half `src/*` lib provenance comments** repointed to `_archive/…` (scorecard, remeasure,
  resemblance, material-map, surgical-standard, value-select, e19-cleanup, building-build,
  concept-materials-ab, palette-swatch, head-to-head, hollow-carve, floorplan, roof-patch,
  surface-coherence) + two test comments (material-vocabulary.test, shell-regularize.test) +
  `benchmarks/sculpture/registration-smoke.mjs` (usage comment).
- **`package.json`** — 42 retired npm scripts removed (`styled:*`, `challenge:*`, `reconstructed:*`,
  `regularize:*`, `generated:*`, `patternbook:*`, `material:*`, `value:select`, `e19:build`,
  `building:build`, `view:proof`, `coherence:cottage`, `resemblance*`, `hollow:*`, `floorplan:*`,
  `milestone:cottage`, `surgical:standard`, `detect:routing`, `form:routing`, `concept:ab`).
  `gate:patternbook:*` **kept** (it invokes the kept gate over kept committed records).
- **`STRUCTURE.md`** — the "Retired from the live path (… not yet moved)" section flipped to "ARCHIVED
  (S-156 / T-156-01)" with `_archive/…` paths; **`_archive/README.md`** added (the manifest).

### Kept live deliberately (recorded, not archived)
- `generated-milestone.mjs` — `build.mjs` spawns it (Stage-4 seed); only its `generated:*` scripts went.
- Record dirs feeding the kept Stage-4 skin — `styled/`, `challenge/`, `reconstructed/`, `regularize/`,
  `components/`, `roof/`, `shaped/`, `zone-map/`, and `pattern-book/` baselines (read by
  `component-skin-distill`, `visibility-monotone`, `pin-guard` tests). The *runner* retires; the
  *records* stay.
- `concept-materials/` — live input (`after-artifact.json` canvas) to the kept `spray-paint.mjs`.
- Current evidence runners a live test scans by path — `spray-paint`, `surface-pattern`, `glb-smoke`,
  `registration-smoke`, `shell-integrity` (current, not E-09→E-24 sediment).

## How it satisfies the ACs
- **AC#1 retired-epic trees → `_archive/`** — done (glb-voxel*, e18/e19, sweep, *-ab, material-*,
  secondary-palette, palette-discipline, value-select, concept-materials-ab, surgical, building, …).
- **AC#2 superseded standalone runners → `_archive/`** — styled/challenge/reconstructed-milestone,
  regularize-shell, pattern-book(+compare); `generated-milestone`'s standalone *npm role* removed while
  its file stays (build spawns it).
- **AC#3 reference-checked first** — every committed test/record/npm-script reference updated; the
  source-scan conformance suites are the regression net (they `readFileSync` each path). No live module
  imports a moved one. No move had to be *refused* (the entangled cases resolved by repoint or by
  keeping a consumed record dir).
- **AC#4 folding recorded** — kit recognition stays folded into the Stage-4 skin (component-skin +
  its consumed record dirs kept); reconstruction/regularize (E-27/28) archived (runner moved, records
  kept as skin inputs). Captured in `_archive/README.md` + STRUCTURE.md.
- **AC#5 `npm test` green; live tree = canonical spine** — `npm test` exit 0, **2146/2146** (validate
  self-test + valid/invalid fixtures + unit suite); live runners ~90 → 41.

## Test coverage
- **No new tests** — this is a move + reference-update ticket. Correctness = the existing 2146 tests
  staying green after every batch, which directly proves AC#5 ("nothing live depended on the archived
  trees") and AC#3 ("every reference updated"). The four source-scan conformance suites are the net.
- **Oracle caught a literal-grep miss:** `src/workshop/isolation.test.mjs` builds the `pattern-book.mjs`
  path via `join(ROOT,"benchmarks","sculpture",...)` (segment-joined), so the string-grep audit missed
  it; the test failed loudly on the move and was repointed. A follow-up segment-joined audit confirmed
  no other such reference remains.

## Open concerns for human attention
1. **Commit hygiene incident (handled).** The first-pass batch commits used `git add -A
   benchmarks/sculpture`, which swept in **pre-existing uncommitted files from other sessions** (the
   barn artifacts `generated/barn.{json,md}`, `multi-angle/barn-generated.*`, `roof-diff/barn-generated.*`,
   `challenge/cottage/{component-plan,reconstructed-artifact}.json`, and a stray `HEIF Image.heic`).
   Since no sibling commit had landed on top, I `git reset --soft`'d my commits, unstaged those files
   back to the working tree for their owning session, and re-committed **only** the archival work. The
   contaminants are **not** in `d684212`; they remain as working-tree `M`/`??` for their owner. Lesson
   (matches the project's "shared-file commit sweep" note): stage explicit paths, never `-A`, on a
   shared branch.
2. **Display-time renames.** `git`’s rename detection limit shows some archived files as add/delete in
   `--stat` rather than `R`; the blobs are byte-identical (`git mv`), so there is no repo bloat — use
   `git -c diff.renameLimit=4000 show` to see them paired.
3. **`_archive/` ALLOWLIST entries are now dead-but-present** in brush-door.conformance: its closed
   sweep is non-recursive over `benchmarks/sculpture`, so archived runners drop out of the sweep, and
   the repointed `_archive/…` ALLOWED keys are unused (harmless; tests green). S-157's permanent
   topology guard can decide whether to prune them.
4. **Boundary runners kept this pass** (spray-paint, surface-pattern, glb-smoke, registration-smoke,
   shell-integrity) are current evidence runners scanned by live tests; re-evaluating them belongs with
   S-157, not this move.
5. **`-build` namespace collapse** (T-154-01 open concern #3) is still open and independent of this
   ticket.

## Risk assessment
Low. Every change is a `git mv` or a path-string update; the 2146-test suite is green and the
source-scan conformance suites would fail loudly on any missed reference. Reversibility is intrinsic to
`git mv`. The one real hazard (commit-sweep) was caught and corrected before handoff.
