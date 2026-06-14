# T-149-01 Structure — re-skin-reverdict

File-level blueprint. The deterministic slice is small and surgical: one new pure helper, three
one-line adoption sites, one test file, one milestone successor, doc edits. The live slice is a
runbook (text in `progress.md`/`review.md`), no code.

## Created

### `src/workshop/articulate.mjs` (new, pure)
The relief-merge helper that joins the skin and the articulation. Pure: no GL/IO/Date/random;
deterministic placement order; fail-loud.

```
import { realizeProgram } from "./program.mjs";
import { applyArticulation } from "../recognition/compile.mjs";

// namespaced(): "minecraft:" prefix unless already qualified (mirror program.mjs/brush helper)

export function realizeWithArticulation(workshopProgram, articulation) {
  const base = realizeProgram(workshopProgram);          // { artifact, cells, elements }
  if (!articulation?.length) return base;                // BYTE-IDENTICAL no-facade path (same object)
  const { placements: relief, report } = applyArticulation(artifactOccupancy(base.artifact), articulation);
  if (!relief.length) return base;                        // empty plan / no proud cells ⇒ unchanged
  const merged = mergePlacements(base.artifact.placements, relief);  // later (relief) wins by pos key
  const manifest = [...new Set(merged.map((p) => p.block))].sort();
  const artifact = { ...base.artifact, palette: { manifest }, placements: merged };
  assertArtifact(artifact);
  return { ...base, artifact, articulation: report };     // report carried for the ledger/digest
}
```

- `mergePlacements(skin, relief)`: build a `Map` keyed by `pos.join(",")` from skin (preserving
  order), overwrite/append with relief (converted to `{op:"voxel", pos, block: namespaced(block)}`),
  return `[...skinInOrder, ...newReliefInBrushOrder]` with overwritten skin cells updated in place —
  exact ordering pinned by a test so the bytes are stable.
- Re-exports nothing the chain doesn't already have; imports `artifactOccupancy`, `assertArtifact`
  from `./program.mjs` (already exported there per seed.mjs usage).

### `src/workshop/articulate.test.mjs` (new)
- **AR1 no-facade byte-identity**: a facade-less `workshopProgram` (compiled from `barn.program.json`
  via `compileProgram`) → `realizeWithArticulation(wp, [])` returns placement bytes identical to
  `realizeProgram(wp)`. The structural no-regression proof.
- **AR2 facade grows relief**: compile T-147's `fixtures/facade/articulated-program.json` →
  `{workshopProgram, articulation}` with non-empty `articulation`; `realizeWithArticulation` yields
  strictly more placements than the bare skin, and the added cells are exactly the brush placements
  (pos set equality with `applyArticulation` output).
- **AR3 idempotence**: applying twice (re-realize + re-apply) ⇒ identical artifact (the loop's
  per-round guarantee — articulation reads the freshly-realized skin each round).
- **AR4 manifest closure**: merged manifest ⊇ skin manifest ∪ relief blocks; sorted; no duplicates.
- **AR5 silhouette charter**: in-plane silhouette of the merged build ⊇ skin silhouette and relief is
  proud (delegates to `reliefNoRegress`/the brush charter already proven in T-146/147 — assert the
  merged occupancy passes `reliefNoRegress` against the skin).

### `benchmarks/sculpture/facade-milestone.mjs` (new, `milestone:facade`)
The E-35 successor recompose. Deterministic `--repro` path ships; live render path is the runbook.
- Reads committed E-34/T-143-02 baselines (barn gate record + cottage T-143-02 verdict) **verbatim**
  → the pre-rotation texture baseline block.
- For each subject, reads the committed pattern-book + gate records and reports BOTH arithmetics:
  kit-aware `overall` and `relief-aware-gate/v1` (presence + missing-cell residual with the named
  lens), beside the quoted baseline.
- `--repro`: re-derive shas from committed records, **no model/GL/spawn/writes**, byte-identical;
  prints `milestone:facade` table to `benchmarks/sculpture/facade-milestone.{json,md}` only when not
  `--repro` (a committed-evidence file, like `relief-calibration.json`). Until live records exist,
  `--repro` SKIPs subjects with no committed relieved chain (the `recognize.mjs --offline` precedent),
  exactly as `pattern-book --repro` skips.
- No per-building constants; subject list derived from the durable-skin registry (`seedWorkshopProgram`
  registry pattern), not hardcoded.

### `benchmarks/sculpture/facade-milestone.test.mjs` (new)
- baseline-quote fidelity (the quoted bytes equal the committed record's bytes); both-arithmetics
  presence in the row shape; `--repro` SKIP-on-absent behavior; no-live-spend (no import of
  sdk-binding/render in the repro path — a static guard like the isolation tests).

## Modified

### `src/workshop/seed.mjs`
- Line ~103–106: `const { workshopProgram: compiled, articulation } = compileProgram(program, pack);`
  then `const { artifact, cells, elements } = realizeWithArticulation(workshopProgram, articulation);`.
  Import `realizeWithArticulation` from `./articulate.mjs`. Thread `articulation` into the returned
  object (consumed by the digest/ledger as evidence; optional, additive).

### `src/workshop/loop.mjs`
- Line ~127: the per-round rebuild `realizeProgram(prog)` → `realizeWithArticulation`. The loop must
  carry the compiled `articulation` for the current program; if the loop recompiles per round (geometry
  levers can mutate the program), recompute the plan from the *current* program via `compileProgram`
  so a geometry edit that changes a facade face re-plans. Where the loop only has `prog`
  (workshop-program, no facade), pass `[]` (byte-identical). **Exact threading determined in Implement
  by reading loop.mjs's program/source state.**

### `src/workshop/geometry.mjs`
- Line ~54: `compileProgram(source, pack)` already returns `articulation`; if this path realizes for
  the levers' occupancy comparison (line ~157 `realizeProgram(program)`), decide whether the lever's
  *silhouette* comparison should include relief. **Default: NO** — geometry levers compare massing
  silhouette, which relief must not change (reliefNoRegress charter); keep `realizeProgram` here and
  document why. Verified by the existing geometry tests staying green.

### `package.json`
- Add `"milestone:facade": "node benchmarks/sculpture/facade-milestone.mjs"` and
  `"milestone:facade:repro": "node benchmarks/sculpture/facade-milestone.mjs --repro"`.

### `docs/knowledge/design-learnings.md`
- New section **"Facade grammar & relief (E-35) — what the texture finish taught"** (the glance gap,
  recolor-vs-construction, the fixpoint gate, the articulation-into-the-build wiring, and the honest
  finding from the operator runbook once run) + the **E-12 handoff** paragraph (what the next epic
  inherits: live facade recognition as standing capability, the relief-aware verdict as a real exit
  gate, the open seams).

### `docs/active/work/T-149-01/review.md`
- The S-149 review (the ticket asks for it explicitly under AC#5).

## Not modified (explicitly)

- `benchmarks/sculpture/multi-angle-gate.mjs` — the relief opt-in already exists; the def addition is
  data, in the operator runbook.
- Any committed artifact / pin / recognized program — none touched; the live re-recognition is the
  operator step.
- `src/recognition/compile.mjs`, `src/view/facade-articulation.mjs`, `src/form/relief-presence.mjs`,
  `src/form/surface-relief.mjs` — reused, unchanged.

## Ordering of changes

1. `articulate.mjs` + `articulate.test.mjs` (the helper, proven inert + active in isolation).
2. Adopt in `seed.mjs` (then `loop.mjs`, `geometry.mjs`) — `npm test` green, offline sweep
   byte-identical after each.
3. `facade-milestone.mjs` + test + `package.json`.
4. Docs (design-learnings + this work dir).
Each step commits atomically; byte-identity (`patternbook:offline`, gate `--offline`) re-checked
after the chain-touching steps.

## Interfaces / contracts held

- `realizeWithArticulation(wp, [])` ≡ `realizeProgram(wp)` (object + bytes). Structural no-regression.
- Articulation placement order = brush byte-stable order, appended after skin. Replay-stable.
- No new model/GL in the deterministic slice; `--repro` paths import neither sdk-binding nor render.
