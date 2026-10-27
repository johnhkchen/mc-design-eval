// Way 260053677: a 1980s concrete-and-glass office block on a volcanic-basalt plinth, the CBD's commercial stock
// (Auckland's Queen Street era). Massing: a 24-block podium over the whole footprint, two towers to 28 with
// setback terraces, lower 20 and 12 wings. Hollow: an air gap behind each glass pane, a floor slab per storey,
// a roof over every column, a parapet on each tier's outer edge.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_260053677.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_260053677.nbt";
const W = 56, D = 57, H = 41;

const PLINTH = "polished_basalt", PIER = "white_concrete", BAND = "light_gray_concrete", GLASS = "light_blue_stained_glass";
const SHOP = "cyan_stained_glass", CORNICE = "white_concrete", ROOF = "stone", PARAPET = "light_gray_concrete";
const SLAB = "light_gray_concrete", CORE = "white_concrete", CAP = "smooth_stone", HVAC = "iron_block";

const I = (x, z) => z * W + x;
const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const ground = new Int16Array(W * D).fill(-1), roof = new Int16Array(W * D);
for (const [x, z, gy, ry] of cells) { ground[I(x, z)] = gy; roof[I(x, z)] = ry; }
const fp = (x, z) => x >= 0 && z >= 0 && x < W && z < D && ground[I(x, z)] >= 0;
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// lidar roof, box-averaged over a 5x5 window inside the footprint (its noise is per-cell), then snapped to a tier
const smooth = new Float32Array(W * D);
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!fp(x, z)) continue;
  let s = 0, n = 0;
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) if (fp(x + dx, z + dz)) { s += roof[I(x + dx, z + dz)]; n++; }
  smooth[I(x, z)] = s / n;
}
const top = (x, z) => { const v = smooth[I(x, z)]; return v >= 26 ? 28 : v >= 21.5 ? 24 : v >= 14 ? 20 : 12; };
const base = (x, z) => ground[I(x, z)];
const inside = (x, y, z) => fp(x, z) && y >= base(x, z) && y < top(x, z);
const exposedDirs = (x, y, z) => NB.filter(([dx, dz]) => !inside(x + dx, y, z + dz));
const hashOf = (x, y, z) => ((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0;

const g = new Voxels([W, H, D]);

// a warm light in the air gap just inside a glass or shop cell (only where the gap is fully enclosed)
function lampBehind(x, y, z, dx, dz, block) {
  const xi = x - dx, zi = z - dz;
  if (!inside(xi, y, zi) || !NB.every(([a, b]) => inside(xi + a, y, zi + b))) return;
  g.set(xi, y, zi, block);
}

function facade(x, y, z, dirs, gy, t) {
  const [dx, dz] = dirs.find(([, b]) => b !== 0) ?? dirs[0];   // corners: the north/south wall's bays
  const u = dz !== 0 ? x : z;
  const h = hashOf(x, y, z);
  if (y === gy) { g.set(x, y, z, PLINTH); return; }
  if (y === t - 1) { g.set(x, y, z, CORNICE); return; }
  if (y < gy + 4) {                                              // shopfront: basalt piers, glass, lit from within
    if (u % 4 === 0) { g.set(x, y, z, PLINTH); return; }
    g.set(x, y, z, SHOP);
    if (h % 3 === 0) lampBehind(x, y, z, dx, dz, "glowstone");
    return;
  }
  if (y % 4 === 0 || y % 4 === 3) { g.set(x, y, z, BAND); return; }   // floor line and spandrel
  if (u % 4 === 0) { g.set(x, y, z, PIER); return; }
  g.set(x, y, z, GLASS);
  if (h % 9 === 0) lampBehind(x, y, z, dx, dz, h % 2 ? "glowstone" : "shroomlight");
}

for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!fp(x, z)) continue;
  const gy = base(x, z), t = top(x, z);
  for (let y = 0; y < gy; y++) g.set(x, y, z, PLINTH);            // foundation: nothing floats on the slope
  for (let y = gy; y < t; y++) {
    const dirs = exposedDirs(x, y, z);
    if (dirs.length) facade(x, y, z, dirs, gy, t);
    else if (y === t - 1) g.set(x, y, z, ROOF);
    else if (y === gy || y % 4 === 0) g.set(x, y, z, SLAB);       // floor slabs; the rest is air
  }
  const edge = NB.some(([dx, dz]) => !fp(x + dx, z + dz) || top(x + dx, z + dz) < t);
  if (edge) g.set(x, t, z, PARAPET);
  else if ((x * 5 + z * 11) % 61 === 0 && t + 2 < H) g.set(x, t, z, HVAC);   // roof plant: a few low units, not a field of posts
}

// the entrance: a recessed door on the south face (the nearest bay to the middle), a transom and a canopy slab
const south = [];
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (fp(x, z) && exposedDirs(x, base(x, z) + 1, z).some(([a, b]) => a === 0 && b === 1)) south.push([x, z]);
}
const zMax = Math.max(...south.map(([, z]) => z));
const [dxDoor, dzDoor] = south.filter(([, z]) => z >= zMax - 2).sort((p, q) => Math.abs(p[0] - 28) - Math.abs(q[0] - 28))[0];
const gy = base(dxDoor, dzDoor);
g.set(dxDoor, gy, dzDoor, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(dxDoor, gy + 1, dzDoor, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
g.set(dxDoor, gy + 2, dzDoor, SHOP);
g.set(dxDoor, gy + 3, dzDoor, SHOP);
for (let xx = dxDoor - 1; xx <= dxDoor + 1; xx++) {
  if (inside(xx, gy + 4, dzDoor) && exposedDirs(xx, gy + 4, dzDoor).length) g.set(xx, gy + 4, dzDoor, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
}

// lift cores on each tower: a 3x3 box up 3 storeys, a stone cap and a lightning rod (cores sit on the roof they stand on)
const tallest = Math.max(...cells.map(([x, z]) => top(x, z)));
const seen = new Uint8Array(W * D);
for (const [x0, z0] of cells) {
  if (seen[I(x0, z0)] || top(x0, z0) !== tallest) continue;
  const comp = [], stack = [[x0, z0]]; seen[I(x0, z0)] = 1;
  while (stack.length) {
    const [x, z] = stack.pop(); comp.push([x, z]);
    for (const [dx, dz] of NB) {
      const nx = x + dx, nz = z + dz;
      if (fp(nx, nz) && !seen[I(nx, nz)] && top(nx, nz) === tallest) { seen[I(nx, nz)] = 1; stack.push([nx, nz]); }
    }
  }
  if (comp.length < 25) continue;
  const cx = Math.round(comp.reduce((s, [x]) => s + x, 0) / comp.length);
  const cz = Math.round(comp.reduce((s, [, z]) => s + z, 0) / comp.length);
  const ok = [-2, -1, 0, 1, 2].every((dz) => [-2, -1, 0, 1, 2].every((dx) => fp(cx + dx, cz + dz) && top(cx + dx, cz + dz) === tallest));
  if (!ok) continue;
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    for (let y = tallest; y < tallest + 3; y++) g.set(cx + dx, y, cz + dz, CORE);
    g.set(cx + dx, tallest + 3, cz + dz, CAP);
  }
  g.set(cx, tallest + 4, cz, "lightning_rod");
}

g.save(OUT);
console.log(`wrote ${OUT}: ${g.count()} blocks, ${g.palette.length - 1} block states, tiers ${[...new Set(cells.map(([x, z]) => top(x, z)))].sort((a, b) => a - b)}`);
