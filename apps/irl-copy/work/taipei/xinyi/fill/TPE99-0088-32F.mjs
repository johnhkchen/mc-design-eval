import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE99-0088-32F";
const W = 67, H = 303, D = 52;
const ROOF = 291;      // roof height above lowest ground (lidar)
const FLOORS = 32;     // 2010 office tower, 32 storeys

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gy] of cells) ground.set(key(x, z), gy);
const cellList = cells.map(([x, z]) => [x, z]);
const inside = (x, z) => ground.has(key(x, z));

// 4-neighbourhood: [dx, dz, compass name]
const NB = [[1, 0, "east"], [-1, 0, "west"], [0, 1, "south"], [0, -1, "north"]];

// Distance (in blocks) from the footprint edge: 1 = perimeter cell.
const dist = new Map();
let frontier = [];
for (const [x, z] of cellList) {
  if (NB.some(([dx, dz]) => !inside(x + dx, z + dz))) {
    dist.set(key(x, z), 1);
    frontier.push([x, z]);
  }
}
while (frontier.length) {
  const next = [];
  for (const [x, z] of frontier) {
    const d = dist.get(key(x, z));
    for (const [dx, dz] of NB) {
      const nx = x + dx, nz = z + dz;
      if (inside(nx, nz) && !dist.has(key(nx, nz))) {
        dist.set(key(nx, nz), d + 1);
        next.push([nx, nz]);
      }
    }
  }
  frontier = next;
}
const D_OF = (x, z) => dist.get(key(x, z)) ?? 0;

// Setback schedule: podium 0-5, tower to 21, upper tower to 27, crown 28-31.
const insetOf = (s) => (s < 6 ? 0 : s < 22 ? 3 : s < 28 ? 6 : 9);

const g = new Voxels([W, H, D]);

// Common floor datum: highest ground under the footprint.
const B = Math.max(...ground.values());
const P = Math.max(7, Math.min(9, Math.floor((ROOF - 3 - B) / FLOORS)));  // storey pitch in blocks
const yS = (s) => B + s * P;
const T = yS(FLOORS); // top of the last storey (roof slab)

// Foundation: solid from y 0 to each cell's ground, then plinth up to the datum.
for (const [x, z, gy] of cells) {
  for (let y = 0; y < gy; y++) g.set(x, y, z, "stone");
  for (let y = gy; y < B; y++) g.set(x, y, z, "polished_diorite");
}

// Outward normal of a facade cell: a neighbour outside the current tier.
function outwardOf(x, z, ins) {
  for (const [dx, dz, name] of NB) {
    if (D_OF(x + dx, z + dz) <= ins) return [dx, dz, name];
  }
  return null;
}

// Inward neighbour (one step deeper into the tier).
function inwardOf(x, z, ins) {
  for (const [dx, dz] of NB) {
    if (inside(x + dx, z + dz) && D_OF(x + dx, z + dz) > ins + 1) return [x + dx, z + dz];
  }
  return null;
}

// Entrance cell: perimeter cell nearest the footprint centre, on the ground storey.
const cxAll = cellList.reduce((a, [x]) => a + x, 0) / cellList.length;
const czAll = cellList.reduce((a, [, z]) => a + z, 0) / cellList.length;
let doorCell = null;
{
  let best = Infinity;
  for (const [x, z] of cellList) {
    if (D_OF(x, z) !== 1) continue;
    const d = Math.abs(x - cxAll) + Math.abs(z - czAll);
    if (d < best) { best = d; doorCell = [x, z]; }
  }
}

let lastTier = [];
for (let s = 0; s < FLOORS; s++) {
  const ins = insetOf(s);
  const base = yS(s);
  const tier = cellList.filter(([x, z]) => D_OF(x, z) > ins);
  if (!tier.length) break;

  // Roof of the lower tier where it is exposed by the setback.
  if (s > 0 && ins > insetOf(s - 1)) {
    const prevIns = insetOf(s - 1);
    for (const [x, z] of cellList) {
      const d = D_OF(x, z);
      if (d > prevIns && d <= ins) g.set(x, base, z, "light_gray_concrete");
    }
  }

  const podium = s < 6;
  const spandrelBlock = podium ? "polished_diorite" : "white_concrete";
  const frameBlock = podium ? "polished_diorite" : "light_gray_concrete";

  for (const [x, z] of tier) {
    // Floor slab for the storey.
    g.set(x, base, z, "light_gray_concrete");
    if (D_OF(x, z) !== ins + 1) continue; // interior: air behind the glass

    // Facade: spandrel band, then glass grid with mullions.
    g.set(x, base + 1, z, spandrelBlock);
    const mull = (x + z) % 3 === 0;
    for (let y = base + 2; y <= base + P - 1; y++) {
      if (s === 0 && y === base + P - 1) {
        g.set(x, y, z, "polished_diorite"); // shopfront lintel
        continue;
      }
      g.set(x, y, z, mull ? frameBlock : "cyan_stained_glass");
    }

    // Warm lit window: glowstone just inside the glass, sitting on the slab.
    if (!mull && (x * 7 + z * 5 + s * 3) % 17 === 0) {
      const inw = inwardOf(x, z, ins);
      if (inw) g.set(inw[0], base + 1, inw[1], "glowstone");
    }
  }

  if (s === 0 && doorCell) {
    const [dx, dz] = doorCell;
    const out = outwardOf(dx, dz, 0);
    if (out) {
      const facing = out[2];
      g.set(dx, base + 1, dz, "dark_oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
      g.set(dx, base + 2, dz, "dark_oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
      // Entrance canopy: a stone hood across the facade above the door.
      const lat = out[0] !== 0 ? [0, 1] : [1, 0];
      for (const k of [-2, -1, 0, 1, 2]) {
        const hx = dx + lat[0] * k, hz = dz + lat[1] * k;
        if (inside(hx, hz) && D_OF(hx, hz) === 1) {
          g.set(hx, base + 3, hz, "polished_diorite_slab", { type: "bottom", waterlogged: "false" });
        }
      }
    }
  }

  lastTier = tier;
}

// Crown: roof slab, parapet on the top tier, and a short lit mast at the centre.
const lastIns = insetOf(FLOORS - 1);
const lastCells = cellList.filter(([x, z]) => D_OF(x, z) > lastIns);
for (const [x, z] of lastCells) {
  g.set(x, T, z, "white_concrete");
  if (D_OF(x, z) === lastIns + 1) g.set(x, T + 1, z, "white_concrete");
}
{
  let mx = null, best = Infinity;
  const cx = lastCells.reduce((a, [x]) => a + x, 0) / lastCells.length;
  const cz = lastCells.reduce((a, [, z]) => a + z, 0) / lastCells.length;
  for (const [x, z] of lastCells) {
    const d = Math.abs(x - cx) + Math.abs(z - cz);
    if (d < best) { best = d; mx = [x, z]; }
  }
  if (mx) {
    for (let y = T + 2; y <= T + 4; y++) g.set(mx[0], y, mx[1], "light_gray_concrete");
    g.set(mx[0], T + 5, mx[1], "glowstone");
  }
}

g.save(`${DIR}/${ID}.nbt`);
