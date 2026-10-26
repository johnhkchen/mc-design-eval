// 1701 16th St NW (Residential-Cooperative-Vertical): a 1920s brick-and-limestone apartment block around a light court.
// Massing from the lidar cells: a 3x3 median smooths the 11/12/13 roof tiers, the 2-block annex stays low. The shell is one
// block thick on its outer face (windows of glass panes over an air gap), the interior is air with a floor slab every
// three blocks, foundations run from y 0 up to each cell's ground, and every storey stands on the one below.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC70043.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC70043.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const key = (x, z) => `${x},${z}`;
const cell = new Map(cells.map(([x, z, g, r]) => [key(x, z), { g, r }]));
const inside = (x, z) => cell.has(key(x, z));
const NEIGH = (x, z) => [[x - 1, z], [x + 1, z], [x, z - 1], [x, z + 1]];

// roof tiers: median of the 3x3 neighbourhood among the tall cells; the low annex (2 blocks) is kept as read
const roof = new Map();
for (const [k, { r }] of cell) {
  if (r <= 2) { roof.set(k, r); continue; }
  const [x, z] = k.split(",").map(Number);
  const vals = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const c = cell.get(key(x + dx, z + dz)); if (c && c.r > 2) vals.push(c.r); }
  vals.sort((a, b) => a - b);
  roof.set(k, vals[vals.length >> 1]);
}

// distance from the outside (courts count as outside): 1 = facade, 2+ = interior
const dist = new Map(), q = [];
for (const [k] of cell) {
  const [x, z] = k.split(",").map(Number);
  if (NEIGH(x, z).some(([a, b]) => !inside(a, b))) { dist.set(k, 1); q.push([x, z]); }
}
for (let i = 0; i < q.length; i++) {
  const [x, z] = q[i], d = dist.get(key(x, z));
  for (const [a, b] of NEIGH(x, z)) if (inside(a, b) && !dist.has(key(a, b))) { dist.set(key(a, b), d + 1); q.push([a, b]); }
}

const B = {
  found: "cobblestone", base: "stone_bricks", brick: "bricks", limestone: "smooth_quartz", roof: "stone",
  floor: "stone", lamp: ["glowstone", "shroomlight"],
};
const paneState = (outDir) => (outDir === "ns" // facade runs east-west, so the pane joins its neighbours east and west
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });

// the outward faces of a facade cell: "n" "s" "e" "w" (street = x 0 face, the west side)
const faces = (x, z) => ({
  n: !inside(x, z - 1), s: !inside(x, z + 1), w: !inside(x - 1, z), e: !inside(x + 1, z),
});

// the street door: centred on the west (x = 0) facade, on a window bay
const westZ = [];
for (const [k] of cell) { const [x, z] = k.split(",").map(Number); if (x === 0 && dist.get(k) === 1) westZ.push(z); }
westZ.sort((a, b) => a - b);
let doorZ = westZ[westZ.length >> 1];
if (doorZ % 3 === 0) doorZ += 1;

const g = new Voxels([26, 25, 29]);
const place = (x, y, z, block, state) => g.set(x, y, z, block, state);

for (const [k, { g: ground }] of cell) {
  const [x, z] = k.split(",").map(Number);
  const R = roof.get(k), d = dist.get(k);
  const f = faces(x, z);
  const corner = d === 1 && (f.n || f.s) && (f.e || f.w);
  const outerAlongX = f.n || f.s;     // the facade runs east-west
  const t = outerAlongX ? x : z;      // position along the facade
  const windowBay = t % 3 !== 0;

  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < ground; y++) place(x, y, z, B.found);

  for (let y = ground; y < R - 1; y++) {
    const rel = y - ground;
    if (d >= 2) {                                   // interior: a floor slab per storey, air between
      if (rel % 3 === 0) place(x, y, z, B.floor);
      continue;
    }
    if (rel === 0) { place(x, y, z, B.base); continue; }
    if (rel % 3 === 0) { place(x, y, z, B.limestone); continue; }
    if (corner) { place(x, y, z, B.limestone); continue; }
    if (!windowBay) { place(x, y, z, B.brick); continue; }
    if (d === 1 && x === 0 && z >= doorZ - 1 && z <= doorZ + 1) {   // door bay: the door at rel 1-2
      if (z === doorZ && rel === 1) { place(x, y, z, "dark_oak_door", { facing: "east", half: "lower", hinge: "left", open: "false", powered: "false" }); continue; }
      if (z === doorZ && rel === 2) { place(x, y, z, "dark_oak_door", { facing: "east", half: "upper", hinge: "left", open: "false", powered: "false" }); continue; }
      if (rel === 3) { place(x, y, z, "black_concrete"); continue; }   // the canopy band over the door
      place(x, y, z, B.brick); continue;
    }
    place(x, y, z, "glass_pane", paneState(outerAlongX ? "ns" : "ew"));
  }

  // roof: the covering over the interior, the cornice on the facade
  place(x, R - 1, z, d === 1 ? B.limestone : B.roof);
}

// warm light behind some glass: a glowstone or shroomlight on the floor just inside a window, rel 1, 4 or 7
for (const [k, { g: ground }] of cell) {
  const [x, z] = k.split(",").map(Number);
  if (dist.get(k) !== 1) continue;
  const f = faces(x, z);
  if (!(f.n || f.s || f.e || f.w)) continue;
  if ((f.n || f.s) && (f.e || f.w)) continue;
  const t = (f.n || f.s) ? x : z;
  if (t % 3 === 0 || (x === 0 && z >= doorZ - 1 && z <= doorZ + 1)) continue;
  const [dx, dz] = f.n ? [0, 1] : f.s ? [0, -1] : f.e ? [-1, 0] : [1, 0];
  const ix = x + dx, iz = z + dz;
  if (!inside(ix, iz) || dist.get(key(ix, iz)) < 2) continue;
  if ((x * 5 + z * 3) % 4 !== 0) continue;
  const R = roof.get(k);
  const rel = ((x + 2 * z) % 3 === 0) ? 1 : 4;
  const y = ground + rel;
  if (y >= R - 1) continue;
  const lamp = B.lamp[(x + z) % 2];
  place(ix, y, iz, lamp);
}

// roof plant: a few air-cooled boxes on the 11-block roof
for (const [k] of cell) {
  const [x, z] = k.split(",").map(Number);
  if (dist.get(k) < 2 || roof.get(k) !== 11) continue;
  if (x % 6 !== 3 || z % 6 !== 3) continue;
  place(x, 11, z, "light_gray_concrete");
  place(x, 12, z, "iron_bars", { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" });
}

const info = g.save(OUT);
console.log("saved", OUT, info, "doorZ", doorZ);
