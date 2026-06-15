# T-158-01 — Research: canonical-flow-proof (E-37 terminal)

Descriptive map of what exists for the terminal proof of epic E-37. The chain was unified
(T-154-01), homed (T-155-01), the sediment archived (T-156-01), the guardrails installed
(T-157-01). This ticket proves it on the two living subjects (barn, cottage) and writes the
narrative so the next thin-context agent inherits the **map, not the history**.

## What the ticket asks (four deliverables)

1. **Barn + cottage end-to-end through the ONE chain**, rendered beside the concept (E-36,
   judge-free), sheets committed to `pr/assets/`.
2. **Recorded honestly** — drafts, not verdicts; name what still reads wrong.
3. **The canonical-flow narrative** in `docs/knowledge/design-learnings.md`, cross-linked from
   `STRUCTURE.md` and the philosophy realization map.
4. **E-12 handoff** + **review.md for S-158** covering the whole epic.
   Plus: `npm test` green, philosophy stage assignment unchanged, no per-building constants.

## The one chain — `benchmarks/sculpture/build.mjs` (`build-chain/v1`)

The sole live `build-chain/v1` entry point (verified by `src/form/topology.conformance.test.mjs`).
`npm run build:<subject>` → `runLive(def, …)`:

- **Stage 3 — recognize (committed input, no spend).** Asserts `recognition/<key>.program.json`
  exists; reads + sha's it. Absent → honest pipeline-failure.
- **Stage 4 — generate-seed.** Spawns `generated-milestone.mjs --subject <key> --skip-gate` (the
  generate-first parametric realizer: `src/form/provision-fit.mjs` + `provision-generate.mjs`,
  GLB-fit + kit, gable-as-wall, overhang, articulation). Reads back
  `generated/<key>/artifact.json`, asserts it, writes it to `builds/<key>/seed-artifact.json`.
- **Stage 5 — workshop.** Spawns `workshop.mjs --subject <key> --pack <pack> --seed-artifact
  builds/<key>/seed-artifact.json` (artifact-base mode). The model critiques 4-azimuth renders of
  its own build beside the concept and revises SURFACE (paint + relief), ledgered, **judge-free
  render every round** (E-36). Budget: `BUILD_BUDGET` = `PATTERN_BOOK_BUDGET` rounds.
- **Final beside concept.** `assertGlAvailable()` then `renderBesideConcept(finalArtifact, concept,
  pr/assets/frames/beside-concept-<key>-build.png)` — the E-36 judge-free glance.
- **Record.** Writes `builds/<key>/build.{json,md}` — the chain receipt (recognition sha →
  seed sha → workshop outcome/rounds → final sha → beside path → generalization grep).

**The gate is a SEPARATE billed step.** `build.mjs` imports no gate seam (enforced by
`src/workshop/isolation.test.mjs`). The frozen judge is `gate:patternbook:<key>`, writing to
`measurements/multi-angle/`.

**`--repro` mode** (T-153-01): no model — proves the deterministic stages only (generate-seed
two-fresh-runs byte-identical + workshop `--replay` artifact-anchored). It is *determinism*, not
"matches a committed draft".

## Inputs — all present and resolvable (HERE-relative under `benchmarks/sculpture/`)

| input | barn | cottage |
| --- | --- | --- |
| recognition program | `recognition/barn.program.json` ✓ | `recognition/cottage.program.json` ✓ |
| GLB (Stage 4 fit) | `glb/barn.glb` ✓ | `glb/cottage.glb` ✓ |
| concept image | `runs/017-…barn…/concept.png` ✓ | `runs/014-vConcept-a-cottage/concept.png` ✓ |
| generated seed (pre-existing) | `generated/barn/artifact.json` ✓ (T-159-01 watertight) | `generated/cottage/artifact.json` ✓ |

Environment probes (run this session):
- **GL available** — authoritative probe `src/view/render-beside.mjs::assertGlAvailable()` → OK
  (GL is a nested `render/` dep; the root `require('gl')` false-negative is the [[gl-probe-nested-render-project]] footgun).
- **`claude -p` shim present** — `/Users/johnchen/.local/bin/claude` (subscription auth, not API key).
- `builds/` does **not exist yet** — no subject has been run through the unified chain into its
  draft home. This ticket is the first live run.

## Pin-guard / location-encodes-status (E-36 / T-155-01)

`builds/<key>/` is the DRAFT home — **free zone, no pin-guard**. `measurements/` + ratified
`packs/` are the pin-guard allowlist (a path *prefix*, fail-closed on git-tracked status). The
chain's `preflightPins` only guards `seedArtifact`, `record`, `recordMd` (all under `builds/`,
untracked on first run → free to write). The beside sheet lands in `pr/assets/frames/` (also
free). So the live run writes drafts only; nothing frozen is touched. ([[location-encodes-status]])

## The narrative target — `docs/knowledge/design-learnings.md`

A ~3050-line append-only ledger; one `## E-NN …` section per epic, newest at the tail (E-35 is
current). The canonical-flow narrative is the E-37 capstone: the plain-language flow, each stage's
technique + **what it allows that the alternatives didn't**. The seven beats the ticket names map
1:1 to the pipeline-philosophy stages:

| beat (ticket wording) | philosophy stage |
| --- | --- |
| language-not-optics | Stage 0 world-building |
| image-not-prose | Stage 1 the target |
| shape-only-not-substrate | Stage 2 form evidence |
| recognition-not-fitting | Stage 3 design (VLM) |
| parametric-not-surgery | Stage 4 construction (brushes) |
| workshop-not-one-shot | Stage 5 the workshop |
| frozen-judge-not-soft-gate | Stage 6 measurement |

The narrative **realizes** the philosophy (does not re-derive it). `pipeline-philosophy.md` is the
architecture of record; the AC says "the philosophy's stage assignment unchanged".

## Cross-link targets

- **`STRUCTURE.md`** — the canonical-spine map. Add a pointer from the spine to the narrative.
- **The philosophy realization map** — `pipeline-philosophy.md` opens with "*realized by E-31
  pattern-book-builder and E-32 brush-factory*". E-37 is the unification realization; the
  cross-link belongs in that realization clause and/or a closing pointer.

## E-12 handoff — what it is

E-12 is the showcase/scoring layer (consumes curated renders + receipts). Prior tickets
(T-066, T-107, T-121, T-138, T-143) close with an **E-12 handoff note in `pr/assets/`**: what is
delivered (the cleaned builds + beside sheets) and honest over/under-reach. Existing
design-learnings "E-12 handoff" paragraphs (lines ~2279, ~2353) name the per-subject consumption
contract. This ticket's handoff hands E-12 the two unified-chain builds + their beside sheets.

## Tests / conformance to keep green

`npm test` = artifact self-test + `node --test src/**/*.test.mjs` (~2161 passing after T-157-01).
Relevant suites: `topology.conformance.test.mjs` (map ↔ tree; **any stage-changing edit must
update STRUCTURE.md in the same commit** — but this ticket changes no stage), `isolation.test.mjs`
(workshop ≠ judge), `pin-guard` conformance. This ticket adds **no source** — it runs the chain
and writes docs — so the suite should stay green untouched.

## Constraints / assumptions

- **No per-building constants** (E-25 Rule 3): the chain self-greps its own source for subject
  keys; subjects are durable-skin registry data. The narrative + handoff must not bake any.
- **Honest failure (E-25 Rule 6):** if a live stage fails (model hiccup, budget), the chain writes
  `{status:"pipeline-failed", stage, error}` and exits 1 — that record is itself the honest report.
- **Draft, not verdict:** the beside render is *evidence*, not a score. Name the barn's known
  weak reads (dropped trim, roughness — [[look-proven-on-cottage-relief]]) rather than claim a win.
- **Concurrency:** ticket claimed this session (`npm run lisa:claim --claim`, was free). Re-check
  before each commit ([[lisa-same-ticket-concurrency]], [[ticket-double-dispatch]]).
