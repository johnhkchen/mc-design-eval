import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const ID = "FR301499611";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 19, H = 32, D = 16;
const g = new Voxels([W, H, D]);

function put(x, y, z, id, props) {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}
const key = (x, z) => x + "," + z;

// Footprint cells: ground and roof heights (whole blocks)
const F = new Map();
for (const [x, z, gr, r] of cells) F.set(key(x, z), { x, z, gr: Math.round(gr), r: Math.round(r) });

const DIRS = [
  { n: "north", dx: 0, dz: -1 },
  { n: "south", dx: 0, dz: 1 },
  { n: "west", dx: -1, dz: 0 },
  { n: "east", dx: 1, dz: 0 },
];
const inF = (x, z) => F.has(key(x, z));
const outDirs = (x, z) => DIRS.filter((d) => !inF(x + d.dx, z + d.dz));

// Distance in cells from the outer edge of the footprint
const dist = new Map();
const queue = [];
for (const c of F.values()) {
  if (outDirs(c.x, c.z).length > 0) {
    dist.set(key(c.x, c.z), 0);
    queue.push(c);
  }
}
while (queue.length) {
  const c = queue.shift();
  const d0 = dist.get(key(c.x, c.z));
  for (const d of DIRS) {
    const nx = c.x + d.dx, nz = c.z + d.dz;
    if (inF(nx, nz) && !dist.has(key(nx, nz))) {
      dist.set(key(nx, nz), d0 + 1);
      queue.push(F.get(key(nx, nz)));
    }
  }
}

// One common roof level and one storey grid for the whole building
const rs = [...F.values()].map((c) => c.r).sort((a, b) => a - b);
const R = rs[Math.floor(rs.length / 2)];
const G0 = Math.min(...[...F.values()].map((c) => c.gr));
const maxGr = Math.max(...[...F.values()].map((c) => c.gr));
let S = Math.max(2, Math.round((R - 5 - G0) / 5));
while (G0 + 5 * S < maxGr + 5) S++;
const bodyTop = G0 + 5 * S;           // wall top, common to all cells
const roofTop = bodyTop + 5;          // roof apex, common to all cells

// Chimney on the deepest interior cell
let chimneyKey = null, chimneyD = -1;
for (const c of F.values()) {
  const dd = dist.get(key(c.x, c.z)) ?? 0;
  if (dd > chimneyD) { chimneyD = dd; chimneyKey = key(c.x, c.z); }
}
if (chimneyD < 4) chimneyKey = null;

// Stair facing for a roof edge cell at distance d: face the lower-distance side (outward)
function edgeFacing(x, z, d) {
  if (d === 0) return outDirs(x, z)[0].n;
  const nb = DIRS.find((dd) => dist.get(key(x + dd.dx, z + dd.dz)) === d - 1 && inF(x + dd.dx, z + dd.dz));
  return nb ? nb.n : "south";
}

for (const c of F.values()) {
  const { x, z, gr } = c;
  const k = key(x, z);
  const ob = outDirs(x, z);
  const perim = ob.length > 0;
  const d = dist.get(k) ?? 0;

  // inner neighbour for a glowing light behind a window
  const innerN = DIRS.map((dd) => F.get(key(x + dd.dx, z + dd.dz)))
    .find((n) => n && (dist.get(key(n.x, n.z)) ?? 0) >= 1);

  // Foundation under the cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "granite");

  // Walls and floors on the common storey grid
  for (let y = gr; y <= bodyTop; y++) {
    const ly = y - G0;
    if (perim) {
      if (y === bodyTop) {
        put(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
      } else if (y === gr) {
        put(x, y, z, "stone_bricks");
      } else if (ly % 5 === 0) {
        put(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
      } else if (ly % 5 >= 1 && ly % 5 <= 3 && (x + z) % 3 === 1) {
        put(x, y, z, "glass_pane", { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" });
        if (ly % 5 === 2 && innerN && (x + z) % 2 === 1) {
          put(innerN.x, y, innerN.z, "glowstone");
        }
      } else {
        put(x, y, z, "stone_bricks");
      }
    } else {
      if (y === gr || y === bodyTop || ly % 5 === 0) put(x, y, z, "oak_planks");
    }
  }

  // Pitched slate roof: five tiers, stairs on every sloping edge
  for (let t = 1; t <= 5; t++) {
    const y = bodyTop + t;
    if (d >= t - 1) {
      if (d === t - 1) {
        put(x, y, z, "deepslate_tile_stairs", {
          facing: edgeFacing(x, z, d), half: "bottom", shape: "straight", waterlogged: "false",
        });
      } else {
        put(x, y, z, "deepslate_tiles");
      }
    }
  }

  // Chimney above the roof
  if (k === chimneyKey) {
    for (let y = roofTop + 1; y <= roofTop + 2; y++) put(x, y, z, "stone_bricks");
    put(x, roofTop + 3, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

// Street entrance: door on the south-facing edge, middle of that run, with a lintel
const southEdge = [...F.values()]
  .filter((c) => outDirs(c.x, c.z).some((d) => d.n === "south"))
  .sort((a, b) => a.x - b.x);
if (southEdge.length) {
  const door = southEdge[Math.floor(southEdge.length / 2)];
  const y0 = door.gr + 1;
  put(door.x, y0, door.z, "dark_oak_door", {
    facing: "south", half: "lower", hinge: "left", open: "false", powered: "false",
  });
  put(door.x, y0 + 1, door.z, "dark_oak_door", {
    facing: "south", half: "upper", hinge: "left", open: "false", powered: "false",
  });
  put(door.x, y0 + 2, door.z, "stone_brick_slab", { type: "top", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
