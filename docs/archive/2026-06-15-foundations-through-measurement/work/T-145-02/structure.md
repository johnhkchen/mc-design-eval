# T-145-02 Structure — file-level blueprint

The shape of the code, not the code. Ordering matters where noted. Everything additive; the contract is
"absent band ⇒ byte-identical legacy."

## 1. Schema — `schema/building-program.schema.json`

`masses[].facade.faces.items.properties`: **add** an optional `band`:

```jsonc
"band": {
  "description": "The storey band this face's frame/field relief occupies. Derived y-range is mass-relative (storeyHeight/eave), never a constant: ground = lowest storey, upper = storeys above the ground band, all = whole wall below the eave (excludes the gable). Absent ⇒ whole wall (legacy).",
  "enum": ["ground", "upper", "all"]
}
```

- Not added to `required` (optional). `additionalProperties:false` already present — the enum is the
  only new key. No `$defs` change needed.

## 2. Validation — `src/recognition/program.mjs`

- **`validateProgramAgainstPack` check 9** (per-face loop, ~L328): add one rule —
  `if (f.band === "upper" && m.storeys < 2) err(fw+".band", "band 'upper' needs an upper storey (storeys ≥ 2)")`.
  `"ground"`/`"all"` always valid; enum membership already enforced by the schema gate.
- **`assertFacadeDiegetic`**: no change (band is not a material role).
- Export a small pure helper **`bandYRange(m, band)`** → `{yLo, yHi}` (or `null` if no band), the single
  mapping from named band → mass-relative y-range using `m.storeyHeight` and `eaveY = m.storeys*sh`.
  Placed here (next to `facadeBounds`) so both the compiler and any test import one authority.
  - `ground → [0, sh-1]`, `upper → [sh, eaveY-1]`, `all → [0, eaveY-1]`.

## 3. Recognition prompt — `src/recognition/facade-grammar.mjs`

- **`facadeDigest`**: append a band clause to the articulation-bounds / instruction block (one or two
  lines): name the vocabulary (`ground`/`upper`/`all`), the "all = whole wall below the eave" gloss, and
  the cue that timber framing is the plaster `upper` storey while a full-height stone field is `all`.
  Keep it terse — the typed sub-schema (now carrying `band`) is the authoritative shape.
- No parser change: `band` flows through `mergeFacade` untouched; the schema + check 9 gate it.

## 4. Compiler threading — `src/recognition/compile.mjs`

- Import `bandYRange` from `./program.mjs`.
- **`facadeArticulationPlan`** (L380): for each face, compute `band = bandYRange(m, face.band)` once.
  When non-null, add `band: {yLo, yHi}` (pure data) to the params of:
  - `infill-panel` (member studs + field) — when `face.fields`,
  - `pilaster` — otherwise,
  - `quoin` — when `face.quoins`.
  `eave-overhang` (whole-mass soffit) and the per-`courseLines` belt courses stay positional (no band).
  Absent band ⇒ no `band` key ⇒ identical params bytes (AC#4).
- Plan stays pure data (`band` is `{yLo,yHi}`, no functions).

## 5. Brushes — `src/view/facade-articulation.mjs`

Each of `pilaster`, `infillPanel`, `quoin` gains an optional `band` param `{yLo, yHi}` (inclusive). A
shared local helper (module-private) builds the predicate:

```js
function bandZone(band) {            // band: {yLo,yHi} | undefined
  if (!band) return null;
  return { zoneOf: (pos) => (pos[1] >= band.yLo && pos[1] <= band.yHi ? "band" : null), zone: "band" };
}
```

- `pilaster`/`infillPanel`: if `band` given and no explicit `zoneOf`, derive `{zoneOf, zone}` from
  `bandZone(band)` and thread into `surfaceRelief` (and, for `infillPanel`, into the field-recolor loop).
  Explicit `zoneOf`/`zone` (test injection) still wins for back-compat.
- `quoin`: when `band` given, its inner `restrict` closure ANDs the band test (`pos[1]` in range) into
  the existing corner/parity/run logic — composes, does not replace.
- Reports gain a `band` echo (the `{yLo,yHi}` or null) for the per-brush report / debugging.

## 6. Fixtures

- **`src/recognition/fixtures/facade/prompt.txt`**: regenerate from the edited `facadeDigest` (production
  fn, never hand-edit). `expected.json` / `reply.txt` unchanged (fixture reply carries no band → still
  valid → offline byte-identical). The `facade-grammar.test.mjs` prompt-pin then passes.
- Optionally add a **band-bearing variant** to the *build* fixture coverage rather than mutating the
  recognition fixture — see tests below (keeps the recognition replay pin clean).

## 7. The stray hand-authored grammar — `benchmarks/sculpture/relief/barn-grammar.json`

Correct in place: `memberRole "frame.timber" → "wall.dressing"`, add `fields.role "wall.field.ground"`,
add `band: "all"` to both faces. Reference artifact only (off the compile path); fixed for repo hygiene.

## 8. Live records (producer, when shim+GL available)

`benchmarks/sculpture/facade-grammar.mjs --subject cottage --ticket T-145-02` and `--subject barn …`
write the live records (replies/prompt/render/record + the offline-replay base+reply+merged). These are
the AC#1 artifacts. `--offline` replays them byte-identically.

## 9. Render proof — `pr/assets/frames/`

`renderBesideConcept` (judge-free) over the articulated cottage (and barn when watertight) → committed
PNGs beside concept. No new module; reuse `benchmarks/sculpture/render-beside.mjs` (may need a small flag
to apply the articulation plan before rendering, if it renders the bare artifact today — confirm in plan).

## Tests (new / touched)

- `src/recognition/program.test.mjs`: `bandYRange` maps the three names correctly for cottage-like
  (2×4) and barn-like (3×3) masses; `band:"upper"` on a 1-storey mass fails check 9; band enum rejects
  garbage (schema).
- `src/recognition/compile.test.mjs` (or `facade-build.test.mjs`): a face with `band` produces a plan
  whose pilaster/infill/quoin params carry `{yLo,yHi}`; a face without band produces byte-identical
  legacy params (the byte-identity guard).
- `src/view/facade-articulation.test.mjs`: with `band:{yLo,yHi}` set, `pilaster`/`infillPanel`/`quoin`
  emit **no** placements outside `[yLo,yHi]`; without band, behavior is unchanged (existing tests).
- `src/recognition/facade-grammar.test.mjs`: the prompt-pin still holds after `prompt.txt` regen; add an
  assertion that the digest mentions the band vocabulary.

## Ordering

1. Schema (enum) → 2. `bandYRange` + check 9 → 3. compiler threading → 4. brush `band` support → 5. unit
tests (steps 2–4) green → 6. `facadeDigest` clause + regen fixture `prompt.txt` → 7. fix stray
barn-grammar.json → 8. (env-permitting) live records + render proof. Commit after each green step.

## Module boundaries / invariants preserved

- **One vocabulary authority** (`roleBlock`) — unchanged; band carries no roles.
- **Pure-data plan** — band is `{yLo,yHi}`; predicate built in the brush.
- **Additive** — every new field/param optional; absent ⇒ legacy bytes.
- **`bandYRange` is the single named-band→y-range mapping** — compiler and tests share it; no duplicate
  geometry math, no per-building constants.
