import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const raw = JSON.parse(readFileSync(`${dir}/NYC1077415.cells.json`, "utf8"));

const W = 30, H = 46, D = 24;
const g = new Voxels([W, H, D]);

// Normalise cell records: [x, z, ground, roof]
const map = new Map();
for (const e of raw) {
  const [x, z, gr, roof] = Array.isArray(e) ? e : [e.x, e.z, e.ground, e.roof];
  map.set(`${x},${z}`, { gr: Math.round(gr), roof: Math.round(roof) });
}
const has = (x, z) => map.has(`${x},${z}`);
const hash = (x, y, z) => ((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0;

// Per-cell tiers: ground and roof snapped to 4-block setback tiers above ground
const tiers = new Map();
for (const [key, { gr, roof }] of map) {
  const ground = Math.max(0, Math.min(H - 6, gr));
  let top = ground + 4 * Math.round((roof - ground) / 4);
  top = Math.max(ground + 4, Math.min(H - 1, top));
  tiers.set(key, { ground, top });
}

const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Entrance: on the lowest-z street edge, middle cell with the lowest ground
let minZ = Infinity;
for (const key of map.keys()) minZ = Math.min(minZ, Number(key.split(",")[1]));
const frontCells = [...map.keys()]
  .map(k => k.split(",").map(Number))
  .filter(([x, z]) => z === minZ && isEdge(x, z))
  .sort((a, b) => a[0] - b[0]);
const entry = frontCells.length ? frontCells[Math.floor(frontCells.length / 2)] : null;
const entryKey = entry ? `${entry[0]},${entry[1]}` : null;

for (const [key, { ground, top }] of tiers) {
  const [x, z] = key.split(",").map(Number);
  const edge = isEdge(x, z);

  // Foundation from y 0 up to the cell's ground
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone_bricks");

  const span = top - ground;
  for (let y = ground; y < top; y++) {
    const off = y - ground;

    if (edge) {
      if (off === span - 1) {
        g.set(x, y, z, "smooth_stone"); // cornice / parapet cap
      } else if (off === 0) {
        g.set(x, y, z, "polished_granite"); // base course
      } else if (off % 2 === 0) {
        g.set(x, y, z, "stone_bricks"); // storey line
      } else {
        const bay = (x + z) % 3 !== 0;
        if (!bay) {
          g.set(x, y, z, off === 1 ? "stone_bricks" : "bricks"); // pier
        } else if (off > 3 && hash(x, y, z) % 41 === 0) {
          g.set(x, y, z, "shroomlight"); // sparse warm light behind glass
        } else {
          g.set(x, y, z, "glass_pane");
        }
      }
    } else {
      // interior: floor slabs each storey and a roof slab; air between
      if (off % 2 === 0 || off === span - 1) g.set(x, y, z, "smooth_stone");
    }
  }
}

// Street entrance with a canopy supported by the wall below
if (entry) {
  const [ex, ez] = entry;
  const t = tiers.get(entryKey);
  const gr = t.ground;
  g.set(ex, gr, ez, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(ex, gr + 1, ez, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  // canopy: slabs across the entrance bay, on the storey line above the door
  for (const dx of [-1, 0, 1]) {
    const cx = ex + dx;
    if (has(cx, ez) && isEdge(cx, ez)) {
      g.set(cx, gr + 2, ez, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
      g.set(cx, gr + 3, ez, "smooth_stone");
    }
  }
}

g.save(`${dir}/NYC1077415.nbt`);
