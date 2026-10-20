import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// OSMw538034010: no record. Decided from the lidar roof height (~11 blocks) and footprint 10 x 23:
// a two-storey, mid-century style concrete shophouse with a shopfront ground storey, a
// white-concrete window grid with stone storey bands, a parapet, a flat roof deck, and a small
// rooftop penthouse with air-conditioning plant.

const base = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw538034010";
const cells = JSON.parse(readFileSync(base + ".cells.json", "utf8"));
const g = new Voxels([10, 23, 23]);

const KEY = (x, z) => `${x},${z}`;
const G = new Map();
for (const [x, z, gr] of cells) G.set(KEY(x, z), Math.round(gr));
const has = (x, z) => G.has(KEY(x, z));
const gr = (x, z) => G.get(KEY(x, z));

const DIRS = [
  { n: "north", dx: 0, dz: -1 },
  { n: "south", dx: 0, dz: 1 },
  { n: "west", dx: -1, dz: 0 },
  { n: "east", dx: 1, dz: 0 },
];
const facesOf = (x, z) => DIRS.filter((d) => !has(x + d.dx, z + d.dz));
const isPerim = (x, z) => facesOf(x, z).length > 0;
const alongOf = (x, z, d) => (d.dz !== 0 ? x : z);

const ROOF_DECK = 10; // top of storey-2 walls / roof slab
const PARAPET = 11;   // parapet course on the perimeter
const STOREY = 5;     // storey line (floor slab / band) at absolute y=5

// ---- Choose the front: longest face, door at the cell nearest its middle ----
const byFace = {};
for (const d of DIRS) byFace[d.n] = [];
for (const [x, z] of [...G.keys()].map((k) => k.split(",").map(Number))) {
  const fs = facesOf(x, z);
  if (fs.length === 1) byFace[fs[0].n].push([x, z, fs[0]]);
}
let frontName = null;
let frontCount = -1;
for (const d of DIRS) {
  if (byFace[d.n].length > frontCount) {
    frontCount = byFace[d.n].length;
    frontName = d.n;
  }
}
const frontDir = DIRS.find((d) => d.n === frontName);
const frontCells = byFace[frontName];
let doorX = null, doorZ = null, doorAlong = null;
if (frontCells.length) {
  const alongs = frontCells.map(([x, z]) => alongOf(x, z, frontDir));
  const mid = (Math.min(...alongs) + Math.max(...alongs)) / 2;
  let best = frontCells[0];
  for (const c of frontCells) {
    if (Math.abs(alongOf(c[0], c[1], frontDir) - mid) < Math.abs(alongOf(best[0], best[1], frontDir) - mid)) best = c;
  }
  doorX = best[0];
  doorZ = best[1];
  doorAlong = alongOf(doorX, doorZ, frontDir);
}

const paneProps = (d) =>
  d.dz !== 0
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// ---- Footprint pass ----
const keys = [...G.keys()].map((k) => k.split(",").map(Number));

for (const [x, z] of keys) {
  const g0 = gr(x, z);

  // Foundation: solid from y0 up to this cell's ground.
  for (let y = 0; y < g0; y++) g.set(x, y, z, "cobblestone");

  const fs = facesOf(x, z);

  if (fs.length === 0) {
    // Interior: storey slab and roof deck only (air gap behind the glass).
    if (g0 <= STOREY) g.set(x, STOREY, z, "smooth_stone");
    if (g0 <= ROOF_DECK) g.set(x, ROOF_DECK, z, "light_gray_concrete");
    continue;
  }

  if (g0 > ROOF_DECK) continue; // guard: nothing above the roof line for this cell

  const face = fs[0];
  const corner = fs.length > 1;
  const along = alongOf(x, z, face);
  const pier = corner || along % 3 === 0;

  // Base course at ground level.
  g.set(x, g0, z, "stone_bricks");

  for (let y = g0 + 1; y <= ROOF_DECK; y++) {
    if (y === STOREY || y === ROOF_DECK) {
      g.set(x, y, z, "smooth_stone");
    } else if (pier) {
      g.set(x, y, z, "white_concrete");
    } else {
      g.set(x, y, z, "glass_pane", paneProps(face));
    }
  }

  // Parapet course on top of the walls.
  g.set(x, PARAPET, z, "white_concrete");

  // Shopfront canopy (dark lintel) above the entrance, within the ground storey.
  if (
    face.n === frontName &&
    !corner &&
    Math.abs(along - doorAlong) <= 1 &&
    g0 + 2 < STOREY
  ) {
    g.set(x, g0 + 2, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
  }

  // Warm light behind some upper-storey windows (glowstone in the interior air gap).
  if (!pier && along % 6 === 1) {
    const ix = x - face.dx;
    const iz = z - face.dz;
    if (has(ix, iz) && !isPerim(ix, iz) && gr(ix, iz) <= 7) {
      g.set(ix, 7, iz, "glowstone");
    }
  }
}

// ---- Entrance door (overrides the shopfront pane at the door cell) ----
if (doorX !== null) {
  const g0 = gr(doorX, doorZ);
  const doorProps = (half) => ({
    facing: frontName,
    half,
    hinge: "left",
    open: "false",
    powered: "false",
  });
  g.set(doorX, g0, doorZ, "oak_door", doorProps("lower"));
  g.set(doorX, g0 + 1, doorZ, "oak_door", doorProps("upper"));
}

// ---- Rooftop penthouse and plant (stands on the roof deck, interior cells only) ----
const canRoof = (x, z) => has(x, z) && !isPerim(x, z) && gr(x, z) <= ROOF_DECK;

for (let x = 3; x <= 6; x++) {
  for (let z = 9; z <= 13; z++) {
    if (!canRoof(x, z)) continue;
    const ring = x === 3 || x === 6 || z === 9 || z === 13;
    if (ring) {
      g.set(x, 11, z, "white_concrete");
      g.set(x, 12, z, "white_concrete");
    }
    g.set(x, 13, z, "light_gray_concrete");
  }
}
if (canRoof(4, 11)) g.set(4, 14, 11, "lantern", { hanging: "false", waterlogged: "false" });

for (const [x, z] of [[1, 4], [1, 18], [8, 4], [8, 18]]) {
  if (canRoof(x, z)) {
    g.set(x, 11, z, "gray_concrete");
    g.set(x, 12, z, "gray_concrete");
  }
}

g.save(base + ".nbt");
