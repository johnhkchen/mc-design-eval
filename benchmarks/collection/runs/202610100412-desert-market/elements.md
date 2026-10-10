# Desert adobe market hall — element map (front faces NORTH, x along the street)

Identity: a thick-walled sandstone-and-terracotta souk hall in a desert town; one cool shaded arcade of stalls under
striped cloth, a flat roof terrace with a dome and a wind-catcher. Palette: sandstone/cut sandstone 60% (walls, dome,
tower), orange terracotta 20% (stripe bands on piers, tile floor), dark oak + spruce 12% (vigas, lintels, posts,
fence), red-sandstone + quartz 8% (awning stripes). Footprint 17x13x9; walls 2 thick, chamfered ("rounded") corners.

| # | Element a viewer recognises | Real Minecraft thing |
|---|---|---|
| 1 | Striped cloth awnings over the two stall bays | red_sandstone_stairs / smooth_quartz_stairs in alternating columns, rising to the wall, on spruce fence posts, hanging lanterns under the lip |
| 2 | Protruding wooden vigas (beam ends) under the parapet, all four sides | dark_oak_log with axis through the wall, 1 proud, every 2nd cell (front, sides, back) |
| 3 | Flat roof with parapet | `roof()` style flat-parapet (sandstone parapet + slab coping) + spruce fence railing on the deck |
| 4 | Small dome with an orange band | `dome()` brush (hemisphere, sandstone stairs, red_sandstone/terracotta band) on a drum |
| 5 | Wind tower (malqaf) with vent slots and beam stubs | 3x3 sandstone shaft, dark vent slots (dark oak / bars), slab cap, dark_oak_log stubs |
| 6 | Rounded arcade/arch openings, grand arched entrance | `arch()` brush: segmental stall openings, round entrance arch with a dark timber frame |
| 7 | Clay pots | decorated_pot + potted cactus/dead bush/fern at pier bases, counters, deck |
| 8 | Woven baskets / market goods | barrels, hay bales, composters as baskets on counters and under the awnings |
| 9 | Terracotta stripe bands on the piers | orange_terracotta rows on corner and mid piers |
| 10 | Lanterns | `B.lantern` hanging under awnings and in the entrance arch; blade sign "BAZAAR" at the entrance (`B.sign`) |
| 11 | Deck shade cloth + crates and plants on the terrace | fence posts + striped slabs, barrels, azalea/potted plants |
