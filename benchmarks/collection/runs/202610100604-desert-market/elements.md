# Desert adobe market hall — element map (front faces NORTH, x along the street)

Identity: a thick-walled sandstone-and-terracotta souk hall in a desert town: a cool shaded arcade of two stalls and a
grand arched entrance under striped cloth, a flat roof terrace with a dome and a wind-catcher.
Palette (60/30/10): sandstone / cut / smooth sandstone (walls, dome, tower) 60%; orange terracotta (stripe band, dome
band, tile floor) 22%; dark oak + spruce (vigas, lintels, posts, rails) 10%; white / red-sandstone awning stripes 8%.
Footprint 17 x 13 x 9 (awnings z0-1, hall z2-11, vigas z12); walls 2 thick, notched ("rounded") corners.

| # | Element a viewer recognises | Real Minecraft thing |
|---|---|---|
| 1 | Striped cloth awnings over the two stalls | sloped run of red_sandstone_stairs / smooth_quartz_stairs in alternating columns rising to the wall, spruce fence posts, slab valance, lanterns under the lip |
| 2 | Protruding wooden vigas (beam ends), all four sides | dark_oak_log, axis through the wall, 1 proud, every 2nd cell in the deck course |
| 3 | Flat roof + parapet + coping | `mcd roof --preset desert` (flat sandstone deck, parapet, quartz coping); spruce_fence railing on the terrace edge |
| 4 | Small dome with an orange band | `dome()` brush (hemisphere, sandstone stairs) on the deck, orange band course, lightning-rod finial |
| 5 | Wind tower (malqaf) with vent slots and beam stubs | 3x3 sandstone shaft, dark spruce-trapdoor / dark-oak vent slots, slab cap, dark_oak_log stubs |
| 6 | Arched stall openings and grand entrance arch | `arch()` brush: segmental stall openings, round entrance arch in dark_oak frame; steps |
| 7 | Clay pots | decorated_pot + flower_pot variants at pier bases and counters, terracotta-coloured |
| 8 | Woven baskets / market goods | barrels, hay_block, composter, bamboo_mosaic lids as baskets on counters and under the awnings |
| 9 | Orange terracotta stripe band | orange_terracotta rows y2-3 on every pier / wall run |
| 10 | Lanterns + name sign | `B.lantern` hanging under awnings and in the arch on iron chains; `signboard` "SOUK" over the entrance |
| 11 | Roof-terrace shade cloth and plants | fence posts + striped slabs/carpets, barrels, azaleas |
