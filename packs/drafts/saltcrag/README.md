# Style draft: `saltcrag` — ratification sheet

> DRAFT (`style-pack/draft-v1`) — structurally NOT a pack: no loader, registry, or build
> path accepts this tag. The human taste gate (E-32 Rule 4) is the act of ratifying:
> read this sheet, then run
> 
> `npm run style:ratify -- --style saltcrag --by "<who>" [--note "<text>"]`

## The material story

**Setting:** A storm-grey fishing village wedged between granite headland and a cold northern sea, built of beach stone and tarred boat-timber.

**Wealth:** This is a working village of fishing families, curers, and a few boat-owning skippers — modest means, hard weather, nothing spared for show. Dressed and squared stone appears only where the community pools its money: the church, the harbour quay and slip, the merchant's counting-house and storehouse. Ordinary cottages are rough fieldstone or tarred board, their one indulgence a coat of limewash to seal the wind out.

**Roofing economy:** Roofs answer to the gale, not to fashion. The poorest and most exposed are turfed — sod laid over birch-bark and battens, cheap and stormproof. Where reed and marram grass can be cut, steep thatch is pinned down against the wind. Skippers and the better houses run riven softwood shingle, tarred black. Slate is the prestige roof — imported, costly, and saved for the church and the harbour-front merchant houses that can afford to be seen.

### Sources (every palette role cites these)

- `gathered-grey-granite-fieldstone`: geology — boulders and fieldstone cleared from the headland and strand (abundant) — typical use: cottage walls, byre and store footings, harbour foundations
- `rounded-beach-cobble-and-shingle`: geology — the tideline of the cold coast (abundant) — typical use: wall infill, rough paving, quay backing and yard surfaces
- `dressed-squared-stone`: wealth_class — pooled money for community works, worked by a mason (scarce) — typical use: church quoins and openings, quay edge, merchant-house frontage, doorways
- `lime-mortar-and-limewash`: geology — shell-sand and sea-stone burned in small coastal kilns (common) — typical use: bedding rough stone, sealing and whitening cottage walls against the wind
- `tarred-softwood-clinker-boarding`: timber — pine/spruce deals and boatyard offcuts, soaked in imported tar (common) — typical use: weather-facing cladding, gable ends, sheds and net lofts
- `riven-softwood-shingle-tarred`: timber — split pine/spruce, blackened with pitch (common) — typical use: roofs of better cottages and skippers' houses
- `turf-and-sod`: roofing_economy — sod cut from the thin coastal soil over a bark underlayer (abundant) — typical use: stormproof roofs on the poorest and most exposed dwellings and outbuildings
- `reed-and-marram-thatch`: roofing_economy — grass cut from dune and salt-marsh (common) — typical use: steep pinned-down roofs on modest cottages
- `imported-slate`: trade — landed by boat, costly (imported) — typical use: church roof and harbour-front merchant houses — the prestige cover
- `sawn-softwood-deal-pine-spruce`: trade — milled boards shipped across the sea (imported) — typical use: framing, doors, shutters, jetties and quay decking
- `tar-and-pitch`: trade — barrelled, for boats and weatherproofing (imported) — typical use: blackened cladding, shingles, and storm-facing timber
- `driftwood-and-salvaged-ship-timber`: timber — washed ashore or saved from wrecks and worn boats (common) — typical use: lintels, fence posts, slipway baulks, ad-hoc repairs
- `wrought-iron-fittings`: trade — a little hard metal landed by boat (scarce) — typical use: door hinges, mooring rings, hooks and brackets

## Palette (the taste pass reads this table)

| role | block | seat | L* | rationale |
|---|---|---|---|---|
| wall.field.ground | `cobblestone` | base/dominant | 53 | The ground storey is what the headland gives for free — granite boulders and fieldstone cleared from the thin soil and hauled off the strand, laid up rough and bedded in shell-burned lime. Undressed grey rubble is the structural truth of every working cottage; at L53 it holds the storm-grey of the place without pretending to be worked. |
| wall.finish.limewash | `white_terracotta` | base/preserve | 75 | The cottage's one indulgence: a coat of lime burned from shell-sand in the coastal kilns, brushed over the rubble to seal the wind out and whiten the seaward face. It is an accent of thrift, not a clad finish — a sealing skin spared for where weather drives hardest, so it preserves over the grey field rather than replacing it. |
| wall.infill.cobble | `mossy_cobblestone` | base/preserve | 49 | Rounded beach cobble and shingle off the tideline pack the footings and the rough infill — sea-worn, weed-stained in its joints from the cold wet coast. It reads damper and more organic than the cleared fieldstone (L49), the strand's stone as opposed to the headland's. |
| wall.field.upper | `dark_oak_planks` | upper/dominant | 20 | The loft and gable are boarded, not built — softwood deals and boatyard offcuts lapped clinker-fashion and soaked in barrelled tar, the same craft that seals a hull. Timber here comes as thin boards, so it is spent on the light upper storey; the tar drives it black (L20), the truest dark of the village. |
| wall.dressing.quoin | `stone_bricks` | upper/preserve | 51 | Squared dressed stone is dear — it appears only where the community pools its money, worked by a mason. On an ordinary frontage it surfaces sparingly as quoins and worked jambs at corners and doorways, the one place rough rubble can't turn a clean edge. Scarce by economy, so preserve, never field. |
| roof.field | `dark_oak_planks` | roof/dominant | 20 | The signature saltcrag cover: riven pine and spruce shingle, split thin and blackened with pitch — the roof of the better cottages and skippers' houses. It answers the gale and shares the boatyard's tar identity with the cladding, reading dead black at L20 across the whole pitch. |
| roof.course.stairs | `dark_oak_stairs` | roof/preserve | — | The pitched run of tarred shingle, coursed up the slope — split softwood lapped against the wind, blackened with the same pitch as the field so the courses read as one tarred skin. |
| roof.course.slab | `dark_oak_slab` | roof/preserve | — | The flat shingle course at eave and shallow break — the same riven, tarred softwood laid level where the pitch eases, member of the roof family with the field and stairs. |
| roof.ridge | `deepslate_tiles` | roof/preserve | 23 | Slate is the prestige cover, landed costly by boat and saved for the church and merchant frontages — but a single bought course can cap the ridge, the most beaten seam of a tarred roof. Spent where it earns its keep and nowhere else; dark grey at L23, it sits honestly against the black shingle. |
| roof.field.thatch | `hay_block` | roof/preserve | 58 | The modest cottage that can't run shingle pins down steep reed and marram cut from the dune and salt-marsh — cheap, local, raked against the gale. It belongs in the roofscape as the poorer neighbour's pitch, a preserve alternate to the tarred dominant. |
| roof.field.turf | `moss_block` | roof/preserve | 43 | The poorest and most exposed outbuildings are turfed — sod cut from the thin coastal soil over a bark underlayer, cheap and stormproof. Green-grey living roof (L43), the bottom rung of the roofing economy held on the byre and net-store. |
| door.main | `spruce_door` | — | — | Doors are joined from sawn softwood deal landed across the sea — the only milled timber a fishing family buys — and tarred where they face the weather. Plain pine board, no proud oak in this country. |
| window.glazing | `glass_pane` | — | — | Window glass is bought-in and small, set in a sawn-deal frame — a few panes where a curer or skipper can pay, kept tight against salt wind. The joinery is the imported deal; the glass is the rare indulgence it holds. |
| window.shutter | `spruce_trapdoor` | — | — | Most openings get a tarred deal shutter rather than glass — sawn softwood board, pitch-soaked, barred shut against the gale. Cheaper than glazing and the working norm on lesser windows. |
| opening.lintel | `spruce_log` | — | 17 | Heads over door and window are spanned with what the sea returns — driftwood baulks and salvaged ship-timber, tarry and dark (L17), too crooked for boards but sound enough to carry rubble above an opening. Salvage doing the structural work milled deal is too thin for. |
| chimney.stack | `cobblestone` | — | 53 | The hearth that warms the cottage and dries the catch is stacked from the same gathered fieldstone as the walls, bedded in lime — rough rubble carried up around the flue. Fire here is met with what the headland gives, not with dear fired brick. |
| chimney.cap | `stone_bricks` | — | 51 | The one place a humble stack earns worked stone: a dressed capstone at the chimney head, where weather attacks hardest and rubble won't hold a clean weathering. A scarce mason's touch, spent because fire and gale together demand it. |

## Value evidence — near-tone separation (same-family cube pairs; weighted w=2, true ΔE76 beside)

- stone: wall.field.ground (`cobblestone`) vs chimney.stack (`cobblestone`) — weighted 0, true 0
- planks: wall.field.upper (`dark_oak_planks`) vs roof.field (`dark_oak_planks`) — weighted 0, true 0
- stone: wall.dressing.quoin (`stone_bricks`) vs chimney.cap (`stone_bricks`) — weighted 0, true 0
- stone: wall.field.ground (`cobblestone`) vs wall.dressing.quoin (`stone_bricks`) — weighted 2.51, true 2.2
- stone: wall.field.ground (`cobblestone`) vs chimney.cap (`stone_bricks`) — weighted 2.51, true 2.2
- stone: wall.dressing.quoin (`stone_bricks`) vs chimney.stack (`cobblestone`) — weighted 2.51, true 2.2
- stone: chimney.stack (`cobblestone`) vs chimney.cap (`stone_bricks`) — weighted 2.51, true 2.2
- stone: wall.dressing.quoin (`stone_bricks`) vs roof.ridge (`deepslate_tiles`) — weighted 28.15, true 28.15
- stone: roof.ridge (`deepslate_tiles`) vs chimney.cap (`stone_bricks`) — weighted 28.15, true 28.15
- stone: wall.infill.cobble (`mossy_cobblestone`) vs wall.dressing.quoin (`stone_bricks`) — weighted 29.15, true 14.74
- stone: wall.infill.cobble (`mossy_cobblestone`) vs chimney.cap (`stone_bricks`) — weighted 29.15, true 14.74
- stone: wall.field.ground (`cobblestone`) vs roof.ridge (`deepslate_tiles`) — weighted 30.27, true 30.24
- stone: roof.ridge (`deepslate_tiles`) vs chimney.stack (`cobblestone`) — weighted 30.27, true 30.24
- stone: wall.field.ground (`cobblestone`) vs wall.infill.cobble (`mossy_cobblestone`) — weighted 30.71, true 15.87
- stone: wall.infill.cobble (`mossy_cobblestone`) vs chimney.stack (`cobblestone`) — weighted 30.71, true 15.87
- stone: wall.infill.cobble (`mossy_cobblestone`) vs roof.ridge (`deepslate_tiles`) — weighted 38.72, true 29.44

## Proportions

- storeys 3–4 blocks; pitch classes [2,1,0.5]; opening spacing 3–6 cells

## Idioms (owned brushes; params seeded mechanically — verify before relying on them)

- `chimney` — {"block":"cobblestone","cap":"crown","capBlock":"stone_bricks"}
- `course.slab` — no seeded params
- `course.stairs` — {"block":"dark_oak_stairs"}
- `head.flat` — {"block":"stone_bricks"}
- `opening-dressing` — no seeded params
- `plinth` — {"block":"stone_bricks"}
- `roof.gable` — {"blocks":{"field":"dark_oak_planks","stairs":"dark_oak_stairs"}}
- `surface.fill` — no seeded params
- `surface.paint` — no seeded params
- `surface.roof-courses` — no seeded params
- `surface.strip-salt` — no seeded params

## Brush needs (new work this style asks for — the T-131 factory's input)

- NEW: `surface.weatherface` — Paints the limewash finish (white_terracotta) onto only the windward/seaward elevation of a cottage, sealing the grey rubble where weather drives hardest while preserving the field everywhere else.
- NEW: `surface.clinker` — Breaks the upper-storey board face (dark_oak_planks) into horizontal lapped weatherboard courses, casting the clinker shadow-line that reads as tarred boatyard cladding rather than a flat black wall.
- NEW: `dressing.quoin` — Lays squared dressed stone (stone_bricks) as an alternating long-and-short quoin up each external vertical corner of the rubble walls — the one place rough cobble can't turn a clean edge.
- NEW: `roof.thatch` — Builds a steep, thick thatched roof (hay_block) with overhanging eaves and a rounded ridge roll — the poorer cottage's raked-reed pitch in the saltcrag roofscape.
- owned `roof.gable`: Gabled cottage / skipper's-house roof in tarred dark_oak shingle, capped at the ridge with a single bought slate course.
- owned `course.stairs`: roof.course.stairs — the tarred shingle run coursed up the slope.
- owned `course.slab`: roof.course.slab — the flat shingle course at eave and shallow break.
- owned `surface.roof-courses`: Coat the whole pitch into lapped stair+slab courses (the tarred-shingle roof skin).
- owned `head.flat`: opening.lintel — flat head over door/window spanned in salvaged ship-timber.
- owned `opening-dressing`: Worked jambs at doorways plus door, glazing, and shutter placement (stone_bricks jamb, spruce_door, glass_pane, spruce_trapdoor).
- owned `chimney`: chimney.stack + chimney.cap — fieldstone flue with a dressed capstone.
- owned `plinth`: wall.infill.cobble — beach-cobble footing / rough infill course at the wall base.
- owned `surface.fill`: Rough rubble field walls — grey fieldstone ground storey, tarred boards on the light upper storey.
- owned `surface.paint`: Keep scarce materials from being fielded over (quoins, jambs, limewash).
- owned `roof.gable`: roof.field.turf — green-grey living sod roof on the poorest outbuildings (byre, net-store).
- owned `hollow + floorplan`: Hollow the cottage shell and lay storey floors at the 3–4 block storey height.
- owned `surface.strip-salt`: Clean stray single-block specks left by quoining / clinker lapping.

## Taste checklist (before ratifying)

- [ ] every rationale reads from the story (craft and economy), never just the color
- [ ] near-tone pairs above are separable at a glance (the weighted distance is honest)
- [ ] each band's dominant is what the style should read as from the street
- [ ] proportions match the imagined place (storeys, pitch, opening rhythm)
