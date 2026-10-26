import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 1740 Massachusetts Ave NW, Educational: a 1920s Georgian Revival brick school on a limestone plinth, with calcite
// quoins, string courses and cornice. The lidar roof record read as three flat tiers: low single-storey wings (2),
// the main body (13: three 4-block storeys, a cornice on top), and a 1-block crown at 14 over the centre.
// Storeys are 4-block modules: a calcite string course, two rows of window between brick piers, a brick spandrel.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC75146.cells.json`, "utf8")); // [x, z, ground, roof] per footprint cell

const g = new Voxels([19, 26, 14]);

// the tier of each column: the crown is a rectangle in the middle (the lidar's 14s, smoothed), wings are the low record
const crown = (x, z) => x >= 11 && x <= 14 && z >= 7 && z <= 10;
const H = new Map(cells.map(([x, z, , r]) => [`${x},${z}`, crown(x, z) ? 14 : r <= 8 ? 2 : 13]));
const inFp = (x, z) => H.has(`${x},${z}`);
const hAt = (x, z) => H.get(`${x},${z}`) ?? 0;
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// the sides of a column at row y that face outside the footprint or a neighbour whose roof is at or below y
const sidesAt = (x, z, y) => NB.filter(([dx, dz]) => !inFp(x + dx, z + dz) || hAt(x + dx, z + dz) <= y);
const isWall = (x, z, y) => sidesAt(x, z, y).length > 0;

// glass panes join along their wall: east-west on a wall whose normal is z, north-south on one whose normal is x
const pane = (sides) => (sides.some(([, dz]) => dz)
  ? { east: "true", west: "true", north: "false", south: "false" }
  : { north: "true", south: "true", east: "false", west: "false" });
const door = (y) => ({ id: "dark_oak_door", state: { facing: "south", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" } });

// the block of one cell of the massing, or null for air (interiors are air behind the glass)
function block(x, y, z) {
  const h = hAt(x, z);
  if (!inFp(x, z) || y >= h) return null;
  const sides = sidesAt(x, z, y), wall = sides.length > 0;
  const corner = new Set(sides.map(([dx]) => (dx ? "x" : "z"))).size === 2;
  const rel = y % 4;
  if (y === h - 1) return { id: wall ? "calcite" : "stone_bricks" };          // cornice, or the roof deck inside
  if (rel === 0 && y > 0 && !wall) return { id: "smooth_stone" };             // floor slab per storey
  if (rel === 0 && y > 0) return { id: "calcite" };                           // string course
  if (y === 0 && h > 2 && !wall) return { id: "smooth_stone" };
  if (y === 0 && h > 2) return { id: "stone_bricks" };                         // plinth on the lidar ground
  if (!wall) return null;
  if (corner) return { id: "calcite" };                                        // quoins
  // the entrance: two doors under a calcite lintel, pilasters either side, on the south face of the west block
  if (z === 12 && (x === 3 || x === 4) && (y === 1 || y === 2)) return door(y);
  if (z === 12 && (x === 2 || x === 5) && y >= 1 && y <= 3) return { id: "calcite" };
  if (z === 12 && (x === 3 || x === 4) && y === 3) return { id: "calcite" };
  const k = sides.some(([, dz]) => dz) ? x : z;                               // bay index along the wall
  if (k % 3 === 0) return { id: "bricks" };                                   // brick pier
  if (rel === 3) return { id: "bricks" };                                       // brick spandrel over each window
  return { id: "glass_pane", state: pane(sides) };                            // window: two panes per bay
}

for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const h = hAt(x, z);
  for (let y = 0; y < h; y++) {
    const b = block(x, y, z);
    if (b) g.set(x, y, z, b.id, b.state);
  }
}

// warm light: glowstone in the air behind some windows, and a pair inside the entrance
let lit = 0;
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const h = hAt(x, z);
  for (let y = 1; y < h - 1; y++) {
    const b = block(x, y, z);
    if (!b || b.id !== "glass_pane" || (x + z + y) % 4 !== 0) continue;
    for (const [dx, dz] of sidesAt(x, z, y)) {
      const ix = x - dx, iz = z - dz;
      if (inFp(ix, iz) && !isWall(ix, iz, y) && y % 4 !== 0) { g.set(ix, y, iz, "glowstone"); lit++; break; }
    }
  }
}
for (const x of [3, 4]) if (inFp(x, 11)) g.set(x, 1, 11, "glowstone");

// roof plant on the main roof: a few flat boxes standing on the cornice deck, at y 13
for (const [x, z] of [[4, 7], [5, 7], [8, 10], [9, 10], [15, 9], [16, 9]]) {
  if (inFp(x, z) && hAt(x, z) === 13) g.set(x, 13, z, "smooth_stone");
}

const counts = g.save(`${DIR}/DC75146.nbt`);
console.log(JSON.stringify({ ...counts, lit }));
