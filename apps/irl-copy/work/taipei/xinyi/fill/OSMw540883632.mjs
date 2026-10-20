import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw540883632.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw540883632.nbt";

// Footprint 11 x 8. Roof about 11 blocks above the lowest ground.
// Era read: 1980s-90s low-rise commercial block, two storeys of ~5 blocks,
// white concrete facade, stone-brick plinth, tinted glass, parapet roof.
const DIMS = [11, 23, 8];
const [W, H, D] = DIMS;
const g = new Voxels(DIMS);

function put(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

const raw = JSON.parse(readFileSync(CELLS, "utf8"));
const gmap = new Map();
for (const [x, z, gr] of raw) {
  if (x < 0 || z < 0 || x >= W || z >= D) continue;
  gmap.set(`${x},${z}`, Math.round(gr));
}
const has = (x, z) => gmap.has(`${x},${z}`);
const groundAt = (x, z) => gmap.get(`${x},${z}`);

const g0 = Math.min(...gmap.values());
const ROOF = Math.min(g0 + 10, H - 2);

const DIRS = {
  N: { dx: 0, dz: -1, facing: "north" },
  S: { dx: 0, dz: 1, facing: "south" },
  W: { dx: -1, dz: 0, facing: "west" },
  E: { dx: 1, dz: 0, facing: "east" },
};

function exposedFaces(x, z) {
  return Object.keys(DIRS).filter((k) => !has(x + DIRS[k].dx, z + DIRS[k].dz));
}

// Main entrance: single-face cell on the south (or north) street face nearest the middle.
const cx = [...gmap.keys()].map((k) => +k.split(",")[0]);
const midX = (Math.min(...cx) + Math.max(...cx)) / 2;
let entrance = null;
{
  let best = Infinity;
  for (const [k] of gmap) {
    const [x, z] = k.split(",").map(Number);
    const f = exposedFaces(x, z);
    if (f.length !== 1) continue;
    if (f[0] !== "S" && f[0] !== "N") continue;
    const d = Math.abs(x - midX);
    if (d < best) { best = d; entrance = { x, z, f: f[0] }; }
  }
  if (!entrance) {
    for (const [k] of gmap) {
      const [x, z] = k.split(",").map(Number);
      const f = exposedFaces(x, z);
      if (f.length === 1) { entrance = { x, z, f: f[0] }; break; }
    }
  }
}

const glassProps = (f) =>
  f === "N" || f === "S"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

const GLASS_UPPER = "light_blue_stained_glass_pane";
const GLASS_SHOP = "gray_stained_glass_pane";

// Pass 1: foundations, walls, floor slabs, roof.
for (const [k, ground] of gmap) {
  const [x, z] = k.split(",").map(Number);

  for (let y = 0; y < ground; y++) put(x, y, z, "stone_bricks");

  const faces = exposedFaces(x, z);
  const isEdge = faces.length > 0;
  const isCorner = faces.length >= 2;

  for (let y = ground; y <= ROOF; y++) {
    const rel = y - g0;

    if (!isEdge) {
      if (y === ground || y === g0 + 5) put(x, y, z, "smooth_stone");
      else if (y === ROOF) put(x, y, z, "light_gray_concrete");
      continue;
    }

    if (isCorner) {
      if (rel === 0) put(x, y, z, "stone_bricks");
      else if (rel === 5) put(x, y, z, "smooth_stone");
      else if (rel === 10) put(x, y, z, "stone_brick_wall");
      else put(x, y, z, "white_concrete");
      continue;
    }

    const f = faces[0];
    const along = f === "N" || f === "S" ? x : z;
    const bay = along % 3 === 1;
    const isEnt = entrance && entrance.x === x && entrance.z === z;

    if (rel === 0) { put(x, y, z, "stone_bricks"); continue; }
    if (rel === 5) { put(x, y, z, "smooth_stone"); continue; }
    if (rel === 10) { put(x, y, z, "stone_brick_wall"); continue; }

    if (rel >= 1 && rel <= 4) {
      if (isEnt && rel === 1) {
        put(x, y, z, "oak_door", { facing: DIRS[f].facing, half: "lower", hinge: "left", open: "false", powered: "false" });
      } else if (isEnt && rel === 2) {
        put(x, y, z, "oak_door", { facing: DIRS[f].facing, half: "upper", hinge: "left", open: "false", powered: "false" });
      } else if (rel === 4) {
        put(x, y, z, "white_concrete");
      } else if (rel === 1 && !bay && !isEnt) {
        put(x, y, z, "polished_andesite");
      } else {
        put(x, y, z, GLASS_SHOP, glassProps(f));
      }
      continue;
    }

    if (rel >= 6 && rel <= 8) {
      if (bay) put(x, y, z, GLASS_UPPER, glassProps(f));
      else put(x, y, z, "white_concrete");
      continue;
    }

    // rel 9: spandrel / sill course
    put(x, y, z, "white_concrete");
  }
}

// Pass 2: warm light behind some upper-storey windows (interior air cell, glowstone).
for (const [k, ground] of gmap) {
  const [x, z] = k.split(",").map(Number);
  const faces = exposedFaces(x, z);
  if (faces.length !== 1) continue;
  const f = faces[0];
  const along = f === "N" || f === "S" ? x : z;
  if (along % 3 !== 1) continue;
  if (along % 2 !== 0) continue;
  const ix = x - DIRS[f].dx, iz = z - DIRS[f].dz;
  if (!has(ix, iz)) continue;
  if (exposedFaces(ix, iz).length > 0) continue;
  const iGround = groundAt(ix, iz);
  const y = g0 + 7;
  if (y <= iGround || y >= ROOF) continue;
  put(ix, y, iz, "glowstone");
}

// Pass 3: small rooftop water tank on the roof deck, near the centre.
{
  const xs = [...gmap.keys()].map((k) => +k.split(",")[0]);
  const zs = [...gmap.keys()].map((k) => +k.split(",")[1]);
  const mx = (Math.min(...xs) + Math.max(...xs)) / 2;
  const mz = (Math.min(...zs) + Math.max(...zs)) / 2;
  let best = null, bd = Infinity;
  for (const [k, gr] of gmap) {
    const [x, z] = k.split(",").map(Number);
    if (exposedFaces(x, z).length > 0) continue;
    if (gr >= ROOF) continue;
    const d = Math.hypot(x - mx, z - mz);
    if (d < bd) { bd = d; best = { x, z }; }
  }
  if (best && ROOF + 1 < H) put(best.x, ROOF + 1, best.z, "iron_block");
}

g.save(OUT);
