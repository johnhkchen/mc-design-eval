# T-156-01 — Design (archive-retired)

Decision: perform a **one-time, reference-checked `git mv` of the retired sediment** into
`benchmarks/sculpture/_archive/`, mirroring the original relative layout, with every committed
test/npm-script/source reference to a moved path **updated in the same batch** — or the individual
move **refused and recorded** (E-37 Rule 2). The unit of safety is the batch + `npm test` as oracle.

## Options considered

**O1 — `git rm` (delete; history in git).** Rejected. The ticket is explicit: *archive, don't delete*
— reversible, history walkable in the working tree, `--repro` of an archived chain still reconstructable.
Deletion also makes the reference-check moot (dangling references would just 404 at runtime).

**O2 — Move everything not in the live import closure (35 runners).** Rejected as *too aggressive*.
The closure misses (a) record dirs consumed by the kept Stage-4 skin (`reconstructed/`, `styled/`,
`challenge/`), (b) measurement instruments invoked only via npm scripts (not import-reachable), and
(c) record-pinned evidence runners that live conformance tests scan by path. A blind closure-diff move
would break `component-skin-distill.test` (loses its input records) and the conformance suites.

**O3 — Archive only the explicitly-enumerated retired set + superseded chains, KEEP everything the
live spine / measurement instruments / Stage-4 skin reference, update references in-batch, refuse +
record the entangled remainder.** **CHOSEN.** Maps 1:1 to the ACs, honors E-37 Rule 2, and uses the
2138-test suite as the correctness oracle so no live path is silently broken.

## The keep/archive boundary (decided)

**KEEP (live spine, measurement instruments, Stage-4 skin feed, and their consumed data dirs)** — the
full list in research.md §2. Rationale anchors:
- `generated-milestone.mjs` — `build.mjs` **spawns** it; archiving it would sever the live chain.
- `reconstructed/`, `styled/`, `challenge/`, `components/`, `roof/`, `shaped/`, `regularize/`,
  `zone-map/` (record dirs) — read by the kept `component-skin` distill (AC: kit recognition folds
  into the Stage-4 skin, **kept, it already feeds it**). The *runner* retires; the *records* stay.
- Record-pinned **evidence runners that a LIVE test scans by path and are NOT retired-epic sediment**
  — `spray-paint.mjs`, `surface-pattern.mjs`, `glb-smoke.mjs`, `registration-smoke.mjs`,
  `shell-integrity.mjs` (brush-door / pin-guard / view-suite pins, E-23/T-087/T-120). These are
  *current* evidence runners, not E-09→E-24 closed-epic sediment; **KEEP this pass** and record the
  judgment. (Re-evaluating them belongs with S-157's permanent guardrail, not this move.)

**ARCHIVE** — two tiers (full manifest in structure.md):
- **Tier A — retired-epic sediment (E-13→E-24 closed):** the `glb-voxel*` family, `surgical-standard`,
  `e18-*`/`e19-*`, `sweep-ablation`/`sweep-scorecard`, the `*-ab` A/B experiments
  (`form-revise-ab`, `glb-formtarget-ab`, `glb-grounded-ab`, `concept-ab`, `concept-materials-ab`,
  `value-match-ab`, `codesign-ab`), the material/palette epoch (`material-correct`, `material-assign`,
  `material-map`, `secondary-palette`, `palette-discipline`, `value-select`, `concept-materials`,
  `resemblance`/`resemblance-consolidation`, `surface-coherence`), the building-mode + assorted spikes
  (`building-build`, `building-concept`, `cleanliness-baseline`, `form-baseline`, `provision-concept`,
  `detector-routing`, `form-routing`, `voxelize-sanity`, `view-layer-proof`, `facade-relief-proof`,
  `hollow-cottage`/`hollow-cottage-milestone`/`floorplan-cottage`), each with its record dir.
- **Tier B — superseded standalone chains:** `styled-milestone`, `challenge-milestone`,
  `reconstructed-milestone`, `regularize-shell`, `pattern-book` + `pattern-book-compare`. (Their
  shared `styledStretch`/`seedWorkshopProgram` logic already lives inside Stage 4 / `src/*`; only the
  *terminal runner* role retires.)

Tier-B runners are the ones the **source-scan conformance tests name** → their path strings move with
them (see reference rules). Tier-A runners are mostly self-contained retired components.

## Reference-handling rules (applied per move, before commit)

1. **Source-scan conformance lists** (`pin-guard.conformance`, `brush-door.conformance`,
   `material-vocabulary.conformance`): rewrite the moved runner's path string from
   `benchmarks/sculpture/<r>.mjs` → `benchmarks/sculpture/_archive/<r>.mjs`. The scan still opens the
   source; archived code still conforms → test stays green, invariant un-weakened. *(Do NOT delete the
   entry — that would silently drop pin-guard/brush-door enforcement on a still-committed runner.)*
2. **`package.json` scripts** for archived runners: **remove** the script (its chain is retired). If a
   script is a still-wanted convenience, repoint it to `_archive/…`. Default = remove; record removals.
3. **Record dirs feeding the kept skin** (`reconstructed/`, `styled/`, `challenge/`, …): **do not
   move.** They are pinned inputs; `component-skin-distill.test` reads them.
4. **Retired `src/*` OUT-path strings** (e.g. `src/form/material-map.mjs` default output) pointing into
   a moved dir: update the string to `_archive/…`. No test executes these, but E-37 Rule 2 requires the
   committed reference be updated. *(These `src/*` modules are themselves retired-only consumers; if a
   module's sole importers are archived runners it is a candidate to archive too — but `src/` reshaping
   is S-157's remit; this pass updates the path string and leaves the module in place.)*
5. **Docs:** update `STRUCTURE.md` ("Retired from the live path… archive in S-156" → "archived") and
   the sculpture `README.md` if it links a moved path. Historical `docs/active/work/<ticket>/*.md`
   artifacts describe *past* state — left as-is (not load-bearing, not a green-test gate).
6. **Refuse + record.** If a move would break a reference that *cannot* be cleanly updated (a live,
   actively-tested module that genuinely needs the runner at its live path), the move is **skipped** and
   logged in `progress.md` / `review.md` with the blocking reference. The AC explicitly allows this.

## Mechanism & batching

- **`git mv`** for every move — byte-identical content, history preserved (mirrors T-155-01's
  precedent: pure renames, 0 bytes changed).
- **Batches**, each committed atomically, `npm test` green before commit:
  1. Tier-A self-contained runners+dirs with **no test/pkg referrer** (lowest risk).
  2. Tier-A runners+dirs with **only `pkg`/`src` OUT-path referrers** — remove scripts / update paths.
  3. Tier-B superseded chains — update the three conformance path lists + remove npm scripts.
  4. Docs sweep (STRUCTURE.md, README) + final `npm test` + `_archive/README.md` manifest.
- **`_archive/` layout:** `benchmarks/sculpture/_archive/<original-name>` (runner) and
  `…/_archive/<original-name>/` (its record dir), preserving the relative pairing so an archived
  chain is reconstructable in place.

## Why this is safe

The hard gate (`npm test` 2138 green) is checked after every batch; the source-scan conformance tests
turn any *missed* runner-path reference into a loud failure (the suite literally `readFileSync`s the
listed paths), so the oracle cannot be fooled by a forgotten reference. Record dirs that feed the kept
skin are explicitly excluded from the move. Nothing in the live spine imports `_archive/` (S-157 makes
that permanent). Reversibility is intrinsic to `git mv`.
