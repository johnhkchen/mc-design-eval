import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1174690450";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 25, H = 23, D = 36;
const g = new Voxels([W, H, D]);

// Two-storey civic/commercial block, c. 1970s-80s Taipei: stone plinth,
// tiled white-concrete walls, glass bays between piers, cornice, parapet
// and rooftop plant. Roof deck sits at y=10, parapet at y=11 (lidar ~11).
const ROOF_DECK = 10;
const PARAPET = 11;

const ground = new Map();
const k = (x, z) => `${x},${z}`;
for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  ground.set(k(x, z), Math.max(0, Math.min(8, Math.round(gr))));
}
const has = (x, z) => ground.has(k(x, z));
const gOf = (x, z) => ground.get(k(x, z));

function outward(x, z) {
  if (!has(x, z - 1)) return "north";
  if (!has(x, z + 1)) return "south";
  if (!has(x - 1, z)) return "west";
  if (!has(x + 1, z)) return "east";
  return null;
}
const OFF = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const INWARD = { north: [0, 1], south: [0, -1], west: [1, 0], east: [-1, 0] };

function put(x, y, z, block, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
}

// Entrance: on the north (lowest-z) street face, at the median x of that face.
let doorX = null, doorZ = null;
{
  const northCells = [];
  for (const key of ground.keys()) {
    const [x, z] = key.split(",").map(Number);
    if (outward(x, z) === "north") northCells.push(x);
  }
  if (northCells.length) {
    northCells.sort((a, b) => a - b);
    doorX = northCells[Math.floor(northCells.length / 2)];
    doorZ = Math.min(...[...ground.keys()].map((s) => Number(s.split(",")[1])));
  }
}
const isDoor = (x, z) => x === doorX && z === doorZ;

// 1. Foundation, floors, ceilings, roof deck, parapet.
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const face = outward(x, z);
  const perim = face !== null;

  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  // ground floor slab / base course
  put(x, gr, z, perim ? "polished_andesite" : "smooth_quartz");
  // storey line between floors
  if (gr < 5) put(x, 5, z, perim ? "light_gray_concrete" : "smooth_quartz");
  // second-floor ceiling / cornice course
  put(x, 9, z, "smooth_quartz");
  // roof deck
  put(x, ROOF_DECK, z, "light_gray_concrete");
  if (perim) put(x, PARAPET, z, "smooth_quartz");
}

// 2. Perimeter walls: piers, glass bays, shopfront glass, door, lights.
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const face = outward(x, z);
  if (!face) continue;
  const alongFace = face === "north" || face === "south" ? x : z;
  const alongFaceIdx = alongFace;
  const isNS = face === "north" || face === "south";
  const pane = isNS
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
  const doorColumn = face === "north" && isDoor(x, z);

  for (let y = gr + 1; y <= 8; y++) {
    if (y === 5 && gr < 5) continue; // storey band already set
    if (doorColumn && y <= gr + 2) {
      continue; // door set below
    }
    const pier = alongFaceIdx % 3 === 0 || doorColumn;
    if (pier) {
      put(x, y, z, "smooth_quartz");
    } else {
      put(x, y, z, "light_blue_stained_glass_pane", pane);
    }
  }

  // Warm light behind some second-floor glass.
  if (!doorColumn && alongFaceIdx % 4 === 1 && 7 > gr) {
    const [ix, iz] = INWARD[face];
    if (has(x + ix, z + iz)) put(x + ix, 7, z + iz, "shroomlight");
  }
}

// Entrance door (oak, two halves) with a lintel above (already smooth_quartz).
if (doorX !== null && has(doorX, doorZ) && gOf(doorX, doorZ) + 2 <= 8) {
  const gr = gOf(doorX, doorZ);
  const lower = { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" };
  const upper = { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" };
  put(doorX, gr + 1, doorZ, "oak_door", lower);
  put(doorX, gr + 2, doorZ, "oak_door", upper);
  // Shop-style threshold recess: stone slab in front of door step inside.
  const [ix, iz] = INWARD.north;
  if (has(doorX + ix, doorZ + iz)) put(doorX + ix, gr, doorZ + iz, "stone_brick_slab", { type: "top", waterlogged: "false" });
  // Lanterns on the door jambs, lit at dusk.
  for (const dx of [-1, 1]) {
    if (has(doorX + dx, doorZ)) put(doorX + dx, gr + 2, doorZ, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// 3. Rooftop plant: two air-conditioning blocks on the roof deck, inside the parapet.
{
  const xs = [...ground.keys()].map((s) => Number(s.split(",")[0]));
  const zs = [...ground.keys()].map((s) => Number(s.split(",")[1]));
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minZ = Math.min(...zs), maxZ = Math.max(...zs);
  const fits = (x0, z0, w, d) => {
    for (let x = x0; x < x0 + w; x++)
      for (let z = z0; z < z0 + d; z++)
        if (!has(x, z) || outward(x, z) !== null) return false;
    return true;
  };
  const placed = [];
  const candidates = [
    [Math.round((minX + maxX) / 2) - 5, Math.round((minZ + maxZ) / 2) - 6],
    [Math.round((minX + maxX) / 2) + 2, Math.round((minZ + maxZ) / 2) + 4],
  ];
  for (const [cx, cz] of candidates) {
    let found = null;
    for (let dz = -3; dz <= 3 && !found; dz++)
      for (let dx = -3; dx <= 3 && !found; dx++)
        if (fits(cx + dx, cz + dz, 3, 2)) found = [cx + dx, cz + dz];
    if (!found) continue;
    const [bx, bz] = found;
    if (placed.some(([px, pz]) => Math.abs(px - bx) < 4 && Math.abs(pz - bz) < 4)) continue;
    placed.push(found);
    for (let x = bx; x < bx + 3; x++)
      for (let z = bz; z < bz + 2; z++)
        for (let y = PARAPET; y <= PARAPET + 1; y++)
          put(x, y, z, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);
