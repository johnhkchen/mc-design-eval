# Element map: Coastal lighthouse + keeper's cottage

Identity: white-and-red round tower on a grey rocky outcrop, dark slate lantern cap, red-tile keeper's cottage with white plaster walls. Palette: white / red wool bands (60% of tower), grey stone + cobble (rock/base, 25%), white plaster + red brick roof + dark timber (cottage, accent), deepslate cap.

| # | Element (as a viewer sees it) | The real Minecraft thing | Tool |
|---|---|---|---|
| 1 | Red/white striped round tower | `cylinder` brush, hollow R4, alternating red_wool / white_wool bands 3 high, stone-brick plinth + door-level ring | `cylinder` |
| 2 | Rocky base with steps and moss | height-field mound of stone/cobble/andesite/mossy cobble, moss_block + moss_carpet + ferns/grass; a stone-brick stair flight up to the door | hand loop (gap) |
| 3 | Lantern room: glass cage | glass blocks in a R2 ring around a hanging **lantern** on a chain, dark frame posts | ring + B.lantern/B.chain |
| 4 | Railing gallery | corbel ring of upside-down stone-brick stairs, stone-brick floor disc, dark-oak **fence** ring with connections, **lanterns** on 4 fence posts | stairs, fence, B.lantern |
| 5 | Slate cap + finial | `dome` cone profile in deepslate_tile stairs, lightning_rod + lantern on top | `dome` |
| 6 | Tower windows | 1x2 glass panes in stone-brick frames with sill slab + stair lintel, stacked per storey (4 high) | hand loop on the round wall |
| 7 | Tower door | dark_oak **door** (2 tall) in stone-brick surround, 2 wall **lanterns** (fixtures), stone stairs up | B.door, `fixture` |
| 8 | Keeper's cottage | white plaster walls, dark_oak timber frame, **shuttered windows** (open trapdoors + panes), a door | shell + `surround timber` |
| 9 | Cottage roof + chimney | `roof()` cottage preset overridden: brick (red) shingles, dark verges; chimney of stone bricks with lantern/campfire top | `roof` |
| 10 | Porch + railing + flower pots | dark-oak log posts, stair awning, **fence** rail, **flower pots** with flowers | fence, potted_* |
