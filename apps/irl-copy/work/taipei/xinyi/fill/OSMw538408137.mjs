import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw538408137.cells.json", "utf8"));

// Two-storey Xinyi-era commercial block: stone plinth, shopfront ground floor,
// white tiled/concrete upper storey with glass bands, cornice and parapet,
// flat roof with plant boxes. Roof lands about 11 blocks above lowest ground.
const W = 18, H = 23, D = 19;
const g = new Voxels([W, H, D]);

const key = (x, z) => x + "," + z;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const has = (x, z) => ground.has(key(x, z));
const G = (x, z) => ground.get(key(x, z));

const DIRS = [
  ["north", 0, -1],
  ["south", 0, 1],
  ["west", -1, 0],
  ["east", 1, 0],
];

// first missing neighbour = outward face for this cell (null if interior)
function outward(x, z) {
  for (const d of DIRS) if (!has(x + d[1], z + d[2])) return d;
  return null;
}

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const paneProps = (facing) =>
  facing === "north" || facing === "south"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// ---- 1. foundation, floor slabs, roof slab over whole footprint ----
for (const [x, z, gr] of cells) {
  for (let y = 0; y <= gr; y++) put(x, y, z, y === gr ? "smooth_stone" : "stone_bricks");
  put(x, gr + 5, z, "smooth_stone");   // storey-2 floor slab
  put(x, gr + 10, z, "smooth_stone");  // roof slab
}

// ---- 2. perimeter walls ----
// Pick the entrance: south-facing edge cell nearest the footprint's mean x.
let meanX = 0;
for (const [x] of cells) meanX += x;
meanX /= cells.length;
let entrance = null;
let best = Infinity;
for (const [x, z] of cells) {
  const o = outward(x, z);
  if (o && o[0] === "south" && Math.abs(x - meanX) < best) {
    best = Math.abs(x - meanX);
    entrance = key(x, z);
  }
}

const windowCells = []; // for lamp placement later

for (const [x, z, gr] of cells) {
  const o = outward(x, z);
  if (!o) continue;
  const [facing, dx, dz] = o;
  const u = dx !== 0 ? z : x; // coordinate running along the wall
  const isEntrance = facing === "south" && key(x, z) === entrance;

  for (let k = 1; k <= 11; k++) {
    const y = gr + k;
    let id = "white_concrete";
    let props;

    if (k === 1) {
      id = "polished_andesite"; // plinth
    } else if (k === 2 || k === 3) {
      // ground floor: shopfront glass with piers
      if (isEntrance) {
        if (k === 2) {
          id = "dark_oak_door";
          props = { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" };
        } else {
          id = "glass_pane"; props = paneProps(facing); // transom
        }
      } else if (u % 4 === 0) {
        id = "white_concrete";
      } else {
        id = "glass_pane"; props = paneProps(facing);
      }
    } else if (k === 4) {
      id = "light_gray_concrete"; // shopfront head
    } else if (k === 5) {
      id = "light_gray_concrete"; // storey line
    } else if (k >= 6 && k <= 8) {
      if (u % 3 === 0) {
        id = "white_concrete"; // upper piers
      } else {
        id = "glass_pane"; props = paneProps(facing);
        if (k === 6) windowCells.push([x, z, gr, facing, dx, dz, u]);
      }
    } else if (k === 9) {
      id = "light_gray_concrete"; // spandrel band
    } else if (k === 10) {
      id = "stone_bricks"; // cornice
    } else if (k === 11) {
      id = "white_concrete"; // parapet
    }

    if (isEntrance && k === 1) {
      id = "dark_oak_door";
      props = { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" };
    }
    put(x, y, z, id, props);
  }
}

// ---- 3. warm lights behind some upper windows (inner cell, on the slab) ----
for (const [x, z, gr, facing, dx, dz, u] of windowCells) {
  if (u % 6 !== 1) continue;
  const ix = x - dx, iz = z - dz;
  if (!has(ix, iz)) continue;
  if (outward(ix, iz)) continue; // don't replace another wall
  put(ix, gr + 6, iz, "glowstone");
}

// ---- 4. roof plant on the interior of the roof ----
for (const [x, z, gr] of cells) {
  if (outward(x, z)) continue;
  if (x % 5 === 2 && z % 5 === 2) {
    put(x, gr + 11, z, "light_gray_concrete");
    put(x, gr + 12, z, "smooth_stone");
  }
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw538408137.nbt");
