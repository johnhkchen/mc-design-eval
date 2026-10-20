import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no record. Lidar roof ~11 blocks above lowest ground.
// Read as a two-storey, early-1980s low-rise commercial block: stone foundation,
// cream tiled walls, a glazed shopfront at street level, a storey band, a cornice
// and a stone parapet, with a flat roof carrying small plant units.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540901768";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 18, H = 23, D = 15;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));

const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);
const faces = (x, z) => ({
  n: !has(x, z - 1),
  s: !has(x, z + 1),
  w: !has(x - 1, z),
  e: !has(x + 1, z),
});
const isEdge = (x, z) => {
  const f = faces(x, z);
  return f.n || f.s || f.w || f.e;
};

// Bounds-checked setter so nothing lands outside the 18 x 23 x 15 volume.
const put = (x, y, z, id, p) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

const WALL = "smooth_quartz";
const PILLAR = "light_gray_concrete";
const GLASS = "glass";
const BAND = "smooth_stone";
const BASE = "stone_bricks";
const ROOF = "gray_concrete";

// Pass 1: foundation, floors, walls, and the window/pillar grid.
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const f = faces(x, z);

  // Foundation from y 0 up to the cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, BASE);

  if (!isEdge(x, z)) {
    // Interior: floor slabs only, air between them.
    put(x, gr, z, BAND);
    put(x, gr + 5, z, BAND);
    put(x, gr + 10, z, ROOF);
    continue;
  }

  const corner = (f.n || f.s) && (f.w || f.e);
  const along = (f.n || f.s) ? x : z;
  const pillar = corner || along % 3 === 0;

  // Solid exterior wall column from ground to the cornice line.
  for (let y = gr; y <= gr + 10; y++) put(x, y, z, pillar ? PILLAR : WALL);

  // Base course.
  put(x, gr, z, BASE);

  if (!pillar) {
    // Ground storey shopfront glazing, fascia band above.
    put(x, gr + 1, z, GLASS);
    put(x, gr + 2, z, GLASS);
    put(x, gr + 3, z, BAND);
    // Upper storey: storey band at gr+5, glazed panels at gr+7..gr+8.
    put(x, gr + 5, z, BAND);
    put(x, gr + 7, z, GLASS);
    put(x, gr + 8, z, GLASS);
  } else {
    put(x, gr + 3, z, BAND);
    put(x, gr + 5, z, BAND);
  }

  // Cornice and stone parapet.
  put(x, gr + 10, z, BAND);
  put(x, gr + 11, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// Pass 2: roof plant on interior roof cells.
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  if (isEdge(x, z)) continue;
  if (x % 5 === 2 && z % 5 === 2) {
    put(x, gr + 11, z, PILLAR);
  }
}

// Pass 3: entrance on the north-facing street edge nearest the middle of the footprint.
const keys = [...ground.keys()].map((k) => k.split(",").map(Number));
const minX = Math.min(...keys.map((k) => k[0]));
const maxX = Math.max(...keys.map((k) => k[0]));
const midX = (minX + maxX) / 2;

let doorCands = keys.filter(([x, z]) => faces(x, z).n);
if (doorCands.length === 0) doorCands = keys.filter(([x, z]) => isEdge(x, z));
doorCands.sort((a, b) => Math.abs(a[0] - midX) - Math.abs(b[0] - midX));
const [dx, dz] = doorCands[0];
const dgr = gAt(dx, dz);
const df = faces(dx, dz);
const doorFacing = df.n ? "north" : df.s ? "south" : df.w ? "west" : "east";
put(dx, dgr + 1, dz, "dark_oak_door", {
  facing: doorFacing, half: "lower", hinge: "left", open: "false", powered: "false",
});
put(dx, dgr + 2, dz, "dark_oak_door", {
  facing: doorFacing, half: "upper", hinge: "left", open: "false", powered: "false",
});

// Pass 4: warm light behind some glazing, inside the building.
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  if (!isEdge(x, z)) continue;
  const f = faces(x, z);
  const corner = (f.n || f.s) && (f.w || f.e);
  const along = (f.n || f.s) ? x : z;
  const pillar = corner || along % 3 === 0;
  if (pillar) continue;

  let ix = x, iz = z;
  if (f.n) iz = z + 1;
  else if (f.s) iz = z - 1;
  else if (f.w) ix = x + 1;
  else if (f.e) ix = x - 1;

  if (!has(ix, iz) || isEdge(ix, iz)) continue;
  const igr = gAt(ix, iz);

  // Lanterns in the shopfront, glowstone in some upper-storey windows.
  if (along % 6 === 4) {
    put(ix, igr + 1, iz, "lantern", { hanging: "false", waterlogged: "false" });
  }
  if (along % 6 === 1) {
    put(ix, igr + 7, iz, "glowstone");
  }
}

g.save(`${DIR}/${ID}.nbt`);
