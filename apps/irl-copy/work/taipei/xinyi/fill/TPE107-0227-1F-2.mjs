import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE107-0227-1F-2";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// 11 x 19 x 11: 2018 low-rise commercial block, one 5-block storey with a
// parapet and roof plant, glazed shopfront on the south (street) face.
const W = 11, H = 19, D = 11;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const inside = (x, z) => ground.has(key(x, z));

const B = Math.min(...ground.values());   // lowest ground under the footprint
const T = B + 6;                          // roof deck: 7 blocks above lowest ground

const put = (x, y, z, id, p) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (p && Object.keys(p).length) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// Which outward face a cell sits on (null = interior of footprint).
const faceOf = (x, z) => {
  if (!inside(x, z + 1)) return "south";
  if (!inside(x, z - 1)) return "north";
  if (!inside(x + 1, z)) return "east";
  if (!inside(x - 1, z)) return "west";
  return null;
};

// Inward step for each face.
const inward = { south: [0, -1], north: [0, 1], east: [-1, 0], west: [1, 0] };

const xs = cells.map(c => c[0]), zs = cells.map(c => c[1]);
const minX = Math.min(...xs), maxX = Math.max(...xs);
const minZ = Math.min(...zs), maxZ = Math.max(...zs);

const paneProps = (face) =>
  (face === "north" || face === "south")
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

const doorAt = (x, face) => face === "south" && x === 5;

// Pass 1: foundation, floors, walls, cornice, parapet, roof.
for (const [x, z, gr] of cells) {
  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr && y < H; y++) put(x, y, z, "stone_bricks");

  const face = faceOf(x, z);

  for (let y = gr; y <= T && y < H; y++) {
    const r = y - gr;

    if (face === null) {
      // Interior: floor slab, ceiling, air gap, roof deck.
      if (y === T) put(x, y, z, "smooth_quartz");
      else if (r === 0) put(x, y, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
      else if (r === 4) put(x, y, z, "white_concrete");
      continue;
    }

    const idx = (face === "north" || face === "south") ? x : z;

    if (r === 0) {
      if (doorAt(x, face)) {
        put(x, y, z, "birch_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
      } else {
        put(x, y, z, "smooth_stone");
      }
    } else if (r >= 1 && r <= 3) {
      if (doorAt(x, face) && r === 1) {
        put(x, y, z, "birch_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
      } else if (idx % 3 === 0) {
        put(x, y, z, "white_concrete");                       // piers
      } else {
        put(x, y, z, "light_blue_stained_glass_pane", paneProps(face));
      }
    } else if (r === 4) {
      put(x, y, z, "quartz_slab", { type: "bottom", waterlogged: "false" }); // cornice
    } else if (r === 5) {
      put(x, y, z, "white_concrete");                           // parapet
    } else if (r === 6) {
      put(x, y, z, "smooth_quartz");                            // parapet cap
    }
  }
}

// Pass 2: warm lights behind some windows, corner lanterns, roof plant.
for (const [x, z, gr] of cells) {
  const face = faceOf(x, z);
  if (face === null) continue;

  const idx = (face === "north" || face === "south") ? x : z;
  const isWindow = !doorAt(x, face) && idx % 3 !== 0;
  const wy = gr + 2;

  if (isWindow && wy < T && idx % 2 === 0) {
    const [dx, dz] = inward[face];
    const ix = x + dx, iz = z + dz;
    if (inside(ix, iz) && faceOf(ix, iz) === null) {
      put(ix, wy, iz, "shroomlight");
    }
  }

  // Lanterns on the parapet corners.
  const cornerX = (x === minX || x === maxX);
  const cornerZ = (z === minZ || z === maxZ);
  if (cornerX && cornerZ && T + 1 < H) {
    put(x, T + 1, z, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// Roof plant: a 3 x 3 mechanical box at the centre of the roof.
if (T + 1 < H) {
  for (let x = 4; x <= 6; x++) {
    for (let z = 4; z <= 6; z++) {
      if (inside(x, z) && faceOf(x, z) === null) {
        put(x, T + 1, z, "light_gray_concrete");
      }
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
