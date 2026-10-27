// Way 332241824, Mt Eden / Eden Terrace: a 1930s brick-and-stone commercial block. A shopfront ground floor (door on the
// west face), four upper storeys of 4 blocks to a stone parapet at y 22, and a setback tower core (lidar 25+) over the
// south-west corner at y 27, with a lift overrun and roof plant. Storey lines sit on the absolute grid so every floor
// stands on the one below; the foundation fills from y 0 up to each cell's ground.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const OUT = `${DIR}/way_332241824.nbt`;
const cells = JSON.parse(readFileSync(`${DIR}/way_332241824.cells.json`, "utf8"));

const MAIN = 22, TOWER = 27;                       // main roof and tower roof (lidar medians, noise smoothed)
const FLOORS = [6, 10, 14, 18, 22];                // storey lines: a 6-block ground storey, then 4-block storeys
const DIRS = [[-1, 0, "west"], [1, 0, "east"], [0, -1, "north"], [0, 1, "south"]];
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];

const key = (x, z) => `${x},${z}`;
const byKey = new Map(cells.map(([x, z, g, r]) => [key(x, z), { g, raw: r }]));
const inF = (x, z) => byKey.has(key(x, z));
const tall = (x, z) => inF(x, z) && byKey.get(key(x, z)).raw >= 25;   // 24 and under reads as the main roof (lidar noise)
const core = (x, z) => tall(x, z) && NB.every(([dx, dz]) => tall(x + dx, z + dz));  // the tower proper, set back from its edge
const topOf = (x, z) => (!inF(x, z) ? 0 : core(x, z) ? TOWER : MAIN);
const isRing = (x, z) => inF(x, z) && DIRS.some(([dx, dz]) => !inF(x + dx, z + dz));
const band = (y) => FLOORS.filter((f) => f <= y).pop();

// the block for an exposed wall cell: quoins at corners, a shopfront below y 6, storeys above with bands and piers
function facade(x, y, z, G, exp) {
  if (exp.length > 1) return { b: "smooth_stone" };
  const [dx, dz] = exp[0];
  const u = dx !== 0 ? z : x;                       // position along the face
  const pier = u % 4 === 0;
  const runZ = dx !== 0;                            // an x-facing wall runs along z: its panes join north and south
  const pane = { north: runZ, south: runZ, east: !runZ, west: !runZ, waterlogged: false };
  if (y < 6) {
    if (y === G) return { b: "polished_andesite" };
    if (y === 5) return { b: "smooth_stone" };      // shopfront fascia
    return pier ? { b: "bricks" } : { b: "glass_pane", st: pane, glass: true };
  }
  const rel = y - band(y);
  if (rel === 0 || rel === 3) return { b: "smooth_stone" };   // sill course and head course
  return pier ? { b: "bricks" } : { b: "glass_pane", st: pane, glass: true };
}

const g = new Voxels([26, 40, 29]);
const windows = [];
for (let x = 0; x < 26; x++) for (let z = 0; z < 29; z++) {
  if (!inF(x, z)) continue;
  const G = byKey.get(key(x, z)).g, T = topOf(x, z);
  for (let y = 0; y < G; y++) g.set(x, y, z, "stone_bricks");                    // foundation
  for (let y = G; y < T; y++) {
    const exp = DIRS.filter(([dx, dz]) => topOf(x + dx, z + dz) <= y);            // faces onto air
    if (y === T - 1) {                                                             // roof: parapet on the edge, membrane inside
      if (exp.length) g.set(x, y, z, "smooth_stone_slab", { type: "top", waterlogged: "false" });
      else g.set(x, y, z, "gray_concrete");
      continue;
    }
    if (exp.length) {
      const f = facade(x, y, z, G, exp);
      g.set(x, y, z, f.b, f.st);
      if (f.glass) windows.push({ x, y, z, G, dx: exp[0][0], dz: exp[0][1], u: exp[0][0] !== 0 ? z : x });
      continue;
    }
    if (y === G || FLOORS.includes(y)) g.set(x, y, z, "smooth_stone");           // floor slab; the interior stays air
  }
}

// warm light: glowstone one block inside some windows, in the air gap behind the glass
for (const w of windows) {
  if ((w.x * 3 + w.y * 5 + w.z) % 9 !== 0 || w.y < w.G + 1) continue;
  const ix = w.x - w.dx, iz = w.z - w.dz;
  if (inF(ix, iz) && g.get(ix, w.y, iz) === null) g.set(ix, w.y, iz, "glowstone");
}

// the shopfront door: the lowest west-face window cell on a 4-block bay, with a lintel over it
const door = windows.filter((w) => w.dx === -1 && w.G <= 1 && w.u % 4 === 2 && w.y === w.G + 1)
  .sort((a, b) => a.G - b.G || Math.abs(a.u - 12) - Math.abs(b.u - 12))[0];
if (door) {
  const face = DIRS.find(([dx, dz]) => dx === door.dx && dz === door.dz)[2];
  const st = (half) => ({ facing: face, half, hinge: "left", open: "false", powered: "false" });
  g.set(door.x, door.y, door.z, "dark_oak_door", st("lower"));
  g.set(door.x, door.y + 1, door.z, "dark_oak_door", st("upper"));
  g.set(door.x, door.y + 2, door.z, "smooth_stone");
}

// roof plant on the main roof, and a lift overrun on the tower core
function roofBox(x0, z0, w, d, h, block, top, need) {
  for (let x = x0; x < x0 + w; x++) for (let z = z0; z < z0 + d; z++)
    if (!inF(x, z) || topOf(x, z) !== top || !need(x, z)) return false;
  for (let x = x0; x < x0 + w; x++) for (let z = z0; z < z0 + d; z++)
    for (let y = top; y < top + h; y++) g.set(x, y, z, block);
  return true;
}
const plain = (x, z) => !isRing(x, z) && !core(x, z);
roofBox(12, 8, 2, 2, 2, "light_gray_concrete", MAIN, plain);
roofBox(17, 20, 2, 2, 2, "light_gray_concrete", MAIN, plain);
let cx = 0, cz = 0, nc = 0;
for (let x = 0; x < 26; x++) for (let z = 0; z < 29; z++) if (core(x, z)) { cx += x; cz += z; nc++; }
cx /= nc; cz /= nc;
const spots = [];
for (let x = 0; x < 25; x++) for (let z = 0; z < 28; z++)
  if ([[0, 0], [1, 0], [0, 1], [1, 1]].every(([a, b]) => core(x + a, z + b))) spots.push([Math.hypot(x + 0.5 - cx, z + 0.5 - cz), x, z]);
spots.sort((a, b) => a[0] - b[0]);
if (spots.length) roofBox(spots[0][1], spots[0][2], 2, 2, 3, "bricks", TOWER, () => true);

const res = g.save(OUT);
console.log(JSON.stringify({ file: OUT, ...res, windows: windows.length, door: door ? [door.x, door.y, door.z] : null, core: nc }));
