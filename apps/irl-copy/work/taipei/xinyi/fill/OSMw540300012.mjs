import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540300012";
const W = 42, H = 23, D = 16;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Footprint lookup: key "x,z" -> ground value
const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const c of cells) {
  const [x, z, gr] = c;
  ground.set(key(x, z), Number.isFinite(gr) ? gr : 0);
}

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
// Inward offset for each outward face
const INWARD = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

function exposedFaces(x, z) {
  return Object.keys(DIRS).filter(k => {
    const [dx, dz] = DIRS[k];
    return !ground.has(key(x + dx, z + dz));
  });
}

const glassProps = { north: "true", south: "true", east: "true", west: "true" };

// Pass 1: foundation, floor slabs, roof deck, for every footprint cell
for (const [x, z] of [...ground.keys()].map(k => k.split(",").map(Number))) {
  const base = ground.get(key(x, z));
  // Foundation from y=0 up to the cell's ground
  for (let y = 0; y < base; y++) put(x, y, z, "stone_bricks");
  // Ground floor slab
  put(x, base, z, "smooth_stone");
  // Storey line between the two storeys
  put(x, base + 5, z, "smooth_stone");
  // Roof deck (interior top); parapet is added on the perimeter below
  put(x, base + 9, z, "light_gray_concrete");
}

// Pass 2: facade on perimeter cells
const doorCandidates = { N: [], S: [] };

for (const [x, z] of [...ground.keys()].map(k => k.split(",").map(Number))) {
  const base = ground.get(key(x, z));
  const faces = exposedFaces(x, z);
  if (faces.length === 0) continue;

  const corner = faces.length > 1;
  const face = faces[0];
  const u = (face === "N" || face === "S") ? x : z;
  const pier = corner || (u % 3 === 0);

  // Plinth
  put(x, base, z, "stone_bricks");

  // Ground floor: shopfront glazing between piers
  for (let dy = 1; dy <= 3; dy++) {
    if (pier) put(x, base + dy, z, "white_concrete");
    else put(x, base + dy, z, "glass_pane", glassProps);
  }
  // Awning band
  put(x, base + 4, z, pier ? "white_concrete" : "red_concrete");

  // Storey line
  put(x, base + 5, z, "smooth_stone");

  // Upper floor: framed windows
  if (pier) {
    put(x, base + 6, z, "white_concrete");
    put(x, base + 7, z, "white_concrete");
    put(x, base + 8, z, "white_concrete");
  } else {
    put(x, base + 6, z, "white_concrete");
    put(x, base + 7, z, "glass_pane", glassProps);
    put(x, base + 8, z, "white_concrete");
  }

  // Cornice and parapet
  put(x, base + 9, z, "quartz_block");
  put(x, base + 10, z, "white_concrete");

  // Corner lanterns on the parapet
  if (corner) put(x, base + 11, z, "lantern", { hanging: "false" });

  // Door candidates on north/south faces (non-pier, non-corner)
  if (!corner && !pier && (face === "N" || face === "S")) {
    doorCandidates[face].push({ x, z, base, u });
  }

  // Warm lights behind the glass (interior cell must be footprint and not wall)
  if (!pier && !corner) {
    const [ix, iz] = [x + INWARD[face][0], z + INWARD[face][1]];
    const interiorOk = ground.has(key(ix, iz)) && exposedFaces(ix, iz).length === 0;
    if (interiorOk) {
      const ib = ground.get(key(ix, iz));
      if (u % 6 === 2) put(ix, ib + 2, iz, "glowstone");
      if (u % 6 === 4) put(ix, ib + 7, iz, "glowstone");
    }
  }
}

// Pass 3: entrance door, centred on the north face (fallback south)
let door = null;
let doorFace = "N";
if (doorCandidates.N.length) {
  door = doorCandidates.N.reduce((a, b) => Math.abs(a.u - 21) <= Math.abs(b.u - 21) ? a : b);
} else if (doorCandidates.S.length) {
  doorFace = "S";
  door = doorCandidates.S.reduce((a, b) => Math.abs(a.u - 21) <= Math.abs(b.u - 21) ? a : b);
}

if (door) {
  const facing = doorFace === "N" ? "north" : "south";
  const hingeProps = (half) => ({ facing, half, hinge: "left", open: "false", powered: "false" });
  put(door.x, door.base + 1, door.z, "iron_door", hingeProps("lower"));
  put(door.x, door.base + 2, door.z, "iron_door", hingeProps("upper"));
  // Transom glazing above the door
  put(door.x, door.base + 3, door.z, "glass_pane", glassProps);
  // Canopy band above the entrance
  put(door.x, door.base + 4, door.z, "red_concrete");
}

g.save(`${DIR}/${ID}.nbt`);
