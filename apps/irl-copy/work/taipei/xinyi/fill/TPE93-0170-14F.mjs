import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE93-0170-14F";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Box: 82 x 81 x 112 (x, y, z)
const W = 82, H = 81, D = 112;
const g = new Voxels([W, H, D]);

// Building parameters: 2004 hospital tower, ~14 storeys of ~5 blocks, roof ~69 above lowest ground
const ROOF = 69;      // main roof level (absolute y)
const PODIUM = 60;    // podium roof level for the outer ring (stepped top)
const STOREY = 5;
const PENT_INSET = 12;

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const has = (x, z) => ground.has(key(x, z));
const gOf = (x, z) => ground.get(key(x, z));
const base = Math.min(...ground.values());

// Inset distance from the footprint edge (BFS)
const inset = new Map();
const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const queue = [];
for (const [x, z] of cells) {
  if (dirs.some(([dx, dz]) => !has(x + dx, z + dz))) {
    inset.set(key(x, z), 0);
    queue.push([x, z]);
  }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  const d = inset.get(key(x, z));
  for (const [dx, dz] of dirs) {
    const nx = x + dx, nz = z + dz;
    if (has(nx, nz) && !inset.has(key(nx, nz))) {
      inset.set(key(nx, nz), d + 1);
      queue.push([nx, nz]);
    }
  }
}
const insetOf = (x, z) => inset.get(key(x, z)) ?? 0;

// Roof level per cell: podium ring stops at PODIUM, tower core rises to ROOF
const topOf = (x, z) => {
  const t = insetOf(x, z) >= 6 ? ROOF : PODIUM;
  return Math.max(t, gOf(x, z) + 6);
};

// Neighbour is present at height y if in footprint and below its top
const present = (x, z, y) => has(x, z) && y < topOf(x, z);
const exterior = (x, z, y) => dirs.some(([dx, dz]) => !present(x + dx, z + dz, y));

// Corner detection: exposed on both axes
const isCorner = (x, z) =>
  (!has(x + 1, z) || !has(x - 1, z)) && (!has(x, z + 1) || !has(x, z - 1));

// Front (entrance) face: minimum-z edge
let frontZ = Infinity;
for (const [x, z] of cells) if (!has(x, z - 1) && z < frontZ) frontZ = z;
const frontXs = cells.filter(([x, z]) => z === frontZ && !has(x, z - 1)).map(([x]) => x);
const frontCx = frontXs.reduce((a, b) => a + b, 0) / Math.max(1, frontXs.length);
const isEntrance = (x, z) => z === frontZ && !has(x, z - 1) && Math.abs(x - frontCx) <= 4;

// Facade block for an exterior cell at height y
function facade(x, z, y, b, rel) {
  if (b === 0) {
    // Ground floor: recessed entrance lobby, shopfront glazing, plinth, lintel
    if (isEntrance(x, z)) {
      if (rel === 0) return ["smooth_stone"];
      if (rel === 4) return ["green_concrete"];
      return ["air"];
    }
    if (rel === 0) return ["stone_bricks"];
    if (rel === 4) return ["light_gray_concrete"];
    if (isCorner(x, z) || (x + z) % 4 === 0) return ["white_concrete"];
    return ["light_blue_stained_glass"];
  }
  // Corner columns run full height for a crisp massing
  if (isCorner(x, z)) return ["white_concrete"];
  // Storey articulation: spandrel, window band with mullions, cornice line
  if (rel === 0) return ["light_gray_concrete"];
  if (rel === 4) return ["white_concrete"];
  // Vertical fins every 4 cells, and alternating spandrel shadow every 8
  if ((x + z) % 4 === 0) return ["white_concrete"];
  return ["light_blue_stained_glass"];
}

for (const [x, z, gr] of cells) {
  const T = topOf(x, z);

  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  // Storeys
  for (let y = gr; y < T - 1; y++) {
    const rel = (((y - base) % STOREY) + STOREY) % STOREY;
    const b = Math.floor((y - base) / STOREY);
    if (exterior(x, z, y)) {
      const [id] = facade(x, z, y, b, rel);
      g.set(x, y, z, id);
      // Warm light just inside the glass, now and then
      if (id === "light_blue_stained_glass" && rel === 2 && b > 0 && (x + z + b) % 3 === 0) {
        for (const [dx, dz] of dirs) {
          const nx = x + dx, nz = z + dz;
          if (has(nx, nz) && insetOf(nx, nz) > insetOf(x, z) && y < topOf(nx, nz) - 1) {
            g.set(nx, y, nz, "shroomlight");
            break;
          }
        }
      }
    } else if (rel === 0) {
      // Interior floor slab per storey, air elsewhere
      g.set(x, y, z, "light_gray_concrete");
    }
  }

  // Roof slab on top of every cell
  g.set(x, T - 1, z, "light_gray_concrete");

  // Parapet on exterior edges
  if (exterior(x, z, T) && T < H - 2) {
    g.set(x, T, z, "white_concrete");
    g.set(x, T + 1, z, "smooth_stone");
  }
}

// Entrance canopy: a deep green canopy carried one cell into the lobby, with lanterns beneath
const ENTRY_Y = base + 4;
for (const [x, z] of cells) {
  if (!isEntrance(x, z)) continue;
  const inZ = z + 1;
  if (has(inZ, 0) !== undefined && has(x, inZ)) {
    g.set(x, ENTRY_Y, inZ, "green_concrete");
    g.set(x, ENTRY_Y - 1, inZ, "smooth_stone");
    g.set(x, base + 3, inZ, "lantern", { hanging: "false" });
  }
  g.set(x, ENTRY_Y + 1, z, "green_concrete");
}

// Rooftop mechanical penthouse, set back from the tower edge
for (const [x, z] of cells) {
  const ins = insetOf(x, z);
  if (ins < PENT_INSET || topOf(x, z) !== ROOF) continue;
  const ring = dirs.some(([dx, dz]) => insetOf(x + dx, z + dz) < PENT_INSET);
  for (let y = ROOF; y <= ROOF + 3; y++) {
    if (ring && y > ROOF && (x + z) % 3 !== 0) g.set(x, y, z, "light_blue_stained_glass");
    else g.set(x, y, z, "white_concrete");
  }
  g.set(x, ROOF + 4, z, "smooth_stone");
}

g.save(`${DIR}/${ID}.nbt`);
