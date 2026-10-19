// 201006.0006616, Presidio Tunnel Tops, Main Post frame. Footprint 18 x 9 (131 cells, all on the lowest ground, so no foundation).
// Read from the record: no record, so an Army administrative block of the 1930s in the Presidio's Spanish Colonial Revival
// manner: three storeys of 2 blocks (4 m, 2 m blocks at 0.5 blocks/m) on a stone base, white stucco walls with quartz
// quoins and string courses, glazed bays on every storey, a red-tile flat roof edged by a quartz cornice, and two
// dark-wood entrances on the stepped north (-z) front under red awnings. Roof is 6 blocks above the ground (y 6).
// No interiors: each storey has a floor slab, an air gap sits behind every window, and a few warm lights stand in the gaps.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/sf/presidio-tunnel-tops/fill";
const cells = JSON.parse(readFileSync(`${DIR}/201006.0006616.cells.json`, "utf8"));   // [x, z, ground]

const SIZE = [18, 10, 9];
const ROOF = 6;                 // cornice and roof deck sit at y 6, 6 blocks above the lowest ground
const g = new Voxels(SIZE);

const ground = new Map(cells.map(([x, z, h]) => [`${x},${z}`, h]));
const inside = (x, z) => ground.has(`${x},${z}`);
// Outward normals: north is -z (the stepped main front), then south (+z), west (-x), east (+x).
const NORMALS = [[0, -1], [0, 1], [-1, 0], [1, 0]];
const faces = (x, z) => NORMALS.filter(([dx, dz]) => !inside(x + dx, z + dz));
const boundary = (x, z) => inside(x, z) && faces(x, z).length > 0;

// Each boundary cell takes its first exposed face in the order above; a cell with two exposed faces is a corner.
function facadeOf(x, z) {
  const fs = faces(x, z);
  const [nx, nz] = fs[0];
  return { n: [nx, nz], corner: fs.length > 1, along: nx !== 0 ? z : x, north: nz === -1 };
}

// Entrances: two dark-oak doors on the north front, a pair in the long run at x 11-12 and a single at x 4 on the step.
const DOORS = new Map([["11,0", "left"], ["12,0", "right"], ["4,1", "left"]]);
// Red awnings sit over the doors, one row up in the string course.
const AWNING = new Set(["10,0", "11,0", "12,0", "13,0", "3,1", "4,1", "5,1"]);

const paneState = ([nx]) => (nx !== 0
  ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }   // pane runs along z on an end wall
  : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }); // pane runs along x on a front

// Warm lights stand in the air gap behind some windows: glowstone on the ground-storey row, shroomlight above.
const warmAt = (x, z, along, row) => (along * 7 + row * 3 + x + z) % 5 === 0;

// Foundation: solid from y 0 up to each cell's ground (all 0 here, so nothing to fill, kept for the rule).
for (const [x, z, h] of cells) for (let y = 0; y < h; y++) g.set(x, y, z, "stone_bricks");

// Walls: y 0 base course, y 1/3/5 storey windows (piers between), y 2/4 string courses, y 6 cornice.
for (const [x, z] of cells) {
  if (!boundary(x, z)) continue;
  const { n, corner, along, north } = facadeOf(x, z);
  const key = `${x},${z}`;
  const pier = corner || along % 3 === 0;

  // base course, then the window rows (piers between them); the doors take the ground storey's bay
  g.set(x, 0, z, "stone_bricks");
  if (DOORS.has(key)) {
    const hinge = DOORS.get(key);
    g.set(x, 0, z, "dark_oak_door", { facing: "north", half: "lower", hinge, open: "false", powered: "false" });
    g.set(x, 1, z, "dark_oak_door", { facing: "north", half: "upper", hinge, open: "false", powered: "false" });
  } else {
    g.set(x, 1, z, pier ? "white_concrete" : "glass_pane", pier ? undefined : paneState(n));
  }
  for (const y of [3, 5]) g.set(x, y, z, pier ? "white_concrete" : "glass_pane", pier ? undefined : paneState(n));
  // string courses and the cornice
  for (const y of [2, 4]) g.set(x, y, z, AWNING.has(key) && y === 2 && north ? "red_terracotta" : "smooth_quartz");
  g.set(x, ROOF, z, "smooth_quartz");
}

// Warm lights: in the air gap just inside a window, on the ground and second storeys.
for (const [x, z] of cells) {
  if (!boundary(x, z)) continue;
  const { n, corner, along } = facadeOf(x, z);
  if (corner || along % 3 === 0 || DOORS.has(`${x},${z}`)) continue;
  const inward = [x - n[0], z - n[1]];
  if (!inside(...inward) || boundary(...inward)) continue;
  if (warmAt(x, z, along, 1)) g.set(inward[0], 1, inward[1], "glowstone");
  if (warmAt(x, z, along, 3) && along % 2 === 0) g.set(inward[0], 3, inward[1], "shroomlight");
}

// Floor slabs for each storey and the roof deck, inside the walls only.
for (const [x, z] of cells) {
  if (boundary(x, z)) continue;
  for (const y of [0, 2, 4]) g.set(x, y, z, "smooth_stone");
  g.set(x, ROOF, z, "red_terracotta");
}

// Roof equipment: a planted terrace on the south-west roof, an AC plant, and a brick chimney.
for (const x of [6, 7, 8, 9]) {
  g.set(x, ROOF, 3, "moss_block");
  g.set(x, ROOF + 1, 3, "azalea");
}
for (const x of [12, 13]) for (const z of [3, 4]) g.set(x, ROOF + 1, z, "light_gray_concrete");
g.set(15, ROOF + 1, 3, "bricks");
g.set(15, ROOF + 2, 3, "bricks");

g.save(`${DIR}/201006.0006616.nbt`);
console.log("wrote 201006.0006616.nbt", g.count(), "blocks");
