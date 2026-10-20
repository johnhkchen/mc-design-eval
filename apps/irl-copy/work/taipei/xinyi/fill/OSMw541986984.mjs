import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise Xinyi-district commercial block, c.1980s: two storeys, white-tiled
// concrete frame, glazed bays, a shopfront with entrance on the north (z-min) edge,
// light storey strings, a smooth-quartz cornice and a red-tile parapet.
const BASE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw541986984";
const cells = JSON.parse(readFileSync(`${BASE}.cells.json`, "utf8"));

const W = 11, H = 23, D = 22;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));
const key = (x, z) => `${x},${z}`;
const has = (x, z) => ground.has(key(x, z));

// Bounds-checked setter; props optional.
const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const OPP = { north: "south", south: "north", west: "east", east: "west" };
const ORDER = ["north", "south", "west", "east"];

const exposedFaces = (x, z) =>
  ORDER.filter((f) => !has(x + DIRS[f][0], z + DIRS[f][1]));

// Entrance: the north-edge cell closest to the middle of that edge.
const northCells = cells.filter(([x, z]) => !has(x, z - 1));
let entranceKey = null;
if (northCells.length) {
  const meanX = northCells.reduce((s, [x]) => s + x, 0) / northCells.length;
  const best = [...northCells].sort(
    (a, b) => Math.abs(a[0] - meanX) - Math.abs(b[0] - meanX) || a[0] - b[0]
  )[0];
  entranceKey = key(best[0], best[1]);
}

const PANE_NS = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const PANE_EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

for (const [x, z, gr] of cells.map(([a, b, c]) => [a, b, Math.round(c)])) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const ex = exposedFaces(x, z);

  if (ex.length === 0) {
    // Interior: floor slabs per storey and a flat roof slab; air elsewhere.
    put(x, gr, z, "smooth_stone");
    put(x, gr + 5, z, "smooth_stone");
    put(x, gr + 10, z, "smooth_stone");
    // Sparse roof plant (AC units) standing on the roof slab.
    if ((x * 7 + z * 3) % 17 === 0) put(x, gr + 11, z, "iron_block");
    continue;
  }

  const face = ex[0];
  const along = face === "north" || face === "south" ? x : z;
  const [ix, iz] = DIRS[OPP[face]]; // inward offset
  const inwardX = x + ix, inwardZ = z + iz;
  const inwardInterior = has(inwardX, inwardZ) && exposedFaces(inwardX, inwardZ).length === 0;
  const isEntrance = key(x, z) === entranceKey;
  const pane = face === "north" || face === "south" ? PANE_NS : PANE_EW;

  // Structural bands: base, storey string, cornice, parapet.
  put(x, gr, z, "polished_andesite");
  put(x, gr + 5, z, "smooth_quartz");
  put(x, gr + 10, z, "smooth_quartz");
  put(x, gr + 11, z, "red_terracotta");

  for (const b of [0, 5]) {
    const isGround = b === 0;
    const shopfront = isGround && face === "north";
    const bay = along % 3 === 1;

    for (let k = 1; k <= 4; k++) {
      const y = gr + b + k;

      if (shopfront) {
        if (isEntrance) {
          if (k === 1 || k === 2) {
            const half = k === 1 ? "lower" : "upper";
            put(x, y, z, "oak_door", {
              facing: "north",
              half,
              hinge: "left",
              open: "false",
              powered: "false",
            });
          } else if (k === 3) {
            put(x, y, z, "glass");
          } else {
            put(x, y, z, "light_gray_concrete");
          }
        } else if (k === 4) {
          put(x, y, z, "light_gray_concrete");
        } else if (along % 4 === 0) {
          put(x, y, z, "white_concrete");
        } else {
          put(x, y, z, "glass");
        }
        continue;
      }

      if (k === 4) {
        // Lintel band over every bay and pier.
        put(x, y, z, "white_concrete");
      } else if (!bay) {
        put(x, y, z, "white_concrete");
      } else if (k === 1) {
        put(x, y, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
      } else {
        put(x, y, z, "glass_pane", pane);
      }
    }

    // Warm light on the floor just inside the glass, in some bays.
    if (!isEntrance && inwardInterior) {
      const lit = shopfront
        ? along % 4 === 2
        : bay && (Math.floor(along / 3) + (isGround ? 0 : 1)) % 2 === 0;
      if (lit) put(inwardX, gr + b + 1, inwardZ, "glowstone");
    }
  }
}

g.save(`${BASE}.nbt`);
