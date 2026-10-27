// Way 1095572131: a single-storey 1920s-30s brick shop with a cream plaster cornice and parapet, on a basalt-look
// plinth. Footprint from the cells file; the front is the exposed side with the most wall (the shopfront and door go there).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1095572131.cells.json", "utf8"));
const g = new Voxels([8, 19, 10]);

const foot = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inF = (x, z) => foot.has(`${x},${z}`);
const DIRS = { west: [-1, 0], east: [1, 0], north: [0, -1], south: [0, 1] };
// the cells' lidar roof and ground: this footprint is flat at ground 0 and roof 6 (one tier, no setbacks)
for (const { ground, roof } of foot.values()) if (ground !== 0 || roof !== 6) throw new Error("expected a flat 0/6 footprint");

// exposed faces per cell: the directions whose neighbour is outside the footprint
const exposed = (x, z) => Object.keys(DIRS).filter((d) => !inF(x + DIRS[d][0], z + DIRS[d][1]));
const faceCount = {};
for (const [x, z] of cells.map(([x, z]) => [x, z])) for (const d of exposed(x, z)) faceCount[d] = (faceCount[d] ?? 0) + 1;
const front = ["south", "north", "west", "east"].reduce((a, b) => ((faceCount[b] ?? 0) > (faceCount[a] ?? 0) ? b : a));
// along a wall: z for west/east faces, x for north/south faces
const along = (d, x, z) => (d === "west" || d === "east" ? z : x);
const frontCells = cells.map(([x, z]) => [x, z]).filter(([x, z]) => exposed(x, z).includes(front))
  .sort((a, b) => along(front, a[0], a[1]) - along(front, b[0], b[1]));
const [doorX, doorZ] = frontCells[Math.floor(frontCells.length / 2)];

const H = { low: 1, top: 2 };                      // glass rows y1..y2 under the lintel at y3
const FLOOR = 0, CEIL = 4, ROOF = 5;               // slab y0, ceiling slab y4, roof/parapet y5; air y1..3 between
const paneState = (d) => (d === "west" || d === "east"
  ? { north: "true", south: "true", east: "false", west: "false" }
  : { east: "true", west: "true", north: "false", south: "false" });
// warm light behind a window: the interior cell just inside the wall face
const inward = (d, x, z) => { const [dx, dz] = DIRS[d]; return [x - dx, z - dz]; };
const interior = (x, z) => inF(x, z) && exposed(x, z).length === 0;

for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const ex = exposed(x, z);
  const wall = ex.length > 0;
  // base course and floor slab
  g.set(x, FLOOR, z, wall ? "stone_bricks" : "stone_bricks");
  // ceiling slab (interior) and cornice (wall), roof and parapet
  g.set(x, CEIL, z, wall ? "smooth_quartz" : "stone");
  g.set(x, ROOF, z, wall ? "smooth_quartz" : "gray_concrete");
  if (!wall) continue;
  const corner = ex.length >= 2;
  const d = ex[0];
  const a = along(d, x, z);
  const isFront = ex.includes(front);
  const isDoor = x === doorX && z === doorZ;
  // windows: two glass bays in three, a brick pier between; corners are plaster pilasters
  const isPier = !corner && a % 3 === 0 && !isFront;
  for (let y = 1; y <= 2; y++) {
    if (corner) g.set(x, y, z, "smooth_quartz");
    else if (isDoor) g.set(x, y, z, "dark_oak_door", { facing: front, half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
    else if (isFront) g.set(x, y, z, "glass_pane", paneState(d));
    else if (isPier) g.set(x, y, z, "bricks");
    else g.set(x, y, z, "glass_pane", paneState(d));
  }
  // storey band at y3 (brick over the windows), dark fascia over the shopfront, plaster pilasters at the corners
  g.set(x, 3, z, corner ? "smooth_quartz" : isFront ? "dark_oak_planks" : "bricks");
}

// warm lights: glowstone behind a share of the windows, and hanging lanterns in the interior
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const ex = exposed(x, z);
  if (ex.length !== 1) continue;
  const d = ex[0];
  const a = along(d, x, z);
  if (a % 3 === 0 || (x * 3 + z * 5 + a) % 4 !== 0) continue;   // every fourth window, not piers
  const [ix, iz] = inward(d, x, z);
  if (interior(ix, iz)) g.set(ix, 1, iz, "glowstone");
}
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  if (!interior(x, z) || (x + 2 * z) % 5 !== 1) continue;
  g.set(x, 3, z, "lantern", { hanging: "true", waterlogged: "false" });
}

// roof equipment: two units on the flat roof, away from the front
const roofInner = cells.map(([x, z]) => [x, z]).filter(([x, z]) => interior(x, z));
for (const i of [Math.floor(roofInner.length / 3), Math.floor((2 * roofInner.length) / 3)]) {
  const [x, z] = roofInner[i];
  g.set(x, ROOF + 1, z, "iron_block");
}

const { blocks, palette } = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1095572131.nbt");
console.log(`way_1095572131: front=${front} door=${doorX},${doorZ} blocks=${blocks} palette=${palette}`);
