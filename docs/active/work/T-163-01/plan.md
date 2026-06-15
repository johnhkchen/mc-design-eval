# T-163-01 — Plan

Ordered, independently-verifiable steps. Each step ends green and commits atomically.

## Step 1 — `src/pack/departments.mjs` + pure unit tests (DPT1, DPT2, DPT4)

- Write `departments.mjs`: `DEPARTMENTS`, `SPECIFIC` predicates (ROOF/OPENING/CHIMNEY/ROOM),
  `departmentOf` (throws on >1 specific match), `departmentToIdioms` (throws on unknown dept,
  sorted), `departmentPartition`. Header records derivation + the proportion-axis decision.
- Write `departments.test.mjs` with DPT1 (total & disjoint over live `idiomNames()`), DPT2 (every
  dept ≥1 idiom), DPT4 (seam throws/sorted/spot-membership). **DPT3 deferred to Step 3** (needs the
  `.baml`).
- **Verify:** `node --test src/pack/departments.test.mjs` green. Manually confirm the 28-idiom
  partition matches Design §1 (counts 7/3/1/2/15).
- **Commit:** `feat(T-163-01): department partition derived from idiom-registry + conformance`.

## Step 2 — `baml_src/department.baml` (Department, CritiqueItem, Critique, DiagnoseBuild)

- Author the enum + classes + carrier function (stub prompt) per Structure. Header: contract-not-
  frozen-judge + proportion decision + "S-164 authors the prompt." Avoid TG5 banned tokens.
- **Verify:** `npm run baml:gen` succeeds; `baml_client/` regenerates with `DiagnoseBuild` in
  `parser.ts`/`async_request.ts` (grep). No `baml-cli` errors.
- **Commit:** `feat(T-163-01): typed Critique/CritiqueItem + Department enum (BAML contract)`.

## Step 3 — DPT3 (`.baml` enum ↔ `DEPARTMENTS` drift tripwire)

- Add DPT3 to `departments.test.mjs`: read `baml_src/department.baml`, regex the `enum Department
  { … }` body, assert the value set === `new Set(DEPARTMENTS)`.
- **Verify:** `node --test src/pack/departments.test.mjs` green; hand-edit a value locally to
  confirm DPT3 fails, then revert (sanity that the tripwire bites).
- **Commit:** `test(T-163-01): pin .baml Department enum to the .mjs composition point`.

## Step 4 — Bridge FNS entry + `b.parse` fixtures + contract test (CC1–CC3)

- Add the `DiagnoseBuild` entry to `bridge.mts` `FNS`.
- Create fixtures: `reply.txt` (2–3 well-formed items, ≥2 departments), `expected.json`
  (`dropNulls` of the parse), `reply-bad-department.txt` (unknown enum value).
- To MINT `expected.json` deterministically: run a one-off `bamlBatch([{fn:"DiagnoseBuild",
  mode:"parse", text:<reply.txt>}])`, capture `parsed`, `dropNulls` it, write to `expected.json`
  (do not hand-author the expected — derive it from the parser, like the repo's mint pattern).
- Write `critique-contract.test.mjs` (CC1 accept, CC2 enum reject, CC3 prose→`{items:[]}`).
- **Verify:** `node --test src/baml/critique-contract.test.mjs` green (after `npm run baml:gen`).
- **Commit:** `test(T-163-01): b.parse fixtures for the Critique contract (accept/reject/leniency)`.

## Step 5 — Full suite + guards green

- **Verify:** `npm test` green (runs `baml:gen` first). Specifically confirm:
  - transport-guard TG1–TG5 green (TG3 importer set unchanged; TG4 judge path clean; TG5 banned
    tokens absent from the new `.baml` — it's outside TG5's list but checked by convention).
  - `fixtures.test.mjs` still green (untouched).
  - `brush-door.conformance.test.mjs` still green (registry untouched).
- **Commit:** only if any incidental fix was needed; otherwise Step 4 is the last commit.

## Testing strategy (what each AC is proven by)

| AC | Proof |
|---|---|
| Department enum derived from registry + conformance (idiom→no-dept / dept→no-idiom drift) | DPT1 (total+disjoint), DPT2 (dept≥1 idiom), DPT3 (.baml↔.mjs) |
| `Critique`/`CritiqueItem` BAML + `b.parse` fixtures | `department.baml` + CC1/CC2/CC3 |
| `departmentToIdioms(dept)` seam, unit-tested, no per-subject constants | DPT4 + the partition round-trip in DPT1 |
| `npm test` green; transport-guard green | Step 5 |

**Deliberate non-tests (recorded):**
- **No render/golden pin** for `DiagnoseBuild` — the prompt is a stub S-164 rewrites; pinning its
  bytes now guarantees an immediate break. Render-pinning is S-164's, when the prompt is real.
- **No "prose rejects" test** on `Critique` — the all-array SAP leniency means prose coerces to
  `{items:[]}` (CC3 pins this instead). Rejection is proven on a typed enum violation (CC2).

## Risks & mitigations

- **`baml:gen` flakiness / version drift.** Mitigation: Step 2 verifies codegen in isolation before
  any dependent test; baml-cli 0.222.0 is pinned in `package.json`.
- **A future idiom mis-routes.** Mitigation: `WALL` fall-through gives every new idiom a default;
  DPT1's disjointness catches a genuinely ambiguous new idiom (matches two specific predicates).
- **Scope creep into judging.** Mitigation: `DiagnoseBuild` is never invoked; no runner/creation-
  loop edit; review.md flags the proportion decision for S-164 rather than implementing routing.
- **`expected.json` hand-author drift.** Mitigation: mint it from the parser (Step 4), never by
  hand — matches the repo's fixture-mint discipline.

## Done check (maps to ticket AC)

- [ ] `departments.mjs` derives `Department` from the registry; DPT1–DPT3 fail on drift.
- [ ] `department.baml` defines `Critique`/`CritiqueItem`/`Department`; CC1–CC3 green.
- [ ] `departmentToIdioms` seam unit-tested (DPT4), no per-subject constants.
- [ ] `npm test` + transport-guard green; frozen judge path gains no dependency.
- [ ] Proportion = separate-axis decision recorded (`.baml` + `.mjs` headers + review.md).
