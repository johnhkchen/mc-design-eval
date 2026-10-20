import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw587265930";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Footprint 27 x 13. Reads as a 4-storey 1990s Xinyi office block:
// white concrete piers and spandrels, grey tinted glazing above a clear shopfront band,
// a stone plinth, a smooth quartz roof with a white parapet, and a small plant penthouse.
const W = 27, H = 33, D = 13;
const g = new Voxels([W, H, D]);

const ground = new Map();
const xs = [], zs = [];
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, gr);
  xs.push(x);
  zs.push(z);
}
const minX = Math.min(...xs);
const minZ = Math.min(...zs);

const has = (x, z) => ground.has(`${x},${z}`);

const FACES = [
  { dx: 0, dz: -1, facing: "north", axis: "x" },
  { dx: 0, dz: 1, facing: "south", axis: "x" },
  { dx: -1, dz: 0, facing: "west", axis: "z" },
  { dx: 1, dz: 0, facing: "east", axis: "z" },
];
const INWARD = {
  north: [0, 2],
  south: [0, -2],
  west: [2, 0],
  east: [-2, 0],
};

const facesOf = (x, z) => FACES.filter((f) => !has(x + f.dx, z + f.dz));

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Pass 1: foundation, storeys, roof, parapet
for (const [x, z, gr] of cells) {
  const ef = facesOf(x, z);
  const edge = ef.length > 0;
  const face = ef.find((f) => f.axis === "x") ?? ef[0];
  const idx = face ? (face.axis === "x" ? x - minX : z - minZ) : 0;
  const pier = idx % 3 === 0;

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Storeys: floor lines every 5 blocks (y % 5 === 0), lintel/beam at y % 5 === 4
  for (let y = gr; y <= 19; y++) {
    const r = y % 5;
    if (r === 0) {
      // floor slab across the footprint, spandrel on the facade
      put(x, y, z, "light_gray_concrete");
    } else if (r === 4) {
      if (edge) put(x, y, z, "white_concrete");
    } else {
      if (!edge) continue; // interior air behind the glass
      if (pier) {
        put(x, y, z, "white_concrete");
      } else if (y < 5) {
        put(x, y, z, "glass"); // clear shopfront band
      } else {
        put(x, y, z, "gray_stained_glass"); // tinted office glazing
      }
    }
  }

  // Roof slab
  put(x, 20, z, "smooth_quartz");

  // Parapet and cap on the perimeter
  if (edge) {
    put(x, 21, z, "white_concrete");
    put(x, 22, z, "white_concrete");
    put(x, 23, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
  }
}

// Pass 2: plant penthouse, central box on the roof
for (let x = 9; x <= 17; x++) {
  for (let z = 4; z <= 8; z++) {
    if (!has(x, z)) continue;
    put(x, 21, z, "light_gray_concrete");
    put(x, 24, z, "light_gray_concrete");
    const ring = x === 9 || x === 17 || z === 4 || z === 8;
    if (ring) {
      put(x, 22, z, "gray_stained_glass");
      put(x, 23, z, "light_gray_concrete");
    }
  }
}

// Antenna on the penthouse
if (has(13, 6)) put(13, 25, 6, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });

// Pass 3: entrance on the north (z min) face, centred on its cells
const northXs = xs.filter((x) => has(x, minZ) && !has(x, minZ - 1)).sort((a, b) => a - b);
if (northXs.length) {
  const doorX = northXs[Math.floor(northXs.length / 2)];
  const gr = ground.get(`${doorX},${minZ}`);
  const doorProps = (half) => ({
    facing: "north",
    half,
    hinge: "left",
    open: "false",
    powered: "false",
  });
  put(doorX, gr, minZ, "dark_oak_door", doorProps("lower"));
  put(doorX, gr + 1, minZ, "dark_oak_door", doorProps("upper"));
  // Frame the door with quartz jambs
  for (const fx of [doorX - 1, doorX + 1]) {
    if (!has(fx, minZ)) continue;
    for (let y = gr; y <= 3; y++) put(fx, y, minZ, "smooth_quartz");
  }
}

// Pass 4: warm lights set two blocks inside some upper-storey windows
for (const [x, z, gr] of cells) {
  const ef = facesOf(x, z);
  if (!ef.length) continue;
  for (const face of ef) {
    const idx = face.axis === "x" ? x - minX : z - minZ;
    if (idx % 3 === 0) continue;
    const [ix, iz] = INWARD[face.facing];
    const tx = x + ix, tz = z + iz;
    if (!has(tx, tz) || facesOf(tx, tz).length) continue;
    for (let y = Math.max(gr, 1); y <= 19; y++) {
      if (y % 5 !== 2) continue;
      if ((x * 7 + z * 3 + y) % 4 !== 0) continue;
      put(tx, y, tz, "glowstone");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
