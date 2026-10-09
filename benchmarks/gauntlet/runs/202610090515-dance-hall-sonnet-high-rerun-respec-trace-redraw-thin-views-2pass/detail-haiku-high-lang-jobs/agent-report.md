detail-2 beats input on the west flank and the tower top, but the front reads almost the same at tile size. `rules.txt` (12 rules), `detail-2.nbt` and `t2/` are in the run dir.

- **Treatments:** weather on the base; `keep` on the black and lantern cells; vary and pilasters on the outer piers; frames and hood lintels on the entrance openings; plinth; stepped cornice on the wing crowns; coping on the tower top and roof step edges; sills and flat lintels on the west glazing; courses under the west stair course.
- **Better:** the west windows now read framed and shadowed in the 3/4 view, the roof step edges are capped, and the tower has a cap.
- **Regressions:** the three entrance lanterns on row 3 are overwritten by the hood. `keep` did not protect them, and I did not find out why. Job 2 also replaces the blue wing caps with a sandstone lip, which is what the job asked for but drops the spec's blue caps.
- **Not done:** the east face is not painted, because `--face north,west,roof` excludes it. Job 1's mirror needs a separate east run.
- **Side effect:** the spire coping adds one block of height (30 → 31). That is a silhouette change in a pass that was meant to leave massing alone.
- **Substitution:** I wrote `sandstone_stairs` directly where the jobs said `cut_sandstone_stairs`, since the tool substitutes it anyway.
