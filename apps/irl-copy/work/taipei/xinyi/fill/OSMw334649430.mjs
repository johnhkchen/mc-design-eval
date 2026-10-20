import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw334649430.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw334649430.nbt";

const W = 31, H = 38, D = 23;
const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

const inB = (x, y, z) => x >= 0 && x < W && y >= 0 && y < H && z >= 0 && z < D;
const put = (x, y, z, id, st) => { if (inB(x, y, z)) g.set(x, y, z, id, st); };

const FACES = [[0, -1, "north"], [0, 1, "south"], [-1, 0, "west"], [1, 0, "east"]];
const exposure = (x, z) => FACES.filter(([dx, dz]) => !has(x + dx, z + dz));

// Entrance: the north-facing edge cell nearest the centre line
let doorX = null, doorZ = null;
{
  let best = Infinity;
  for (const key of ground.keys()) {
    const [x, z] = key.split(",").map(Number);
    if (!has(x, z - 1)) {
      const d = Math.abs(x - 15);
      if (d < best) { best = d; doorX = x; doorZ = z; }
    }
  }
}

const GLASS_NS = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const GLASS_EW = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const exp = exposure(x, z);
  const edge = exp.length > 0;
  const corner = exp.length > 1;
  const face = edge ? exp[0][2] : null;
  const wallNS = face === "north" || face === "south";
  const alongFace = wallNS ? x : z;
  const isDoorZone = face === "north" && z === doorZ && Math.abs(x - doorX) <= 1;

  // Foundation up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");

  // Ground-level floor / base
  put(x, gr, z, edge ? "smooth_stone" : "light_gray_concrete");

  for (let k = 0; k < 5; k++) {
    const base = gr + 5 * k;

    // Interior floor slabs for upper storeys
    if (k >= 1 && !edge) put(x, base, z, "light_gray_concrete");
    if (k >= 1 && edge) put(x, base, z, "light_gray_concrete");

    if (!edge) continue;

    const pillar = corner || alongFace % 3 === 0 || isDoorZone;

    if (k === 0) {
      for (let r = 1; r <= 3; r++) {
        const y = base + r;
        if (pillar) put(x, y, z, "stone_bricks");
        else put(x, y, z, "glass_pane", wallNS ? GLASS_NS : GLASS_EW);
      }
      put(x, base + 4, z, "smooth_stone");
    } else {
      for (let r = 1; r <= 3; r++) {
        const y = base + r;
        if (pillar) put(x, y, z, "white_concrete");
        else put(x, y, z, "glass_pane", wallNS ? GLASS_NS : GLASS_EW);
      }
      put(x, base + 4, z, "light_gray_concrete");
    }

    // Warm glowstone just inside some windows
    if (!corner && !pillar && (alongFace + k) % 4 === 1) {
      const ix = x + (face === "east" ? -1 : face === "west" ? 1 : 0);
      const iz = z + (face === "south" ? -1 : face === "north" ? 1 : 0);
      if (has(ix, iz) && exposure(ix, iz).length === 0) put(ix, base + 2, iz, "glowstone");
    }
  }

  // Roof deck and cornice
  put(x, gr + 25, z, edge ? "smooth_stone" : "light_gray_concrete");

  // Parapet
  if (edge) {
    put(x, gr + 26, z, "white_concrete");
    put(x, gr + 27, z, "smooth_stone_slab", { type: "top", waterlogged: "false" });
  }
}

// Entrance door, flanked by stone piers, with a warm light inside
if (doorX !== null) {
  const gg = ground.get(`${doorX},${doorZ}`);
  put(doorX, gg + 1, doorZ, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(doorX, gg + 2, doorZ, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  // Lit glass transom above the door
  put(doorX, gg + 3, doorZ, "glass_pane", GLASS_NS);
  // Warm light just inside the entrance
  if (has(doorX, doorZ + 1)) put(doorX, gg + 2, doorZ + 1, "glowstone");
}

// Rooftop plant room near the centre
{
  const cx = Math.floor(W / 2), cz = Math.floor(D / 2);
  for (const [key, gr] of ground) {
    const [x, z] = key.split(",").map(Number);
    if (Math.abs(x - cx) > 6 || Math.abs(z - cz) > 4) continue;
    const perim = Math.abs(x - cx) === 6 || Math.abs(z - cz) === 4;
    put(x, gr + 26, z, "light_gray_concrete");
    put(x, gr + 27, z, "light_gray_concrete");
    put(x, gr + 28, z, perim ? "white_concrete" : "iron_bars");
  }
}

g.save(OUT);
