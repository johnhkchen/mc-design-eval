# workshop — barn (T-126-01)

The workshop loop's committed record: every round's critique, action, conformance both sides,
and raw replies live in `barn.json`. Replay: `npm run workshop:replay` (byte-identical,
no model calls); offline re-assert: `npm run workshop:offline`.

- budget: 6 rounds (used 3)
- outcome: **done**
- final conformance: 7/7 checks, 0 findings
- tier: strong (op `workshop-critique`); instrument: +x+z, +x-z, -x-z, -x+z @ 512×512

| round | critique | action | gate (checks✓/findings) | verdict |
| --- | --- | --- | --- | --- |
| 1 | major: gable-end silhouette / roof-to-wall ratio — Roof is slightly too dominant: ridge:eave is 2.4 and roof share 0.5833, while the concept-derived targets are 2.1 and 0.5238 (ridge:eave is outside the 0.15 tolerance). Walls read a touch short under the steep gable.<br>minor: front (+z) wagon doors — Concept shows two prominent warm oak wagon doors; the low-res build views don't clearly show filled door leaves, but openings/spec are present so this is likely a render-resolution artifact, not a geometry gap.<br>minor: long-wall window detail — Window shutters/infill don't read at this render scale; not addressable by silhouette-level actions and not a proportion divergence. | `{"action":"adjust-params","elementId":"barn","massId":"barn","params":{"eaveHeight":12}}` | 7✓/0f → 7✓/0f | ACCEPTED |
| 2 | minor: overall footprint — Plan aspect is 2.0 vs concept's 1.846 (just past the 0.15 tolerance) — building reads slightly too elongated/narrow relative to the concept barn.<br>minor: gable end / openings — Block-level palette, dressing rhythm, roof color and pitch, and door/window placement all match the concept; no major divergence remains. | `{"action":"adjust-params","elementId":"barn","massId":"barn","params":{"depth":26}}` | 7✓/0f → 7✓/0f | ACCEPTED |
| 3 | minor: roof field — Concept roof reads as smooth dark planking; build shows the inherent gable stepping, but tone and dark_oak_planks material match well.<br>minor: +z wagon doors — Doors are present and oak-toned as in the concept; slightly less prominent than the concept's tall openings but within rhythm.<br>minor: gable end (+x) — Cobblestone triangle framed by stone-brick reads correctly against the concept; the small gable vent is faithful. | done | 7✓/0f → — | ACCEPTED |

Render evidence (gitignored, regen via the live runner): `workshop/barn/round-N/`;
before/after frames: `pr/assets/frames/workshop-barn-{before,after}.png`.
