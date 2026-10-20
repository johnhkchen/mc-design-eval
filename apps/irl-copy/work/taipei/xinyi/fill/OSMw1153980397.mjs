import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1153980397";
const W = 16, H = 23, D = 29;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// footprint lookup
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));
const has = (x, z) => ground.has(`${x},${z}`);
const minG = Math.min(...[...ground.values()]);
const base = minG;
const isEdge = (x, z) => !has(x, z - 1) || !has(x, z + 1) || !has(x - 1, z) || !has(x + 1, z);
const isInterior = (x, z) => has(x, z) && !isEdge(x, z);

// front face: prefer north (lowest z), else south; door at the median x of that face
const northCells = cells.filter(([x, z]) => !has(x, z - 1)).map(([x, z]) => x).sort((a, b) => a - b);
const frontFace = northCells.length ? "N" : "S";
let doorX = -1, doorZ = -1;
{
  const pool = frontFace === "N"
    ? cells.filter(([x, z]) => !has(x, z - 1))
    : cells.filter(([x, z]) => !has(x, z + 1));
  if (pool.length) {
    const xs = pool.map(c => c[0]).sort((a, b) => a - b);
    const mid = xs[Math.floor(xs.length / 2)];
    const pick = pool.reduce((best, c) => (Math.abs(c[0] - mid) < Math.abs(best[0] - mid) ? c : best));
    doorX = pick[0];
    doorZ = pick[1];
  }
}

for (const [x, z, grRaw] of cells) {
  const gr = Math.round(grRaw);
  // roof: 11 blocks above lowest ground, stepped only where the ground climbs steeply
  const T = Math.min(Math.max(base + 10, gr + 10), H - 2);

  // foundation under every footprint cell
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (isEdge(x, z)) {
    // choose the exposed face for the facade pattern
    let face;
    if (!has(x, z - 1)) face = "N";
    else if (!has(x, z + 1)) face = "S";
    else if (!has(x - 1, z)) face = "W";
    else face = "E";
    const i = face === "N" || face === "S" ? x : z;
    const pier = i % 3 === 0;
    const isDoor = x === doorX && z === doorZ;

    for (let y = gr; y <= T; y++) {
      let id;
      if (y === gr) id = "smooth_stone";
      else if (y <= gr + 4) {
        if (y === gr + 4) id = "smooth_stone";
        else id = pier ? "light_gray_concrete" : "light_blue_stained_glass";
      } else if (y === gr + 5) id = "light_gray_concrete";
      else if (y <= gr + 9) {
        if (pier) id = "light_gray_concrete";
        else if (y === gr + 6 || y === gr + 9) id = "white_concrete";
        else id = "light_blue_stained_glass";
      } else if (y === gr + 10) id = "smooth_stone";
      else id = "white_concrete";

      if (isDoor && (y === gr + 1 || y === gr + 2)) {
        const half = y === gr + 1 ? "lower" : "upper";
        put(x, y, z, "oak_door", {
          facing: "north", half, hinge: "left", open: "false", powered: "false",
        });
        continue;
      }
      if (isDoor && y === gr + 3) id = "light_blue_stained_glass";
      put(x, y, z, id);
    }

    // warm light behind some upper-floor windows
    if (!pier && (i % 4 === 1)) {
      let dx = 0, dz = 0;
      if (face === "N") dz = 1;
      else if (face === "S") dz = -1;
      else if (face === "W") dx = 1;
      else dx = -1;
      const ix = x + dx, iz = z + dz;
      if (isInterior(ix, iz)) put(ix, gr + 7, iz, "glowstone");
    }
  } else {
    // interior: floor slabs per storey and a roof slab, air between
    put(x, gr, z, "smooth_stone");
    put(x, gr + 5, z, "light_gray_concrete");
    if (T > gr + 10) put(x, gr + 10, z, "light_gray_concrete");
    put(x, T, z, "light_gray_concrete");

    // rooftop air-conditioning units, sparse
    if ((x + 2 * z) % 7 === 0 && T + 1 < H) {
      put(x, T + 1, z, "gray_concrete");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
