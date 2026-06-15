# T-001-02 — Plan: placement-primitive expansion

Ordered, independently-verifiable steps with the testing strategy. Each step is
small enough to commit atomically. Grounded in `structure.md`/`design.md`.

## Verification criteria (the bar)

- **AC-1** box/line/fill expand into explicit voxels → unit tests per op assert
  exact voxel sets/counts.
- **AC-2** mixed artifact (voxels + primitives) → single deduplicated set →
  test on a hand-built mixed artifact; assert count = coordinate-union size.
- **AC-3** deterministic + order-independent; overlaps by a documented rule →
  determinism test (expand twice, deep-equal), order-independence test (reorder
  non-overlapping placements → identical output), overlap test (last-writer-wins,
  full block+state replace); rule documented in `src/README.md` + JSDoc.
- **AC-4** unit tests cover each primitive type and the overlap rule → the suite
  above, runnable via `npm test`, green.

Global gate: `npm test` exits 0 (schema self-test + samples **and** the new unit
suite). No new runtime/dev dependencies introduced.

## Step 1 — Expansion kernel (`src/expand.mjs`)

Create the module per structure. Implement in this internal order so each piece
builds on the last:

1. JSDoc `@typedef`s (`Coordinate`, `Voxel`, `Placement`).
2. `bounds(from, to)` — per-axis min/max (D4).
3. `eachCell(lo, hi, fn)` — canonical (y,z,x) iteration of the inclusive box.
4. `voxelKey(pos)` — `"x,y,z"`.
5. `expandPlacement(placement)`:
   - `voxel` → single voxel (copy `state` if present).
   - `fill` → `eachCell` over `bounds`.
   - `box` → `eachCell` over `bounds`, keep cells matching the shell predicate
     (`x==lo.x||x==hi.x||y==lo.y||y==hi.y||z==lo.z||z==hi.z`).
   - `line` → compute directed delta `d = to - from`, `n = max(|dx|,|dy|,|dz|)`;
     if any nonzero `|component| !== n`, **throw** a located Error (D5); else
     step `i ∈ [0..n]` emitting `from + i·sign(component)`.
   - `default` → throw `unknown placement op "<op>"`.
   - Each emitted voxel gets `pos`, `block`, and `state` (only when present).
6. `expandArtifact(artifact)`: Map accumulate in placements-array order
   (last-writer-wins, full replace), return values sorted by (y,z,x).

**Verify (manual, pre-test):** a throwaway `node -e` expanding the valid sample
prints a plausible voxel count (floor 49 + shell + ridge + 2 voxels, deduped).
**Commit:** `T-001-02: deterministic primitive-expansion kernel (src/expand.mjs)`.

## Step 2 — Unit suite + `npm test` wiring

1. Write `src/expand.test.mjs` (`node:test` + `node:assert/strict`) covering the
   matrix below.
2. Edit `package.json`: add `"test:unit": "node --test src/"` and append
   `&& npm run test:unit` to `"test"`.
3. Run `npm test` → must be green (schema gate + unit gate).

### Coverage matrix (maps tests → ACs)

| Case                                             | Asserts                              | AC |
|--------------------------------------------------|--------------------------------------|----|
| `voxel` single + state carried through           | 1 voxel; `state` deep-equal          | 1  |
| `fill` 3×2×4                                      | count `=4*3*5`? → `(dx+1)(dy+1)(dz+1)`| 1  |
| `fill` reversed corners                          | identical set to forward             | 1,D4|
| `box` 7×4×7 shell                                 | known shell count; corner∈, interior∉| 1  |
| `box` flat (`y` equal)                            | solid plane = `(dx+1)(dz+1)`         | 1,D6|
| `box` 1×1×1                                        | single voxel                         | 1,D6|
| `line` axis-aligned len 6                         | 7 voxels, collinear                  | 1  |
| `line` 2-D diagonal (dx=dz=3)                     | 4 voxels on the diagonal             | 1  |
| `line` 3-D diagonal (dx=dy=dz=2)                  | 3 voxels                             | 1  |
| `line` reversed                                   | same set as forward                  | 1,D4|
| `line` non-uniform (dx=4,dz=2)                    | `assert.throws` /straight lattice/   | D5 |
| unknown op                                        | `assert.throws` /unknown placement/  | D10|
| mixed artifact (voxel+fill+box+line)              | deduped count = union size           | 2  |
| overlap: two fills share a cell, differ block/state| shared cell = 2nd placement's block+state | 3,D9|
| determinism: expand twice                         | deep-equal incl. order               | 3  |
| order-independence: reorder non-overlapping       | identical voxel array                | 3  |
| canonical order                                   | output sorted by (y,z,x)             | 3  |
| integration: `valid-industrial-house.json`        | non-empty; 49 floor cells present    | 1,2|

The integration case reads `schema/examples/valid-industrial-house.json` via a
path relative to the test file — reusing T-001-01's fixture as the realistic
input, no new fixture authored.

**Commit:** `T-001-02: unit suite + npm test wiring for expansion (AC-1..AC-4)`.

## Step 3 — Document the rule (`src/README.md`)

Write `src/README.md` per structure: op geometries, `from`/`to` normalization,
the `line` well-formedness rule + rejection rationale, the last-writer-wins
overlap rule (by placements-array order), the (y,z,x) canonical output order, the
determinism/order-independence guarantee, and the schema-valid-input contract.
This is the AC-3 "documented rule" artifact.

**Verify:** README's stated counts/examples match what the tests assert (no
drift between docs and code).
**Commit:** `T-001-02: document expansion semantics + overlap rule (src/README.md)`.

## Testing strategy summary

- **Unit** (`node:test`) is the whole strategy — expansion is a pure,
  deterministic function of in-memory data; no I/O, no integration harness, no
  mocks. Determinism/order-independence are themselves expressed as assertions
  (expand-twice deep-equal; reorder → identical), so AC-3 is *machine-checked*,
  not just documented.
- **No integration test beyond** the one real-fixture expansion — the render/
  world integration (T-003-02) is a downstream ticket and owns its own seam test.
- **Negative tests** (non-uniform line, unknown op) witness the two throw paths,
  matching the located-error ethos of the existing validators.

## Risks & mitigations

- *`node --test src/` discovery* — confirm Node 22 discovers `*.test.mjs` in a
  dir arg (it does; verified at implement time by the suite actually running).
- *`package.json` contention with T-001-03* — additive, key-distinct edit; the
  file lock serializes. If a conflict surfaces, re-apply the two-line additive
  edit (no semantic merge needed). Noted in progress.md if it occurs.
- *`line` rejection too strict* — accepted trade-off (design D5); recorded as a
  future-extension concern (general rasterization) in `review.md`, not a blocker.
