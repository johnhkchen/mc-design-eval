detail-2 beats input, though the gain is modest. It has a stepped plinth with moss, polished lintels over every window, a returned eaves cornice, quartz portico caps and bases, and vertical-grain oak on the shaft piers. The roof is calmer than detail-1 (no coping rings).

- **Jobs:** `rules.txt` has 9 jobs, below the 8–14 you asked for in the middle but short of a full set. The treatments are plinth, vary/weather on the wall field and base, lintels, the entrance details, the stepped portico cornice, the eaves cornice, the shaft piers and joints, and roof tile variation with brick seams.
- **Lintels:** the `lintels` treatment wrote 0 cells because every window recess counts as "already detailed". I replaced it with a raw rule, `directly above glass -> polished_deepslate force`, which wrote 53 cells.
- **Cut:** whole-roof coping (178 cells) stacked rings along every roof step, so I dropped it. I also trimmed the side and back cornice columns so they stop short of the corners.
- **Still wrong:** the north cornice still returns past the front corners as small whiskers. The upper window sills were already oak and I left them alone. The banners, signs and lanterns the concept shows are not done.
- **Paint:** painted with `--face north,south,east,west,roof` rather than `north,west,roof` so the all-faces rules apply to every wall. 
- **Files:** `rules.txt`, `detail-1.nbt` and `detail-2.nbt` are in the run directory, with renders in `t0` (input), `t1` and `t2`.
