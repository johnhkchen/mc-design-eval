import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542610608";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Footprint 38 x 10. Read as a two-storey mid-rise commercial block (1970s-80s Xinyi):
// stone-brick plinth, cream terracotta facade, shopfront ground floor, upper-floor
// glazing with piers, a cornice and parapet, and a flat roof with plant boxes.
const W = 38, D = 10, H = 23, ROOF = 10;

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));
const has = (x, z) => ground.has(`${x},${z}`);
const isPerim = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, p) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

const PANE_ALONG_X = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const PANE_ALONG_Z = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

for (const [x, z] of cells.map(([a, b]) => [a, b])) {
  const gr = ground.get(`${x},${z}`);

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (!isPerim(x, z)) {
    // Interior: floor slabs only, air between, roof slab on top.
    put(x, gr, z, "smooth_stone");
    if (5 >= gr) put(x, 5, z, "smooth_stone");
    put(x, ROOF, z, "light_gray_concrete");
    continue;
  }

  // Which way this perimeter cell faces (outward normal).
  let face;
  if (!has(x, z - 1)) face = "north";
  else if (!has(x, z + 1)) face = "south";
  else if (!has(x - 1, z)) face = "west";
  else face = "east";

  const alongX = face === "north" || face === "south";
  const b = alongX ? x : z;           // bay index along the face
  const along = alongX ? PANE_ALONG_X : PANE_ALONG_Z;
  const isPier = b % 4 === 0;
  const [inDx, inDz] = {
    north: [0, 1], south: [0, -1], west: [1, 0], east: [-1, 0],
  }[face];

  // Facade, bottom to top.
  for (let y = gr; y < ROOF; y++) {
    if (y === gr) {
      put(x, y, z, "stone_bricks");                        // base course
    } else if (y <= 4) {
      const shopTop = Math.min(gr + 3, 4);
      if (y >= gr + 1 && y <= shopTop) {
        if (isPier) {
          put(x, y, z, "white_terracotta");
        } else if (face === "north" && b === 5 && gr + 2 <= 4) {
          // Entrance door, two blocks tall, on the north (street) face.
          if (y === gr + 1) {
            put(x, y, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
          } else if (y === gr + 2) {
            put(x, y, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
          } else {
            put(x, y, z, "glass_pane", along);
          }
        } else {
          put(x, y, z, "glass_pane", along);                // shopfront glazing
        }
      } else {
        put(x, y, z, "white_terracotta");                   // solid wall / lintel
      }
    } else if (y === 5) {
      put(x, y, z, "smooth_stone");                         // floor line band
    } else if (y <= 8) {
      if (isPier) put(x, y, z, "white_terracotta");
      else put(x, y, z, "light_blue_stained_glass_pane", along);
    } else if (y === 9) {
      put(x, y, z, "stone_brick_slab", { type: "top", waterlogged: "false" }); // cornice
    }
  }

  // Parapet coping at the roof line.
  put(x, ROOF, z, "stone_bricks");

  // Warm light behind glass, in the air gap inside the shell.
  const ix = x + inDx, iz = z + inDz;
  if (has(ix, iz) && !isPier) {
    if (b % 8 === 2) put(ix, 7, iz, "glowstone");           // upper floor
    if (b % 8 === 1 && gr + 2 <= 4 && gr + 1 <= 4) put(ix, gr + 2, iz, "glowstone"); // shop
  }
}

// Roof plant: a mechanical box and a stair/lift core, both on interior roof cells.
for (let x = 6; x <= 11; x++) {
  for (let z = 3; z <= 6; z++) {
    if (has(x, z) && !isPerim(x, z)) put(x, 11, z, "gray_concrete");
  }
}
for (let x = 7; x <= 9; x++) {
  for (let z = 4; z <= 5; z++) {
    if (has(x, z) && !isPerim(x, z)) put(x, 12, z, "stone_bricks");
  }
}
for (let x = 26; x <= 29; x++) {
  for (let z = 3; z <= 6; z++) {
    if (has(x, z) && !isPerim(x, z)) {
      put(x, 11, z, "smooth_stone");
      if (x >= 27 && x <= 28 && z >= 4 && z <= 5) put(x, 12, z, "smooth_stone");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
