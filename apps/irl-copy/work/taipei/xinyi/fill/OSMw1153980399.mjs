import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1153980399";
const W = 15, H = 23, D = 13;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const key = (x, z) => `${x},${z}`;

// Lowest ground under the footprint is the datum; roof sits 11 blocks above it.
const minG = Math.min(...ground.values());
const L0 = Math.min(minG, H - 12);

// Outward faces. "along" is the coordinate that runs along the face.
const FACES = [
  { dx: 0, dz: -1, facing: "north", along: "x" },
  { dx: 0, dz: 1, facing: "south", along: "x" },
  { dx: 1, dz: 0, facing: "east", along: "z" },
  { dx: -1, dz: 0, facing: "west", along: "z" },
];
const alongOf = (f, x, z) => (f.along === "x" ? x : z);

// Entrance: middle of the north-facing wall.
const northCells = [];
for (const [x, z] of ground.keys().map(k => k.split(",").map(Number))) {
  if (!has(x, z - 1)) northCells.push([x, z]);
}
northCells.sort((a, b) => a[0] - b[0]);
const doorKey = northCells.length ? key(...northCells[Math.floor(northCells.length / 2)]) : null;

// Interior cells directly behind upper-floor windows get warm light.
const lightCells = new Set();
for (const [x, z] of ground.keys().map(k => k.split(",").map(Number))) {
  const edgeFaces = FACES.filter(f => !has(x + f.dx, z + f.dz));
  if (!edgeFaces.length) continue;
  for (const f of edgeFaces) {
    if (alongOf(f, x, z) % 6 === 1) {
      const ix = x - f.dx, iz = z - f.dz;
      if (has(ix, iz) && FACES.every(ff => has(ix + ff.dx, iz + ff.dz))) {
        lightCells.add(key(ix, iz));
      }
    }
  }
}

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

for (const [x, z, gr] of cells) {
  const k = key(x, z);
  const edgeFaces = FACES.filter(f => !has(x + f.dx, z + f.dz));
  const isEdge = edgeFaces.length > 0;
  const windowHere = edgeFaces.some(f => alongOf(f, x, z) % 3 !== 0);
  const isDoor = isEdge && k === doorKey;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr && y < H; y++) put(x, y, z, "stone_bricks");

  for (let yy = 0; yy <= 11; yy++) {
    const y = L0 + yy;
    if (y >= H) break;
    if (y < gr) continue;

    if (!isEdge) {
      // Interior: floor slabs only, air gap otherwise.
      if (yy === 0 || yy === 5 || yy === 10) {
        put(x, y, z, "smooth_stone");
      } else if (yy === 7 && lightCells.has(k)) {
        put(x, y, z, "glowstone");
      } else if (yy === 11 && x % 4 === 2 && z % 4 === 2) {
        put(x, y, z, "gray_concrete"); // roof equipment
      }
      continue;
    }

    // Shell cell.
    if (isDoor && (yy === 1 || yy === 2)) {
      const half = yy === 1 ? "lower" : "upper";
      put(x, y, z, "oak_door", { facing: "north", half, hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (yy === 0) {
      put(x, y, z, "stone_bricks"); // base course
    } else if (yy <= 3) {
      if (isDoor && yy === 3) put(x, y, z, "glass");
      else put(x, y, z, windowHere ? "glass" : "white_terracotta");
    } else if (yy === 4) {
      put(x, y, z, "smooth_stone"); // lintel band
    } else if (yy === 5) {
      put(x, y, z, "smooth_stone"); // storey line / cornice
    } else if (yy === 6 || yy === 9) {
      put(x, y, z, "white_terracotta"); // window head and sill frames
    } else if (yy === 7 || yy === 8) {
      put(x, y, z, windowHere ? "glass_pane" : "white_terracotta");
    } else if (yy === 10) {
      put(x, y, z, "smooth_stone"); // roof slab
    } else if (yy === 11) {
      put(x, y, z, "stone_brick_wall"); // parapet
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
