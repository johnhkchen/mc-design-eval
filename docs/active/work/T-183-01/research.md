# T-183-01 — Research

Epic **E-46** / Story **S-183**. Build the decoupling corpus: ≥8–10 styled build states across ≥3
subjects with a factorial that **decouples PACK from CONCEPT IMAGE** so the T-182-01 pack confound
becomes testable. Deliverable is a **manifest of (build, pack, concept) triples + renders**, not new
scoring code. Below: what exists, where, how it connects.

## The three axes the corpus must decouple

From E-46 background, three axes normally co-vary; the corpus separates them:

- **BUILD** — the rendered artifact (its actual materials/form). On disk under `builds/<subject>/<dir>/`.
- **PACK** — the style spec handed to the scorer. On disk under `packs/*.json`.
- **CONCEPT IMAGE** — the picture the build is scored against. Under `benchmarks/**/concept.png`.

The crux is that in **production** the pack is *derived from* the concept by recognition, so they
co-vary by construction. The corpus must hand `(pack, concept)` to the scorer **independently** — which
the existing referee already does (it never runs recognition for the crater; it loads a pack file and a
concept file separately). This is the key constructibility fact (see "Constructibility" below).

## The existing harness — corpus-referee.mjs

`experiments/eval-alignment/corpus-referee.mjs` is the referee. Relevant structure:

- It already encodes a **4-condition crater** (`CRATER_CONDITIONS`, lines 133–138) that IS a decoupling
  factorial on ONE subject (gatehouse):
  - `A-matched`  = rustic pack + rustic gatehouse concept  → **match** cell.
  - `B-arc` / `B2-chapelle` = guildhall pack + classical/gothic concept → cross (wrong build-context).
  - `C-control` = **rustic pack + classical concept** → this is exactly the **same-pack/wrong-picture**
    cell. The C-control is where T-182-01 *saw* the confound (pack effect C−B=+29 ≫ concept-image effect
    A−C=−7). T-183-01 generalizes this single-subject factorial into a multi-subject **population**.
- `diagnose({program, pack, concept, renders})` (lines 117–124) is the one scoring primitive: renders
  `DiagnoseBuild` via the BAML bridge, runs the tiered op, parses, returns `{ev, items, score}`. It
  takes pack and concept as **independent arguments** — confirming the axes are separable at the call.
- Env knobs: `CRATER_BUILD` (the build dir), `VOTES`, `CRATER_ONLY`, `GUARD_ONLY`, `REFEREE_OUT_DIR`,
  `REFEREE_RESULTS`. Asset-guard-first (all paths `existsSync` before any spend), beside-PNG-first.
- `composeTwo(pathA, pathB, outPath)` (lines 99–115) is a **pure, GL-free** side-by-side compositor
  (uses `decodeImage` + `pngjs`). This is the "render beside its scored concept" primitive for cells
  that reuse existing renders — no GL needed.
- `PROGRAM` (lines 74–77) is a **synthetic fixed gatehouse program** that only fills
  `diagnose.mjs::programBlock`; it is NOT a recognition output. The referee scores every condition with
  this same fixed program — so the manifest does not need per-state recognition programs.

The referee consumes the **defect-corpus** (`loadDefectCorpus`) for its agreement + bake-off sections;
T-183-01's manifest is a **sibling corpus**, not a change to the referee. S-184 will write the harness
that iterates the new manifest.

## The corpus loader pattern — defect-corpus.mjs

`src/workshop/defect-corpus.mjs` is the precedent for a committed, validated, model-free corpus:

- Ajv2020 strict + addFormats, **memoized** compiled validator (`compileCorpusValidator`).
- `parseDefectCorpus` returns a **value** (`{ok,corpus}` | `{ok,errors}`) — the artifact.mjs idiom;
  `loadDefectCorpus` is the fail-fast wrapper that throws formatted errors.
- `assertSemantics` does the JSON-Schema-can't-express checks (duplicate ids; `worstDepartment ∈
  DEPARTMENTS` — the single composition point).
- Pure partition helpers (`singleStates`, `pairStates`) are what downstream imports.
- Schema lives at `schema/defect-corpus.schema.json`; data at
  `experiments/eval-alignment/corpus/defect-corpus.json`; test at
  `src/workshop/defect-corpus.test.mjs` — and the test **guards every referenced asset exists on disk**
  (`existsSync` on concept + renderDir/view PNGs). This is the model for T-183-01's loader + test.
- `npm test` = `validate-artifact` self-test + `test:unit` (`node --test "src/**/*.test.mjs"`). So a
  loader + test placed under `src/workshop/` is automatically covered; a manifest with a bad asset path
  fails `npm test` (the reproducibility guard).

## The replay precedent — faithful-roof.mjs

`experiments/eval-alignment/faithful-roof.mjs` (S-177) is the model for a **reproducible build by
replay**: a deterministic, model-free **artifact mutation** of a committed base, re-rendered. It carves
an artifact above the eave and re-covers, then `renderViews` + `renderBesideConcept`. Pattern reused for
the synthesized hard-middle states: a pure mutation of the fully-faithful gatehouse, re-rendered.

## Builds, packs, concepts available

- **Builds with 4 azimuths + artifact.json** (rebuildable / mutatable): `gatehouse/{faithful,
  faithful-covered, new-roof, roof-covering}`, `cottage/roof-covering`, `barn/roof-covering`.
  `gatehouse/faithful-covered` is the **fully-faithful** gatehouse (E-44/S-177) — the natural HIGH match
  cell and the base for synthesized mutations. Its `placements` (1339) are
  `{op:"voxel",pos:[x,y,z],block:"minecraft:…"}`; palette `manifest` is a block-id array. Blocks:
  stone_bricks 1106 (walls/dressing), dark_oak_stairs 210 + dark_oak_planks 15 (roof), cobblestone 4,
  dark_oak_log 4.
- **Builds with 4 azimuths, renders only (no artifact.json)**: `cottage/new-roof`, `barn/new-roof`,
  `cottage/round-1..6`, `barn/round-1..6`. These are fine as manifest entries (a reuse cell only needs
  `renderDir` + view PNGs, not an artifact).
- **Naturally partially-faithful builds** (hard-middle candidates, already inspected in defect-corpus):
  `gatehouse/new-roof` (unframed gaping gate — *missing dressing*), `cottage/new-roof` (plain upper
  storey — *missing half-timber*), `barn/new-roof` (holey walls).
- **Packs**: `rustic.json` (the matched style for all three subjects — yeoman Tudor vernacular),
  `guildhall.json` (the closest classical/foreign profile; the referee's `WRONG_PACK`), `saltcrag.json`.
- **Concepts**: gatehouse `runs/015-…/concept.png`, cottage `runs/014-…/concept.png`, barn
  `runs/017-…/concept.png`, church `runs/016`. Wrong-style: `benchmarks/temple-facade/concepts/
  arc-A-flash.png` (polychrome classical arch), `chapelle-A-flash.png` (gothic cathedral).

## Constructibility of the crux cells (the falsifiable hinge)

The S-183 claim fails if same-pack/wrong-picture cells are unconstructible because "recognition always
re-derives a matching pack." **In the corpus this failure does not occur**: the referee never runs
recognition — it loads a pack file and a concept file as independent `diagnose()` arguments. So the
same-pack/wrong-picture cell is *trivially* constructible (it already exists as `C-control`). The
structural-confound finding (E-46) is about the **production pipeline**, not the corpus; the corpus's
whole purpose is to bypass that coupling and measure pack-effect vs concept-image-effect separately.
This must be **recorded honestly** in the manifest notes: the decoupling is real *because* the scorer is
handed `(pack, concept)` independently — which is also why the corpus can only refute the term, not
prove the production pipeline reads the picture (pack still co-varies with concept in production).

## GL / rendering

`render/src/render.mjs` `GL_AVAILABLE = true` (probed). `src/view/render-beside.mjs`
(`renderBesideConcept`, `assertGlAvailable`) is the live render path; `renderViews`
(`src/view/multi-angle.mjs`) renders the 4 gate azimuths. So synthesized mutated builds **can** be
rendered fresh. Reuse cells need no GL (composeTwo on committed view PNGs).

## Constraints / assumptions

- Nothing under `measurements/` may be touched (frozen instrument). All writes land in `builds/`,
  `experiments/eval-alignment/corpus/`, `src/workshop/`, `schema/`, `docs/active/work/`.
- The hard-middle states must be **inspected on the render** and confirmed genuinely contestable — an
  obviously-good or obviously-bad state fails the AC (the corpus can't embarrass the term).
- Reproducible by replay: a script regenerates the synthesized builds + all beside-PNGs + the manifest;
  reuse cells point at committed dirs. Renders are evidence, not a byte-gate.
- The manifest is **infrastructure S-185 re-runs** — keep it data + a replay script, not a one-off.
