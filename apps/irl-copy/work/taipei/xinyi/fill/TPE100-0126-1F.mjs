import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE100-0126-1F";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// 47 x 139 footprint; roof about 7 blocks above lowest ground.
// Built 2011: a single-storey, white-clad commercial hall with a light-blue
// glass shopfront, white concrete mullions, a quartz cornice, a parapet,
// a flat roof and a few roof planters.
const W = 47, H = 19, D = 139;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;

// ---- Outline cells and their ground values ----
const ringGround = new Map();
for (const [x, z, gd] of cells) ringGround.set(key(x, z), gd);

// ---- Flood-fill the exterior from outside the grid ----
const exterior = new Set();
{
  const queue = [[-1, -1]];
  exterior.add(key(-1, -1));
  while (queue.length) {
    const [x, z] = queue.shift();
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, nz = z + dz;
      if (nx < -1 || nx > W || nz < -1 || nz > D) continue;
      const k = key(nx, nz);
      if (exterior.has(k) || ringGround.has(k)) continue;
      exterior.add(k);
      queue.push([nx, nz]);
    }
  }
}

// ---- Full footprint = outline + enclosed interior ----
const groundOf = new Map(ringGround);
const interiorCells = [];
for (let x = 0; x < W; x++) {
  for (let z = 0; z < D; z++) {
    const k = key(x, z);
    if (!ringGround.has(k) && !exterior.has(k)) interiorCells.push([x, z]);
  }
}
// Interior cells take the ground of the nearest outline cell (multi-source BFS).
{
  const queue = [];
  for (const [k, gd] of ringGround) {
    const [x, z] = k.split(",").map(Number);
    queue.push([x, z, gd]);
  }
  const seen = new Set(ringGround.keys());
  while (queue.length) {
    const [x, z, gd] = queue.shift();
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, nz = z + dz;
      if (nx < 0 || nx >= W || nz < 0 || nz >= D) continue;
      const k = key(nx, nz);
      if (seen.has(k) || exterior.has(k)) continue;
      seen.add(k);
      groundOf.set(k, gd);
      queue.push([nx, nz, gd]);
    }
  }
}
const fullCells = [];
for (const [k, gd] of groundOf) {
  const [x, z] = k.split(",").map(Number);
  fullCells.push([x, z, gd]);
}

const has = (x, z) => groundOf.has(key(x, z));
const DIRS = {
  north: [0, -1],
  south: [0, 1],
  west: [-1, 0],
  east: [1, 0],
};
const OPP = { north: "south", south: "north", west: "east", east: "west" };

// Outward facing direction of a perimeter cell (null for interior cells).
function outwardOf(x, z) {
  for (const name of ["north", "south", "west", "east"]) {
    const [dx, dz] = DIRS[name];
    if (!has(x + dx, z + dz)) return name;
  }
  return null;
}

// Along-wall coordinate for a given outward face.
const alongT = (x, z, out) => (out === "north" || out === "south" ? x : z);

// Safe setter: skips anything outside the grid.
function put(x, y, z, id, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// ---- Pass 1: classify perimeter cells and find the main entrance face ----
const perim = [];
const faceCount = { north: 0, south: 0, west: 0, east: 0 };
for (const [x, z, gd] of fullCells) {
  const out = outwardOf(x, z);
  if (out) {
    perim.push({ x, z, gd, out });
    faceCount[out]++;
  }
}
let mainFace = "south";
for (const f of Object.keys(faceCount)) {
  if (faceCount[f] > faceCount[mainFace]) mainFace = f;
}
const mainCells = perim
  .filter((p) => p.out === mainFace)
  .sort((a, b) => alongT(a.x, a.z, mainFace) - alongT(b.x, b.z, mainFace));
const midIdx = Math.floor(mainCells.length / 2);
const doorSet = new Set();
for (const i of [midIdx, midIdx + 1]) {
  if (mainCells[i]) doorSet.add(key(mainCells[i].x, mainCells[i].z));
}

// ---- Pass 2: build every footprint cell ----
for (const [x, z, gd] of fullCells) {
  // Foundation: solid from y 0 up to the cell's ground.
  for (let y = 0; y < gd; y++) put(x, y, z, "stone_bricks");
  // Floor slab at ground level.
  put(x, gd, z, "light_gray_concrete");

  const out = outwardOf(x, z);

  // Interior cells: air between floor and roof, roof slab on top.
  if (!out) {
    put(x, gd + 5, z, "gray_concrete");
    if ((x * 3 + z * 5) % 29 === 0) put(x, gd + 6, z, "moss_block");
    continue;
  }

  // Perimeter cells: facade.
  const t = alongT(x, z, out);
  const isDoor = doorSet.has(key(x, z));
  const mullion = t % 4 === 0;

  // Plinth course.
  put(x, gd + 1, z, "polished_andesite");

  if (isDoor) {
    // Double entrance: door lower and upper halves, glass above, quartz lintel.
    put(x, gd + 1, z, "oak_door", {
      facing: out, half: "lower", hinge: "left", open: "false", powered: "false",
    });
    put(x, gd + 2, z, "oak_door", {
      facing: out, half: "upper", hinge: "left", open: "false", powered: "false",
    });
    put(x, gd + 3, z, "light_blue_stained_glass");
    put(x, gd + 4, z, "smooth_quartz");
  } else {
    // Shopfront glass bays with white mullions.
    if (mullion) {
      put(x, gd + 2, z, "white_concrete");
      put(x, gd + 3, z, "white_concrete");
    } else {
      put(x, gd + 2, z, "light_blue_stained_glass");
      put(x, gd + 3, z, "light_blue_stained_glass");
    }
    // Lintel / storey line.
    put(x, gd + 4, z, "white_concrete");
  }

  // Quartz cornice and white parapet to a 7-block roof height.
  put(x, gd + 5, z, "smooth_quartz");
  put(x, gd + 6, z, "white_concrete");

  // Warm light just inside some glass bays.
  if (!isDoor && !mullion && t % 8 === 2) {
    const [dx, dz] = DIRS[OPP[out]];
    const ix = x + dx, iz = z + dz;
    if (has(ix, iz)) put(ix, gd + 2, iz, "shroomlight");
  }
}

g.save(`${DIR}/${ID}.nbt`);
