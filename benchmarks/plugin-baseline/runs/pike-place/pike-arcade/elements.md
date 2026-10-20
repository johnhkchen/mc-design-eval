# Required elements: Main Arcade + North Arcade (plot 0, east face = Pike Place)

All coordinates from plan.md (inclusive). "V:" = vocabulary helper in plan.md. 1.21.1 only: hanging chain is `chain` (not iron_chain; `$MCD blocks` knows only the newer name, ignore that one warning).

| # | element | construction, block by block | where | part | vocab |
|---|---|---|---|---|---|
| 1 | Green-painted arcade posts | `green_concrete` column y floor+1..floor+4, cap `dark_oak_stairs` upside-down both sides under head beam | A x33 z1+4k y20..24; B1 x40 z133+4k y21..26; S x40 z161+4k; D x41 z280+4k | 2 shell-north | post_bay |
| 2 | Head beam / fascia | `dark_oak_planks` run, `dark_oak_stairs` (top half) lip on street side | A x33 y25; B1 x40 y27; S x40..41 y floor+5; D x41 y29 | 2 | post_bay |
| 3 | Low shed roof (street arcade) | `dark-slate` palette shed falling east, dark_oak fascia, slab flashing at x33/34 | S x34..41 | 3 roofs | shed_roof |
| 4 | Market stalls with produce | top `dark_oak_slab` counter on `dark_oak_planks` base x37..39; crates = `barrel` (up) and `dark_oak_trapdoor` lids; melon, pumpkin, `hay_block`, `red_wool` apples-heaps, `potted_*` buckets as flowers (`flower_pot` w/ tulips, poppy, cornflower, allium), `flowering_azalea_leaves` bunches, `dried_kelp_block` for fish; each stall a different mix | S z161..279 floor+1; B1 x34..38 | 6 stalls | stall, produce_row |
| 5 | Canvas awnings | `red_wool`/`white_wool` alternating per cell at x41, one below fascia, y floor+4; `*_stairs` valance scallop optional | S x41; A x34 over head beam | 4 facades | awning |
| 6 | Hanging lamps | `chain` + `lantern hanging=true`, one per bay at x39 y floor+4 (under beam; chain from beam) | S/B1/A/D bays | 6 stalls | hang_lamp |
| 7 | Hand-painted wooden signs | `dark_oak_hanging_sign` on `dark_oak_fence` bracket at post, text via `signboard(..., mode:"hanging")` (FRESH PRODUCE, FLOWERS, FISH, HONEY, BAKERY, CRAFTS) | S x41 every 3rd bay y floor+3 | 4 facades | stall_sign |
| 8 | Upper market building, white brick | `quartz_bricks` walls, `smooth_quartz` pilasters x34 every 3rd pier, string course slab y34, cornice stairs upside-down y39/31 | C, B2, D | 1 shell-south / 4 | pier_bay, cornice |
| 9 | Multi-pane windows with glow | 4x3 `glass_pane` panes divided by `dark_oak_trapdoor` open muntin column in middle; sill `smooth_quartz_slab`(top)/lintel `smooth_quartz_stairs` upside-down; `ochre_froglight` one cell behind | per OPENINGS | 4 facades | window_bay |
| 10 | Shopfront doors + glazed panes behind arcade | x33 `dark_oak_door` pairs every 2nd bay; panes y23..25 | C, B2 east | 4 | shop_door |
| 11 | Down Under tiers over the bay | `stone_bricks` w/ cracked/mossy 1 in 10 near ground; `cobbled_deepslate` plinth; upside-down `stone_brick_stairs` string course y7,12,17; 3x2 windows w/ glow; arched doors | west faces | 1 / 4 | du_window, du_course |
| 12 | West terraces | `smooth_stone` deck y22/23, `stone_brick_wall` parapet y23/24 | T | 1 | terrace_edge |
| 13 | North Arcade open shed | posts x33 AND x29 wall; slate gable roof, dark oak verge, ridge `stone_brick_slab`; craft tables | A x28..34 z0..132 | 2,3,6 | post_bay, craft_table |
| 14 | Craft-stall tables | `dark_oak_trapdoor`/`spruce_slab` top on `dark_oak_fence` legs, rows of 2, with `flower_pot`, `candle`, `decorated_pot` wares | x30..32 y20 z2..130 | 6 | craft_table |
| 15 | PUBLIC MARKET CENTER neon sign | frame `white_concrete` rails y47 & y70, `iron_bars` lattice legs x38 z281,289,297,305 y43..47; board plane `white_concrete` x38 y48..69; letters via `plaque(face:"east")` in `red_stained_glass` at x39, `glowstone` behind at x38, back skin x37; red neon outline `redstone_lamp` lit=true behind a `red_stained_glass` border | x37..39 y43..70 z279..310 | 5 | neon_sign |
| 16 | Round clock (E + S faces) | `clock(g,{radius:3})`: `white_concrete` dial, `red_concrete` ring (neon: `red_stained_glass` over `glowstone` ring cells), `black_concrete` hands 10:10; "PUBLIC MARKET" banner letters (bannerWord) above dial, quartz surround | E x41 y35..41 z302..308; S z311 y35..41 x33..39 | 5 | market_clock |
| 17 | MEET THE PRODUCER board | `dark_oak_planks` board, `bannerWord` white on brown; frame `dark_oak_stairs` | x41 y42..45 z281..299 | 5 | producer_board |
| 18 | Pike Place Fish ice beds | `packed_ice` bed 1 high on `dark_oak_planks` trough x35..40 y24..25 z296..309; fish = `dried_kelp_block`, fish shapes in `red_wool`, `pink_wool`, `light_gray_wool`, `orange_wool` rows (never sand, gravel or powder); lobster `red_concrete`; `lantern` above, scale `iron_bars` rack | corner D | 5 | ice_bed |
| 19 | Corner entrance | open arcade storey: posts x34 & x41 at z311; `smooth_quartz` quoins paired 2-on/2-off x41 z280,311 | D | 2 / 4 | quoins |
| 20 | Dark brick chimney stacks | `bricks` 2x2, `stone_brick_slab` cap, 3 above ridge, passes through roof (keep) | (23..24,214..215),(23..24,254..255),(27..28,174..175) | 3 | stack |
| 21 | Flat parapet corner roof | `smooth_stone` deck y42, `smooth_quartz` parapet y43 + slab coping, stepped north gable `quartz_bricks` to y45 | D | 3 | parapet |
| 22 | Dusk lighting | `ochre_froglight` behind glass, hung lanterns each bay, `redstone_lamp` lit signs, `glowstone` neon; `lantern` on posts of A every 3rd bay | everywhere | 6 | hang_lamp |
| 23 | Street surface | `polished_andesite` arcade floor w/ `smooth_stone` edge; slab ramps at floor changes (z132/133, 188/189, 279/280) | S, B1, A | 2 | ramp |
| 24 | Planters and flower buckets | `barrel` w/ `potted_*`... buckets: `cauldron` + flowers above on posts; `flower_pot` rows | post bases | 6 | flower_bucket |
