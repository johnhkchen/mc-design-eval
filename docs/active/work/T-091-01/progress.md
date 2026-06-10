# T-091-01 shell-integrity-and-debris — Progress

## Step 1 — pure cores + tests ✅ (commit e6d3e00)

- `src/view/surface-pattern.mjs`: priority-flood extracted as exported `spillLevels(valueMap)`;
  `regularizeRoofCourses` delegates. Existing course tests pin the behavior — unchanged-green.
- `src/view/shell-integrity.mjs`: `componentStrip` (largest + grounded, declared report; reuses
  `componentLabels` via an Int32 shape adapter), `rebuildArtifact` (canonical (y,z,x) one-voxel-per-cell
  rebuild — no air op in the contract), `openingRegions`/`inRegion` (world-AABB allow-list from the
  structural read's through-openings), `fillVoids` (per-face depth-basin repair over `-depth` via the
  shared `spillLevels`; relief floor `minDepth=3`), `closureCheck` (ground-solid six-direction
  watertightness of the standing build; declared openings are honorary skin; breaches attributed to the
  shaft's escape directions), `plugClosure` (fills mouths with the owning zone's dominant until closed;
  THROWS at the cap).
- `src/view/shell-integrity.test.mjs`: 16 tests on synthetic occupancies.
- **Deviation (fixed during step)**: the first per-direction attribution tagged the mouth-crossing axis
  (lateral) instead of the breach direction; re-specified as the non-interior shaft cell's ray ESCAPE
  direction(s) — a roof-hole shaft now correctly reports `+y`. Two tests caught it.
- `npm test`: **1082/1082 green**.

## Step 2 — witnessed-artifact runner + live records ✅ (commit 9143d63)

- `benchmarks/sculpture/shell-integrity.mjs` + `shell:cottage`/`shell:gatehouse` npm scripts +
  `.gitignore` stanza.
- **Live cottage** (`spray-paint/cottage/artifact.json`): strip **23 → 1 components, 126 cells**
  (AC numbers hard-asserted in the runner), voids 1126 cells filled (`+x 455, -x 199, +z 368 (10
  allow-skipped at the declared windows), -z 82, +y 22`), plug 338 cells in 1 iteration, closure
  **CLOSED** (before: 2483/2490 interior cells exterior-reachable). Double-run byte-identical,
  sha256 `3e07184693f0…`.
- **Live gatehouse** (`building/best/artifact.json`): 1 component (nothing stripped — matches the
  witnessed measurement), voids 11071 cells (the upper-right cavity + the noisy E-20 roof channels;
  zero allow-skips needed — no basin column touched the arch), plug 503 in 1 iteration, closure
  **CLOSED** (before: 22069/22203 reachable). sha256 `82247f301ee0…`.
- **Render evidence inspected**: cottage oblique 225° before/after shows the floating grey debris gone
  from the silhouette and the roof reading solid; gatehouse 225° shows the upper-right missing-mass
  region patched with the wall plane restored while the arch passage stays open (declared `door`
  region); committed frames `pr/assets/frames/shell-{cottage,gatehouse}-{before,after}.png`.
- `--offline` re-asserts pass for both; `npm test` unchanged-green.

## Step 3 — durable-skin wiring: **DEVIATION — intentionally not done in this ticket**

plan.md Step 3 scheduled wiring strip/void/closure into `durable-skin.mjs`. While implementing,
**T-092-01 (a concurrent Lisa thread) landed its own durable-skin.mjs rework** (f106d70, concept-derived
zone maps) and is actively iterating on it (its `zone:map` coverage gate is failing as of 10:47a — an
Edit on my side already bounced once off its concurrent write). Editing the same runner from two live
tickets is the exact "missing dependency edge" the RDSPI concurrency rule warns about — T-091 declares
`depends_on: [T-084-01]` only, and the repo convention is explicit precedent: T-086/T-087 kept their
per-ticket runners separate and the consolidated pipeline absorbed them in a LATER dedicated ticket
(T-089), whose own header records "spray-paint.mjs … stays untouched (T-090-01 owns spray-paint.mjs
concurrently)".

The ticket's ACs are satisfied without it: AC4 requires "all ops behind the named `npm run` pipeline"
(`shell:cottage` / `shell:gatehouse` are that pipeline) and AC3 requires the closure check "wired into
the pipeline as a stage that fails loudly" — in the shell-integrity runner the closure stage THROWS
(plugClosure at cap; the gate re-asserted; `--offline` re-asserts `closed`), and the cottage AC numbers
are hard-asserted so drift also fails loudly. Absorbing the three cores into durable-skin.mjs is the
E-25 consolidation story's call (S-095 challenge milestone direction), after T-092's durable-skin work
lands — flagged as the follow-up in review.md.

## Step 4 — RDSPI artifacts (this commit)

research/design/structure/plan/progress/review committed together.

## AC ledger

| AC | Status |
|---|---|
| Component strip pure + unit-tested; cottage 23→1, 126 removed | ✅ tests + hard-asserted live + record |
| Void detection+repair pure + unit-tested; gatehouse cavity repaired, arch preserved, before/after render | ✅ tests + frames + allow-list (door region) honored |
| Six-direction closure pure + unit-tested; cottage+gatehouse pass after repair; loud gate stage | ✅ tests + both runs CLOSED + throwing stage |
| Named npm pipeline, no hand-edits, no subject constants, oblique renders show no sky, `npm test` green | ✅ `shell:*`; thresholds are op params; census-derived dominants; frames inspected; 1082/1082 |
