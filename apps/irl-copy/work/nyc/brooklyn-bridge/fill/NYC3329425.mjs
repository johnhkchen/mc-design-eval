import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3329425";
const W = 27, H = 46, D = 43;
const SH = 3; // storey height in blocks

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const cellList = Array.isArray(raw) ? raw : raw.cells;

const key = (x, z) => `${x},${z}`;
const cellMap = new Map();
for (const [x, z, gr, rf] of cellList) {
  cellMap.set(key(x, z), { x, z, g: Math.round(gr), r: Number(rf) });
}
const has = (x, z) => cellMap.has(key(x, z));

const median = (arr) => {
  const s = [...arr].sort((a, b) => a - b);
  return s.length ? s[Math.floor(s.length / 2)] : 0;
};

// Global storey grid: aligned to the lowest ground under the footprint.
let G = Infinity;
for (const c of cellMap.values()) G = Math.min(G, c.g);

// Roof tiers: a base roof level from the whole footprint, then each cell's
// wider 5x5 lidar median is quantised to whole storeys above or below it.
const baseRoof = Math.round(median([...cellMap.values()].map(c => c.r)));
for (const c of cellMap.values()) {
  const vals = [];
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) {
    const n = cellMap.get(key(c.x + dx, c.z + dz));
    if (n && Number.isFinite(n.r)) vals.push(n.r);
  }
  const med = vals.length ? median(vals) : c.r;
  const tier = Math.round((med - baseRoof) / SH) * SH;
  c.T = Math.max(c.g + 6, Math.min(H - 3, baseRoof + tier));
}

const DIRS = [
  { dx: 0, dz: -1, name: "north" },
  { dx: 0, dz: 1, name: "south" },
  { dx: -1, dz: 0, name: "west" },
  { dx: 1, dz: 0, name: "east" },
];
const exposed = (x, z) => DIRS.filter(d => !has(x + d.dx, z + d.dz));
const isPerim = (x, z) => exposed(x, z).length > 0;

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || y < 0 || x >= W || z >= D || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Entrance: the middle north-facing perimeter cell.
let doorKey = null;
{
  const northCells = [...cellMap.values()]
    .filter(c => exposed(c.x, c.z).some(d => d.name === "north"))
    .sort((a, b) => a.x - b.x);
  if (northCells.length) {
    const m = northCells[Math.floor(northCells.length / 2)];
    doorKey = key(m.x, m.z);
  }
}

for (const c of cellMap.values()) {
  const { x, z, g: gr, T } = c;
  const ex = exposed(x, z);
  const per = ex.length > 0;

  // Foundation from y 0 up to the cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Along-face column index: N/S faces run along x, E/W faces run along z.
  const col = ex.some(d => d.dz !== 0) ? x : z;

  // First slab above this cell's ground (top of the ground floor).
  const L1 = G + SH * Math.ceil((gr - G + 1) / SH);
  const isSlab = (y) => y > gr && (y - G) % SH === 0 && y < T - 2;

  for (let y = gr; y <= T - 1; y++) {
    if (y === T - 1) {
      put(x, y, z, per ? "bricks" : "smooth_stone"); // roof deck / parapet
      continue;
    }
    if (y === T - 2) {
      if (per) put(x, y, z, "stone_bricks"); // cornice
      continue;
    }
    if (y === gr) {
      put(x, y, z, per ? "stone_bricks" : "smooth_stone"); // base course / floor
      continue;
    }
    if (isSlab(y)) {
      put(x, y, z, per ? "stone_bricks" : "smooth_stone"); // floor slab / string course
      continue;
    }
    if (!per) continue; // interior air gap

    // Facade of a perimeter cell.
    if (y < L1) {
      // Entrance first, so the door is not overwritten by the lintel.
      if (doorKey === key(x, z) && L1 - gr >= 3 && (y === gr + 1 || y === gr + 2)) {
        put(x, y, z, "oak_door", {
          facing: "north",
          half: y === gr + 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
        continue;
      }
      if (y === L1 - 1) {
        put(x, y, z, "stone_bricks"); // lintel
        continue;
      }
      if (col % 4 === 0) {
        put(x, y, z, "stone_bricks"); // pier
      } else {
        put(x, y, z, "glass");
        if ((x * 5 + z * 3 + y) % 7 === 0) {
          for (const d of ex) {
            const ix = x - d.dx, iz = z - d.dz;
            if (has(ix, iz) && !isPerim(ix, iz)) put(ix, y, iz, "glowstone");
          }
        }
      }
    } else {
      // Upper storeys: two-block window bands between floor slabs.
      const row = (y - G) % SH;
      if (row === 1 || row === 2) {
        if (col % 3 === 1) {
          put(x, y, z, "glass");
          if ((x * 5 + z * 3 + y) % 7 === 0) {
            for (const d of ex) {
              const ix = x - d.dx, iz = z - d.dz;
              if (has(ix, iz) && !isPerim(ix, iz)) put(ix, y, iz, "glowstone");
            }
          }
        } else {
          put(x, y, z, "bricks"); // pier
        }
      } else {
        put(x, y, z, "bricks");
      }
    }
  }
}

// Roof equipment: a solid stair bulkhead standing on the roof deck,
// only where the whole 5x5 footprint is present and the roof is low enough.
{
  const bx = 10, bz = 18, s = 5;
  let ok = true, topY = 0;
  for (let x = bx; x < bx + s && ok; x++) for (let z = bz; z < bz + s; z++) {
    const c = cellMap.get(key(x, z));
    if (!c || c.T > 40) { ok = false; break; }
    topY = Math.max(topY, c.T);
  }
  if (ok) {
    for (let x = bx; x < bx + s; x++) for (let z = bz; z < bz + s; z++) {
      const c = cellMap.get(key(x, z));
      const base = c.T;
      const edge = x === bx || x === bx + s - 1 || z === bz || z === bz + s - 1;
      for (let y = base; y <= base + 2; y++) {
        if (edge) put(x, y, z, "bricks");
      }
      put(x, base + 3, z, "smooth_stone"); // bulkhead roof
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
