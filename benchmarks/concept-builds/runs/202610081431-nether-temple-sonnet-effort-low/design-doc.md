# Nether Temple: Design Document

## 1. Identity
A stepped blackstone ziggurat shrine, a gilded ceremonial temple on a lava-ringed platform. Its symmetry, gold-on-black contrast and crimson-lit recesses make it read as sacred and ominous.

## 2. Palette by role
- **Dominant: `polished_blackstone_bricks`** (stairs, slabs and walls in the same stone). Nether builders would quarry blackstone, so it is the native masonry. It makes one dark mass and lets the gold carry the eye.
- **Supporting: `nether_bricks` / `red_nether_bricks`.** They line the recessed bays and roof bands and give a warm crimson undertone in the shadows.
- **Accent: `gold_block` and `gilded_blackstone`.** Gold trim is the temple's wealth and rank. Use it only on the portal frame, cornice lines and spire cap, so it stays rare.
- **Structure: `basalt` / `polished_basalt`** pillars, because basalt is the Nether's natural columnar stone.
- **Light and hazard: `lava`, `soul_fire` on `soul_soil`, and `warped_wart_block` or `warped_planks` accents.** The cyan flame against the red-gold scheme is the focal contrast.

## 3. Massing & roof
- A 21×21 platform ring, with a 2-wide lava moat at the edge and a 1-block blackstone curb.
- **Tier 1** is 17×17 and 5 tall, the colonnaded hall.
- **Tier 2** is 13×13 and 4 tall.
- **Tier 3** is 9×9 and 3 tall.
- The tiers step in by 2 per side, each ending in a stair-course roof (`polished_blackstone_brick_stairs`) with a slab drip edge. The tier 1 roof overhangs 1 block.
- A **central spire** rises on a 5×5 gold-trimmed drum. It is a stair-stepped pyramid narrowing to a 1×1 `chiseled_polished_blackstone` shaft, topped with a gold block and a `lightning_rod`-style `crying_obsidian` finial, about 24 tall in total.
- Reasoning: the stepped profile gives the ziggurat silhouette, and each setback catches the gold trim.

## 4. Facade composition
- The front is symmetrical about x = 10, with a **3-wide central portal**, a 1-block gold frame and a 5-high arch.
- The portal opens into a crimson nether-brick recess.
- On each side there is one bay with a shallow arched niche, **recessed 1** and lined with red nether brick.
- Four basalt columns stand between the bays, each 5 tall with a gold capital.
- The base is a 2-high plinth of polished blackstone, the middle is the bays, and the top is a gold cornice line under the roof.
- The upper tiers repeat the portal axis, with a gilded window slit centered over the door.

## 5. Depth plan
- The **grand stair** is 5 wide, centered, and runs from z = −3 to the portal, rising over the moat on a blackstone causeway.
- The columns project **1** from the wall.
- The portal is recessed **2**, and the bay niches **1**.
- The cornice and roof overhang by **1**.
- Corner buttresses project 1 at each tier, which breaks the flat walls.
- Front recesses are made by not placing the front material.

## 6. Detail & life
- **Basalt pylons** with `soul_campfire` or `soul_fire` braziers stand on the stair's cheeks, with two more at the platform corners.
- `chain` and `lantern` pairs hang from the cornice at the portal frame and the outer columns.
- Polished-blackstone frieze bands use `chiseled_polished_blackstone` and `crimson_nylium`-red accent blocks.
- Warped-wart-block spots sit in the spire drum, with `shroomlight` glowing in the gaps.
- `blackstone_wall` rails line the stair, and lava gives the whole structure its glow.
- The back is plain blackstone with a repeated cornice.
