# Style draft: `rustic-rederived` — ratification sheet

> DRAFT (`style-pack/draft-v1`) — structurally NOT a pack: no loader, registry, or build
> path accepts this tag. The human taste gate (E-32 Rule 4) is the act of ratifying:
> read this sheet, then run
> 
> `npm run style:ratify -- --style rustic-rederived --by "<who>" [--note "<text>"]`

## The material story

**Setting:** An English yeoman's farmstead on managed lowland pasture, built from the field it stands in.

**Wealth:** A comfortable but careful freeholding household — land-rich in their own materials, cash-poor for anything bought in. The rule is plain: worked material is spent only where structure or weather demands it. Dressed stone appears at corners, openings and the chimney; everywhere else is rubble, cob, render or frame. The barn, though large, is the more frugally finished of the two — undressed throughout, render spared, glory spent on its timber frame and its doors rather than its skin. Ornament is the honest kind: a moulded oak lintel, a date carved on a tie-beam, the pattern of the framing itself.

**Roofing economy:** There is no slate in this country and none is bought. Roofs are thatched from the farm's own straw and reed over the same coppiced rafters and battens — deep, steep, overhanging pitches that throw the rain clear of the rendered walls. The one fired exception sits at the roof's most punished joint: a small reserved batch of kiln-fired ridge-tile and the hearth's clay caps the ridge and crowns the chimney, where thatch would burn or fail. Riven oak shingle covers the few small things a fire-spark must not reach — a porch hood, a wellhead, a dovecote cap.

### Sources (every palette role cites these)

- `rounded-fieldstone-cobble-undressed-dry-laid-or-lime-bedded`: cleared off the family's own pasture each season (abundant) — typical use: footings, plinths and the damp-shedding lower wall courses of both cottage and barn
- `dressed-quarry-freestone-squared-tooled-blocks`: won in small lots from the small local quarry (scarce) — typical use: quoins, door and window jambs, sills, lintels, and the chimney stack — spent only where structure or weather demands
- `cob-clay-and-lime-daub`: clay dug from beneath the farm's topsoil, tempered with straw and sand (abundant) — typical use: the mass of lesser walls and the infill between frame, rendered over for weather
- `lime-render-and-limewash`: chalk-stone burned in the farm's own clamp-kiln, slaked and sanded (common) — typical use: rendering and whitening the upper walls of the cottage; barn render spared except where most exposed
- `hewn-structural-oak-heavy-frame-timber`: standards hewn green from the managed oak coppice (common) — typical use: sills, posts, tie-beams and principal rafters — the box/cruck frame of cottage and barn
- `sawn-oak-board-and-plank`: lesser logs ripped at the family's own sawpit (common) — typical use: floors, lofts, doors, partitions, and the barn's great doors
- `riven-oak-shingle-and-pale`: knotty oak butts split, not sawn, at the yard (common) — typical use: fire-safe small roofs and hoods — porch, wellhead, dovecote — and fencing pales
- `coppice-underwood-and-wattle-hazel-willow-rods`: the coppice underwood and the hedgerows (abundant) — typical use: common rafters, battens, and the woven wattle panels behind the daub
- `straw-reed-thatch`: the farm's own harvest straw and reed (abundant) — typical use: the deep steep main roofs of both cottage and barn, overhanging to shed rain off the render
- `kiln-fired-clay-ridge-tile-and-hearth-brick`: a small reserved batch fired in the farm's kiln (scarce) — typical use: the ridge line, chimney crown, hearth and bread-oven — the few places that must survive fire
- `wrought-iron-fittings`: bought sparingly from the village smith (imported) — typical use: strap-hinges, barn-door pintles, latches and the few nails the pegged joinery cannot hold
- `leaded-lattice-glazing-small-quarry-panes`: the only glass bought in, carried from town (imported) — typical use: small lattice casements in the cottage's best rooms; lesser openings shuttered, the barn left to slit vents

## Palette (the taste pass reads this table)

| role | block | seat | L* | rationale |
|---|---|---|---|---|
| wall.field.ground | `cobblestone` | base/dominant | 53 | The pasture sheds rounded, undressed cobbles every winter, cleared by hand and stacked dry or lime-bedded for the footings and damp-shedding lower courses of both cottage and barn. It is the freest material the family owns, so it carries the wet ground-storey where no worked stone need be spent. Cobblestone (L 53) is the unmistakable read of hand-gathered rubble. |
| wall.field.upper | `white_terracotta` | upper/dominant | 75 | Above the damp courses the lesser walls are cob — clay dug from beneath the topsoil, tempered with straw — then rendered and limewashed with quicklime burned in the farm's own clamp-kiln to protect and brighten the upper storey. The pale limewashed render reads as a soft, weathered off-white (L 75), not a clean modern white, true to a half-bought, half-burned lime. |
| wall.dressing.quoin | `stone_bricks` | — | 51 | Dressed freestone is scarce, won in small lots and carted at cost, so it is hoarded for the few places that earn it: squared quoins, jambs, sills and lintels where structure and weather demand a true edge. Stone_bricks (L 51) read as the tooled, squared ashlar that the rubble field cannot give — the worked stone spent only at the corners and openings. |
| wall.trim.frame | `oak_wood` | — | 38 | The yard's structural bank is the managed oak coppice-with-standards, hewn green and worked square with the adze, pegged never nailed, into the box or cruck frame. The honest ornament of this house is the pattern of its own framing, left proud of the render. Oak_wood (L 41) is the squared, all-faces timber of those posts and tie-beams. |
| roof.field | `hay_block` | roof/dominant | 58 | There is no slate in this country and none is bought; the deep, steep, overhanging roofs of both cottage and barn are thatched from the farm's own harvest straw and reed over coppiced rafters, pitched to throw rain clear of the rendered walls. Hay_block (L 58) is the warm, coursed straw mass that thatch wants to be. |
| roof.ridge | `bricks` | — | 47 | Thatch fails at the roof's most punished joint, so a small reserved batch of kiln-fired clay ridge-tile caps the ridge line where straw would not hold. Bricks (L 47) are that same fired clay from the farm's kiln, marking the one fired course on an otherwise unfired roof. |
| roof.course.stairs | `oak_stairs` | — | — | The few small roofs a fire-spark must not reach — porch hood, wellhead, dovecote cap — are covered in riven oak shingle, knotty butts split (not sawn) at the yard. Oak_stairs lay the pitched shingle courses of those fire-safe hoods. |
| roof.course.slab | `oak_slab` | — | — | The same riven oak shingle, laid flat at eave and hood underside, gives the shallow course and verge of the small fire-safe roofs. Oak_slab is the half-course member of that shingle family. |
| door.main | `oak_door` | — | — | Doors — the cottage's and the barn's great doors alike — are made of sawn oak board ripped at the family's own sawpit, hung on the few pieces of bought iron. Oak_door is plank-built oak, the honest joinery this freeholding raises itself. |
| window.glazing | `glass_pane` | — | — | Glass is the only material carried from town, dear and spent thin: small leaded lattice quarries the size of a hand, set only in the cottage's best rooms. Glass_pane is that single bought-in luxury, kept rare against a house otherwise shuttered or horn-filled. |
| window.shutter | `oak_trapdoor` | — | — | Everywhere the bought glass does not reach, the opening is closed by an oak shutter of sawn board — the cash-poor, material-rich answer to weather. Oak_trapdoor is that hinged board shutter over the lesser lights. |
| chimney.stack | `stone_bricks` | — | 51 | The chimney stack is one of the few places that earns dressed freestone, squared to carry the hearth's fire safely up through the thatch. Stone_bricks read as that tooled, hoarded stone rising where weather and fire together demand worked material. |
| chimney.cap | `bricks` | — | 47 | The household heats with hearth and bread-oven, and the chimney crown — like the ridge — is the joint that must survive fire, so it takes the kiln-fired clay of the farm's reserved batch. Bricks (L 47) cap the stack where thatch and even render would burn. |

## Value evidence — near-tone separation (same-family cube pairs; weighted w=2, true ΔE76 beside)

- stone: wall.dressing.quoin (`stone_bricks`) vs chimney.stack (`stone_bricks`) — weighted 0, true 0
- brick: roof.ridge (`bricks`) vs chimney.cap (`bricks`) — weighted 0, true 0
- stone: wall.field.ground (`cobblestone`) vs wall.dressing.quoin (`stone_bricks`) — weighted 2.51, true 2.2
- stone: wall.field.ground (`cobblestone`) vs chimney.stack (`stone_bricks`) — weighted 2.51, true 2.2

## Proportions

- storeys 3–5 blocks; pitch classes [2,1,0.5]; opening spacing 2–5 cells

## Idioms (owned brushes; params seeded mechanically — verify before relying on them)

- `chimney` — {"block":"stone_bricks","cap":"crown","capBlock":"bricks"}
- `course.slab` — no seeded params
- `course.stairs` — {"block":"oak_stairs"}
- `opening-dressing` — no seeded params
- `plinth` — {"block":"stone_bricks"}
- `roof.gable` — {"blocks":{"field":"hay_block","stairs":"oak_stairs"}}
- `surface.paint` — no seeded params
- `surface.roof-courses` — no seeded params
- `timber-frame` — no seeded params

## Brush needs (new work this style asks for — the T-131 factory's input)

- NEW: `surface.thatch` — Course and overhang the hay_block roof mass so it reads as deep thatch — straw projected clear of the rendered wall, rounded verge, ridge bedded under the brick tile — on the cottage and barn dominant roofs.
- NEW: `wall.quoin` — Lay alternating long-short dressed stone_bricks quoins up every external corner so the hoarded worked stone reads only at the edges that earn it.
- owned `roof.gable`: Steep, overhanging thatched roofs with a fired-clay ridge over both cottage and barn.
- owned `timber-frame`: Oak box/cruck frame left proud of the limewashed render.
- owned `surface.paint`: Two-band wall — rounded cobble rubble on the wet ground storey, limewashed render above the damp course.
- owned `plinth`: Proud cobble footing / damp-shedding course at the wall base.
- owned `opening-dressing + head.flat`: Squared stone jambs, sills and flat (never arched) lintels at the openings.
- owned `opening-dressing`: Plank oak doors, including the barn's wide great doors.
- owned `opening-dressing`: Glass only in the cottage's best rooms; oak board shutters on every lesser light.
- owned `course.stairs`: Pitched riven-oak shingle courses on the small fire-safe roofs (porch hood, dovecote cap, wellhead).
- owned `course.slab`: Flat shingle course at the eave and verge of those same small roofs.
- owned `surface.roof-courses`: Orchestrating the shingle members across each small-roof zone in pitch order.
- owned `roof.pyramid / roof.gable`: Small pitched/pyramidal roof structures for the dovecote cap and porch hood.
- owned `chimney`: Stone chimney stack rising through the thatch with a fired-clay crown.

## Comparison vs the curated `rustic` pack (closeness is evidence, not a gate)

- aligned roles: 6 (3 same-block, 0 same-family, 3 different)
- curated roles the chain missed: wall.dressing (`stone_bricks`), frame.timber (`dark_oak_log`), roof.trim (`dark_oak_planks`), roof.course (`spruce_stairs`), roof.step (`spruce_slab`), door.wagon (`oak_planks`), window.infill (`spruce_fence`)
- derived roles with no curated counterpart: wall.dressing.quoin (`stone_bricks`), wall.trim.frame (`oak_wood`), roof.ridge (`bricks`), roof.course.stairs (`oak_stairs`), roof.course.slab (`oak_slab`), window.glazing (`glass_pane`), chimney.stack (`stone_bricks`)
- idioms only derived: surface.paint, surface.roof-courses; only curated: arch, dormer, floorplan, head.flat, hollow, jetty, roof.hip, roof.pyramid
- full detail: `comparison.json` beside this file

## Taste checklist (before ratifying)

- [ ] every rationale reads from the story (craft and economy), never just the color
- [ ] near-tone pairs above are separable at a glance (the weighted distance is honest)
- [ ] each band's dominant is what the style should read as from the street
- [ ] proportions match the imagined place (storeys, pitch, opening rhythm)
