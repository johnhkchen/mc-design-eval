# Tool backlog (93 classified gaps over 7 runs, 20 clusters)

Value = weighted count (MissingTool/RendererGap 3, MissingOption/MisusedTool 2) x sqrt(distinct runs): a gap that recurs across buildings
amortises best. Build from the top with Opus; every build must be a reusable, tested tool. Mark built: `gaps.mjs built "<tool>" <commit>`.

## 1. mcd render: glance and close-up views for small features — value 58.8 (8 gaps, 6 runs, RendererGap)
Include oblique close-up crops around each detail job's target cells, an interior or eye-level view when a job touches interiors, and banners in the standard views, so 1-2 block features are visible to the judge.
- _Rejected chimney: judged 'barely visible at a glance'. Rejected curtains: 'the street view looks the same as before'._
- _Rejected 'Interior stock and meeting room': the changes are barely visible from outside, so the judge cannot see the work._
- _Five rejections say the same thing: the plaque text, the lanterns, the quartz kick-plate, the weathered base and the roof texture are all to_
- _Most neutral verdicts (plinth, wall field, lintels, sills, chute, wall texture) said the change was too faint to see at full-build scale, so_

## 2. mcd diff: per-job change census and zero-write failure — value 36.0 (7 gaps, 4 runs, RendererGap)
Each detail job reports cells written per rule and visible-pixel delta with a before/after crop. Jobs that write zero cells or enumerate zero targets fail with a reason instead of passing as successful no-ops, and sub-floor changes are flagged invisible at glance scale.
- _About 25 'no visible change' observations across jobs (e.g. 'A and B pixel-identical in all four views', 'changes too subtle to read'). Full_
- _Window lintels (front and west flank) and the back door frame showed no change; the back door is not visible in either render, so the job li_
- _Detail jobs 'Eaves cornice, west wall top', 'Stair-shaft glazing grid', 'Roof edge trim, north gable and shaft head' and 'Roof edge' each ch_
- _JOB 13 (pediment rake changed no pixels), JOB 20 (entrance doors no pixels), JOB 36 (edge piers no pixels). Session notes: paint skipped alr_

## 3. B.plaque / B.signText / B.banner: legible signage — value 33.5 (6 gaps, 5 runs, MissingTool)
Lay out a short phrase as block letters at a minimum readable height and width ratio, with a plaque fallback when it does not fit. Enforce spacing between adjacent signs and banners, and let a banner hang as one full-height panel on a pilaster face.
- _Rejected 'Hang a second small sign by the barrel': the dark board butts directly against the READING ROOM sign so the two merge into one lon_
- _Rejected 'Make the sign legible and prominent': sign text unreadably tiny; the fix didn't make it more legible or prominent._
- _'Make the name plaque legible and gold' was rejected: the text was unreadable and the plaque was not visibly gold._
- _JOB 7 teal banners read as a striped patch with a stray lantern off the column edge; JOB 2 banners became fragmented slivers with floating w_

## 4. mcd palette check: role, contrast and accent family — value 33.5 (6 gaps, 5 runs, MissingTool)
Flag blocks whose tone or saturation breaks their role's contrast or aged palette, map white, quartz and gold roles to matching blocks, reject non-architectural blocks as facade or roof material, and check new accents against the build's accent family.
- _Rejected 'Operator touch: clean quartz doorstep': a pure white quartz step is a stark bright patch against mossy grey stone, reading as a mi_
- _Rejected stepped-peak task: stripped log corner posts clash with the dark stone walls, so the roofline looks less crafted._
- _Rejected lean-to: red and yellow wool blocks read as clutter on a building facade._
- _JOB 27 quartz cap and bands read as a mismatched thin grey strip instead of white quartz_

## 5. mcd check: support, orphan and visibility — value 30.0 (5 gaps, 4 runs, MissingTool)
List every block with no face-adjacent support or structural connection, flag placements with no exposed face in the standard views, and make stair and step helpers fill the support course under each tread and report see-through voids.
- _Rejected 'Plank/wool lean-to': a patchy strip of wool and plank bands, and a stray red cube sticks out from the side._
- _Stray red cube on the lean-to and detached stone above the gable; both were visible only in the render._
- _JOB 16 flagpole rod changed no visible pixels in any view_
- _JOB 7 floating finials; JOB 35 stray protruding cornice stubs; JOB 12 stray tan blocks on white piers; JOB 24 stray pale block._

## 6. B.pilaster: capital, base and shoulder profile — value 28.0 (6 gaps, 4 runs, MissingTool)
Build a 1-2 block capital and base from stair and slab courses for any pilaster, post, column or drum width, with a flare or shoulder ring option. Keep the shaft clear of attached lanterns and banners.
- _Entrance sign band end-caps and pillar capitals show no visible change in either build._
- _Tower base and shoulder: the only change was faint block texture on the shaft; the base and shoulder did not improve._
- _'Pilaster capitals and bases (north)' added large flat grey diagonal bands across the white portico and pilasters, which read as artifacts a_
- _JOB 9 (pilaster capitals and bases not readable), JOB 12 (portico capitals only a faint lighter band)_

## 7. opening surround: reveal, sill, lintel and hood projection — value 26.0 (6 gaps, 4 runs, MissingOption)
Give each opening a recess reveal and a sill, lintel or drip-hood projection of 1 to 2 blocks that spans the full opening width. Accept an avoid-cells set so trim never cuts into pilasters or piers.
- _Rejected 'Fix walkability readout and door reveal': the door-side panel was recoloured to dull grey and brown, which removed colour but did _
- _'Clean quartz kick-plate under the east gallery windows' was rejected: the strip was a tiny accent that read as a stray bright block, not as_
- _Drip hoods over every window produced pixel-identical renders, or were too small to see._
- _'Upper window lintels (front)' showed no visible lintel profile; 'Upper window sills (side)' added only tiny sparse plank stubs._

## 8. mcd paint: weathering and vary presets with contrast floor — value 24.0 (6 gaps, 4 runs, MisusedTool)
Weather or vary by contiguous course or panel with a coverage fraction, clustering and a minimum contrast and mottling density, with a visible default. Reject variants below the contrast floor so changes do not read as same-family no-ops.
- _'Weathered base on the flanks and rear' was rejected: a few mossy and cobble patches were barely visible in either view._
- _Wall field variation (deepslate, west flank, front) invisible; roof tile variation identical; shaft flank banding and elevator-head banding _
- _Mossy weathered base and plinth weathering/moss invisible; the stepped plinth in one build was the only visible change._
- _Plinth mossy and cracked variation, wall-field cracked-deepslate patches, shaft-wall and elevator-head stone swaps, oak chute plank patches _

## 9. singletons (no shared tool) — value 22.5 (5 gaps, 3 runs, MissingTool)
Each needs its own brush or option: a gate prop, an emblem inlay, a roof course texture option, a rail round flat tops, and a louvred vent option.
- _Rejected 'Make the garden gate read as a gate': a bare light block with a floating lantern beside the post reads as a stray unfinished pilla_
- _'Make the pediment seal read' was rejected: the bright quartz panels read as stray white patches, not as a seal._
- _'Texture the roof slopes' was rejected: the slopes still read as flat grey stone-brick courses, and the added texture was barely perceptible_
- _JOB 15 tower-top railing: stray pickets, uneven cross-bars, cluttered spiky tangle instead of a clean rail_

## 10. band and window dressing: clearance-checked placement (incl. shutters) — value 22.0 (4 gaps, 4 runs, MissingTool)
Place fascias, curtains and shutters only in solid wall zones outside the glazing, recessed by a depth offset. Block placement that overlaps window or door cells or clashes with hanging lanterns, signs or wall props, and build panel-shaped closed shutters sized to the opening.
- _Rejected 'Curtains on the side and back windows': a flat, translucent red strip overlaps the hanging lantern and the wall beside the window,_
- _Rejected sign task: new oak beam across the upper storey is a wide plain slab that covers the windows, so the window row looks blocked._
- _JOB 31: shutters replaced the glazed window with a black void and thin slats, so the windows read as holes._
- _JOB 14: the 'shutters' render as two thin vertical brown slats running full window height, so the opening reads as dark and empty._

## 11. B.lantern: feature-anchored light fixture — value 18.0 (4 gaps, 4 runs, MissingTool)
Attach a lantern to a named feature by role (pilaster cap, post top, wall top, bracket or chain), sized to read at street scale, refusing placement with no solid support or an offset from the existing lantern row.
- _'Lamps on the side pilaster caps' was rejected: the lanterns were tiny specks, did not sit on the caps, and the build had no pilaster-cap pl_
- _Portico base lanterns not visible in either render; the job added no discernible detail._
- _JOB 13: tiny lanterns on a thin dark chain stub, slightly off the pier in the front elevation._
- _JOB 15: one hanging lantern reads as a stray floating block at the edge. JOB 23: a second bracket and lantern sit on a different level and a_

## 12. mcd roof edge: cornice, coping and string course — value 17.3 (5 gaps, 3 runs, MisusedTool)
Cornices, coping, string courses and roof-edge trim get a default projection of at least 2 blocks with a dentil or corbel rhythm option. Coping runs as one closed course on the wall-top ring, and the job fails if the ring is open.
- _Mid string course between storeys not visible in either render; shaft flank storey bands add no visible profile._
- _Roof-edge coping left stray specks on the rooftop with no edge improvement; roof-line coping on the front frieze not visible._
- _'Roof edge' (JOB 11) had only a tiny vent and cap change; 'Roof edge coping' (JOB 10) showed no meaningful roof-edge profile at street view._
- _JOB 7 (eave ledge nearly invisible), JOB 8 (belt courses faint), JOB 10 (roof coping barely visible), JOB 12 (heavy dentilled cornice and st_

## 13. shapes-curved arch: window and door heads — value 13.9 (4 gaps, 3 runs, MissingOption)
Apply a segmental, corbelled or stepped arch head with an optional keystone to an existing rectangular opening in place, without rebuilding the surrounding wall.
- _JOB 21 arched ground-floor windows show only a darker lintel strip; JOB 32 side door 'stone arch' shows no arch profile; JOB 35 side window _
- _JOB 28 (ground windows show no arched heads), JOB 38 (side door arch shows only a faint grey patch)_
- _JOB 15: corbelled arches over shopfront bays show only as faint stair-step notches in the pale stone._
- _JOB 19: arch heads over shopfront bays are a small grey block, not the stepped-arch profile. JOB 26: the gold keystone is not visible becaus_

## 14. B.planter: planting mass and potted plant — value 12.7 (3 gaps, 2 runs, MissingTool)
Place a planter or potted shrub as a small volume of about 3x2 footprint and 2 high, with a leaf or flower palette, seated on a plinth or in a named bay or corner.
- _JOB 22 planters are a few tiny dark-green and purple specks, too small to read as shrubs or flower beds_
- _JOB 25 (two thin green strips read as slivers, not potted trees)_
- _JOB 19: potted shrubs and topiary changed no visible pixels in any view._

## 15. mcd glazing: mullion grid and door transom — value 11.3 (4 gaps, 2 runs, MissingOption)
Offer a mullion or glazing-bar preset (spacing, frame material, depth) for windows and shopfronts, plus transom and sidelight variants for doors, so glass reads as divided panes rather than flat dark fields.
- _JOB 26 mullion grid is only faintly different from the before state, with flat glass and no crafted depth_
- _JOB 10 glazing change gave flat pale panes with almost no mullion detail_
- _JOB 16: mullion grid shows only faint light-blue lines on the glass._
- _JOB 17: transom change is tiny and barely shifts the read against the concept's double door._

## 16. mcd roof: chimney seat and cap — value 10.4 (3 gaps, 3 runs, MisusedTool)
Chimneys seat on the local roof plane by extending down to the slope, take a dark masonry cap by default, and offer a replace-existing mode so the old chimney is removed.
- _Rejected 'Chimney on the west gable': a single bright pale cap sunk into the dark slate reads as a light patch or hole, not a stack, and is _
- _JOB 17 flat-topped light-grey column clashes with deepslate and its cap is stuck to a stray roof fragment_
- _JOB 34: the new chimney is a wide detached block floating off the roof slope with a visible gap beneath, and the old thin chimney is still s_

## 17. mcd paint: relief depth defaults — value 10.4 (3 gaps, 3 runs, MisusedTool)
Default pilasters, quoins, ledges and widened piers to a proud depth of 2 in a contrasting role material, keeping the wall plane flat and refusing a lighter-toned material than the frame by default.
- _JOB 2 pilasters proud of the wall and dark quoins: before and after renders nearly identical; JOB 8 pier capitals and base blocks not visibl_
- _JOB 20 planter ledges, JOB 27 pilasters, JOB 36 eave brackets, JOB 39 coping, JOB 35 cornice: thin, barely visible relief._
- _JOB 6: widened piers render as pale flat light-oak blocks with a ragged stepped edge on the right pier, clashing with the darker concept ton_

## 18. mcd roofs: gable apex cap and raking trim — value 9.9 (3 gaps, 2 runs, MissingTool)
Build a bonded stepped apex cap and a continuous stair-stepped raking band along both gable edges that follows the pitch, with a set thickness and default crow-step depth of at least 2 with a contrasting cap.
- _Rejected 'Stepped stone peak above the gable': a boxy, detached stone lump floats above the gable with a visible hole beside it._
- _JOB 10 raking band came out thinner, ragged at half-height steps, and partly lost in shading_
- _JOB 33 stepped dark cap and crenellations are barely visible and do not add the concept's gable stair-stepping_

## 19. B.finial: grounded peak and flagpole — value 9.9 (3 gaps, 2 runs, MissingOption)
A slender finial or flagpole seated on an apex or roof corner with no air gap, sized to read at normal distance, with its material drawn from the palette accent role.
- _JOB 12 finial is an orange-red ball on a thin stalk, clashing with the slate and gold palette; concept has slender gold spires_
- _JOB 14 (pediment finial too small), JOB 17 (tower flagpole one block), JOB 24 (lantern posts at plinth ends unreadable)_
- _JOB 7: thin stone rods float at roof corners and pediment feet, reading as antennae with some hovering off the eave._

## 20. B.post: thin member and downpipe — value 8.5 (2 gaps, 2 runs, MissingTool)
Place posts, rails, downpipes and gate posts at a minimum section of 2 wide, or a capped 1-wide, in a palette role colour. A downpipe runs continuously from roof edge to ground down a pier or corner.
- _JOB 18 handrails are two small sticks; JOB 24 gate posts are thin stubs; JOB 30 post-and-rail strip is barely visible; JOB 31 downpipe becam_
- _JOB 12: two tan/terracotta blocks at window height, no vertical run; JOB 33: faint mossy strips barely change the read._

