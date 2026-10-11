# Element map: modern minimalist beach house

Identity: a two-storey white-concrete beach house, two offset boxes stacked so the upper one cantilevers east and
south over open ground-level spaces; flat thin roof plate; glass to the sea; pale timber deck; sand, sea, dune.
Palette: white_concrete + smooth_quartz (60%) / glass + pale birch timber (30%) / black frames + aqua & coral accents (10%).
No concept image was supplied; the brief is the only source. Front is NORTH (-z), the sea is SOUTH (+z).

| # | Element a viewer recognises | Real Minecraft thing it must be |
|---|---|---|
| 1 | Thin flat cantilevered roof plate with deep eaves | `mcd roof --preset cafe` (flat cantilever deck, quartz fascia, soffit), never hand-placed roof blocks |
| 2 | Stacked, offset white boxes; upper volume cantilevered over the deck and the east undercroft | white_concrete volumes via code, slim `quartz_pillar` columns carrying the overhang |
| 3 | Floor-to-ceiling glazing to the ocean, black mullions | glass panes / glass blocks in a black_concrete frame (`glazing grid`), ribbon window on the street side |
| 4 | Timber sun deck with frameless glass balustrade and steps to the sand | birch plank deck, stairs down to the sand, glass pane railing |
| 5 | Vertical timber slat privacy screen + pivot front door + house number | oak/birch fences and trapdoors as slats, a real door, `B.sign` wall sign with the number |
| 6 | Sun loungers and a striped parasol on the deck | stairs + trapdoor loungers with white/cyan wool/carpet; fence pole + striped carpet canopy |
| 7 | Surfboards leaning on the wall | standing/wall banners with stripe patterns (white/coral/cyan), a real rack of fence |
| 8 | Plunge pool beside the deck | sealed water source cells in a quartz basin with slab coping |
| 9 | Palms and dune grass | jungle logs + jungle leaves palms, short grass / dead bush / azalea tufts on sand |
| 10 | Beach: sand, sea, driftwood rocks, fire pit | sand, water (sealed), boulders from `boulder()`, campfire ring in the undercroft |
