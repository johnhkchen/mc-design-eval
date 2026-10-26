// FR245184614: a Haussmann-era residential block (1880, cream limestone, a zinc-grey mansard), built on the lidar footprint.
// Storeys are 4 blocks: a string course (y = 1 mod 4), two window rows, a head course. The ground storey and five floors
// stand on y 1 to 24; the mansard (y 25 to 28) is the seventh storey and its ridge lands on the lidar's 29. The lower
// wings stop at 21 and 25 with a flat deck and a parapet. Walls are two thick: glass on the front ring with an air gap
// behind it, a solid core. Every cell is solid from y 0 up to its own top, so nothing floats on the slope.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill";
const cells = JSON.parse(readFileSync(`${DIR}/FR245184614.cells.json`, "utf8"));

const W = 25, H = 45, D = 20;
const MAIN = 29;
const key = (x, z) => `${x},${z}`;
const key3 = (x, y, z) => `${x},${y},${z}`;
const NEI = [["north", 0, -1], ["south", 0, 1], ["west", -1, 0], ["east", 1, 0]];

const fp = new Map();                                       // "x,z" -> lidar roof height above y 0
for (const [x, z, , r] of cells) fp.set(key(x, z), r);
const inFp = (x, z) => fp.has(key(x, z));

// Smooth the lidar (3x3 median), then snap each cell to a roof tier: the mansard's 29, a wing's 25 or 21.
const top = new Map();
for (const k of fp.keys()) {
  const [x, z] = k.split(",").map(Number);
  const vals = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (inFp(x + dx, z + dz)) vals.push(fp.get(key(x + dx, z + dz)));
  vals.sort((a, b) => a - b);
  const med = vals[Math.floor(vals.length / 2)];
  top.set(k, med >= 27 ? MAIN : med >= 23 ? 25 : 21);
}
const topAt = (x, z) => top.get(key(x, z)) ?? 0;
const storeysTop = (T) => (T === MAIN ? 24 : T - 2);        // last storey row below the roof (the mansard starts at 25)

// Steps inward from the edge of a set of cells (edge = 0): the mansard's slope runs from the cornice up to the ridge.
function distIn(set) {
  const d = new Map(), q = [];
  for (const k of set) {
    const [x, z] = k.split(",").map(Number);
    if (NEI.some(([, dx, dz]) => !set.has(key(x + dx, z + dz)))) { d.set(k, 0); q.push(k); }
  }
  for (let i = 0; i < q.length; i++) {
    const [x, z] = q[i].split(",").map(Number);
    for (const [, dx, dz] of NEI) {
      const n = key(x + dx, z + dz);
      if (set.has(n) && !d.has(n)) { d.set(n, d.get(q[i]) + 1); q.push(n); }
    }
  }
  return d;
}

// The blocks, keyed "x,y,z": { block, state } or nothing (air). Written out once at the end.
const B = new Map();
const put = (x, y, z, block, state) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  const k = key3(x, y, z);
  if (block) B.set(k, { block, state }); else B.delete(k);
};

// Pass 1: the solid volume of every cell, its string courses and head courses, the wings' roofs, the mansard.
for (const [k, T] of top) {
  const [x, z] = k.split(",").map(Number);
  put(x, 0, z, "stone_bricks");                             // plinth: the foundation under every cell
  for (let y = 1; y <= storeysTop(T); y++) put(x, y, z, y % 4 === 1 ? "smooth_quartz" : "calcite");
  if (T !== MAIN) {
    const edge = NEI.some(([, dx, dz]) => !inFp(x + dx, z + dz) || topAt(x + dx, z + dz) < T);
    put(x, T - 1, z, edge ? "smooth_quartz" : "stone");     // parapet on the edge, deck inside
    if (!edge && x % 6 === 2 && z % 5 === 2) for (let y = T; y < T + 2; y++) put(x, y, z, "bricks");
  }
}

const mainSet = new Set([...top].filter(([, T]) => T === MAIN).map(([k]) => k));
const md = distIn(mainSet);
for (const k of mainSet) {
  const [x, z] = k.split(",").map(Number), d = md.get(k);
  for (let layer = 0; layer <= 3; layer++) {
    const y = 25 + layer;
    if (d < layer) continue;                                // air above the slope at this distance from the eaves
    if (layer === 0 && d === 0) put(x, y, z, "smooth_quartz");           // the cornice
    else if (layer > 0 && d === layer) {                    // the slope: a stair whose low front faces the eaves
      const [name] = NEI.find(([, dx, dz]) => md.get(key(x + dx, z + dz)) === d - 1);
      put(x, y, z, "deepslate_tile_stairs", { facing: name, half: "bottom", shape: "straight", waterlogged: "false" });
    } else put(x, y, z, "deepslate_tiles");
  }
  if (d >= 4 && x % 6 === 2 && z % 5 === 2) for (let y = 29; y <= 30; y++) put(x, y, z, "bricks");   // chimney stacks
}

// Pass 2: the front ring. A cell with one face to the outside carries the bays along that face: a pier every third
// cell, two glass rows between, the air gap behind the glass, the piano nobile's iron rail, the street doors.
const front = (x, z) => {
  const outs = NEI.filter(([, dx, dz]) => !inFp(x + dx, z + dz));
  return outs.length === 1 ? outs[0] : null;               // corners are quoins: left as calcite piers
};
for (const [k, T] of top) {
  const [x, z] = k.split(",").map(Number);
  const f = front(x, z); if (!f) continue;
  const [name, dx, dz] = f;
  const p = name === "north" || name === "south" ? x : z;
  if (p % 3 === 0) continue;                               // piers
  const ix = x - dx, iz = z - dz;                          // the cell behind this one
  if (!inFp(ix, iz)) continue;
  for (let y = 1; y <= storeysTop(T); y++) {
    const floor = Math.floor(y / 4), ph = y % 4;
    if (ph === 2 || ph === 3) {
      const lit = (floor + p) % 5 === 2;                    // one bay in five is lit from behind
      put(x, y, z, lit ? "glowstone" : "light_blue_stained_glass_pane");
      put(ix, y, iz, null);                                 // air gap behind the glass
    }
    if (y === 5) put(x, y, z, "iron_bars");                 // piano nobile: the rail at the sill of floor 2 (bays only)
  }
}
// the piano nobile rail sits in front of the window bays only: restore the string course on the piers
for (const [k, T] of top) {
  const [x, z] = k.split(",").map(Number);
  const f = front(x, z); if (!f) continue;
  const [name] = f;
  if ((name === "north" || name === "south" ? x : z) % 3 === 0 && T > 5) put(x, 5, z, "smooth_quartz");
}

// The street doors: on the south and north faces, at a pier nearest the middle of the face, main tier only.
for (const name of ["south", "north"]) {
  const cands = [...top]
    .filter(([k, T]) => T === MAIN && front(...k.split(",").map(Number))?.[0] === name)
    .map(([k]) => k.split(",").map(Number))
    .filter(([x, z]) => (name === "north" || name === "south" ? x : z) % 3 === 0)
    .sort((a, b) => a[0] - b[0]);
  if (!cands.length) continue;
  const [x, z] = cands[Math.floor(cands.length / 2)];
  const [, dx, dz] = front(x, z);
  const facing = name;
  put(x - dx, 1, z - dz, null); put(x - dx, 2, z - dz, null);    // a one-deep entrance hall, air
  put(x, 1, z, "dark_oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  put(x, 2, z, "dark_oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
  put(x, 3, z, "lantern", { hanging: "true", waterlogged: "false" });
}

// Panes and bars join their neighbours: a solid block, another pane or bar, but not a stair, a door or a lantern.
const connects = (b) => !!b && !/(stairs|door|lantern|slab)/.test(b.block);
for (const [k, v] of B) {
  if (!/(glass_pane|iron_bars)$/.test(v.block)) continue;
  const [x, y, z] = k.split(",").map(Number);
  const state = {};
  for (const [name, dx, dz] of NEI) state[name] = String(connects(B.get(key3(x + dx, y, z + dz))));
  state.waterlogged = "false";
  v.state = state;
}

const g = new Voxels([W, H, D]);
for (const [k, v] of B) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, v.block, v.state);
}
g.save(`${DIR}/FR245184614.nbt`);
