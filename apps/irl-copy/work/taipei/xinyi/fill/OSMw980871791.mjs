import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Unknown record: a 2-storey mixed-use shophouse block with a flat roof, shopfronts on the
// street level, white tiled walls with glass bays, a stone plinth and a quartz cornice.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw980871791";
const W = 26, H = 23, D = 48;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const key = (x, z) => x + "," + z;
const ground = new Map();
for (const c of raw) {
  const [x, z, gr] = Array.isArray(c) ? c : [c.x, c.z, c.ground];
  ground.set(key(x, z), gr);
}
const has = (x, z) => ground.has(key(x, z));
const gAt = (x, z) => ground.get(key(x, z));

const B = Math.min(...ground.values());   // lowest ground under the footprint
const TOP = B + 11;                       // parapet top, about 11 blocks above lowest ground

const isEdge = (x, z) => !has(x + 1, z) || !has(x - 1, z) || !has(x, z + 1) || !has(x, z - 1);
const isCorner = (x, z) => (!has(x + 1, z) || !has(x - 1, z)) && (!has(x, z + 1) || !has(x, z - 1));

// entrance on the +z (south) street face, nearest the middle
let zMax = -Infinity, minX = Infinity, maxX = -Infinity;
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  zMax = Math.max(zMax, z);
  minX = Math.min(minX, x);
  maxX = Math.max(maxX, x);
}
const midX = (minX + maxX) / 2;
let ent = null;
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (z !== zMax) continue;
  if (!ent || Math.abs(x - midX) < Math.abs(ent.x - midX)) ent = { x, z };
}

const vox = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) vox.set(x, y, z, id, props);
  else vox.set(x, y, z, id);
};

const lights = [];

for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  const gr = gAt(x, z);

  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr && y < H; y++) put(x, y, z, "stone_bricks");

  const edge = isEdge(x, z);
  const corner = isCorner(x, z);
  // along-wall index for window rhythm
  const onNS = !has(x, z + 1) || !has(x, z - 1);
  const i = onNS ? x : z;

  for (let y = gr; y <= TOP && y < H; y++) {
    if (!edge) {
      if (y === gr && gr <= B + 10) put(x, y, z, "smooth_stone");          // interior floor
      else if (y === B + 5) put(x, y, z, "light_gray_concrete");          // storey slab
      else if (y === B + 10) put(x, y, z, "gray_concrete");               // roof deck
      continue;
    }
    if (corner) { put(x, y, z, "smooth_quartz"); continue; }             // corner piers
    if (y === gr) { put(x, y, z, "stone_bricks"); continue; }            // base course

    if (y <= B + 4) {                                                     // street level
      if (y === B + 4) { put(x, y, z, "red_terracotta"); continue; }      // sign band
      if (ent && x === ent.x && z === ent.z && (y === gr + 1 || y === gr + 2)) {
        put(x, y, z, "dark_oak_door", {
          facing: "south", half: y === gr + 1 ? "lower" : "upper",
          hinge: "left", open: "false", powered: "false",
        });
        continue;
      }
      if (ent && z === zMax && Math.abs(x - ent.x) <= 1 && y === gr + 3 && gr + 3 <= B + 3) {
        put(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
        continue;                                                          // entrance canopy
      }
      if ((x + z) % 4 === 0) put(x, y, z, "polished_andesite");           // shopfront piers
      else put(x, y, z, "glass");                                          // shop glazing
      continue;
    }
    if (y === B + 5) { put(x, y, z, "smooth_quartz"); continue; }        // storey line
    if (y <= B + 9) {                                                     // upper storey
      if (y === B + 6 || y === B + 9) { put(x, y, z, "white_concrete"); continue; }
      if (i % 3 === 0) { put(x, y, z, "white_concrete"); continue; }     // mullions
      put(x, y, z, "glass");
      if (y === B + 7 && i % 9 === 4) lights.push([x, z]);               // lit bays
      continue;
    }
    if (y === B + 10) { put(x, y, z, "smooth_quartz"); continue; }      // cornice
    put(x, y, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" }); // parapet cap
  }
}

// glowstone just inside some lit bays
for (const [x, z] of lights) {
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = x + dx, nz = z + dz;
    if (has(nx, nz) && !isEdge(nx, nz)) {
      put(nx, B + 7, nz, "glowstone");
      break;
    }
  }
}

// roof plant on the deck
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  const gr = gAt(x, z);
  if (isEdge(x, z) || gr > B + 10) continue;
  if (x % 7 === 3 && z % 9 === 4) put(x, TOP, z, "iron_block");
}

vox.save(`${DIR}/${ID}.nbt`);
