import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw541865174.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw541865174.nbt";

// Record: 8 x 17 footprint, roof ~11 above lowest ground.
// Read as a two-storey (about 5 blocks per storey) commercial shophouse block:
// stone base, ground-floor shopfront glazing with a dark signage fascia,
// white-painted concrete upper storey with window bays, stone belt course and
// cornice, a parapet, and a small plant room on the roof.
const W = 8, H = 23, D = 17;

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const key = (x, z) => `${x},${z}`;
const gmap = new Map();
let minG = Infinity;
for (const [x, z, gr] of cells) {
  gmap.set(key(x, z), gr);
  minG = Math.min(minG, gr);
}
const gy = (x, z) => gmap.get(key(x, z)) - minG;
const has = (x, z) => gmap.has(key(x, z));

const DIRS = {
  north: [0, -1],
  south: [0, 1],
  west: [-1, 0],
  east: [1, 0],
};

const exposed = (x, z) =>
  Object.entries(DIRS)
    .filter(([, [dx, dz]]) => !has(x + dx, z + dz))
    .map(([n]) => n);

const g = new Voxels([W, H, D]);

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Front = the long face (east or west) with the most exposed cells.
const countFace = (face) =>
  cells.filter(([x, z]) => exposed(x, z).includes(face)).length;
const front = countFace("west") >= countFace("east") ? "west" : "east";
const frontCells = cells
  .filter(([x, z]) => exposed(x, z).includes(front))
  .sort((a, b) => a[1] - b[1]);
const doorCell = frontCells.length
  ? frontCells[Math.floor(frontCells.length / 2)]
  : null;
const isDoor = (x, z) => doorCell && doorCell[0] === x && doorCell[1] === z;

const paneProps = (axisAlongZ) => ({
  north: axisAlongZ ? "true" : "false",
  south: axisAlongZ ? "true" : "false",
  east: axisAlongZ ? "false" : "true",
  west: axisAlongZ ? "false" : "true",
  waterlogged: "false",
});

// Along-wall coordinate used for window bay rhythm.
const along = (face, x, z) => (face === "east" || face === "west" ? z : x);

for (const [x, z] of cells) {
  const b = gy(x, z);
  const faces = exposed(x, z);
  const perimeter = faces.length > 0;
  const corner = faces.length >= 2;
  const face = faces[0];

  // Foundation below the cell's ground.
  for (let y = 0; y < b; y++) put(x, y, z, "stone_bricks");

  // Ground-floor slab / base course.
  put(x, b, z, perimeter ? "stone_bricks" : "smooth_stone");

  if (!perimeter) {
    // Interior: floor slabs and roof deck only (air gaps behind glass).
    put(x, b + 5, z, "smooth_stone");
    put(x, b + 10, z, "light_gray_concrete");
    continue;
  }

  // Storey line / belt course at b+5 and cornice at b+10.
  put(x, b + 5, z, "smooth_stone");
  put(x, b + 10, z, "smooth_stone");
  // Parapet.
  put(x, b + 11, z, "white_concrete");

  // Ground floor (b+1 .. b+4).
  if (corner) {
    for (let y = b + 1; y <= b + 4; y++) put(x, y, z, "white_concrete");
  } else if (face === front && isDoor(x, z)) {
    const doorProps = (half) => ({
      facing: face,
      half,
      hinge: "left",
      open: "false",
      powered: "false",
    });
    put(x, b + 1, z, "oak_door", doorProps("lower"));
    put(x, b + 2, z, "oak_door", doorProps("upper"));
    put(x, b + 3, z, "white_concrete");
    put(x, b + 4, z, "dark_oak_planks");
  } else {
    const p = paneProps(face === "east" || face === "west");
    for (let y = b + 1; y <= b + 3; y++) put(x, y, z, "glass_pane", p);
    put(x, b + 4, z, "dark_oak_planks");
  }

  // Upper floor (b+6 .. b+9).
  const isWindowBay = !corner && along(face, x, z) % 2 === 1;
  if (corner) {
    for (let y = b + 6; y <= b + 9; y++) put(x, y, z, "white_concrete");
  } else if (isWindowBay) {
    put(x, b + 6, z, "smooth_stone"); // sill
    const p = paneProps(face === "east" || face === "west");
    put(x, b + 7, z, "glass_pane", p);
    put(x, b + 8, z, "glass_pane", p);
    put(x, b + 9, z, "white_concrete"); // head
  } else {
    for (let y = b + 6; y <= b + 9; y++) put(x, y, z, "white_concrete");
  }
}

// Warm lights behind some glazing (inside the air gap).
for (const [x, z] of cells) {
  const b = gy(x, z);
  const faces = exposed(x, z);
  if (faces.length !== 1) continue;
  const face = faces[0];
  const [dx, dz] = DIRS[face];
  const ix = x - dx;
  const iz = z - dz;
  if (!has(ix, iz) || exposed(ix, iz).length !== 0) continue;
  const bi = gy(ix, iz);
  if ((x + z) % 3 === 0) {
    put(ix, bi + 7, iz, "glowstone");
  }
  if (isDoor(x, z)) {
    put(ix, bi + 1, iz, "lantern", { hanging: "false", waterlogged: "false" });
  } else if ((x + z) % 2 === 0) {
    put(ix, bi + 4, iz, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

// Roof plant room on the centre of the roof, where the footprint allows.
for (let x = 3; x <= 4; x++) {
  for (let z = 7; z <= 8; z++) {
    if (!has(x, z) || exposed(x, z).length !== 0) continue;
    const b = gy(x, z);
    put(x, b + 11, z, "light_gray_concrete");
    put(x, b + 12, z, "light_gray_concrete");
  }
}

g.save(OUT);
