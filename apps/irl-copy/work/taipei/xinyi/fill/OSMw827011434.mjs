import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw827011434";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 5, H = 23, D = 9;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground height above lowest ground
const key = (x, z) => `${x},${z}`;
const G = new Map();
for (const [x, z, gr] of cells) G.set(key(x, z), gr);
const inS = (x, z) => G.has(key(x, z));
const groundOf = (x, z) => G.get(key(x, z));

// Outward faces: [dx, dz, facing]
const DIRS = [
  [0, -1, "north"],
  [0, 1, "south"],
  [-1, 0, "west"],
  [1, 0, "east"],
];
const exteriorFaces = (x, z) => DIRS.filter(([dx, dz]) => !inS(x + dx, z + dz));

// Coordinate running along a face (x for north/south faces, z for east/west)
const alongCoord = (dx, dz, x, z) => (dz !== 0 ? x : z);

// Min along-coordinate per face direction, for pier/window rhythm
const faceMin = {};
for (const [x, z] of G.keys().map((k) => k.split(",").map(Number))) {
  for (const [dx, dz, facing] of exteriorFaces(x, z)) {
    const u = alongCoord(dx, dz, x, z);
    faceMin[facing] = faceMin[facing] === undefined ? u : Math.min(faceMin[facing], u);
  }
}

// Bounds-checked setter
const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Door face: north side if present, otherwise the first exterior face found
let doorFace = null;
const allFaces = [];
for (const [x, z] of G.keys().map((k) => k.split(",").map(Number))) {
  for (const f of exteriorFaces(x, z)) allFaces.push({ x, z, f });
}
const northFaces = allFaces.filter((e) => e.f[2] === "north");
const pickFrom = northFaces.length ? northFaces : allFaces;
let doorCell = null;
if (pickFrom.length) {
  pickFrom.sort((a, b) => alongCoord(a.f[0], a.f[1], a.x, a.z) - alongCoord(b.f[0], b.f[1], b.x, b.z));
  const mid = pickFrom[Math.floor(pickFrom.length / 2)];
  doorCell = { x: mid.x, z: mid.z };
  doorFace = mid.f;
}

for (const [x, z, gr] of cells) {
  const ex = exteriorFaces(x, z);
  const exterior = ex.length > 0;
  const corner = ex.length >= 2;
  const [fdx, fdz, fFacing] = ex[0] ?? [0, 0, null];

  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Ground-level plinth on the exterior, floor slab inside
  put(x, gr, z, exterior ? "gray_concrete" : "smooth_stone");

  // Storey line between floors (y gr+5)
  put(x, gr + 5, z, exterior ? "white_concrete" : "smooth_stone");

  // Roof deck / parapet base at gr+10
  put(x, gr + 10, z, exterior ? "white_concrete" : "light_gray_concrete");

  // Cornice cap at gr+11 on exterior cells
  if (exterior) put(x, gr + 11, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });

  if (!exterior) continue;

  const u = alongCoord(fdx, fdz, x, z) - faceMin[fFacing];
  const isDoorCell = doorCell && doorCell.x === x && doorCell.z === z;
  const doorHere = isDoorCell && doorFace && doorFace[2] === fFacing;

  // Ground storey: shopfront with piers, door, red sign band
  if (doorHere) {
    put(x, gr + 1, z, "dark_oak_door", {
      facing: fFacing, half: "lower", hinge: "left", open: "false", powered: "false",
    });
    put(x, gr + 2, z, "dark_oak_door", {
      facing: fFacing, half: "upper", hinge: "left", open: "false", powered: "false",
    });
    put(x, gr + 3, z, "red_terracotta");
  } else if (corner || u % 4 === 0) {
    for (let y = gr + 1; y <= gr + 3; y++) put(x, y, z, "smooth_quartz");
  } else {
    for (let y = gr + 1; y <= gr + 3; y++) put(x, y, z, "glass_pane");
  }
  put(x, gr + 4, z, "red_terracotta");

  // Upper storey: window grid with piers, head band, and warm light behind some glass
  const upperPier = corner || u % 2 === 0;
  for (let y = gr + 6; y <= gr + 8; y++) {
    put(x, y, z, upperPier ? "smooth_quartz" : "glass_pane");
  }
  put(x, gr + 9, z, "white_concrete");

  if (!upperPier && u % 4 === 1) {
    // Interior cell directly behind this window, if the footprint has one
    const ix = x - fdx, iz = z - fdz;
    if (inS(ix, iz)) put(ix, gr + 7, iz, "glowstone");
  }
}

// Small rooftop AC unit on the first interior roof cell
for (const [x, z, gr] of cells) {
  if (exteriorFaces(x, z).length === 0 && gr + 11 < H) {
    put(x, gr + 11, z, "iron_block");
    break;
  }
}

g.save(`${DIR}/${ID}.nbt`);
