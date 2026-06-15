# T-163-01 — Research

**Ticket:** department-enum-and-critique-schema (Story S-163, Epic E-39).
**Goal of this phase:** map what exists, where, and how it connects. No solutions.

## What the ticket asks for (restated)

Build the *typed contract* between the diagnostic judge (Layer A) and the builder/router (Layer B):

1. A `Department` enum **generated from** `src/pack/idiom-registry.mjs` (a pure `.mjs` grouping
   idioms → departments) + a **conformance test** that fails on any idiom→no-department or
   department→no-idiom drift (single-composition-point tripwire).
2. BAML `Critique { items: CritiqueItem[] }` + `CritiqueItem { department, expected, present,
   missing, severity }`, with `b.parse` fixture tests (the repo's BAML test pattern).
3. A pure `.mjs` `departmentToIdioms(dept)` seam for Layer B (S-164) — candidate idiom entries per
   department; unit-tested, no per-subject constants.
4. `npm test` green; transport-guard green (frozen judge path gains no BAML dependency).

No judging *behaviour* (prompt logic, runner wiring, creation-loop integration) — that is S-164.

## The idiom registry (the construction catalogue) — `src/pack/idiom-registry.mjs`

The single door to every build technique (E-32 Rule 1; `brush-door.conformance.test.mjs`). One
frozen table `IDIOM_REGISTRY` (alias `BRUSH_REGISTRY`), iterated by `idiomNames()` (sorted),
resolved by `getIdiom(name)` (throws on unknown). Two kinds per entry: `construct` (spec→cells)
and `pass` (occupancy+context→placements). Each entry carries `kind`, `source`, `tests`,
`composition {consumes, emits}`, `preview`, `paramsSchema`.

**The 28 idiom names (confirmed via `idiomNames()`):**
```
arch  chimney  course.slab  course.stairs  dormer  eave-overhang  floorplan
head.flat  hollow  infill-panel  jetty  opening-dressing  pilaster  plinth
quoin  roof.gable  roof.gable.steep  roof.hip  roof.pyramid  roof.thatch
surface.clinker  surface.fill  surface.limewash  surface.paint  surface.relief
surface.roof-courses  surface.strip-salt  timber-frame
```

Observed families by name + by what the generator addresses (descriptive, not yet grouped):
- **Roof:** `roof.gable`, `roof.gable.steep`, `roof.hip`, `roof.pyramid`, `roof.thatch` (roof
  field/covering); `dormer` (roof feature); `surface.roof-courses` (roof course regularization).
- **Openings:** `arch`, `head.flat` (aperture heads, shaped-vocab); `opening-dressing` (frames,
  shutters, doors, lights into detected apertures).
- **Chimney:** `chimney` (stack + cap).
- **Interior/room:** `hollow` (carve cavity, exterior held), `floorplan` (interior divider walls).
- **Wall envelope + cladding/banding (everything else):** `plinth` (base band), `jetty`
  (overhang), `timber-frame` (placement grammar), `surface.clinker` / `surface.limewash` /
  `surface.relief` (cladding passes), `pilaster` / `quoin` / `infill-panel` / `eave-overhang`
  (facade articulation, `src/view/facade-articulation.mjs`), `surface.fill` / `surface.paint` /
  `surface.strip-salt` (recolor/cleanup passes), `course.stairs` / `course.slab` (generic
  shaped-vocab string courses).

**Note on ambiguity (relevant to the falsifiable claim):** `course.stairs` / `course.slab` are
generic primitives (a stair/slab run); they appear in roof courses *and* wall banding. Roof
constructs already emit their own internal courses, so the standalone idioms read as wall/trim
banding. `surface.roof-courses` is the one `surface.*` that is a roof concern. These two facts are
where a naive prefix grouping would mis-route.

## The BAML stack — `baml_src/`, `src/baml/`

- **`baml_src/*.baml`** — schema/prompt/test authority. `generators.baml` emits the TS
  `baml_client/` (`output_dir "../"`). `package.json` `pretest: npm run baml:gen` regenerates the
  client before every test run; `node_modules/.bin/baml-cli` is present.
- **Enums already exist** in BAML: `Category` (judge.baml), `PlacementRule` (materialmap.baml),
  `Defect` (review.baml) — confirming `enum Name { VALUE ... }` syntax is in use.
- **The bridge** — `src/baml/bridge.mjs` (pure `.mjs` wrapper) spawns `npx tsx src/baml/bridge.mts`
  with a batch of ops on stdin. `bridge.mts` is the **only new** `baml_client` importer (others
  grandfathered; pinned by transport-guard **TG3**). It exposes exactly two modes per function:
  `render` (args+images → `{prompt, images}` from the rendered request) and `parse` (raw text →
  typed object via `b.parse.<Fn>`). NEVER transports. A function appears in the `FNS` table mapping
  `request`/`parse` to `b.request.<Fn>` / `b.parse.<Fn>`.
- **`b.parse` is keyed on a FUNCTION**, not a class. To `b.parse` a `Critique`, a BAML *function*
  returning `Critique` must exist, and an `FNS` entry must wire `b.parse.<Fn>`. This is the
  structural tension with "no judging behaviour" — a carrier function (minimal prompt) is required
  for the type to be parseable; the *prompt body / wiring* is what S-164 owns.

## The BAML test pattern — `src/baml/fixtures.test.mjs`

One `bamlBatch([...])` spawn in a `before()` hook serves the whole file; tests index `R[i]`. Two
pin families per function:
- **render** — rendered prompt bytes/sha vs a committed authority (golden text or `promptSha256`).
- **parse** — `b.parse` over a COMMITTED raw reply `deepEqual`s a committed expected parse
  (`dropNulls` normalizes optional-absent vs optional-null), **and a malformed specimen rejects**
  (`R[i].ok === false`).

Fixtures live under `src/baml/fixtures/<fn>/` (`inputs.json`, `reply*.txt`, `expected*.json`,
golden prompt). The critique fixtures already exist under `fixtures/critique/`.

**Important pinned leniency (FX-D1, decompose.baml):** a BAML class of ONLY array fields never
rejects — SAP degrades any malformed reply to the empty instance. `Critique { items: ... }` is
exactly this shape, so a "malformed rejects" test on `Critique` will NOT reject on prose — it
coerces to `{ items: [] }`. The fixture test must assert the empty-coercion (like FX-D1's
`R[14]`), not a rejection, OR test rejection on a *typed-field violation* (e.g. an unknown
`department` enum value or a bad `severity`), which DOES reject.

## The transport / judge-isolation guards — `src/baml/transport-guard.test.mjs`

- **TG3** pins the exact set of `baml_client` importers — `bridge.mts` is already in it; adding an
  `FNS` entry to the bridge does NOT add an importer, so TG3 stays green.
- **TG4** the frozen judge path (`multi-angle-gate.mjs`, `judge-reply.mjs`, `resemblance.mjs`,
  `benchmarks/sculpture/multi-angle-gate.mjs`) must reference no `baml`. This story touches none of
  them — but any new `.mjs` must not be imported by them.
- **TG5** these `.baml` files must not carry judge vocabulary: `recognition`, `critique`,
  `vernacular`, `decompose`, `formation`. The banned tokens are `JudgeFacade` and the regex
  `same object|drifted|different object`. A NEW `.baml` file (not in TG5's list) is unconstrained,
  but should still avoid the banned tokens by convention. Putting the new classes in a new file
  keeps them off the WorkshopReply that S-164 will replace.

## The existing critique surface — `baml_src/critique.baml`

`CritiqueWorkshopRound → WorkshopReply { critique: WorkshopCritique, decision, action, rationale }`,
where `WorkshopCritique { issues: WorkshopIssue[] }` and `WorkshopIssue { region: string, issue:
string, severity: "minor"|"major" }`. This is the **fused** reply S-164 will split. The header
already declares "WORKSHOP CRITIQUE, NOT THE FROZEN JUDGE." The new contract is the typed
*enrichment* of `WorkshopIssue` → `CritiqueItem` (adds `department`, `expected/present/missing`).
The prompt mentions: with a MASS id, `adjust-params` carries the GEOMETRY levers — "proportion
fixes go here." So **proportion already routes to a mass-params path, not an idiom.**

## Constraints & assumptions surfaced

- **Single composition point:** the department vocabulary must be generated once (a `.mjs`), and
  the `.baml` enum must be a *checked mirror* of it (a conformance test, since `.baml` enum values
  are static text). Authority = the `.mjs`; `.baml` enum + the registry partition are both pinned
  to it.
- **Proportion/massing is relational** and has **no idiom** in the registry (the closest, `jetty`/
  `plinth`, are applied wall features, not mass resizers). A registry-derived department for it
  would name no idiom → break the conformance partition. The ticket explicitly demands a recorded
  decision (Department vs separate axis); this constraint forces the answer (see Design).
- **No per-subject constants** in the `.mjs` (no cottage/barn/church) — the grouping is keyed on
  idiom names/families only.
- `npm test` runs `baml:gen` first; the new `.baml` regenerates `baml_client` automatically.
