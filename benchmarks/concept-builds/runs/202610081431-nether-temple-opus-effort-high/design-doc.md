# Nether Temple: The Gilded Ziggurat of the Basalt Deltas

## 1. Identity
A piglin-built votive shrine of quarried blackstone, edged in gold, rising in three steps from a lava moat to a glowing spire.

## 2. Palette by role
- **Dominant:** `polished_blackstone_bricks` (+ stairs/slabs). This is the delta's native stone, dressed into courses, and it is what bastions are built from.
- **Supporting:** `red_nether_bricks` for the recessed wall panels and roof window bands, since fired wart brick is the warm, ritual infill. `polished_basalt[axis=y]` for the columns, because basalt already grows in natural pillars.
- **Accent:** `gold_block` and `gilded_blackstone`, because gold is the piglins' offering. Gold appears only on edges and frames, never across a wall field. `warped_wart_block` and `shroomlight` are used at the spire only.
- **Relationship:** a dark masonry body with warm red set into it, gold on every edge, and cold soul-blue fire set against the orange lava.

## 3. Massing and roof
- **Platform (x 0–20, z 0–20):** a blackstone rim with a 1-wide lava channel (ring 1) set flush at y=0.
- **Tier 1, the plinth:** three stepped courses (y 1–3), each inset by 1.
- **Tier 2, the hall:** 13×13 (x 4–16, z 4–16), walls y 4–10. A hipped roof of brick stairs (`half=bottom`, facing outward) steps in 1 per course from y 11 to 15, with a red-brick window band on the second course.
- **Tier 3, the pavilion:** 7×7 (y 16–19) with gold corner posts and its own stepped cap.
- **Spire:** y 20–24, a warped and shroomlight lantern stage, a `gold_block` cap, and a `polished_blackstone_wall` needle on top.

## 4. Facade composition (front, −z)
- **Grand stair:** x 8–12, 5 wide, `polished_blackstone_brick_stairs[facing=south,half=bottom]`. It bridges the lava at z=1 and climbs the plinth.
- **Hall front, symmetric bays:** basalt x4 | red bay x5–7 | gold pilaster x8 | **portal x9–11** | gold pilaster x12 | red bay x13–15 | basalt x16.
- **Portal:** 3 wide and 5 tall. Its head is upside-down stairs (`half=top`) forming a stepped arch, and gold continues up to a peaked gable in the roof.
- **Base / middle / top:** a gilded blackstone base course; red panels with arched niches; a `chiseled_polished_blackstone` frieze at y 9; a gold eave band at y 10.
- The stair, portal, pavilion gable and spire all sit on the axis x=10.

## 5. Depth plan
- **Basalt columns:** project +1 (z=3).
- **Red panels:** recessed 1 (z=5). Carve them by leaving the front wall unplaced, not by filling behind it.
- **Niches:** recessed a further 1.
- **Portal:** door plane recessed 2 (z=6), so it reads as a dark mouth.
- **Eave:** overhangs walls by 1 with gold underneath.
- **Roof courses:** each steps back 1, which gives the ziggurat silhouette.
- **Sides:** the same as the front, except the portal becomes a blind gold-framed niche. The back is plain bays.

## 6. Detail and life
- **Braziers:** eight `polished_basalt` pillars on the plinth corners and flanking the stair (x7, x13), each 3 tall. Each is capped with `soul_campfire[lit=true,facing=south]`.
- **Chains:** `chain[axis=y]` hang 3 long from the four eave corners, ending in `lantern[hanging=true]`.
- **Niches:** each holds a `lantern` on a gilded blackstone sill. A `crimson_trapdoor[half=top,open=false]` forms the lintel.
- **Spire glow:** `shroomlight` windows in the spire stage are the beacon you see from the street.
- **Moat edge:** one `polished_blackstone_brick_slab[type=bottom]` lip so the lava reads as a contained, ceremonial channel.
