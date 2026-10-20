import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw441377765";
const W = 109, H = 23, D = 42;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// ---- footprint and ground ------------------------------------------------
const key = (x, z) => `${x},${z}`;
const ground = new Map();
let maxG = 0;
for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  const gg = Math.max(0, Math.round(gr));
  ground.set(key(x, z), gg);
  if (gg > maxG) maxG = gg;
}

// Level roof: lidar says ~11 blocks above lowest ground; keep at least ~6 blocks of body
// on the uphill side so every cell carries two storeys plus a parapet.
const ROOF = Math.min(19, Math.max(11, maxG + 6));
for (const [k, v] of ground) ground.set(k, Math.min(v, ROOF - 6));

const inside = (x, z) => ground.has(key(x, z));
const perimeter = (x, z) => !inside(x - 1, z) || !inside(x + 1, z) || !inside(x, z - 1) || !inside(x, z + 1);

// Outward facade direction for perimeter cells
function outward(x, z) {
  if (!inside(x - 1, z)) return [-1, 0];
  if (!inside(x + 1, z)) return [1, 0];
  if (!inside(x, z - 1)) return [0, -1];
  return [0, 1];
}
const FACING = { "0,-1": "north", "0,1": "south", "1,0": "east", "-1,0": "west" };

// Main entrance: on the north (z-min) facade, nearest the middle of the frontage
let doorKey = null;
{
  let best = Infinity;
  for (const [k, g0] of ground) {
    const [x, z] = k.split(",").map(Number);
    if (!perimeter(x, z)) continue;
    const [ox, oz] = outward(x, z);
    if (ox !== 0 || oz !== -1) continue;
    const d = Math.abs(x - W / 2);
    if (d < best) { best = d; doorKey = k; }
  }
}

// ---- voxel helpers --------------------------------------------------------
const g = new Voxels([W, H, D]);
const inb = (x, y, z) => x >= 0 && x < W && y >= 0 && y < H && z >= 0 && z < D;
const put = (x, y, z, id, props) => {
  if (!inb(x, y, z)) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const SOLID_BASE = "stone_bricks";
const BASE_BAND = "polished_granite";
const FLOOR = "smooth_stone";
const PIER = "white_concrete";
const TRIM = "smooth_quartz";
const ROOFDECK = "light_gray_concrete";
const COLUMN = "white_concrete";

// ---- build ----------------------------------------------------------------
for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);
  const per = perimeter(x, z);
  const [ox, oz] = per ? outward(x, z) : [0, 0];
  const outX = ox !== 0;
  const bay = outX ? z : x;
  const pier = bay % 4 === 0;
  const isDoor = per && k === doorKey;

  // Foundation under ground
  for (let y = 0; y < gr; y++) put(x, y, z, SOLID_BASE);

  // Ground floor slab / base course
  put(x, gr, z, per ? BASE_BAND : FLOOR);

  // Body from first storey up to just under the roof deck
  for (let y = gr + 1; y <= ROOF - 1; y++) {
    const rel = y - gr;

    if (per) {
      if (rel <= 3) {
        if (isDoor && rel <= 2) {
          const half = rel === 1 ? "lower" : "upper";
          put(x, y, z, "dark_oak_door", {
            facing: FACING[`${ox},${oz}`],
            half, hinge: "left", open: "false", powered: "false",
          });
        } else if (pier) {
          put(x, y, z, PIER);
        } else {
          put(x, y, z, "glass");
        }
      } else if (rel === 4 || rel === 5 || rel === 9 || rel === 10) {
        put(x, y, z, TRIM);
      } else if (rel <= 8) {
        if (pier) {
          put(x, y, z, PIER);
        } else {
          const pane = outX
            ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
            : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
          put(x, y, z, "glass_pane", pane);
        }
      } else {
        put(x, y, z, pier ? PIER : "light_gray_concrete");
      }
    } else {
      // Interior: floor slabs per storey, structural columns on a grid, air elsewhere
      if (rel === 5 || rel === 10) put(x, y, z, FLOOR);
      if (x % 6 === 0 && z % 6 === 0) put(x, y, z, COLUMN);
    }
  }

  // Warm light behind selected upper windows (glowstone one bay inside)
  if (per && !isDoor) {
    const bayIdx = outX ? z : x;
    if (bayIdx % 8 === 2) {
      const ix = x - ox, iz = z - oz;
      const ik = key(ix, iz);
      if (ground.has(ik) && !perimeter(ix, iz) && ground.get(ik) === gr) {
        put(ix, gr + 7, iz, "glowstone");
      }
    }
  }

  // Roof deck
  put(x, ROOF, z, per ? TRIM : ROOFDECK);

  // Parapet and cap on the perimeter
  if (per) {
    put(x, ROOF + 1, z, PIER);
    put(x, ROOF + 2, z, "smooth_quartz_slab", { type: "top", waterlogged: "false" });
  }
}

// Rooftop plant room boxes on the interior deck
for (const [k] of ground) {
  const [x, z] = k.split(",").map(Number);
  if (perimeter(x, z)) continue;
  if (x % 24 >= 10 && x % 24 <= 13 && z >= 14 && z <= 26) {
    put(x, ROOF + 1, z, ROOFDECK);
    put(x, ROOF + 2, z, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);
