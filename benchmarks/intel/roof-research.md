# Why AI-built Minecraft roofs fail the glance (research, no code changed)

Evidence: newest 8 runs in benchmarks/collection/runs/ (20261010 0412 and 0442 batches), roofs.mjs, roofs.md, cards.
Judge verdict: roof graded Major in 8/8 (v1 and v2 alike); no run improved between v1 and v2.

## 1. Root causes, ranked

1. **One flat material, no texture or gradient (all 8).** The roof tool places one `material` per roof
   (roofs.mjs: `mat`, `trim`, `verge`, `hips`; `pattern{material,every,offset}` is single banding, never used by any builder).
   Barn v2-card: ~300 identical deepslate-tile stairs = "single flat expanse of near-black stairs". Deepslate tile is
   mean RGB ~(55,55,55) (families.mjs:70), near black under any shading. Tea house, stave church, glass cafe: same.
   Wizard tower (teal oxidized copper) shows the same smooth uniform-plane problem in a lighter colour.
2. **Builders bypass the guard rails the tool has.** `contrast:false` in 6/8 (cafe, steampunk, tea house, stave church,
   wizard, barn pyramid cap); deepslate_tile in 6/8 (default `roofs.mjs` and `ALT_ROOF` first entry); presets used in only
   3 (cafe `modern`, barn `granary` overridden to gambrel, lighthouse `cottage`). `overhang:0` on the barn (to fit a size cap) removed eave and
   barge. Tea house passed `pitch:0.67`, giving "flat stepped planes". Nobody used `eave:"cornice"`, `soffit`, `dormers` on
   the big planes (barn, church, tea house). The reference (roofs.md) says "start from a preset" but offers none for
   barn, East Asian, church tiers, sawtooth, cone or dome; builders wrote it in gaps.md (barn, tea house, steampunk,
   church). Default fallback is dark slate lid.
3. **Missing forms, so builders improvise with hip/pyramid (5/8).** No curved eaves or upturned corners (tea house: the corner
   "flick" is four hand-placed full blocks, reads as horns), no cone/octagon/dome roof on a rect (wizard "wide shallow
   stepped pyramid", lighthouse "black bulging dome", market "stepped sand pile" at radius 3), no lean-to/skirt style
   around a taller core (church hip-over-everything then carve, so tiers read as "a lump on a lid"), no sawtooth
   (steampunk shed chained, `weathered_cut_copper` silently gappy), no per-side overhang (cafe), dormers silently dropped on
   pyramids (wizard gap), `chimney rise` measured from apex not local surface (floating chimneys in wizard, lighthouse).
4. **Proportion and mass: roof dwarfs or hides the body.** Tea house: overhang hides the walls (judge) with 9x7 span at 45
   degrees hitting the 9-high cap; barn side walls "almost hidden under the roof"; church base roof covers the whole box.
   Roof share of total height is 55-70% in barn, church, tea house.
5. **Judge and renderer amplify, but do not invent, the problem.** The 3/4 isometric view shows mostly top faces, so a
   uniform dark plane dominates the frame (barn card). The wizard cone is tall in elevation (v2 card lower right) yet reads
   "flat lid" in 3/4: a 4-sided stepped pyramid with 1-cell overhang is boxy. Render is not unfair (stair tops/sides shade
   consistently; I saw no side-shading artefact), but at ~18px per block the deepslate texture detail vanishes, so only
   block-to-block colour variation reads. The judge also contradicts itself (cafe v1 "thin, light fascia" vs v2 "one quiet
   material"), and suggests tools that do not exist ("sawtooth preset").

## 2. What good roofs need (concrete specs)

- **Texture mix (the biggest single win).** 2-4 materials in one family, seeded-random or banded, 70/20/10: deepslate:
  deepslate_tile 70, cobbled_deepslate 15, polished_blackstone_brick 10, cracked tiles 5; spruce shingle: spruce 60, dark_oak 25,
  stripped dark_oak 15; terracotta: red/brown/orange 60/30/10; copper: weathered/oxidized cut_copper 50/50 in
  rows, not noise. Every course, not every block, may also alternate stair/slab for a shingle rhythm.
- **Gradient along the slope:** darker at eaves (dark_oak or blackstone course), lighter/brighter toward ridge, 1-2 courses
  of accent at each end. Aim for visible tone change of >=0.15 between eave course and the middle.
- **Eave edge profile:** 1-cell overhang (2 if span>=15), outer course in upside-down stairs of trim material, a slab
  or trapdoor fascia under it, soffit slab in lighter timber; bargeboard (verge) in a contrast block on gables; ridge: slab
  or stair-inverted cap in a distinct block; hip ridges accent stair line.
- **Pitch by type:** cottage/barn lower slope 1.5-2:1, upper 0.5; tea house/pagoda low 0.5-0.67 with curve; tower caps 2.5-3:1
  with a flared base; civic hip 1:1; terracotta/desert flat with 1-high parapet. Roof height <= 0.6 x wall height for
  single storeys unless the type is steep by design.
- **Break big planes:** any slope >=10 cells long needs a dormer/skylight/cross-gable/chimney; a visible break line (gambrel
  slab step in a different block); a ridge cap; a chimney attached to the local surface with a base block.
- **Curved/odd:** upturned corners = last 2 eave cells rise a half-step each (stair, then slab, then full) with a
  rafter-end trapdoor row; cone = per-ring radius from a concave profile (circle rings, not square rings), 2.5+ rise per ring;
  dome r>=4 minimum, otherwise use a cone; stave church = 2-3 stacked roofs, each steeper (1:1 to 2:1), each with a vertical
  wall band between and overhang 1; sawtooth = repeating shed with glazed vertical face; gambrel break at 40% of the span.
- **Flat roofs:** 1-2 course parapet in a different block from the deck, coping slab, 1-2 clusters of props only (not a
  scatter), a distinct deck material and edge shadow line.
- **Colour:** roof should contrast the wall by tone >=0.3 but not be black by default: slate grey (stone brick, cobbled deepslate
  mix) beats pure tile; warm themes use spruce/dark oak/terracotta; coastal uses weathered copper; avoid a roof darker than
  everything else on a dark-wall building.

## 3. Where each fix belongs

| cause | fix site |
|---|---|
| 1 flat material | **Tool**: `material` accepts a weighted list or `texture:{mix:[[block,w]...], seed, gradient:"eave-dark"}`; default presets ship mixes. Reference lists palettes. |
| 2 bypass | **Tool**: `contrast:false` should warn in notes; ban the `deepslate_tile` default (use a mixed slate); overhang 0 should warn; ensure `roof()` returns a `lookNotes` (single material, no eave, no ridge). **Builder prompt**: preset-first rule, never `contrast:false` without a stated concept reason. |
| 3 missing forms | **New features**: `cone`/`octagon` style, `curved-eave` (upturn), `lean-to` skirt, `sawtooth`, `tiers` (stacked roofs), per-side overhang, dormer on pyramids or loud drop note, chimney from local surface; presets `barn`, `pagoda`/`irimoya`, `church`, `tower-cap`, `workshop-sawtooth`. |
| 4 proportion | **Tool defaults**: `maxHeight`, roof/wall ratio cap per preset, dry-run height report. **Builder guidance**: size budget table by type. |
| 5 renderer/judge | **Renderer**: add a roof close-up tile (roof-only 2x zoom) so texture is visible; consider slightly lifting deepslate tile tone. **Judge**: grade against the concept's roof, ask for existing tools only, keep v1/v2 advice stable. |

## 4. Test cases for a fixed toolkit

1. Red barn, 15x21, gambrel along z: lower 1.5:1/upper 0.5, mixed slate or dark-red shingle, 1-block overhang with stair edge,
   white barge, ridge cap, 2-3 dormers per side, cupola; side walls visible.
2. Tea house, 13x11: irimoya with upturned corners, 0.67 pitch, 2-3 tile tones, front gablet, wall still visible under eaves.
3. Wizard tower cap, 9x9: round or octagonal cone, >=2.5:1, concave flare, lean, dormer works, 3/4 view reads as a hat.
4. Stave church, 3 tiers: lean-to skirt + 3 stacked steeper roofs, each with overhang and wall band, dragon heads at ridges.
5. Desert market, flat 14x10: parapet with coping in different block, one dome (r>=4) or wind tower, sparse props.
6. Glass cafe, flat cantilever: thin 1-slab fascia in light block, timber soffit visible, per-side overhang 2/1.
7. Steampunk workshop, 3 bays: sawtooth with glazed vertical faces, copper in gap-free stairs/slabs, tall banded chimney.
8. Lighthouse lantern cap: shallow cone with ring course and overhang, plus a keeper cottage gable that does not run up the tower.

Pass bar: stranger glance does not name the roof Major on any of 8; the roof shows >=3 distinguishable tones, a lit edge line,
and one deliberate break (dormer, ridge cap, tier or chimney).
