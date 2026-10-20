import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no name. 20 x 24 footprint, roof ~25 blocks above lowest ground.
// Read as a 1990s Taipei mid-rise office block: five storeys of 5 blocks,
// white-painted concrete frame, grey spandrel bands, aluminium-framed glazing,
// stone-clad base course, shopfront ground floor, flat roof with parapet,
// rooftop plant and a central penthouse core.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw591075533";
const W = 20, H = 37, D = 24;
const STOREYS = 5;
const STOREY_H = 5;
const ROOF_OFF = STOREYS * STOREY_H; // 25

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) {
  if (x >= 0 && x < W && z >= 0 && z < D) ground.set(`${x},${z}`, gr);
}
const has = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => ground.get(`${x},${z}`);
const keys = [...ground.keys()].map((k) => k.split(",").map(Number));

const dirs = [
  { n: "north", dx: 0, dz: -1 },
  { n: "south", dx: 0, dz: 1 },
  { n: "west", dx: -1, dz: 0 },
  { n: "east", dx: 1, dz: 0 },
];
const exposed = (x, z) => dirs.filter((d) => !has(x + d.dx, z + d.dz));

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Distance from the outer wall, for placing the penthouse core and plant.
const dist = new Map();
const queue = [];
for (const [x, z] of keys) {
  if (exposed(x, z).length) {
    dist.set(`${x},${z}`, 0);
    queue.push([x, z]);
  }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  const d = dist.get(`${x},${z}`);
  for (const e of dirs) {
    const nx = x + e.dx, nz = z + e.dz, k = `${nx},${nz}`;
    if (has(nx, nz) && !dist.has(k)) {
      dist.set(k, d + 1);
      queue.push([nx, nz]);
    }
  }
}
const distOf = (x, z) => dist.get(`${x},${z}`) ?? 99;

const paneProps = (f) => {
  const ns = f.dz !== 0; // face runs east-west, so panes join east/west
  return {
    north: ns ? "false" : "true",
    south: ns ? "false" : "true",
    east: ns ? "true" : "false",
    west: ns ? "true" : "false",
    waterlogged: "false",
  };
};

// Main pass: foundation, floor slabs, walls, windows, lights.
for (const [x, z] of keys) {
  const gr = gnd(x, z);
  const ex = exposed(x, z);
  const boundary = ex.length > 0;

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Floor slab at the base of every storey and the roof slab (all cells).
  for (let L = 0; L <= STOREYS; L++) put(x, gr + STOREY_H * L, z, "light_gray_concrete");

  if (!boundary) continue;

  // Wall body between slabs.
  for (let off = 1; off < ROOF_OFF; off++) {
    if (off % STOREY_H !== 0) put(x, gr + off, z, "white_concrete");
  }

  const f = ex[0];
  const win = (x + z) % 2 === 0; // alternating bays, white mullions between
  const inx = x - f.dx, inz = z - f.dz;
  const inward = has(inx, inz);

  for (let L = 0; L < STOREYS; L++) {
    const b = gr + STOREY_H * L;

    // Spandrel / lintel band under the window head.
    put(x, b + 4, z, "light_gray_concrete");

    if (L === 0) {
      // Stone base course and shopfront glazing.
      put(x, b + 1, z, "polished_andesite");
      for (const off of [2, 3]) {
        if (win) put(x, b + off, z, "glass_pane", paneProps(f));
        else put(x, b + off, z, "white_concrete");
      }
    } else if (win) {
      // Aluminium-framed window: sill, glass, head.
      put(x, b + 1, z, "quartz_slab", { type: "bottom", waterlogged: "false" });
      for (const off of [2, 3]) put(x, b + off, z, "glass_pane", paneProps(f));
    }

    // Warm light behind some upper-floor glass: glowstone on the interior floor.
    if (win && L >= 1 && inward && (x * 3 + z + L) % 4 === 0) {
      put(inx, b + 1, inz, "glowstone");
    }
  }

  // Cornice cap at the top of the wall and parapet above the roof slab.
  put(x, gr + ROOF_OFF - 1, z, "smooth_quartz_slab", { type: "top", waterlogged: "false" });
  put(x, gr + ROOF_OFF + 1, z, "white_concrete");
  put(x, gr + ROOF_OFF + 2, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
}

// Entrance: one door on the south face, nearest the middle of the frontage.
{
  const cand = keys
    .filter(([x, z]) => exposed(x, z).some((d) => d.n === "south"))
    .map(([x, z]) => ({ x, z }));
  let pick = null;
  if (cand.length) {
    const xs = cand.map((c) => c.x);
    const mid = (Math.min(...xs) + Math.max(...xs)) / 2;
    cand.sort((a, b) => Math.abs(a.x - mid) - Math.abs(b.x - mid));
    pick = cand[0];
  } else {
    const any = keys.find(([x, z]) => exposed(x, z).length);
    if (any) pick = { x: any[0], z: any[1] };
  }
  if (pick) {
    const { x, z } = pick;
    const gr = gnd(x, z);
    const face = exposed(x, z).find((d) => d.n === "south") ?? exposed(x, z)[0];
    const facing = face.n;
    put(x, gr + 1, z, "dark_oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 2, z, "dark_oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
    // Canopy band over the entrance.
    put(x, gr + 3, z, "smooth_quartz_slab", { type: "top", waterlogged: "false" });
  }
}

// Rooftop: central penthouse core, plant units on the roof, parapet already set.
for (const [x, z] of keys) {
  const gr = gnd(x, z);
  const d = distOf(x, z);
  const roofY = gr + ROOF_OFF;
  if (d >= 6) {
    for (let y = roofY + 1; y <= roofY + 3; y++) put(x, y, z, "white_concrete");
    put(x, roofY + 4, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
  } else if (d === 2 && (x + z) % 4 === 0) {
    put(x, roofY + 1, z, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);
