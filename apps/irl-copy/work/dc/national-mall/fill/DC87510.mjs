// DC87510: 224 1st St NE, Washington DC 20002, a 1970s precast-and-bronze-glass office block (Commercial-Office-Large)
// as a 1.21.1 module. The roof is taken from the lidar: 3x3 median over the footprint, snapped to flat tiers
// (3, 7, 9, 11, 13 blocks above y 0); the 13 tier is a penthouse on the lidar's stepped cells. Every column is solid
// from y 0 up to its roof, with floor slabs at each storey line, so nothing floats. The block is hollow: a one-block
// skin on the outside edge (and on any face that steps down), open air behind the glass, and lamps two cells in.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC87510.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC87510.nbt";

const key = (x, z) => `${x},${z}`;
const F = new Map(cells.map(([x, z, g, r]) => [key(x, z), { x, z, g, r }]));
const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];        // N, S, W, E: the first outward face wins for the facade pattern

// Palette: precast buff walls, stone base and string courses, tinted glazing, tar roof.
const WALL = "smooth_sandstone";
const BASE = "stone_bricks";
const BAND = "smooth_quartz";
const CAP = "smooth_quartz_slab";
const FLOOR = "smooth_stone";
const GLASS = "gray_stained_glass";
const MULLION = "iron_bars";
const ROOF = "gray_concrete";
const PLANT = "iron_block";
const LAMP = "glowstone";
const LANTERN = "lantern";
const DOOR = "dark_oak_door";

// Smoothed roof (3x3 median over the footprint, lidar noise and single-cell spikes drop out), then snapped to a flat tier.
const smooth = new Map();
for (const c of F.values()) {
  const vals = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const n = F.get(key(c.x + dx, c.z + dz)); if (n) vals.push(n.r);
  }
  vals.sort((a, b) => a - b);
  smooth.set(key(c.x, c.z), vals[vals.length >> 1]);
}
const snap = (h) => (h <= 3 ? 3 : h <= 8 ? 7 : h <= 10 ? 9 : h <= 12 ? 11 : 13);
const roofOf = (c) => Math.max(snap(smooth.get(key(c.x, c.z))), c.g + 2);
const T = new Map([...F.values()].map((c) => [key(c.x, c.z), roofOf(c)]));
const roofAt = (x, z) => T.get(key(x, z));

// Storey lines: slab at the ground, a 3-block ground storey, then 2-block storeys, the last slab below the roof.
const lines = (g, t) => {
  const L = [g]; let cur = g, step = 3;
  while (cur + step <= t - 2) { cur += step; L.push(cur); step = 2; }
  return L;
};

// A face is outside the building if nothing is there, or if the neighbour stands lower (a step-down shows a wall).
const facesOf = (c) => DIRS.filter(([dx, dz]) => {
  const n = F.get(key(c.x + dx, c.z + dz));
  return !n || roofAt(n.x, n.z) < roofAt(c.x, c.z);
});

// Depth from the outside skin (1 = skin), so lamps can sit two cells behind the glass.
const depth = new Map();
const queue = [];
for (const c of F.values()) if (facesOf(c).length) { depth.set(key(c.x, c.z), 1); queue.push(c); }
for (let i = 0; i < queue.length; i++) {
  const c = queue[i], d = depth.get(key(c.x, c.z));
  for (const [dx, dz] of DIRS) {
    const n = F.get(key(c.x + dx, c.z + dz));
    if (n && !depth.has(key(n.x, n.z))) { depth.set(key(n.x, n.z), d + 1); queue.push(n); }
  }
}

// Entrances: two on the north face at ground level, a third third of the way along the north bar's ground.
const north = [...F.values()].filter((c) => c.z === 0 && c.g === 0).sort((a, b) => a.x - b.x);
const doors = new Set([north[Math.floor(north.length / 3)], north[Math.floor((2 * north.length) / 3)]].map((c) => key(c.x, c.z)));

const g = new Voxels([62, 25, 59]);
const hash = (x, z, y) => (x * 7 + z * 13 + y * 5) % 11;

for (const c of F.values()) {
  const t = roofAt(c.x, c.z), L = lines(c.g, t);
  const faces = facesOf(c), shell = faces.length > 0;
  const [dx, dz] = faces[0] ?? [0, 0];
  const a = dz !== 0 ? c.x : c.z;                                  // along-facade index for the bay pattern
  const isDoor = doors.has(key(c.x, c.z));
  const dd = depth.get(key(c.x, c.z)) ?? 0;

  for (let y = 0; y <= t + 1; y++) {
    if (y < c.g) { g.set(c.x, y, c.z, BASE); continue; }             // foundation under the cell's ground
    if (y === c.g) { g.set(c.x, y, c.z, shell ? BASE : FLOOR); continue; }  // base course / ground slab
    if (L.includes(y)) { g.set(c.x, y, c.z, shell ? BAND : FLOOR); continue; }   // floor slab, string course on the skin
    if (y === t) { g.set(c.x, y, c.z, shell ? BAND : ROOF); continue; }           // cornice / roof membrane
    if (y === t + 1) {
      if (shell) g.set(c.x, y, c.z, CAP, { type: "bottom", waterlogged: "false" });  // parapet
      else if (dd >= 3 && c.x % 6 === 1 && c.z % 6 === 1) g.set(c.x, y, c.z, PLANT);  // AC units on a sparse grid on the tar
      continue;
    }
    if (y > t) continue;

    // Air rows between slabs.
    const ground = L.length > 1 ? y < L[1] : y < t;
    const pier = a % 4 === 0;
    if (shell) {
      if (isDoor && y === c.g + 1) { g.set(c.x, y, c.z, DOOR, { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" }); continue; }
      if (isDoor && y === c.g + 2) { g.set(c.x, y, c.z, DOOR, { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" }); continue; }
      if (pier) { g.set(c.x, y, c.z, WALL); continue; }
      if (!ground && a % 4 === 2) { g.set(c.x, y, c.z, MULLION); continue; }
      g.set(c.x, y, c.z, GLASS);
      continue;
    }
    if (dd >= 2 && hash(c.x, c.z, y) === 0) g.set(c.x, y, c.z, LAMP);   // warm light two cells in, in some bays
  }
}

// Lanterns hang either side of each entrance, under the ground-floor string course.
for (const k of doors) {
  const [x, z] = k.split(",").map(Number);
  for (const ox of [-1, 1]) {
    if (!F.has(key(x + ox, z))) continue;
    g.set(x + ox, 2, z, LANTERN, { hanging: "true", waterlogged: "false" });
  }
}

const info = g.save(OUT);
console.log(`DC87510: ${info.blocks} blocks, ${info.palette} palette entries -> ${OUT}`);
