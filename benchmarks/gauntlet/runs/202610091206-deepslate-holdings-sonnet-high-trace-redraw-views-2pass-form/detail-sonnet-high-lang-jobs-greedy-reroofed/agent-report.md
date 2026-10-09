detail-2 is better than input on the glance. The gain is moderate, because most wall cells count as "already detailed" and texture treatments could only write about 40 of 223 cells.

- **Rules:** `rules.txt` has 12 jobs, and every rule wrote cells except one I dropped. The jobs are:
  - `vary` and `weather` on the north and west walls
  - a `gradient` for the rubble ground storey
  - a plinth on both faces (mossy `gradient`, `weather`, `plinth stone_bricks 2`)
  - `frames`, `lintels hood` and `sills` on the north and west windows
  - `cornice bracketed` on the eave
  - a stair belt on the north and `courses 7` on the west
  - `chiseled_deepslate` capitals and `polished_deepslate` bases on the oak piers
  - `coping slab` on the roof edge
  - `cornice deep` on the portico
  - `chiseled_quartz_block` capitals on the portico columns
- **Changed from jobs.md:** I added west sills, west pier caps and bases, and the portico column capitals.
- **Bug fixed:** in detail-1 the roof coping rule also covered the smooth_stone entrance steps, which sit on the roof map at z 0–2. That put a stray `deepslate_tile_slab` row in front of the steps. The coping is now limited to `roof rows 4-24`, and the strip is gone in detail-2.
- **Better in t2:** the windows have dark frames, oak sills and hoods, and the piers end in capitals and bases. The eave and portico have cornices, the plinth has a stepped foot, and the roof edge is capped.
- **Weak spots:**
  - The `force` flag changed nothing, so the cracked-brick `vary` and `weather` are subtle.
  - The portico's deep quartz cornice shows a few white patches on top.
  - The `courses 7` rule on the west wrote only 7 cells.
  - The west and north faces got most of the work, since east and south weren't in the `--face` list.

I dropped the base-slab rule for the portico columns (`quartz_slab`), which wrote 0.

Outputs are in `rules.txt`, `detail-1.nbt`, `detail-2.nbt`, `t1/` and `t2/`.
