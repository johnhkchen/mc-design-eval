// DC64293: a two-storey Federal-style brick block on a stone plinth, white limestone trim, a lightwell skylight
// and a lower wing on the north side. Footprint and roof heights come from DC64293.cells.json (lidar, y 0 = ground).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const HERE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${HERE}/DC64293.cells.json`, "utf8"));

// x,z -> the lidar roof height (ground is 0 everywhere under this footprint)
const roof = new Map();
for (const [x, z, , r] of cells) roof.set(`${x},${z}`, r);
const has = (x, z) => roof.has(`${x},${z}`);

// outward normals for each exposed side
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };

const g = new Voxels([8, 18, 8]);

// window: a glass pane running along the face, with a 1-deep air pocket behind it (or a warm light)
const paneState = (face) =>
  face === "N" || face === "S"
    ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// what an exposed face cell is at height y (u = position along the face)
function facadeBlock(face, u, y, top, corner) {
  if (corner) return y === 0 ? "stone_bricks" : "smooth_quartz";      // quoined corner pilasters
  if (y === 0) return "stone_bricks";                                  // plinth
  if (y === top) return "smooth_quartz";                              // cornice / parapet
  if (y === 3 && top > 3) {
    // the storey line; over the south entrance it becomes the dark-oak canopy
    return face === "S" && u >= 2 && u <= 4 ? "dark_oak_slab" : "smooth_quartz";
  }
  const windowRow = y === 1 || y === 2 || (y === 4 && top > 4);
  if (!windowRow) return "bricks";
  if (face === "S" && u === 3 && y <= 2) return "dark_oak_door";
  if (face === "S" && (u === 2 || u === 4) && y === 2) return "lantern";
  return u % 2 === 1 ? "glass_pane" : "bricks";                       // window bays alternate with brick piers
}

const windows = []; // { x, y, z, inward } for the air pockets and warm lights behind the glass

for (const [key, r] of roof) {
  const [x, z] = key.split(",").map(Number);
  const top = r - 1;
  const exposed = Object.keys(DIRS).filter((d) => !has(x + DIRS[d][0], z + DIRS[d][1]));
  for (let y = 0; y < r; y++) {
    if (!exposed.length) {
      // solid masonry inside, with a stone roof deck and a glass lightwell at the lower roof
      if (y === top) g.set(x, y, z, r === 4 && (x === 4 || x === 5) && z >= 2 && z <= 3 && !(x === 5 && z === 2) ? "glass" : "stone_bricks");
      else g.set(x, y, z, "bricks");
      continue;
    }
    const corner = exposed.length > 1;
    const face = exposed[0];
    const u = face === "N" || face === "S" ? x : z;
    const block = facadeBlock(face, u, y, top, corner);
    if (block === "dark_oak_door") {
      g.set(x, y, z, "dark_oak_door", { facing: "south", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
    } else if (block === "glass_pane") {
      g.set(x, y, z, "glass_pane", paneState(face));
      windows.push({ x, y, z, face, u });
    } else if (block === "lantern") {
      g.set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
    } else if (block === "dark_oak_slab") {
      g.set(x, y, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
    } else {
      g.set(x, y, z, block);
    }
  }
}

// the air gap behind each window (warm glowstone behind two ground-floor south bays)
for (const w of windows) {
  const [dx, dz] = DIRS[w.face];
  const ix = w.x - dx, iz = w.z - dz;                                // one cell in, toward the centre
  if (!has(ix, iz)) continue;
  const warm = w.face === "S" && w.y <= 2 && (w.u === 1 || w.u === 5);
  g.set(ix, w.y, iz, warm ? "glowstone" : "air");
}
// the air behind the door, so the entrance opens into a room
g.set(3, 1, 6, "air"); g.set(3, 2, 6, "air");

// roof equipment: two rooftop units on the upper roof, standing on the deck
g.set(2, 6, 5, "iron_block");
g.set(5, 6, 5, "iron_block");

g.save(`${HERE}/DC64293.nbt`);
console.log("wrote DC64293.nbt");
