import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw588112850";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Record: 5 x 10 footprint, roof ~24 blocks above lowest ground.
// Reading: a 1990s Xinyi mid-rise office/retail block, five storeys of
// 5 blocks each, white tiled concrete piers, light-grey spandrel belts,
// glass-pane windows in aluminium-coloured frames, shopfront on the ground
// floor, a parapet and a small rooftop plant pair.
const W = 5, H = 36, D = 10;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const map = new Map();
for (const [x, z, gr] of cells) map.set(key(x, z), gr);

const minG = Math.min(...cells.map(c => c[2]));
const T = minG + 24; // roof deck level (top of the 5th storey cap)

const xs = cells.map(c => c[0]), zs = cells.map(c => c[1]);
const xmin = Math.min(...xs), xmax = Math.max(...xs);
const zmin = Math.min(...zs), zmax = Math.max(...zs);
const xmid = Math.floor((xmin + xmax) / 2);

const isIn = (x, z) => map.has(key(x, z));
const perim = (x, z) => !isIn(x - 1, z) || !isIn(x + 1, z) || !isIn(x, z - 1) || !isIn(x, z + 1);

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const glassProps = (longFace) => longFace
  ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
  : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

const litInterior = new Set();

// Pass 1: foundation, shell, floors, facades, roof
for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y <= gr; y++) {
    put(x, y, z, y === gr ? "smooth_stone" : "stone_bricks");
  }

  const perimeter = perim(x, z);
  const isCorner = (x === xmin || x === xmax) && (z === zmin || z === zmax);
  const onLong = (x === xmin || x === xmax) && !isCorner;
  const onShort = (z === zmin || z === zmax) && !isCorner;
  const xi = x - xmin, zi = z - zmin;

  // Window cell test for the facade faces
  const isWindowCell = (() => {
    if (!perimeter || isCorner) return false;
    if (onLong) return zi % 2 === 1;
    if (onShort) return xi === 1 || xi === 3;
    return false;
  })();

  for (let y = gr + 1; y <= T + 1; y++) {
    const rel = y - minG;
    const j = ((rel % 5) + 5) % 5; // 0 = floor line, 1..4 = storey body
    const k = Math.floor(rel / 5);  // storey index (0 = ground)

    // Roof surface and parapet
    if (y === T + 1) {
      if (perimeter) put(x, y, z, "white_concrete");
      continue;
    }
    if (y === T) {
      put(x, y, z, perimeter ? "light_gray_concrete" : "smooth_stone");
      continue;
    }

    // Floor slabs / storey lines
    if (j === 0 && rel > 0) {
      put(x, y, z, perimeter ? "light_gray_concrete" : "white_concrete");
      continue;
    }

    if (!perimeter) continue; // interior air behind glass

    // Corner piers, full height
    if (isCorner) {
      put(x, y, z, "white_concrete");
      continue;
    }

    // Spandrel belt
    if (j === 4) {
      put(x, y, z, "light_gray_concrete");
      continue;
    }

    const ground = k === 0;
    if (ground) {
      // Shopfront glass across the ground storey, excluding piers on short face
      if (onShort && xi === 2) put(x, y, z, "white_concrete");
      else if (onLong || onShort) put(x, y, z, "glass_pane", glassProps(onLong));
      continue;
    }

    if (isWindowCell) {
      put(x, y, z, "glass_pane", glassProps(onLong));
      if (j === 2 && (zi === 3 || zi === 7) && onLong) {
        const ix = x === xmin ? xmin + 1 : xmax - 1;
        litInterior.add(`${ix},${y},${z}`);
      }
    } else {
      put(x, y, z, "white_concrete");
    }
  }
}

// Pass 2: entrance on the south (zmax) face, canopy above
const doorCell = isIn(xmid, zmax);
if (doorCell) {
  const gr = map.get(key(xmid, zmax));
  put(xmid, gr + 1, zmax, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(xmid, gr + 2, zmax, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  for (let x = xmid - 1; x <= xmid + 1; x++) {
    if (isIn(x, zmax) && x !== xmid) {
      put(x, gr + 3, zmax, "stone_brick_slab", { type: "top", waterlogged: "false" });
    }
  }
  put(xmid, gr + 3, zmax, "stone_brick_slab", { type: "top", waterlogged: "false" });
}

// Pass 3: warm light just inside lit windows
for (const k of litInterior) {
  const [x, y, z] = k.split(",").map(Number);
  if (isIn(x, z) && !perim(x, z)) put(x, y, z, "glowstone");
}

// Pass 4: rooftop plant (two small AC/plant units), sitting on the roof deck
for (const [x, z] of [[xmin + 1, zmin + 3], [xmax - 1, zmin + 6]]) {
  if (isIn(x, z) && !perim(x, z)) put(x, T + 1, z, "iron_block");
}

g.save(`${DIR}/${ID}.nbt`);
