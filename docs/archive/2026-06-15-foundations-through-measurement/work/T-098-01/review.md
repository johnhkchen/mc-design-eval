# T-098-01 placement-grammar — Review

## What changed

**Created**
- `src/view/frame-lines.mjs` (~170 lines, pure) — structural frame-line read: `wallCells` (wall =
  side-exposed ∧ not-roof, the fill's own roof predicate), `cornerColumns` (convex corners of the
  wall-only footprint — roof-overhang columns can't masquerade as corners), `frameLines`
  (cornerPost > roofline > floorLine precedence; one crown rule yields eave beams on flat sides AND
  gable rakes under the slope; interior floor lines only), `fieldInstances` (bounded fields per
  elevation via the shared `airComponents`).
- `src/view/frame-lines.test.mjs` — 13 tests, two hand-counted synthetic huts (chimney-piercing,
  gable-rake), incl. precedence, chimney exclusion, field boundedness, fixture invisibility,
  degenerate inputs.
- `src/form/placement-grammar.mjs` (~230 lines, pure) — `bindKit` (specificity > confidence > block
  id; flagged-mismatch never binds; panel excludes the frame block), `bindOpenings` (door/window by
  block-id vocabulary; bindings only — T-099 applies), `placementGrammar` (frame paint with respect +
  line-continuity adoption + isolate skip; fields/courses realized by running `zoneFill` itself;
  `frameRefilled` is the survival proof; preconditions reported, runner-enforced).
- `src/form/placement-grammar.test.mjs` — 14 tests incl. end-to-end hand-counted hut (41 painted /
  7 respected / 20 filled / refilled 0), adoption case, broken-contract reporting, determinism,
  live AJV gate.
- `benchmarks/sculpture/placement-grammar.mjs` (impure runner) — committed-inputs only (durable-skin
  artifact+record, kit, zone-map bands), double-run byte-equality, gates (frameRefilled=0,
  preconditions, T-088 coverage re-gate, T-090 band evidence re-check), before/after sheets at the
  4 config azimuths, `--offline` re-assert, honest pipeline-failed record on THROW.
- Committed run records: `benchmarks/sculpture/placement-grammar/{cottage,gatehouse}.{json,md}` +
  `<subj>/artifact.json` + `pr/assets/frames/grammar-{cottage,gatehouse}-{before,after}.png`.

**Modified**
- `src/view/zone-fill.mjs` — `inRun` exported (keyword + doc line; zero behavior change) so the
  grammar respects the SAME keep rule the fill uses (one run definition, no refork).
- `package.json` — `grammar:cottage`, `grammar:gatehouse`.
- `.gitignore` — placement-grammar PNG stanza (records committed, run PNGs ignored).

**Untouched (by design):** `durable-skin.mjs`/`buildSkin`, all committed E-24/E-25 records,
challenge chain, multi-angle gate. The grammar composes downstream:
`durable-skin → placement-grammar → T-099 (openings)` — recorded in the runner header and records.

## Results

- Cottage: 321 frame cells (113 posts / 120 crown / 88 beams), 181 painted `spruce_planks` +
  11 adopted + 91 respected + 10 isolates skipped; frameRefilled **0**; coverage 67/67/84% (gate
  ≥50%); band evidence clean; reproducible; offline green.
- Gatehouse: same code path, registry data only — frame `cobblestone`, course `deepslate_bricks`;
  187 painted + 3 adopted; frameRefilled **0** (+2 pre-existing specks stripped, recorded
  separately); coverage 68/55%; offline green.

## Test coverage

27 new unit tests; suite 1156 → 1183, all green. The runner's own gates double as integration
tests (double-run proof, refill-proof, coverage/band re-gates, offline re-assert) — the gates
caught both real defects during bring-up (21 isolated specks from gap-painting; 2 pre-existing
specks miscounted as violations), which is the instrument working. Gaps: the runner itself has no
`.test.mjs` (impure wiring, per the seam invariant — same as every sibling runner); `fieldInstances`
per-face stats are recorded but not asserted against the concept's panel count (no ground truth yet).

## Open concerns for a human reviewer

1. **Kit trim vs map trim.** The committed cottage kit recognizes the framing as `spruce_planks`
   (whereUsed includes "trim"); the E-21 map's trim is `dark_oak_log`. The grammar follows the kit
   (the ticket binds KIT entries; E-26 thesis), so new frame cells are spruce while respected splat
   studs stay dark oak — mixed-material lines where both exist. If the kit's trim recognition is
   judged wrong, re-extract the kit (T-096 runner); the grammar needs no change.
2. **The AC's "stripped-log frame" phrasing** describes the concept; no `stripped_*_log` exists in
   any committed kit or map. Shipping the kit's recognition is the deliberate reading (no subject
   constants). Flagging in case the story intended a kit-extraction fix first.
3. **Visual delta is subtle at sheet scale.** 192 changed cells on the cottage read as texture
   refinement, not transformation — much of the rhythm was already splat-painted (91 respected +
   28 already). The record quantifies the structure; the oblique judge (multi-angle gate) was NOT
   re-run on the grammar output — roof form, its known gap, is unchanged by this ticket.
4. **Gatehouse door treatments bind to ∅** — its kit has no fixture/rail openings entry (the
   dark_oak_planks door leaf is a cube entry). T-099 will need either the kit re-extracted with the
   door as a fixture or a cube-treatment path. The binding records the gap honestly.
5. **Cottage openings: none detected** — the durable-skin artifact's apertures were sealed upstream
   (S-084), so `openings()` finds nothing. T-099's dress-openings path (already in flight as a
   sibling ticket; `dress:cottage` appeared in package.json mid-run) is the consumer of the binding
   seam; the cottage will exercise it only once openings exist post-seal.
6. **Roofline adjacency artifact:** a chimney passing the roof plane can earn a one-course frame
   ring where it meets the roof; on both real subjects this was absorbed by the respect rule
   (declared cobble runs), and the synthetic test pins the behavior — documented contract, not an
   accident.

## Verdict

All four acceptance criteria met (see progress.md for the per-AC mapping). Deterministic, gated,
generalized across both kit subjects with zero subject-specific code. Ready for review.
