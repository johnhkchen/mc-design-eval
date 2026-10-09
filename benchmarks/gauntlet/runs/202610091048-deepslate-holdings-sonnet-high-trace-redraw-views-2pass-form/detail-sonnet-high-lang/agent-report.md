Status: detail-2 is painted and rendered. I'm comparing it with the input before I report.

**Treatments in detail-2 (8 rules in `rules.txt`):**
- Texture: `weather` and `vary` on the deepslate bricks, stone bricks and mossy plinth.
- Roof: `vary` on the tiles and a polished-deepslate slab `coping` on the roof's outer edge.

**What detail-1 got wrong, and what I dropped:**
- detail-1 added hood lintels on every opening, a plinth on all faces and a stepped cornice on every top row. It read busier and worse than the input. The hoods hit the glass shaft and entrance, and the ragged projections spiked out at the eaves and ground.
- The input already has cornice, sills, quoins and pilasters. The lintel rules wrote 0 cells because the neighbours count as already detailed, so I removed them in detail-2.

**Does detail-2 beat input?** Only slightly. It adds a finished rim and light tile and brick variation on the roof, with no clutter. The wall changes are tiny: `weather` wrote 1 cell and `vary` wrote 4 on the deepslate. That wall field was already crafted, and the paint tool won't overwrite existing detail. The concept's extra relief (window frames, the chute brackets, the lanterns and planters at the entrance) is not reachable with these rules without `force`, which I didn't use. detail-2 is a safe, small gain, not a big one.

Files are in `detail-sonnet-high-lang/`: `detail-2.nbt`, `rules.txt`, and the renders `t0`, `t1`, `t2`.
