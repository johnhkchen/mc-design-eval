import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw549464951";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 13, H = 23, D = 15;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground height (third number)
const fp = new Map();
for (const c of cells) fp.set(`${c[0]},${c[1]}`, c[2] ?? 0);
const has = (x, z) => fp.has(`${x},${z}`);

// Outward directions: name -> [dx, dz]
const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };

const facesOf = (x, z) =>
  Object.keys(DIRS).filter(n => !has(x + DIRS[n][0], z + DIRS[n][1]));

// Along-face index: x for north/south faces, z for east/west faces
const alongIdx = (n, x, z) => (n === "north" || n === "south" ? x : z);

// Entrance face: prefer south (street side), else first available
const facadeCells = cells.map(c => [c[0], c[1], c[2] ?? 0]);
const entFace = ["south", "north", "east", "west"].find(n =>
  facadeCells.some(([x, z]) => facesOf(x, z).includes(n))
) ?? "south";

const entCells = facadeCells
  .filter(([x, z]) => facesOf(x, z).includes(entFace))
  .sort((a, b) => alongIdx(entFace, a[0], a[1]) - alongIdx(entFace, b[0], b[1]));
const doorCell = entCells[Math.floor(entCells.length / 2)] ?? facadeCells[0];
const doorA = doorCell ? alongIdx(entFace, doorCell[0], doorCell[1]) : 0;

const isEntCell = (x, z) => entCells.some(([ex, ez]) => ex === x && ez === z);

// ---- 1. Foundation and walls, per footprint cell ----
for (const [x, z, gr0] of facadeCells) {
  const gr = gr0;
  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const faces = facesOf(x, z);
  const isFacade = faces.length > 0;

  if (isFacade) {
    // Walls from ground to y 9 (two storeys of ~5 blocks)
    for (let y = gr; y <= 9; y++) {
      let b = "white_concrete";
      if (y === gr) b = "polished_andesite";      // base course
      else if (y === 5) b = "smooth_stone";       // storey line
      g.set(x, y, z, b);
    }
    // Cornice and parapet
    g.set(x, 10, z, "bricks");
    g.set(x, 11, z, "bricks");
  }
}

// ---- 2. Facade openings, doors, canopy, sign, warm lights ----
for (const [x, z, gr] of facadeCells) {
  const faces = facesOf(x, z);
  for (const n of faces) {
    const [dx, dz] = DIRS[n];
    const a = alongIdx(n, x, z);
    const facing = n;

    if (n === entFace) {
      const nearDoor = Math.abs(a - doorA) <= 1;
      const isDoor = a === doorA && doorCell && doorCell[0] === x && doorCell[1] === z;

      if (isDoor) {
        // Door: lower and upper halves
        g.set(x, gr + 1, z, "dark_oak_door", {
          facing, half: "lower", hinge: "left", open: "false", powered: "false",
        });
        g.set(x, gr + 2, z, "dark_oak_door", {
          facing, half: "upper", hinge: "left", open: "false", powered: "false",
        });
      } else {
        // Shopfront glass
        g.set(x, gr + 1, z, "gray_stained_glass");
        g.set(x, gr + 2, z, "gray_stained_glass");
      }

      if (nearDoor) {
        // Canopy over entrance bay
        g.set(x, gr + 3, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
      } else {
        g.set(x, gr + 3, z, "gray_stained_glass");
      }

      // Red sign band above entrance
      if (isEntCell(x, z)) g.set(x, gr + 4, z, "red_concrete");
    } else {
      // Ground floor windows on other faces (odd bays)
      if (a % 2 === 1) {
        for (let y = gr + 1; y <= gr + 3; y++) g.set(x, y, z, "gray_stained_glass");
      }
    }

    // Second-floor windows on all faces (odd bays)
    if (a % 2 === 1) {
      for (let y = 6; y <= 8; y++) g.set(x, y, z, "gray_stained_glass");

      // Warm light behind some glass, in the interior air cell
      const ix = x - dx, iz = z - dz;
      const interior =
        has(ix, iz) && has(ix + 1, iz) && has(ix - 1, iz) && has(ix, iz + 1) && has(ix, iz - 1);
      if (interior && (x + z) % 2 === 0) {
        g.set(ix, 7, iz, "glowstone");
      }
    }
  }
}

// ---- 3. Floors, roof deck, rooftop equipment ----
for (const [x, z] of [[...fp.keys()].map(k => k.split(",").map(Number))].flat()) {
  const facade = facesOf(x, z).length > 0;
  // Floor slab at storey line
  if (!facade) g.set(x, 5, z, "smooth_stone");
  // Roof deck inside the parapet
  if (!facade) g.set(x, 10, z, "gray_concrete");
  // Small AC units on the roof
  if (!facade && x % 4 === 1 && z % 4 === 1) g.set(x, 11, z, "iron_block");
}

// Rooftop water tank / plant box in the centre
const tankX = [5, 6, 7], tankZ = [6, 7, 8];
for (const tx of tankX) for (const tz of tankZ) {
  if (!has(tx, tz)) continue;
  for (let y = 11; y <= 13; y++) g.set(tx, y, tz, "white_concrete");
  g.set(tx, 14, tz, "gray_concrete");
}

g.save(`${DIR}/${ID}.nbt`);
