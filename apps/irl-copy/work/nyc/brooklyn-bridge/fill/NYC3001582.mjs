import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3001582";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 6, H = 23, D = 20;
const g = new Voxels([W, H, D]);

// Flat roof: smooth lidar noise to one median tier.
const roofs = cells.map(c => c[3]).sort((a, b) => a - b);
const R = roofs[Math.floor(roofs.length / 2)];

const info = new Map();
for (const [x, z, gr] of cells) info.set(`${x},${z}`, { x, z, gr });
const has = (x, z) => info.has(`${x},${z}`);

const DIRS = [
  { name: "west",  dx: -1, dz: 0,  axis: "x" },
  { name: "east",  dx: 1,  dz: 0,  axis: "x" },
  { name: "north", dx: 0,  dz: -1, axis: "z" },
  { name: "south", dx: 0,  dz: 1,  axis: "z" },
];
const exposed = (x, z) => DIRS.filter(d => !has(x + d.dx, z + d.dz));

const put = (x, y, z, id, st) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (st) g.set(x, y, z, id, st);
  else g.set(x, y, z, id);
};
const range = (a, b) => { const r = []; for (let i = a; i <= b; i++) r.push(i); return r; };

// Four storeys: levels k=0..4, level 4 is the cornice/roof course.
const levelsFor = (gr, top) => {
  const n = top - gr;
  return [0, 1, 2, 3, 4].map(k => gr + Math.round(k * (n - 1) / 4));
};

// Brownstone-era palette: warm terracotta brick, sandstone trim, stone base.
const BRICK = "terracotta";
const PIER = "red_terracotta";
const BASE = "stone_bricks";
const TRIM = "smooth_sandstone";

const WIN_X = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const WIN_Z = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

// Which face a cell belongs to for pier rhythm (first exposed face).
const faceIndex = (d, x, z) => (d.axis === "x" ? z : x);

// Pass 1: foundations, floors, walls, cornice, roof, penthouse.
for (const c of info.values()) {
  const { x, z, gr } = c;
  const top = Math.max(R, gr + 8);
  const L = levelsFor(gr, top);
  const f4 = L[4];
  const edge = exposed(x, z);
  const isEdge = edge.length > 0;

  // Solid foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, BASE);

  if (!isEdge) {
    // Interior: floor slabs only, air between (no interior fit-out).
    for (let k = 0; k < 4; k++) put(x, L[k], z, "oak_planks");
    put(x, f4, z, "smooth_stone");
    // Roof bulkhead (stair enclosure) on a central patch.
    if (x >= 2 && x <= 3 && z >= 2 && z <= 4) {
      put(x, f4 + 1, z, BRICK);
      put(x, f4 + 2, z, BRICK);
    }
  } else {
    const d = edge[0];
    const a = faceIndex(d, x, z);
    const isPier = a % 3 === 0;
    for (let y = gr; y < f4; y++) {
      let id = BRICK;
      if (y < L[1]) id = BASE;                       // ground-floor base course
      else if (L.slice(1, 4).includes(y)) id = TRIM; // storey lines
      else if (isPier) id = PIER;                    // vertical piers between bays
      put(x, y, z, id);
    }
    // Projecting cornice course on top of the parapet.
    put(x, f4, z, TRIM, { type: "bottom", waterlogged: "false" });
  }
}

// Pass 2: window grids, lintels, a few warm lights on upper storeys.
for (const c of info.values()) {
  const { x, z, gr } = c;
  const edge = exposed(x, z);
  if (!edge.length) continue;
  const top = Math.max(R, gr + 8);
  const L = levelsFor(gr, top);

  for (const d of edge) {
    const a = faceIndex(d, x, z);
    if (a % 3 !== 1) continue; // window bay centres
    const st = d.axis === "x" ? WIN_X : WIN_Z;
    const bay = Math.floor(a / 3);
    const ix = x - d.dx, iz = z - d.dz;
    const inwardInterior = has(ix, iz) && exposed(ix, iz).length === 0;

    for (let k = 0; k < 4; k++) {
      const fk = L[k], nx = L[k + 1], p = nx - fk;
      const rows = p <= 2 ? [fk + 1] : range(fk + 1, nx - 2);
      for (const y of rows) put(x, y, z, "glass_pane", st);
      if (p >= 3) put(x, nx - 1, z, TRIM); // lintel course
      // Warm light only on upper storeys, every other bay, behind the glass.
      if (k >= 1 && k <= 2 && bay % 2 === 0 && inwardInterior && rows.length) {
        put(ix, rows[0], iz, "shroomlight");
      }
    }
  }
}

// Pass 3: street entrance on a north-facing (or any) exposed face, mid-block.
let door = null;
for (const c of info.values()) {
  const e = exposed(c.x, c.z);
  if (e.some(d => d.name === "north") && (c.x === 2 || c.x === 3)) {
    door = { c, d: e.find(d => d.name === "north") };
    break;
  }
}
if (!door) {
  for (const c of info.values()) {
    const e = exposed(c.x, c.z);
    if (e.length) { door = { c, d: e[0] }; break; }
  }
}
if (door) {
  const { c, d } = door;
  const dstate = (half) => ({ facing: d.name, half, hinge: "left", open: "false", powered: "false", waterlogged: "false" });
  // Canopy lintel over the entrance.
  put(c.x, c.gr + 2, c.z, TRIM, { type: "bottom", waterlogged: "false" });
  put(c.x, c.gr, c.z, "dark_oak_door", dstate("lower"));
  put(c.x, c.gr + 1, c.z, "dark_oak_door", dstate("upper"));
}

g.save(`${DIR}/${ID}.nbt`);
