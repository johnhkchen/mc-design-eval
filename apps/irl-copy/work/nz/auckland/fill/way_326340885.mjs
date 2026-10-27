// Kāhui St David's (way 326340885): a 1920s-30s brick civic block with a basalt plinth and a stepped corner tower,
// on a footprint of 28 x 53 blocks. Decided from the record: lidar roofs sit at 15-19 blocks above y 0 over most of the
// plan (a four-storey brick body, with a five-storey central spine), 10-12 at the north wing (three storeys), and
// 23-27 on the south-east cluster (a seven-storey tower). Materials are the city's older stock: red brick walls, dark
// basalt-style stone for the plinth and roof, pale stone for the string courses and coping, blue-tinted glass in a
// paired-by-bay grid, warm glowstone behind some panes. Roof heights are smoothed by a 3x3 median and quantized to four
// levels (12, 16, 20, 28), so every tier stands on the one below. Storey lines sit on absolute y (multiples of 4), so
// the bands run through the whole block. The main door is on the north wing, the only face at y 0.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_326340885.cells.json", "utf8"));
const [W, H, D] = [28, 40, 53];
const g = new Voxels([W, H, D]);

// footprint: "x,z" -> { x, z, ground, roof (lidar), tier (smoothed, quantized) }
const cell = new Map();
for (const [x, z, ground, roof] of cells) cell.set(`${x},${z}`, { x, z, ground, roof, tier: 0 });
const at = (x, z) => cell.get(`${x},${z}`);
const tierOf = (r) => (r >= 23 ? 28 : r >= 19 ? 20 : r >= 14 ? 16 : r >= 9 ? 12 : 4);
for (const c of cell.values()) {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const n = at(c.x + dx, c.z + dz); if (n) v.push(n.roof); }
  v.sort((a, b) => a - b);
  c.tier = tierOf(v[v.length >> 1]);
}

// a face is exposed where the neighbour is outside the footprint or sits on a lower tier: that cell is a wall
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const exposed = (c) => DIRS.filter(([dx, dz]) => { const n = at(c.x + dx, c.z + dz); return !n || n.tier < c.tier; });

// materials
const PLINTH = "stone_bricks", FILL = "stone", BRICK = "bricks", STONE = "smooth_stone", ROOF = "stone_bricks";
const GLASS = "light_blue_stained_glass";

// main door: the north wing's outer face on the lowest ground, at the middle of its row
const DIR_NAME = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };
const doorCell = at(14, 0);
const doorOut = doorCell && exposed(doorCell).find(([dx, dz]) => !at(doorCell.x + dx, doorCell.z + dz));
const door = doorOut ? { c: doorCell, out: doorOut } : null;
const doorSide = (c) => door && c.z === door.c.z && Math.abs(c.x - door.c.x) === 1; // the reveals either side of the door

for (const c of cell.values()) {
  const { x, z, ground, tier } = c;
  const walls = exposed(c);

  // foundation: solid from y 0 to this cell's ground, so nothing floats on the slope
  for (let y = 0; y < ground; y++) g.set(x, y, z, walls.length ? PLINTH : FILL);

  for (let y = ground; y < tier; y++) {
    const m = y % 4;
    if (!walls.length) {                                              // interior: a floor slab per storey, air gap, roof
      if (y === tier - 1) g.set(x, y, z, ROOF);
      else if (m === 0 && y > ground) g.set(x, y, z, STONE);
      continue;
    }
    if (y === tier - 1) { g.set(x, y, z, STONE); continue; }          // stone coping on the parapet
    if (y === ground) { g.set(x, y, z, PLINTH); continue; }           // basalt base course
    if (door && door.c === c && (y === ground + 1 || y === ground + 2)) {
      const facing = DIR_NAME[door.out.join(",")];
      g.set(x, y, z, "dark_oak_door", { facing, half: y === ground + 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (doorSide(c) && y <= ground + 3) { g.set(x, y, z, STONE); continue; }   // stone reveals around the door
    if (m === 0) { g.set(x, y, z, STONE); continue; }                  // string course on each storey line
    if (m === 3) { g.set(x, y, z, BRICK); continue; }                  // brick spandrel under the next sill
    // windows at m = 1, 2: piers at corners and every third bay, panes between
    const along = walls[0][0] !== 0 ? z : x;
    const corner = walls.length > 1;
    if (corner || along % 3 === 0) { g.set(x, y, z, BRICK); continue; }
    g.set(x, y, z, GLASS);
    // warm light in some windows, glowstone set in the air gap behind the pane (m = 1 only)
    if (m === 1 && (along * 7 + y * 3 + x) % 11 === 0) {
      const [dx, dz] = walls[0], ix = x - dx, iz = z - dz;
      const inner = at(ix, iz);
      if (inner && !exposed(inner).length && y >= inner.ground && y < inner.tier - 1) g.set(ix, y, iz, "glowstone");
    }
  }

  // roof equipment: a 2 x 2 plant housing (two courses) on the four-storey roofs, and a lantern on each tower corner
  if (!walls.length && tier === 16 && x % 9 >= 4 && x % 9 <= 5 && z % 9 >= 4 && z % 9 <= 5) {
    g.set(x, tier, z, BRICK); g.set(x, tier + 1, z, BRICK);
  }
  if (walls.length > 1 && tier === 28) g.set(x, tier, z, "lantern", { hanging: "false", waterlogged: "false" });
}
g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_326340885.nbt");
