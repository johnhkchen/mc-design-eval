# T-163-01 — Structure

File-level blueprint. Not code — the shape of the code, interfaces, and ordering.

## Files

### CREATE `src/pack/departments.mjs` (the single composition point)

Pure `.mjs`, no GL/IO/Date/random. Imports `idiomNames` from `./idiom-registry.mjs`.

Public surface:
```js
export const DEPARTMENTS;            // Object.freeze(["CHIMNEY","OPENING","ROOF","ROOM","WALL"]) — sorted, frozen
export function departmentOf(name);  // idiom name -> Department; THROWS on ambiguity (>1 specific match)
export function departmentToIdioms(dept); // Department -> sorted idiom names; THROWS on unknown dept
export function departmentPartition();    // -> { [dept]: string[] } full map (test/diagnostic helper)
```

Internals (not exported):
- `SPECIFIC` — an array of `[department, predicate(name)]` for ROOF, OPENING, CHIMNEY, ROOM
  (the four mutually-exclusive specific predicates from Design §1). `WALL` is the fall-through.
- `departmentOf(name)`: count specific matches → `>1` throw (`departments: idiom "x" matches N
  departments …`), `1` → that dept, `0` → `"WALL"`. Does **not** require `name` to be a registry
  idiom (callers pass `idiomNames()`); but `departmentToIdioms`/partition iterate `idiomNames()`.
- `departmentToIdioms(dept)`: validate `dept ∈ DEPARTMENTS` (throw otherwise), then
  `idiomNames().filter(n => departmentOf(n) === dept)`.

Header comment records: derived-from-registry, the 5-department rationale, and the **proportion =
separate axis** decision (Design §2) so the seam is self-documenting.

### CREATE `baml_src/department.baml` (the typed contract)

```baml
enum Department { ROOF  WALL  OPENING  CHIMNEY  ROOM }   // mirror of DEPARTMENTS; pinned by conformance test

class CritiqueItem {
  department Department
  expected   string  @description("what the concept's style calls for here")
  present    string  @description("what the build currently has (empty if absent)")
  missing    string  @description("what is absent vs expected (empty if nothing missing)")
  severity   "minor" | "major"
}

class Critique {
  items CritiqueItem[]
}

function DiagnoseBuild(/* contract-stub params */) -> Critique {
  client ClaudeStub
  prompt #" ...minimal placeholder; S-164 authors the diagnostic prompt... "#
}
```
- Header: "TYPED CRITIQUE CONTRACT (S-163), NOT THE FROZEN JUDGE" + the proportion decision + a
  note that `DiagnoseBuild`'s prompt body/wiring is S-164's. Avoid TG5 banned tokens (`JudgeFacade`,
  `same object|drifted|different object`).
- `DiagnoseBuild` params: a minimal set sufficient to render (e.g. `concept_block: string,
  build_block: string`). Exact list is plumbing; kept small. The carrier exists only so
  `b.parse.DiagnoseBuild` is generated and `Critique` is parseable.

### MODIFY `src/baml/bridge.mts` (wire the carrier into FNS)

Add one entry to the `FNS` table:
```ts
DiagnoseBuild: {
  request: (a) => b.request.DiagnoseBuild(a.concept_block, a.build_block),
  parse:   (t) => b.parse.DiagnoseBuild(t),
},
```
No new `baml_client` import (already imported) → **TG3 stays green**. No transport, no spawn.

### CREATE `src/baml/fixtures/critique-contract/` (fixture data)

- `reply.txt` — a committed raw reply: a fenced/JSON `Critique` with 2–3 well-formed
  `CritiqueItem`s spanning ≥2 departments (e.g. a ROOF major + a WALL minor).
- `expected.json` — the `dropNulls`-normalized expected parse of `reply.txt`.
- `reply-bad-department.txt` — a reply whose item has an unknown `department` (enum violation →
  rejects).

(No render/golden fixture: the carrier prompt is a stub S-164 rewrites, so pinning its bytes now
would be a pin we immediately break. Render-pinning starts in S-164 when the prompt is real. This
is a deliberate, recorded omission — see Plan testing strategy.)

### CREATE `src/pack/departments.test.mjs` (the conformance tripwire + seam units)

Pure `.mjs` unit tests (no bridge spawn). Covers:
- **DPT1 partition is total & disjoint:** every `idiomNames()` entry maps (no throw); each idiom
  matches ≤1 *specific* predicate (the "serves two departments" tripwire); the union of
  `departmentToIdioms(d)` over `DEPARTMENTS` equals `idiomNames()` with no dupes.
- **DPT2 every department names ≥1 idiom:** `departmentToIdioms(d).length > 0` for all `d`.
- **DPT3 `.baml` enum mirrors `DEPARTMENTS`:** read `baml_src/department.baml`, extract the
  `enum Department { … }` values, assert the set equals `DEPARTMENTS` (the single-composition-point
  drift tripwire across the `.mjs`/`.baml` boundary).
- **DPT4 `departmentToIdioms` seam:** throws on unknown dept; returns sorted; spot-check a known
  membership (e.g. `roof.gable ∈ ROOF`, `plinth ∈ WALL`, `arch ∈ OPENING`).

### CREATE `src/baml/critique-contract.test.mjs` (`b.parse` fixture tests)

One `bamlBatch([...])` in `before()`; indexes `R[i]`. Mirrors the `fixtures.test.mjs` pattern.
- **CC1 accept:** `b.parse` over `reply.txt` `deepEqual`s `expected.json` (via `dropNulls`).
- **CC2 enum reject:** `b.parse` over `reply-bad-department.txt` → `R.ok === false`.
- **CC3 leniency pinned:** `b.parse` over prose → `{ items: [] }` (the all-array SAP coercion,
  documented per FX-D1 precedent so S-164's reply gate knows it must classify empty as malformed).

## Ordering of changes (why this order)

1. `src/pack/departments.mjs` — pure, no deps beyond the registry; unblocks its own test.
2. `src/pack/departments.test.mjs` (DPT1, DPT2, DPT4) — green before any BAML, proving the
   partition independent of codegen.
3. `baml_src/department.baml` — enables `baml:gen` to produce `b.parse.DiagnoseBuild`.
4. Add DPT3 to `departments.test.mjs` — ties `.baml` enum to `DEPARTMENTS` once the `.baml` exists.
5. `src/baml/bridge.mts` FNS entry — wires the carrier for parse.
6. fixtures under `src/baml/fixtures/critique-contract/`.
7. `src/baml/critique-contract.test.mjs` (CC1–CC3).
8. `npm test` (runs `baml:gen` first) + transport-guard green.

## Module boundaries / invariants

- **One vocabulary source:** `DEPARTMENTS` (`.mjs`) is authority; the registry partition and the
  `.baml` enum are both *pinned to it* by `departments.test.mjs`. Nothing hand-lists departments
  twice without a test catching drift.
- **Frozen instrument untouched:** no edit to any TG4 judge-path file; no judge-path file imports
  `departments.mjs`. transport-guard TG3/TG4/TG5 all stay green.
- **No behaviour:** `DiagnoseBuild` is never invoked by a runner in this story; the creation loop is
  unchanged. `WorkshopReply`/`CritiqueWorkshopRound` are untouched (S-164 replaces them).
- **No per-subject constants** anywhere in `departments.mjs` (keyed on idiom names only).
