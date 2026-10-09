Detail-2 is only a slight improvement on input.nbt. The build was already heavily crafted, with only about 5% of cells plain, so the gains are small. `rules.txt` has 11 jobs. Every line was read and none errored, except the chimney texture rule on the front face, which wrote 0 cells. detail-2 wrote 115 cells; the first draft, detail-1, wrote 253.

- **Treatments kept:** `weather` and `vary` on the plinth, `courses 4/5 polished_deepslate` on the elevator-head tower and the west shaft wall, `lintels flat polished_deepslate` over the glass_pane windows, `coping slab` on the frieze and roof edge, and a 1-in-9 `mix` of cracked_deepslate_bricks on the wall fields, the tower and the chimney.
- **Dropped from detail-1:**
  - `frames` replaced the oak pilasters and the quartz portico with deepslate.
  - `cornice stepped` on all top rows left stray stairs sticking out, and `lintels hood` did the same on the portico.
  - `vary` on deepslate put pale off-palette blotches on the tower, so I switched to the cracked-deepslate `mix`.
- **detail-2 vs input:** the tower and the flank walls now read as banded and weathered, and the window heads are firmer. The front and the roof are essentially unchanged, and the render shows no regressions.
- **Limits:** the roof's stair-only surface accepted almost nothing, and the window sills, pilaster capitals and cornice already existed. Most of the remaining crafting is relief that the face maps can't write, such as the concept's recessed signage band, the banners and the planter boxes.

Files are in `detail-sonnet-high-lang-greedy-reroofed2/`: `rules.txt`, `detail-1.nbt`, `detail-2.nbt`, and the renders in `t0`, `t1` and `t2`.
