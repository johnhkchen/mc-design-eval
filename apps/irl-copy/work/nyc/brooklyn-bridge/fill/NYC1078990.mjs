import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const SRC = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC1078990.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC1078990.nbt";
const W = 11, H = 26, D = 10;

const cells = JSON.parse(readFileSync(SRC, "utf8"));
const g = new Voxels([W, H, D]);

const map = new Map();
let L = Infinity;
const roofs = [];
for (const [x, z, ground, roof] of cells) {
  const gr = Math.round(ground);
  map.set(`${x},${z}`, { ground: gr, roofRaw: Math.round(roof) });
  roofs.push(Math.round(roof));
  if (gr < L) L = gr;
}
if (!Number.isFinite(L)) L = 0;

// One flat roof level for the whole building (median of lidar), clamped to a
// sensible storey count above the lowest ground.
roofs.sort((a, b) => a - b);
const medRoof = roofs[Math.floor(roofs.length / 2)] ?? 14;
const ROOF = Math.min(H - 2, Math.max(L + 12, medRoof));

const has = (x, z) => map.has(`${x},${z}`);

function exposed(x, z) {
  const out = [];
  if (!has(x - 1, z)) out.push("west");
  if (!has(x + 1, z)) out.push("east");
  if (!has(x, z - 1)) out.push("north");
  if (!has(x, z + 1)) out.push("south");
  return out;
}
const isPerim = (x, z) => exposed(x, z).length > 0;

// Entrance on the low-z (Peck Slip) face, at the middle of that run
let doorCell = null;
{
  const northCells = [];
  for (const [key] of map) {
    const [x, z] = key.split(",").map(Number);
    if (!has(x, z - 1)) northCells.push([x, z]);
  }
  northCells.sort((a, b) => a[0] - b[0]);
  if (northCells.length) doorCell = northCells[Math.floor(northCells.length / 2)];
}

for (const [key, { ground: g0 }] of map) {
  const [x, z] = key.split(",").map(Number);
  const perim = isPerim(x, z);
  const faces = exposed(x, z);
  const facadeFace = faces[0] ?? null;
  const along = facadeFace === "north" || facadeFace === "south" ? x : z;
  const bayIsGlass = along % 2 === 1;
  const isDoor = doorCell && doorCell[0] === x && doorCell[1] === z;

  // Foundation up to this cell's ground
  for (let y = 0; y < g0; y++) g.set(x, y, z, "stone_bricks");

  const inward = [[1, 0], [-1, 0], [0, 1], [0, -1]]
    .map(([dx, dz]) => [x + dx, z + dz])
    .find(([nx, nz]) => has(nx, nz) && !isPerim(nx, nz));

  for (let y = g0; y < ROOF; y++) {
    const rel = y - L;
    const k = Math.floor(rel / 3);
    const sub = ((rel % 3) + 3) % 3;
    const isFloorLine = sub === 0;

    // Roof: flat parapet course on perimeter, slab cap over interior
    if (y === ROOF - 1) {
      g.set(x, y, z, perim ? "stone_bricks" : "smooth_stone");
      continue;
    }

    if (perim) {
      // Plinth course on the facade where the ground steps up
      if (y === g0 && g0 > L) {
        g.set(x, y, z, "stone_bricks");
        continue;
      }
      // Entrance: door on the lower two blocks above ground
      if (isDoor && (y === g0 || y === g0 + 1)) {
        g.set(x, y, z, "oak_door", {
          facing: "north",
          half: y === g0 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
        continue;
      }
      if (isFloorLine) {
        g.set(x, y, z, "smooth_stone");
        continue;
      }
      if (k === 0) {
        g.set(x, y, z, bayIsGlass ? "glass_pane" : "stone_bricks");
        continue;
      }
      if (bayIsGlass) {
        g.set(x, y, z, "glass_pane");
        // Sparse warm light behind some upper windows
        if (sub === 1 && inward && ((x * 3 + z) % 6 === 0)) {
          g.set(inward[0], y, inward[1], "glowstone");
        }
      } else {
        g.set(x, y, z, "bricks");
      }
      continue;
    }

    // Interior: air, with a floor slab per storey
    if (isFloorLine && y > L) {
      g.set(x, y, z, "spruce_planks");
    }
  }

  // Stoop and canopy at the entrance
  if (isDoor) {
    const sy = g0;
    // stone steps in front of the door (north, outside the footprint)
    g.set(x, sy, z, "stone_bricks");
    // canopy above the door at the second storey line, one row proud is not
    // possible inside the grid, so a dark slab band sits over the door opening
    const cy = g0 + 2;
    if (cy < ROOF - 1) g.set(x, cy, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(OUT);
