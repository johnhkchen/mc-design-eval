import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540883611";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 6, H = 23, D = 8;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground height
const ground = new Map();
for (const [x, z, gy] of cells) ground.set(`${x},${z}`, gy);
const has = (x, z) => ground.has(`${x},${z}`);

const xs = cells.map(c => c[0]), zs = cells.map(c => c[1]);
const minX = Math.min(...xs), maxX = Math.max(...xs);
const minZ = Math.min(...zs), maxZ = Math.max(...zs);
const cx = (minX + maxX) / 2, cz = (minZ + maxZ) / 2;

// Exposed faces: a face is a street/outside face when the neighbour cell is not in the footprint
const ex = (x, z) => ({
  n: !has(x, z - 1), s: !has(x, z + 1),
  w: !has(x - 1, z), e: !has(x + 1, z),
});
const perimeter = (x, z) => { const e = ex(x, z); return e.n || e.s || e.w || e.e; };

// Safe setter: ignores anything outside the grid
function put(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Main entrance: the north-facing perimeter cell nearest the centre line
const northCells = cells.filter(([x, z]) => ex(x, z).n);
let door = null;
if (northCells.length) {
  northCells.sort((a, b) => a[1] - b[1] || Math.abs(a[0] - cx) - Math.abs(b[0] - cx));
  door = `${northCells[0][0]},${northCells[0][1]}`;
}

// Window positions: alternate along each non-corner face, leaving corner pillars
function isWin(x, z, e) {
  const ns = e.n || e.s, we = e.w || e.e;
  if (ns && !we) { const a = x - minX; return a % 2 === 1 && a < maxX - minX; }
  if (we && !ns) { const a = z - minZ; return a % 2 === 1 && a < maxZ - minZ; }
  return false;
}

// Pass 1: foundations, floor slabs, roof deck; Pass 2: walls and openings
for (const [x, z, gy] of cells) {
  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < gy; y++) put(x, y, z, "stone_bricks");
  // Storey floor slabs (full footprint) at gy, gy+5, roof deck at gy+10
  put(x, gy, z, "stone_bricks");
  put(x, gy + 5, z, "smooth_stone");
  put(x, gy + 10, z, "smooth_stone");
}

for (const [x, z, gy] of cells) {
  if (!perimeter(x, z)) continue;
  const e = ex(x, z);
  const corner = (e.n || e.s) && (e.w || e.e);
  const isDoor = `${x},${z}` === door;
  const win = !corner && !isDoor && isWin(x, z, e);

  // Inward direction for placing warm light behind the glass
  let ix = x, iz = z;
  if (e.n) iz = z + 1; else if (e.s) iz = z - 1;
  else if (e.w) ix = x + 1; else if (e.e) ix = x - 1;

  for (const r of [1, 2, 3, 4, 6, 7, 8, 9, 11]) {
    const y = gy + r;

    if (corner) { put(x, y, z, "quartz_pillar", { axis: "y" }); continue; }

    if (isDoor && (r === 1 || r === 2)) {
      const half = r === 1 ? "lower" : "upper";
      put(x, y, z, "dark_oak_door", {
        facing: "north", half, hinge: "left", open: "false", powered: "false",
      });
      continue;
    }
    if (isDoor && r === 3) {
      // Canopy-style lintel over the entrance
      put(x, y, z, "dark_oak_slab", { type: "top", waterlogged: "false" });
      continue;
    }

    if (r === 1) { put(x, y, z, "polished_andesite"); continue; }           // base course
    if (r === 11) { put(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" }); continue; } // cornice

    if (r === 2 || r === 3 || r === 7 || r === 8) {
      if (win) {
        put(x, y, z, "glass");
        // Warm light behind some upper-storey windows
        if ((r === 7 || r === 8) && (x + z) % 3 === 0 && r === 7 && has(ix, iz) && !perimeter(ix, iz)) {
          put(ix, gy + 7, iz, "glowstone");
        }
        if (r === 2 && (x + z) % 4 === 1 && has(ix, iz)) {
          put(ix, gy + 2, iz, "shroomlight");
        }
      } else {
        put(x, y, z, "smooth_quartz");
      }
      continue;
    }

    // Storey bands: sills and lintels, parapet walls
    put(x, y, z, "smooth_quartz");
  }
}

// Rooftop water tank on the interior cell nearest the centre
let tank = null, best = Infinity;
for (const [x, z, gy] of cells) {
  if (perimeter(x, z)) continue;
  const d = Math.hypot(x - cx, z - cz);
  if (d < best) { best = d; tank = [x, z, gy]; }
}
if (tank) {
  const [tx, tz, tgy] = tank;
  put(tx, tgy + 11, tz, "iron_block");
  put(tx, tgy + 12, tz, "iron_block");
}

g.save(`${DIR}/${ID}.nbt`);
