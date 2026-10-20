import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1334994032";
const W = 90, D = 22, H = 19;
const ROOF_ABOVE_LOW = 7; // lidar: roof ~7 blocks above lowest ground

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gy] of cells) ground.set(`${x},${z}`, gy);
const has = (x, z) => ground.has(`${x},${z}`);
const minG = Math.min(...cells.map((c) => c[2]));

const g = new Voxels([W, H, D]);
const set = (x, y, z, b, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

// outward directions: [name, dx, dz]
const DIRS = [["north", 0, -1], ["south", 0, 1], ["west", -1, 0], ["east", 1, 0]];
const outwardOf = (x, z) => DIRS.filter(([, dx, dz]) => !has(x + dx, z + dz));

// Main facade = side with most edge cells (for entrance)
const sideCount = { north: 0, south: 0, west: 0, east: 0 };
for (const [x, z] of ground.keys().map((k) => k.split(",").map(Number))) {
  for (const [n] of outwardOf(x, z)) sideCount[n]++;
}
const mainSide = Object.keys(sideCount).reduce((a, b) => (sideCount[a] >= sideCount[b] ? a : b));
const mainDir = DIRS.find(([n]) => n === mainSide);

// Median along-facade coordinate for entrance placement
const mainTs = [];
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  const outs = outwardOf(x, z);
  if (outs.some(([n]) => n === mainSide)) mainTs.push(mainDir[1] !== 0 ? x : z);
}
mainTs.sort((a, b) => a - b);
const doorT = mainTs.length ? mainTs[Math.floor(mainTs.length / 2)] : -1;

for (const [x, z, gy] of cells) {
  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < gy; y++) set(x, y, z, "stone_bricks");

  // Roof level: flat, ~7 blocks above lowest ground, never below the cell's own 7-block body
  const roofY = Math.max(minG + ROOF_ABOVE_LOW, gy + 7);
  const T = roofY - 1; // top layer (parapet / roof slab)

  const outs = outwardOf(x, z);

  if (outs.length === 0) {
    // Interior: floor slabs per storey and roof, air between (no interiors)
    set(x, gy, z, "light_gray_concrete");
    set(x, gy + 3, z, "light_gray_concrete");
    set(x, T, z, "light_gray_concrete");
    continue;
  }

  // Facade cell
  const [oName, odx, odz] = outs[0];
  const along = (odx !== 0) ? z : x; // coordinate running along the facade
  const isDoorCell = (oName === mainSide) && (along === doorT);

  for (let y = gy; y <= T; y++) {
    let block = "white_concrete";
    let props;

    if (y === gy) {
      block = "smooth_stone"; // base course
    } else if (y <= gy + 2) {
      // Shopfront ground floor
      if (y === gy + 1 || y === gy + 2) {
        if (isDoorCell) {
          block = "dark_oak_door";
          props = { facing: oName, half: y === gy + 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" };
        } else if (along % 4 === 0) {
          block = "dark_oak_log";
          props = { axis: "y" };
        } else {
          block = "glass";
        }
      }
    } else if (y === gy + 3) {
      block = "polished_andesite"; // storey line
    } else if (y === gy + 4) {
      block = "white_concrete"; // sill band
    } else if (y === T) {
      block = "smooth_stone_slab"; // cornice cap / parapet top
      props = { type: "bottom" };
    } else {
      // Upper storey windows: glass panes with white mullions
      if (along % 3 === 0) block = "white_concrete";
      else block = "glass_pane";
    }

    set(x, y, z, block, props);
  }

  // Warm lights behind some upper-floor windows
  if (!(isDoorCell) && along % 3 !== 0 && along % 9 === 4) {
    const ix = x - odx, iz = z - odz;
    if (has(ix, iz)) set(ix, gy + 5, iz, "glowstone");
  }
}

// Roof edge cells at top already handled; interior roof slab at T was set for interior only.
// Ensure the roof plane is continuous: fill T for every footprint cell not yet set.
for (const [x, z, gy] of cells) {
  const roofY = Math.max(minG + ROOF_ABOVE_LOW, gy + 7);
  const T = roofY - 1;
  if (outwardOf(x, z).length === 0) continue;
  // facade cells already carry their top course
  void T;
}

g.save(`${DIR}/${ID}.nbt`);
