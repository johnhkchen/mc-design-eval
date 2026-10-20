import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1341554071";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 20, H = 71, D = 21;
const ROOF = 59;     // roof/parapet top, about 59 above lowest ground
const STOREY = 5;    // blocks per storey (about 11 storeys below the roof)

const key = (x, z) => `${x},${z}`;
const grid = new Map();
for (const [x, z, gr] of cells) grid.set(key(x, z), gr);
const has = (x, z) => grid.has(key(x, z));

const xs = cells.map(c => c[0]), zs = cells.map(c => c[1]);
const minX = Math.min(...xs), maxX = Math.max(...xs);
const minZ = Math.min(...zs), maxZ = Math.max(...zs);

const xEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z);
const zEdge = (x, z) => !has(x, z - 1) || !has(x, z + 1);
const isExt = (x, z) => xEdge(x, z) || zEdge(x, z);

// Entrance: centre of the south (max z) face
const southXs = cells.filter(c => c[1] === maxZ).map(c => c[0]);
const doorX = southXs.length
  ? Math.round((Math.min(...southXs) + Math.max(...southXs)) / 2)
  : null;
const doorCell = doorX === null ? null : cells.find(c => c[0] === doorX && c[1] === maxZ);

const g = new Voxels([W, H, D]);

for (const [x, z, gr] of cells) {
  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone");

  const ext = isExt(x, z);
  const xe = xEdge(x, z), ze = zEdge(x, z);
  const corner = xe && ze;
  // Position along the facade: piers every 3 cells, plus corners
  const coord = ze ? x - minX : z - minZ;
  const pier = corner || coord % 3 === 0 || (ext && coord === 0);

  for (let y = gr; y <= ROOF; y++) {
    const r = y % STOREY;
    const isSlab = y === gr || r === 0;

    if (y === ROOF) {
      g.set(x, y, z, ext ? "white_concrete" : "light_gray_concrete");
      continue;
    }
    if (isSlab) {
      g.set(x, y, z, "light_gray_concrete");   // floor slab / storey line
      continue;
    }
    if (!ext) {
      // Interior: air gap, with warm lights just behind the facade glass
      const nearGlass = !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
      if (nearGlass && r === 2 && (x + z) % 4 === 0) {
        g.set(x, y, z, "glowstone");
      }
      continue;
    }
    // Exterior facade
    if (y === ROOF - 1) {
      g.set(x, y, z, "light_gray_concrete");   // cornice course under parapet
      continue;
    }
    if (y < gr + 4) {
      // Ground-floor shopfront
      g.set(x, y, z, pier ? "light_gray_concrete" : "light_blue_stained_glass");
      continue;
    }
    if (r === 4) {
      g.set(x, y, z, "white_concrete");        // spandrel band
      continue;
    }
    if (pier) {
      g.set(x, y, z, "light_gray_concrete");   // mullions / piers
    } else {
      g.set(x, y, z, "light_blue_stained_glass");
    }
  }
}

// Entrance door on the south face, with lintel above
if (doorCell) {
  const [dx, dz, dgr] = doorCell;
  const props = { facing: "south", hinge: "left", open: "false", powered: "false" };
  g.set(dx, dgr, dz, "dark_oak_door", { ...props, half: "lower" });
  g.set(dx, dgr + 1, dz, "dark_oak_door", { ...props, half: "upper" });
  g.set(dx, dgr + 2, dz, "light_gray_concrete");
}

// Roof penthouse / mechanical core on the centre of the roof
const penthouse = new Set();
for (const [x, z] of cells) {
  if (x >= minX + 6 && x <= maxX - 6 && z >= minZ + 7 && z <= maxZ - 7) penthouse.add(key(x, z));
}
const phEdge = (x, z) =>
  !penthouse.has(key(x - 1, z)) || !penthouse.has(key(x + 1, z)) ||
  !penthouse.has(key(x, z - 1)) || !penthouse.has(key(x, z + 1));

for (const k of penthouse) {
  const [x, z] = k.split(",").map(Number);
  g.set(x, 60, z, "light_gray_concrete");           // slab on the roof
  for (let y = 61; y <= 63; y++) {
    if (phEdge(x, z)) {
      const band = (y === 61 || y === 62) && (x + z) % 2 === 0;
      g.set(x, y, z, band ? "light_blue_stained_glass" : "white_concrete");
    }
  }
  g.set(x, 64, z, "light_gray_concrete");           // roof cap of the core
}

// Antenna mast with a warm light at the top
const mastX = minX + 10, mastZ = minZ + 10;
if (penthouse.has(key(mastX, mastZ))) {
  for (let y = 65; y <= 69; y++) {
    g.set(mastX, y, mastZ, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  }
  g.set(mastX, 70, mastZ, "glowstone");
}

g.save(`${DIR}/${ID}.nbt`);
