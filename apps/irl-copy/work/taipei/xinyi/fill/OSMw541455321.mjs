import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Xinyi district, Taipei: a 2-storey 1980s-style commercial block (cream
// painted concrete, granite base, aluminium-framed glass shopfront, flat
// parapet roof with a small plant room). Roof is about 11 blocks above the
// lowest ground.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541455321";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 19, H = 23, D = 23;
const g = new Voxels([W, H, D]);

// Footprint map: "x,z" -> ground y (clamped to a sane range).
const G = new Map();
let minX = 1e9, maxX = -1, minZ = 1e9, maxZ = -1;
for (const [x, z, gr] of cells) {
  G.set(`${x},${z}`, Math.max(0, Math.min(8, Math.round(gr))));
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}

const inF = (x, z) => G.has(`${x},${z}`);
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const OPP = { N: "S", S: "N", W: "E", E: "W" };
const missingOf = (x, z) =>
  Object.keys(DIRS).filter((d) => !inF(x + DIRS[d][0], z + DIRS[d][1]));

const put = (x, y, z, id, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// Glass panes: connect along the face they sit in.
const glassFor = (missing) => {
  const zFace = missing.includes("N") || missing.includes("S");
  return {
    id: "light_blue_stained_glass_pane",
    p: zFace
      ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
      : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" },
  };
};

// Entrance: one door on the street (north, z min) face, placed on a
// non-pier column near the middle of the front row.
let doorX = Math.floor((minX + maxX) / 2);
if ((doorX - minX) % 3 === 0) doorX++;
const doorExists = inF(doorX, minZ) && missingOf(doorX, minZ).includes("N");

// Wall material/glass choice for one edge cell at height y.
function wallBlock(x, y, z, missing, gr) {
  const corner = missing.length >= 2;
  const zFace = missing.includes("N") || missing.includes("S");
  const lx = zFace ? x - minX : z - minZ;
  const front = missing.includes("N");
  const isDoor = doorExists && front && x === doorX && z === minZ;

  if (isDoor) {
    if (y <= gr + 1) return null; // door is placed in a later pass
    if (y <= 3) return { id: "light_gray_concrete" };
  }
  if (y === gr) return { id: "polished_andesite" }; // granite-style base course
  if (corner || lx % 3 === 0) return { id: "white_concrete" }; // piers

  if (y <= 4) {
    if (y === 4) return { id: "light_gray_concrete" }; // ground-floor lintel
    if (y === 2 || y === 3 || (front && y > gr)) return glassFor(missing); // shopfront
    return { id: "white_concrete" };
  }
  if (y === 6 || y === 9) return { id: "light_gray_concrete" }; // sills and head
  if (y === 7 || y === 8) return glassFor(missing);
  return { id: "white_concrete" };
}

// Pass 1: structure, walls, floors, roof.
for (const [x, z] of [...G.keys()].map((k) => k.split(",").map(Number))) {
  const gr = G.get(`${x},${z}`);
  const miss = missingOf(x, z);
  const edge = miss.length > 0;

  // Foundation up to the cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Interior ground-floor slab.
  if (!edge && gr <= 4) put(x, gr, z, "smooth_stone");

  // Storey 1 and storey 2 walls on the perimeter.
  if (edge) {
    for (let y = gr; y <= 4; y++) {
      const b = wallBlock(x, y, z, miss, gr);
      if (b) put(x, y, z, b.id, b.p);
    }
    for (let y = Math.max(6, gr); y <= 9; y++) {
      const b = wallBlock(x, y, z, miss, gr);
      if (b) put(x, y, z, b.id, b.p);
    }
  }

  // Floor slab / string course between storeys.
  put(x, 5, z, "light_gray_concrete");

  // Roof deck; perimeter cornice course.
  put(x, 10, z, edge ? "smooth_stone" : "light_gray_concrete");

  // Parapet on the perimeter.
  if (edge) put(x, 11, z, "white_concrete");
}

// Pass 2: entrance door on the street face.
if (doorExists) {
  const dg = G.get(`${doorX},${minZ}`);
  if (dg <= 3) {
    put(doorX, dg, minZ, "oak_door", {
      facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
    });
    put(doorX, dg + 1, minZ, "oak_door", {
      facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
    });
  }
}

// Pass 3: warm light behind some windows (glowstone in the room behind the glass).
for (const [x, z] of [...G.keys()].map((k) => k.split(",").map(Number))) {
  const miss = missingOf(x, z);
  if (miss.length !== 1) continue; // straight wall cells only
  const zFace = miss[0] === "N" || miss[0] === "S";
  const lx = zFace ? x - minX : z - minZ;
  if (lx % 6 !== 1) continue; // lit window columns
  const inward = DIRS[OPP[miss[0]]];
  const ix = x + inward[0], iz = z + inward[1];
  if (!inF(ix, iz) || missingOf(ix, iz).length > 0) continue; // need a clear interior cell
  const innerGr = G.get(`${ix},${iz}`);
  put(ix, 7, iz, "glowstone"); // upper storey, always clear air
  if (innerGr < 2) put(ix, 2, iz, "glowstone"); // ground storey
}

// Pass 4: small roof plant room near the centre.
const cx = Math.floor((minX + maxX) / 2);
const cz = Math.floor((minZ + maxZ) / 2);
for (let x = cx - 2; x <= cx + 1; x++) {
  for (let z = cz - 1; z <= cz + 1; z++) {
    if (!inF(x, z)) continue;
    if (missingOf(x, z).length > 0) continue;
    put(x, 11, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
