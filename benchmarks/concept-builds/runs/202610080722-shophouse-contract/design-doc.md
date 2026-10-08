# Shophouse: The Redstone Exchange, design document

**1. Identity.** A timber-framed shophouse, built by a craftsman over the three limewashed stall bays below. Its frame and roof come from the concept art, and the shop's lamps are its sign.

**2. Palette by role**
| Role | Block | Reason |
|---|---|---|
| Dominant (infill) | `oak_planks` | A warm local softwood that a market-town joiner would have on hand. It matches the honey tone of the concept. |
| Supporting (frame) | `dark_oak_log` posts (`axis=y`), `stripped_spruce_log` beams (`axis=x` or `z`) | Heavy, dark structural timber. It frames the light infill. |
| Roof | `spruce_stairs` / `spruce_slab` | Shingles, a shade darker than the walls, the same brown family as the concept roof. |
| Accent | `redstone_lamp` (`lit=true`), `glass_pane`, `flowering_azalea` | The trade itself is the ornament: lamps for signage, glass and green for life. |

The fixed `white_concrete` stall walls read as a limewashed masonry base. Dark timber above it on white is the classic half-timber contrast.

**3. Massing and roof**
- **Body:** one 12×12 block. The ground storey is the machine's; the timber storey runs y 5–9.
- **Roof:** a side-gabled roof with its ridge along x at z 5–6, y 13. Courses alternate stair and slab (half pitch), so the 6-cell slope stays within the height limit.
- **Front eave:** the only projection, a `spruce_stairs` course (`facing=south,half=bottom`) at z = −1, y 10. This sits exactly at the street-clearance line.
- **Back slope:** stairs `facing=north`.
- **Gables:** flush at x = 0 and x = 11, because nothing may go outside the lot. The triangles are plank infill with a `stripped_spruce_log` king post and a single pane vent at y 11.
- **Dormer:** a small one at x 5–7, z 1–2, with a pane at x 6, y 11, from the concept.
- **Chimney:** `bricks` at x 2, z 9, up to a `campfire` cap (`lit=true`) at y 13.

**4. Facade composition (front, z = 0)**
- **Posts:** `dark_oak_log` at x = 0, 4, 8 and 11, directly above the concrete stall walls. The ground and upper rhythms stay on the same columns.
- **Base (y 5):** a `stripped_spruce_log` bressummer beam spans every bay. Over the centre of each stall, at x = 2, 6 and 10, a `redstone_lamp` is set into it. This is the shop sign.
- **Middle (y 6–8):**
  - y 6 is a sill row of `oak_planks`.
  - At y 7–8, windows fill bays A (x 1–3) and B (x 5–7) and sit at x 9–10 in bay C. Panes use `east=true,west=true`.
- **Top (y 9):** a `stripped_spruce_log` wall plate. The eave shadow sits above it.

**5. Depth plan** (every front cell from y 5–9 is a solid block)
- **+1 cell:** the eave course at y 10 casts a shadow line across the whole front.
- **In-plane relief:** log bark against smooth planks against glass gives three different textures.
- **Sills:** under each window, a `spruce_stairs` (`facing=north,half=top`) sits in place of the y 6 plank. Its overhang lip reads as a corbelled sill without leaving the wall plane.
- **Side walls (x 0 and 11, y 5–9):** the same frame, with posts at z = 0, 4, 8 and 11. Each side has one window pair at z 5–6, y 7–8, so the walls read as finished above the neighbours.

**6. Detail and life**
- **Stall fronts:** left open, as the contract requires. The machinery is the shop display, and the lamps above name each bay.
- **Back-left yard (x 0–3, z 10–11):** a lean-to store with `spruce_slab` roof (`type=bottom`) at y 4. Under it: `barrel` (`facing=up`), a `composter`, and potted plants.
- **Back-right yard (x 9–11, z 10–11):** a quarter-turn `spruce_stairs` stair, with a `spruce_fence` rail, climbing to the owners' back door. That door is a `spruce_door` (`facing=south`, lower and upper halves) at x 10, z 11, y 6–7. A `lantern` (`hanging=true`) hangs over the landing, from the concept's side stair.
- **Back facade:** the same frame, with a `flowering_azalea` on the landing and a window box beside the door. This is the lived-in face toward the yard.
- **Smoke:** from the chimney: someone is home.
