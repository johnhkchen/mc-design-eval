import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw591075541";
const W = 14, H = 16, D = 20;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Footprint: key "x,z" -> ground height (rounded)
const fp = new Map();
for (const [x, z, gr] of raw) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  fp.set(`${x},${z}`, Math.round(gr));
}
const has = (x, z) => fp.has(`${x},${z}`);
const gndAt = (x, z) => fp.get(`${x},${z}`);

let maxG = 0;
for (const v of fp.values()) maxG = Math.max(maxG, v);

// Roof about 4 blocks above lowest ground; never below 4 rows above the highest cell's floor
const ROOF = Math.max(4, maxG + 4);

const put = (x, y, z, id, p) => {
  if (y < 0 || y >= H || x < 0 || x >= W || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

const GLASS_EW = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const GLASS_NS = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Pass 1: foundation, floor slab, interior air, roof slab, plus the walls
for (const [key, gr] of fp) {
  const [x, z] = key.split(",").map(Number);

  // Foundation solid up to the floor slab (nothing floats on a slope)
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  // Floor slab for the single storey
  put(x, gr, z, "smooth_stone");
  // Roof slab over the whole footprint
  put(x, ROOF, z, "light_gray_concrete");

  const edgeN = !has(x, z - 1);
  const edgeS = !has(x, z + 1);
  const edgeW = !has(x - 1, z);
  const edgeE = !has(x + 1, z);
  if (!(edgeN || edgeS || edgeW || edgeE)) continue;

  // Face assignment: front = street side (low z), then back, then west, then east
  let face;
  if (edgeN) face = "front";
  else if (edgeS) face = "back";
  else if (edgeW) face = "west";
  else face = "east";

  const isFB = face === "front" || face === "back";
  const along = isFB ? x : z;
  const lastAlong = isFB ? W - 1 : D - 1;
  const pier = along === 0 || along === lastAlong || along % 3 === 0;
  const glassProps = isFB ? GLASS_EW : GLASS_NS;

  // Walls from just above the floor up to the cornice row
  for (let y = gr + 1; y <= ROOF - 1; y++) {
    if (y === ROOF - 1) {
      // Cornice band
      put(x, y, z, "smooth_stone");
      continue;
    }
    if (face === "front") {
      if (pier) put(x, y, z, "white_concrete");
      else put(x, y, z, "glass_pane", glassProps);
    } else {
      if (y === gr + 1) {
        // Base course on the non-street faces
        put(x, y, z, pier ? "white_concrete" : "stone_bricks");
      } else if (pier) {
        put(x, y, z, "white_concrete");
      } else {
        put(x, y, z, "glass_pane", glassProps);
      }
    }
  }

  // Parapet rim on the perimeter
  put(x, ROOF + 1, z, "white_concrete");
}

// Pass 2: entrance door on the street face, warm lights behind glass
for (const [key, gr] of fp) {
  const [x, z] = key.split(",").map(Number);
  if (has(x, z - 1)) continue; // street face only

  if (x === 6) {
    put(x, gr + 1, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 2, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  }

  // Glowstone lamps on the floor slab, just inside the glass bays
  if (x % 3 === 2 && has(x, z + 1) && has(x, z + 2) && gr + 1 < ROOF - 1) {
    put(x, gr + 1, z + 1, "glowstone");
  }
}

// Pass 3: roof equipment and a stair hut, all standing on the roof slab
const roofPlace = (x0, x1, z0, z1, y0, y1, id) => {
  for (let x = x0; x <= x1; x++)
    for (let z = z0; z <= z1; z++)
      if (has(x, z)) for (let y = y0; y <= y1; y++) put(x, y, z, id);
};

// Two AC units
roofPlace(3, 4, 13, 14, ROOF + 1, ROOF + 1, "iron_block");
roofPlace(10, 11, 4, 5, ROOF + 1, ROOF + 1, "iron_block");

// Stair hut with a flat cap
roofPlace(9, 10, 15, 16, ROOF + 1, ROOF + 2, "white_concrete");
roofPlace(9, 10, 15, 16, ROOF + 3, ROOF + 3, "smooth_stone");

g.save(`${DIR}/${ID}.nbt`);
