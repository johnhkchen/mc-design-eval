import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no name. 15 x 11 footprint, roof ~11 blocks above lowest ground.
// Read as a two-storey, 1960s-80s Taipei commercial block: a stone base course,
// a shopfront ground floor with a central entrance, an upper storey with a
// window grid, a cornice and parapet, and a small rooftop mechanical penthouse.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw537993143";
const W = 15, H = 23, D = 11;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// footprint: "x,z" -> ground y (absolute structure coordinates)
const ground = new Map();
for (const [x, z, gr] of cells) {
  if (x >= 0 && x < W && z >= 0 && z < D) ground.set(`${x},${z}`, Math.round(gr));
}
const inFp = (x, z) => ground.has(`${x},${z}`);
const gr_of = (x, z) => ground.get(`${x},${z}`);

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const PANE = { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" };

// Outward faces of a footprint cell: N = z-1 side, S = z+1, W = x-1, E = x+1.
function outwardFaces(x, z) {
  const f = [];
  if (!inFp(x, z - 1)) f.push("N");
  if (!inFp(x, z + 1)) f.push("S");
  if (!inFp(x - 1, z)) f.push("W");
  if (!inFp(x + 1, z)) f.push("E");
  return f;
}

// Inward neighbour across the primary face.
const INWARD = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };

// Entrance: the N face cell columns, centred on the median.
const nCols = [];
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (z === Math.min(...[...ground.keys()].map(s => +s.split(",")[1])) && !inFp(x, z - 1)) nCols.push(x);
}
nCols.sort((a, b) => a - b);
const entranceX = nCols.length ? nCols[Math.floor(nCols.length / 2)] : Math.floor(W / 2);
const entranceZ = Math.min(...[...ground.keys()].map(s => +s.split(",")[1]));

// ---- Foundation and building body ----
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  // foundation from y 0 up to ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const faces = outwardFaces(x, z);
  const perimeter = faces.length > 0;

  if (!perimeter) {
    // interior: floor slabs and roof deck only, air between
    put(x, gr, z, "smooth_stone");
    put(x, gr + 5, z, "smooth_stone");
    put(x, gr + 10, z, "gray_concrete");
    continue;
  }

  const primary = faces[0];
  const idx = (primary === "N" || primary === "S") ? x : z;
  const corner = faces.length > 1;
  const pillar = corner || idx % 3 === 0;

  // base course
  put(x, gr, z, "polished_andesite");

  // ground floor: shopfront
  for (let y = gr + 1; y <= gr + 4; y++) {
    if (pillar) put(x, y, z, "white_concrete");
    else put(x, y, z, "glass_pane", PANE);
  }

  // storey line
  put(x, gr + 5, z, "smooth_stone");

  // upper floor: window grid
  for (let y = gr + 6; y <= gr + 8; y++) {
    if (pillar) put(x, y, z, "white_concrete");
    else put(x, y, z, "glass_pane", PANE);
  }

  // band, cornice, parapet
  put(x, gr + 9, z, "smooth_stone");
  put(x, gr + 10, z, "smooth_stone");
  put(x, gr + 11, z, "white_concrete");

  // warm lights behind some glass
  if (!pillar) {
    const [dx, dz] = INWARD[primary];
    const ix = x + dx, iz = z + dz;
    if (inFp(ix, iz) && outwardFaces(ix, iz).length === 0) {
      if (idx % 2 === 0) put(ix, gr + 7, iz, "glowstone");
      put(ix, gr + 1, iz, "lantern", { hanging: "false", waterlogged: "false" });
    }
  }
}

// ---- Roof deck inside the perimeter (interior cells not yet covered) ----
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  if (outwardFaces(x, z).length === 0) put(x, gr + 10, z, "gray_concrete");
}

// ---- Entrance: double door, canopy ----
{
  const gr = gr_of(entranceX, entranceZ);
  if (gr !== undefined) {
    put(entranceX, gr + 1, entranceZ, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(entranceX, gr + 2, entranceZ, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    // canopy across the entrance bay
    for (let dx = -1; dx <= 1; dx++) {
      const cg = gr_of(entranceX + dx, entranceZ);
      if (cg !== undefined) put(entranceX + dx, cg + 4, entranceZ, "black_concrete");
    }
  }
}

// ---- Rooftop mechanical penthouse, centred ----
{
  const x0 = 5, x1 = 9, z0 = 4, z1 = 6;
  for (let x = x0; x <= x1; x++) {
    for (let z = z0; z <= z1; z++) {
      if (!inFp(x, z)) continue;
      const gr = gr_of(x, z);
      const ring = x === x0 || x === x1 || z === z0 || z === z1;
      if (ring) {
        put(x, gr + 11, z, "light_gray_concrete");
        put(x, gr + 12, z, "light_gray_concrete");
      }
      put(x, gr + 13, z, "smooth_stone");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
