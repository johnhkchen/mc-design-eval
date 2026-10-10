# Tool backlog (380 classified gaps over 23 runs, 156 clusters)

Value = weighted count (MissingTool/RendererGap 3, MissingOption/MisusedTool 2) x sqrt(distinct runs): a gap that recurs across buildings
amortises best. Build from the top with Opus; every build must be a reusable, tested tool. Mark built: `gaps.mjs built "<tool>" <commit>`.

## 1. mcd roof: pyramid, cone and spire caps — value 31.3 (7 gaps, 5 runs, MissingOption)
Tall smooth cone or spire caps on rect or round footprints with height independent of footprint, per-ring lean that bends smoothly, taper to a point, an optional flared base (broach), a fit-inside-footprint mode, a finial seated on the apex, and a height-to-radius default that reads as a cone (warn below about 1.5x eave radius).
- _Reviewer: the bulbous black cap reads as an onion dome. The cap used a bulb-like shape where a cone was wanted._
- _Builder wanted a broach option on tower: spire; pyramid gave a straight needle with no flare at the base._
- _Pyramid is a square-stepped, centred, broad form; reviewer wanted 'a tall crooked wizard's cone', 'lean barely visible'. A rejected cone att_
- _Wizard tower got a broad pyramid where a tall spire was wanted. Pitch was cut to 1.5 to avoid grid overflow. The finial floated until an ape_

## 2. mcd paint census: zero-write fail, cell count and pixel delta — value 30.0 (6 gaps, 4 runs, MissingTool)
Report cells written per rule and per-job visible pixel delta; fail loudly with a reason when a rule or target enumeration writes zero cells or finds zero targets, with force as the default for explicitly targeted cells.
- _Window lintels (front and west flank) and the back door frame showed no change; the back door is not visible in either render, so the job li_
- _Detail jobs 'Eaves cornice, west wall top', 'Stair-shaft glazing grid', 'Roof edge trim, north gable and shaft head' and 'Roof edge' each ch_
- _JOB 13 (pediment rake changed no pixels), JOB 20 (entrance doors no pixels), JOB 36 (edge piers no pixels). Session notes: paint skipped alr_
- _Most neutral detail jobs (JOB 9, 10, 25, 28) look identical before and after at elevation scale; the judge cannot separate these from no-ops_

## 3. window brush: shape, recess, frame and shutters — value 29.1 (5 gaps, 5 runs, MissingOption)
Windows support round, oval and octagonal shapes with a frame ring, a one-block recess with sill and lintel by default, frame and shutters, dark-roof-visible panes, and a curtain-wall run of full-height glazing between slim posts.
- _Builder: no oval or octagon window brush; 3x3 plus of panes by hand. Reviewer Minor Elements x2: round windows read as square panes or slits_
- _Reviewer: 'no recessed openings', 'tiny windows'; builder left windows flush. Brief asked for sill and lintel trim._
- _Builder: dormer window option is a block name only, no frame or shutters; dark panes vanish in slate._
- _Reviewer Major Facades x2: 'floor-to-ceiling glass reads as black wall with a few small panes'. Builder: no curtain-wall brush; placed posts_

## 4. roof attachments: chimney, cupola, vane, louvre, finial (re-roof keeps penetrations) — value 27.7 (6 gaps, 3 runs, MissingTool)
Place roof-aware penetrations and ornaments (chimney with cap, cupola, weather vane clear of the roof, louvred panels flush to a body, gable finial) and keep them intact when the roof is re-run.
- _Reviewer [Major Elements] and [Minor Elements]: dragon-head gable ends are small blobs or hook stubs. Builder: ridgeEnds:"dragon" gives corn_
- _Builder: preset ships a 3x3 lantern tower (+4), grid grew to 15x18x21; cupola hand-built. Reviewer Major Elements: cupola lost in roof clutt_
- _Builder: vane was a flat iron_bars cross for lack of a lower gambrel; closest was finial with tower top lantern. Reviewer: vane is a single _
- _Rejected Props task: new iron-bar louvres and detached frame pieces floated above the roof like scaffolding._

## 5. mcd check: floating, stray and envelope-breach finder — value 26.8 (5 gaps, 5 runs, MissingOption)
Flag floating, orphan, sliver and protruding blocks along roof edges, gable rakes, pillar bases and the intended envelope, and check that a detail pass does not open the roof, all failing before render and inside the roof step.
- _Reviewer [Minor Finish] and [Major Elements]: stray window and glass bits in gables and floating horizontal beams in the back view. Builder _
- _Rejected detail task: 'a hole now opens in the dark roof, exposing a glaring white block and a torch-like lantern.' Reviewer: 'roof has hole_
- _Reviewer Minor Finish: floating dark side blocks at eaves height and stray white and dark blocks. Builder: check flags no orphan on hay._
- _Rejected Detail task: a stray white sliver appeared at the pillar base after the wall-fill swap, making the change look unfinished._

## 6. surround and door-frame brush — value 26.0 (6 gaps, 4 runs, MissingOption)
Surround and door-frame brushes work on open doorways and one-block walls without glass, clamp to wall bounds, support curved walls, place a barn-door leaf pair with X-brace, and report an error when they place nothing.
- _Reviewer [Minor Facades]: street front lacks a clear portal. Builder: door portal with carved timber frame and chain lanterns placed by hand_
- _Builder: '`surround` (timber) and `planter` on a doorway wrote nothing or outside the grid for an open doorway in a wall with no glass.'_
- _Builder: hand-placed diagonal cells; a 4x4 leaf reads as a checker. Reviewer Major Facades: doors read as a tiled floor. Closest tools: glaz_
- _Builder: surround has no timber preset beyond box:false; hand-placed dark_oak_planks backing behind each pane._

## 7. plinth and raised-floor brush — value 26.0 (5 gaps, 4 runs, MissingTool)
Build a foundation or plinth in courses (default one course, optional accent top course) with stone footing piers to a level top, an entrance stair-up and forecourt that keeps the floor level, and a stone band option in the palette.
- _No stair-up that keeps the interior floor level; builder had to hand-place entrance steps._
- _Builder: 'Raised floor on stone footings: nothing; hand-placed pillars.' Reviewer: 'Run the footing course evenly around all sides.'_
- _Reviewer Minor Palette: foundation barely reads as stone; white too bright. Builder: foundation course was hand-written._
- _Builder: no steps brush to cut a stair run through a plinth ring; hand-placed stairs and carved the deck._

## 8. pilaster, column and post: capital and base (B.pilaster) — value 24.0 (5 gaps, 4 runs, MissingTool)
Build a 1-2 block capital and base from stair and slab courses that fits any pilaster, column or post width, with a pier or post capital and base profile option, so shafts read as ornamented members.
- _Entrance sign band end-caps and pillar capitals show no visible change in either build._
- _'Pilaster capitals and bases (north)' added large flat grey diagonal bands across the white portico and pilasters, which read as artifacts a_
- _JOB 9 (pilaster capitals and bases not readable), JOB 12 (portico capitals only a faint lighter band)_
- _JOB 38: arcade posts were only recoloured to a darker, flatter tone with no new profile._

## 9. mcd render (texture, glow and close-up views) — value 24.0 (4 gaps, 4 runs, RendererGap)
Render each block with its true texture and opacity, flag untextured or translucent blocks, draw a glow halo for light-emitting blocks, make thin glass visible at judge scale or flag it as invisible, and offer a close-up view for vanes, cupolas and 1-wide slits.
- _Rejected task: after-view 'replaces the sandstone bands with translucent pinkish-grey panels that read as glass or a rendering artifact'. Th_
- _Builder: glass_pane is invisible at render scale, so full glass blocks were used instead. Reviewer: glazing reads as small mullioned panes o_
- _Stained glass rendered pale/pink with no light engine; builder placed shroomlight in the glass to make it read as lit. Reviewer: 'the glowin_
- _Weather vane is a thin line hard to see. Cupola almost invisible from front and side views. Slits visible only in the back view. Evidence th_

## 10. mcd roof: tower and spire option (tier taper, anchor, cap) — value 24.0 (6 gaps, 4 runs, MissingOption)
Tiered and tower roofs need a centred or corner anchor, a zero-height no-spire case, a gabled tier top on a chosen ridge axis, plan taper between tiers, and a finial or lantern-cap option that closes to a point rather than a flat disc.
- _Preset hard-codes a front-left 3x3 wind tower (height 2); builder hand-built it. Reviewer: 'dome or wind tower' reads as a pile of blocks._
- _Reviewer [Major Roof]: tiers are stepped pyramids that read as pagoda/ziggurat. Builder: church/tiered gives pagoda-like lean-to tiers; had _
- _Reviewer [Major Massing]: equal-width square tiers plus a tall plain tower read as a tower or pagoda, not a long nave with a narrower rising_
- _Builder: tower `at` is the corner not the centre; height 0 still adds a 4-5 block spire; spire material hard-wired to black stone brick with_

## 11. prop library and prop-cluster — value 24.0 (4 gaps, 4 runs, MissingTool)
A prop library places grouped market props, barrels, hay, goods, stone lanterns, a telescope or spyglass, and furniture sets (tables, chairs, umbrellas) in a row or grid at a chosen corner, scalable and angled.
- _Builder: telescope built from lightning rod, logs and fence by hand. Reviewer Minor Elements: telescope hard to read as a telescope at stree_
- _Props hand-placed (decorated_pot, barrel, hay_block, composter); `planter` only does boxes and beds. Reviewer: props scattered at random._
- _Builder: 'Stone lantern (toro)... hand-built.' Reviewer: 'lantern is small' and 'lantern pillar looks like a plain column.'_
- _Builder: no prop brush for furniture (fence+plate+stairs); placed by hand. Reviewer x2: tables and chairs 'jumbled at the corners', 'jammed _

## 12. fixture hang and mount (mcd check hang test) — value 24.0 (5 gaps, 4 runs, MissingOption)
Fixtures hang or mount from eaves, posts, soffits, hoists and lintels with a chain length, projecting beams and anchored bales, and the hang check uses a block list rather than a word match on 'lantern'.
- _Builder: hanging lanterns under the roof brim hand-placed with chain; fixtures-at-eaves could not target the cone brim or jetty corners._
- _Builder: 'Noren (door curtain): a wall banner needs a block behind it, and an open doorway has none.'_
- _Builder: placed logs, iron_chain and hay block by hand; check flags no orphan but nothing anchors the hay. Reviewer Major Elements: hoist be_
- _Builder: mcd check flagged sea_lantern 'UNSUPPORTED: nothing below to hang from' (regex matches 'lantern'); used ochre_froglight by hand ins_

## 13. mcd palette check: role contrast, outlier and accent lint — value 22.0 (4 gaps, 4 runs, MissingTool)
Before placement, flag blocks whose luminance, saturation or hue falls outside the build's aged palette or breaks their role's contrast, suggest a contrast-safe weathered substitute per role, and reject accent hues that clash with the existing accent.
- _Rejected 'Operator touch: clean quartz doorstep': a pure white quartz step is a stark bright patch against mossy grey stone, reading as a mi_
- _JOB 12 tan blocks on white piers; JOB 24 pale weathered block against dark stone._
- _JOB 16: gold caps read as odd yellow blocks. JOB 23: cyan soul lantern clashes with the warm lantern palette. JOB 34: bright orange copper c_
- _Builder: 'dark oak fence invisible on dark oak log background'; 'spruce_planks trim invisible on spruce_planks walls'. Reviewer: 'dark roof,_

## 14. mcd paint vary and weather: contrast, coverage and clustering presets — value 20.0 (5 gaps, 4 runs, MissingOption)
Weather by contiguous course or panel with coverage fraction, clustering, mottling density and contrast-strength presets with a visible default, including weathered plinth variants and deepslate tile variants.
- _Mossy weathered base and plinth weathering/moss invisible; the stepped plinth in one build was the only visible change._
- _Plinth mossy and cracked variation, wall-field cracked-deepslate patches, shaft-wall and elevator-head stone swaps, oak chute plank patches _
- _JOB 1 (north facade texture barely perceptible), JOB 2 (west cracked-deepslate mottling barely registers)_
- _JOB 25: moss and cracking show only faint flecks on the plinth; the change is too subtle to register._

## 15. mcd roof palette: single-material and contrast-aware presets — value 20.0 (5 gaps, 4 runs, MisusedTool)
Each roof preset should default to one material family with a capped accent, a contrast swap against the wall that the code path applies too, and flat-roof palettes (modern dark, light concrete, red tile for cottage).
- _Reviewer [Major Roof]: chunky grey stone-brick tiers with scattered dark blotches instead of shingles. Blackstone speckle recurred in the re_
- _Reviewer Major Roof x2: roof is a chaotic mix of stone brick, cobble and deepslate with stray stair and slab bits, reads as rubble, not a ga_
- _Reviewer Minor Palette: dark brown or grey roof swallows red walls. Builder: roof() from code gave barn-red roof on red wall; the contrast s_
- _Reviewer: 'noisy grey/glass speckle pattern', 'too dark', 'lighter roof palette such as light gray concrete'. Builder: dark charcoal needed _

## 16. B.sign: fascia band placement, spacing, legibility and lettering — value 19.1 (4 gaps, 3 runs, MissingTool)
Place sign bands only in solid wall zones above openings, keep clearance from adjacent signs and fixtures, enforce a minimum readable letter height, and lay out short block-letter text with a plaque fallback.
- _Rejected 'Hang a second small sign by the barrel': the dark board butts directly against the READING ROOM sign so the two merge into one lon_
- _Rejected 'Make the sign legible and prominent': sign text unreadably tiny; the fix didn't make it more legible or prominent._
- _Rejected sign task: new oak beam across the upper storey is a wide plain slab that covers the windows, so the window row looks blocked._
- _JOB 1 gold lettering read as scattered gold blocks and orange teeth, not legible DEEPSLATE HOLDINGS text_

## 17. timberFrame brush and named timber palettes — value 19.1 (5 gaps, 3 runs, MissingTool)
A timber-frame wall brush lays out posts, plates, braces and plaster infill panels for a storey, with panel-scale variation, a stave bay preset, a long-wall bay option, and named dark-timber palettes.
- _Builder: timber-frame wall panel fully hand-looped. Reviewer Minor Facades x2: flat white panels with little relief; asked for timber braces_
- _Reviewer Minor Facades: plaster panels plain white-grey; rejected Detail task said the changes were too small to read at distance._
- _Builder: staves (vertical log pattern with panel infill) were hand-looped; mcd paint has no stave bay rule._
- _Reviewer [Major Palette] and [Minor Facades]: light oak-brown walls, not dark tarred timber. Reviewer also asked for dark wall and gable pal_

## 18. landscaping ground-shaping brush — value 19.1 (4 gaps, 3 runs, MissingTool)
Shape a rocky mound or plinth, a cut stair run in a sea-cliff, and a stepping-stone path between two points with moss and gravel edging, scattering moss and grass sparsely with clumping so rock bases stay clean.
- _Builder: rocky mound with stair flight built with a hand height-field loop; landscaping brushes did not fit a 13x13 plinth. Reviewer Minor F_
- _Builder: 'no stepping-stone path mode (staggered slabs).' Reviewer: 'stepping stones and path are broken up.'_
- _Reviewer (Minor Finish): noisy random moss and grass patches on the rock base. Builder wrote a custom height hash and scatter for the 15x15 _
- _Builder: no sea-cliff or stair-cut-into-rock brush, so the stair run ended as a stone-brick block. Reviewer (Minor Finish): stray stone and _

## 19. B.lantern: feature-anchored lantern placement — value 18.0 (4 gaps, 4 runs, MissingTool)
Attach lanterns by role to a named feature top (pilaster cap, post top, wall top, bracket or pier face) at a size that reads at glance distance, default to door-height posts or brackets, refuse unsupported or off-row placements, and avoid stray colour casts.
- _'Lamps on the side pilaster caps' was rejected: the lanterns were tiny specks, did not sit on the caps, and the build had no pilaster-cap pl_
- _Portico base lanterns not visible in either render; the job added no discernible detail._
- _JOB 13: tiny lanterns on a thin dark chain stub, slightly off the pier in the front elevation._
- _JOB 15: one hanging lantern reads as a stray floating block at the edge. JOB 23: a second bracket and lantern sit on a different level and a_

## 20. mcd roof: chimney (roof-seated, wall-rise, flared cap) — value 18.0 (4 gaps, 4 runs, MissingOption)
A chimney whose rise is measured from the local roof surface (including cone roofs), seated in the slope or on a wall plane, with banded courses, a flared or stepped cap, and a flag for a floating stub with no supporting wall.
- _Chimney was a 2x2 with no flue or top. Reviewer: a floating chimney stub and a grey stone stub beside the tower._
- _rise is relative to the roof apex, so a chimney at the eave towered over the roof; a negative rise was needed. Reviewer: 'chimney floats bes_
- _Reviewer: chimneys are short, plain and flat-topped. Builder: 'roof --chimney can only sit on a roof, not rise from a wall plane'; hand-buil_
- _Builder: chimneys option unsupported on cone roofs, so the chimney was hand-stacked; reviewer: chimney fused to the spire with a stray flame_

## 21. facade pass: all elevations (bay rhythm, bands, solid default) — value 18.0 (4 gaps, 4 runs, MissingOption)
One call applies a bay rhythm, lintel and sill bands, and row bands to every elevation including the back, with a per-face coverage report and a solid-wall default with trim-only accents on doors, corners and eaves.
- _Orange terracotta band round the building was a manual loop over skin cells; `paint courses` bands every n rows only._
- _Reviewer: 'Add a lighter lintel and sill line on every face, including the back'; 'the back elevation is mostly a blank timber band.'_
- _Reviewer Major Facades (x2) and Minor Palette: red and white checkerboard on doors, loft and gable reads as a flag. Fix suggested was mcd pa_
- _Reviewer (x3, Minor Facades): back elevation is a flat brick wall with no windows, trim, or patching, and the timber porch looks unfinished._

## 22. mcd diff: per-job before/after pixel delta and close-up crop — value 17.0 (4 gaps, 2 runs, RendererGap)
For each detail job, render a before/after pair with a close-up crop of the changed region, so sub-block edits are visible to the judge instead of being marked neutral.
- _About 25 'no visible change' observations across jobs (e.g. 'A and B pixel-identical in all four views', 'changes too subtle to read'). Full_
- _Most neutral verdicts (plinth, wall field, lintels, sills, chute, wall texture) said the change was too faint to see at full-build scale, so_
- _JOB 4, JOB 8, JOB 21, JOB 26, JOB 35: before and after crops look identical, so real relief changes are unverifiable_
- _JOB 14 (finial a faint spike), JOB 17 (flagpole a single block, barely visible), JOB 24 (lantern a dot, half-buried in foliage)_

## 23. plaque / signboard — value 16.0 (4 gaps, 4 runs, MissingOption)
Signs on a one-block band between an awning and a beam, on flanking facade positions, on curved walls, on open porches via a post or beam attachment, and as glowing block-letter panels with a dark backing or free-standing mode.
- _Builder: 'Wall signs... could not fit a 1-cell-high band between awning and viga' and fell back to hand-placed B.sign._
- _Builder did not build the door sign or pennant because plaque and signboard fail on curved walls._
- _B.sign gave an unsupported-attachment warning when placed in the wall cell. signboard was not usable because the porch is open on three side_
- _Builder: plaque gives flat orange letters; block font needs 5+ rows plus margin. Reviewer (x2): CAFE sign is small, low, hidden by planters,_

## 24. mcd roof: overhang clamped to footprint — value 16.0 (4 gaps, 4 runs, MissingOption)
Overhang, fascia and verge stay inside the declared footprint box, with a warning or error in dry-run when they grow it, and a flag that suppresses the extra flare course.
- _Builder: 'rafter-tail row spilled one cell past the 11-deep plot; copied the build into a trimmed grid by hand.'_
- _Builder: box at 15 wide forced an 11-wide body; no fit-inside-box option, so the width was computed by hand._
- _Builder: overhang+fascia widened footprint one block E and S past the stated overhang (grid grew to 18x8x14). Reviewer: roof overhang hides _
- _Builder: cottage preset extends the footprint by overhang +1 plus an extra course, so a 7-wide wall spilled to x+2. Only grow:false exists, _

## 25. glance render: small-feature visibility and glance-scale report — value 15.6 (3 gaps, 3 runs, RendererGap)
Show small roof and wall features (chimney caps, signs, banners, fixtures) at whole-building glance distance, and report every detail whose on-screen footprint falls below a threshold.
- _Rejected chimney: judged 'barely visible at a glance'. Rejected curtains: 'the street view looks the same as before'._
- _Five rejections say the same thing: the plaque text, the lanterns, the quartz kick-plate, the weathered base and the roof texture are all to_
- _JOB 11: teal corner banners do not appear in front or front-left close-ups; only a tan block change shows._

## 26. mcd check: floating, orphan, exposure and off-role detail — value 15.6 (3 gaps, 3 runs, MissingTool)
List every block with no face-adjacent support or structural connection, flag detail placements with no exposed face in the standard views, and flag detail blocks with no owning role, before render review.
- _Stray red cube on the lean-to and detached stone above the gable; both were visible only in the render._
- _JOB 16 flagpole rod changed no visible pixels in any view_
- _JOB 7 floating finials; JOB 35 stray protruding cornice stubs; JOB 12 stray tan blocks on white piers; JOB 24 stray pale block._

## 27. lighting fixtures (lanterns, downlights, hanging lights) — value 15.6 (4 gaps, 3 runs, MissingOption)
Lanterns in a material option (copper, iron, spruce) that hang from a chain anchored to a block above, spaced evenly under any overhang or eave, plus a recessed downlight option that sits flush in a soffit course.
- _Builder: glowstone placed in the soffit by hand; the palette flags it as an outlier._
- _Builder: lanterns on chains placed without support. Reviewer: lanterns float without visible support in the back view and look loose._
- _Builder: 'fixtures at eaves only works on facades found by face maps and could not reach the jetty corners'. Reviewer: 'lanterns are sparse _
- _Builder: hanging lantern in fixture defaults to spruce/iron; had to hand-place copper_lantern._

## 28. props: furniture, prop groups and prop library — value 15.6 (3 gaps, 3 runs, MissingTool)
A furniture brush that places table-and-N-chairs sets, counters and stools on a grid with chair facing from the table, prop groups (bales, barrels) and small free-standing props such as a telescope or spyglass attached to a support.
- _Builder: no table/chair brush; fence+trapdoor tables and stair chairs placed by hand, and chair facing (stair back) needed a fix. Reviewer: _
- _No prop library; closest was lightning_rod + fence. Rejected task: 'telescope is now a black slab that floats past the wall with no visible _
- _Bale stacks, barrels and fence with path gap all hand-placed. planters covers only windows and beds. railing works on a roof top, not on gra_

## 29. renderer: material and emissive fidelity — value 15.6 (3 gaps, 3 runs, RendererGap)
The render shows lit windows as glowing with a halo, displays glass panes as opaque or tinted in elevation, and lets a build declare a paper or translucent colour so pale blocks do not read as dirty in shade.
- _Builder: no light engine, so glowing windows needed shroomlight or orange glass. Reviewer Minor Elements: glowing window reads as an orange _
- _Glass panes render see-through end to end in elevations; a window in both side walls looks like a hole through the building._
- _Builder: 'mcd render paints white snow_block pale grey in shade; no way to tell the renderer what paper should look like.'_

## 30. deck-edge brushes: balcony, veranda, arcade — value 15.6 (3 gaps, 3 runs, MissingTool)
Deck-edge brushes place a deck of set depth with aligned posts, a beam ring, a connected rail with a stair gap, support brackets, even footings, and hanging lanterns on a posted run with arches.
- _Builder: balcony deck, connected-fence rail and hanging lanterns hand-placed. Reviewer Minor Elements: balcony tucked away and tiny; asked f_
- _Reviewer [Major Facades]: ground floor is widely spaced bare posts reading as a pavilion, not a gallery. Reviewer [Minor Finish]: solid post_
- _Builder: 'Engawa/veranda (deck ring, lip posts, beam ring, rail with an entry gap, footings): all hand-placed.' Reviewer: 'engawa railings a_

