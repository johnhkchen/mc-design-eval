// Ross Manor-SHA, 1420 Western Ave: a 1984 apartment block of ten storeys over a glass retail base on the downhill
// street. Brick-faced walls with light-grey concrete spandrels, bronze-tinted glass in window grids between brick
// piers, a stone plinth and a retail lintel band, a black-canopied entrance on the west face, a cornice and brick
// parapet with a coping, and a set-back mechanical penthouse with rooftop units. Floors are flat across the plate: the
// uphill side is buried in the hill, and the downhill side shows its extra storeys. Warm glowstone sits two cells
// behind some panes, one air cell back from the glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/seattle/pike-place/fill";
const cells = JSON.parse(readFileSync(`${DIR}/SEA1270106905.cells.json`, "utf8"));

const SIZE = [52, 66, 37];
const FIRST_FLOOR = 5;   // retail storey is rows 0..4; residential storeys are 5 blocks each from here
const ROOF = 50;         // roof deck (cornice course on the shell)
const TOP = 53;          // parapet coping: the roof sits 54 blocks above the lowest ground

// Footprint lookup: ground per cell, and the outward faces that are open to the air.
const ground = new Map(cells.map(([x, z, g]) => [`${x},${z}`, g]));
const has = (x, z) => ground.has(`${x},${z}`);
const NORMALS = { "+x": [1, 0], "-x": [-1, 0], "+z": [0, 1], "-z": [0, -1] };
const exposed = (x, z) => Object.keys(NORMALS).filter((n) => !has(x + NORMALS[n][0], z + NORMALS[n][1]));

// Interior depth (cells in from the nearest exposed face): sets where the penthouse and plant go, and the lamps' depth.
const depth = new Map();
let frontier = cells.filter(([x, z]) => exposed(x, z).length).map(([x, z]) => `${x},${z}`);
for (const k of frontier) depth.set(k, 0);
for (let d = 1; frontier.length; d++) {
  const next = [];
  for (const k of frontier) {
    const [x, z] = k.split(",").map(Number);
    for (const [dx, dz] of Object.values(NORMALS)) {
      const nk = `${x + dx},${z + dz}`;
      if (has(x + dx, z + dz) && !depth.has(nk)) { depth.set(nk, d); next.push(nk); }
    }
  }
  frontier = next;
}

const V = new Voxels(SIZE);

// Foundation: solid from y 0 up to each cell's ground, so nothing floats on the slope.
for (const [x, z, g] of cells) for (let y = 0; y < g; y++) V.set(x, y, z, "stone_bricks");

// Pane orientation: a pane on a face normal to x runs along z, and the other way round.
const pane = (face) => (face.endsWith("x")
  ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
  : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" });

// Shell cells: the wall of the building, read row by row from the ground up.
const shell = cells.filter(([x, z]) => exposed(x, z).length > 0);
const lamps = [];
for (const [x, z, g] of shell) {
  const ex = exposed(x, z);
  const face = ex[0];
  const corner = ex.length > 1;             // a corner cell is a brick pier all the way up
  const along = face.endsWith("x") ? z : x; // position along the face (the bay grid runs along it)
  const street = g <= 3;                    // the downhill frontage gets the shopfront

  for (let y = g; y <= TOP; y++) {
    if (y === g) { V.set(x, y, z, "stone_bricks"); continue; }                      // base course on the ground line
    if (y < FIRST_FLOOR) {                                                          // retail storey
      if (!street || corner) V.set(x, y, z, "bricks");
      else if (y === 4) V.set(x, y, z, "smooth_stone");                           // lintel / sign band
      else if (along % 3 === 0) V.set(x, y, z, "dark_oak_planks");                // shopfront mullion
      else V.set(x, y, z, "glass");
      continue;
    }
    if (y < ROOF) {                                                                 // residential storeys
      const k = Math.floor((y - FIRST_FLOOR) / 5) + 1, r = (y - FIRST_FLOOR) % 5;
      if (r === 0) { V.set(x, y, z, "light_gray_concrete"); continue; }            // spandrel at each floor line
      if (r === 4 || corner || along % 4 === 0) { V.set(x, y, z, "bricks"); continue }   // header course and piers
      V.set(x, y, z, "gray_stained_glass_pane", pane(face));
      if (r === 2 && (k + along) % 16 === 2) lamps.push([x, y, z, face]);         // a few lit windows, not a dotted grid
      continue;
    }
    if (y === ROOF) { V.set(x, y, z, "smooth_stone"); continue; }                  // cornice course
    if (y < TOP) { V.set(x, y, z, "bricks"); continue; }                           // parapet
    V.set(x, y, z, "smooth_stone");                                                // coping
  }
}

// Interior: floor slabs at the storey lines and the roof deck; air between them (no interiors).
const shellSet = new Set(shell.map(([x, z]) => `${x},${z}`));
for (const [x, z, g] of cells) {
  if (shellSet.has(`${x},${z}`)) continue;
  for (const y of [g, ...Array.from({ length: 10 }, (_, i) => FIRST_FLOOR + 5 * i)]) {
    if (y >= g && y <= ROOF) V.set(x, y, z, "smooth_stone");
  }
}

// Glowstone two cells in behind a lit window: one air cell between the pane and the lamp.
for (const [x, y, z, face] of lamps) {
  const [nx, nz] = NORMALS[face];
  const ix = x - 2 * nx, iz = z - 2 * nz;
  if (!has(ix, iz) || shellSet.has(`${ix},${iz}`) || y < ground.get(`${ix},${iz}`) + 1) continue;
  V.set(ix, y, iz, "glowstone");
}

// Entrance: a door in the downhill west frontage, with a black canopy across its bay.
const doorCell = shell
  .filter(([x, z, g]) => g <= 2 && exposed(x, z).includes("-x"))
  .sort((a, b) => Math.abs(a[1] - 18) - Math.abs(b[1] - 18))[0];
if (doorCell) {
  const [dx, dz, dg] = doorCell;
  for (const z of [dz - 1, dz, dz + 1]) {
    if (shellSet.has(`${dx},${z}`) && exposed(dx, z).includes("-x")) V.set(dx, dg + 3, z, "black_concrete");
  }
  const door = { facing: "east", hinge: "left", open: "false", powered: "false" };
  V.set(dx, dg + 1, dz, "dark_oak_door", { ...door, half: "lower" });
  V.set(dx, dg + 2, dz, "dark_oak_door", { ...door, half: "upper" });
}

// Roof: a set-back mechanical penthouse at the deepest interior point, and rooftop units across the deck.
const roofCells = cells.filter(([x, z]) => !shellSet.has(`${x},${z}`) && (depth.get(`${x},${z}`) ?? 0) >= 3);
const anchor = roofCells.reduce((a, b) => ((depth.get(`${b[0]},${b[1]}`) > depth.get(`${a[0]},${a[1]}`)) ? b : a));
const inPenthouse = new Set();
for (const [x, z] of roofCells) {
  const dxa = Math.abs(x - anchor[0]), dza = Math.abs(z - anchor[1]);
  if (dxa > 2 || dza > 2) continue;
  inPenthouse.add(`${x},${z}`);
  for (let y = ROOF + 1; y <= ROOF + 4; y++) {
    const ribbon = (dxa === 2 || dza === 2) && (y === ROOF + 2 || y === ROOF + 3);   // glazed ribbon on the sides
    if (ribbon) V.set(x, y, z, "glass");
    else V.set(x, y, z, "light_gray_concrete");
  }
  V.set(x, ROOF + 5, z, "smooth_stone");
}
for (const [x, z] of roofCells) {
  if (inPenthouse.has(`${x},${z}`) || (x * 7 + z * 3) % 11 !== 0) continue;
  V.set(x, ROOF + 1, z, "iron_block");   // rooftop air handler
}

const counts = V.save(`${DIR}/SEA1270106905.nbt`);
console.log(JSON.stringify({ ...counts, shell: shell.length, lamps: lamps.length, door: doorCell ?? null }));
