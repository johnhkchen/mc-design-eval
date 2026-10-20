import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE91-0312-1F-2";
const W = 57, H = 19, D = 20;
const ROOF_Y = 6;          // parapet course / roof deck; roof surface at 7 above lowest ground

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const minG = Math.min(...raw.map((c) => c[2]));
const key = (x, z) => `${x},${z}`;
const cells = new Map();
for (const [x, z, gr] of raw) cells.set(key(x, z), Math.max(0, Math.round(gr - minG)));

const xs = raw.map((c) => c[0]), zs = raw.map((c) => c[1]);
const minX = Math.min(...xs), maxX = Math.max(...xs);
const minZ = Math.min(...zs);
const cx = Math.round((minX + maxX) / 2);

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Depth from the outside edge: 1 = facade ring, 2 = air gap behind glass, 3+ = core (solid support)
const depth = new Map();
let frontier = [];
for (const k of cells.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (DIRS.some(([dx, dz]) => !cells.has(key(x + dx, z + dz)))) {
    depth.set(k, 1);
    frontier.push([x, z]);
  }
}
for (let d = 1; frontier.length; d++) {
  const next = [];
  for (const [x, z] of frontier) {
    for (const [dx, dz] of DIRS) {
      const k2 = key(x + dx, z + dz);
      if (cells.has(k2) && !depth.has(k2)) {
        depth.set(k2, d + 1);
        next.push([x + dx, z + dz]);
      }
    }
  }
  frontier = next;
}

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};
const lamps = new Set();
const key3 = (x, y, z) => `${x},${y},${z}`;

const DOOR = (half) => ({ facing: "south", half, hinge: "left", open: "false", powered: "false" });

for (const [k, gr] of cells) {
  const [x, z] = k.split(",").map(Number);
  const d = depth.get(k) ?? 3;
  const nW = cells.has(key(x - 1, z)), nE = cells.has(key(x + 1, z));
  const nN = cells.has(key(x, z - 1)), nS = cells.has(key(x, z + 1));
  const exZ = !nN || !nS;
  const exX = !nW || !nE;
  const u = exZ ? x : z;                 // bay coordinate along the exposed facade
  const front = z === minZ && !nN;       // street-facing entrance side
  const entryBay = front && Math.abs(x - cx) <= 2;

  // Foundation below the cell's own ground
  for (let y = 0; y < Math.min(gr, H); y++) put(x, y, z, "stone_bricks");

  for (let y = gr; y <= ROOF_Y; y++) {
    if (d === 1) {
      // Facade ring
      const corner = exZ && exX;
      const pier = corner || u % 4 === 0;
      if (y === 0) put(x, y, z, "polished_granite");
      else if (y === 3) {
        // storey line; entrance gets a granite lintel band
        put(x, y, z, entryBay ? "polished_granite" : "smooth_quartz");
      } else if (y === ROOF_Y) {
        put(x, y, z, "smooth_quartz");   // parapet course
      } else if (entryBay && y <= 2) {
        // Entrance: granite pilasters flanking a centre door, glazed reveal either side
        if (x === cx - 2 || x === cx + 2) put(x, y, z, "polished_granite");
        else if (x === cx && gr <= 1) {
          put(x, y, z, "iron_door", DOOR(y === 1 ? "lower" : "upper"));
        } else put(x, y, z, "light_blue_stained_glass");
      } else {
        put(x, y, z, pier ? "white_concrete" : "light_blue_stained_glass");
      }
      // Warm light behind some upper windows
      if (y === 4 && !pier && u % 8 === 2) {
        const ix = exZ ? 0 : (!nW ? 1 : -1);
        const iz = exZ ? (!nN ? 1 : -1) : 0;
        const ik = key(x + ix, z + iz);
        if (cells.has(ik) && depth.get(ik) === 2) lamps.add(key3(x + ix, 4, z + iz));
      }
      // Parapet rhythm: piers rise above the parapet, corners carry pillars
      if (y === ROOF_Y && (corner || (pier && u % 8 === 0))) {
        put(x, ROOF_Y + 1, z, "white_concrete");
      }
    } else if (d === 2) {
      // Air gap behind the glass with a floor slab per storey
      if (y === 0) put(x, y, z, "polished_granite");
      else if (y === ROOF_Y) put(x, y, z, "light_gray_concrete");
      else if (y === 3) put(x, y, z, "smooth_quartz");
      else if (y === 2 && z === minZ + 1 && (x === cx - 3 || x === cx + 3)) {
        // Hanging lanterns either side of the entrance
        put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
      }
    } else {
      // Core: solid support for slabs, roof deck on top
      if (y === ROOF_Y) put(x, y, z, "light_gray_concrete");
      else put(x, y, z, "smooth_quartz");
    }
  }
}

// Lamps behind windows (only where the gap cell exists)
for (const k3 of lamps) {
  const [x, y, z] = k3.split(",").map(Number);
  put(x, y, z, "glowstone");
}

// Roof: mechanical penthouse and two cooling units, only on cells that have a roof
const roofOk = (x, z) => {
  const k = key(x, z);
  return cells.has(k) && cells.get(k) <= ROOF_Y && (depth.get(k) ?? 3) >= 3;
};
const box = (x0, x1, z0, z1, y0, y1, id) => {
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    if (!roofOk(x, z)) continue;
    for (let y = y0; y <= y1; y++) put(x, y, z, id);
  }
};
box(cx - 6, cx + 6, minZ + 6, minZ + 13, ROOF_Y + 1, ROOF_Y + 2, "light_gray_concrete");
box(cx + 12, cx + 15, minZ + 4, minZ + 5, ROOF_Y + 1, ROOF_Y + 1, "gray_concrete");
box(cx - 16, cx - 13, minZ + 14, minZ + 15, ROOF_Y + 1, ROOF_Y + 1, "gray_concrete");

g.save(`${DIR}/${ID}.nbt`);
