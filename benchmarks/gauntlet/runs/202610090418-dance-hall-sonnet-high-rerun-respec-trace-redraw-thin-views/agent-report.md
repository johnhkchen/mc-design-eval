I built the Art Deco dance hall in two rounds and prefer round 2. Both are 28×28×33, with the front facing north. I judged by eye from the renders and did not run `mcd check`.

- **Built:**
  - **Method:** `build.mjs` reads `trace.txt`, `depth.txt` and `side-trace.txt` and maps every traced cell to the spec's block ids.
  - **Front:** relief comes from the depth map, with the lapis fins pushed to `z=4` because the side trace puts nothing further forward above the marquee. Doors are recessed in the entrance. The tower runs up to y27.
  - **Marquee:** a 4-deep stepped-pyramid canopy at `z=0–3`, with a glowstone lip.
  - **Body and roof:** a solid body with a stepped roof and rear tiers. The central block has a white and black-slit clerestory under a lapis cornice at y18.
- **Round 1:** the front silhouette, marquee, fins and tower already matched `trace.png`. Mismatches: the side wall was ragged noise, because cell-by-cell classification of the side trace turned every shadow into relief. The wing white panels also rendered grey because they sat 1–2 blocks deep.
- **Round 2 fixes:**
  - **Side wall:** now designed bays, as in the concept's 3/4 view. Piers stand proud, the white panels have one-wide stained-glass slits, a cornice ledge runs the length, and there are recessed dark-oak side doors with a glass strip above.
  - **Wing panels:** the white ones are now flush; slits stay recessed.
- **Remaining gaps (both rounds):** the wing whites still read slightly grey next to the concept, the shoulder diagonals are blocky, and the tower and roof-tier detail is simplified.

Files are in the run directory:
- `build.mjs` (`node build.mjs 1|2`)
- `round-1.nbt`, `round-2.nbt`
- `r1-tiles/`, `r2-tiles/`
