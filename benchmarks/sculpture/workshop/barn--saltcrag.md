# workshop — barn (T-126-01)

The workshop loop's committed record: every round's critique, action, conformance both sides,
and raw replies live in `barn--saltcrag.json`. Replay: `npm run workshop:replay` (byte-identical,
no model calls); offline re-assert: `npm run workshop:offline`.

- budget: 6 rounds (used 4)
- outcome: **done**
- final conformance: 6/6 checks, 0 findings
- tier: strong (op `workshop-critique`); instrument: +x+z, +x-z, -x-z, -x+z @ 512×512

| round | critique | action | gate (checks✓/findings) | verdict |
| --- | --- | --- | --- | --- |
| 1 | major: long wall (+z) — Concept frames the wall into bays with smooth dressed-stone pilasters/quoins between cobble panels; my build is uniform cobblestone with no vertical articulation.<br>major: building corners — Concept shows light stone-brick quoins running up every corner; my walls turn the corner in plain cobblestone.<br>minor: door surrounds (+z) — Concept dresses each door head/jamb in smooth stone; mine reads only as a spruce-log lintel with no stone frame.<br>minor: overall massing & roof — Steep dark gable, eave height, plinth band and gable-end stone all match the concept closely — form is right. | `{"action":"spray-paint","dir":"+z","toBlock":"stone_bricks","fromBlock":"cobblestone","bounds":{"min":[23,1,23],"max":[24,8,23]}}` | 6✓/0f → 5✓/12f | rolled back (regressed: passed 6→5, findings 0→12) |
| 2 | major: long +z wall — Concept divides the wall into bays with vertical stone-brick pilasters/quoins framing speckled-cobble infill panels; my wall is undifferentiated cobblestone with no dressing rhythm.<br>minor: base course — Concept shows a stepped stone-brick plinth ~2 courses tall reading as a clear ashlar foot; my plinth is a single course and barely registers against the wall.<br>minor: gable-end corners (-x) — Concept frames the gable triangle with stone-brick corner quoins; my gable corners are plain cobble.<br>minor: doorways +z — Concept reads two clear spruce doors with stone-brick surrounds; my openings render as bare holes with little frame. | `{"action":"adjust-params","elementId":"hall-plinth","params":{"courses":2}}` | 6✓/0f → 6✓/0f | ACCEPTED |
| 3 | major: long-wall field (all four faces) — wall field is plain cobblestone; concept shows mossy, speckled cobble infill panels (wall.infill.cobble)<br>minor: long-wall framing — concept has stone-brick pilaster/quoin framing dividing the wall into bays; my wall is a flat field with no vertical framing rhythm<br>minor: long-wall openings — concept shows brown spruce door leaves in the openings; my openings read as bare holes (no door.main placed)<br>minor: roof + plinth — dark-oak gable roof, eave overhang, and 2-course stone-brick plinth all match the concept well | `{"action":"adjust-params","elementId":"hall-shell","params":{"wallBlock":"mossy_cobblestone","courses":[{"yRange":[0,2],"block":"mossy_cobblestone"}]}}` | 6✓/0f → 5✓/964f | rolled back (regressed: passed 6→5, findings 0→964) |
| 4 | minor: long walls (+z / -z) — concept divides the cobblestone field into bays with regular vertical stone-brick pilasters; my walls read as a uniform cobblestone field without the pilaster rhythm<br>minor: building corners — concept shows stacked stone-brick quoins at every corner; mine are plain cobblestone — but a single-corner paint would break the symmetry-held gate, and one action only paints one strip<br>minor: gable apex slit — concept's gable carries a tall narrow vent slit near the apex; mine reads as solid cobblestone in the gable triangle | done | 6✓/0f → — | ACCEPTED |

Render evidence (gitignored, regen via the live runner): `workshop/barn--saltcrag/round-N/`;
before/after frames: `pr/assets/frames/workshop-barn--saltcrag-{before,after}.png`.
