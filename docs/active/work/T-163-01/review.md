# T-163-01 — Review

Handoff for a human reviewer / for S-164. The typed contract between the diagnostic judge and the
builder is in place: a registry-derived `Department` enum, the enriched `Critique`/`CritiqueItem`
BAML classes, the Layer-B seam, and conformance/`b.parse` tests. No judging behaviour.

## What changed

**Created**
- `src/pack/departments.mjs` — the **single composition point**. `DEPARTMENTS`
  (CHIMNEY/OPENING/ROOF/ROOM/WALL), `departmentOf(name)` (derives via four mutually-exclusive
  SPECIFIC predicates + WALL fall-through; **throws** if an idiom matches two — the "serves two
  departments" failure made loud), `departmentToIdioms(dept)` (the Layer-B seam, S-164),
  `departmentPartition()`.
- `src/pack/departments.test.mjs` — DPT1 (partition total & disjoint over the **live**
  `idiomNames()`), DPT2 (every department names ≥1 idiom), DPT3 (`.baml` enum ↔ `DEPARTMENTS`
  drift tripwire), DPT4 (seam: validate/sorted/memberships).
- `baml_src/department.baml` — `enum Department`, `CritiqueItem {department, expected, present,
  missing, severity}`, `Critique {items[]}`, and `DiagnoseBuild` (contract **carrier**, stub
  prompt).
- `src/baml/critique-contract.test.mjs` — CC1 accept, CC2 enum-leniency, CC3 prose-rejects.
- `src/baml/fixtures/critique-contract/` — `reply.txt`, `expected.json` (minted from the parser),
  `reply-bad-department.txt`.

**Modified**
- `src/baml/bridge.mts` — one `FNS` entry (`DiagnoseBuild`). No new `baml_client` importer.

Commits: `6715c9c` (taxonomy + conformance), `c9236db` (BAML contract + bridge), `9f83b99`
(`b.parse` fixtures).

## The partition (the falsifiable claim, settled)

All 28 registry idioms partition cleanly: ROOF (7), OPENING (3), CHIMNEY (1), ROOM (2), WALL (15).
Every idiom maps to exactly one department; every department names ≥1 idiom; DPT1's disjointness
proves no idiom serves two. The claim **held** — the grouping did not surface an idiom that serves
two departments or none. `WALL` is deliberately the coarse "envelope and its cladding/banding"
catch-all (cladding `surface.*`, facade articulation, generic courses) — coarse departments, fine
idioms, matching E-39's routing rule.

## The recorded decision T-164/166 depend on — proportion is a SEPARATE AXIS

The registry has **no idiom that resizes a mass**. Proportion is relational, fixed by
`adjust-params` on a MASS id (the geometry levers already in `critique.baml`), which is **not** a
registry brush. A `MASSING` department would name zero idioms and break the partition; and the
`expected/present/missing` triple is an element vocabulary (add/replace/remove), not resize. So:

> **`Department` stays registry-pure; proportion rides the existing mass-params path, not a
> `CritiqueItem`.** If a *structured* proportion critique is later needed, that is a schema-v2 axis
> (a `proportion`/`Relation` field on `Critique`), reported here — **not** forced into a fake
> department now.

This is recorded in the `departments.mjs` header, the `department.baml` header, and here. **S-164's
router must handle proportion via the mass path, not by expecting a proportion department.**

## Test coverage & gaps

- **Green:** `npm test` 2200/2200; transport-guard TG1–TG5; `departments.test.mjs` (DPT1–DPT4);
  `critique-contract.test.mjs` (CC1–CC3). The pre-existing `fixtures.test.mjs` and
  `brush-door.conformance.test.mjs` are untouched and green (registry not modified).
- **Conformance is against the LIVE registry** (`idiomNames()`), so a future idiom is auto-checked:
  it gets `WALL` by default, and DPT1 fails it only if it genuinely matches two specific predicates.
- **Gap — no render/golden pin for `DiagnoseBuild`.** Deliberate: the prompt is a stub S-164
  rewrites; pinning its bytes now guarantees an immediate break. Render-pinning is S-164's job once
  the diagnostic prompt is real. Until then, only `parse` is exercised.

## Open concerns / flags for the reviewer

1. **The SAP finding S-164 MUST inherit (CC2).** An unknown `department` does **not** reject —
   BAML's SAP **drops** the bad item, yielding `{items:[]}`. The `Department` typing is therefore a
   **filter, not a gate**. S-164's reply gate must treat an emptied `items` list as *malformed*
   (the same discipline the decompose runner needs, FX-D1). `b.parse` alone will not flag a
   judge that hallucinates a department — the item just vanishes. This is the most important thing
   to carry forward.
2. **`DiagnoseBuild` params are placeholder plumbing** (`concept_block`, `build_block`). S-164 will
   almost certainly change the signature for the real diagnostic prompt (images, program JSON,
   style suite). The bridge entry and fixture will need updating in lockstep — they are minimal on
   purpose.
3. **WALL is a large bucket (15 idioms).** Adequate for routing now (Layer B picks the specific
   idiom), but if S-165's second style proves a real need to separate structure from cladding, that
   is a *future* grouping decision with evidence — not a silent refactor. The predicate form makes
   that split a small, testable change.
4. **Frozen instrument untouched.** No TG4 judge-path file changed or imports `departments.mjs`;
   the creation/measurement wall holds.

## Acceptance criteria — status

- [x] `Department` enum derived programmatically from the idiom-registry + conformance test
  (idiom→no-dept / dept→no-idiom drift) — `departments.mjs` + DPT1/DPT2/DPT3.
- [x] BAML `Critique`/`CritiqueItem` with `b.parse` fixture tests — `department.baml` + CC1–CC3.
- [x] Pure `.mjs` `departmentToIdioms(dept)` seam, unit-tested, no per-subject constants — DPT4.
- [x] `npm test` green; transport-guard green (frozen judge path gains no dependency).
- [x] Proportion/massing decision recorded (separate axis).
