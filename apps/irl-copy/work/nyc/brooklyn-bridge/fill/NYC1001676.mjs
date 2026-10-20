import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 20 Cardinal Hayes Place, 1937. Public institution in limestone with a granite base,
// steel-sash window grid, quartz pilasters, a stone cornice and a granite-framed entrance.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC1001676";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 11, H = 25, D = 21;
const g = new Voxels([W, H, D]);

const S = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Footprint map: key "x,z" -> { x, z, gr: ground, t: roof top (exclusive) }
const map = new Map();
const rawRoof = new Map();
for (const c of cells) {
  const [x, z, ground, roof] = c;
  rawRoof.set(`${x},${z}`, roof);
  map.set(`${x},${z}`, { x, z, gr: ground, t: 0 });
}
const inF = (x, z) => map.has(`${x},${z}`);
const at = (x, z) => map.get(`${x},${z}`);

// Smooth the lidar roof: average within a radius-3 neighbourhood, then quantise to
// two-block tiers so the massing reads as clean flat storeys instead of spikes.
for (const c of map.values()) {
  let sum = 0, n = 0;
  for (let dx = -3; dx <= 3; dx++) {
    for (let dz = -3; dz <= 3; dz++) {
      const k = `${c.x + dx},${c.z + dz}`;
      if (rawRoof.has(k)) { sum += rawRoof.get(k); n++; }
    }
  }
  const avg = sum / n;
  let t = 2 * Math.round(avg / 2);
  if (t < c.gr + 6) t = c.gr + 6;
  if (t > H) t = H;
  c.t = t;
}

// Perimeter: any side open to the outside
const perim = (x, z) => !inF(x - 1, z) || !inF(x + 1, z) || !inF(x, z - 1) || !inF(x, z + 1);

// Piers on a 3-cell bay rhythm along the face they belong to; corners are piers
function pier(x, z) {
  const alongX = !inF(x, z - 1) || !inF(x, z + 1); // face runs along x
  const alongZ = !inF(x - 1, z) || !inF(x + 1, z); // face runs along z
  if (alongX && alongZ) return true;
  if (alongX) return x % 3 === 0;
  if (alongZ) return z % 3 === 0;
  return false;
}

// Window cell: facade, not a pier, inside a window row of its own column
const isGlass = (x, z, y) => {
  const c = at(x, z);
  if (!c || !perim(x, z) || pier(x, z)) return false;
  return y >= c.gr + 2 && y < c.t - 2 && y % 2 === 1;
};

// Entrance: on the north (min z) face, the non-pier cell nearest the middle
let door = null;
{
  let best = Infinity;
  for (const c of map.values()) {
    if (inF(c.x, c.z - 1)) continue;
    if (pier(c.x, c.z)) continue;
    const d = Math.abs(c.x - 5);
    if (d < best) { best = d; door = c; }
  }
}

const hash = (x, y, z) => Math.abs((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) % 4;

// Pass 1: foundation, base, facade, interior, roof
for (const c of map.values()) {
  const { x, z, gr, t } = c;
  const isPerim = perim(x, z);
  const isPier = pier(x, z);

  // Foundation from y 0 up to the cell's ground
  for (let y = 0; y < gr; y++) S(x, y, z, "stone_bricks");

  for (let y = gr; y < t; y++) {
    const rel = y - gr;

    if (isPerim) {
      // Entrance door, two blocks tall, on the granite base
      if (door && x === door.x && z === door.z && (y === gr || y === gr + 1)) {
        S(x, y, z, "dark_oak_door", {
          facing: "north",
          half: y === gr ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
        continue;
      }
      // Granite base course
      if (rel < 2) { S(x, y, z, "polished_granite"); continue; }
      // Cornice and parapet
      if (y === t - 1) { S(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" }); continue; }
      if (y === t - 2) { S(x, y, z, "calcite"); continue; }
      // Granite entrance surround: the door's bay and a lintel above it
      if (door && Math.abs(x - door.x) <= 1 && z === door.z && (rel === 2 || y === gr + 3)) {
        S(x, y, z, "polished_granite");
        continue;
      }
      // Pilasters
      if (isPier) { S(x, y, z, "chiseled_quartz_block"); continue; }
      // Window row: glass pane in a steel-sash opening
      if (y % 2 === 1) {
        const alongX = !inF(x, z - 1) || !inF(x, z + 1);
        const conn = alongX ? { east: "true", west: "true" } : { north: "true", south: "true" };
        S(x, y, z, "glass_pane", {
          north: "false", south: "false", east: "false", west: "false",
          ...conn, waterlogged: "false",
        });
        continue;
      }
      // Spandrel
      S(x, y, z, "calcite");
      continue;
    }

    // Interior
    if (y === t - 1) { S(x, y, z, "smooth_stone"); continue; }

    // Air gap directly behind a window: the only open space in the building
    let behindGlass = false;
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      if (isGlass(x + dx, z + dz, y) && rel >= 2 && y < t - 2 && y % 2 === 1) {
        behindGlass = true;
        break;
      }
    }
    if (behindGlass) {
      if (hash(x, y, z) === 0) {
        S(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
      }
      continue; // air
    }

    S(x, y, z, "stone");
  }
}

// Entrance lantern hanging under the granite lintel
if (door) {
  const ly = door.gr + 2;
  if (ly < door.t - 2) {
    S(door.x, ly, door.z, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
