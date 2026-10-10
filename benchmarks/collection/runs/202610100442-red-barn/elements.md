# Red farm barn — element map (front faces NORTH, x along the front)

Identity: a classic American gambrel farm barn, red board walls, white trim, dark slate roof, fieldstone footing; the
gable end (north) is the showpiece. Palette: red terracotta walls ~55% (barn red), deepslate tile roof ~25% (dark slate),
white (quartz/white concrete) trim ~10%, stone/cobble foundation + dark oak timber + hay yellow accents ~10%.
Grid 15 wide (x0..14) x 21 deep (z0..20) x ~15 high; barn body z2..20, z0..1 is the farmyard apron with fence and hay.

| # | Element a viewer recognises | Real Minecraft thing |
|---|---|---|
| 1 | Gambrel roof (steep lower slope, shallow upper), dark slate, white barge boards | `roof()` granary preset overridden to style `gambrel`, deepslate_tile, quartz verge, dormers on the long sides |
| 2 | Big sliding double doors, white X braces, white frame, track beam | recessed red leaves with white diagonal X (quartz blocks) in a white frame, dark oak track beam + iron-bar/chain hangers above, center post |
| 3 | Hay loft door in the gable with hoist beam | white-framed opening, open spruce trapdoor shutters, hay_blocks inside; dark oak log hoist beam jutting out over it, chain + hay_block hanging |
| 4 | Cupola with weather vane on the ridge | 3x3 red cupola with white trapdoor louvres, `roof()` pyramid cap in deepslate, fence mast + iron-bars arrow + lightning rod |
| 5 | Stone foundation | stone_bricks/cobblestone/mossy mix plinth course, doors cut through it, stair-edged |
| 6 | Hay bales | hay_block stacks (real block) at the front corners and inside the loft door |
| 7 | Wooden fence | oak_fence rail around the yard with gate, in front and wrapping the corners |
| 8 | Small windows with white surrounds | glass panes in white frame + open trapdoor shutters, flanking the doors; windows on sides/back |
| 9 | Lanterns beside the doors | `lantern` hanging from the track-beam hangers; wall lanterns on fence arms at the side door |
| 10 | Side man-door + eave brackets | spruce door with white frame, stair brackets (upside-down dark oak stairs) under the eave |
| 11 | Barrels, grass | barrel blocks at the front corner, short_grass tufts and a dirt/gravel apron |
