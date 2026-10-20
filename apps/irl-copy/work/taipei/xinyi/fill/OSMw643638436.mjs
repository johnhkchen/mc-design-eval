// Taipei Xinyi: a 1990s five-storey commercial block, reinforced concrete frame
// with white-tiled facade, light-grey pier fins, glazed ground-floor shopfronts
// under a red fascia band, a quartz cornice, and a dark roof with plant screens.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw643638436";
const W = 86, D = 17, H = 38;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const list = Array.isArray(raw) ? raw : raw.cells;
const minG = Math.min(...list.map(c => c[2]));

const key = (x, z) => `${x},${z}`;
const ground = new Map();                       // "x,z" -> base y (relative to lowest ground)
for (const [x, z, gr] of list) ground.set(key(x, z), gr - minG);
const has = (x, z) => ground.has(key(x, z));

// Outward facade direction for edge cells (cells missing a neighbour).
const facing = new Map();
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  let f = null;
  if (!has(x, z - 1)) f = "north";
  else if (!has(x, z + 1)) f = "south";
  else if (!has(x - 1, z)) f = "west";
  else if (!has(x + 1, z)) f = "east";
  if (f) facing.set(k, f);
}
const isEdge = (x, z) => facing.has(key(x, z));
const inward = { north: [0, 1], south: [0, -1], west: [1, 0], east: [-1, 0] };

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};
const PANE = { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" };
const DOOR = (facing, half) => ({ facing, half, hinge: "left", open: "false", powered: "false" });

// Plant-room screens on the roof (x ranges, z range).
const PLANT_X = [[14, 24], [40, 50], [66, 74]];
const PLANT_Z = [5, 11];

for (const [k, b] of ground) {
  const [x, z] = k.split(",").map(Number);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < b; y++) put(x, y, z, "stone_bricks");

  const f = facing.get(k);

  if (!f) {
    // Interior: floor slabs per storey, roof slab, air between.
    put(x, b, z, "smooth_stone");
    for (const r of [5, 10, 15, 20]) put(x, b + r, z, "light_gray_concrete");
    put(x, b + 25, z, "gray_concrete");
    const inPlant = PLANT_X.some(([a, c]) => x >= a && x <= c) &&
      z >= PLANT_Z[0] && z <= PLANT_Z[1];
    if (inPlant) for (let r = 26; r <= 28; r++) put(x, b + r, z, "gray_concrete");
    continue;
  }

  // Facade cell.
  const alongZ = f === "north" || f === "south";
  const pos = alongZ ? x : z;
  const maxPos = alongZ ? W - 1 : D - 1;
  const pier = pos === 0 || pos === maxPos || pos % 4 === 0;
  const door = pos % 20 === 10;
  const glowCol = pos % 8 === 5;
  const [dx, dz] = inward[f];
  const ix = x + dx, iz = z + dz;
  const canGlow = has(ix, iz) && !isEdge(ix, iz) && glowCol;
  const glowAt = (r) => { if (canGlow) put(ix, b + r, iz, "glowstone"); };

  // Interior floor slab under the facade cell.
  put(x, b, z, "polished_granite");
  for (const r of [5, 10, 15, 20]) {
    // handled in facade loop below
  }

  for (let rel = 0; rel <= 26; rel++) {
    const y = b + rel;
    if (rel === 0) {
      put(x, y, z, "polished_granite");                          // base course
    } else if (rel <= 3) {                                        // shopfront storey
      if (door) {
        if (rel === 1) put(x, y, z, "oak_door", DOOR(f, "lower"));
        else if (rel === 2) put(x, y, z, "oak_door", DOOR(f, "upper"));
        else put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
      } else if (pier) {
        put(x, y, z, "light_gray_concrete");
      } else {
        put(x, y, z, "light_blue_stained_glass_pane", PANE);
        if (rel === 2) glowAt(2);
      }
    } else if (rel === 4) {
      put(x, y, z, "red_terracotta");                             // ground fascia / signage band
    } else if (rel === 5 || rel === 10 || rel === 15 || rel === 20) {
      put(x, y, z, "light_gray_concrete");                        // floor slab line
    } else if (rel === 25) {
      put(x, y, z, "quartz_block");                               // cornice
    } else if (rel === 26) {
      put(x, y, z, "smooth_quartz");                              // parapet
    } else {
      const r = rel % 5;
      if (r === 4) {
        put(x, y, z, "white_concrete");                           // spandrel
      } else {                                                    // window rows 1..3
        if (pier) {
          put(x, y, z, "light_gray_concrete");
        } else {
          put(x, y, z, "light_blue_stained_glass_pane", PANE);
          if (r === 2) glowAt(rel);
        }
      }
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
