// DC58805: a 6 x 8 block red-brick commercial block of the early 20th century (Federal-revival, limestone trim),
// the lidar roof at 6-7 blocks above its ground smoothed into one flat tier at 7 (walls y0..y6, roof deck y6).
// Plinth y0, ground storey y1-2 (shopfront glass, a dark oak door with a hood), belt course y3, upper storey y4-5
// (window bays with glowstone behind some), cornice y6; a brick chimney stands on the roof.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${dir}/DC58805.cells.json`, "utf8"));

const FOOT = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inside = (x, z) => FOOT.has(`${x},${z}`);
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const exposed = (x, z) => Object.keys(DIRS).filter((d) => !inside(x + DIRS[d][0], z + DIRS[d][1]));

const BASE = "stone_bricks";     // plinth and foundation
const BRICK = "bricks";          // the wall
const STONE = "calcite";         // limestone: quoins, belt course, cornice, door surround
const FLOOR = "smooth_stone";    // floor slab between storeys (interior)
const DECK = "stone";            // roof deck (a solid grey, not black holes from the air)
const GLASS = "glass";
const GLOW = "glowstone";

const DOOR = { x: 1, z: 3, dir: "W" };  // on the west face, single bay
const HOOD = "dark_oak_stairs";
const TOP_WALL = 6;                     // top wall course; the roof surface is at y7

const g = new Voxels([6, 10, 8]);

for (const [x, z, ground] of cells) {
  for (let y = 0; y < ground; y++) g.set(x, y, z, BASE);   // foundation to this cell's ground
  g.set(x, 0, z, BASE);                                    // plinth course
  const ex = exposed(x, z);

  if (ex.length === 0) {                                   // interior: floor slabs and a roof deck, air between
    g.set(x, 3, z, FLOOR);
    g.set(x, TOP_WALL, z, DECK);
    continue;
  }

  // the footprint is a staircase, so most edge cells are corners: they stay brick and take a bay from their
  // exposed face so the upper storeys keep their window rhythm
  const corner = ex.length >= 2;
  const face = ex[0];
  const along = face === "N" || face === "S" ? x : z;     // bay rhythm runs along the face
  const bay = along % 2 === 1;                             // window bays on odd cells, brick piers on even

  for (let y = 1; y <= TOP_WALL; y++) {
    let b = BRICK;
    if (y === 3 || y === TOP_WALL) b = STONE;              // belt course and cornice
    else if (bay) b = GLASS;
    g.set(x, y, z, b);
  }

  if (x === DOOR.x && z === DOOR.z) {                      // entrance: door on the west face, hood above
    const st = (half) => ({ facing: "west", half, hinge: "left", open: "false", powered: "false" });
    g.set(x, 1, z, "dark_oak_door", st("lower"));
    g.set(x, 2, z, "dark_oak_door", st("upper"));
    g.set(x, 3, z, HOOD, { facing: "west", half: "top", shape: "straight", waterlogged: "false" });
    continue;
  }

  // warm light: every fourth upper window bay has a glowstone behind it, inside the footprint
  if (bay && along % 4 === 1 && ex.length === 1) {
    const [dx, dz] = DIRS[face];
    const ix = x - dx, iz = z - dz;
    if (inside(ix, iz) && exposed(ix, iz).length === 0) {
      g.set(ix, 4, iz, GLOW);
      g.set(ix, 5, iz, GLOW);
    }
  }
}

// a brick chimney on the roof, capped in stone, and a rooftop unit beside it
g.set(2, 7, 3, BRICK); g.set(2, 8, 3, BRICK); g.set(2, 9, 3, STONE);
g.set(4, 7, 4, "light_gray_concrete");

const out = `${dir}/DC58805.nbt`;
const res = g.save(out);
console.log(`wrote ${out}: ${res.blocks} blocks, palette ${res.palette}`);
