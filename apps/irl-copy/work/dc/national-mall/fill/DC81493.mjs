// DC81493: Commercial-Office-Large at 15 Independence Ave SE, Washington DC 20515, as a 1.21.1 module.
// The address matches the Longworth House Office Building (1933): a Neoclassical limestone office block with a
// granite base, belt courses, a flat roof behind a coping, and a stepped massing. Read from the record: the lidar
// roof (2-16 blocks) is smoothed (3x3 median over the footprint) and snapped to three roof tiers, 9 (courtyard
// and light-court roofs), 13 (outer ring, a setback terrace) and 16 (the core). Storeys are 4 blocks: a floor slab
// on y = 3, 7, 11, then three rows of wall (two of glass, one spandrel), a cornice row and a coping on the roof.
// Every column is solid from y 0 to y 2 (the granite podium over the lidar ground), so nothing floats. Each storey
// rests on the slab below it, and each roof rests on the storey below.
// Only the facade shell is built (a one-cell wall on every footprint cell with a neighbour outside the footprint),
// with air behind the glass and a slab per storey: no rooms.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC81493.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC81493.nbt";

const key = (x, z) => `${x},${z}`;
const F = new Map(cells.map(([x, z, g, r]) => [key(x, z), { x, z, g, r }]));
const inF = (x, z) => F.has(key(x, z));
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const NAME = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };

// Smoothed roof (3x3 median over footprint cells), then the three tiers.
for (const c of F.values()) {
  const vals = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const n = F.get(key(c.x + dx, c.z + dz)); if (n) vals.push(n.r);
  }
  vals.sort((a, b) => a - b);
  c.s = vals[vals.length >> 1];
  c.T = c.s <= 10 ? 9 : c.s <= 14 ? 13 : 16;
  c.out = DIRS.filter(([dx, dz]) => !inF(c.x + dx, c.z + dz));   // outward faces
  c.facade = c.out.length > 0;
}

const Y = 28;
const g = new Voxels([34, Y, 58]);
const put = (x, y, z, block, state) => { if (inF(x, z)) g.set(x, y, z, block, state); };

const PODIUM = "polished_granite", STONE = "stone_bricks", WALL = "calcite", BELT = "smooth_stone";
const GLASS = "light_blue_stained_glass", ROOF = "stone", COPING = "smooth_stone", CORNICE = "stone_brick_slab";
const SLABS = [3, 7, 11, 15];

// Storey slabs under a tier: the floor slabs that leave at least three wall rows below the roof.
const slabsFor = (T) => SLABS.filter((F) => F <= T - 5);

// Facade bay: pilasters every third cell along the wall (corners always), two-cell windows between.
const isPilaster = (c) => {
  if (c.out.length > 1) return true;
  const [dx] = c.out[0];
  const b = dx !== 0 ? c.z : c.x;
  return b % 3 === 0;
};

// Entrances: the middle non-pilaster ground bay on the north and south faces.
const doors = new Map();
for (const face of [[0, -1], [0, 1]]) {
  const cand = [...F.values()].filter((c) => c.out.length === 1 && c.out[0][0] === face[0] && c.out[0][1] === face[1] && !isPilaster(c));
  if (!cand.length) continue;
  const xs = [...F.values()].filter((c) => c.out.some((d) => d[0] === face[0] && d[1] === face[1]));
  const mid = (Math.min(...xs.map((c) => c.x)) + Math.max(...xs.map((c) => c.x))) / 2;
  cand.sort((a, b) => Math.abs(a.x - mid) - Math.abs(b.x - mid));
  doors.set(key(cand[0].x, cand[0].z), face);
}

// Pass 1: podium, floor slabs, roof and walls per column.
for (const c of F.values()) {
  const { x, z, T } = c;
  for (let y = 0; y <= 2; y++) put(x, y, z, c.facade ? PODIUM : STONE);

  for (const s of slabsFor(T)) put(x, s, z, c.facade ? BELT : STONE);   // floor slab (a string course on the facade)
  put(x, T - 1, z, c.facade ? COPING : ROOF);                              // roof surface, coping on the edge

  if (!c.facade) continue;
  const pil = isPilaster(c);
  const slabs = slabsFor(T);
  for (let y = 4; y <= T - 2; y++) {
    if (slabs.includes(y)) continue;
    const F0 = Math.max(...slabs.filter((s) => s < y));
    const rel = y - F0;
    if (y === T - 2) put(x, y, z, CORNICE, { type: "top" });   // cornice row
    else if (rel === 3 || pil) put(x, y, z, WALL);            // spandrel row and pilasters
    else put(x, y, z, GLASS);                                 // window rows
  }
}

// Pass 2: the entrances (lower and upper door halves on the ground floor, a stone lintel canopy above).
for (const [k, face] of doors) {
  const [x, z] = k.split(",").map(Number);
  const dir = NAME[`${face[0]},${face[1]}`];
  const st = (half) => ({ facing: dir, half, hinge: "left", open: "false", powered: "false" });
  put(x, 4, z, "dark_oak_door", st("lower"));
  put(x, 5, z, "dark_oak_door", st("upper"));
  // canopy: a lintel of slabs across the door bay (the door cell and its two pilasters)
  for (const dx of [-1, 0, 1]) for (const dz of [-1, 0, 1]) {
    const n = F.get(key(x + dx, z + dz));
    if (n && n.facade && n.out.length === 1 && n.out[0][0] === face[0] && n.out[0][1] === face[1]) {
      put(n.x, 6, n.z, CORNICE, { type: "top" });
    }
  }
}

// Pass 3: warm light behind some windows (glowstone just inside the glass, on the storey's floor).
let lit = 0;
for (const c of F.values()) {
  if (!c.facade || c.out.length !== 1 || isPilaster(c) || doors.has(key(c.x, c.z))) continue;
  const slabs = slabsFor(c.T);
  if (!slabs.length) continue;
  for (const F0 of slabs) {
    const y = F0 + 1;
    if (y > c.T - 3) continue;
    if (((c.x * 7 + c.z * 13 + y * 5) % 6) !== 0) continue;
    const [ox, oz] = c.out[0];
    const ix = c.x - ox, iz = c.z - oz;                        // the cell just inside the facade
    if (!inF(ix, iz) || F.get(key(ix, iz)).facade) continue;
    put(ix, y, iz, "glowstone"); lit++;
  }
}

// Pass 4: a skylight in each courtyard roof, and plant on the roofs (the core's plant rooms, two blocks high).
for (const c of F.values()) {
  if (c.facade) continue;
  if (c.T === 9 && c.x % 4 === 2 && c.z % 4 === 2) {
    const ring = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]].every(([dx, dz]) => {
      const n = F.get(key(c.x + dx, c.z + dz)); return n && n.T === 9;
    });
    if (ring) put(c.x, 8, c.z, GLASS);
  }
}
let plant = 0;
for (let x = 2; x < 32; x++) for (let z = 2; z < 56; z++) {
  if (x % 8 !== 4 || z % 8 !== 4) continue;
  const block = [[0, 0], [1, 0], [0, 1], [1, 1]].map(([dx, dz]) => F.get(key(x + dx, z + dz)));
  if (block.some((n) => !n || n.T !== 16 || n.facade)) continue;
  for (const [dx, dz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
    put(x + dx, 16, z + dz, "light_gray_concrete"); put(x + dx, 17, z + dz, "light_gray_concrete");
  }
  plant++;
}

const res = g.save(OUT);
console.log(`saved ${OUT}: ${res.blocks} blocks, ${res.palette} palette entries; doors ${doors.size}, lit windows ${lit}, plant boxes ${plant}`);
