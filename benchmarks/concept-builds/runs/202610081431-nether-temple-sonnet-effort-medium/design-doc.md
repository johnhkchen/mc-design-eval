# Nether Temple — Design Document

## 1. Identity
A stepped blackstone ziggurat shrine, ceremonial and ominous. Dark mass, gold-trimmed edges, crimson/warped inlay, lit by soul-fire. It stands on a lava-ringed platform and rises to one gilded spire.

## 2. Palette by role
- **Dominant — `polished_blackstone_bricks`** (walls, tiers, steps) with `blackstone` and `cracked_polished_blackstone_bricks` for weathering. The Nether's native stone gives a heavy, quarried mass.
- **Supporting — `basalt` / `polished_basalt` pillars** (axis y) and `nether_bricks` / `red_nether_bricks`. Basalt reads as a different, columnar stone. Red nether brick fills the recessed panels as a deep wine tone.
- **Accent — `gilded_blackstone` and `gold_block`** for trim, door jambs and finial. This is the temple's wealth, and it appears only at edges and thresholds. Warped (`warped_wart_block`, `warped_planks`) and `crimson_planks` appear in small inlays on the spire.
- **Light — `soul_fire` on `soul_soil` in braziers**, plus `lantern` / `soul_lantern` on `chain`.
- **Moat — `lava`**, which is also a light source.
- Relationship: black mass, with gold as the line and teal and crimson as small jewels.

## 3. Massing & roof
- **Platform:** 21×21, a lava ring 2 wide at the edge. Inside it sits a blackstone base slab at y=1.
- **Tier 1** (x 2–18, z 2–18): a hall block, walls y 1–7. Its roof is a deep hipped stair course with a 1-block overhang. It uses `polished_blackstone_brick_stairs` with outward `facing`, topped with `half=top` stairs on the eaves for a lip.
- **Tier 2** (x 5–15): walls y 8–13, then an inset step in slabs.
- **Tier 3** (x 8–12): walls y 14–17, then a pyramid of stairs.
- **Spire:** a 3×3 lantern pavilion at y 18–20. It has a red/warped brick band, `gold_block` corner brackets and four `glowstone` windows. Above it rise a stair needle, a `gold_block` cap and a `crimson_fence` pin to y≈24.
- Each setback is capped with a `blackstone_slab` ledge. This makes the stepped silhouette read from the street.

## 4. Facade composition (front, −z)
- **Three bays:** a central portal 3 wide and 5 tall, flanked by two side bays, each holding a 3-wide arched alcove.
- The portal is framed in `gilded_blackstone` jambs and a gold lintel peaked with stairs. Inside it is dark `red_nether_bricks`.
- Side alcoves hold `red_nether_bricks` panels under blackstone-stair arches. Gold lintel strips run above them.
- The four basalt pillars sit on the bay lines, each with a base slab and a cap. The portal jambs sit on the same x axis as the stair edges.
- **Base / middle / top:** a stepped plinth / pillared bay with gold bands / a frieze of `chiseled_polished_blackstone` and `red_nether_bricks` vents under the eaves.

## 5. Depth plan
- The grand stair projects 5 deep over the lava (z −3 to 2), 5 wide, in `polished_blackstone_brick_stairs` with `facing=south`. It has `blackstone_wall` cheeks.
- Pillars project 2 in front of the wall plane. The portal recesses 2 behind it.
- Alcoves recess 1. Tier eaves overhang 1. The spire brackets project 1.
- Side stairs and the back stay simple. The back gets a plain wall, a frieze, and an optional small door.

## 6. Detail & life
- **Pillar-top braziers:** `soul_soil` plus `soul_fire` on `polished_blackstone_wall` posts, one at each stair head and each corner (6 in all).
- `chain` + `lantern` pairs hang from the pillar caps at the facade corners. `soul_lantern` sits inside the portal.
- Gold `chiseled` bands wrap each tier. `blackstone_button` studs mark the frieze.
- Lava glows around the platform. `crimson_roots` and `warped_roots` grow on `nylium` planters beside the stair, a rare touch of life.
- Finish with `gilded_blackstone` pyramid trim on the corner edges, so the silhouette glints at dusk.
