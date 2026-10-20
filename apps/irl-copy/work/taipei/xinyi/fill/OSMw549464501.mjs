import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise late-20th-century commercial block in Xinyi: two storeys, a stone
// plinth, white tiled concrete piers, blue-glass shopfront and office bands,
// a quartz storey line and cornice, and a flat roof with plant boxes.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw549464501";
const W = 20, H = 23, D = 18;

const ROOF = 11;     // roof deck datum (lidar: about 11 above lowest ground)
const FLOOR2 = 5;    // second-floor slab / storey line
const PIER = 3;      // pier spacing along facades

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gy] of cells) {
  ground.set(`${x},${z}`, Math.max(0, Math.min(H - 1, Math.round(gy))));
}
const has = (x, z) => ground.has(`${x},${z}`);
const groundAt = (x, z) => ground.get(`${x},${z}`);

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Exterior faces of a footprint cell (outward normals).
function outward(x, z) {
  const out = [];
  if (!has(x, z - 1)) out.push("north");
  if (!has(x, z + 1)) out.push("south");
  if (!has(x - 1, z)) out.push("west");
  if (!has(x + 1, z)) out.push("east");
  return out;
}
const DELTA = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const OPPOSITE = { north: "south", south: "north", west: "east", east: "west" };

// Pick the entrance: a non-corner street-facing cell near the median x of
// the south face (falls back to any single-face perimeter cell).
const perimeter = cells.map(([x, z]) => [x, z]).filter(([x, z]) => outward(x, z).length > 0);
let entrance = null;
{
  const south = perimeter.filter(([x, z]) => outward(x, z).length === 1 && outward(x, z)[0] === "south");
  const pool = south.length ? south : perimeter.filter(([x, z]) => outward(x, z).length === 1);
  if (pool.length) {
    const xs = pool.map(([x]) => x).sort((a, b) => a - b);
    const mid = xs[Math.floor(xs.length / 2)];
    entrance = pool.reduce((best, c) => (Math.abs(c[0] - mid) < Math.abs(best[0] - mid) ? c : best));
  }
}

// Pass 1: foundations, roof deck, storey slabs.
for (const [x, z] of [...ground.keys()].map((k) => k.split(",").map(Number))) {
  const G = groundAt(x, z);
  for (let y = 0; y < G; y++) put(x, y, z, "stone_bricks");
  put(x, G, z, "smooth_stone");
  if (FLOOR2 > G) put(x, FLOOR2, z, "smooth_quartz");   // interior floor slab
  if (ROOF > G) put(x, ROOF, z, "light_gray_concrete"); // roof deck
}

// Pass 2: facades on perimeter cells.
for (const [x, z] of perimeter) {
  const G = groundAt(x, z);
  const faces = outward(x, z);
  const isCorner = faces.length >= 2;
  const face = faces[0];
  const along = face === "north" || face === "south" ? x : z;
  const pier = along % PIER === 0;

  for (let y = G + 1; y <= ROOF - 1; y++) {
    if (isCorner) {
      put(x, y, z, "quartz_pillar", { axis: "y" });
      continue;
    }
    if (y === FLOOR2) { put(x, y, z, "smooth_quartz"); continue; }
    if (y === ROOF - 1) { put(x, y, z, "white_concrete"); continue; }
    if (y <= FLOOR2 - 1) {
      // ground storey: base course, shopfront glass, transom
      if (y === G + 1) put(x, y, z, "stone_bricks");
      else if (y === FLOOR2 - 1) put(x, y, z, "smooth_quartz");
      else put(x, y, z, pier ? "white_concrete" : "glass");
    } else {
      // upper storey: office ribbon windows between tiled piers
      if (pier) put(x, y, z, "white_concrete");
      else put(x, y, z, "light_blue_stained_glass");
    }
  }

  // Warm light behind selected upper windows (interior cell, not a wall).
  if (!isCorner && !pier) {
    const [dx, dz] = DELTA[OPPOSITE[face]];
    const ix = x + dx, iz = z + dz;
    if (has(ix, iz) && outward(ix, iz).length === 0 && (along + G) % 4 === 1) {
      put(ix, FLOOR2 + 2, iz, "glowstone");
    }
  }

  // Parapet and cornice cap.
  if (ROOF + 1 < H) put(x, ROOF + 1, z, "white_concrete");
  if (ROOF + 2 < H) put(x, ROOF + 2, z, "smooth_quartz_slab", { type: "bottom" });
}

// Pass 3: entrance door and projecting canopy band.
if (entrance) {
  const [ex, ez] = entrance;
  const G = groundAt(ex, ez);
  const face = outward(ex, ez)[0];
  const facing = face;
  const doorProps = (half) => ({ facing, half, hinge: "left", open: "false", powered: "false" });
  put(ex, G + 1, ez, "oak_door", doorProps("lower"));
  put(ex, G + 2, ez, "oak_door", doorProps("upper"));
  // Canopy: upside-down quartz stairs along the entrance bay at lintel height.
  const along = face === "north" || face === "south" ? [ex - 1, ex, ex + 1] : [ez - 1, ez, ez + 1];
  for (const a of along) {
    const cx = face === "north" || face === "south" ? a : ex;
    const cz = face === "north" || face === "south" ? ez : a;
    if (!has(cx, cz)) continue;
    const cg = groundAt(cx, cz);
    if (cg + 4 < FLOOR2) {
      put(cx, cg + 4, cz, "smooth_quartz_stairs", { facing, half: "top", shape: "straight", waterlogged: "false" });
    }
  }
}

// Pass 4: roof equipment on the flat roof, away from the parapet.
for (const [x, z] of [...ground.keys()].map((k) => k.split(",").map(Number))) {
  if (outward(x, z).length > 0) continue;
  const G = groundAt(x, z);
  if (ROOF <= G) continue;
  if (x % 6 === 3 && z % 6 === 3 && x > 1 && z > 1 && x < W - 2 && z < D - 2) {
    put(x, ROOF + 1, z, "gray_concrete");
    put(x, ROOF + 2, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
