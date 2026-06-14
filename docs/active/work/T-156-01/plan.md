# T-156-01 — Plan (archive-retired)

Execute the structure.md manifest in four committed batches. **The 2138-test suite is the oracle:**
`npm test` must be green before every commit; the source-scan conformance tests turn any missed
runner-path reference into a loud failure, so a forgotten reference cannot pass silently.

## Pre-flight

- `git status` clean-enough on the touched area; record the baseline `npm test` count (expect 2138).
- `mkdir benchmarks/sculpture/_archive`.
- Re-run the per-entry reference scan (`/tmp/refs2.mjs`) once more if uncertain on any boundary item.

## Step 1 — Batch 1: Tier-A self-contained runners + dirs

1. `git mv` each Batch-1 runner and its output dir into `_archive/` (glb-voxel family, e18/e19
   scorecards, sweep, the `*-ab` experiments, `building-*`, `cleanliness-baseline`, `form-baseline`,
   `provision-concept`, `voxelize-sanity`, `view-layer-proof`, `facade-relief-proof`,
   `surface-coherence`, `resemblance*`).
2. For each runner with a `sweep-ablation.json`-style sidecar: `git grep` the sidecar; move it only if
   no live test reads it.
3. `npm test` → **green**. Commit: `chore(T-156-01): archive Tier-A retired-epic runners + trees`.

**Verify:** `git grep -lI "sculpture/<moved>" -- ':!**/_archive/**' ':!docs/active/work'` returns only
historical work-dir docs (acceptable) — no live `src`/`*.test.mjs`/`package.json` hit.

## Step 2 — Batch 2: Tier-A with pkg/src referrers

1. `git mv` `material-correct/assign/map`, `secondary-palette`, `palette-discipline`, `value-select`,
   `detector-routing`, `form-routing`, `surgical-standard`, `hollow-cottage`,
   `hollow-cottage-milestone`, `floorplan-cottage`, `e19-build`, `concept-materials-ab` (+ dirs).
2. `package.json`: remove their npm scripts (structure.md table).
3. Update brush-door.conformance entries for `hollow-cottage`, `floorplan-cottage`,
   `hollow-cottage-milestone` → `_archive/…`.
4. Update retired `src/*` OUT-path strings that point into a moved dir → `_archive/…`.
5. `npm test` → **green**. Commit: `chore(T-156-01): archive material/palette + hollow-cottage chains`.

## Step 3 — Batch 3: Tier-B superseded chains

1. `git mv` `styled-milestone`, `challenge-milestone`, `reconstructed-milestone`, `regularize-shell`,
   `pattern-book`, `pattern-book-compare` → `_archive/` (runners only; **record dirs stay**).
2. Update the three source-scan conformance path lists (pin-guard, brush-door, material-vocabulary) +
   the two cosmetic comment paths → `_archive/…`.
3. `package.json`: remove `styled:*`, `challenge:*`, `reconstructed:*`, `regularize:*`, `generated:*`,
   `patternbook:{cottage,barn,repro,offline,*saltcrag*}`, `patternbook:compare`, `pattern:cottage`.
   Keep `gate:patternbook:*` (kept gate + kept records).
4. `npm test` → **green**. Commit: `chore(T-156-01): archive superseded standalone chains`.

## Step 4 — Batch 4: docs + manifest

1. `STRUCTURE.md`: flip the "Retired from the live path (… not yet moved)" section to "Archived
   (S-156 / T-156-01)" with `_archive/…` paths.
2. `benchmarks/sculpture/README.md`: fix any link to a moved path.
3. Write `benchmarks/sculpture/_archive/README.md` — the manifest (name → closing epic/ticket →
   reason), grouped Tier-A / Tier-B.
4. Final `npm test` → **green**. Commit: `docs(T-156-01): archive manifest + STRUCTURE flip`.

## Testing strategy

- **No new unit tests** — this is a move + reference-update ticket; correctness = the existing 2138
  tests staying green, which directly proves "nothing live depended on the archived trees" (AC#5) and
  "every committed reference updated or refused" (AC#3).
- **The conformance suites are the regression net**: `pin-guard.conformance`, `brush-door.conformance`,
  `material-vocabulary.conformance` `readFileSync` each listed runner path → a wrong/missed path fails
  immediately. `component-skin-distill.test` proves the kept record dirs (styled/challenge/reconstructed)
  still resolve.
- **Reference audit** after Step 4: `git grep -lI "benchmarks/sculpture/<each-moved-name>"` excluding
  `_archive/` and `docs/active/work/` must be empty for the *live spine* (only intentional `_archive/…`
  references in conformance tests + historical work docs remain).
- **Reversibility check**: `git mv` keeps blobs; `git log --follow` on a moved file resolves.

## Risks & mitigations

- **A retired dir is read by a live test (sweep-ablation tst=1).** Mitigation: per-item `git grep`
  before each `git mv`; if a live test reads it, KEEP the dir, archive only the runner, record it.
- **An npm-script removal breaks a chained script.** Mitigation: scripts are leaf invocations; `npm
  test` doesn't run them. Grep `package.json` for any script that *calls another* removed script.
- **Over-archiving a still-live evidence runner.** Mitigation: the KEEP list is explicit; boundary
  evidence runners (spray-paint, surface-pattern, glb-smoke, registration-smoke, shell-integrity) are
  deliberately KEPT this pass and recorded for S-157.
- **Scope/time.** If a batch proves too entangled, commit the safe subset and record the rest as
  refused (E-37 Rule 2) — a partial, reference-safe archive still satisfies the ACs' "or the move is
  refused and recorded."
