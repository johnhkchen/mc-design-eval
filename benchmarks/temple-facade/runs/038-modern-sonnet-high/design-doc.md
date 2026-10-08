**1. Identity**
Triumphal Arch (Arc de Triomphe) front elevation, recolored in teal, orange, yellow and cream. Single bay, arched, with relief sculpture and a crenellated attic.

**2. Size**
- Width: 50 at the cornice (x 0–50). The body is 48 wide (x 1–49).
- Height: 48 to the top of the attic, plus a 2-block crown, so 50 overall.
- Relief depth: 6 (−1 recess to +5 projection, measured from the body face).
- Scale: ~11.5 sheet px per block.

**3. Vertical zones (y from ground)**

| Zone | y |
|---|---|
| Plinth steps | 0–2 |
| Pier base | 2–5 |
| Pier shaft with sculpture | 5–20 |
| Teal frieze band | 20–22 |
| Orange impost cornice | 22–24 |
| Upper storey (panels and arch crown) | 24–34 |
| Entablature | 34–42 |
| Attic | 42–48 |
| Crown | 48–50 |

- **Entablature:** architrave 34–35, inscription frieze 35–38, dentils 38–40, cornice 40–42.
- **Attic:** base band 42–43, panel 43–46, cornice 46–48.
- **Crown:** crenellation.

**4. Horizontal bays (x)**
- Left pier: x 1–17 (16 wide).
- Arch opening: x 17–32 (15 wide). It is a semicircle, radius 7.5, springing at y 24 and crowning at y 32.
- Right pier: x 32–48 (16 wide).
- The voussoir ring is 2 blocks thick around the opening, so the ring runs to x 15 and x 34.
- Above the impost, the left relief panel is x 5–15 and the right panel is x 35–45. Each is 10×6 at y 25–31.
- Spandrels fill the space between the panels and the arch ring, with flying figures in teal and orange.

**5. Features**
- **Keystone mascaron:** x 24–26, y 32–34, orange, projecting.
- **Sculpture groups:** left x 5–14 and right x 36–45, both y 8–19. They are teal and orange figure clusters on a pedestal ledge at y 6–7, with a 1-block orange moulding. The cream base below (y 2–5) carries a faint checker pattern.
- **Relief panels:** orange figure frieze inside a teal frame, with a 1-block border.
- **Attic:**
  - Teal pilasters, 1×3, at x 3, 7, 11 … 47 (every 4 blocks).
  - A gold rosette block between each pair of pilasters at y 44.
  - Orange base and cornice bands above and below.
- **Entablature:** the teal frieze carries a gold-and-orange inscription (a small gold plaque at x 24–26, y 36). Alternating orange dentils sit under the cornice.
- **Crown:** a teal crenellation of 1-wide merlons with 1-wide gaps, plus a low orange centre strip at x 20–30.
- **Plinth:** teal steps, orange line on the second step.

**6. Palette (block ids)**
- **Yellow upper storey:** `yellow_concrete`, with `yellow_terracotta` as an accent.
- **Cream piers and base:** `cut_sandstone` and `smooth_sandstone`, with `chiseled_sandstone` for the checker pattern.
- **Teal trim** (steps, impost frieze, voussoirs, panel frames, pilasters, merlons, frieze, figures): `dark_prismarine` and `warped_planks`, with `warped_stairs` and `warped_slab` for mouldings.
- **Orange** (cornices, mouldings, figure highlights, dentils, keystone): `orange_terracotta` and `acacia_planks`, with `acacia_stairs` and `acacia_slab`.
- **Gold:** `gold_block` for the rosettes and inscription plaque.
- **Arch opening:** air.

**7. Depth plan**
Depths are relative to the body face (0). Projections are positive and recesses negative.

- **Plinth:** steps project +2 and +1.
- **Pier base and shaft:** at body face (0).
- **Sculpture groups:** project +2, with figures stepping to +3 at the heads. The pedestal ledge projects +1.
- **Impost cornice:** +2, with stair undersides.
- **Relief panels:** frame at +1, interior recessed to −1, figures raised back to 0.
- **Arch:**
  - Opening cut through the full depth.
  - Voussoir ring stepped in two 1-block rings, projecting +1 and +2.
  - Keystone at +3.
  - Soffit as a coffered barrel vault, 4 deep.
- **Entablature:**
  - Architrave at +1 and frieze recessed to −1.
  - Dentils alternate between +1 and 0.
  - Cornice projects +4, with `acacia_stairs` upside-down underneath.
- **Attic:**
  - Panel recessed to −1 with pilasters at 0.
  - Cornice projects +3.
- **Crown:** merlons rise 1 above the cornice, set back 1.

Recesses are carved by omitting the front material, not by burying blocks.
