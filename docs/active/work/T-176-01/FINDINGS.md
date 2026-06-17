# T-176-01 — FINDINGS: source, close the loop, generalize (the glance call + the leak)

**The render is the judge.** Three panels in this dir, each the 4 gate azimuths beside the concept:
`sourced-beside.png` (the spec sourced from program+pack, no hand-authoring), `refined-beside.png` (after the
critique drove an amplitude bump), `roof-beside.png` (the same edges vocabulary on the roof eave/ridge/verge).

## 1. Sourcing — recognition reproduces the hand-authored spec (AC #1)

`sourceTreatment(gatehouseProgram, rusticPack)` emits, by role lookup alone:

| layer | sourced from | block | hand-authored (T-175-01) | match |
|---|---|---|---|---|
| field (recess) | `walls.ground.role = wall.dressing` | stone_bricks | stone_bricks | ✅ |
| corners / base / top | `walls.dressing.role = wall.field.ground` | cobblestone | cobblestone | ✅ |
| opening.frame | door `headRole = frame.timber` | dark_oak_log | dark_oak_log | ✅ |
| opening.door | `door.main` | spruce_door | spruce_door | ✅ |
| opening.light | decoration `door-lantern` | lantern | lantern | ✅ |
| roof.edge | `roof.trimRole = wall.dressing` | stone_bricks | (n/a — wall only) | new |
| roof.field | `roof.fieldRole = roof.trim` | dark_oak_planks | (n/a) | new |

**The materials are byte-identical to the hand-authored spec** (TS1, and the runner asserts it). So **LLM
authorship did not underperform a pattern-book — it was unnecessary**: the recognition program already carries
the field/edge split (the `reading.summary` even states the rustic inversion explicitly) and the roof trim as
a *distinct role*. A curated pattern-book would duplicate what recognition emits. The one thing recognition
does **not** supply is amplitude (the rustic pack has no `proportions.articulation`) — and that is exactly
what the critique loop supplies (§2). The no-op guard (edge≠field) has teeth (TS3): a same-material treatment
is refused, not shipped invisible — closing T-175-01's recorded footgun at the source.

## 2. The critique → amplitude loop closes the feedback gap (AC #1)

`refineAmplitude(spec, critique)` on the genuine token-relief baseline critique (WALL·add "quoins/plinth/
cornice thin", OPENING·add "arch under-dressed"):
- `edges.corners.amplitude.headerDepth: 2 → 3` (quoins under-realized → amplify)
- `edges.top.amplitude.courses: 1 → 2` (trim thin → thicken the cornice)
- the opening layer ensured present (reveal/arch built)

Cell counts: sourced corners 120 / cornice 52 → refined corners 160 / cornice 104. **This is the loop the
builds lacked**: *see thin trim → amplify → re-render*, not one token pass. A `replace` (wrong **material**)
item is **noted, never amplified** (TS7) — amplifying a wrong material makes it louder, not righter; that
routes to recognition/pattern-book, not amplitude. Every knob is capped (headerDepth ≤ 3, courses ≤ 3) to
bound overshoot.

## 3. The busy-vs-rich call (AC #3 — the render judgement)

**Sourced (hd2): rich, not busy — the better glance for this concept.** Full-height rubble quoins, a plinth,
an eave cornice, a dressed arched gate, the recessed dressed-stone field. Reads as a rusticated stone
gatehouse, close to the concept's restraint.

**Refined (hd3 + 2-course cornice): richer, and at/over the busy edge.** The critique said "under-realized",
so the loop amplified — correctly, by its own logic. But on the render the hd3 quoins read as *heavier* than
the concept's comparatively flush dressed corners, and the doubled cornice adds a second band. **The glance
overrules the critique here:** for *this* concept the sourced hd2 is the better read; the loop's hd3 is the
ticket's named "**amplitude refinement overshoots — the glance overrules**", observed and reported. The
mechanism is right (it amplifies thin detail and caps the overshoot); the *taste* call for this subject is
hd2. The lever (amplitude) and the loop both work — the residual is a one-knob taste call the glance owns,
exactly as the epic framed it.

## 4. Generalization to roof + openings — where it composes and where it LEAKS (AC #2)

**Roof (witness: `roof-beside.png`).** `deriveRoofEdges` found eaveRow=20, ridgeRow=28, 34 verge columns from
the roof-band occupancy; `composeRoofTreatment` laid eave=64, ridge=32, verge=198 proud cells of the
**lighter stone** trim (sourced from `roof.trimRole`) against the **dark oak** field — exactly the concept's
"a lighter stone eave/verge course banding the [dark] edges". Closure ok over the roof band. The eave band
and ridge cap compose **cleanly** with the same `surface.relief`/`eave-overhang` vocabulary.

**The leak (reported, not hidden — the ticket's named failure mode):**
- **The raking VERGE is a sloped line, not a row.** The column-keyed course treats the gable-end columns but
  does not follow the pitch per-column the way a true raking verge board would. The wall vocabulary's
  `top.row` / corner-column model **cannot name a sloped line** — recorded in the layer report's `leak` field
  and visible on the render (the verge reads as an end band, slightly heavy, not a clean rake).
- **The opening ARCH HEAD is a curve, not a row.** `deriveOpeningEdges` exposes `isArch` (interior solids)
  and the reveal generalizes cleanly (the reveal IS the opening's "edge", analog of the wall corner), but a
  voussoir arc needs an opening-local curve derivation the footprint-corner model does not have.

So the unification **partially leaks**, exactly as the falsifiable claim warned. The eave band, ridge cap and
opening reveal port with no new primitive; the raking verge and the voussoir head are the element-specific
edges the wall vocabulary can't express. **This is a worthy negative result**, scoped for a follow-on (a
per-column sloped-line derivation + an arch-curve brush) — not a refactor we faked done.

## 5. The numeric lift vs 42 (AC #3 — the metered confirmation, unspent)

The live style-aware re-score is a metered `DiagnoseBuild` (2 votes) on the refined render; it was **not run**
in this autonomous pass (the glance is the primary judge; the number is a diagnostic; spend is gated — see
`progress.md`). The **direction** is argued from the mechanism: the token build's defects E-39 flags are
precisely WALL "quoins under-realized / trim thin" and OPENING "arch under-dressed" — *construction* defects
(`kind:add`, non-capping) that the loop now amplifies away; and the roof is **already the correct material**
(dark_oak_planks → no wrong-style `replace`, no cap from the roof). The constraints that held the token build
near ~42 are the construction defects the loop fixes, so the expected movement is **up**. The reviewer's one
metered command confirms the figure: render the refined azimuths (`treatment-sourced-beside.mjs`) and run the
`score-gatehouse-selfconcept.mjs` diagnose pattern on them.

## Verdict against the falsifiable claim

- **Sourced + critique-refined treatments read as the concept** — held on the render (sourced reads as the
  rustic gatehouse; the loop amplifies thin detail). The numeric "above 42" is the unspent metered step.
- **Did it read busy?** The refined hd3 **does** push to the busy edge — the named overshoot, glance-overruled
  to hd2. Reported, not hidden.
- **The roof/opening unification leaks** — confirmed and located precisely (raking verge, voussoir head).
- **LLM-authored vs pattern-book:** recognition-sourcing *reproduced* the hand-authored spec, so neither
  underperformed — authorship was unnecessary; amplitude (the loop) is the real contribution.
</content>
