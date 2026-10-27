// Artisan, Auckland (OSM way 608167746): an 11-storey concrete-and-blue-glass mid-rise, c. 1980s-90s, on a two-storey
// shopfront podium. Its lidar roof (median-smoothed, 2 cells) steps down to flat tiers: lower wings at 10, the body
// at 36, the main roof at 44, and a core at 46 with plant boxes. Every column stands on the ground; each storey has
// a slab; walls are one block thick with an air gap behind the glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_608167746.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_608167746.nbt";
const W = 49, D = 87, H = 59;

// palette: white precast piers, a light-grey spandrel per storey, smooth-stone storey lines and cornice,
// blue-tinted glass in the windows, clear glass on the shopfronts
const PIER = "white_concrete", SPANDREL = "light_gray_concrete", LINE = "smooth_stone", GLASS = "light_blue_stained_glass";
const SHOP = "glass", ROOF = "gray_concrete", SLAB = "light_gray_concrete", BASE = "stone_bricks", PLANT = "light_gray_concrete";

const raw = JSON.parse(readFileSync(CELLS, "utf8"));
const fp = new Map();                                    // "x,z" -> { x, z, g (ground), r (lidar roof) }
for (const [x, z, g, r] of raw) fp.set(`${x},${z}`, { x, z, g, r });
const get = (x, z) => fp.get(`${x},${z}`) ?? null;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// the lidar roof, median over the footprint cells within 2 blocks, then three flat tiers and a core
for (const c of fp.values()) {
  const near = [];
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) { const n = get(c.x + dx, c.z + dz); if (n) near.push(n.r); }
  near.sort((a, b) => a - b); c.s = near[near.length >> 1];
}
const tierTop = (s) => (s < 15 ? 10 : s < 41 ? 36 : s < 45 ? 44 : 46);
for (const c of fp.values()) c.top = tierTop(c.s);

// exposed faces: out of the footprint, or against a lower tier (a setback's wall); corners and piers come from these
for (const c of fp.values()) {
  c.out = []; c.step = [];
  for (const [dx, dz] of DIRS) {
    const n = get(c.x + dx, c.z + dz);
    if (!n) c.out.push([dx, dz]); else if (n.top < c.top) c.step.push([dx, dz]);
  }
  c.wall = c.out.length + c.step.length > 0;
  c.corner = c.out.length + c.step.length >= 2;
}

const g = new Voxels([W, H, D]);
const put = (x, y, z, b, st) => g.set(x, y, z, b, st);

for (const c of fp.values()) {
  const { x, z, top } = c;
  for (let y = 0; y < c.g; y++) put(x, y, z, BASE);      // foundation up to the cell's ground
  for (let y = 0; y < top - 1; y += 4) put(x, y, z, SLAB); // a floor slab per storey, over every cell
  put(x, top - 1, z, c.wall ? LINE : ROOF);               // roof cap; the wall's cornice on the edge
  if (!c.wall) continue;
  const face = c.out[0] ?? c.step[0];
  const along = face[0] !== 0 ? z : x;                    // bay index along the face
  for (let y = 0; y < top - 1; y++) {
    const r = y % 4, k = (y - r) / 4;
    let b;
    if (r === 0) b = LINE;                                 // storey line
    else if (r === 3) b = SPANDREL;
    else if (c.corner || along % 3 === 0) b = PIER;        // 1-wide piers, 2-wide windows
    else b = k === 0 ? SHOP : GLASS;
    put(x, y, z, b);
  }
}

// the entrance: the middle of the west face at ground level; a shroomlight in the lobby behind it
const west = [...fp.values()].filter((c) => c.wall && c.out.some(([dx]) => dx === -1)).sort((a, b) => a.z - b.z);
const door = west[west.length >> 1];
const doorState = (half) => ({ facing: "west", half, hinge: "left", open: "false", powered: "false" });
put(door.x, 1, door.z, "dark_oak_door", doorState("lower"));
put(door.x, 2, door.z, "dark_oak_door", doorState("upper"));
const lobby = get(door.x + 1, door.z);
if (lobby && !lobby.wall) put(lobby.x, 1, lobby.z, "shroomlight");

// warm lights: glowstone on the floor just inside some upper windows (the air gap is the room behind the glass)
let lamps = 0;
for (const c of fp.values()) {
  if (!c.wall || c.out.length === 0) continue;
  const [dx, dz] = c.out[0];
  const along = dx !== 0 ? c.z : c.x;
  const inner = get(c.x - dx, c.z - dz);
  if (!inner || inner.wall) continue;
  for (let k = 1; 4 * k + 1 < c.top - 1; k++) {
    if ((along + 3 * k) % 9 !== 4 || inner.top <= 4 * k + 1) continue;
    put(inner.x, 4 * k + 1, inner.z, "glowstone"); lamps++;
  }
}

// roof plant: 2x2 boxes on the core roof, spaced out, standing on the roof cap
let plant = 0;
for (const c of fp.values()) {
  if (c.top !== 46 || c.wall) continue;
  if (c.x % 8 >= 3 && c.x % 8 <= 4 && c.z % 8 >= 3 && c.z % 8 <= 4 && (((c.x >> 3) + (c.z >> 3)) % 2 === 0)) {
    put(c.x, 46, c.z, PLANT); put(c.x, 47, c.z, PLANT); plant++;
  }
}

const info = g.save(OUT);
const tiers = {}; for (const c of fp.values()) tiers[c.top] = (tiers[c.top] ?? 0) + 1;
console.log(JSON.stringify({ cells: fp.size, tiers, lamps, plant, door: [door.x, door.z], ...info }));
