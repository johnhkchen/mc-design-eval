import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise 1980s Xinyi-style commercial block: two storeys of quartz-clad
// walls on a stone base, a ground-floor shopfront with a central entrance,
// bayed upper windows with lit rooms, a cornice and parapet, and a rooftop
// water tank. Each cell stands on its own ground (stone foundation below).

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540300027";
const W = 22, H = 23, D = 11;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => x + "," + z;
const G = new Map();
for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  G.set(key(x, z), Math.round(gr));
}
const has = (x, z) => G.has(key(x, z));
const groundOf = (x, z) => G.get(key(x, z));

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const door = (facing, half, hinge) => ({
  facing, half, hinge, open: "false", powered: "false", waterlogged: "false",
});

// Exposure: which sides of a cell face outside the footprint.
const exposure = (x, z) => ({
  zp: !has(x, z + 1), // south face
  zm: !has(x, z - 1), // north face
  xp: !has(x + 1, z), // east face
  xm: !has(x - 1, z), // west face
});
const isPerimeter = (x, z) => {
  const e = exposure(x, z);
  return e.zp || e.zm || e.xp || e.xm;
};

// Front = the exposed +z (south) side; entrance centred along it.
const frontXs = cells
  .filter(([x, z]) => has(x, z) && z === Math.max(...[...G.keys()].map(k => +k.split(",")[1])) && !has(x, z + 1))
  .map(([x]) => x);
const frontMin = Math.min(...frontXs), frontMax = Math.max(...frontXs);
const doorX = Math.floor((frontMin + frontMax) / 2);

// Pass 1: structure per cell (foundation, slabs, walls, storeys).
for (const k of G.keys()) {
  const [x, z] = k.split(",").map(Number);
  const b = groundOf(x, z);
  const e = exposure(x, z);
  const perim = isPerimeter(x, z);
  const exposedAlongZ = e.zp || e.zm;
  const i = exposedAlongZ ? x : z; // index along the exposed face
  const bay = i % 3 !== 0;         // mullions every third block

  // Foundation: stone from y 0 up to this cell's ground.
  for (let y = 0; y < b; y++) put(x, y, z, "stone_bricks");

  // Floor slabs at ground, storey 2 and roof (full footprint).
  put(x, b, z, "smooth_stone");
  put(x, b + 5, z, "smooth_stone");
  put(x, b + 10, z, "smooth_stone");

  if (!perim) {
    // Interior: air above the slabs; no walls.
    continue;
  }

  // Base course at ground level.
  put(x, b, z, "polished_andesite");

  // Storey 1 (ground floor): shopfront on the front, bayed glass elsewhere.
  for (let y = b + 1; y <= b + 4; y++) {
    if (e.zp) {
      const isPier = x === 0 || x === W - 1 || x === frontMin || x === frontMax;
      if (x === doorX || x === doorX - 1) {
        // Entrance: door lower half, transom glass above.
        if (y <= b + 2) {
          // placed below as door
          continue;
        }
        put(x, y, z, "glass_pane");
        continue;
      }
      if (isPier || (x - frontMin) % 6 === 0) put(x, y, z, "smooth_quartz");
      else if (y === b + 4) put(x, y, z, "smooth_quartz");
      else put(x, y, z, "glass_pane");
    } else {
      if (y === b + 1 || y === b + 4) put(x, y, z, "quartz_block");
      else put(x, y, z, bay ? "glass_pane" : "quartz_block");
    }
  }

  // Storey 2 walls with window bays.
  for (let y = b + 6; y <= b + 9; y++) {
    if (y === b + 6 || y === b + 9) put(x, y, z, "smooth_quartz");
    else put(x, y, z, bay ? "glass_pane" : "quartz_block");
  }

  // Belt course between storeys.
  put(x, b + 5, z, "smooth_quartz");

  // Cornice and parapet.
  put(x, b + 10, z, "smooth_quartz");
  put(x, b + 11, z, "quartz_block");
}

// Pass 2: entrance door on the front, lit rooms behind windows.
for (const k of G.keys()) {
  const [x, z] = k.split(",").map(Number);
  const b = groundOf(x, z);
  const e = exposure(x, z);

  if (e.zp && (x === doorX || x === doorX - 1)) {
    const hinge = x === doorX ? "left" : "right";
    if (x === doorX) {
      put(x, b + 1, z, "oak_door", door("south", "lower", hinge));
      put(x, b + 2, z, "oak_door", door("south", "upper", hinge));
    } else {
      put(x, b + 1, z, "glass_pane");
      put(x, b + 2, z, "glass_pane");
    }
  }

  // Warm light behind some shop windows (interior cell just inside the front).
  if (e.zp && (x - frontMin) % 5 === 2 && x !== doorX && x !== doorX - 1) {
    if (has(x, z - 1) && !isPerimeter(x, z - 1)) {
      put(x, b + 2, z - 1, "glowstone");
    }
  }

  // Warm light behind some upper windows.
  const inward = e.zp ? [0, -1] : e.zm ? [0, 1] : e.xp ? [-1, 0] : e.xm ? [1, 0] : null;
  const i = (e.zp || e.zm) ? x : z;
  if (inward && i % 6 === 1) {
    const ix = x + inward[0], iz = z + inward[1];
    if (has(ix, iz) && !isPerimeter(ix, iz)) {
      put(ix, groundOf(ix, iz) + 7, iz, "shroomlight");
    }
  }
}

// Pass 3: rooftop water tank on interior roof cells (2 x 2, two blocks tall).
const tankCells = [];
for (const k of G.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (!isPerimeter(x, z) && x >= 9 && x <= 12 && z >= 3 && z <= 6) tankCells.push([x, z]);
}
for (const [x, z] of tankCells) {
  const b = groundOf(x, z);
  put(x, b + 11, z, "iron_block");
  put(x, b + 12, z, "iron_block");
}

g.save(`${DIR}/${ID}.nbt`);
