import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const cells = JSON.parse(readFileSync(`${DIR}/FR301499499.cells.json`, "utf8"));

const W = 8, H = 17, D = 13;
const g = new Voxels([W, H, D]);

// Footprint lookup; normalise heights so the lowest ground under the footprint is y 0.
const minG = Math.min(...cells.map((c) => c[2]));
const key = (x, z) => `${x},${z}`;
const cellMap = new Map();
for (const [x, z, gr, r] of cells) {
  cellMap.set(key(x, z), { gc: gr - minG, rc: r - minG });
}

// Smoothed building roof level (median of lidar roof heights).
const roofs = cells.map((c) => c[3] - minG).sort((a, b) => a - b);
const R = roofs[Math.floor(roofs.length / 2)];

const WALL = "stone";
const BASE = "stone_bricks";
const CORNICE = "stone_bricks";
const SLATE_STAIR = "deepslate_tile_stairs";
const SLATE = "deepslate_tiles";
const GLASS = "glass_pane";

// Per-cell massing.
const info = new Map();
for (const [k, c] of cellMap) {
  const [x, z] = k.split(",").map(Number);
  const top = Math.min(H - 4, Math.max(c.gc + 2, Math.round((c.rc + R) / 2) - 3));
  info.set(k, { x, z, gc: c.gc, top });
}

const faces = [
  { dx: -1, dz: 0, name: "W" },
  { dx: 1, dz: 0, name: "E" },
  { dx: 0, dz: -1, name: "N" },
  { dx: 0, dz: 1, name: "S" },
];

for (const [k, c] of info) {
  const { x, z, gc, top } = c;

  // Foundation up to ground.
  for (let y = 0; y < gc; y++) g.set(x, y, z, BASE);

  // Walls: base course, stone body, cornice band at the top.
  for (let y = gc; y <= top; y++) {
    let b = WALL;
    if (y === gc) b = BASE;
    else if (y === top) b = CORNICE;
    g.set(x, y, z, b);
  }

  // Roof: pitched slate planes sloping to a flat ridge, solid beneath.
  const kk = Math.min(x, 7 - x);
  const facing = x < 4 ? "west" : "east";
  if (kk <= 2) {
    for (let y = top + 1; y <= top + kk; y++) g.set(x, y, z, WALL);
    g.set(x, top + kk + 1, z, SLATE_STAIR, {
      facing, half: "bottom", shape: "straight", waterlogged: "false",
    });
  } else {
    for (let y = top + 1; y <= top + 3; y++) g.set(x, y, z, SLATE);
  }
}

// Windows, door and inner air gaps on exterior faces.
for (const [k, c] of info) {
  const { x, z, gc, top } = c;
  for (const f of faces) {
    if (cellMap.has(key(x + f.dx, z + f.dz))) continue; // not exterior
    const along = f.dx !== 0 ? z : x;
    const maxU = f.dx !== 0 ? 12 : 7;
    if (along === 0 || along === maxU) continue; // corner piers

    // Door on the north face (z = 0), set on the ground storey.
    if (f.name === "N" && z === 0 && x === 3) {
      g.set(x, gc + 1, z, "oak_door", {
        facing: "south", half: "lower", hinge: "left", open: "false", powered: "false",
      });
      g.set(x, gc + 2, z, "oak_door", {
        facing: "south", half: "upper", hinge: "left", open: "false", powered: "false",
      });
      continue;
    }

    if (along % 2 !== 1) continue;
    for (let y = gc + 1; y <= top - 1; y++) {
      const lit = ((along + y * 3) % 4) === 1;
      if (lit) {
        g.set(x, y, z, "glowstone");
      } else {
        const props = f.dx !== 0
          ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
          : { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };
        g.set(x, y, z, GLASS, props);
      }
      // Air gap behind the glass (one cell inward), keeps a slab per storey.
      const ix = x - f.dx, iz = z - f.dz;
      if (cellMap.has(key(ix, iz))) g.set(ix, y, iz, "air");
    }
  }
}

// Canopy over the door: slab band just above the lintel on the north wall.
{
  const c = info.get("3,0");
  if (c) {
    const y = c.top + 0;
    // Keep the door reading at dusk with a warm lantern beside it.
    if (c.gc + 3 < H) g.set(2, c.gc + 3, 0, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// Single chimney on the south-east slope, standing on its stair.
{
  const cx = 5, cz = 4;
  const c = info.get(key(cx, cz));
  if (c) {
    const base = c.top + 4; // stair sits at top + 3
    for (let y = base; y <= base + 1 && y < H; y++) g.set(cx, y, cz, CORNICE);
  }
}

g.save(`${DIR}/FR301499499.nbt`);
