import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw587177074";
const W = 5, H = 37, D = 9;
const ROOF = 25;      // roof slab level above lowest ground
const PARAPET_TOP = 26;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Ground heights, normalised so the lowest footprint ground is y 0.
const minGround = Math.min(...cells.map(c => Math.round(c[2])));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr) - minGround);

const has = (x, z) => ground.has(`${x},${z}`);
const DIRS = [
  { n: "north", dx: 0, dz: -1 },
  { n: "south", dx: 0, dz: 1 },
  { n: "west", dx: -1, dz: 0 },
  { n: "east", dx: 1, dz: 0 },
];
const exposed = (x, z) => DIRS.filter(d => !has(x + d.dx, z + d.dz));

const g = new Voxels([W, H, D]);

// Entrance: a single-exposed perimeter cell on the north side if possible, centred.
const perimeterCells = cells
  .map(([x, z]) => [Math.round(x), Math.round(z)])
  .filter(([x, z]) => exposed(x, z).length > 0);
let entranceCandidates = perimeterCells.filter(([x, z]) => exposed(x, z).length === 1);
let pool = entranceCandidates.filter(([x, z]) => exposed(x, z)[0].n === "north");
if (pool.length === 0) pool = entranceCandidates;
if (pool.length === 0) pool = perimeterCells;
pool.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
const [ex, ez] = pool[Math.floor(pool.length / 2)] ?? [-1, -1];
const entranceExp = has(ex, ez) ? exposed(ex, ez) : [];
const entranceFacing = entranceExp.length ? entranceExp[0].n : "north";

// Interior cells (for the mechanical penthouse position).
const interiorCells = cells
  .map(([x, z]) => [Math.round(x), Math.round(z)])
  .filter(([x, z]) => exposed(x, z).length === 0);
let mechCell = null;
if (interiorCells.length) {
  const cx = interiorCells.reduce((s, c) => s + c[0], 0) / interiorCells.length;
  const cz = interiorCells.reduce((s, c) => s + c[1], 0) / interiorCells.length;
  mechCell = interiorCells
    .slice()
    .sort((a, b) => Math.hypot(a[0] - cx, a[1] - cz) - Math.hypot(b[0] - cx, b[1] - cz))[0];
}

for (const [xr, zr, grRaw] of cells) {
  const x = Math.round(xr), z = Math.round(zr);
  const gr = ground.get(`${x},${z}`);
  const exp = exposed(x, z);
  const isPerimeter = exp.length > 0;
  const isCorner = exp.length >= 2 && exp.some(d => d.dz !== 0) && exp.some(d => d.dx !== 0);

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone");

  if (!isPerimeter) {
    // Interior: floor slabs at ground and each storey line, air elsewhere (no interiors).
    g.set(x, gr, z, "smooth_stone");
    for (let y = 5; y <= ROOF; y += 5) {
      if (y > gr) g.set(x, y, z, "smooth_stone");
    }
    // Roof slab.
    g.set(x, ROOF, z, "light_gray_concrete");
    continue;
  }

  // Along-face coordinate: pier/window rhythm runs along the wall.
  const alongX = exp.some(d => d.dz !== 0); // wall runs along x
  const a = alongX ? x : z;
  const pier = isCorner || (a % 2 === 0);

  const isEntrance = x === ex && z === ez;

  // Facade walls from ground to parapet base.
  for (let y = gr; y <= ROOF - 1; y++) {
    const k = Math.floor(y / 5);
    const r = y % 5;
    let block;

    if (y === gr) {
      block = "polished_andesite"; // base course
    } else if (y < 5 && r === 4) {
      block = "white_concrete";     // ground storey lintel band
    } else if (r === 0) {
      block = "white_concrete";     // spandrel at storey line
    } else if (r === 4) {
      block = "light_gray_concrete"; // string course
    } else {
      block = pier ? "white_concrete" : "light_blue_stained_glass";
    }

    if (isEntrance) {
      if (y === gr + 1 || y === gr + 2) {
        const half = y === gr + 1 ? "lower" : "upper";
        g.set(x, y, z, "oak_door", {
          facing: entranceFacing, half, hinge: "left", open: "false", powered: "false",
        });
        continue;
      }
      if (y === gr + 3) block = "light_blue_stained_glass"; // transom
    }

    g.set(x, y, z, block);

    // Warm light behind some windows, standing on the floor slab inside.
    if (!pier && !isEntrance && r === 1 && exp.length === 1 && 5 * k >= gr && 5 * k + 1 <= ROOF - 1) {
      const d = exp[0];
      const ix = x - d.dx, iz = z - d.dz;
      const interiorOk = has(ix, iz) && exposed(ix, iz).length === 0;
      if (interiorOk && (a + k) % 3 === 0) {
        g.set(ix, 5 * k + 1, iz, "shroomlight");
      }
    }
  }

  // Parapet: cornice and coping above the roof slab.
  g.set(x, ROOF, z, "white_concrete");
  g.set(x, PARAPET_TOP, z, "light_gray_concrete");
}

// Roof mechanical penthouse and antenna on the interior cell nearest the centre.
if (mechCell) {
  const [mx, mz] = mechCell;
  g.set(mx, ROOF + 1, mz, "light_gray_concrete");
  g.set(mx, ROOF + 2, mz, "stone");
  for (let y = ROOF + 3; y <= ROOF + 6; y++) g.set(mx, y, mz, "iron_bars");
}

g.save(`${DIR}/${ID}.nbt`);
