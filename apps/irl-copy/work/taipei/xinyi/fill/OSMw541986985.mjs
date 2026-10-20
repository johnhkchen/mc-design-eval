import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Footprint 10 x 23. Record: roof ~11 blocks above lowest ground.
// Reading: a two-storey (5 block storeys) reinforced-concrete commercial block of the
// late 20th century, Xinyi-style: white concrete walls, stone-brick corner piers and
// parapet, tinted glass shopfront on the street, blue-tinted upper windows, a
// central entrance on the north (street) face, and a few warm lamps behind the glass.

const W = 10, H = 23, D = 23;
const SRC = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw541986985.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw541986985.nbt";

const cells = JSON.parse(readFileSync(SRC, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const G = new Map();
for (const [x, z, gr] of cells) G.set(key(x, z), gr);
const has = (x, z) => G.has(key(x, z));

// Bounds-checked setter; props optional.
function put(x, y, z, id, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Outward faces of a footprint cell: [dx, dz] pairs for each side with no neighbour.
function exposedFaces(x, z) {
  const f = [];
  if (!has(x, z - 1)) f.push([0, -1]); // north (street side)
  if (!has(x, z + 1)) f.push([0, 1]);  // south
  if (!has(x - 1, z)) f.push([-1, 0]); // west
  if (!has(x + 1, z)) f.push([1, 0]);  // east
  return f;
}

// Choose the entrance: a north-facing single-face cell nearest the middle of the north row.
let doorCell = null;
{
  const northCells = cells.filter(([x, z]) => {
    const f = exposedFaces(x, z);
    return f.length === 1 && f[0][1] === -1;
  });
  if (northCells.length) {
    const minZ = Math.min(...northCells.map(([, z]) => z));
    const row = northCells.filter(([, z]) => z === minZ);
    const xs = row.map(([x]) => x);
    const mid = (Math.min(...xs) + Math.max(...xs)) / 2;
    row.sort((a, b) => Math.abs(a[0] - mid) - Math.abs(b[0] - mid));
    doorCell = row[0] ? [row[0][0], row[0][1]] : null;
  }
}

for (const [x, z, gr] of cells) {
  const b = gr; // floor level of this cell = its own ground

  // Foundation: solid from y 0 up to the ground.
  for (let y = 0; y < b; y++) put(x, y, z, "stone");

  // Floor slabs: ground floor, storey 2 floor, roof deck.
  put(x, b, z, "smooth_stone");
  put(x, b + 5, z, "smooth_stone");
  put(x, b + 10, z, "light_gray_concrete");

  const faces = exposedFaces(x, z);

  if (faces.length >= 2) {
    // Corner piers and parapet.
    for (let y = b + 1; y <= b + 9; y++) put(x, y, z, "stone_bricks");
    put(x, b + 11, z, "stone_bricks");
    // Corner lantern on the parapet for dusk.
    put(x, b + 12, z, "lantern", { hanging: "false", waterlogged: "false" });
    continue;
  }

  if (faces.length === 1) {
    const [dx, dz] = faces[0];
    const isDoor = doorCell && doorCell[0] === x && doorCell[1] === z;

    // Storey 1: shopfront glass, with the entrance door.
    if (isDoor) {
      put(x, b + 1, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      put(x, b + 2, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    } else {
      put(x, b + 1, z, "glass");
      put(x, b + 2, z, "glass");
    }
    put(x, b + 3, z, "glass");
    // Lintel between storeys.
    put(x, b + 4, z, "white_concrete");

    // Storey 2: sill, blue-tinted windows on alternating bays, head.
    put(x, b + 6, z, "white_concrete");
    const isWindow = (x + z) % 2 === 0;
    put(x, b + 7, z, isWindow ? "light_blue_stained_glass" : "white_concrete");
    put(x, b + 8, z, isWindow ? "light_blue_stained_glass" : "white_concrete");
    put(x, b + 9, z, "white_concrete");

    // Warm lamp standing just inside some upper windows.
    if (isWindow && (x + z) % 4 === 0) {
      const ix = x - dx, iz = z - dz;
      if (has(ix, iz)) put(ix, b + 7, iz, "glowstone");
    }

    // Parapet cap.
    put(x, b + 11, z, "stone_bricks");
    continue;
  }

  // Interior cells: air behind the glass, with a few mechanical units on the roof.
  if ((x * 3 + z) % 7 === 0) {
    put(x, b + 11, z, "iron_block");
  }
}

g.save(OUT);
