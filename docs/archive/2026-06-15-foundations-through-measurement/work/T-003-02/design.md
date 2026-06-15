# T-003-02 — Design: voxel-world-construction

Decide how to turn an expanded voxel set into a populated `prismarine-world`,
with correct block state/orientation, deterministically, reporting anything
unmappable. Grounded in `research.md`.

Two decisions drive everything: **(A)** how to resolve `name + state` → numeric
state id, and **(B)** the shape and failure policy of the world-construction
API.

---

## Decision A — state/orientation resolution

The job: `(name, state) → stateId` for 1.20.4, where `state` is a partial map of
string-valued properties and omitted properties take the block's default.

### Options

**A1. Delegate to `prismarine-block.fromProperties`.**
Reuse the canonical algorithm already in the tree.
*Rejected.* Research showed three instrument-fatal behaviours: unknown property
names are silently dropped (→ `minStateId`), unknown values produce an
out-of-range stateId below `minStateId`, and omitted properties default to index
0 rather than the block's `defaultState`. It is also only a *transitive*
dependency of `render/`, so importing it directly is fragile across installs. A
measurement instrument must reject what it cannot map, not silently mis-map it.

**A2. Wrap `fromProperties` with a pre-validation layer.**
Validate names/values against `minecraft-data` `states[]`, then call
`fromProperties`.
*Rejected.* Still leaves the omitted-property-default bug (fromProperties starts
from `minStateId`, not `defaultState`) — we'd have to fill every property
ourselves before calling it, at which point we've done the whole computation and
the call adds nothing but a fragile dependency.

**A3. Compute the stateId directly from `minecraft-data` `states[]`.** ✅
`minecraft-data` is a *declared* dependency and the single source of the
vocabulary the schema/palette already pin. The mixed-radix math is ~15 lines.
Decode the block's `defaultState` into per-property indices, override only the
properties the artifact supplies (validating each), recompute. Self-contained,
no new dependency, correct defaulting, and every failure mode becomes an
explicit located throw.
*Chosen.* Verified against `prismarine-block` across all 48 oak_stairs
facing×half×shape×waterlogged combos (48/48 identical), plus correct defaulting
for partial state and throws on all four bad-input classes.

### The algorithm (A3)

```
resolve(name, state):
  block = blocksByName[strip "minecraft:"]            ; else throw "unknown block"
  base  = block.defaultState ?? minStateId ?? id
  if state empty: return base                          ; stateless fast path
  states = block.states
  if states empty: throw "block takes no state properties: <name>"
  ; decode default indices (big-endian mixed radix)
  rem = base - minStateId
  for i = states.length-1 .. 0:
      idx[i] = rem % states[i].num_values ; rem //= states[i].num_values
  ; override supplied properties
  for (key, value) in state:
      i = states.findIndex(name == key)   ; <0 → throw "no state property <key>"
      idx[i] = valueIndex(states[i], value) ; <0 → throw "illegal value"
  ; recompose
  data = 0 ; for i in 0..n-1: data = data*num_values[i] + idx[i]
  id = minStateId + data
  assert minStateId <= id <= maxStateId                ; defensive
  return id
```

`valueIndex` by property type: **enum / has `values`** → `values.indexOf(String(v))`;
**bool** → `true|"true"→0`, `false|"false"→1` (Minecraft's true-before-false
order); **int** → integer `v` in `[0, num_values)` used as the index (documented
assumption: 1.20.4 int states we target — e.g. nothing in the industrial palette
— start at 0; out-of-range throws). Any `<0` / unmatched → throw a located error.

### Where it lives

`blockStateId(name, state)` in `version.mjs` already *is* the name→id seam, with
the `props` parameter and a comment ceding the stateful path to this ticket. So
**extend `blockStateId` in place** rather than spawn a parallel resolver — one
function, one home, and `setBlock`/`world.mjs` keep calling exactly what they
call today. Rejected: a separate `block-state.mjs` module — it would split the
name→id responsibility across two files for no gain at this size. The stateless
behaviour (returns `defaultState`) is preserved byte-for-byte.

`blockStateId` keeps its **fail-fast** contract: it *throws* on any
unmappable input. That throw is the detection mechanism the build layer
(Decision B) catches to build its report — one resolver, the caller picks the
policy.

---

## Decision B — world-construction API & failure policy

### Shape

Add two functions to `world.mjs`, beside `buildSampleWorld`:

- **`buildWorldFromVoxels(voxels, opts) → BuildResult`** — the core. Takes an
  already-expanded `Voxel[]`, writes each into a fresh world.
- **`buildWorldFromArtifact(artifact, opts) → BuildResult`** — the seam named by
  the ticket: `expandArtifact(artifact)` (imported from `../../src/expand.mjs`)
  then `buildWorldFromVoxels`. This is the single place `render/` reads the
  artifact contract.

Splitting the two keeps the expansion seam isolated (and unit-testable without
constructing a world) and lets callers who already hold voxels skip re-expansion.

`BuildResult = { world, center, bounds, placed, unmapped }`:
- `world` — the populated `prismarine-world`.
- `bounds` — `{ min:[x,y,z], max:[x,y,z] }` over *placed* voxels (`null` if none).
- `center` — `Vec3` at the rounded bounding-box centre, so the existing
  `renderWorldToPng(world, center)` frames the build with no extra wiring.
- `placed` — count of voxels successfully written.
- `unmapped` — the AC #3 report: `[{ pos, block, state?, reason }]`.

### Failure policy — collect, don't crash

Options for an unmappable voxel (unknown block / illegal state):

- **B1. Throw on first failure.** Simple, but a measurement instrument wants the
  *full* list of what's wrong in one pass, and throwing discards the world.
- **B2. Collect all failures into `unmapped`, skip those voxels, never throw for
  mapping failures; return the report.** ✅ Total function, complete report,
  deterministic (canonical voxel order ⇒ deterministic `unmapped` order). The
  caller decides whether `unmapped.length > 0` is fatal.
- **B3. B2 plus an opt-in `{ strict: true }` that throws after collecting the
  full report.** Convenience for callers that want fail-fast without writing the
  `if (unmapped.length) throw` themselves.

**Chosen: B2, with the B3 `strict` flag as opt-in.** Default `strict:false`:
construction is total and the report is authoritative. `strict:true` throws an
aggregated error listing every unmapped voxel (not just the first) — honest,
complete failure for pipelines that should abort. The error is raised *after*
the full scan so its message is the whole report.

Detection reuses `setBlock` → `blockStateId`'s throw: wrap each write in
try/catch, push `{ pos, block, state, reason: err.message }` on failure. No
duplicated validation logic.

### Determinism

`expandArtifact` already emits canonical (y,z,x) order and dedupes. Construction
iterates that order and performs only idempotent `setBlockStateId` writes, so the
resulting world and the `unmapped` array are pure functions of the input —
machine-checked by a build-twice equality test.

### What this ticket does *not* touch

- **Rendering / camera angles** — `render.mjs` is unchanged; `center` is computed
  so it *can* be rendered, but framing refinement is T-003-03.
- **Schema validation** — assumed upstream (`artifact.mjs`); consistent with the
  expand contract.
- **`buildSampleWorld` / `cli.mjs`** — left as-is; the artifact path is additive,
  not a replacement. The sub-`y=0` render caveat stays a render concern.
- **Palette legality** — E-04; an off-palette but real block still maps here.

---

## Risks & mitigations

- *Int-typed states starting at a nonzero base* (rare; none in the industrial
  palette) would mis-index. Mitigation: documented assumption + range guard that
  throws rather than mis-maps, and the `maxStateId` bound assertion catches
  overflow. Revisit if a target block needs it.
- *Cross-package import path* (`../../src/expand.mjs`) couples the two packages.
  Mitigation: it's a pure, dependency-free module and the single intended seam;
  verified to resolve. Documented in `structure.md`.
