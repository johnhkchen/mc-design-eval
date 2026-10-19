// 532 Madison Avenue (1958): a Midtown office slab in the curtain-wall idiom of its decade. A granite plinth and a
// shopfront storey, then 3-block storeys of pale spandrels (the floor lines) over blue-glass lights with aluminium
// mullions. Lidar roof heights are smoothed into two tiers (21 and 24 blocks) so the ends stand higher than the
// middle, with a roof penthouse on the west tower. Only footprint cells are built; the interiors are air behind the
// glass with a floor slab per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const FILL = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${FILL}/NYC1035744.cells.json`, "utf8"));   // [x, z, ground, roof]

const g = new Voxels([19, 28, 6]);

const isCorner = (x, z) => (x === 0 || x === 18) && (z === 0 || z === 5);
const isFacade = (x, z) => x === 0 || x === 18 || z === 0 || z === 5;
const isMullion = (x, z) => (z === 0 || z === 5) && x % 3 === 0;   // long faces only; the ends are plain glazing
const topOf = (roof) => (roof >= 23 ? 24 : 21);                    // lidar roof → nearest tier (21 or 24)

// 1. Massing, storey by storey: plinth at y 0, then rows at y = 3k (floor line: spandrel on the face, slab inside),
//    y = 3k+1 and 3k+2 (glazing or air), and a coping row across the top of each cell.
for (const [x, z, , roof] of cells) {
  const top = topOf(roof);
  g.set(x, 0, z, "polished_granite");
  for (let y = 1; y < top; y++) {
    if (y === top - 1) { g.set(x, y, z, "polished_diorite"); continue; }   // coping / roof surface
    if (y % 3 === 0) {                                                    // floor line
      if (isCorner(x, z)) g.set(x, y, z, "polished_granite");
      else g.set(x, y, z, isFacade(x, z) ? "light_gray_concrete" : "smooth_stone");
      continue;
    }
    if (!isFacade(x, z) || isCorner(x, z)) continue;                    // interior: air behind the glass
    const shop = y < 3;                                                   // ground storey: shopfront
    if (isMullion(x, z)) g.set(x, y, z, shop ? "polished_granite" : "iron_block");
    else g.set(x, y, z, shop ? "glass" : "light_blue_stained_glass");
  }
}

// 2. Entrance on the uptown face (z 0): a recessed porch at x 8..10 with the lobby door at z 1 and a canopy on
//    two solid posts (x 7 and 11) so nothing hangs.
for (const x of [7, 11]) for (const y of [1, 2]) for (const z of [0, 1]) g.set(x, y, z, "polished_diorite");
for (const x of [8, 9, 10]) for (const y of [1, 2]) g.set(x, y, 0, "air");
for (const y of [1, 2]) for (const x of [8, 10]) g.set(x, y, 1, "glass");
g.set(9, 1, 1, "iron_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(9, 2, 1, "iron_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
for (let x = 7; x <= 11; x++) for (let z = 0; z <= 1; z++) g.set(x, 3, z, "polished_diorite");
g.set(9, 2, 0, "lantern", { hanging: "true" });

// 3. Roof penthouse on the west tower (x 1..3, z 2..3): louvred mechanical box on the 24 tier.
for (let x = 1; x <= 3; x++) for (let z = 2; z <= 3; z++) {
  g.set(x, 24, z, "light_gray_concrete");
  g.set(x, 25, z, "iron_bars");
  g.set(x, 26, z, "polished_diorite");
}

// 4. Warm lights standing on the floor slab behind some panes (air cell directly inside the glass).
for (const [x, z, , roof] of cells) {
  if (!isFacade(x, z) || isCorner(x, z) || isMullion(x, z)) continue;
  const top = topOf(roof);
  const ix = z === 0 ? x : z === 5 ? x : x === 0 ? 1 : 17;
  const iz = z === 0 ? 1 : z === 5 ? 4 : z;
  for (let y = 1; y < top - 1; y++) {
    if (y % 3 !== 1) continue;                                            // stand on the floor line below
    if (g.get(ix, y, iz)) continue;
    if (y < 3) {                                                          // shopfront: lanterns on the plinth
      if (x % 4 === 2) g.set(ix, y, iz, "lantern", { hanging: "false" });
      continue;
    }
    const h = (x * 7 + y * 5 + z * 3) % 11;
    if (h === 0) g.set(ix, y, iz, "glowstone");
    else if (h === 4) g.set(ix, y, iz, "shroomlight");
  }
}

const out = `${FILL}/NYC1035744.nbt`;
const r = g.save(out);
console.log(JSON.stringify({ out, ...r }));
