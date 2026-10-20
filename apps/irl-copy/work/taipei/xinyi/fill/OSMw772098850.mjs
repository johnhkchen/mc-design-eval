import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no name, 15 x 21 footprint, roof ~11 blocks above lowest ground.
// Reading: a two-storey (about 5 blocks per storey) early-2000s Taipei commercial
// block. Smooth white tile-look concrete piers, glass bands, a dark shopfront base,
// stone-faced foundation, a stone cornice and a parapet, with a rooftop mechanical
// penthouse. Downhill cells carry their foundation and extra storeys up to b+11.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw772098850";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 15, H = 23, D = 21;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, b] of cells) ground.set(`${x},${z}`, b);
const has = (x, z) => ground.has(`${x},${z}`);
const DIRS = {
  north: [0, -1],
  south: [0, 1],
  west: [-1, 0],
  east: [1, 0],
};
const exposed = (x, z) =>
  Object.keys(DIRS).filter((n) => {
    const [dx, dz] = DIRS[n];
    return !has(x + dx, z + dz);
  });
const isEdge = (x, z) => exposed(x, z).length > 0;

const put = (x, y, z, id, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// Find the entrance cell: north-exposed edge cell nearest the middle of the frontage.
let doorX = null;
let doorZ = null;
{
  let best = Infinity;
  for (const [x, z] of ground.keys().map((k) => k.split(",").map(Number))) {
    if (!isEdge(x, z) || !exposed(x, z).includes("north")) continue;
    const d = Math.abs(x - Math.floor(W / 2));
    if (d < best) {
      best = d;
      doorX = x;
      doorZ = z;
    }
  }
}

for (const [x, z, b] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < b; y++) put(x, y, z, "stone_bricks");

  const edge = isEdge(x, z);
  const sides = exposed(x, z);

  if (!edge) {
    // Interior: floor slabs per storey, air between (no interiors).
    put(x, b, z, "smooth_stone");
    put(x, b + 5, z, "smooth_stone");
    put(x, b + 10, z, "gray_concrete");
    continue;
  }

  // Facade: pick the wall orientation (north/south use x, east/west use z).
  const side = sides.includes("north") ? "north"
    : sides.includes("south") ? "south"
    : sides.includes("west") ? "west" : "east";
  const u = side === "north" || side === "south" ? x : z;

  for (let y = b; y <= b + 11; y++) {
    const dy = y - b;
    let id = null;
    let props = null;

    if (dy === 0) {
      id = "polished_andesite"; // base course
    } else if (dy >= 1 && dy <= 3) {
      // Ground-floor shopfront: glass with white piers.
      if (u % 3 === 0) id = "white_concrete";
      else id = "glass_pane";
    } else if (dy === 4) {
      id = "black_concrete"; // shopfront canopy band
    } else if (dy === 5) {
      id = "light_gray_concrete"; // storey line
    } else if (dy >= 6 && dy <= 9) {
      if (u % 3 === 0) id = "white_concrete";
      else if (dy === 6 || dy === 9) id = "white_concrete"; // spandrels
      else id = "glass_pane";
    } else if (dy === 10) {
      id = "smooth_stone"; // cornice
    } else if (dy === 11) {
      id = "light_gray_concrete"; // parapet
    }
    if (id) put(x, y, z, id, props);
  }

  // Warm lights: glowstone one step inside the glass, in interior cells only.
  for (const s of sides) {
    const [dx, dz] = DIRS[s];
    const ix = x - dx, iz = z - dz; // inward neighbour (opposite the exposed side)
    const sU = s === "north" || s === "south" ? x : z;
    if (!has(ix, iz) || isEdge(ix, iz)) continue;
    if (sU % 6 === 1) put(ix, b + 7, iz, "glowstone");
    if (sU % 6 === 4) put(ix, b + 2, iz, "glowstone");
  }
}

// Entrance on the north frontage: double-height door, glass above, canopy band above.
if (doorX !== null) {
  const b = ground.get(`${doorX},${doorZ}`);
  put(doorX, b + 1, doorZ, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(doorX, b + 2, doorZ, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  put(doorX, b + 3, doorZ, "glass_pane");
  put(doorX, b + 4, doorZ, "black_concrete");
}

// Rooftop mechanical penthouse on the interior core, solid (no hanging parts).
for (const [x, z, b] of cells) {
  if (isEdge(x, z)) continue;
  if (x < 4 || x > 10 || z < 6 || z > 14) continue;
  const ring = x === 4 || x === 10 || z === 6 || z === 14;
  put(x, b + 11, z, ring ? "light_gray_concrete" : "gray_concrete");
  put(x, b + 12, z, ring ? "light_gray_concrete" : "gray_concrete");
  put(x, b + 13, z, "gray_concrete"); // penthouse cap
}

// Lightning rod on the penthouse centre.
{
  const cb = ground.get(`${7},${10}`);
  if (cb !== undefined && !isEdge(7, 10)) put(7, cb + 14, 10, "lightning_rod");
}

g.save(`${DIR}/${ID}.nbt`);
