# Toolkit Gaps: Farmhouse-Lean Build

## Used Successfully
- `Grid` object for block placement
- `mcd roof` with cottage preset for gable roof generation
- `mcd check` for structural validation
- `mcd render` for visualization
- Direct block state strings (e.g., `oak_log[axis=y]`) in grid.set()

## Toolkit Gaps & Workarounds

1. **Shutters**: Built window openings with air blocks instead of actual trapdoors with facing/half states. Would benefit from a `shutter()` or `window()` brush that places trapdoors in the correct orientation.

2. **Fence gates**: Arch entrance used fence_gate blocks manually. A `gate()` or `arch()` brush that connects gates to surrounding walls would be more robust.

3. **Raised beds**: Manually placed dark_oak_fence borders. A `raisedBed()` function or brush would be cleaner and handle corner/edge cases.

4. **Potted flowers**: Had to manually place support blocks (grass_block) under pots to avoid "unsupported attachment" errors. A `flower()` brush that handles substrate automatically would be better.

5. **Crops**: Placed wheat uniformly. No brush for placing mixed crops with farmland preparation. `mcd detail` doesn't have crop pattern templates.

6. **Lean-to roof**: Built porch with oak slabs only. No preset or brush for simple shed roofs or overhangs (unlike the main roof preset).

7. **Cold frame**: Manually placed glass panes and wood frame. A `coldFrame()` or `greenhouse()` brush would be useful for garden structures.

8. **Lanterns**: Had to manually place on posts. A `lantern()` or `light()` brush that automatically chooses hanging vs. standing placement would be helpful.

9. **Chimney break in roof**: The `mcd roof` preset detected and preserved the chimney position, but had to build chimney beforehand. A `chimney()` brush would be safer.

10. **Garden layout symmetry**: No brush for laying out potager grids. `mcd grid` or garden layout template would help with the repetitive bed+path layout.

## Summary
The build leverages preset roofs well but lacks mid-level brushes for common features like gardens, shutters, and simple outbuildings. Manual block placement was needed for decorative/functional elements.
