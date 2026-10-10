detail-2 beats input. It paints clean and `mcd paint` reports "function intact". `rules.txt` has 40 jobs, and `detail-2.nbt` is saved beside `input.nbt`.

- **Treatments:** `plinth`, `weather`, `gradient`, `vary`, `cornice` (eave and string course), `lintels` (hoods and arch heads), `sills`, `frames`, `attach` (lanterns), `louvres` (side shutters), `finial` and `coping` (roof edge). Raw rules cover the signs, plaque, cross, banners, steps and planters.
- **Gained:**
  - Gold Latin cross and a polished-andesite raking edge on the pediment.
  - INSPECTORATE plaque with chiselled end bosses.
  - PERMIT OFFICE fascia with light-blue end caps and a gold lettering band. The fascia is only 2 rows by 8 columns, so it is a band, not readable text.
  - Oak pier capitals and slim mossy pilasters with gold caps.
  - Window hoods, sills and flower boxes, plus shutters on the right-most window.
  - Lanterns, teal corner banners, copper rods, a flagstone apron, planters and a filing cabinet.
  - Dark-oak colonnade posts on the west side, a chimney with a copper cap, and mossy pinnacles with stone caps in place of the campfires.
- **Fixed after the first paint:** the first cross was an oversized blob, so I shortened it. The chimney floated until I added `force`. I replaced the `iron_chain` block with `chain`. The shutter `louvres` wrote 0 cells because those cells are planks, so I used alternating trapdoor and plank rows.
- **Left out or weak:** the double-door gold handles (door cells are protected, so I dropped that line), interiors behind the glass (only barrel counters at the glass base), and the south and east faces (not in the `--face` list). The banners are flat concrete panels, and the cyan and gold blocks look heavy.
