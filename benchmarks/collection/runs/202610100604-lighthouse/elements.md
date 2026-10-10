# Element map — coastal lighthouse + keeper's cottage

Grid 15 x 28 x 15, front faces NORTH (-z). Rock y0-3, tower centre (4,6), cottage x8-13 / z5-12 on the east.

| # | Recognisable element (brief / concept) | The real Minecraft thing |
|---|---|---|
| 1 | Round tower, red and white horizontal stripes | `cylinder` brush, r=3, hollow; 3-high bands of red_concrete / white_concrete over a stone-brick plinth (r=4) with a stair-course set-in |
| 2 | Rocky crag base with a stair up to the door | per-column rock heightmap (stone / cobble / mossy cobble / andesite) with moss, grass, ferns on ledges; stone-brick stair run to the tower door; boulder |
| 3 | Lantern room: glass, glowing lamp | ring of glass panes (connected states) in dark-oak posts, glowstone lamp on a pedestal in the middle, 3 tall |
| 4 | Railing gallery | stone corbel ring (upside-down stairs) + stone deck r=4, dark-oak FENCE ring with lanterns on posts at cardinal / diagonal points |
| 5 | Dark conical cap + finial | `roof(... "lantern-cap")` in dark slate, a lantern + fence-post lightning-rod finial on top |
| 6 | Tower door with stone arch and lanterns either side | dark-oak door, stone-brick surround brush (arch + keystone), `fixture` lanterns beside it |
| 7 | Tower windows with stone frames | glass-pane slit windows with stone-brick surrounds, three levels on the north, fewer on other faces |
| 8 | Keeper's cottage: plaster walls, timber, pitched red roof | calcite plaster, dark-oak corner posts and beam, cobble plinth, `roof(... "cottage")` red-tile palette with dark verges |
| 9 | Chimney | 2x2 stone-brick chimney through the roof with a campfire/lantern cap (via roof `chimneys`) |
| 10 | Shuttered windows, porch fence, flower planters | open spruce/dark-oak trapdoors as shutters, glass panes, fence rail along the front, `planter` boxes with flowers, lanterns |
