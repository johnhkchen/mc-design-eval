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

The **plain-language relay-race retelling** — each stage's technique and what it allows that the
alternatives didn't (language-not-optics, image-not-prose, shape-only-not-substrate,
recognition-not-fitting, parametric-not-surgery, workshop-not-one-shot, frozen-judge-not-soft-gate) —
is the **E-37 capstone in `docs/knowledge/design-learnings.md`**, with the barn + cottage end-to-end
proof (T-158-01). The architecture of record stays `docs/knowledge/pipeline-philosophy.md` (stage
assignment unchanged — realized, not re-derived).

## Retired from the live path — ARCHIVED (S-156 / T-156-01)

These ran the *old* parallel chains. They are now under `benchmarks/sculpture/_archive/` (importable,
committed, `git mv` byte-identical) so the live tree reads as the canonical spine only. Each move was
reference-checked: every committed test/record/npm-script reference was updated or the move refused
(E-37 Rule 2). The retired-epic sediment (E-13→E-24: `glb-voxel*`, `e18/e19`, `sweep-ablation`, the
`*-ab` experiments, the material/palette epoch, `building`, `hollow-cottage`, baselines …) moved with
its output trees; see `_archive/README.md` for the full manifest.

- `_archive/pattern-book.mjs` — the **program-seed** chain (its `seedWorkshopProgram` Stage-4 brushes
  are replaced by the generate-first realizer). Its committed `pattern-book/` baselines + `workshop/`
  program-seed ledgers **stay in the live tree** (live tests/milestones read them).
- `_archive/reconstructed-milestone.mjs` · `_archive/regularize-shell.mjs` — terminal E-27/28
  chains, referenced live only in provenance comments; their record dirs (`reconstructed/`,
  `regularize/`) **stay** (they feed the kept Stage-4 skin via `component-skin`).
- `styled-milestone.mjs` · `challenge-milestone.mjs` **stay in the live tree** (T-158-01 restored
  them from a S-156 mis-archive — the move broke the one chain, and running barn + cottage
  end-to-end for the first time caught it). They **host the shared Stage-4 stages** —
  `styledStretch` (grammar→dressing→settle), `shellStage`, `spawnGate`, `distillGate`, `runChain` —
  that `generated-milestone.mjs` *imports* and `component-skin.mjs` *spawns by name*. The four
  committed subject maps `material-map/{barn,church,cottage,gatehouse}.json` were restored with them
  (live `durable-skin` `map:` inputs); only the retired-subject maps and `.raw.json` intermediates
  stay archived. (The clean follow-up — extract those shared stages into a dedicated live module so
  the terminal *chains* can archive without dragging them — is its own ticket.)
- `generated-milestone.mjs` **stays in the live tree** — its deterministic core IS Stage 4 (spawned by
  `build`); only its standalone-with-gate npm scripts (`generated:*`) were removed.

## Invariants (enforced — S-157, `src/form/topology.conformance.test.mjs`)

The topology conformance suite goes **red on violation** (the [[vocabulary-authority-one-composition-point]]
pattern). It reads this map and the live tree; if the two drift, the build fails.

- **This map is authoritative + kept current** — every module the spine names must exist on disk
  (forward), and every stage the one chain actually runs must be named here (reverse). It follows
  that **any stage-changing ticket updates this map in the same commit**.
- **One chain, one entry point** — exactly one live runner declares the `build-chain/v1` schema; a
  second "build a subject" entry point fails the suite.
- **No live module imports from `_archive/`** — the dead-code home is importable but the live spine
  may not reach into it (provenance *comments* are fine; an `import`/`from` clause is not).
- **Location encodes status** — drafts are free; `measurements/` + ratified `packs/` are the pin-guard
  allowlist (E-36 / T-155-01, a path **prefix**, not a hand-list — the suite locks the prefix shape).
  The unified chain writes its draft under `builds/<key>/` so it never clobbers a committed program-seed ledger.
- **The workshop cannot call the judge** — `src/workshop/isolation.test.mjs` scans the runner sources;
  `build.mjs` imports no gate seam.
- **No per-building constants; subscription shim only** — subjects are durable-skin registry data
  (E-25 Rule 3 self-grep); declarations derive from the committed recognition; the budget is the single
  `BUILD_BUDGET`.
- **Done = delivered, not compiled** — a creation run regenerates the `builds/<subject>/` artifact and
  renders it **beside the concept** (E-36); the chain reports success only after that glance. Green
  tests alone are not done; the glance beats the gate (`docs/knowledge/milestones.md`).

## Conventions (recorded — S-157)

Thin-context autonomous runs need the *organizational* rules written where the structure can't
enforce every nuance. These are conventions, backed by the invariants above where a test exists.

- **Replace, don't accrete.** A superseding ticket **archives what it replaces in the same ticket**
  (it does not leave the old chain beside the new one — T-156 archived the retired chains as E-37
  required). A **shared dependency gets its own upstream ticket**, never a "share X" note duplicated
  into sibling roots ([[parallel-roots-duplicate-shared-deps]]).
- **Claim before you produce.** Lisa can hand one ticket to two threads
  ([[lisa-same-ticket-concurrency]], [[ticket-double-dispatch]]). Before emitting a phase artifact,
  a thread writes `docs/active/work/<ticket>/.lisa-claim.json` and a sibling **checks** it
  (`npm run lisa:claim -- --ticket <id> --check`); a fresh foreign claim means *defer, don't race*.
  The claim auto-frees after a stale interval so a crashed thread never wedges the ticket.
