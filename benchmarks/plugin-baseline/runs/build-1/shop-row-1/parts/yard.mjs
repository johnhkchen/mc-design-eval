// Part "yard and street" (parts/yard.mjs): the back-yard paving and side walls, the street surface (road, kerb, pavement),
// three street lamp posts and a lantern by each keeper door. The build grid starts at z 0, so the yard's back wall and
// gates at z -5 and the rear lane (z -8..-1) are outside the structure and not built here (see plan.md Notes). The dividing
// wall at x 12 is the chimney C footing (chimneys part), so no wall is written there. Writes go into free cells only.
import { yardWall, lampPost, DARK_OAK_FENCE, LANTERN } from "../vocab.mjs";

const isFree = (g, x, y, z) => /(^|:)(cave_)?air$/.test(g.blockAt(x, y, z));
const put = (g, x, y, z, b, s) => { if (!g.protected?.has(`${x},${y},${z}`) && isFree(g, x, y, z)) g.set(x, y, z, b, s); };

export function build(g) {
  // Back-yard paving at shop-floor level (y 6), x 3..26, the part of the yard inside the grid (z 0..1).
  for (let x = 3; x <= 26; x++) for (let z = 0; z <= 1; z++) if (!(z === 1 && (x === 7 || x === 15))) put(g, x, 6, z, "cobblestone");

  // Keeper doors sit at the sockets' service level (feet y 6, one below the yard paving): leave the cell before each door
  // unpaved, an area-way one step down on the y 5 ground, so the keeper walks in at the aisle floor.
  for (const x of [7, 15]) g.set(x, 6, 1, "air");

  // Yard side walls (x 3 and x 26, z 0..1): brick y 7..8 with a slab coping at y 9. The back wall at z -5 is outside the grid.
  yardWall(g, 3, 0, 3, 1, { yBase: 7 });
  yardWall(g, 26, 0, 26, 1, { yBase: 7 });

  // Rear lanterns: a fence post on the yard paving beside each keeper door (doors at x 7 and x 15, z 2), with a standing lantern on it.
  for (const x of [6, 14]) {
    put(g, x, 7, 1, DARK_OAK_FENCE);
    put(g, x, 8, 1, LANTERN, { hanging: "false" });
  }

  // Street: carriageway z 23..28, kerb z 22 (y 6), pavement z 19..21 (y 6). Written by hand rather than with streetSurface,
  // which counts every shell cell on the front (z 19 plinth) as a refused write. Shell and shopfront cells are skipped here.
  for (let x = 0; x <= 29; x++) for (let z = 19; z <= 21; z++) put(g, x, 6, z, "smooth_stone");
  for (let x = 0; x <= 29; x++) put(g, x, 6, 22, "polished_andesite");
  for (let x = 0; x <= 29; x++) for (let z = 23; z <= 28; z++) {
    if (/dirt|grass_block|stone/.test(g.blockAt(x, 5, z))) g.set(x, 5, z, "andesite");
  }

  // Street lamp posts at the pavement edge, z 21, at the ends of the row and mid-front (not in the keep-clear x 4..20 z 19..20).
  for (const x of [0, 14, 29]) lampPost(g, x, 21);
}
