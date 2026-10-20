import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Mid-rise 1960s-70s Taipei commercial block: stone base, white-concrete piers,
// glass bays, light-grey storey bands, a shopfront ground floor with a central
// entrance, and a plain parapet. 11 blocks tall from its lowest ground.
const BASE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw540883613";
const cells = JSON.parse(readFileSync(BASE + ".cells.json", "utf8"));

const W = 8, H = 23, D = 8;
const g = new Voxels([W, H, D]);

const minG = Math.min(...cells.map(c => c[2]));
const key = (x, z) => x + "," + z;
const grd = new Map();
for (const [x, z, gr] of cells) grd.set(key(x, z), gr - minG);
const has = (x, z) => grd.has(key(x, z));

const xs = cells.map(c => c[0]), zs = cells.map(c => c[1]);
const minX = Math.min(...xs), maxX = Math.max(...xs);
const minZ = Math.min(...zs), maxZ = Math.max(...zs);

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Pane connection props so glass reads as a continuous bay along its face.
function pane(face) {
  return face === "N" || face === "S"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
}

const DIRS = [
  { f: "N", dx: 0, dz: -1 },
  { f: "S", dx: 0, dz: 1 },
  { f: "W", dx: -1, dz: 0 },
  { f: "E", dx: 1, dz: 0 },
];

for (const [x, z] of cells) {
  const gr = grd.get(key(x, z));

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const faces = DIRS.filter(d => !has(x + d.dx, z + d.dz));
  const edge = faces.length > 0;

  if (!edge) {
    // Interior: floor slabs only, air between, roof deck on top.
    put(x, gr, z, "smooth_stone");
    put(x, gr + 5, z, "smooth_stone");
    put(x, gr + 10, z, "smooth_stone");
    // A few warm lights in the open floor, visible through the glass.
    if ((x + z) % 3 === 0) put(x, gr + 7, z, "shroomlight");
    continue;
  }

  // Edge cell: base course, storeys, cornice, parapet.
  put(x, gr, z, "polished_andesite");

  for (const face of faces) {
    const northSouth = face.f === "N" || face.f === "S";
    const u = northSouth ? x - minX : z - minZ;
    const umax = northSouth ? maxX - minX : maxZ - minZ;
    const pier = u === 0 || u === umax || u % 2 === 0;
    const isEntranceCell = face.f === "S" && u === 3;

    // Ground floor shopfront, h1..h3.
    for (let h = 1; h <= 3; h++) {
      if (pier) put(x, gr + h, z, "white_concrete");
      else put(x, gr + h, z, "glass_pane", pane(face.f));
    }

    // Entrance: double-height door in the centre of the south face.
    if (isEntranceCell) {
      put(x, gr + 1, z, "dark_oak_door", {
        facing: "south", half: "lower", hinge: "left", open: "false", powered: "false",
      });
      put(x, gr + 2, z, "dark_oak_door", {
        facing: "south", half: "upper", hinge: "left", open: "false", powered: "false",
      });
      put(x, gr + 3, z, "lantern", { hanging: "true", waterlogged: "false" });
    }

    // Storey line under the upper floor.
    put(x, gr + 4, z, "light_gray_concrete");
    // Upper storey sill / floor line.
    put(x, gr + 5, z, "smooth_stone");

    // Upper storey windows, h6..h8.
    for (let h = 6; h <= 8; h++) {
      if (pier) put(x, gr + h, z, "white_concrete");
      else put(x, gr + h, z, "glass_pane", pane(face.f));
    }

    // Cornice band and parapet.
    put(x, gr + 9, z, "light_gray_concrete");
  }

  // Parapet course all round the roof edge.
  put(x, gr + 10, z, "white_concrete");
}

g.save(BASE + ".nbt");
