import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const raw = JSON.parse(readFileSync(`${DIR}/NYC3000030.cells.json`, "utf8"));
const list = Array.isArray(raw) ? raw : (raw.cells ?? []);

const W = 20, H = 26, D = 15;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const cellMap = new Map();
for (const c of list) {
  const [x, z, gr, roof] = c;
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  cellMap.set(key(x, z), { gr: Math.max(0, Math.round(gr)), top: Math.round(roof / 2) * 2 });
}

// Smooth roof heights into flat tiers: pull each cell toward the median of
// itself and its neighbours, and remove single-cell spikes.
const neighbours = (x, z) => [[1, 0], [-1, 0], [0, 1], [0, -1]]
  .map(([dx, dz]) => cellMap.get(key(x + dx, z + dz)))
  .filter(Boolean);
for (let pass = 0; pass < 3; pass++) {
  const next = new Map();
  for (const [k, c] of cellMap) {
    const [x, z] = k.split(",").map(Number);
    const vals = [c.top, ...neighbours(x, z).map(n => n.top)].sort((a, b) => a - b);
    const med = vals[Math.floor(vals.length / 2)];
    let top = c.top;
    if (top > med + 2) top = med + 2;       // trim spikes
    if (top < med - 2) top = med - 2;       // fill pits
    next.set(k, { gr: c.gr, top });
  }
  for (const [k, v] of next) cellMap.set(k, v);
}
// Clamp to a sane range above each cell's ground.
for (const [k, c] of cellMap) {
  c.top = Math.max(c.gr + 6, Math.min(c.top, 22));
}

const exposed = (x, z, dx, dz) => !cellMap.has(key(x + dx, z + dz));

const BRICK = "bricks";
const BASE = "stone_bricks";
const FLOOR = "smooth_stone";
const TRIM = "dark_oak_planks";
const GLASS = "glass";
const LIGHT = "glowstone";
const CAP = "stone_brick_slab";
const slab = { type: "bottom", waterlogged: "false" };
const canopySlab = { type: "bottom", waterlogged: "false" };

// Entrance: outward face near the middle.
let doorCell = null;
for (const [k] of cellMap) {
  const [x, z] = k.split(",").map(Number);
  if (x === 6 && exposed(x, z, 0, 1)) { doorCell = { x, z, facing: "south" }; break; }
}
if (!doorCell) {
  for (const [k] of cellMap) {
    const [x, z] = k.split(",").map(Number);
    if (x === 6 && exposed(x, z, 0, -1)) { doorCell = { x, z, facing: "north" }; break; }
  }
}
const doorFaceAxis = doorCell ? (doorCell.facing === "south" || doorCell.facing === "north") : false;

for (const [k, { gr, top: T }] of cellMap) {
  const [x, z] = k.split(",").map(Number);
  const eN = exposed(x, z, 0, -1);
  const eS = exposed(x, z, 0, 1);
  const eW = exposed(x, z, -1, 0);
  const eE = exposed(x, z, 1, 0);
  const perim = eN || eS || eW || eE;

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, BASE);

  // Upper storeys: 2-block storeys above a 3-block ground storey.
  const bases = [];
  for (let s = gr + 3; s + 1 <= T - 2; s += 2) bases.push(s);

  if (!perim) {
    // Interior: air with floor slabs per storey and a roof slab.
    g.set(x, gr, z, FLOOR);
    for (const s of bases) g.set(x, s, z, FLOOR);
    g.set(x, T - 1, z, FLOOR);
    continue;
  }

  // Exterior shell.
  g.set(x, gr, z, BASE);

  // Shopfront rows gr+1..gr+2.
  const isDoor = doorCell && doorCell.x === x && doorCell.z === z;
  for (let y = gr + 1; y <= gr + 2; y++) {
    if (isDoor) {
      const half = y === gr + 1 ? "lower" : "upper";
      g.set(x, y, z, "oak_door", {
        facing: doorCell.facing, half, hinge: "left",
        open: "false", powered: "false",
      });
    } else if (((eN || eS) && x % 2 === 1) || ((eE || eW) && z % 2 === 1)) {
      g.set(x, y, z, GLASS);
    } else {
      g.set(x, y, z, TRIM);
    }
  }

  // Brick spandrels above the shopfront and between storeys.
  for (let y = gr + 3; y <= T - 2; y++) g.set(x, y, z, BRICK);

  // String course over the shopfront (stone band), with a dark canopy
  // over the entrance cell and its two neighbours on the same face.
  g.set(x, gr + 3, z, CAP, slab);
  if (doorCell && Math.abs(doorCell.x - x) <= 1 && doorCell.z === z && doorFaceAxis) {
    g.set(x, gr + 3, z, "dark_oak_slab", canopySlab);
  }

  // Windows on storey rows.
  bases.forEach((s, i) => {
    const winRow = s + 1;
    const isWindow = ((eN || eS) && x % 2 === 1) || ((eE || eW) && z % 2 === 1);
    if (isWindow) {
      const warm = (x * 7 + z * 3 + i * 5) % 6 === 0;
      g.set(x, winRow, z, warm ? LIGHT : GLASS);
      g.set(x, s, z, CAP, slab); // sill
    }
  });

  // Cornice band at the top; no loose cap blocks above the roof line.
  g.set(x, T - 1, z, BASE);
}

g.save(`${DIR}/NYC3000030.nbt`);
