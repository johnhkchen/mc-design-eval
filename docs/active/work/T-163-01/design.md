# T-163-01 — Design

Decisions, with rejected alternatives. Grounded in `research.md`.

## Decision 1 — The department partition (5 departments)

**Departments:** `ROOF`, `WALL`, `OPENING`, `CHIMNEY`, `ROOM`.

Coarse departments, fine idioms — matching E-39's rule ("a roof problem routes to the roof
department regardless of style; Layer B picks the specific idiom"). The mapping over all 28 idioms:

| Department | Idioms | n |
|---|---|---|
| `ROOF` | roof.gable, roof.gable.steep, roof.hip, roof.pyramid, roof.thatch, dormer, surface.roof-courses | 7 |
| `OPENING` | arch, head.flat, opening-dressing | 3 |
| `CHIMNEY` | chimney | 1 |
| `ROOM` | hollow, floorplan | 2 |
| `WALL` | plinth, jetty, timber-frame, surface.clinker, surface.limewash, surface.relief, pilaster, quoin, infill-panel, eave-overhang, surface.fill, surface.paint, surface.strip-salt, course.stairs, course.slab | 15 |

7+3+1+2+15 = 28. Clean partition: every idiom in exactly one department, every department ≥1 idiom.

**`WALL` is the envelope-and-its-cladding department** (structure + banding + relief + recolor +
generic courses). The cladding/`surface.*`/articulation passes are wall concerns; `course.stairs`/
`course.slab` are generic string-course primitives whose standalone use is wall banding (roof
constructs emit their own internal courses), so they land in `WALL`, not `ROOF`.

### How it is *derived* (not a flat hand-list) — `src/pack/departments.mjs`

Four **mutually-exclusive specific predicates** (ROOF, OPENING, CHIMNEY, ROOM) + `WALL` as the
explicit fall-through. `departmentOf(name)` counts how many *specific* predicates match:
- `> 1` → **throw** (this is the "an idiom serves two departments" failure made loud);
- `1` → that department;
- `0` → `WALL` (the envelope catch-all).

```
ROOF    : name.startsWith("roof.") || name === "dormer" || name === "surface.roof-courses"
OPENING : name.startsWith("head.") || name === "arch" || name === "opening-dressing"
CHIMNEY : name === "chimney"
ROOM    : name === "hollow" || name === "floorplan"
WALL    : (none of the above)
```

Predicates are unordered and provably disjoint, so the conformance test can assert *each idiom
matches exactly one specific predicate or zero* — the genuine "serves two" tripwire, not an
order-hidden first-match. This keeps the grouping as readable RULES (the design decision) while the
test independently proves the partition against the live `idiomNames()`.

**Rejected — a flat `{name: dept}` literal table.** Works, but (a) reads as a per-idiom constant
list rather than a grouping decision, and (b) a new idiom silently needs a new table row with no
signal. The predicate form gives every future idiom a default (`WALL`) and makes the conformance
test catch only genuine ambiguity, not mere additions.

**Rejected — prefix-only derivation.** `surface.*` splits across ROOF (`surface.roof-courses`) and
WALL; bare names (arch, jetty, chimney…) have no prefix. A pure-prefix rule mis-routes exactly the
ambiguous cases research flagged. The hybrid (prefix + explicit name predicates) is the minimum that
routes all 28 correctly.

**Rejected — a finer SURFACE department** (split cladding from structure). Tempting, but the
WALL/SURFACE boundary is genuinely fuzzy (is a `pilaster` structure or cladding? `infill-panel`?) —
exactly the "serves two departments" trap. Coarse `WALL` avoids inventing a boundary the registry
doesn't draw; Layer B still reaches the specific idiom. If S-165's second style proves a real
routing need to separate cladding, that is a *later* grouping decision with evidence, not now.

## Decision 2 — Proportion / massing is a SEPARATE AXIS, **not** a Department

**This is the decision the ticket Notes demand T-164/166 depend on.**

The registry contains **no idiom that resizes a mass.** Proportion is *relational* (a ratio between
masses / between a mass and its features), fixed by `adjust-params` on a **MASS id** — the geometry
levers `critique.baml` already routes ("proportion fixes go here"), which is **not** an
idiom-registry brush. Therefore:

- A `MASSING` department would name **zero idioms** → it breaks the conformance partition
  (department→no-idiom). So massing **cannot** be a registry-derived `Department`.
- The `expected/present/missing` triple is an *element* vocabulary (missing→add, present-but-wrong
  →replace, absent→remove). Proportion is none of these — it is *resize*. So it also doesn't fit
  the `CritiqueItem` triple. This is precisely the falsifiable-claim failure mode the ticket
  predicts ("the schema needs another axis — report, don't force").

**Decision (reported, not forced):** `Department` stays registry-pure (the 5 above; every value
backed by ≥1 idiom). Proportion/massing is a **separate axis** that this contract does **not**
encode as a `CritiqueItem`. It continues to ride the existing **mass `adjust-params`** path
(already in the creation loop / `critique.baml`). S-164's router routes proportion via that mass
path, not via a `CritiqueItem.department`. If a *structured* proportion critique proves necessary
in S-165/166, that is a schema-v2 axis (e.g. a `proportion` field on `Critique`, or a `Relation`
class) — a named follow-up, deliberately out of S-163 scope.

The decision is written into the `.baml` header, `departments.mjs` header, and `review.md` open
concerns so T-164/166 inherit it unambiguously.

**Rejected — add a `MASSING` enum value with a registry exception.** Lets Layer A emit a proportion
finding, but it forces a no-idiom department through a special-case hole in the conformance test —
exactly the "force it" the anti-hedge directive forbids. The honest move is to keep the partition
clean and name proportion as the axis the triple can't carry.

## Decision 3 — A carrier function `DiagnoseBuild(...) -> Critique` (minimal prompt stub)

`b.parse` is keyed on a *function*, so the typed `Critique` is only parseable if a BAML function
returns it. Define `DiagnoseBuild` now as the **contract carrier** with a minimal placeholder prompt
and wire one `FNS` entry in the bridge. This is *plumbing*, not *behaviour*: no runner calls it, no
creation-loop change, no judging logic. S-164 (`DiagnoseBuild → Critique`, per E-39) authors the
real diagnostic prompt and the wiring on top of this exact signature — the name is chosen to match
so S-164 fills a body rather than renaming.

**Rejected — a throwaway `ParseCritique` function.** Avoids "naming S-164's function," but leaves an
orphan the next story must delete, and two functions returning `Critique`. Since S-164 depends on
S-163 (sequential, E-39: "everything depends on it"), there is no concurrency hazard in defining the
real name now with a stub prompt.

**Rejected — no function, test classes another way.** Not possible: `b.parse` requires a function;
the AC explicitly demands `b.parse` fixture tests.

## Decision 4 — New file `baml_src/department.baml`; new test `src/baml/critique-contract.test.mjs`

Put `Department`, `CritiqueItem`, `Critique`, `DiagnoseBuild` in a **new** `.baml` file, not in
`critique.baml`. Keeps the new contract off the `WorkshopReply` that S-164 will dismantle, and the
new file is outside TG5's pinned list (we still avoid the banned tokens by convention). A **new**
test file isolates S-163's fixtures from the pinned `fixtures.test.mjs` `R[i]` ordering (adding a
batch entry there would renumber nothing but is needless coupling). The new test spawns its own
`bamlBatch`.

## Decision 5 — The "malformed rejects" fixture targets a TYPED-FIELD violation

`Critique { items: CritiqueItem[] }` is an all-array-fields class → SAP coerces prose to
`{ items: [] }` and never rejects (the FX-D1 leniency). So:
- the **accept** fixture: a committed JSON reply with ≥1 well-formed `CritiqueItem` →
  `deepEqual` the committed expected;
- the **reject** fixture: a reply whose item carries an **unknown `department`** (or bad
  `severity`) — an enum violation DOES reject — proving the `Department` typing is real both ways;
- additionally pin the **prose→empty** coercion (`{ items: [] }`) like FX-D1, so the leniency is
  documented, not a latent surprise for S-164's reply gate.

## Decision 6 — `departmentToIdioms(dept)` seam

Pure `.mjs`, returns the candidate idiom **names** (sorted) whose `departmentOf` equals `dept`
(throws on an unknown department, mirroring `getIdiom`). Layer B (S-164) consumes it to pick a tool
once the diagnosis names a department. Unit-tested: round-trips the partition
(`departmentToIdioms` over all departments reconstructs exactly `idiomNames()`), no per-subject
constants. (Returning names, not entries, keeps the seam decoupled from entry shape; callers
`getIdiom(name)` for the entry.)
