// Room "P3 living room" (interior designer's part): the Puritan's front parlour, hearth in the west wall at z17.
// Inner air x52..54, y2..4, z14..20. Floor layer y1 (the floor block), so furniture stands at y2.
// Layout (designed, not built): rug in front of the hearth (x52..53, z17..18); sofa of two stairs on the east wall (x54, z15..16, back to
// the wall) facing a spruce-fence table with a top slab (x53, z16); a standing lantern by the hearth; a potted plant
// and a chest under the windows; a candle on the table and a hanging lantern for the centre of the room. The east
// column x54 is kept clear at z14, z17..20 (the hall doorways) and the back row z20 at x53..54 (the back doors).
// Not built: shell-west fills each plot's inner air with air (shell-west.mjs line 16), and runParts locks every cell an
// earlier part placed, air included, so every furniture write here is refused (14 of 14). The layout comes back when
// the shell leaves the room air unclaimed, or the lock lets furnishing parts write into air.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// Lamplighter: one standing lantern by the hearth at (52,2,16) on the floor block (52,1,16). The hearth's lit campfire
// at (50,1,17) already lights the west side through its mouth (51,1..2,17); this lamp lifts the two dim cells at the
// east corners (54,14) and (54,20) to 8+. Hanging lanterns are not needed.
export function build(g) {
  g.set(52, 2, 16, ...B.lantern(false));
}
