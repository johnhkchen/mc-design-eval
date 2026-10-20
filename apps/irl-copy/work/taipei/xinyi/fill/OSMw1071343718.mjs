import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise Xinyi shophouse: two storeys of cream tiled concrete, white piers,
// shopfront glazing at street level, a pale cornice, and a flat rooftop with plant.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1071343718";
const W = 12, H = 23, D = 33;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const minG = Math.min(...cells.map((c) => c[2]));

// footprint: key "x,z" -> ground height relative to the lowest ground
const fp = new Map();
for (const [x, z, gr] of cells) {
  const g = gr - minG;
  fp.set(`${x},${z}`, Math.max(fp.get(`${x},${z}`) ?? 0, g));
}
let maxG = 0;
for (const g of fp.values()) maxG = Math.max(maxG, g);

// roof deck top: about 11 blocks above lowest ground, never below the highest ground + 2
const ROOF = Math.min(Math.max(11, maxG + 2), 21);

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const perSet = new Set();
for (const k of fp.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (DIRS.some(([dx, dz]) => !fp.has(`${x + dx},${z + dz}`))) perSet.add(k);
}
const isPer = (x, z) => perSet.has(`${x},${z}`);

const g3 = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g3.set(x, y, z, id, props);
  else g3.set(x, y, z, id);
};

// glass pane connections: only toward neighbouring facade cells that carry body at this height
const paneProps = (x, y, z) => {
  const conn = (dx, dz) => {
    const k = `${x + dx},${z + dz}`;
    if (!fp.has(k) || !perSet.has(k)) return false;
    const gn = fp.get(k);
    return gn <= y && y < ROOF;
  };
  return {
    north: String(conn(0, -1)),
    south: String(conn(0, 1)),
    west: String(conn(-1, 0)),
    east: String(conn(1, 0)),
    waterlogged: "false",
  };
};

// pass 1: foundations, walls, floors, roof deck
for (const [key, g] of fp) {
  const [x, z] = key.split(",").map(Number);

  // foundation fill from y 0 up to this cell's ground
  for (let y = 0; y < g; y++) put(x, y, z, "stone_bricks");

  const per = isPer(x, z);
  const bay = (x + z) % 3;

  for (let y = g; y < ROOF; y++) {
    const band = y % 5; // 0 floor line, 1-3 window band, 4 spandrel
    if (!per) {
      if (y === g || band === 0) {
        // interior floor slab (roof deck at the top)
        put(x, y, z, y === ROOF - 1 ? "gray_concrete" : "smooth_stone");
      }
      continue;
    }

    if (y === g) {
      put(x, y, z, "polished_andesite"); // base course
    } else if (band === 0) {
      put(x, y, z, "white_concrete"); // storey string course
    } else if (band >= 1 && band <= 3) {
      if (bay === 0) {
        put(x, y, z, "white_concrete"); // pier
      } else {
        const shop = y < 5;
        put(x, y, z, shop ? "cyan_stained_glass_pane" : "light_blue_stained_glass_pane", paneProps(x, y, z));
      }
    } else {
      put(x, y, z, "smooth_quartz"); // spandrel
    }
  }

  if (per) {
    // cornice / coping on the perimeter, one block above the roof deck
    put(x, ROOF, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

// pass 2: lit interiors behind some windows
for (const k of perSet) {
  const [x, z] = k.split(",").map(Number);
  const g = fp.get(k);
  for (let y = g; y < ROOF; y++) {
    const band = y % 5;
    if (band !== 2) continue;
    if ((x * 3 + z * 5 + y) % 4 !== 0) continue;
    for (const [dx, dz] of DIRS) {
      const nk = `${x + dx},${z + dz}`;
      if (fp.has(nk) && !perSet.has(nk) && fp.get(nk) <= y) {
        const [nx, nz] = nk.split(",").map(Number);
        put(nx, y, nz, "glowstone");
        break;
      }
    }
  }
}

// pass 3: entrance on the lowest-z street face, centred on that run
const minZ = Math.min(...[...perSet].map((k) => Number(k.split(",")[1])));
const row = [...perSet].map((k) => k.split(",").map(Number)).filter(([, z]) => z === minZ);
const meanX = row.reduce((s, [x]) => s + x, 0) / row.length;
row.sort((a, b) => Math.abs(a[0] - meanX) - Math.abs(b[0] - meanX));
if (row.length) {
  const [xd] = row[0];
  const gd = fp.get(`${xd},${minZ}`);
  const doorProps = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
  put(xd, gd + 1, minZ, "dark_oak_door", doorProps("lower"));
  put(xd, gd + 2, minZ, "dark_oak_door", doorProps("upper"));
}

// pass 4: corner lanterns on the cornice and rooftop plant
for (const k of perSet) {
  const [x, z] = k.split(",").map(Number);
  const cornerX = !fp.has(`${x - 1},${z}`) || !fp.has(`${x + 1},${z}`);
  const cornerZ = !fp.has(`${x},${z - 1}`) || !fp.has(`${x},${z + 1}`);
  if (cornerX && cornerZ && ROOF + 1 < H) {
    put(x, ROOF + 1, z, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// rooftop water tanks and an air-handling box, only on roof-deck footprint cells
const tank = (x0, z0) => {
  const cellsIn = [[x0, z0], [x0 + 1, z0], [x0, z0 + 1], [x0 + 1, z0 + 1]];
  if (!cellsIn.every(([x, z]) => fp.has(`${x},${z}`) && !perSet.has(`${x},${z}`))) return;
  for (const [x, z] of cellsIn) {
    put(x, ROOF, z, "iron_block");
    put(x, ROOF + 1, z, "iron_block");
  }
};
tank(3, 6);
tank(7, 24);

g3.save(`${DIR}/${ID}.nbt`);
