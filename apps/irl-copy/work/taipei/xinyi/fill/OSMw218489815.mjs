import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw218489815";
const W = 34, H = 23, D = 57;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const inFp = (x, z) => ground.has(`${x},${z}`);
const G = (x, z) => ground.get(`${x},${z}`);

const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const NAME = new Map(Object.entries(DIRS).map(([n, [dx, dz]]) => [`${dx},${dz}`, n]));

// Distance from the footprint edge (edge cells = 0, interior grows inward)
const dist = new Map();
const queue = [];
const keys = [...ground.keys()].map(k => k.split(",").map(Number));
for (const [x, z] of keys) {
  const edge = Object.values(DIRS).some(([dx, dz]) => !inFp(x + dx, z + dz));
  if (edge) { dist.set(`${x},${z}`, 0); queue.push([x, z]); }
}
for (let qi = 0; qi < queue.length; qi++) {
  const [x, z] = queue[qi];
  const d0 = dist.get(`${x},${z}`);
  for (const [dx, dz] of Object.values(DIRS)) {
    const nx = x + dx, nz = z + dz;
    if (inFp(nx, nz) && !dist.has(`${nx},${nz}`)) {
      dist.set(`${nx},${nz}`, d0 + 1);
      queue.push([nx, nz]);
    }
  }
}
const D_ = (x, z) => dist.get(`${x},${z}`) ?? 0;

// Eave level: roof about 11 blocks above lowest ground; raised if ground is higher
const maxG = Math.max(...cells.map(c => c[2]));
const E = Math.max(11, maxG + 3);     // roof eave level
const WALL_TOP = E - 2;               // last solid wall course
const CORNICE = E - 1;                // cornice band

// Stepped hipped roof: four tiers out to the wings, then a raised central hall
const roofTop = (d) => E + Math.min(d, 4) + (d >= 8 ? Math.min(d - 7, 2) : 0);
const Tof = (x, z) => (inFp(x, z) ? roofTop(D_(x, z)) : CORNICE);

// Placement map so later passes can override earlier ones
const P = new Map();
const put = (x, y, z, b, p) => P.set(`${x},${y},${z}`, [b, p]);

// Pass 1: foundation, base, walls, cornice, roof mass
for (const [x, z, gr] of cells) {
  const d = D_(x, z);

  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  for (let y = gr; y <= gr + 1 && y < CORNICE; y++) put(x, y, z, "polished_andesite");
  for (let y = gr + 2; y <= WALL_TOP; y++) put(x, y, z, "red_concrete");

  // Cornice: yellow band with projecting bracket blocks every second bay
  if (d === 0) {
    let o = null;
    for (const [dx, dz] of Object.values(DIRS)) {
      if (!inFp(x + dx, z + dz)) { o = [dx, dz]; break; }
    }
    const t = o && o[0] === 0 ? x : z;
    put(x, CORNICE, z, t % 2 === 0 ? "yellow_concrete" : "yellow_terracotta");
  } else {
    put(x, CORNICE, z, "red_concrete");
  }

  // Roof: solid copper below, stair at each step, full block on flats
  const T = roofTop(d);
  for (let y = E; y < T; y++) put(x, y, z, "waxed_oxidized_cut_copper");

  let facing = null, minT = Infinity;
  for (const [dx, dz] of Object.values(DIRS)) {
    const nt = Tof(x + dx, z + dz);
    if (nt < minT) { minT = nt; facing = NAME.get(`${dx},${dz}`); }
  }
  if (minT < T) {
    put(x, T, z, "waxed_oxidized_cut_copper_stairs",
      { facing, half: "bottom", shape: "straight", waterlogged: "false" });
  } else {
    put(x, T, z, "waxed_oxidized_cut_copper");
  }

  // Ridge along the central hall
  if ((x === 16 || x === 17) && d >= 10) {
    put(x, T + 1, z, "yellow_glazed_terracotta");
  }
}

// Pass 2: perimeter articulation (windows, pillars, entrance) and cavities
for (const [x, z, gr] of cells) {
  if (D_(x, z) !== 0) continue;

  // Outward direction: first neighbour outside the footprint
  let o = null;
  for (const [dx, dz] of Object.values(DIRS)) {
    if (!inFp(x + dx, z + dz)) { o = [dx, dz]; break; }
  }
  if (!o) continue;
  const [ox, oz] = o;
  const alongNS = ox === 0;                 // wall runs east-west
  const t = alongNS ? x : z;                // along-wall coordinate
  const faceName = NAME.get(`${ox},${oz}`);

  // Entrance: double dark oak doors centred on the south face, lintel above
  const isDoor = faceName === "south" && (t === 16 || t === 17);
  if (isDoor) {
    const hinge = t === 16 ? "left" : "right";
    put(x, gr + 2, z, "dark_oak_door", { facing: "south", half: "lower", hinge, open: "false", powered: "false" });
    put(x, gr + 3, z, "dark_oak_door", { facing: "south", half: "upper", hinge, open: "false", powered: "false" });
    put(x, gr + 4, z, "yellow_concrete");
    continue;
  }

  // Pillars every fourth bay
  if (t % 4 === 0) {
    for (let y = gr + 2; y <= WALL_TOP; y++) put(x, y, z, "white_concrete");
    continue;
  }

  // Windows: two panes per bay, framed top and bottom
  if (t % 4 === 1 || t % 4 === 2) {
    if (gr + 6 > WALL_TOP) continue;
    const paneProps = alongNS
      ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
      : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
    for (let y = gr + 3; y <= gr + 5; y++) put(x, y, z, "glass_pane", paneProps);
    put(x, gr + 2, z, "dark_oak_planks");
    put(x, gr + 6, z, "dark_oak_planks");

    // Air gap behind the glass, floor and ceiling slabs, warm light in every other window
    const cx = x - ox, cz = z - oz;
    if (inFp(cx, cz) && D_(cx, cz) >= 1) {
      put(cx, gr + 2, cz, "smooth_stone");
      put(cx, gr + 6, cz, "smooth_stone");
      for (let y = gr + 3; y <= gr + 5; y++) put(cx, y, cz, "air");
      if (t % 8 === 1) put(cx, gr + 4, cz, "glowstone");
    }
  }
}

// Emit
for (const [k, [b, p]] of P) {
  const [x, y, z] = k.split(",").map(Number);
  if (y < 0 || y >= H || x < 0 || x >= W || z < 0 || z >= D) continue;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
}

g.save(`${DIR}/${ID}.nbt`);
