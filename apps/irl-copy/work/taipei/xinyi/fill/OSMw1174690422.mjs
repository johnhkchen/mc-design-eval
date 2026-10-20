import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1174690422";
const W = 20, H = 23, D = 18;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground y
const gm = new Map();
for (const [x, z, gy] of cells) gm.set(`${x},${z}`, gy);
const inside = (x, z) => gm.has(`${x},${z}`);

const OUT = {
  north: [0, -1],
  south: [0, 1],
  west: [-1, 0],
  east: [1, 0],
};

// Outward-facing sides of a footprint cell
function facesOf(x, z) {
  const out = [];
  for (const [name, [dx, dz]] of Object.entries(OUT)) {
    if (!inside(x + dx, z + dz)) out.push(name);
  }
  return out;
}

function put(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Entrance: south-facing cell nearest to the middle of the front
let door = null;
for (const [x, z] of cells.map(([a, b]) => [a, b])) {
  if (!facesOf(x, z).includes("south")) continue;
  const score = Math.abs(x - Math.floor(W / 2));
  if (!door || score < door.score || (score === door.score && x < door.x)) {
    door = { x, z, score };
  }
}

// Pass 1: columns, foundations, floors, facades
for (const [x, z, gy] of cells) {
  if (gy + 12 >= H) continue; // keep parapet and roof kit inside the volume

  // Foundation plinth under the cell
  for (let y = 0; y < gy; y++) put(x, y, z, "stone_bricks");

  const fs = facesOf(x, z);

  // Interior cell: floor slab per storey plus roof deck
  if (fs.length === 0) {
    put(x, gy + 5, z, "smooth_stone");
    put(x, gy + 10, z, "light_gray_concrete");
    continue;
  }

  // Perimeter cell
  put(x, gy, z, "stone_bricks"); // base course
  for (let y = gy + 1; y <= gy + 9; y++) put(x, y, z, "white_concrete");
  put(x, gy + 4, z, "smooth_quartz"); // storey line
  put(x, gy + 5, z, "smooth_quartz");
  put(x, gy + 10, z, "smooth_quartz"); // cornice
  put(x, gy + 11, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" }); // parapet

  // Corners: continuous quartz pillar
  if (fs.length >= 2) {
    for (let y = gy + 1; y <= gy + 9; y++) {
      if (y === gy + 4 || y === gy + 5) continue;
      put(x, y, z, "quartz_pillar", { axis: "y" });
    }
    continue;
  }

  const f = fs[0];
  const along = f === "north" || f === "south" ? x : z;
  const pier = along % 3 === 0;
  const paneRow = f === "north" || f === "south"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

  const isDoor = door && f === "south" && x === door.x && z === door.z;
  const windowYs = [gy + 1, gy + 2, gy + 3, gy + 6, gy + 7, gy + 8, gy + 9];

  if (isDoor) {
    // Recessed entrance with lintel above
    put(x, gy + 1, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, gy + 2, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
    put(x, gy + 3, z, "stone_bricks");
    continue;
  }

  for (const y of windowYs) {
    if (pier) {
      put(x, y, z, "quartz_pillar", { axis: "y" });
    } else {
      put(x, y, z, "gray_stained_glass_pane", paneRow);
    }
  }

  // Warm light behind some upper-storey glass
  if (!pier && along % 6 === 2) {
    const [ox, oz] = OUT[f];
    const ix = x - ox, iz = z - oz;
    if (inside(ix, iz)) put(ix, gy + 7, iz, "glowstone");
  }
}

// Pass 2: rooftop mechanical plant in the middle of the roof
for (const [x, z, gy] of cells) {
  if (gy + 12 >= H) continue;
  if (x < 7 || x > 12 || z < 6 || z > 10) continue;
  if (facesOf(x, z).length > 0) continue;
  put(x, gy + 11, z, "light_gray_concrete");
  if ((x + z) % 2 === 0) put(x, gy + 12, z, "iron_block");
}

g.save(`${DIR}/${ID}.nbt`);
