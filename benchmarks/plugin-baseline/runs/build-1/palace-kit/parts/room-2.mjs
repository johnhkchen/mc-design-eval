// room: Peristyle walkway (box 64,1,7 .. 95,21,10). An open colonnade walk with no furniture (the brief): it is lit,
// not furnished. Hanging lanterns sit under the soffit (y 21, built by the peristyle part) at the spec's points: they
// light the ceiling only, so the floor gets standing lanterns on the paving along the north edge (z 7), spaced so that
// every walkway cell at z 10 (the far edge) still reads 8 or more. The lanes z 8..10 stay clear for walking.
import { layers, B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// Standing lanterns on the paving (y 1, on smooth_stone at y 0), along z 7. x positions are chosen so each one's light
// reaches the far row (z 10) at 8 or more. x 89..94 is the closing pier (solid), so the walk ends at x 88.
const FLOOR_LANTERNS = [68, 77, 86];

export function build(g) {
  // Floor row z 7: one character per cell from x 64 (column 0) to x 95 (column 31). "L" = standing lantern.
  const row = Array.from({ length: 32 }, () => " ");
  for (const x of FLOOR_LANTERNS) row[x - 64] = "L";
  const floor = [row.join(""), "", "", ""];
  layers(g, [64, 1, 7], { L: B.lantern(false) }, [floor]);

  // The hanging lanterns under the soffit (x 71, 64, 80 at y 20) are built by the planters part, not here.
}
