# T-170-01 Design — emit-typed-kind-from-layer-a

The work is narrow: one additive enum field, one prompt line, a deliberate golden re-pin, and
fixture updates. The blueprint (`docs/active/work/T-168-01/schema-feedback.md`) already prescribes
the schema delta. The design decisions are about *how* to realize it without scope creep or
collateral fixture breakage.

## Decision 1 — field shape: `kind "add" | "replace" | "remove"` (a string union, required)

**Chosen.** Matches the blueprint diff exactly and the existing element-vocabulary comments
(missing→add, present-but-wrong→replace, absent→remove). `itemStyleClass` already switches on these
three literal values, so the producer and consumer are wired by construction.

Rejected alternatives:
- **`boolean wrongStyle`** — the blueprint considered and rejected it: it cannot express the
  `remove` case (an extra element that should not be there), and it does not align with the
  add/replace/remove vocabulary the codebase already names. A boolean would also need a second
  mapping layer in `itemStyleClass`.
- **A new `enum Kind`** — rejected. The repo's idiom-string discipline (departments are an enum
  because they mirror `departments.mjs`; idioms are free strings to avoid a "second mirrored enum =
  drift bait"). But `kind` is a *closed 3-value* set with no external mirror, and BAML inline string
  unions are the established pattern here (`severity "minor" | "major"`). An inline union keeps it
  local and needs no second source. So: inline union, matching `severity`.

**Required vs optional.** The blueprint diff writes it required (no `?`). Required is correct: the
judge sees every item it emits and can always classify it; an optional `kind` would invite the
fallback-to-structural path to silently re-open the F1 over-cap. The structural fallback in
`itemStyleClass` remains for *legacy/untagged* critiques (records minted before this ticket), which
is the right back-compat boundary — old committed critiques have no `kind` and keep the old read.

## Decision 2 — field POSITION: between `missing` and `severity`

**Chosen** (the blueprint diff's position). The `{{ ctx.output_format }}` schema dump follows field
declaration order, so `kind` renders after `missing`, before `severity`. This keeps the diagnostic
triple (expected/present/missing) contiguous and reads naturally: *what's expected, what's present,
what's missing, what kind of fix, how severe.* Position is observable (it changes the golden), so it
is a real decision, not cosmetic.

## Decision 3 — the prompt tagging line: one sentence, after the expected/present/missing instruction

**Chosen.** The blueprint prescribes the wording. Place it immediately after the existing
"...what is absent versus expected (missing, empty if nothing missing)." sentence and before the
department-tagging sentence, so the per-item field instructions stay together. Wording (from the
blueprint, lightly fitted to the surrounding prose):

> *"Also tag each item with its `kind`: `add` if the element is absent (present is empty),
> `replace` if something is present but in the WRONG style/material, `remove` if an element is
> present that the style does not want."*

This teaches the judge the same emptiness→kind mapping the structural rule used, but lets the judge
override it on the F1 case (right base material + missing detail → `add`, where the structural rule
saw `replace`). One line, no restructure of the prompt.

## Decision 4 — fixture `kind` assignments (the canonical replies)

The committed replies are author-chosen canonical specimens. I assign `kind` faithfully to each
item's meaning, and deliberately make one item the **BO11 shape** (right base material, missing
detail) tagged `add` so the fixture demonstrates the discriminator's whole point.

`diagnose/` (barn grounding):
- **ROOF**: present `"shallow spruce_planks gable"`, missing `"dark_oak_planks field + steeper
  pitch"` → the covering MATERIAL is wrong (spruce present where dark_oak expected) → **`replace`**.
- **WALL**: present `"flat cobblestone walls with no dressed framing"`, missing `"stone_bricks
  quoins, piers and plinth band"` → cobblestone IS the right field material; the dressing is an
  absent ADDITION → **`add`**. *This is the BO11 case* — structurally indistinguishable from
  replace, correctly tagged `add` by the judge.
- **OPENING**: present `"two plain rectangular holes"`, missing `"oak_planks wagon-door leaves +
  stone_bricks heads"` → the holes exist but the leaves/heads are absent → **`add`**.

`critique-contract/`:
- **ROOF**: plank gable vs thatched gable → wrong covering material → **`replace`**.
- **WALL**: bare cobblestone, missing limewash coat + plinth band → an absent surface treatment →
  **`add`**.
- **OPENING**: square hole, missing arch head + frame dressing → absent additions → **`add`**.

Rationale for the mix: a single fixture proves the judge can emit all-`add` AND a `replace` in the
same critique — i.e. it *separates* the two classes within one reply, which is exactly the claim
under test. Tagging WALL `add` (not `replace`) is the AC's required assertion.

## Decision 5 — golden regeneration: render through the bridge, not hand-edit

**Chosen.** Hand-editing `prompt.golden.txt` to guess the new schema dump is brittle (BAML's
`ctx.output_format` formatting is not trivially predictable — comment wrapping, union rendering).
Instead: after editing the `.baml` and running `npm run baml:gen`, render `DiagnoseBuild` with
`diagnose/inputs.json` through `bamlRender` and write stdout to `prompt.golden.txt`. This makes the
golden the *actual* render output by construction, so FX-DB1 passes for the right reason. A one-off
node invocation (or a throwaway script) drives it; nothing permanent is added to `scripts/`.

Rejected: extending `mint-baml-fixture.mjs` to cover diagnose. That script does a LIVE spend
(`requestText`) to mint `reply.txt`/`expected.json`; the golden is a pure render and needs no spend,
and the reply/expected are author-chosen here (not live-minted), so reusing the mint path would
conflate the deliberate fixture authorship with a live capture. Out of scope.

## Decision 6 — what NOT to touch

- `itemStyleClass` / `styleFidelityScore` — already read `kind` (AC bullet 3). No edit.
- `diagnose.mjs` serializer — `kind` is judged, not serialized. No edit.
- Recognition / critique / route / vernacular goldens — owned by other tickets. No edit.
- BO8/BO11 in `bakeoff-score.test.mjs` — already assert the target behaviour. Keep green, no edit.
- The frozen instrument and `transport-guard.test.mjs` — untouched (verify the guard still passes,
  since `department.baml` changed).

## Failure modes carried from Research

If `b.parse` cannot carry a required union (CC2 empties differently, or FX-DB2's vacuity guard trips
on a `kind`-bearing item), that is a real signal the SAP behaviour changed — report it in review,
do not loosen the field to optional to make a red test green. The honest fallback, if required
proves unworkable, is documented (optional + structural fallback), but required is the target.
