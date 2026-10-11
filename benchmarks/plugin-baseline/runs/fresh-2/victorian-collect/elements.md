# Element map: Victorian painted-lady townhouse

Identity: a San Francisco "Postcard Row" painted lady. Three storeys on a raised stone plinth, a polychrome facade
(soft blue body, cream trim, pink + gold accents), a round corner turret with a conical cap, a canted bay, a gabled
entry porch and a slate mansard with dormers. Palette: blue body 60% / cream trim 30% / pink + gold shingle, slate roof,
verdigris turret cap 10%.

| # | Element a viewer recognises | The real Minecraft thing it must be |
|---|---|---|
| 1 | Corner turret with conical cap | `cylinder()` round tower up the NW corner, windows in rings, `roof --preset tower-cap` cone (copper) with a finial, lightning-rod + pennant banner on top |
| 2 | Canted (angled) bay window, two storeys | stepped chamfer massing: 3-wide front + 1-wide splays, glass panes in white frames, small gablet roof via `gableRoof()` |
| 3 | Mansard roof with dormers and iron crest | `mcd roof --preset townhouse` (dark-slate mansard, dentil cornice, iron-bar crest, dormers), chimneys with campfire smoke |
| 4 | Gabled entry porch, turned posts, spindles | `gableRoof()` porch roof on `birch`/quartz fence + wall posts, stair-and-slab brackets, fence balustrade, stair steps up to the door |
| 5 | Front door with sidelights + transom, house number plaque | `oak_door` (spruce) + glass panes (`glazing sidelights transom`), `surround classical`, wall sign with the house number text |
| 6 | Fish-scale shingle band + decorative gable (sunburst) | alternating cherry/bamboo stairs and slabs in a staggered scale pattern; sunburst from stairs facing a centre in the gable |
| 7 | Trim: corner boards, belt courses, window surrounds, brackets under the eave | `pilaster`/quartz pillar corner boards, quartz slabs as belt courses, `surround` brushes, upside-down stair `brackets` |
| 8 | Front garden: iron/picket fence, flower beds, gas lamp | white fence + gate, `planter ground` flowers (tulips, peonies, azalea), lantern on a post (`fixtures`), flower pots, hanging lanterns on chains from the porch |
| 9 | Stone plinth + steps | stone brick plinth, stair steps with side walls, path of gravel/stone brick slabs |
| 10 | Window boxes + shutters | `planters` (flower boxes under windows), open spruce trapdoors as shutters |
