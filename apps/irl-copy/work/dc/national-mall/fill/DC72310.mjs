// 1529 16th St NW (Special Purpose-Misc), a 1920s Beaux-Arts-ish brick commercial block with limestone trim:
// a 3-wide, 10-long footprint whose north end rises as a 2x2 setback tower (8 high), a 5-high main body with a
// shop-and-upper-storey east front on 16th St, and a 4-high wing at the north-east corner. Front is east (x = 2).
// Storeys are one block of shopfront, a transom course, one block of upper windows, then a cornice; the 3-wide main
// body is a hollow shell (glass on a one-block air gap, floor slabs between storeys), the tower is solid brick.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${dir}/DC72310.cells.json`, "utf8"));   // [x, z, ground, roof] per footprint cell

const roof = new Map(), ground = new Map();
for (const [x, z, g0, r] of cells) { roof.set(`${x},${z}`, r); ground.set(`${x},${z}`, g0); }
const at = (x, z) => roof.get(`${x},${z}`) ?? null;
const low = Math.min(...cells.map((c) => c[2]));

const BRICK = "bricks", STONE = "stone_bricks", TRIM = "calcite", ROOF = "smooth_stone", GLASS = "glass_pane";
const GLOW = "glowstone";

// a top-layer cell is on the roof's edge when a neighbour is missing or no higher than it
function edge(x, z, y) {
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const r = at(x + dx, z + dz); if (r === null || r <= y) return true; }
  return false;
}

// What stands at x, y, z (null = air). Body cells are solid except the air gaps behind the main body's glass.
function blockAt(x, y, z, R) {
  if (y < low) return { b: STONE };
  if (y === 0) return { b: STONE };                                  // base course
  if (y === R - 1) return { b: edge(x, z, y) ? TRIM : ROOF };         // cornice / roof surface

  if (R === 8) {                                                     // the 2x2 setback tower (north end)
    if (y === 3 || y === 6) return { b: TRIM };                      // string courses
    if (y === 4 || y === 5) {
      if (x === 0 && z === 0) return { b: GLASS };                   // windows on the north and east faces
      if (x === 1 && z === 1) return { b: GLASS };
      return { b: BRICK };                                           // brick piers
    }
    return { b: BRICK };
  }

  if (R === 4) {                                                     // the north-east wing and the cross bar
    if (x === 2 && y === 1 && z <= 1) return { b: GLASS };           // shop glass
    if (x === 2 && y === 2) return { b: TRIM };                      // transom
    return { b: BRICK };
  }

  // main body, R 5: ground storey (y1), transom (y2), upper storey (y3)
  if (x === 2) {                                                     // 16th Street front
    if (z === 9) return { b: TRIM };                                 // stone quoin at the south corner
    if ([3, 6].includes(z)) return { b: BRICK };                     // brick piers between the windows
    if (y === 2) return { b: z === 4 ? "dark_oak_door" : TRIM, door: z === 4 ? "upper" : null };
    if (y === 1 && z === 4) return { b: "dark_oak_door", door: "lower" };
    if (y === 3 && z === 4) return { b: TRIM };                      // lintel hood over the entrance
    return { b: GLASS };
  }
  if (x === 1) {                                                     // behind the front: air gaps behind the glass
    if ((y === 1 || y === 3) && [4, 5, 7, 8].includes(z)) {
      if ((y === 3 && z === 5) || (y === 1 && z === 7)) return { b: GLOW };
      return null;
    }
    return { b: BRICK };
  }
  // x = 0, the back
  if (z === 9) return { b: TRIM };
  if ((y === 1 || y === 3) && (z === 5 || z === 8)) return { b: GLASS };
  return { b: BRICK };
}

const H = Math.max(...cells.map((c) => c[3]));
const g = new Voxels([3, 20, 10]);
for (const [x, z, , R] of cells) {
  for (let y = 0; y < R; y++) {
    const s = blockAt(x, y, z, R);
    if (!s) continue;
    if (s.door) g.set(x, y, z, s.b, { facing: "east", half: s.door, hinge: "left", open: "false", powered: "false" });
    else g.set(x, y, z, s.b);
  }
}
// rooftop: a lantern pair on the tower's parapet and two air-conditioning units on the main roof
g.set(0, 8, 0, "lantern", { hanging: "false", waterlogged: "false" });
g.set(1, 8, 1, "lantern", { hanging: "false", waterlogged: "false" });
g.set(1, 5, 6, "iron_block");
g.set(1, 5, 7, "iron_block");

// glass panes connect to their neighbours, as the game draws them
const solid = (x, y, z) => g.get(x, y, z) !== null;
for (const [x, z, , R] of cells) for (let y = 0; y < R; y++) {
  const cur = g.get(x, y, z); if (!cur || cur.block !== GLASS) continue;
  g.set(x, y, z, GLASS, {
    north: String(solid(x, y, z - 1)), south: String(solid(x, y, z + 1)),
    east: String(solid(x + 1, y, z)), west: String(solid(x - 1, y, z)), waterlogged: "false",
  });
}

console.log(`roof max ${H} blocks; saved`, g.save(`${dir}/DC72310.nbt`));
