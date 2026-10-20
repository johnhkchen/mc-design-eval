import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw365103474";
const W = 32, H = 71, D = 32;

// Record: no building data. Read as a late-20th-century Xinyi mid-rise office tower:
// white-concrete frame, cyan-tinted glazing, light-grey spandrels, 3-storey retail podium,
// one setback to a 4-cell-deep core, parapet roof, and a short mast.
const ROOF = 59;     // roof height above lowest ground (lidar)
const STOREY = 5;    // blocks per storey
const PODIUM = 15;   // podium height above each cell's ground (3 storeys)

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const gmap = new Map();
for (const [x, z, gr] of cells) gmap.set(key(x, z), gr);
const has = (x, z) => gmap.has(key(x, z));
const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Distance from the outer edge of the footprint (edge cells = 1).
const dist = new Map();
const q = [];
for (const [x, z] of cells) {
  if (N4.some(([dx, dz]) => !has(x + dx, z + dz))) {
    dist.set(key(x, z), 1);
    q.push([x, z]);
  }
}
for (let i = 0; i < q.length; i++) {
  const [x, z] = q[i];
  const d = dist.get(key(x, z));
  for (const [dx, dz] of N4) {
    const nx = x + dx, nz = z + dz;
    if (has(nx, nz) && !dist.has(key(nx, nz))) {
      dist.set(key(nx, nz), d + 1);
      q.push([nx, nz]);
    }
  }
}

const maxZ = Math.max(...cells.map(([, z]) => z));

// Mast location: deepest core cell nearest the centre.
let mastCell = null;
{
  let best = -1, bestD = Infinity;
  for (const [x, z] of cells) {
    const d = dist.get(key(x, z));
    const c = Math.hypot(x - 15.5, z - 15.5);
    if (d > best || (d === best && c < bestD)) {
      best = d; bestD = c; mastCell = [x, z];
    }
  }
}

for (const [x, z, gr] of cells) {
  const d = dist.get(key(x, z));

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr && y < H; y++) g.set(x, y, z, "gray_concrete");

  const n = Math.floor((ROOF - gr) / STOREY);
  const roofSlab = gr + n * STOREY;
  const sb = gr + PODIUM;                      // setback level for this cell
  const wx = !has(x - 1, z) || !has(x + 1, z); // face normal along x -> wall runs along z
  const wz = !has(x, z - 1) || !has(x, z + 1);
  const idx = wx ? z : x;                      // position along the wall for mullion rhythm
  const colCell = x % 4 === 2 && z % 4 === 2 && d >= 2; // structural interior columns

  // Entrance on the south face (maxZ), centred, two cells wide.
  const isEntranceCell = z === maxZ && !wx && Math.abs(x - 15.5) <= 1.0 && d === 1;

  for (let y = gr; y <= ROOF && y < H; y++) {
    const rel = y - gr;
    const above = y > sb;
    if (above && d < 4) continue;              // outer ring stops at the podium roof
    const fd = above ? 4 : 1;                  // facade depth for this level
    const facade = d === fd;

    if (y > roofSlab) {                        // parapet band above top floor slab
      if (facade) g.set(x, y, z, "white_concrete");
      continue;
    }
    if (rel % 5 === 0) {                       // storey slab (solid across footprint)
      g.set(x, y, z, "white_concrete");
      continue;
    }
    if (colCell) {                             // keep interior structure continuous
      g.set(x, y, z, "white_concrete");
      continue;
    }
    if (!facade) continue;

    if (rel % 5 === 4) {                       // spandrel band
      g.set(x, y, z, "light_gray_concrete");
      continue;
    }

    // Ground-floor entrance: real doors under a lintel.
    if (!above && isEntranceCell && rel >= 1 && rel <= 3) {
      const cx = Math.abs(x - 15.5) <= 0.5 ? "right" : "left";
      if (rel === 3) {
        g.set(x, y, z, "light_gray_concrete");   // lintel
      } else if (rel === 1) {
        g.set(x, y, z, "dark_oak_door", {
          facing: "south", half: "lower", hinge: cx, open: "false", powered: "false",
        });
      } else {
        g.set(x, y, z, "dark_oak_door", {
          facing: "south", half: "upper", hinge: cx, open: "false", powered: "false",
        });
      }
      continue;
    }

    // Window band (rel % 5 in 1..3)
    if (idx % 4 === 0) {                       // vertical mullion / frame
      g.set(x, y, z, "white_concrete");
      continue;
    }
    g.set(x, y, z, "cyan_stained_glass_pane", {
      north: wx ? "true" : "false",
      south: wx ? "true" : "false",
      east: wz ? "true" : "false",
      west: wz ? "true" : "false",
      waterlogged: "false",
    });

    // Warm light just behind some panes (inside the air gap).
    if (rel % 5 === 2 && ((x * 3 + z * 5) % 7 === 0)) {
      for (const [dx, dz] of N4) {
        const nx = x + dx, nz = z + dz;
        const k = key(nx, nz);
        if (!has(nx, nz) || dist.get(k) !== fd + 1) continue;
        if (y < gmap.get(k)) continue;
        if (nx % 4 === 2 && nz % 4 === 2) continue;
        g.set(nx, y, nz, "glowstone");
        break;
      }
    }
  }
}

// Mast on the deepest core cell, standing on the top floor slab.
{
  const [mx, mz] = mastCell;
  const mgr = gmap.get(key(mx, mz));
  const n = Math.floor((ROOF - mgr) / STOREY);
  const roofSlab = mgr + n * STOREY;
  for (let y = roofSlab + 1; y <= ROOF + 8 && y < H - 1; y++) {
    g.set(mx, y, mz, "iron_bars");
  }
  const top = Math.min(ROOF + 10, H - 1);
  g.set(mx, top, mz, "lightning_rod", { facing: "up" });
}

g.save(`${DIR}/${ID}.nbt`);
