# Tool backlog (231 classified gaps over 15 runs, 96 clusters)

Value = weighted count (MissingTool/RendererGap 3, MissingOption/MisusedTool 2) x sqrt(distinct runs): a gap that recurs across buildings
amortises best. Build from the top with Opus; every build must be a reusable, tested tool. Mark built: `gaps.mjs built "<tool>" <commit>`.

## 1. mcd render: glance-scale visibility and per-job before/after diff — value 66.1 (9 gaps, 6 runs, RendererGap)
Report changed cells and visible-pixel delta per job, render a close-up before/after crop of the target cells, and flag any feature that vanishes or changes nothing at glance distance.
- _Rejected chimney: judged 'barely visible at a glance'. Rejected curtains: 'the street view looks the same as before'._
- _Five rejections say the same thing: the plaque text, the lanterns, the quartz kick-plate, the weathered base and the roof texture are all to_
- _About 25 'no visible change' observations across jobs (e.g. 'A and B pixel-identical in all four views', 'changes too subtle to read'). Full_
- _Most neutral verdicts (plinth, wall field, lintels, sills, chute, wall texture) said the change was too faint to see at full-build scale, so_

## 2. opening surround: sill, lintel, reveal and drip hood — value 30.0 (7 gaps, 4 runs, MissingOption)
Give openings a recess reveal, a full-width sill or kick-plate, a lintel and a projecting drip hood with a set proud depth, plus an avoid-cells set so trim never cuts pilasters or piers, and enumerate openings per face so zero targets report a blocker.
- _Rejected 'Fix walkability readout and door reveal': the door-side panel was recoloured to dull grey and brown, which removed colour but did _
- _'Clean quartz kick-plate under the east gallery windows' was rejected: the strip was a tiny accent that read as a stray bright block, not as_
- _Drip hoods over every window produced pixel-identical renders, or were too small to see._
- _Window lintels (front and west flank) and the back door frame showed no change; the back door is not visible in either render, so the job li_

## 3. mcd check: floating, orphan, support and visibility — value 24.0 (4 gaps, 4 runs, MissingTool)
List every block with no face-adjacent support or owning role, fill support under treads and cheeks, and flag detail placements with no exposed face in the standard views.
- _Stray red cube on the lean-to and detached stone above the gable; both were visible only in the render._
- _JOB 16 flagpole rod changed no visible pixels in any view_
- _JOB 7 floating finials; JOB 35 stray protruding cornice stubs; JOB 12 stray tan blocks on white piers; JOB 24 stray pale block._
- _JOB 27: the change opens a see-through hole in the bottom step course and a gap beside the cheek, creating broken voids and a ragged silhoue_

## 4. B.pilaster: capital, base and column profile — value 24.0 (5 gaps, 4 runs, MissingTool)
Build a capital and base profile of 1 to 2 blocks for any pilaster, column or post width, so columns read as ornamented shafts instead of plain or slab-like members.
- _Entrance sign band end-caps and pillar capitals show no visible change in either build._
- _'Pilaster capitals and bases (north)' added large flat grey diagonal bands across the white portico and pilasters, which read as artifacts a_
- _JOB 9 (pilaster capitals and bases not readable), JOB 12 (portico capitals only a faint lighter band)_
- _JOB 38: arcade posts were only recoloured to a darker, flatter tone with no new profile._

## 5. paint vary / weather: contrast floor and clustered coverage — value 24.0 (6 gaps, 4 runs, MisusedTool)
Enforce a minimum contrast step and coverage fraction for variation and weathering presets, weathering by contiguous course or panel with clustering rather than scattered single blocks, and a visible default density, including a plinth weathered variant.
- _'Weathered base on the flanks and rear' was rejected: a few mossy and cobble patches were barely visible in either view._
- _Wall field variation (deepslate, west flank, front) invisible; roof tile variation identical; shaft flank banding and elevator-head banding _
- _Mossy weathered base and plinth weathering/moss invisible; the stepped plinth in one build was the only visible change._
- _Plinth mossy and cracked variation, wall-field cracked-deepslate patches, shaft-wall and elevator-head stone swaps, oak chute plank patches _

## 6. mcd render: legibility of textures, thin glass, glow and small features — value 24.0 (4 gaps, 4 runs, RendererGap)
Render true textures and opacity, flag untextured or translucent blocks, show a glow halo for light sources, and provide a close-up view so thin glazing and small features are judged, not lost.
- _Rejected task: after-view 'replaces the sandstone bands with translucent pinkish-grey panels that read as glass or a rendering artifact'. Th_
- _Builder: glass_pane is invisible at render scale, so full glass blocks were used instead. Reviewer: glazing reads as small mullioned panes o_
- _Stained glass rendered pale/pink with no light engine; builder placed shroomlight in the glass to make it read as lit. Reviewer: 'the glowin_
- _Weather vane is a thin line hard to see. Cupola almost invisible from front and side views. Slits visible only in the back view. Evidence th_

## 7. mcd palette check: outlier, accent and contrast lint — value 22.0 (4 gaps, 4 runs, MissingTool)
Flag blocks whose luminance, saturation or hue falls outside the build's palette family or breaks their role's contrast, and suggest a contrast-safe substitute per role before render.
- _Rejected 'Operator touch: clean quartz doorstep': a pure white quartz step is a stark bright patch against mossy grey stone, reading as a mi_
- _JOB 12 tan blocks on white piers; JOB 24 pale weathered block against dark stone._
- _JOB 16: gold caps read as odd yellow blocks. JOB 23: cyan soul lantern clashes with the warm lantern palette. JOB 34: bright orange copper c_
- _Builder: 'dark oak fence invisible on dark oak log background'; 'spruce_planks trim invisible on spruce_planks walls'. Reviewer: 'dark roof,_

## 8. sign: spacing, legibility, lettering and fascia clearance — value 19.1 (4 gaps, 3 runs, MissingTool)
Place signs and bands only in solid wall zones above openings, keep clearance from adjacent signs, enforce a minimum readable letter height, and lay out short text as block letters with a plaque fallback.
- _Rejected 'Hang a second small sign by the barrel': the dark board butts directly against the READING ROOM sign so the two merge into one lon_
- _Rejected 'Make the sign legible and prominent': sign text unreadably tiny; the fix didn't make it more legible or prominent._
- _Rejected sign task: new oak beam across the upper storey is a wide plain slab that covers the windows, so the window row looks blocked._
- _JOB 1 gold lettering read as scattered gold blocks and orange teeth, not legible DEEPSLATE HOLDINGS text_

## 9. B.lantern: anchored light fixtures — value 18.0 (4 gaps, 4 runs, MissingTool)
Attach lanterns by named feature role (pilaster cap, post top, wall bracket, hung from an overhang) at a size that reads at street scale, through a solid support, aligned to the existing lantern row, and without stray colour cast.
- _'Lamps on the side pilaster caps' was rejected: the lanterns were tiny specks, did not sit on the caps, and the build had no pilaster-cap pl_
- _Portico base lanterns not visible in either render; the job added no discernible detail._
- _JOB 13: tiny lanterns on a thin dark chain stub, slightly off the pier in the front elevation._
- _JOB 15: one hanging lantern reads as a stray floating block at the edge. JOB 23: a second bracket and lantern sit on a different level and a_

## 10. glazing grid: mullions, glazing bars, transoms and panel material — value 17.3 (5 gaps, 3 runs, MissingOption)
Draw mullion and glazing-bar grids in the frame material with set spacing and depth, with a panel-material option for non-glass faces and transom or sidelight variants for doors.
- _JOB 26 mullion grid is only faintly different from the before state, with flat glass and no crafted depth_
- _JOB 10 glazing change gave flat pale panes with almost no mullion detail_
- _JOB 16: mullion grid shows only faint light-blue lines on the glass._
- _JOB 17: transom change is tiny and barely shifts the read against the concept's double door._

## 11. plaque / signboard: placement on flat, curved, open and lit faces — value 16.0 (4 gaps, 4 runs, MissingOption)
Place one-block sign bands, flanking signs, free-standing or porch-attached signs, and glowing block-letter signs on flat or curved walls.
- _Builder: 'Wall signs... could not fit a 1-cell-high band between awning and viga' and fell back to hand-placed B.sign._
- _Builder did not build the door sign or pennant because plaque and signboard fail on curved walls._
- _B.sign gave an unsupported-attachment warning when placed in the wall cell. signboard was not usable because the porch is open on three side_
- _Builder: plaque gives flat orange letters; block font needs 5+ rows plus margin. Reviewer (x2): CAFE sign is small, low, hidden by planters,_

## 12. massing: lean-to, porch, wing and non-rectangular shell — value 15.6 (3 gaps, 3 runs, MissingTool)
Build a lean-to, porch or wing with its own lower roof bonded to the host wall, and a thick-walled shell from any footprint polygon with chamfer or rounded-corner and wall-thickness options, with an orphan check.
- _Rejected 'Plank/wool lean-to': a patchy strip of wool and plank bands, and a stray red cube sticks out from the side._
- _Reviewer: 'plain rectangle with one roof mass and no offset wing or porch'; 'add a small projecting entry porch with its own lower roof, or _
- _Builder looped over two overlapping rectangles to get rounded corners and a 2-wall shell. Reviewer: 'walls look thin and square-edged, not t_

## 13. B.rail: railing, gate and raised deck — value 15.6 (3 gaps, 3 runs, MissingTool)
Run a single-height railing with regular posts and a continuous top rail round any flat roof, tower top or raised deck, with a gap for steps, a gate prop that reads as an opening between posts, and a footing course under decks.
- _Rejected 'Make the garden gate read as a gate': a bare light block with a floating lantern beside the post reads as a stray unfinished pilla_
- _JOB 15 tower-top railing: stray pickets, uneven cross-bars, cluttered spiky tangle instead of a clean rail_
- _Builder: 'engawa/veranda all hand-placed'; 'raised floor on footings with 1-block gap: nothing'. Reviewer: 'gaps under the floor show as whi_

## 14. arch (shapes-curved): openings and heads — value 13.9 (4 gaps, 3 runs, MissingOption)
Apply an arch or segmental head to an existing rectangular opening in place, with an optional stepped or corbelled profile, contrasting voussoir material and keystone.
- _JOB 21 arched ground-floor windows show only a darker lintel strip; JOB 32 side door 'stone arch' shows no arch profile; JOB 35 side window _
- _JOB 28 (ground windows show no arched heads), JOB 38 (side door arch shows only a faint grey patch)_
- _JOB 15: corbelled arches over shopfront bays show only as faint stair-step notches in the pale stone._
- _JOB 19: arch heads over shopfront bays are a small grey block, not the stepped-arch profile. JOB 26: the gold keystone is not visible becaus_

## 15. relief projection defaults (mcd paint depth) — value 13.9 (4 gaps, 3 runs, MisusedTool)
Default projections for sills, pilasters, quoins, cornices, roof trim and crow-steps to at least 2 blocks with a contrasting role material, so 1-block relief does not vanish at street scale.
- _'Roof edge' (JOB 11) had only a tiny vent and cap change; 'Roof edge coping' (JOB 10) showed no meaningful roof-edge profile at street view._
- _JOB 2 pilasters proud of the wall and dark quoins: before and after renders nearly identical; JOB 8 pier capitals and base blocks not visibl_
- _JOB 33 stepped dark cap and crenellations are barely visible and do not add the concept's gable stair-stepping_
- _JOB 20 planter ledges, JOB 27 pilasters, JOB 36 eave brackets, JOB 39 coping, JOB 35 cornice: thin, barely visible relief._

## 16. thin members: posts, downpipes and pier widening — value 13.9 (3 gaps, 3 runs, MissingTool)
Place posts, rails, downpipes and piers at a minimum 2-wide or capped 1-wide section in a palette role, running continuously from roof edge to ground, widening with the wall's own material and no ragged edges.
- _JOB 18 handrails are two small sticks; JOB 24 gate posts are thin stubs; JOB 30 post-and-rail strip is barely visible; JOB 31 downpipe becam_
- _JOB 12: two tan/terracotta blocks at window height, no vertical run; JOB 33: faint mossy strips barely change the read._
- _JOB 6: widened piers render as pale flat light-oak blocks with a ragged stepped edge on the right pier, clashing with the darker concept ton_

## 17. window dressing: shutters and curtains — value 13.9 (3 gaps, 3 runs, MissingTool)
Build closed panel-shaped shutters sized to the opening, outside the glazing, and recess curtains or drapes inside the opening with a depth offset, refusing placement over lanterns, signs or other wall props.
- _Rejected 'Curtains on the side and back windows': a flat, translucent red strip overlaps the hanging lantern and the wall beside the window,_
- _JOB 31: shutters replaced the glazed window with a black void and thin slats, so the windows read as holes._
- _JOB 14: the 'shutters' render as two thin vertical brown slats running full window height, so the opening reads as dark and empty._

## 18. mcd check: per-face envelope census — value 13.9 (3 gaps, 3 runs, MissingTool)
Report per face the opening count, relief, blank-wall status, and see-through or envelope holes with coordinates, before the render review.
- _Reviewer: 'The back and side walls are flat bands... no openings or relief, so they read as blank'. Current checks did not flag this._
- _Reviewer saw a see-through hole in the upper tower on the back elevation; mcd check reported orphans but no elevation through-hole finding._
- _Reviewer: right wall largely open with holes showing interior and sky; front face see-through; back wall has a void. Existing orphan/floatin_

## 19. mcd roof: eave overhang, brackets and grow-free overhang — value 13.9 (4 gaps, 3 runs, MissingOption)
Provide an eave overhang with alternating shingle courses and an optional trim line, per-side overhang, overhang kept inside the footprint, and eave brackets that do not need an overhang.
- _Dark-on-dark deepslate with no courses, texture or eave line. Reviewer asked for alternating deepslate_tile stairs and slabs with a stripped_
- _Builder: overhang on 2 sides only (1 elsewhere); roof() takes one footprint, so the footprint was widened by hand. Reviewer: overhang is sha_
- _Overhang grew the grid 15x17x21 to 17x17x22 and shifted coordinates. Builder forced overhang 0, losing the eave. grow:false was too restrict_
- _Dark stair corbels under the eave were not possible at overhang 0, because brackets need an overhang to hang under._

## 20. B.planter: planter, potted shrub and topiary — value 12.7 (3 gaps, 2 runs, MissingTool)
Place planters and potted shrubs as small volumes of about 3x2 footprint and 2 high, with a leaf or flower palette, at a named bay or corner so they read as planting from the street.
- _JOB 22 planters are a few tiny dark-green and purple specks, too small to read as shrubs or flower beds_
- _JOB 25 (two thin green strips read as slivers, not potted trees)_
- _JOB 19: potted shrubs and topiary changed no visible pixels in any view._

## 21. street dressing: awning, props and stone lantern — value 12.7 (3 gaps, 2 runs, MissingTool)
Place striped awnings attached to the wall or posts at set spacing, clusters of market goods and street props with a grouping option, and a stone lantern with base, post and cap, all sized to read from street distance.
- _Builder: 'stone lantern (toro) hand-built'. Reviewer: 'stone lantern is just one stone post'; 'give the lantern a base, post and cap'._
- _Builder hand-placed a sloped striped awning in a loop (closest tool is bunting, which is banners only). Reviewer: 'floating awning frame' an_
- _Builder hand-placed decorated_pot, barrel, hay_block and composter. Reviewer: 'clay pots and baskets are small and hard to read at street vi_

## 22. new: lanternCap (lantern drum with cap, cupola and vane) — value 12.7 (3 gaps, 2 runs, MissingTool)
Build a glazed lantern drum (mullioned glass, iron-bar frame, visible central lamp) with a shallow cap on posts, eave overhang, finial or vane, and a louvred shaft option, sized to a footprint.
- _Reviewer: the lantern cap reads as a flat black lid or an onion/helmet dome. The roof presets do not cover lantern caps._
- _Builder hand-placed a ring of glass, iron bars and glowstone. Reviewer: the lantern room is mostly open posts, so the light reads as a small_
- _Louvres and shaft hand-built. Cap roof() added layers. No weathervane brush (finial has no arrow, tower top is hollow). Cupola nearly invisi_

## 23. timberFrame(g,{rect,y,height,bay,window}) — value 12.7 (3 gaps, 2 runs, MissingTool)
Lay half-timber bays with posts, sills, knee or cross bracing, plaster infill, diagonal braces in an X or Z pattern, bargeboards and exposed tie beams for timber gables, with window cut-outs.
- _pediment is classical (quartz-style cornice); no timber gable exists. Reviewer asked for symmetrical crossed-beam gable ends with bargeboard_
- _Timber framing hand-placed. pilasters profile timber is vertical only. Reviewer: stave and St Andrew's crosses wanted._
- _Plaster, log posts, knee braces and round windows were all hand-looped. Reviewer: 'large flat white panels'. Closest tools (surround timber,_

## 24. mcd roof: chimney — value 12.1 (3 gaps, 3 runs, MissingOption)
Place chimneys on the ridge or gable with a flue and cap, measure rise from the local roof surface, optionally band the stack with a flared cap, and flag a floating stub.
- _Chimney was a 2x2 with no flue or top. Reviewer: a floating chimney stub and a grey stone stub beside the tower._
- _rise is relative to the roof apex, so a chimney at the eave towered over the roof; a negative rise was needed. Reviewer: 'chimney floats bes_
- _Reviewer: chimneys are short, plain and flat-topped. Builder: 'roof --chimney can only sit on a roof, not rise from a wall plane'; hand-buil_

## 25. plinth <F>: base treatment and approach steps — value 12.1 (3 gaps, 3 runs, MissingOption)
Break a large blank base with a stair course, cobble/mossy mix and plinth step, add a half or full approach course centred on a chosen face, and default a continuous plinth to the full footprint.
- _Stone base large, blank and flat. plinth <F> exists in detailing.md but was not used; builder left the base blank. Reviewer wants a stair/sl_
- _Builder: entry steps on the plinth placed by hand; no steps brush for plinths._
- _Reviewer: loose stone stubs at the base; asked for a continuous stone plinth. Builder had orphan and floating cleanup but not a base plinth._

## 26. mcd roof: chimney seating and replace mode — value 10.4 (3 gaps, 3 runs, MisusedTool)
Chimneys seat on the local roof plane down to the sloped surface under their footprint, take a dark masonry cap by default, and offer a replace mode that removes the old stack.
- _Rejected 'Chimney on the west gable': a single bright pale cap sunk into the dark slate reads as a light patch or hole, not a stack, and is _
- _JOB 17 flat-topped light-grey column clashes with deepslate and its cap is stuck to a stray roof fragment_
- _JOB 34: the new chimney is a wide detached block floating off the roof slope with a visible gap beneath, and the old thin chimney is still s_

## 27. projecting band: string course, cornice and dentils — value 10.4 (3 gaps, 3 runs, MissingOption)
Offer a continuous string course or cornice that projects at least 2 blocks, runs between storeys on every face, uses a dentil or corbel rhythm, and returns cleanly at corners with no detached stubs.
- _Mid string course between storeys not visible in either render; shaft flank storey bands add no visible profile._
- _JOB 7 (eave ledge nearly invisible), JOB 8 (belt courses faint), JOB 10 (roof coping barely visible), JOB 12 (heavy dentilled cornice and st_
- _JOB 35 cornice shows stray stubs at the sides; JOB 36 eave brackets barely visible; JOB 34 dentil row changed no pixels._

## 28. mcd check: orphan and support rules — value 10.4 (3 gaps, 3 runs, MisusedTool)
Run floating-block and orphan checks as a gate on the exported build, on all faces, accept sea_lantern and role-declared intentional orphans, and flag unsupported finials.
- _Reviewer: floating grey slab fragments hang beside the tower and the rear of the cottage has stray blocks. The build passed a check run on a_
- _Builder: sea_lantern flagged as an unsupported lantern by check; palette flags glowstone downlights as outliers._
- _check flags hanging bale, pyramid cap top and interior shroomlight as orphans, all intended. A floating spire finial was not caught._

## 29. facade rhythm: all faces, pilasters and bands — value 10.4 (3 gaps, 3 runs, MissingOption)
Apply window slits, pilasters at every n blocks, and regular metal bands with rivet panels to every face, without growing the grid.
- _Reviewer: 'the rear stone shaft is a blank wall with only a couple of odd blocks', 'add a window slit, buttress or ivy streaks and a lantern_
- _Reviewer: copper accent patches on brick walls are random and unframed; wants ordered horizontal bands or riveted panels at regular spacing._
- _pilasters every n profile timber grew the grid, so board-and-batten posts were hand-placed on a rhythm._

## 30. lantern fixture: hanging under eaves, with material option — value 10.4 (3 gaps, 3 runs, MissingOption)
Hang lanterns from a chain or bracket under any eave, overhang or beam underside, spaced evenly, with copper, iron or spruce material chosen by option.
- _Builder: lanterns on chains placed without support. Reviewer: lanterns float without visible support in the back view and look loose._
- _Builder: 'fixtures at eaves only works on facades found by face maps and could not reach the jetty corners'. Reviewer: 'lanterns are sparse _
- _Builder: hanging lantern in fixture defaults to spruce/iron; had to hand-place copper_lantern._

