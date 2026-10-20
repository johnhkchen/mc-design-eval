import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no source. Decided: a 1980s two-storey commercial block in Xinyi,
// white tiled concrete with a red fascia sign band, a shopfront ground floor,
// blue-tinted windows on the upper floor, a parapet and a rooftop water tank.
// Roof surface at y = 11 above the lowest ground.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538617873";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 10, H = 23, D = 17;
const g = new Voxels([W, H, D]);

const FASCIA = 4;    // top of ground storey (red sign band)
const FLOOR2 = 5;    // floor slab between storeys
const SILL = 6;      // upper-storey sill
const HEAD = 9;      // upper-storey head
const ROOF = 10;     // top layer of roof slab and parapet (surface at y = 11)

const ground = new Map();
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, Math.max(0, Math.min(FASCIA - 1, gr)));
}
const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);
const isEdge = (x, z) =>
  !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const xs = cells.map((c) => c[0]);
const zs = cells.map((c) => c[1]);
const minX = Math.min(...xs), maxX = Math.max(...xs);
const minZ = Math.min(...zs);
const midX = (minX + maxX) / 2;

// Entrance: the edge cell on the min-z face nearest the middle of the width.
let entrance = null;
for (const [x, z] of cells) {
  if (z === minZ && isEdge(x, z)) {
    if (!entrance || Math.abs(x - midX) < Math.abs(entrance[0] - midX)) entrance = [x, z];
  }
}

// Window / pier pattern along facades: piers at every other cell and at corners.
const isWindow = (x, z) => {
  const cornerish = !has(x - 1, z) && !has(x, z - 1) || !has(x + 1, z) && !has(x, z + 1)
    || !has(x - 1, z) && !has(x, z + 1) || !has(x + 1, z) && !has(x, z - 1);
  return !cornerish && (x + z) % 2 === 0;
};

// Inward neighbour for placing light behind a facade window.
const inward = (x, z) => {
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = x + dx, nz = z + dz;
    if (has(nx, nz) && !isEdge(nx, nz)) return [nx, nz];
  }
  return null;
};

for (const [x, z, _] of cells) {
  const gr = gAt(x, z);
  const edge = isEdge(x, z);

  // 1. Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (edge) {
    // 2. Base course.
    put(x, gr, z, "stone_bricks");

    // 3. Ground storey: shopfront glass with white piers, or entrance door.
    const isEntrance = entrance && entrance[0] === x && entrance[1] === z;
    const pier = (x + z) % 3 === 0 || !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1) && false;
    for (let y = gr + 1; y < FASCIA; y++) {
      if (isEntrance && y <= gr + 2 && gr + 2 < FASCIA) {
        if (y === gr + 1) put(x, y, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
        else put(x, y, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
      } else if (pier && !isEntrance) {
        put(x, y, z, "white_concrete");
      } else {
        put(x, y, z, "glass");
      }
    }

    // 4. Fascia / red sign band at FASCIA.
    put(x, FASCIA, z, "red_concrete");

    // 5. Floor slab line between storeys.
    put(x, FLOOR2, z, "light_gray_concrete");

    // 6. Upper storey windows.
    const win = isWindow(x, z);
    put(x, SILL, z, win ? "light_gray_concrete" : "white_concrete");
    for (let y = SILL + 1; y < HEAD; y++) {
      if (win) put(x, y, z, "light_blue_stained_glass");
      else put(x, y, z, "white_concrete");
    }
    put(x, HEAD, z, win ? "light_gray_concrete" : "white_concrete");

    // Warm light behind some upper windows, inside the air gap.
    if (win && (x * 7 + z) % 5 === 0) {
      const inn = inward(x, z);
      if (inn) put(inn[0], SILL + 1, inn[1], "glowstone");
    }

    // 7. Parapet.
    put(x, ROOF, z, "light_gray_concrete");
  } else {
    // Interior: floor slab and roof slab only, air between.
    put(x, FLOOR2, z, "smooth_stone");
    put(x, ROOF, z, "smooth_stone");
  }
}

// 8. Rooftop water tank: 3x3 centred on the footprint, if it sits fully on interior roof.
const cx = Math.round(midX);
const cz = Math.round((Math.min(...zs) + Math.max(...zs)) / 2);
let tankOk = true;
for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
  if (!has(cx + dx, cz + dz) || isEdge(cx + dx, cz + dz)) tankOk = false;
}
if (tankOk) {
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const corner = Math.abs(dx) === 1 && Math.abs(dz) === 1;
    const x = cx + dx, z = cz + dz;
    if (!corner) {
      put(x, ROOF + 1, z, "white_concrete");
      put(x, ROOF + 2, z, "white_concrete");
      put(x, ROOF + 3, z, "iron_block");
    }
  }
  put(cx, ROOF + 1, cz, "stone_bricks");
}

g.save(`${DIR}/${ID}.nbt`);
