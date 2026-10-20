import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise Xinyi commercial block, c. 1990s: two storeys over a shopfront,
// pale concrete with tinted glazing, a cornice and parapet, rooftop plant.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538402982";
const W = 20, H = 23, D = 31;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
let G = 0;
let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, gr);
  G = Math.max(G, gr);
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}
const cx = Math.round((minX + maxX) / 2);
const cz = Math.round((minZ + maxZ) / 2);

const has = (x, z) => ground.has(`${x},${z}`);
const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const OPP = { north: "south", south: "north", west: "east", east: "west" };
const missing = (x, z) =>
  Object.entries(DIRS).filter(([, [dx, dz]]) => !has(x + dx, z + dz)).map(([n]) => n);

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Foundation: solid from y 0 up to each cell's ground and on to the building base G.
for (const [x, z] of cells) {
  for (let y = 0; y < G; y++) put(x, y, z, "stone_bricks");
}

// Door: front (south-facing) edge cell nearest the middle of the frontage.
let doorKey = null, doorX = cx, doorZ = maxZ, doorFace = "south";
{
  let best = Infinity;
  for (const [x, z] of cells) {
    const m = missing(x, z);
    if (!m.includes("south")) continue;
    const score = Math.abs(x - cx) + (m.length > 1 ? 5 : 0) - z * 0.001;
    if (score < best) { best = score; doorX = x; doorZ = z; doorKey = `${x},${z}`; }
  }
  if (!doorKey) {
    for (const [x, z] of cells) {
      if (missing(x, z).length && (!doorKey || z > doorZ)) { doorKey = `${x},${z}`; doorX = x; doorZ = z; }
    }
    const m = missing(doorX, doorZ);
    doorFace = m[0] || "south";
  }
}
const canopy = new Set();
for (const [x, z] of cells) {
  if (missing(x, z).includes("south") && Math.abs(x - doorX) <= 1) canopy.add(`${x},${z}`);
}

// Floor slabs and roof, cornice on the edge.
for (const [x, z] of cells) {
  const edge = missing(x, z).length > 0;
  put(x, G + 5, z, "light_gray_concrete");          // second-floor slab
  put(x, G + 10, z, edge ? "smooth_stone" : "light_gray_concrete"); // roof / cornice
}

// Facade on edge cells.
for (const [x, z] of cells) {
  const miss = missing(x, z);
  if (!miss.length) continue;
  const key = `${x},${z}`;
  const corner = miss.length > 1;
  const u = x + z;
  const pillar = corner || u % 4 === 0;
  const isDoor = key === doorKey;

  put(x, G, z, "stone_bricks");                       // base course

  for (let y = G + 1; y <= G + 3; y++) {              // shopfront
    put(x, y, z, pillar ? "white_concrete" : "glass");
  }
  if (canopy.has(key)) {                               // canopy over entrance
    put(x, G + 4, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  } else {
    put(x, G + 4, z, "light_gray_concrete");          // storey line
  }

  put(x, G + 6, z, "smooth_stone");                   // sill course
  for (const y of [G + 7, G + 8]) {                   // upper windows
    put(x, y, z, pillar ? "white_concrete" : "light_blue_stained_glass");
  }
  put(x, G + 9, z, "light_gray_concrete");            // head band
  put(x, G + 11, z, "white_concrete");                // parapet
}

// Entrance door (two blocks), placed after the shopfront.
if (doorKey) {
  put(doorX, G + 1, doorZ, "dark_oak_door", {
    facing: doorFace, half: "lower", hinge: "left", open: "false", powered: "false",
  });
  put(doorX, G + 2, doorZ, "dark_oak_door", {
    facing: doorFace, half: "upper", hinge: "left", open: "false", powered: "false",
  });
}

// Warm light behind glass: glowstone on the inside of selected bays.
for (const [x, z] of cells) {
  const miss = missing(x, z);
  if (!miss.length || miss.length > 1) continue;
  const key = `${x},${z}`;
  if (key === doorKey) continue;
  const u = x + z;
  if (u % 4 === 0) continue;
  const [dx, dz] = DIRS[OPP[miss[0]]];
  const ix = x + dx, iz = z + dz;
  if (!has(ix, iz)) continue;
  if (u % 8 === 2) put(ix, G + 7, iz, "glowstone");
  if (u % 8 === 6) put(ix, G + 2, iz, "glowstone");
}

// Rooftop plant: a service box with a vent on top, set inboard of the parapet.
for (const [x, z] of cells) {
  if (missing(x, z).length) continue;
  if (Math.abs(x - cx) <= 2 && Math.abs(z - cz) <= 3) put(x, G + 11, z, "light_gray_concrete");
  if (Math.abs(x - cx) <= 1 && Math.abs(z - cz) <= 1) put(x, G + 12, z, "iron_block");
}

g.save(`${DIR}/${ID}.nbt`);
