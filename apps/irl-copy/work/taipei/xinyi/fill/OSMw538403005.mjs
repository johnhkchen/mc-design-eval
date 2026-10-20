import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538403005";
const W = 23, H = 23, D = 19;

// ---- footprint and ground -------------------------------------------------
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
let L = Infinity;
let sx = 0, sz = 0;
for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  const gy = Math.round(gr);
  ground.set(`${x},${z}`, gy);
  L = Math.min(L, gy);
  sx += x; sz += z;
}
const N = ground.size;
const cx = sx / N, cz = sz / N;

const inF = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const OPP = { north: "south", south: "north", east: "west", west: "east" };
const outward = (x, z) =>
  Object.entries(DIRS)
    .filter(([, [dx, dz]]) => !inF(x + dx, z + dz))
    .map(([n]) => n);

// ---- voxel helpers --------------------------------------------------------
const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};
const slab = { type: "bottom", waterlogged: "false" };
const pane = (out) => {
  const ew = out.includes("north") || out.includes("south"); // wall runs east-west
  return {
    north: ew ? "false" : "true",
    south: ew ? "false" : "true",
    east: ew ? "true" : "false",
    west: ew ? "true" : "false",
    waterlogged: "false",
  };
};

// ---- entrance: exterior ground cell on the south face nearest the centre --
const exteriorCells = [...ground.keys()]
  .map((k) => k.split(",").map(Number))
  .filter(([x, z]) => outward(x, z).length > 0);
let entrance = null;
{
  const pool = exteriorCells.filter(([x, z]) => outward(x, z).includes("south"));
  const cands = pool.length ? pool : exteriorCells;
  cands.sort((a, b) => Math.abs(a[0] - cx) - Math.abs(b[0] - cx));
  if (cands.length) {
    const [x, z] = cands[0];
    const out = outward(x, z);
    entrance = { x, z, dir: out.includes("south") ? "south" : out[0] };
  }
}

// ---- rooftop tank site: 3x3 interior block on one level, near centroid ----
let tank = null;
{
  let best = Infinity;
  for (const k of ground.keys()) {
    const [x, z] = k.split(",").map(Number);
    let ok = true;
    const b = gAt(x, z);
    for (let dx = -2; dx <= 2 && ok; dx++)
      for (let dz = -2; dz <= 2 && ok; dz++) {
        if (!inF(x + dx, z + dz) || gAt(x + dx, z + dz) !== b) ok = false;
      }
    if (!ok) continue;
    const d = Math.hypot(x - cx, z - cz);
    if (d < best) { best = d; tank = { x, z, base: b }; }
  }
}

// ---- build every footprint cell -------------------------------------------
for (const [key, base] of ground) {
  const [x, z] = key.split(",").map(Number);
  const out = outward(x, z);
  const ext = out.length > 0;
  const T = Math.max(L + 11, base + 7); // roof deck level for this cell

  // foundation down to y 0
  for (let y = 0; y < base; y++) put(x, y, z, "stone_bricks");

  // floor slab at base (plinth on exterior)
  put(x, base, z, ext ? "polished_andesite" : "smooth_stone");

  if (ext) {
    // ground floor: shopfront glass with quartz piers
    for (let y = base + 1; y <= base + 3; y++) {
      if ((x + z) % 3 === 0) put(x, y, z, "quartz_pillar", { axis: "y" });
      else put(x, y, z, "glass_pane", pane(out));
    }
    // fascia and string course
    put(x, base + 4, z, "dark_oak_planks");
    put(x, base + 5, z, "smooth_stone");
    // sill row at base+6 (upper floor sill)
    put(x, base + 6, z, "smooth_quartz");
  } else {
    // interior: ground-floor air gap, floor slab at base+6
    put(x, base + 6, z, "smooth_stone");
  }

  // upper storey: window grid on the exterior
  if (ext) {
    for (let y = base + 7; y <= T - 2; y++) {
      if ((x + z) % 3 === 0) put(x, y, z, "quartz_pillar", { axis: "y" });
      else put(x, y, z, "glass_pane", pane(out));
    }
    // cornice course at top of walls
    if (T - 1 >= base + 6) put(x, T - 1, z, "smooth_stone");
  }

  // roof deck for every cell (floor of parapet and tank)
  put(x, T, z, "gray_concrete");

  // parapet and cap on exterior
  if (ext) {
    put(x, T + 1, z, "smooth_quartz");
    put(x, T + 2, z, "smooth_quartz");
    put(x, T + 3, z, "smooth_stone_slab", slab);
  }
}

// ---- warm light behind some windows (glowstone on the air-gap floor) -------
for (const [key, base] of ground) {
  const [x, z] = key.split(",").map(Number);
  const out = outward(x, z);
  if (!out.length) continue;
  const T = Math.max(L + 11, base + 7);
  const [dx, dz] = DIRS[out[0]];
  const ix = x - dx, iz = z - dz;
  if (!inF(ix, iz) || outward(ix, iz).length || gAt(ix, iz) !== base) continue;
  if ((x + z) % 3 === 1 && !((x + z) % 3 === 0)) {
    put(ix, base + 1, iz, "glowstone");
  }
  if ((x * 2 + z) % 6 === 1 && base + 7 <= T - 2) {
    put(ix, base + 7, iz, "glowstone");
  }
}

// ---- entrance: double-height door, hanging lantern above ------------------
if (entrance) {
  const { x, z, dir } = entrance;
  const base = gAt(x, z);
  const facing = OPP[dir];
  const dprops = (half) => ({ facing, half, hinge: "left", open: "false", powered: "false" });
  put(x, base + 1, z, "oak_door", dprops("lower"));
  put(x, base + 2, z, "oak_door", dprops("upper"));
  put(x, base + 3, z, "lantern", { hanging: "true", waterlogged: "false" });
  // a warm light just inside the lobby
  const [dx, dz] = DIRS[dir];
  if (inF(x - dx, z - dz) && gAt(x - dx, z - dz) === base) {
    put(x - dx, base + 1, z - dz, "glowstone");
  }
}

// ---- rooftop water tank -----------------------------------------------------
if (tank) {
  const { x, z, base } = tank;
  const T = Math.max(L + 11, base + 7);
  for (let dx = -1; dx <= 1; dx++)
    for (let dz = -1; dz <= 1; dz++) {
      put(x + dx, T + 1, z + dz, "iron_block");
      put(x + dx, T + 2, z + dz, "iron_block");
      put(x + dx, T + 3, z + dz, "smooth_stone_slab", slab);
    }
}

g.save(`${DIR}/${ID}.nbt`);
