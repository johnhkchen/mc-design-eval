// Record: 33 x 9 footprint, roof about 11 blocks above lowest ground, so two storeys
// (about 5 blocks each) on a shophouse-style commercial base. Taipei mid-rise of the
// 1960s to 80s: an open arcade (five-foot way) on the street face, a shopfront behind it,
// white-tiled concrete upper storeys with ribbon windows and a parapet, and a flat roof
// with plant boxes. Front (street) is z=0; the back is z=8.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542521349";
const W = 33, H = 23, D = 9;
const TOP = 10;      // roof slab level
const PARAPET = 11;  // top of parapet, ~11 blocks above lowest ground

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) {
  if (x >= 0 && x < W && z >= 0 && z < D) ground.set(`${x},${z}`, Math.max(0, Math.round(gr)));
}
const has = (x, z) => ground.has(`${x},${z}`);
const edge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (y < 0 || y >= H || x < 0 || x >= W || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Pass 1: foundations, floor and roof slabs, shell and shopfront
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const e = edge(x, z);
  const coord = (z === 0 || z === D - 1) ? x : z;

  // foundation fill up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  if (gr > TOP) continue;

  // interior storey slab and roof slab (no interiors: air above)
  if (!e && gr <= 5) put(x, 5, z, "smooth_stone");
  if (!e) put(x, TOP, z, "smooth_stone");

  // shopfront line at z=1 behind the arcade
  if (z === 1 && gr <= 3) {
    put(x, gr, z, "polished_andesite");
    for (let y = gr + 1; y <= 3; y++) put(x, y, z, "glass_pane");
    put(x, 4, z, "smooth_stone"); // arcade lintel line over shopfront
  }

  if (!e) continue;

  // exterior shell, bottom to parapet
  for (let y = gr; y <= PARAPET; y++) {
    if (y <= 3) {
      if (z === 0) {
        if (x % 4 === 0) put(x, y, z, "stone_bricks"); // arcade columns
        continue;
      }
      if (z === 1) continue; // handled above
      // side and back ground floor
      if (y === gr) put(x, y, z, "polished_andesite");          // base course
      else if (z === D - 1) put(x, y, z, "white_concrete");     // back wall
      else put(x, y, z, "glass_pane");                          // side shop glazing
      continue;
    }
    if (y === 4 || y === 5) { put(x, y, z, "smooth_stone"); continue; } // lintel and storey line
    if (y >= 6 && y <= 8) {
      put(x, y, z, coord % 3 === 0 ? "white_concrete" : "glass_pane"); // ribbon windows with mullions
      continue;
    }
    if (y === 9) { put(x, y, z, "white_concrete"); continue; }        // cornice band
    if (y === 10) { put(x, y, z, "white_concrete"); continue; }       // parapet
    if (y === 11) { put(x, y, z, "smooth_stone"); continue; }         // parapet cap
  }
}

// Pass 2: entrance, arcade lanterns, warm lights behind glass, roof plant
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  if (gr > TOP) continue;

  // entrance door on the shopfront, opening onto the arcade
  if (x === 16 && z === 1 && gr <= 2) {
    put(x, gr, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 1, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  }

  // hanging lanterns under the arcade lintel
  if (z === 0 && gr <= 3 && x % 4 === 2) {
    put(x, 3, z, "lantern", { hanging: "true" });
  }

  // warm light in upper storey, placed behind a glass window on the front and back faces
  if (z === 0 && x % 3 !== 0 && x % 6 === 1 && has(x, 1) && !edge(x, 1) && ground.get(`${x},1`) <= 6) {
    put(x, 7, 1, "glowstone");
  }
  if (z === D - 1 && x % 3 !== 0 && x % 6 === 1 && has(x, D - 2) && !edge(x, D - 2) && ground.get(`${x},${D - 2}`) <= 6) {
    put(x, 7, D - 2, "glowstone");
  }

  // roof plant boxes on the interior roof
  if (!edge(x, z) && x % 8 === 4 && z === 4 && has(x + 1, z) && has(x, z + 1) && has(x + 1, z + 1)) {
    for (const [dx, dz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
      put(x + dx, 11, z + dz, "light_gray_concrete");
      put(x + dx, 12, z + dz, "iron_block");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
