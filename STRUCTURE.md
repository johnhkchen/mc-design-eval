# STRUCTURE.md — the canonical build flow

**Authoritative map** (T-154-01, epic E-37). One subject, one chain: each stage names its owning
module, the artifact it commits, and the entry point that runs it. The architecture of record is
`docs/knowledge/pipeline-philosophy.md` (AI at every stage, each in its native representation;
**creation is free, measurement is frozen**). This file is the *map*; S-157 adds the test that fails
when the map and the code drift apart.

## The canonical spine

| # | Stage | Owning module | Artifact (committed) | Entry point |
| --- | --- | --- | --- | --- |
| 1 | **Form sketch** — conditioned form evidence | `benchmarks/sculpture/form-sketch.mjs` | `form-sketch/<key>.json` + `-sheet.png` | `npm run sketch:<key>` |
| 2 | **Concept** — the target image (language→image, out of band) | (image gen) | `runs/<run>/concept.png` | committed reference |
| 3 | **Recognize** — VLM building program (the program the build serves) | `benchmarks/sculpture/recognize.mjs` · `src/recognition/*` | `recognition/<key>.{program,artifact,replies}.json` | `npm run recognize:<key>` |
| 4 | **Generate-seed** — the parametric realizer (GLB-fit + kit, gable-as-wall, overhang, articulation) | `src/form/provision-fit.mjs` · `src/form/provision-generate.mjs` (via `generated-milestone.mjs --skip-gate`) | `generated/<key>/artifact.json` → `builds/<key>/seed-artifact.json` | `npm run build:<key>` |
| 5 | **Workshop** — the model revises SURFACE on the fixed seed (paint + relief), ledgered, judge-free render every round | `benchmarks/sculpture/workshop.mjs` · `src/workshop/{loop,actions,replay,articulate}.mjs` | `builds/<key>/final-artifact.json` + `builds/<key>/ledger.json` | `npm run build:<key>` (spawns) |
| — | **Final beside concept** — the E-36 judge-free glance | `src/view/render-beside.mjs` | `pr/assets/frames/beside-concept-<key>-build.png` | (inside `build`) |
| ⊘ | **Gate** — the frozen judge (SEPARATE, billed; `build` never spawns it) | `benchmarks/sculpture/multi-angle-gate.mjs` | `measurements/multi-angle/<key>-<label>.json` | `npm run gate:patternbook:<key>` |

**Location encodes status (E-37 / T-155-01):** `builds/<subject>/` is the unified chain's DRAFT home (free
zone, no pin-guard); `measurements/` holds the FROZEN records (gate verdicts, baselines, milestones,
retired-pins) and IS the pin-guard allowlist alongside ratified `packs/`; `_archive/` is the DEAD-code
home (populated by S-156). The ratified kit at `benchmarks/sculpture/kit/` is the one frozen class still
awaiting relocation to `measurements/kit/` (deferred — HERE-relative loaders).

**One entry point:** `npm run build:<subject>` runs Stage 3 (verify) → 4 → 5 → final. The gate is a
separate explicit step (`docs/knowledge/pipeline-philosophy.md`: measurement is frozen and singular).
The unified chain's record is `build/<key>.{json,md}`; reproduce the deterministic stages with
`npm run build:<key>:repro`.

## Why this shape (the unification, E-37 / S-154)

The workshop loop **iterates the generate-first build** (`--seed-artifact`, artifact-base mode): the
geometry is authored once by the parametric realizer (Stage 4) and the model spends its rounds on
surface/material/relief (Stage 5). **One realizer feeds the one loop** — a construction fix now lands
in the chain that gets measured (the cost T-150-01 exposed). Determinism: Stage 4 is a pure function of
committed inputs (kit/GLB/zone-map/policy); the workshop replays seed + paint trail byte-identically.

## Retired from the live path (archive in S-156, not yet moved)

These ran the *old* parallel chains; they remain in `benchmarks/sculpture/` (importable, committed) and
are archived under their own ticket — a move is refused if a committed test/record reference can't be
updated (E-37 Rule 2).

- `pattern-book.mjs` — the **program-seed** chain (its `seedWorkshopProgram` Stage-4 brushes are
  replaced by the generate-first realizer). Committed `workshop/<key>.json` program-seed ledgers stay
  replayable (`npm run patternbook:repro`) until archived.
- `styled-milestone.mjs` · `challenge-milestone.mjs` · `reconstructed-milestone.mjs` — terminal chains;
  their shared `styledStretch` (grammar→dressing→settle) is reused **inside** Stage 4, not retired.
- `generated-milestone.mjs` **as a terminal gated chain** — its deterministic core IS Stage 4 (kept,
  spawned by `build`); only its standalone-with-gate role is superseded.

## Invariants (enforced; S-157 formalizes)

- **Location encodes status** — drafts are free; `measurements/` + ratified `packs/` are the pin-guard
  allowlist (E-36 / T-155-01, now a path prefix, not a hand-list). The unified chain writes its draft
  under `builds/<key>/` so it never clobbers a committed program-seed ledger.
- **The workshop cannot call the judge** — `src/workshop/isolation.test.mjs` scans the runner sources;
  `build.mjs` imports no gate seam.
- **No per-building constants; subscription shim only** — subjects are durable-skin registry data
  (E-25 Rule 3 self-grep); declarations derive from the committed recognition; the budget is the single
  `BUILD_BUDGET`.
- **Done = delivered** — a creation run regenerates the artifact and renders it **beside the concept**
  (E-36); the glance beats the gate (`docs/knowledge/milestones.md`).
