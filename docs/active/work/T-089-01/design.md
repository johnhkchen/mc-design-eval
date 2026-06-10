# T-089-01 durable-consolidation — Design

The decision in one line: a **new sibling orchestrator runner** (`benchmarks/sculpture/durable-skin.mjs`,
`npm run skin:cottage` / `skin:gatehouse`) composes the four E-24 stages **in-process from their pure
cores**, in value-true-first order, with the coverage gate as the terminal throw — leaving
`spray-paint.mjs` untouched (T-090-01 is concurrently rewiring it) and the three per-ticket runners
standing as the measurement records they are.

## Options considered

### A. Rewrite `spray-paint.mjs` into the multi-subject end-to-end pipeline — REJECTED
The "obvious" consolidation: it already has seal → zone-fill → splat → coverage gate. But (1) **T-090-01 is
in implement phase on that exact file** ("wired into the spray-paint pipeline … behind the existing named
`npm run`") and T-089 has no dependency edge on it — editing it now reproduces the T-087/T-088 race at 10×
the surface area; (2) the file is the *evidence* for three landed tickets (its §2b replay, its record
shape, its `--offline` asserts are cited by three review.md artifacts) — rewriting it re-opens settled
proof; (3) it is structurally cottage-specific (hardcoded paths, `ZONE_POLICY`, plaster-specific guards),
so the change is a rewrite, not an extension.

### B. Shell-chain the existing runners (`spray:paint && value:select && pattern:cottage`) — REJECTED
Cheapest to write, but it cannot meet the ACs: the chain's leaves **fork** (value-select and
surface-pattern both consume the spray-paint artifact; no on-disk artifact is value-true AND patterned);
the order is wrong (value-true substitutes after the splat quantized the concept against the *old*
manifest — the splat's targets are not value-true); the final patterned build is never coverage-gated;
and all three runners are cottage-hardcoded, so gatehouse needs new code anyway. A chain of records is
not a pipeline (the epic's own lesson: a result the pipeline can't produce in one named command isn't one).

### C. New orchestrator runner composing the pure cores, per-subject registry — **CHOSEN**
Mirrors the codebase's strongest precedents: `resemblance.mjs` (SUBJECTS registry + a reusable per-subject
entry) for shape, `spray-paint.mjs` for the stage mechanics (whose every stage is already a pure core
import). New code is **wiring only** — zero new `src/` math is needed; every transformation this ticket
composes is already unit-tested. T-086 set the explicit precedent: "S-089 consumes this record as data /
NOT wired into the paint pipeline here." This is that consumption.

## The chosen composition (per subject)

```
load build (concept-materials/<subj>/after-artifact.json) ── AJV
 1. VALUE-TRUE (T-086 cores): decode concept → estimateBorderColor → gridFromPixels(cellMeans)
    → sampleRoleSwatches → selectValueTrueMap(material-map roles) → substitution {named→chosen}
    → substitute manifest+placements; map ZONE_POLICY blocks through the substitution
 2. SEAL (S-084 cores): sealRoof + sealWalls → the watertight skin
 3. ZONE-FILL (T-085 core): structuralZones → zoneFill(occ, substituted policy) — the base coat
 4. SPLAT secondaries (E-23 cores): front = quantizeToFace(concept, substituted manifest),
    side = loadGlbSplat(GLB); paintFace zone-gated, palettes = substituted splat sets (no dominants);
    per-face acceptWithCoverage (coverage precondition → accept-if-closer; GL best-effort)
 5. COHERENT SURFACE (T-087 cores): regularizeRoofCourses(roof dominant) → stripStraySalt(policy)
 6. COVERAGE GATE (T-088 cores): dominantCoverage(surfaceZoneHistogram) → coverageGate — THROW on fail
    + the cottage plaster base/roof=0 throw (subject-conditional) → assertArtifact → write record
EVIDENCE (same run): splat-only legacy replay (the E-23 baseline) → its coverage + gate REJECT proof
    + before/after renders (front + an oblique) → composed side-by-side PNGs
```

**Why value-true FIRST when the ticket lists it second.** The ticket's list is the dependency order the
stages landed in, not a data-flow mandate. Value-true selection is a *palette transform*: applying the
substitution before fill/splat means every later stage operates in the final palette — the fill lays
sandstone (not white_terracotta-then-rename), the concept quantizes against the value-true manifest (so
splat targets are value-true, fixing the gap option B preserves), and the coverage gate's dominants are the
shipped blocks with no translation layer at the end. Selection itself still runs on the *original* map +
manifest (the named block must locate its own concept region — the T-086 locator), so the T-086 record
stays the reference; the runner re-derives the same substitution from the same committed inputs with the
same pure cores (deterministic), and the record asserts agreement with `value-select/cottage.json` where
one exists. Composing rename-last instead was rejected as strictly more moving parts (three name spaces
live at once) for zero behavioral difference.

## Key decisions

1. **New runner `durable-skin.mjs`, scripts `skin:cottage` / `skin:gatehouse`** (one named command per
   subject — the AC's unit), plus `--offline` (re-assert the committed record, sibling convention).
   Outputs: `durable-skin/<subj>.{json,md}` + `durable-skin/<subj>/artifact.json` (committed) + PNGs
   (gitignored, dedicated stanza); frames copied to `pr/assets/frames/` (committed).
2. **Per-subject registry in the runner** (paths, zone policy, legacy splat-only palette, invariants),
   policy written in *named* (pre-substitution) block space and mapped through the substitution at one
   point. Cottage policy = spray-paint's `ZONE_POLICY` verbatim; gatehouse policy derived from
   `material-map/gatehouse.json` roles:
   - `base`: dominant `stone_bricks`; preserve `cobblestone, dark_oak_log, dark_oak_planks` (corners,
     arch ring, door leaf); splat the same three.
   - `upper`: dominant `stone_bricks`; preserve/splat `cobblestone` (the under-eave rough band). Base and
     upper share a dominant — the storey divide is deliberately low-stakes on this subject.
   - `roof`: dominant `deepslate_tiles`; preserve/splat `[]` (the concept's roof is uniform tile;
     anything else on the roof skin is salt by definition).
   Subject-conditional invariant: the plaster base/roof=0 throw applies to the cottage only (gatehouse has
   no plaster role; vacuous). Registry data, not code branches.
3. **Determinism = double-execution + content hash.** The deterministic core (everything except GL renders
   and file writes) is a function `build(subject)`; the runner executes it **twice in one process** and
   asserts the two artifacts (canonical JSON) are byte-equal, recording `reproducible: true` + a sha256 of
   the canonical artifact. A fresh `npm run skin:<subj>` then reproduces that hash (Rule 2's external
   check; `--offline` re-asserts it against the committed record). "How determinism is achieved for any
   LLM-authored step": **no LLM call is on the path** — concept PNG + material-map roles are committed
   upstream artifacts; spray-paint's `--refine` stub is not carried over. Renders are evidence, excluded
   from the hash.
4. **The coverage gate is terminal AND per-face.** Per-face: `acceptWithCoverage` ahead of the
   accept-if-closer delta (T-088 semantics, GL-blind ⇒ coverage-only, same as spray-paint). Terminal: after
   the surface-pattern stage (which adds/recolors voxels) the gate re-runs on the **final** skin and throws
   on failure — closing the T-088 gap where the patterned build was never gated. Threshold stays
   `DEFAULT_COVERAGE_THRESHOLD` (0.5); per-zone thresholds remain YAGNI until a subject's honest skin fails
   (T-088 design decision 3 carried forward).
5. **Triptych refresh via the existing gate, re-pointed.** Update `resemblance.mjs` SUBJECTS so cottage +
   gatehouse `artifact` → `durable-skin/<subj>/artifact.json` and `committedRender` →
   `resemblance/<subj>-minecraft.png` (the live render the refresh itself writes — the offline path then
   replays the refreshed lens, retiring the stale pre-lens-fix pointers). Run live per subject: triptych +
   perceptual row + one metered judge verdict each (evaluation, not build — outside the determinism hash).
   `runResemblanceGate` already takes explicit paths; no new rendering code.
6. **Before/after evidence is composed in the runner**: legacy splat-only build (the E-23 baseline,
   replayed with the subject's legacy palette — for the gatehouse this is the *would-have-been* E-23 path,
   stated as such) vs the final skin, rendered front + oblique (`renderViews`, angles where T-090 showed
   the roof reads worst), composed into labeled side-by-side PNGs via `composeTriptych`/`resampleRgba`
   (pure, panel-count-agnostic) — committed as pr/assets frames.
7. **Docs**: append the E-24 section to `design-learnings.md` (zone-fill-vs-splat 9%→77% lesson,
   value-true selection, the coverage gate's both-ways proof, the durable rule — honest over/under-reach
   including the T-090 finding that 5-face coverage ≠ 6-dir-exposure coverage); E-12 handoff
   `pr/assets/durable-skins.md` mirroring `concept-materials.md` (narrative over committed records,
   per-subject table, named residuals).

## Rejected along the way

- **Folding surface-pattern/value-true into spray-paint.mjs** — T-090 turf (its AC names that file) and
  option A's reasons. The sibling runners stay as landed measurements; durable-skin is the composition.
- **Gatehouse on `building/best/artifact.json`** (57k placements) — [[surgical-edit-path-scale-limit]]
  scale, 4-block manifest (no door planks), and the E-21 lineage standard is concept-materials.
- **Skipping the per-face resemblance gate** (coverage-only) — cheaper, but the AC composes T-088, whose
  contract is coverage-as-*precondition* to the hill-climb; dropping the climb changes the gate's meaning.
- **A `--subject` flag on each existing runner** — three separate multi-subject refactors (3× the diff,
  same collision risk on spray-paint.mjs) and still no single end-to-end command.
- **Hashing the record (not the artifact) for reproducibility** — the record embeds best-effort render
  fields (GL-dependent); the artifact is the result. Record asserts; artifact hashes.

## Risks (named) and mitigations

1. **Gatehouse zoning is unmeasured** (floor-line detection over an arched, single-storey mass). Low
   sensitivity by construction (base/upper share a dominant); the real risk is `upperTop` misplacing the
   roof/upper boundary → gable cells counted as upper. Mitigation: measure live first (storeyBands /
   structuralZones console line), `structuralZones` already accepts `storeyDivide`/`upperTop`/`baseHeight`
   overrides as data — a registry-recorded override is a named residual if needed, not a hand edit.
2. **Gatehouse value-true switches are unknown** (likely stone_bricks→tuff recurs; deepslate_tiles family
   behavior unmeasured). The switch policy's floor + margin keeps priors absent clear evidence; whatever
   the engine decides is recorded with true-ΔE both ways (the T-086 honesty contract).
3. **Coverage gate could fail honestly on the gatehouse roof** if `roofRegion` under-covers the gable
   sides (the T-090 finding). The gate measures the same 5-face census zoneFill fills, so fill and gate
   see the same skin — coverage should clear; the 6-dir gap stays T-090's, explicitly out of scope here
   and named in the learnings section as E-24's known measurement boundary.
4. **T-090 lands mid-implement and changes `zone-fill.mjs` exports.** Additive exports both times so far;
   re-read before edit (T-087's resolution), and durable-skin imports only the stable T-085/T-088 symbols.
5. **`composeTriptych` with 2 panels** may assume 3 (name notwithstanding, it takes a panel array).
   Verify in structure phase; fallback is a 20-line local row-concat of resampled RGBA (pure, trivial).
