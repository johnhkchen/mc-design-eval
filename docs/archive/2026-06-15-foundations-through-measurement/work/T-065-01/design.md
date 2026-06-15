# T-065-01 — Design: per-subject thin routing

Decide the shape of the routing config + selector + the before/after report, grounded in Research. The
AC core is pure and unit-testable; AC #3's "applied ×7" is a pure read of the existing spine.

## Decision 1 — A single subject-keyed config module, NOT tags on N duplicated SUBJECTS lists

**Options.**
- (A) Add a `formType: "thin"|"solid"` field to each entry of every runner's `SUBJECTS` list.
- (B) One pure module `src/form/form-routing.mjs` holding the canonical subject→form-type map + a
  selector; runners (and the report) consume it. **(chosen)**

**Why B.** The `SUBJECTS` list is duplicated across ~6 runners (Research); tagging each would fork the
truth and drift. AC #1 explicitly allows "a small subject-keyed config." A single pure module in
`src/form/` is one source of truth, is unit-testable under the `src/**` glob, and is what AC #2's
selector test needs. Runners that want the tag call `formTypeOf(key)` instead of carrying a column.

## Decision 2 — The config follows the AC enumeration; the report is honest about heart

**Chosen config:** `thin = {bow-and-arrow, koi}`; `solid = {dancing-man, moai, pineapple, mushroom,
heart}`. Unknown subject → `solid` (the conservative default — plain voxelize never over-thickens; an
untagged subject is treated as bulky rather than silently shelled).

**Why.** AC #1 enumerates exactly this. The raw thin Δ from the spine agrees on six of seven; the seventh,
**heart (+0.018)**, is tagged solid deliberately — it is a bulky organ whose only thin part is the aortic
arch, and routing it solid trades a +0.018 marginal form gain for a 27% occupancy drop + less spurious
bulk (the story's cleanliness goal). The report will show heart's form IoU dipping slightly under routing
and label it the one deliberate trade, rather than hiding it. This honesty mirrors the codebase norm
(the sword finding, the value-ΔE tautology note).

Rejected: deriving the config from `classifyRouting`'s raw sign at runtime. That would tag heart thin
(+0.018 > eps), contradicting the AC, and couple the forward config to a particular spine's noise. The
config is a stable, reviewed property of each subject's form, not a re-derivation.

## Decision 3 — `selectVoxelizer` returns the function reference; a `voxelizeRouted` convenience wraps it

**Chosen.**
- `formTypeOf(subject) → "thin"|"solid"` — pure lookup with the conservative default.
- `selectVoxelizer(subject) → voxelizeGlbThin | voxelizeGlb` — returns the **actual function** (so AC #2's
  `=== voxelizeGlbThin` identity test works).
- `voxelizeRouted(glb, { subject, scale }) → occupancy` — convenience: `selectVoxelizer(subject)(glb,
  { scale })`. Both voxelizers accept `{ scale }` with the same default, so the call site is uniform.

**Why.** Returning the function (not a string) is exactly what AC #2 specifies and lets a caller keep the
existing `voxelizer(glb, {scale})` shape. The `voxelizeRouted` wrapper is the ergonomic entry a runner
uses without re-implementing the dispatch. No new algorithm — pure routing.

## Decision 4 — AC #3 as a pure spine read (`assembleRoutingReport`), not a new GL sweep

**Options.**
- (A) Re-run voxelization + silhouette IoU rendering on all 7 to produce fresh before/after numbers.
- (B) Assemble the before/after report from the **already-collected** `e18-remeasure.json` spine — which
  carries `r1.formIoU` (plain), `e18.formIoU` (thin), `thin.occBase`, `thin.occThin` per subject. **(chosen)**

**Why B.** The spine already holds both voxelizers' form IoU and occupancy per subject (Research). The
routing decision is a per-subject *pick* between two measured values:
- **before (universal thin):** `formIoU = e18.formIoU`, `occ = occThin` for all 7.
- **after (routed):** `formIoU = thin ? e18.formIoU : r1.formIoU`, `occ = thin ? occThin : occBase`.

So AC #3 is a deterministic read — no GL, no metering, no drift from a fresh render. Re-rendering would
cost a GL sweep to reproduce numbers we already have, and risk a mismatch with the consolidated E-18
record. `assembleRoutingReport(spine)` lives in `form-routing.mjs`, returns `{ md, json }`, and is unit-
tested on a small synthetic spine. A light runner (`benchmarks/sculpture/form-routing.mjs`) reads the
real spine and writes `form-routing.{md,json}` — file I/O only, safe to run in this session.

This is consistent with `remeasure.mjs` / `e18-scorecard.mjs`: a pure assembler + a thin host runner.

## Decision 5 — Report contents (proves the AC)

Per subject: `formType`, before/after form IoU (+Δ, direction-aware "recovered"/"kept"/"traded"), before/
after occupancy (+Δ, "−N cells"). Plus: average form IoU before→after, total occupancy before→after (the
solids' drop), and an explicit list of which solids **recovered** (dancing-man back toward 0.914) and the
single heart **trade**. The thin subjects show form IoU + occupancy **unchanged** (they still run thin).

Expected (from the spine): avg form IoU 0.731 → 0.782 (+0.051); total occupancy 36,723 → 28,295
(−8,428, −23%); dancing-man 0.814 → 0.914, moai 0.399 → 0.565, pineapple 0.845 → 0.907, mushroom
0.929 → 0.980 recover; bow-and-arrow / koi keep their gains; heart 0.895 → 0.877 (the trade).

## Decision 6 — Do not modify the frozen runners

The breadth/thin/ab runners stay untouched (their SUBJECTS lists and prior outputs are reproducibility
anchors). The routing config is new and additive; only the new `form-routing.mjs` + its test + the new
report runner are added. A future ticket can refactor the duplicated SUBJECTS to consume `formTypeOf`,
but that is out of scope here (and would be a separate, broad change).

## Rejected, briefly

- Tags on every SUBJECTS list (Decision 1A) — duplication/drift.
- Runtime re-derivation from `classifyRouting` (Decision 2) — contradicts the AC on heart, couples to
  spine noise.
- A fresh GL sweep for AC #3 (Decision 4A) — needless cost + drift risk; the data exists.
