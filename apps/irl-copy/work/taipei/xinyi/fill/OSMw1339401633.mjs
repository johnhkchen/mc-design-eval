import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1339401633";
const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const list = Array.isArray(raw) ? raw : raw.cells;

const W = 63, H = 24, D = 26;
const G = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground height
const ground = new Map();
for (const [x, z, gr] of list) ground.set(`${x},${z}`, Math.round(gr));

const has = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => ground.get(`${x},${z}`);

// Outward direction from an edge cell (first missing 4-neighbour)
const DIRS = [
  ["north", 0, -1],
  ["south", 0, 1],
  ["west", -1, 0],
  ["east", 1, 0],
];
function outward(x, z) {
  for (const [name, dx, dz] of DIRS) {
    if (!has(x + dx, z + dz)) return { name, dx, dz };
  }
  return null;
}

const put = (x, y, z, id, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) G.set(x, y, z, id, p);
  else G.set(x, y, z, id);
};

// Facade logic: 2-storey mid-century commercial block, cream quartz walls,
// glass shopfronts at ground, bronze-grey pillars, parapet cornice, roof plant.
function facadeBlock(x, z, y, g) {
  const b = (x + z) % 3;
  if (y <= 5) {
    // Storey 1 (shopfront storey)
    if (y === g + 1) return "polished_andesite";          // base course
    if (y === 5) return "smooth_quartz";                  // storey line / lintel
    return b === 0 ? "quartz_pillar" : "light_blue_stained_glass";
  }
  // Storey 2
  if (y === 7 || y === 10) return "smooth_quartz";        // spandrels and cornice band
  return b === 0 ? "quartz_pillar" : "light_blue_stained_glass";
}

// Pass 1: foundation, floors, walls, roof, parapet, per footprint cell
for (const [x, z, gr] of list) {
  const g = gr;
  const o = outward(x, z);
  const edge = o !== null;

  // Foundation under the cell up to its ground height
  for (let y = 0; y < g; y++) put(x, y, z, "stone_bricks");

  // Ground-floor slab
  put(x, g, z, "smooth_stone");

  // Storey 1 walls (g+1 .. 5)
  for (let y = g + 1; y <= 5; y++) {
    if (edge) put(x, y, z, facadeBlock(x, z, y, g));
  }

  // Floor slab at y=6
  if (6 > g) put(x, 6, z, "smooth_stone");

  // Storey 2 walls (7 .. 10)
  for (let y = 7; y <= 10; y++) {
    if (y <= g) continue;
    if (edge) put(x, y, z, facadeBlock(x, z, y, g));
  }

  // Roof slab at y=11
  if (11 > g) put(x, 11, z, "smooth_stone");

  // Parapet / cornice cap at y=12 on the edge
  if (12 > g && edge) put(x, 12, z, "smooth_quartz");
}

// Pass 2: warm lights behind the glass (inward cell is interior air)
for (const [x, z, gr] of list) {
  const o = outward(x, z);
  if (!o) continue;
  const ix = x - o.dx, iz = z - o.dz;
  if (!has(ix, iz)) continue;
  const g = gr;
  if ((x + z) % 6 === 1 && 8 > g) put(ix, 8, iz, "glowstone");
  if ((x + z) % 6 === 4 && 3 > g) put(ix, 3, iz, "glowstone");
}

// Pass 3: roof plant boxes on the interior roof
for (const [x, z, gr] of list) {
  if (outward(x, z)) continue;
  if (11 <= gr) continue;
  if ((x * 7 + z * 3) % 17 === 0) {
    put(x, 12, z, "light_gray_concrete");
    put(x, 13, z, "light_gray_concrete");
  }
}

// Pass 4: main entrance on the south face, nearest to centre
{
  const cells = list.filter(([x, z]) => {
    const o = outward(x, z);
    return o && o.name === "south";
  });
  const pool = cells.length
    ? cells
    : list.filter(([x, z]) => outward(x, z));
  if (pool.length) {
    const cx = list.reduce((s, c) => s + c[0], 0) / list.length;
    let best = pool[0];
    for (const c of pool) {
      if (Math.abs(c[0] - cx) < Math.abs(best[0] - cx)) best = c;
    }
    const [ex, ez, eg] = best;
    const o = outward(ex, ez);
    const facing = o.name;
    // Canopy/lintel above the door, then the door itself (two blocks)
    put(ex, eg + 3, ez, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
    put(ex, eg + 1, ez, "dark_oak_door", {
      facing, half: "lower", hinge: "left", open: "false", powered: "false",
    });
    put(ex, eg + 2, ez, "dark_oak_door", {
      facing, half: "upper", hinge: "left", open: "false", powered: "false",
    });
  }
}

G.save(`${DIR}/${ID}.nbt`);
