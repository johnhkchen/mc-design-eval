# elements.md — REQUIRED ELEMENTS (plot-local coordinates, as plan.md)

Part keys: P1 nanshan-shell, P2 nanshan-crown, P3 breeze-podium, P4 sky-shell, P5 sky-crown, P6 lights-and-grounds.
Vocab names are the helpers in plan.md VOCABULARY.

## Nan Shan Plaza (plot 0)
- [x] Sheer tower shaft y19..352, 64x64 at x166..229 z12..75 — shaft shell is gray_stained_glass on the plane 1 back
  (x167/x228/z13/z74), no solid fill inside (floor slab y352 only); P1; `finFace`.
- [x] Vertical pale fins every 2nd cell on the outer plane, y19..352: `smooth_quartz` column per fin, glass between;
  every 4th floor band (y 19+28k .. +6) black_stained_glass; P1; `finFace`, `floorLine`.
- [x] Floor lines every 7 (y19,26..345): light_gray_concrete flush in glass plane; P1; `floorLine`.
- [x] Four chamfered corners: triangle dx+dz<6 removed; sawtooth fin+glass step per cell; P1; `chamferCorner`.
- [x] Centre reveal slot 6 wide x3 deep, full height, on all four faces (N/S x195..200; E/W z41..46): back wall
  light_gray_stained_glass, orange_terracotta spandrel at each floor line, side walls smooth_quartz; P1; `revealSlot`.
- [x] Glass lobby base y4..18 (T-L x156..239 z6..77, +x240..245 z24..59): glass between quartz_pillar piers every 6 one
  proud, lit inside (sea_lantern ceiling grid); roof terrace y18 with glass_pane rail, planters; P1/P6; `lobbyGlass`, `planter`, `deckLight`.
- [x] Entrances: S main z77 x190..205 (4 revolving-style glass door bays, doors both halves, quartz frame), N z6, E x245 z38..45; P1; `doorBay`.
- [x] Porte-cochère canopies T-N/T-S (x168..185, x210..221; z0..5 / z78..83): 4 round quartz_pillar piers each, quartz slab canopy y11..12, hanging-from-block lanterns under; P6; `canopyPier`.
- [x] Wheat-ear crown y353..381: fins continue, peak toward the reveal (top = 381 − dist/2, min 366), quartz to y365 then quartz_pillar, end_rod caps; open, no glass; P2; `crownFin`.
- [ ] Crown lit white-gold: pearlescent_froglight one cell inside each fin in roof slab y352, ochre_froglight every 3rd fin base y353; P2; `crownGlow`.
- [x] Roof slab y352 gray_concrete + plant box x180..215 z26..61 y353..364 (hidden inside crown); P2.
- [x] Four red aircraft lights (195,382,12) (200,382,12) (195,382,75) (200,382,75): lit redstone_lamp, red_stained_glass on 4 sides + top; P2; `aircraftLight`.
- [x] Scattered lit windows (1 in 4-5 bays warm, 1 in 6 cool, set 1 behind glass), S and E faces densest; P6; `litWindows`.
- [ ] Breeze podium P-A y3..18: plinth y3 polished_andesite; shop storey y4..8 glass set back 2 behind quartz_pillar colonnade every 6; fascia y8 smooth_quartz with shop-name plaques every 12 (S, W, N faces); P3; `shopFront`, `plaqueFascia`.
- [x] Gold perforated screen on P-A y9..18 and P-B y19..32 (lattice offset 2): yellow_terracotta field, open birch_trapdoor diamond lattice, gold_block studs at nodes every 4, glass behind with 1-in-4 lit bays; P3; `goldScreen`.
- [x] P-C top dark-glass box y33..45: black_stained_glass, gray_concrete mullions every 3, smooth_stone bands y37,y41, coping y45..46; 1 in 5 bays warm; P3; `darkGlassBox`.
- [x] Cantilevers: P-B north (z12..15, y19 quartz soffit + sea_lantern downlights every 4); P-C south (z72..79, y33); P3; `soffit`.
- [x] Roof terraces (P-A W x0..5 & S z72..83 y19; P-B E x84..101 & N z12..23 y33): smooth_stone deck, glass_pane rail, planters, sea_lantern flush every 6; café pergola x88..99 z14..21 y34..37; P3/P6; `terraceDeck`, `planter`, `pergola`.
- [x] P-C top deck y46 with coping, mechanical box x30..49 z40..59 y46..50 gray_concrete, lights every 6; P3.
- [x] South kiosk P-K x18..29 z84..89 y3..10 glass box, slab roof y10, lit; P3; `kiosk`.
- [ ] Link atrium L x102..155 z24..59 y3..22 glass/iron mullions every 6, glass-and-steel roof grid y22, rail y23, sea_lantern ceiling; doors z24/z59 x124..133; P3; `atriumRoof`.
- [x] Covered walk north W x102..107 z12..23 y3..10: quartz_pillar piers every 6, smooth_quartz canopy y9..10, lanterns hung under; P3; `coveredWalk`.
- [x] West-edge slab ramps x0..11 (ground 1-2 to street 4): half steps, 3 then 2-long landing, 3 wide; P6; `slabRamp`.

## Sky Tower (plot 1)
- [ ] Podium S-P z0..50 y0..41 rounded N end per map: polished_andesite plinth, polished_diorite piers every 6 one proud, light_gray_stained_glass between, smooth_stone bands every 5, coping y40..41; P4; `podiumFace`.
- [ ] Lit lobby Songgao Rd (W): glass plane x3 z18..50 y1..8, doors z26..41; canopy x0..2 y9..10 smooth_quartz with sea_lantern underside; P4/P6; `lobbyGlass`, `doorBay`.
- [ ] Waist link S-W x9..47 z51..65 y0..30 glass box, iron_block mullions every 3, terrace y30 rail y31; P4.
- [ ] Tower shaft x1..55 z66..121 y0..343, corners rounded r9 (quarter circles centred (10,75),(46,75),(10,112),(46,112)); P4; `roundedPlan`.
- [ ] Continuous vertical ribs: white_concrete, every 2nd cell on flat faces, every cell on the curves, floor to crown, no horizontal bands; cyan_stained_glass 1 back; floor lines light_gray_stained_glass every 7 (y15..337); P4; `ribFace`.
- [ ] Taper: plane steps in 1 at y316, 330, 344 (x4..52 z69..118 above), rib tops capped smooth_quartz_slab; P4; `taperStep`.
- [ ] Double-height lit lobby y1..14 glass between quartz piers every 3; main W x0..2 z84..103; S z121 x20..36; P4; `lobbyGlass`.
- [x] Observatory The Sky Taipei y344..371: rib cage to y376, white_stained_glass behind, shroomlight/ochre_froglight ceiling grids y357,y371 (warm lantern); P5; `observatory`.
- [ ] Stepped glass hip roof y372..384 (x6..50 z71..116 → x18..38 z83..104), white_stained_glass with iron_block diagonal ribs; P5; `glassHip`.
- [x] Mast: iron_block 3x3 y385..388, 1x1 to y396 at (28,z93), lightning_rod top, end_rod rungs; P5; `mast`.
- [x] Red aircraft light (27..29,397..398,92..94): redstone_lamp lit in red_stained_glass, plan RESERVED cells; P5; `aircraftLight`.
- [ ] Scattered lit windows warm/cool on S and E faces; podium lit shopfronts and roof garden (moss, azalea, lights every 6); P6; `litWindows`, `planter`, `deckLight`.
