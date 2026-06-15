# T-058-02 — Design: enforce design-doc palette as a guarantee

Decisions, with rejected alternatives, grounded in `research.md`. The job is to turn the design-doc-palette
*convention* into a *guarantee*: every color-assigning build path snaps within the **augmented** design-doc
palette, the committed artifacts reflect it, and a guard makes a regression fail loudly.

## What "the palette" means here (the contract)

For a subject, **the augmented palette** = `augmentPalette(paletteFromManifest(designManifest), texture)` —
the design-doc manifest (resolved to value-true blocks) UNION ≤K=2 gated secondary table blocks. AC#2
defines "off-palette" as *outside this augmented set*; that count must be 0. It is **not** a return to the
full table: the secondary is the high-bar T-058-03 augmentation (most subjects add 0–2; see
`secondary-palette.json`).

## Decision 1 — A pure guard `assertPaletteDiscipline`, in `glb-voxel-build.mjs`

Add a pure function that throws (loudly) if any placed block falls outside a given palette:

```
assertPaletteDiscipline(artifact, palette, { cap } = {})  // cap optional: also assert distinct ≤ cap
```

- Reuses the existing `offPaletteCount` shape but as an **assertion**: collect the offending blocks, throw an
  Error naming them and the palette size. Optional `cap` asserts `manifest.length ≤ cap` (the design-doc +
  secondary ceiling) so a *bloat* (not just leakage) also trips.
- Lives in `glb-voxel-build.mjs` because both `glbVoxelBuild` and `segmentMaterials` import that module
  already (no new dependency edge, no cycle). It is the natural sibling of `paletteFromManifest`.
- It is the "consumer-side assert" twin of `assertArtifact` — runners call it right after building, before
  writing, exactly where they already call `assertArtifact`.

**Rejected — put the guard inside `keysToArtifact`/`colorVoxelsToArtifact` (always-on).** The cores are
palette-agnostic by design (the default `blockPaletteFromTable` is a *legitimate* full-table build for other
experiments). Forcing discipline into the core would break unrelated callers and conflate "build" with
"audit." The guard is an opt-in assert the disciplined runners invoke.

**Rejected — a new module `palette-guard.mjs`.** Over-fragmentation; the function is ~15 lines and belongs
with the palette helpers it asserts over.

## Decision 2 — Make `augment` canonical in the three runners (R1, seg, integrate)

AC#1 mandates the *augmented* design-doc palette as the candidate set everywhere. Concretely:

- **R1 (`glb-voxel-breadth.mjs`):** add `augment: true` to the `glbVoxelBuild` call. (`palette` already
  passed.) `augment:true` uses `AUGMENT_DEFAULTS` and `loadBlockTable()` internally.
- **seg (`glb-voxel-seg.mjs`):** add `augment: true` to `segmentMaterials`, AND fix the `snapPalette`→
  `palette` bug (5 sites) so the runner runs at all.
- **integrate (`e18-remeasure.mjs`):** pass `palette: paletteFromManifest(designManifest)` **and**
  `augment: true` to `segmentMaterials`; and measure `offPalette` against that **augmented design-doc
  palette**, not the k=6 texture median-cut. This is the core correction.

**Rejected — flip `augment` default to on in the core.** That would silently change every existing caller
(including unrelated experiments and the T-058-03 record's controlled comparisons). T-058-03 deliberately
shipped `augment` opt-in (review concern #4); canonicalization is *this* ticket's job and belongs at the
**runner** call sites, leaving the core's default untouched and the full suite byte-stable.

**Rejected — drop the gated secondary, ship design-doc-only.** AC#1 explicitly names "`paletteFromManifest`
+ T-058-03's gated secondary" as the candidate set; the secondary cuts real snap drift (moai 8.2→5.2, mushroom
23.5→18.0) at ≤2 blocks. Dropping it re-imposes the drift T-058-03 was built to remove.

## Decision 3 — The integrate off-palette reference must be the augmented design-doc palette

Today `e18-remeasure.mjs` computes `offPalette` for E18/R1/R2 against `segPalette` (texture median-cut, k=6).
Since the E18 build *also* snapped to that palette, its off-palette is 0 by tautology — against the wrong
reference. Change the reference to the **augmented design-doc palette** for the E18 build (and keep R1/R2's
off-palette measured against the *same* augmented design-doc palette, so the column means "leakage vs the
discipline" consistently — R1/R2 will show their historical leakage honestly).

**Rejected — leave the reference as the texture palette.** It makes the record self-confirming and hides
whether the build actually honors the design doc. AC#2/#4 require the augmented design-doc palette as the
yardstick.

## Decision 4 — A dedicated verification record + runner `palette-discipline.{mjs,md,json}`

AC#4 wants a committed record across all 7 subjects proving: off-(augmented) = 0, distinct ≤ design-doc
size + 2, and the before→after drop vs the pre-fix (full-table) build (e.g. heart 91 → ≤7). Build a small
runner that, per subject:
1. voxelize + decode texture (no GL render needed for the palette metrics),
2. `prim = paletteFromManifest(designManifest)`; `aug = augmentPalette(prim, texture)`,
3. **after** = `glbVoxelBuild(..., {palette: prim, augment:true})` → distinct, off-(aug)=0, secondary count,
4. **before (pre-fix)** = `glbVoxelBuild(..., {palette: blockPaletteFromTable()})` → full-table distinct
   (the 91-style number) over the *same* voxelization,
5. `assertPaletteDiscipline(after, aug, {cap: prim.length + 2})` — the record *is* the guard, run live,
6. form IoU recorded as **invariant by construction** (same occupancy) and cross-referenced to the committed
   R1 summary's `silhouetteIoU`.

Emit `palette-discipline.{md,json}` (committed) + per-subject summaries; render PNGs (if any) gitignored, per
repo convention. The before→after table is the AC#4 headline (heart 91 → 7, etc.).

**Why GL-free metrics:** off-palette and distinct depend only on placed *keys* (voxelize + decode + snap),
not on rendering. Form IoU is invariant under recolour (Decision in research). So the record is fast and
robust (no headless-WebGL flakiness), while the live regeneration of the R1/seg/integrate *renders* is done
by their own runners.

**Rejected — fold the metrics into the existing `secondary-palette.mjs`.** That record is T-058-03's
controlled secondary-vs-none study; the discipline record has a different headline (before-full-table →
after-augmented drop, the guard assertion, all paths). Keep them separate, cross-link in prose.

## Decision 5 — Regenerate the committed artifacts via the runners (GL), record honestly if GL fails

AC#3 requires regenerating R1, seg, integrate for all 7 subjects with the augmented design-doc palette. The
host has the 7 GLBs + dwebp + headless GL. Plan: run `glb-voxel-breadth.mjs 32`, `glb-voxel-seg.mjs 32`,
`e18-remeasure.mjs 32` after the wiring fixes; commit the refreshed `artifact.json`/`summary.json` +
`{r1,seg,e18-remeasure}.{md,json}`. If a render step fails on this host, the **palette-discipline record**
(GL-free) remains the authoritative AC#4 proof, and the regeneration is documented as runnable via the
runners — the established GL/host split. Renders are gitignored either way.

**Rejected — regenerate only the integrate build.** AC#3 lists R1 and seg too; enabling `augment` changes
their block keys for the 5 augmenting subjects, so their committed artifacts/numbers must move to match.

## Decision 6 — Scope guard for R3 surgical

R3 is compliant by inheritance (Decision/Research): no median-cut or full-table color snap; it inherits R1's
augmented palette. The audit *documents* this and notes the LLM-`swap` unconstraint as a caveat. No code
change to the surgical path — adding palette enforcement there would conflate form editing with color
discipline and is out of AC scope (the ACs target paths that "assign block colors" via a snap).

## Testing strategy (detail in plan.md)

- **Unit (CI):** `assertPaletteDiscipline` — passes when manifest ⊆ palette; throws naming the offending
  block when not; `cap` trips on bloat; namespace-tolerant. Added to `glb-voxel-build.test.mjs`.
- **Wiring (CI):** a synthetic `glbVoxelBuild({augment})` test (closes the T-058-03 gap noted in its review)
  asserting the augmented build's manifest ⊆ augmented palette and passes the guard.
- **Live (host, not CI):** the three sweeps + the `palette-discipline` record; `npm test` stays green.
