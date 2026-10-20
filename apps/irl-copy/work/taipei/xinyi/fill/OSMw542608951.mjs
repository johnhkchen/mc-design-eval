import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542608951";
const W = 23, H = 23, D = 15;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
let minG = Infinity;
for (const [x, z, gr] of cells) {
  const v = Math.round(gr);
  ground.set(key(x, z), v);
  if (v < minG) minG = v;
}
const has = (x, z) => ground.has(key(x, z));
const gOf = (x, z) => ground.get(key(x, z)) - minG;

// Bounds-checked setter; props optional.
const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Outward normals: [dx, dz, faceName]
const NORMALS = [[0, -1, "north"], [0, 1, "south"], [-1, 0, "west"], [1, 0, "east"]];

// Perimeter classification
const perim = new Set();
const missingOf = new Map();
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const miss = NORMALS.filter(([dx, dz]) => !has(x + dx, z + dz));
  missingOf.set(key(x, z), miss);
  if (miss.length > 0) perim.add(key(x, z));
}

// Entrance: middle of the north-facing wall (lowest z edge, the Xinyi street side)
const northIdx = [];
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const miss = missingOf.get(key(x, z));
  if (miss.length === 1 && miss[0][2] === "north") northIdx.push(x);
}
northIdx.sort((a, b) => a - b);
const eIdx = northIdx.length ? northIdx[Math.floor(northIdx.length / 2)] : -999;

// Centroid for central roof plant
let cx = 0, cz = 0;
for (const [x, z] of cells) { cx += x; cz += z; }
cx = Math.round(cx / cells.length);
cz = Math.round(cz / cells.length);

// "Deep" interior: has neighbours two cells out in all directions
const deep = (x, z) => has(x - 2, z) && has(x + 2, z) && has(x, z - 2) && has(x, z + 2);

for (const [x, z] of cells) {
  const gr = gOf(x, z);
  const k = key(x, z);
  const miss = missingOf.get(k);
  const isPerim = perim.has(k);

  // Foundation from y 0 up to the cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Floor slabs: ground floor, storey 2 floor, roof deck
  put(x, gr, z, "smooth_stone");
  put(x, gr + 5, z, "light_gray_concrete");
  put(x, gr + 10, z, "light_gray_concrete");

  if (!isPerim) {
    // Roof planters and AC units on the open roof, outside the plant room
    if (deep(x, z)) {
      const inPlant = Math.abs(x - cx) <= 3 && Math.abs(z - cz) <= 2;
      if (inPlant) {
        const ring = Math.abs(x - cx) === 3 || Math.abs(z - cz) === 2;
        put(x, gr + 11, z, "white_concrete");
        put(x, gr + 12, z, ring ? "light_blue_stained_glass" : "white_concrete");
        put(x, gr + 13, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
      } else if ((x + 2 * z) % 7 === 0) {
        put(x, gr + 11, z, "iron_block");
      } else if ((3 * x + z) % 11 === 0) {
        put(x, gr + 11, z, "moss_block");
      }
    }
    continue;
  }

  // Corner columns: quartz pillars, cap slab
  if (miss.length >= 2) {
    for (let h = 1; h <= 11; h++) put(x, gr + h, z, "quartz_pillar", { axis: "y" });
    put(x, gr + 12, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    continue;
  }

  // Single-facing wall cell
  const [dx, dz, face] = miss[0];
  const idx = dz !== 0 ? x : z;
  const alongX = dz !== 0; // wall runs east-west
  const pane = alongX
    ? { north: "false", south: "false", east: "true", west: "true" }
    : { north: "true", south: "true", east: "false", west: "false" };
  const pier = idx % 3 === 0;
  const isEntrance = face === "north" && idx === eIdx;
  const ix = x - dx, iz = z - dz; // inward cell
  const inwardOk = has(ix, iz) && !perim.has(key(ix, iz));
  const iy = gr;

  for (let h = 1; h <= 12; h++) {
    const y = gr + h;
    if (h <= 3) {
      if (pier) {
        put(x, y, z, "light_gray_concrete");
      } else if (isEntrance) {
        if (h === 1) put(x, y, z, "dark_oak_door", { facing: face, half: "lower", hinge: "left", open: "false", powered: "false" });
        else if (h === 2) put(x, y, z, "dark_oak_door", { facing: face, half: "upper", hinge: "left", open: "false", powered: "false" });
        else put(x, y, z, "lantern", { hanging: "true" });
      } else {
        put(x, y, z, "glass_pane", pane);
      }
      // Warm interior light behind some shopfront glass
      if (h === 1 && !pier && !isEntrance && idx % 6 === 4 && inwardOk) {
        put(ix, y, iz, "lantern", { hanging: "false" });
      }
    } else if (h === 4) {
      put(x, y, z, "white_concrete");
    } else if (h === 5) {
      put(x, y, z, "quartz_block");
    } else if (h === 6) {
      put(x, y, z, "white_concrete");
    } else if (h === 7 || h === 8) {
      if (pier) put(x, y, z, "white_concrete");
      else put(x, y, z, "light_blue_stained_glass_pane", pane);
      if (h === 7 && !pier && idx % 6 === 1 && inwardOk) {
        put(ix, y, iz, "glowstone");
      }
    } else if (h === 9) {
      put(x, y, z, "quartz_block");
    } else if (h === 10) {
      put(x, y, z, "white_concrete");
    } else if (h === 11) {
      put(x, y, z, "light_gray_concrete");
    } else if (h === 12) {
      put(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
