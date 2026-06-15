# Design — T-141-01 rustic-headroom

Decisions, grounded in research.md. Three questions: (1) what `storeyHeight`/`storeys` envelope
admits the cottage wall-raise, (2) what pitch headroom unblocks the barn, (3) where the schema caps
land so the **pack row is the binding constraint**. Plus where the taste justification lives.

## Decision 1 — `storeyHeight: {min:3, max:5}` (raise max 4 → 5)

The cottage needs taller wall columns relative to the roof (residual `roofShare ≈0.45` vs target
`0.293`). The model's natural aim was a *taller storey*, not a *taller building* — refused by the
pack band `{3,4}`. Raise the pack max to **5**.

- **Why 5, not 6.** The schema `storeyHeight` cap is 6. If the pack max were 6 it would equal the
  schema cap and the two would co-bind — a refusal at the ceiling could be read as either. At
  **5 < 6** the pack band is *strictly* tighter, so any `storeyHeight 6` aim is refused **by the
  pack band, naming `[3, 5]`**, with the schema still admitting it. That is exactly AC2's
  requirement ("a refusal must name the pack row, not a hidden schema ceiling"). It also keeps the
  honest-refusal test meaningful: there is a value (6) the pack forbids while the schema allows it.
- **Vernacular justification.** A yeoman timber-framed hall runs a generous ground storey; a
  5-block wall column (a tall hall under a jettied upper floor) is period-plausible for the rustic
  material story (heavy hewn oak frame over local stone). Recorded in the pack provenance.
- **Effect on the lever.** `eaveHeight 10` → `factorEave` → `storeys 2 × storeyHeight 5` now passes
  the band (was refused). `storeyHeight 5` direct lands. `storeyHeight 6` still refused — by the pack.

## Decision 2 — `pitchClasses: [1, 2]` (add class 2)

The barn target `roofShare 0.5238 / ridgeToEave 2.1` demands a roof steeper than the 45° class-1.
Class 2 is the steep-door class the T-134 brush already realizes and the T-136 lever already
re-aims across (`roofIdiomForPitch`). Saltcrag already ships `[2,1,0.5]` — class 2 is proven
in-vocabulary and realizable. Adding it to rustic is a pure pack-data decision.

- **Order `[1, 2]` (not `[2,1]`).** Class 1 stays the default/first; the gate is set-membership
  (`includes`), order-independent for validation, but `[1,2]` reads as "the legacy class plus the
  new steep one" and keeps `pitchClasses[0]==1` for any code that treats the head as default.
- **Why not `0.5` too.** Saltcrag carries a shallow `0.5`; rustic has no shallow-roof demand on
  record, and the ticket scopes exactly "gains class 2". Adding `0.5` would be unjustified envelope
  widening (rejected — see below).
- **Vernacular justification.** Sawn-plank/shingle roofs pitched steeper than 45° shed rain and
  snow and are period-plausible for the steep-pitched timber vernacular; `roofingEconomy` already
  discusses the pitch class and is the home for this line.
- **Idiom rows untouched.** `roof.gable/hip/pyramid` carry `"pitch": 1` as a *default* param;
  validation reads `proportions.pitchClasses`, and the program/lever carry the actual class
  (`roofIdiomForPitch` swaps to `roof.gable.steep`). Saltcrag's idiom rows likewise don't list
  `pitch:2`. So no idiom row changes — minimal surface, consistent with the precedent.

## Decision 3 — schema caps **explicitly kept** (no `building-program.schema.json` edit)

AC2 lets the schema caps be "adjusted **or explicitly kept, with reasoning**". They are kept:

- **`storeyHeight` schema max 6** — already `> 5`. The pack band `{3,5}` is binding; raising or
  lowering the schema would either un-bind the pack or forbid a legal pack value. **Kept.**
- **`storeys` schema max 4** — the cottage wall-raise is a *storeyHeight* move (taller columns), not
  a *storey-count* move. A 5-floor cottage is not vernacular; the wall-raise reaches its target via
  `storeyHeight` (now to 5) and the already-legal `storeys ≤ 4` (e.g. `3 × 5 = 15`). Raising
  `storeys` would invite non-vernacular massing for no measured need. **Kept**, with reasoning.
- **`pitchClass` schema — no upper cap.** The pack `pitchClasses` array is already the sole binding
  constraint. **Kept.**

Net production change: **`packs/rustic.json` only** (data + provenance text). No `.schema.json`
edit. This keeps the pack the single binding surface and the diff small.

## Decision 4 — taste justification lands in `provenance` free-text

`provenance` is `additionalProperties:false`; no `proportionStory` key can be added (rejected
below). The two one-line justifications fold into existing fields:
- **`roofingEconomy`** — append the class-2 steep-pitch line (it already names the pitch class).
- **`wealthClass`** (or `setting`) — append the taller-storey-column line (it already discusses the
  build economy). Chosen: extend `wealthClass`, which speaks to what the yeoman spends on — a tall
  framed hall is a wealth/ambition statement.

Both are echoed verbatim in review.md (AC1 "echoed in review.md").

## Proof strategy (AC3) — at the lever, not the judge

Unit tests in `src/workshop/geometry.test.mjs` (the G3 family) + `src/recognition/program.test.mjs`:
- **Cottage wall-raise now round-trips**: `eaveHeight 10` → `storeys 2 × storeyHeight 5`, recompiles,
  shell height 10, realizes — the move the band `{3,4}` refused (new test).
- **Pack is the binding constraint**: `storeyHeight 6` throws naming **the pack band `[3, 5]`** while
  the schema (max 6) would admit it (new test) — proves AC2.
- **Class-2 pitch crosses the steep door (rustic)**: rewrite **G3c** — rustic `pitchClass 2` now
  lands, re-aiming the idiom to `roof.gable.steep` and realizing (the headroom win).
- **Honest refusal for what the pack still forbids**: update **G3** — rustic `pitchClass 3` still
  refused, message now `[1, 2]`. Update **program.test.mjs:110** — off-vocabulary value is now `3`.
- **Saltcrag unchanged**: G3b/G3d untouched (regression guard that the precedent still holds).

No judge runs, no chain re-runs, no pin rotations — only pure unit tests over the levers/gates.

## Rejected alternatives

1. **Add a `proportionStory` field to `provenance`** (style-pack schema). Cleaner home for the taste
   record, but it touches a *second* schema file, and `provenance` is `additionalProperties:false`
   by design (the material story is a closed vocabulary). Folding into existing free-text honors the
   schema and keeps saltcrag byte-identical. **Rejected** — out of proportion to a one-line note.
2. **Raise `storeyHeight` pack max to 6 (= schema).** Un-binds the pack: a `storeyHeight 6` refusal
   could be read as the schema ceiling, defeating AC2; and removes the only value that proves the
   pack is strictly binding. **Rejected.**
3. **Raise the `storeys` schema cap to admit a taller cottage.** The wall-raise is a column-height
   move; raising the floor count invites non-vernacular massing and a hidden second knob. Not
   needed — `storeyHeight 5 × storeys ≤ 4` reaches the target. **Rejected** (kept, documented).
4. **Add `0.5` to rustic `pitchClasses`.** No shallow-roof demand on record; unjustified envelope
   widening; the ticket scopes "gains class 2" exactly. **Rejected.**
5. **Edit the rustic idiom rows to declare `pitch:2`.** Redundant — validation reads
   `pitchClasses`, the lever re-aims the idiom, saltcrag sets the no-edit precedent. **Rejected.**
6. **Touch saltcrag (it already carries class 2 + same band).** Out of scope, ratified, would
   re-open a settled taste decision. **Rejected.**

## Risks
- A hidden rustic-loading test asserting a refusal at `pitchClass 2`/`storeyHeight 5` would break;
  research grep found only the three named (G3, G3c, program:110) + the stale compile comment. The
  full `npm test` run in Implement is the backstop.
- The cottage may still FAIL its proportion target after the unblock — **expected and out of scope**.
  AC3 proves the *aim round-trips*, not that the ratio closes; T-143 owns the re-verdict.
