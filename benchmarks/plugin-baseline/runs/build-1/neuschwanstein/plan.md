# Neuschwanstein — plan (grid 112 x 76 x 52; x east, y up, z south; FRONT = NORTH, z=0)

Started 23:57 (session 1, 60 min). Run: `node build.mjs` (all parts; `LEVEL=1` = massing + shell only). Output build.nbt via tmp+mv.

## Site / levels
- Crag: heightfield of grey rock (stone / andesite / tuff / cobble), steep falloff from the platforms. Lower terrace top block y=10
  (buildings start y=11), upper terrace top block y=16 (buildings start y=17). Approach ramp of stairs at the gate (z 0..4).
- Retaining walls (stone-brick, battered with stairs) at the terrace edges and on the crag faces.

## Masses (x0,z0 .. x1,z1 inclusive; y0 = floor, wall top, roof)
| part | footprint | y0 | wall top | roof |
|---|---|---|---|---|
| Gatehouse (red brick, white trim) | 46,4 .. 64,14 | 11 | 30 | crenellated parapet, arch gate x53..57 |
| Gate towers W / E (round white, r4) | centre 44,6 / 66,6 | 11 | 36 | tower-cap cone, dark slate |
| Curtain walls (calcite, crenellated) | W x22..23, E x88..89, z8..29; front z8..9 x22..40 & 70..88 | 11 | 19 | parapet crenellated |
| Lower courtyard | x24..87, z10..29 | 10 floor | | |
| Retaining wall between terraces | z 30..31, x 20..90 | 11 | 16 | |
| Upper courtyard | x39..58, z32..50 | 16 floor | | |
| Palas (white limestone) | 60,32 .. 104,47 + front cross wing 76,25 .. 90,32 | 17 | 45 | steep dark-slate gable (civic preset overridden to gable/steep), stepped gables E/W/N-wing |
| Stair turret (round, r3) | centre 65,29 | 17 | 63 | tower-cap spire to y=75 |
| Corner turrets (round, r2) | (60,32)? NE/SE/SW of Palas: (104,33) (104,47) (60,47) + wing corners | 17 | 52 | tower-cap cone |
| Main tower (square 9x9) | 51,33 .. 59,41 | 17 | 52 | gallery ring at y 47, pyramid cap to ~64 |
| Knights' House | 20,34 .. 38,46 | 17 | 31 | steep gable ridge z |
| Bower (square) | 8..18, 38..48 | 17 | 36 | pyramid/hip cap |

## Palette by role
- walls: calcite (Palas, towers, curtain); trim: smooth_quartz / polished_diorite; quoins: stone_bricks
- gatehouse: bricks, trim smooth_quartz, parapet bricks
- roofs: dark-slate palette (pyramid/cone/gable), ridge crest iron bars, finials gold_block / lightning rod
- windows: glass_pane in arch brush openings, surround quartz; accents: lanterns, Bavarian lozenge banners (light_blue/white), gold finials
- rock: stone, andesite, tuff, cobblestone, mossy_cobblestone

## Shared vocabulary (parts/shared.mjs)
`archWindow` (pointed arch, 2 wide x 5 high, glass, quartz sill), `slitWindow`, `turretCap` (tower-cap cone on dark-slate + gold finial), `cornice` (smooth_quartz upside-down stairs), `battlement` (crenellated parapet).

## Code split
parts/shared.mjs, rock.mjs, gatehouse.mjs, curtain.mjs, palas.mjs, towers.mjs, wings.mjs; build.mjs runs them in order.

## Checklist (most visible first)
- [x] rock crag + terraces
- [x] Palas massing + roof + stepped gables
- [x] Stair turret + spire; corner turrets + caps
- [x] Main tower + gallery + cap
- [x] Gatehouse + gate towers + caps + arch
- [x] Curtain walls + courtyards + retaining walls
- [x] Knights' House + Bower
- [x] Windows on every side, balcony, banners, lanterns
- [x] check / palette / render closeups / fixes
- [x] gaps.md

## Status (end of session 1, ~00:14, finished)
All checklist items done. Generator: `node build.mjs` (LEVEL=1 for massing only). build.nbt = 112x76x52, spire top y=75.
Deviations from the table: gatehouse z 7..15 (shifted back 4 so the crag can fall away in front), terraces at y10/y16, Palas ridge y59,
wing 79..87 x 22..31 on a podium, stair turret centre (65,29) from y11, 9 slender turrets (Palas corners, wing corners, Knights' House N corners, Bower N corners),
roof presets: tower-cap (every cone and pyramid), cottage (Knights' House), civic overridden to steep gable + dormers + chimneys (Palas).
Ideas for a later session: gold finials, true gothic window heads, interior floors, a Marienbrucke, more courtyard life.
