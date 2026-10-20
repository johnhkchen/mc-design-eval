import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise two-storey commercial block, c.1970s-80s Taipei: white tiled walls,
// quartz piers and bands, tinted glazing, shopfront at street level, flat roof
// with a parapet and rooftop plant. Roof deck at y=10, parapet to y=12.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw520038113";
const W = 43, H = 23, D = 39;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const gy = (x, z) => ground.get(`${x},${z}`);

const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || y < 0 || x >= W || z >= D || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Outward faces: first missing neighbour in N, S, W, E order.
const FACES = [
  { name: "north", dx: 0, dz: -1, facing: "north" },
  { name: "south", dx: 0, dz: 1, facing: "south" },
  { name: "west", dx: -1, dz: 0, facing: "west" },
  { name: "east", dx: 1, dz: 0, facing: "east" },
];
const outwardOf = (x, z) => FACES.find((f) => !has(x + f.dx, z + f.dz));

// Edge cells with their outward face and position along that face.
const edges = [];
for (const [x, z, gr] of cells) {
  const f = outwardOf(x, z);
  if (!f) continue;
  const t = f.name === "north" || f.name === "south" ? x : z;
  edges.push({ x, z, gr, f, t });
}

// Entrance: middle of the north-facing frontage (fallback: any frontage).
let pool = edges.filter((e) => e.f.name === "north");
if (pool.length === 0) pool = edges;
pool.sort((a, b) => a.t - b.t);
const entrance = pool[Math.floor(pool.length / 2)];
const entranceKey = entrance ? `${entrance.x},${entrance.z}` : null;

// 1. Foundations, floor slabs, storey lines, roof deck, interior air gaps.
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  put(x, gr, z, "smooth_stone");                 // ground floor slab
  if (5 > gr) put(x, 5, z, "light_gray_concrete"); // storey floor slab
  if (10 > gr) put(x, 10, z, "light_gray_concrete"); // roof deck
}

// 2. Facades on the outer edge.
for (const e of edges) {
  const { x, z, gr, f, t } = e;
  const bayWindow = t % 4 === 1 || t % 4 === 2;

  // Ground floor shopfront: glazing between light-grey piers, quartz lintel.
  for (let y = gr + 1; y <= 3; y++) {
    if (bayWindow) put(x, y, z, "light_blue_stained_glass");
    else put(x, y, z, "light_gray_concrete");
  }
  if (4 > gr) put(x, 4, z, bayWindow ? "smooth_quartz" : "light_gray_concrete");

  // Storey line band between floors.
  if (5 > gr) put(x, 5, z, "smooth_quartz");

  // Upper storey: windows and white piers.
  for (let y = 6; y <= 9; y++) {
    if (y <= gr) continue;
    if (bayWindow) put(x, y, z, "light_blue_stained_glass");
    else put(x, y, z, "white_concrete");
  }

  // Cornice, parapet and cap.
  if (10 > gr) put(x, 10, z, "smooth_quartz");
  if (10 > gr) put(x, 11, z, "white_concrete");
  if (10 > gr) put(x, 12, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });

  // Warm light behind some upper windows (inside the air gap).
  if (t % 12 === 2 && 7 > gr) {
    const ix = x - f.dx, iz = z - f.dz;
    if (has(ix, iz) && !outwardOf(ix, iz)) put(ix, 7, iz, "glowstone");
  }
}

// 3. Entrance: door, flanking piers, black canopy over the bay.
if (entrance) {
  const { x, z, gr, f } = entrance;
  const doorBottom = gr + 1, doorTop = gr + 2;
  if (doorBottom <= 3) {
    const base = { facing: f.facing, hinge: "left", open: "false", powered: "false" };
    put(x, doorBottom, z, "dark_oak_door", { ...base, half: "lower" });
    put(x, doorTop, z, "dark_oak_door", { ...base, half: "upper" });
  }
  // Flanking piers on the frontage.
  const along = f.name === "north" || f.name === "south" ? [1, 0] : [0, 1];
  for (const s of [-1, 1]) {
    const ax = x + along[0] * s, az = z + along[1] * s;
    if (!has(ax, az)) continue;
    for (let y = gr + 1; y <= 3; y++) put(ax, y, az, "polished_granite");
  }
  // Canopy fascia across the entrance bay at lintel height.
  for (const s of [-1, 0, 1]) {
    const cx = x + along[0] * s, cz = z + along[1] * s;
    if (!has(cx, cz)) continue;
    put(cx, 4, cz, "black_concrete");
    put(cx, 5, cz, "black_concrete");
  }
}

// 4. Roof plant: a few units on the deck, away from the parapet.
for (const [x, z, gr] of cells) {
  if (outwardOf(x, z)) continue;
  if (10 <= gr) continue;
  if (x % 7 === 3 && z % 7 === 3) {
    put(x, 11, z, "light_gray_concrete");
    put(x, 12, z, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);
