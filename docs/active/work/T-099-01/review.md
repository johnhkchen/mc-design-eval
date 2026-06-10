# T-099-01 opening-dressing — Review

Handoff summary. Suite: **1200/1200 green** (`npm test`). Three implementation commits on main;
no existing module was modified — the op composes the frozen E-25/T-097 contracts.

## What changed

### Created
- `src/view/opening-dressing.mjs` (pure core):
  - `treatmentsFromKit` — kit/v1 → treatment slots (rail→infill, `*_trapdoor`→shutter,
    `*_door`→door, lantern→light, cube-trim→frame); no rail entry ⇒ the infill is the shutter's
    **species fence** (`spruce_trapdoor`→`spruce_fence`), vocabulary-validated and recorded as a
    derivation (the kit honestly declared the cottage grille `unidentified`).
  - `extractApertures` — `openings()` on the REFERENCE build converted to world terms (cells,
    flanks, lintel/sill bands, perimeter ring, full-depth region) — the E-25 "measured on the raw
    pre-seal build" precedent.
  - `dressOpenings` — world-space application to the TARGET: per-cell pane = first occupied column
    cell (sealed panes are RE-OPENED by last-write-wins replacement; open holes fall back to the
    modal ring depth); shutters/lintel/sill/lantern are pane-relative; doors place lower/upper
    pairs (1 wide → leaf, 2 → hinge left/right, wider → centered + named reduction); idempotent;
    every non-applied slot carries `{slot, name, reduction}`. Returns placement-footprint `regions`
    for allow-list composition (D8).
  - `applyDressing` — pure append + manifest union.
  - `SHUTTER_FACING` ground truth: an open trapdoor's panel occupies the cell edge **opposite**
    `facing` (render-probed), so a flat-against-the-wall shutter uses the wall's own compass.
- `src/view/opening-dressing.test.mjs` — 17 tests: slot routing/derivation, hand-computed world
  geometry on ±z and ±x faces, sealed-pane re-opening, idempotency, no-jamb/blocked/too-short
  honesty, door pairs/hinges, the AC-#3 integration case (openings identity + `dressing.cells>0`,
  `openingRegions` identity, closure closed-with-dressing, strays empty under composed regions),
  AJV round-trip, and a CARD_ROWS state-vocabulary pin.
- `benchmarks/sculpture/dress-openings.mjs` + npm **`dress:cottage`** — the seven-rung ladder
  (treatments → apertures → determinism ×2 → AJV gate → integrity → acceptance → renders);
  `--offline` re-asserts the committed record + artifact sha.
- Committed results: `dress-openings/cottage.{json,md}` (`dress-openings/v1`),
  `cottage/artifact.json` (the dressed build, sha `316246890ce6…`, byte-stable across live runs),
  frames `pr/assets/frames/dress-cottage-{before,after}.png` (ortho −x face). PNGs gitignored.

### Modified
- `package.json` (`dress:cottage`), `.gitignore` (dress-openings stanza).

## Acceptance criteria

| AC | status |
|---|---|
| Deterministic op, pure, unit-tested on synthetic openings | **Done** — fence infill + flanking shutters (correct facings) + lintel/sill from the frame block, sized per opening |
| Conflict honesty | **Done** — named conflicts + reductions per slot; pinned in tests; 6 live conflicts all named |
| Integrity-compatible (S-091 allow-list, T-097 closure) | **Done** — unit integration case + live: openings 0→6 (all dressed), closure exactly invariant under the declared regions (2602→2602; 8 dressed cells), strays 0 composed |
| Cottage run: every window dressed, door framed, renders | **PARTIAL, honestly recorded** — 6/6 windows infilled, 9/12 shutter sides (3 `shutter-no-jamb`: the skin sealed those windows as floating panes at the bbox face — no wall to hang on); **no door-kind opening exists** in the cottage geometry (doorway is not a through-hole; `openings` is silhouette-based) → `door: none-detected` honesty row; door path proven synthetically. Before/after renders at gate angles + ortho faces committed |
| No subject constants; `npm test` green | **Done** — registry is data; orientation tables are geometry; 1200/1200 |

## Test coverage

- 17 new unit/integration tests (pure, offline). The runner ladder is the deterministic
  integration; renders are evidence only.
- Gaps: door facings other than east and hinge `right` are schema/world-accepted but not
  card-render-proven (cottage has no detected door, so no live exposure); `treatmentsFromKit`
  confidence tie-breaks beyond the cottage/gatehouse shapes are lightly covered; the lantern path
  has one synthetic test and no live exposure.

## Open concerns for a human reviewer

1. **The door AC gap is real and upstream.** No silhouette detector can see the cottage doorway
   (not a through-hole). S-101 needs either a recessed-door detector (depth-basin touching ground —
   the `wallFields`/`fillVoids` machinery is adjacent) or door declaration from the concept side.
   The op already handles door dressing when given a door aperture.
2. **Three +x windows are floating panes.** The durable skin sealed them at the bbox face with no
   surrounding wall (plan-only-closure family). Dressing honestly re-opens them with infill and
   drops the impossible shutters by name — but the underlying geometry defect belongs to the skin
   pipeline, not this op. Worth a look at `view-after-right.png`.
3. **The skinned cottage's closure baseline is 2602 reached** under the concept-declared regions —
   the durable skin never ran a closure stage. Dressing is provably non-worsening; closing that
   baseline is E-25-machinery work (plugClosure), deliberately out of scope here.
4. **Species-fence derivation is a policy choice** (AC-mandated fence vs the kit's honest
   `unidentified` grille). It is recorded as a derivation in the record and reversible the moment a
   kit ships a rail entry, which then wins the slot (tested).
5. **Sibling session**: T-098 (`placement-grammar.mjs` + grammar frames) was mid-flight; untouched
   and uncommitted by this ticket.
6. Trapdoor/fence/lantern render fine; stairs remain lens-invisible (inherited T-097 residual —
   no stairs are placed by this op, by design).

## How to re-verify

`npm test` (1200, includes all dressing tests offline) → `npm run dress:cottage -- --offline`
(exit 0 ⇔ committed record + sha + gates hold) → `npm run dress:cottage` (full live ladder +
renders; sha must reproduce `316246890ce6…`). Eyeball `dress-openings/cottage/view-after-left.png`
vs `view-before-left.png`.
