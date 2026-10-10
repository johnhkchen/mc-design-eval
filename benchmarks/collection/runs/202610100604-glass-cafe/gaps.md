# Toolkit gaps hit
- Neon sign letters: wanted glowing block-font letters (a 3-row font) on a 4-wide panel; `plaque` only fell back to banner letters (2-row board) because the 5-row block font needs 15+ wide x 7+ tall; closest tool `plaque style banner`. I hand-placed a shroomlight underline.
- Ceiling lights that are not lanterns: `sea_lantern` is flagged "UNSUPPORTED: nothing below to hang from" by `mcd check` (regex matches `lantern`); used ochre_froglight by hand instead.
- Planters/beds: `planter` brush needs a wall + face; I hand-wrote moss+trapdoor-rim beds for freestanding terrace planters.
- Terrace tables/chairs/umbrellas: no prop brush for furniture sets (fence+plate+stairs); placed by hand in a local helper.
- Glass screens (panes with connection states) and railing along a plinth edge: no railing brush for open terraces; hand-set glass_pane connections and wall posts.
- Entrance steps with the plinth: no `steps` brush to cut a stair run through a plinth ring; hand-placed stairs and carved the deck.
- Roof: `cafe` preset gave a 2-course lid and a mottled light/dark mix; dark charcoal needed a custom mix (ROOF_BLACK_LID / SINGLE_MATERIAL fought each other). A `modern-dark` palette and a one-course fascia option are missing. Overhang+fascia widened the footprint by one block on E and S past the stated overhang (grid grew to 18x8x14 until I shrank the body).
- Interior: no counter / bar brush; no curtain-wall brush (steel posts on a rhythm + glass + header beam) - I placed posts and glass rows by hand.
- Chain pendants hung under a 3-tall ceiling: no fixture mount for ceiling pendants (`fixture ... hang` exists but is for facades).
