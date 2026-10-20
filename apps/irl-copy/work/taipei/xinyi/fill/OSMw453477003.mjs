import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 信義之星, Xinyi district, Taipei. Read as a late-1990s/early-2000s Taipei office-residential tower:
// 12 storeys of about 5 blocks, white tiled piers and spandrels, pale-blue tinted glazing in grey mullions,
// a shopfront base with a recessed entrance, a cornice and parapet, roof plant, and a short mast.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw453477003";
const W = 27, H = 76, D = 42;
const ROOF = 64;          // roof about 64 blocks above lowest ground
const STOREY = 5;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, g] of cells) {
  if (x >= 0 && x < W && z >= 0 && z < D) ground.set(key(x, z), g);
}
const has = (x, z) => ground.has(key(x, z));
const gOf = (x, z) => ground.get(key(x, z));
const minG = Math.min(...ground.values());
const top = minG + ROOF;  // first y above the parapet

// Ring index: 1 = outer facade ring, larger = further inside (BFS from the outline).
const ring = new Map();
const queue = [];
for (const [k] of ground) {
  const [x, z] = k.split(",").map(Number);
  if (!has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1)) {
    ring.set(k, 1);
    queue.push([x, z]);
  }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  const r = ring.get(key(x, z));
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = x + dx, nz = z + dz;
    if (has(nx, nz) && !ring.has(key(nx, nz))) {
      ring.set(key(nx, nz), r + 1);
      queue.push([nx, nz]);
    }
  }
}

// Entrance: the front (min z) facade cell nearest the middle of the face.
const minZ = Math.min(...[...ground.keys()].map((k) => Number(k.split(",")[1])));
const frontXs = [...ground.keys()]
  .map((k) => k.split(",").map(Number))
  .filter(([x, z]) => z === minZ && ring.get(key(x, z)) === 1)
  .map(([x]) => x);
const midX = frontXs.length ? (Math.min(...frontXs) + Math.max(...frontXs)) / 2 : W / 2;
const entrance = frontXs.length
  ? frontXs.reduce((a, b) => (Math.abs(b - midX) < Math.abs(a - midX) ? b : a))
  : -1;

// Antenna sits on the deepest (core) cell nearest the centroid.
let cx = 0, cz = 0;
for (const k of ground.keys()) { const [x, z] = k.split(",").map(Number); cx += x; cz += z; }
cx /= ground.size; cz /= ground.size;
let mastKey = null, best = -1e9;
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  const score = ring.get(k) * 100 - Math.hypot(x - cx, z - cz);
  if (score > best) { best = score; mastKey = k; }
}
const [mastX, mastZ] = mastKey.split(",").map(Number);

const g = new Voxels([W, H, D]);
const set = (x, y, z, id, props) => {
  if (y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const glassProps = { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" };

for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);
  const R = ring.get(k);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) set(x, y, z, "stone_bricks");

  // Face information for facade cells.
  const xFace = !has(x - 1, z) || !has(x + 1, z);
  const zFace = !has(x, z - 1) || !has(x, z + 1);
  const corner = R === 1 && xFace && zFace;
  const along = zFace && !xFace ? x : z; // position along the wall the cell is on

  for (let y = gr; y < top; y++) {
    const rel = y - minG;
    const k5 = Math.floor(rel / STOREY);
    const r = rel % STOREY;

    if (R === 1) {
      // Outer facade ring.
      if (rel === 60) { set(x, y, z, "smooth_quartz"); continue; }       // cornice
      if (rel > 60) { set(x, y, z, "white_concrete"); continue; }        // parapet
      if (x === entrance && z === minZ && k5 === 0 && y - gr <= 1) {
        set(x, y, z, "iron_door", {
          facing: "north", half: y - gr === 0 ? "lower" : "upper",
          hinge: "left", open: "false", powered: "false",
        });
        continue;
      }
      if (r === 0) { set(x, y, z, "smooth_quartz"); continue; }          // storey line
      if (r === 4) { set(x, y, z, "white_concrete"); continue; }         // spandrel
      if (corner) { set(x, y, z, "white_concrete"); continue; }          // piers at corners
      if (along % 3 === 0) { set(x, y, z, "light_gray_concrete"); continue; } // mullions
      set(x, y, z, "light_blue_stained_glass_pane", glassProps);       // glazing
      continue;
    }

    // Inside the facade: structural core, air gap, floor slabs, roof plant.
    if (R >= 6) {
      set(x, y, z, "white_concrete");
      continue;
    }
    if (r === 0 && y < top - 1) {
      set(x, y, z, "light_gray_concrete");                               // floor slab
      continue;
    }
    if (R === 2 && r === 2 && k5 % 3 === 1 && (x + z + k5) % 5 === 0) {
      set(x, y, z, "shroomlight");                                       // warm light behind glass
      continue;
    }
    if (rel >= 61 && rel <= 62 && x % 6 === 3 && z % 6 === 3) {
      set(x, y, z, "light_gray_concrete");                               // roof plant
    }
  }

  // Core columns carry the mast above the roof.
  if (x === mastX && z === mastZ) {
    for (let y = minG + 60; y < minG + 64 && y < H; y++) set(x, y, z, "white_concrete");
    for (let y = minG + 64; y <= minG + 70 && y < H; y++) set(x, y, z, "iron_bars");
  }
}

g.save(`${DIR}/${ID}.nbt`);
