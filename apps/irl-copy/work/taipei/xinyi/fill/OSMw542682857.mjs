import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise Taipei shophouse-style block, c.1960s-70s: reinforced concrete frame,
// cream wall tiles, terracotta storey band, glazed shopfront, parapet and a small
// roof penthouse. Two storeys above a ground course, roof at y 10, parapet to y 11.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542682857";
const W = 13, H = 23, D = 12;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const cellG = new Map();
let minG = Infinity;
for (const [x, z, gr] of cells) {
  cellG.set(key(x, z), gr);
  if (gr < minG) minG = gr;
}

// Outward directions: name, dx, dz
const DIRS = [
  ["north", 0, -1],
  ["south", 0, 1],
  ["west", -1, 0],
  ["east", 1, 0],
];

const missingFaces = (x, z) =>
  DIRS.filter(([, dx, dz]) => !cellG.has(key(x + dx, z + dz)));

const isPerimeter = (x, z) => missingFaces(x, z).length > 0;

// Elevation of each cell relative to lowest ground.
const groundOf = (x, z) => cellG.get(key(x, z)) - minG;

// ---- Pass 1: foundations, floors, walls, roof -------------------------------
for (const [x, z, gr0] of cells) {
  const gy = gr0 - minG;
  const fs = missingFaces(x, z);
  const per = fs.length > 0;

  // Foundation from y 0 up to the cell's own ground.
  for (let y = 0; y < gy; y++) g.set(x, y, z, "stone_bricks");

  // Ground-floor slab / base course at the cell's ground.
  g.set(x, gy, z, "smooth_stone");

  // Interior floor slab for the second storey (only where it is above ground).
  if (gy < 5 && !per) g.set(x, 5, z, "smooth_stone");

  // Roof deck at y 10 (cornice on the perimeter).
  if (gy < 10) g.set(x, 10, z, per ? "smooth_stone" : "light_gray_concrete");

  if (per) {
    const [, dx, dz] = fs[0];
    // Index along the face: x for north/south faces, z for east/west faces.
    const idx = dz !== 0 ? x : z;
    const bay = idx % 3 !== 0; // glass bays; every third column is a pier

    for (let y = gy + 1; y <= 11; y++) {
      let b;
      if (y === 11) b = "white_concrete";            // parapet
      else if (y === 10) b = "smooth_stone";         // cornice
      else if (y === 9) b = "light_gray_concrete";   // storey-2 lintel
      else if (y >= 6) b = bay ? "glass_pane" : "white_concrete"; // storey 2 windows
      else if (y === 5) b = "terracotta";            // storey line
      else if (y >= gy + 3) b = "light_gray_concrete"; // shopfront lintel
      else b = bay ? "glass_pane" : "white_concrete"; // shopfront glazing
      g.set(x, y, z, b);
    }
  }
}

// ---- Pass 2: entrance on the north (low z) street front ---------------------
let doorCell = null;
for (const [x, z] of cells) {
  const fs = missingFaces(x, z);
  if (!fs.some(([n]) => n === "north")) continue;
  if (!doorCell || Math.abs(x - W / 2) < Math.abs(doorCell[0] - W / 2)) {
    doorCell = [x, z];
  }
}
if (doorCell) {
  const [dxw, dzw] = doorCell;
  const gy = groundOf(dxw, dzw);
  const doorProps = (half) => ({
    facing: "north",
    half,
    hinge: "left",
    open: "false",
    powered: "false",
  });
  g.set(dxw, gy + 1, dzw, "dark_oak_door", doorProps("lower"));
  g.set(dxw, gy + 2, dzw, "dark_oak_door", doorProps("upper"));
}

// ---- Pass 3: warm light behind some second-storey windows -------------------
for (const [x, z, gr0] of cells) {
  const fs = missingFaces(x, z);
  if (fs.length === 0) continue;
  const [, dx, dz] = fs[0];
  const idx = dz !== 0 ? x : z;
  if (idx % 3 === 0 || idx % 4 !== 1) continue;

  const ix = x - dx;
  const iz = z - dz;
  if (!cellG.has(key(ix, iz))) continue;
  if (isPerimeter(ix, iz)) continue;
  const igy = groundOf(ix, iz);
  if (igy >= 7) continue;
  g.set(ix, 7, iz, "glowstone");
}

// ---- Pass 4: roof penthouse on the middle of the roof ------------------------
let phOk = true;
for (let x = 4; x <= 7 && phOk; x++) {
  for (let z = 4; z <= 7 && phOk; z++) {
    if (!cellG.has(key(x, z)) || isPerimeter(x, z) || groundOf(x, z) >= 10) {
      phOk = false;
    }
  }
}
if (phOk) {
  for (let x = 4; x <= 7; x++) {
    for (let z = 4; z <= 7; z++) {
      const ring = x === 4 || x === 7 || z === 4 || z === 7;
      if (ring) {
        for (let y = 11; y <= 13; y++) g.set(x, y, z, "white_concrete");
      }
      g.set(x, 14, z, "light_gray_concrete");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
