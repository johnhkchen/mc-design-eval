import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no name, no tags. Footprint 28 x 52, roof ~11 blocks above lowest ground.
// Reads as a two-storey concrete commercial block with a quartz-clad facade, a stone
// base, a shopfront on the street (low-z) side and a flat roof with a parapet and plant.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw455139051";
const W = 28, H = 23, D = 52;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const put = (x, y, z, block, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

// Footprint lookup
const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);
const has = (x, z) => G.has(`${x},${z}`);
const isPerimeter = (x, z) =>
  !has(x + 1, z) || !has(x - 1, z) || !has(x, z + 1) || !has(x, z - 1);

const minG = Math.min(...cells.map((c) => c[2]));
const xs = cells.map((c) => c[0]);
const zs = cells.map((c) => c[1]);
const minX = Math.min(...xs), maxX = Math.max(...xs);
const minZ = Math.min(...zs), maxZ = Math.max(...zs);
const doorX = Math.floor((minX + maxX) / 2);

// Storey plan relative to minG: base 0, storey line 5, parapet/roof top 10 (11 blocks tall)
const ROOF = 10;
const STOREY_LINE = 5;
const BAND_TOP = 9;

// 1. Foundation: fill solid from y 0 up to each cell's ground
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");
}

// 2. Body: walls, floors, roof for every footprint cell
for (const [x, z, gr] of cells) {
  const per = isPerimeter(x, z);
  const front = per && z === minZ;
  const doorCell = front && x === doorX;
  const winPattern = (x + z) % 4 === 1 || (x + z) % 4 === 2;

  for (let y = gr; y <= minG + ROOF; y++) {
    const rel = y - minG;

    if (rel === ROOF) {
      // roof deck inside, parapet rim outside
      put(x, y, z, per ? "smooth_quartz" : "gray_concrete");
      continue;
    }
    if (rel === 0) {
      put(x, y, z, "stone_bricks"); // base course / ground floor slab
      continue;
    }
    if (!per) {
      // interior: only a floor slab per storey, air elsewhere (no interiors)
      if (rel === STOREY_LINE) put(x, y, z, "smooth_quartz");
      continue;
    }

    // exterior shell
    if (rel === STOREY_LINE || rel === BAND_TOP) {
      put(x, y, z, "smooth_quartz");
      continue;
    }

    if (rel >= 1 && rel <= 4) {
      // ground storey: shopfront on the street side, piers between glazing
      if (doorCell) {
        if (rel === 1) put(x, y, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
        else if (rel === 2) put(x, y, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
        else if (rel === 3) put(x, y, z, "glass");
        else put(x, y, z, "smooth_quartz");
        continue;
      }
      if (rel === 4) {
        put(x, y, z, "smooth_quartz");
        continue;
      }
      if (winPattern && rel <= 3) {
        put(x, y, z, front ? "glass" : "glass_pane");
      } else {
        put(x, y, z, winPattern ? "quartz_block" : "white_concrete");
      }
      continue;
    }

    if (rel >= 6 && rel <= 8) {
      // upper storey: punched windows on a quartz grid
      if (winPattern) put(x, y, z, "glass_pane");
      else put(x, y, z, (x + z) % 4 === 0 || (x + z) % 4 === 3 ? "white_concrete" : "quartz_block");
      continue;
    }
  }
}

// 3. Warm light behind some windows (interior cell one step inside the glass)
const inward = (x, z) => {
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = x + dx, nz = z + dz;
    if (has(nx, nz) && !isPerimeter(nx, nz)) return [nx, nz];
  }
  return null;
};
for (const [x, z, gr] of cells) {
  if (!isPerimeter(x, z)) continue;
  if (!((x + z) % 4 === 1 || (x + z) % 4 === 2)) continue;
  const h = (x * 31 + z * 17) % 7;
  if (h !== 0 && h !== 3) continue;
  const n = inward(x, z);
  if (!n) continue;
  const [ix, iz] = n;
  if (z === minZ && h === 0) put(ix, minG + 2, iz, "glowstone"); // ground shopfront
  else if (h === 3) put(ix, minG + 7, iz, "glowstone");           // upper storey
}

// 4. Roof plant: two small mechanical plinths on the roof, sitting on the deck
const plant = [
  [minX + 4, minX + 9, minZ + 6, minZ + 11],
  [maxX - 9, maxX - 4, maxZ - 12, maxZ - 7],
];
for (const [x0, x1, z0, z1] of plant) {
  for (let x = x0; x <= x1; x++) {
    for (let z = z0; z <= z1; z++) {
      if (!has(x, z) || isPerimeter(x, z)) continue;
      put(x, minG + ROOF + 1, z, "light_gray_concrete");
      put(x, minG + ROOF + 2, z, "gray_concrete");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
