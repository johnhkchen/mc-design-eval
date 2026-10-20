import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538121687";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 23, H = 23, D = 21;
const g = new Voxels([W, H, D]);

// footprint lookup: "x,z" -> ground y of that cell
const ground = new Map();
for (const [x, z, b] of cells) ground.set(`${x},${z}`, b);
const has = (x, z) => ground.has(`${x},${z}`);
const baseOf = (x, z) => ground.get(`${x},${z}`);

// bounds-guarded setter (props optional)
function put(x, y, z, id, p) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
}

const DIRS = {
  north: [0, -1],
  south: [0, 1],
  west: [-1, 0],
  east: [1, 0],
};

// directions in which the neighbour is outside the footprint
function missingDirs(x, z) {
  const out = [];
  for (const [name, [dx, dz]] of Object.entries(DIRS)) {
    if (!has(x + dx, z + dz)) out.push(name);
  }
  return out;
}
const isExterior = (x, z) => missingDirs(x, z).length > 0;

// Pass 1: foundations, floor slabs, exterior walls
for (const [x, z, b] of cells) {
  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y <= b; y++) put(x, y, z, "stone_bricks");

  // floor slabs: ground-floor ceiling (b+5), upper floor ceiling/roof deck (b+10)
  put(x, b + 5, z, "smooth_stone");
  put(x, b + 10, z, "gray_concrete");

  if (!isExterior(x, z)) continue;

  // outward face: first missing direction
  const out = missingDirs(x, z)[0];
  const alongFace = out === "north" || out === "south" ? x : z;
  const mullion = alongFace % 3 === 0;

  for (let y = b + 1; y <= b + 10; y++) {
    if (y === b + 1) {
      // base course
      put(x, y, z, "stone_bricks");
    } else if (y === b + 5) {
      // storey line
      put(x, y, z, "smooth_stone");
    } else if (y === b + 10) {
      // cornice
      put(x, y, z, "light_gray_concrete");
    } else if (y <= b + 4) {
      // ground floor shopfront
      if (mullion) put(x, y, z, "white_concrete");
      else if (y === b + 4) put(x, y, z, "white_concrete");
      else put(x, y, z, "light_blue_stained_glass");
    } else {
      // upper storeys: window band between sill and head
      if (mullion) put(x, y, z, "white_concrete");
      else if (y === b + 6 || y === b + 9) put(x, y, z, "white_concrete");
      else put(x, y, z, "light_blue_stained_glass");
    }
  }

  // parapet cap
  put(x, b + 11, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

// Pass 2: entrance on the north-most face, centred along x
const minZ = Math.min(...cells.map(([, z]) => z));
const frontXs = cells.filter(([, z]) => z === minZ).map(([x]) => x).sort((a, b) => a - b);
if (frontXs.length) {
  const doorX = frontXs[Math.floor(frontXs.length / 2)];
  const doorZ = minZ;
  const b = baseOf(doorX, doorZ);
  const doorProps = (half) => ({
    facing: "north",
    half,
    hinge: "left",
    open: "false",
    powered: "false",
  });
  put(doorX, b + 1, doorZ, "oak_door", doorProps("lower"));
  put(doorX, b + 2, doorZ, "oak_door", doorProps("upper"));
  // hanging lantern under the storey line, above the door's glass transom
  put(doorX, b + 4, doorZ, "lantern", { hanging: "true", waterlogged: "false" });
}

// Pass 3: warm lights behind some upper-floor windows
for (const [x, z, b] of cells) {
  if (!isExterior(x, z)) continue;
  const out = missingDirs(x, z)[0];
  const [ox, oz] = DIRS[out];
  const alongFace = out === "north" || out === "south" ? x : z;
  if (alongFace % 3 === 0) continue;          // mullion, no window
  if (alongFace % 2 !== 0) continue;          // only every other window lit
  const ix = x - ox, iz = z - oz;             // inward neighbour
  if (!has(ix, iz) || isExterior(ix, iz)) continue;
  put(ix, b + 7, iz, "glowstone");
}

// Pass 4: roof plant on the centre of the roof
for (const [x, z, b] of cells) {
  if (isExterior(x, z)) continue;
  if (x >= 9 && x <= 13 && z >= 8 && z <= 12) {
    put(x, b + 11, z, "light_gray_concrete");
  }
  if (x >= 10 && x <= 12 && z >= 9 && z <= 11) {
    put(x, b + 12, z, "stone_bricks");
  }
}

g.save(`${DIR}/${ID}.nbt`);
