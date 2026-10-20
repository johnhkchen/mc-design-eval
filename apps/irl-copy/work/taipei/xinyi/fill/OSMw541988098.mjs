import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541988098";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Footprint is 14 x 15, x 0..13, z 0..14. Roof about 11 blocks above lowest ground.
const W = 14, H = 23, D = 15;
const g = new Voxels([W, H, D]);

// Lidar grounds are normalised so the lowest ground under the footprint is y 0.
const minG = Math.min(...cells.map(c => c[2]));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr - minG));
const inFp = (x, z) => ground.has(`${x},${z}`);

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Outward directions for a footprint cell: a side is outward if the neighbour is not footprint.
const SIDES = [
  { name: "north", dx: 0, dz: -1 },
  { name: "south", dx: 0, dz: 1 },
  { name: "west", dx: -1, dz: 0 },
  { name: "east", dx: 1, dz: 0 },
];
function outwardOf(x, z) {
  return SIDES.filter(s => !inFp(x + s.dx, z + s.dz));
}

// Facade pattern: piers at every third bay, corners always piers.
function isPier(coord, corner) {
  return corner || coord % 3 === 0;
}

// Entrance: the outward south-facing cell nearest the middle of the south face.
let entranceKey = null;
{
  const southCells = [];
  for (const [x, z] of ground.keys().constructor === Map ? [...ground.keys()].map(k => k.split(",").map(Number)) : []) {
    if (!inFp(x, z + 1)) southCells.push(x);
  }
  if (southCells.length) {
    const mid = (Math.min(...southCells) + Math.max(...southCells)) / 2;
    const ex = southCells.reduce((a, b) => (Math.abs(b - mid) < Math.abs(a - mid) ? b : a));
    const zSouth = Math.max(...[...ground.keys()].map(k => +k.split(",")[1]).filter(zz => inFp(ex, zz)));
    entranceKey = `${ex},${zSouth}`;
  }
}

for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const outs = outwardOf(x, z);
  const edge = outs.length > 0;
  const corner = outs.length >= 2;

  // Foundation course from y 0 up to the cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Ground surface and floor lines (interior and edge).
  put(x, gr, z, "smooth_quartz");           // ground floor slab
  put(x, gr + 5, z, "white_concrete");      // storey line 1/2
  put(x, gr + 10, z, "light_gray_concrete"); // roof slab

  if (!edge) {
    // Interior: air behind the glass, roof equipment on a few cells.
    if ((x * 3 + z * 5) % 7 === 0) put(x, gr + 11, z, "light_gray_concrete");
    continue;
  }

  // Edge cell: facade. Primary outward side decides coordinate along the wall.
  const side = outs[0];
  const along = (side.name === "north" || side.name === "south") ? x : z;

  // Base/ground-floor shopfront rows g+1..g+3, fascia g+4.
  for (let dy = 1; dy <= 3; dy++) {
    const id = isPier(along, corner) ? "smooth_quartz" : "light_blue_stained_glass";
    put(x, gr + dy, z, id);
  }
  put(x, gr + 4, z, "dark_oak_planks");

  // Storey 2 windows g+6..g+8, spandrel g+9.
  for (let dy = 6; dy <= 8; dy++) {
    const pier = isPier(along, corner);
    put(x, gr + dy, z, pier ? "white_concrete" : "light_blue_stained_glass");
  }
  put(x, gr + 9, z, "white_concrete");

  // Warm lights behind some storey-2 windows.
  if (!isPier(along, corner) && along % 6 === 1) {
    put(x, gr + 7, z, "glowstone");
  }

  // Cornice and parapet.
  put(x, gr + 10, z, "smooth_quartz");
  put(x, gr + 11, z, "white_concrete");

  // Storey-1 windows and lanterns at ground.
  if (!isPier(along, corner) && along % 6 === 4) {
    put(x, gr + 2, z, "glowstone");
  }
}

// Entrance door on the south face with a dark canopy and hanging lantern.
if (entranceKey) {
  const [ex, ez] = entranceKey.split(",").map(Number);
  const gr = ground.get(entranceKey);
  put(ex, gr + 1, ez, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(ex, gr + 2, ez, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  put(ex, gr + 3, ez, "lantern", { hanging: "true", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
