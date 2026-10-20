import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw1071343891";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

const W = 22, H = 23, D = 13;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const cellMap = new Map();
for (const [x, z, gr] of cells) cellMap.set(key(x, z), gr);

const minG = Math.min(...cells.map((c) => c[2]));

// Faces on which a cell has no neighbour in the footprint (outward faces)
function outwardFaces(x, z) {
  const f = [];
  if (!cellMap.has(key(x, z - 1))) f.push("N"); // street frontage (Xinyi-style north edge)
  if (!cellMap.has(key(x, z + 1))) f.push("S");
  if (!cellMap.has(key(x - 1, z))) f.push("W");
  if (!cellMap.has(key(x + 1, z))) f.push("E");
  return f;
}

// Index of a cell along its face (x for N/S faces, z for E/W faces)
function alongIndex(x, z, face) {
  return face === "N" || face === "S" ? x : z;
}

// Street door: middle of the north (street) frontage
const northCells = cells
  .filter(([x, z]) => outwardFaces(x, z).includes("N"))
  .sort((a, b) => a[0] - b[0]);
const doorCell = northCells.length
  ? northCells[Math.floor(northCells.length / 2)]
  : null;
const doorKey = doorCell ? key(doorCell[0], doorCell[1]) : null;

const insideOffset = {
  N: [0, 1],
  S: [0, -1],
  W: [1, 0],
  E: [-1, 0],
};

const FOUNDATION = "gray_concrete";
const BASE = "stone_bricks";
const WALL = "white_concrete";
const BAND = "light_gray_concrete";
const GLASS = "light_blue_stained_glass";
const ROOF = "smooth_stone";

const lampCells = []; // [x, z, face] for glowstone placement after the loop

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr && y < H; y++) g.set(x, y, z, FOUNDATION);

  const faces = outwardFaces(x, z);
  const perimeter = faces.length > 0;
  const face = faces[0] ?? null;
  const idx = face ? alongIndex(x, z, face) : 0;
  const isDoor = doorKey === key(x, z);

  for (let rel = 0; rel <= 11; rel++) {
    const y = minG + rel;
    if (y < gr || y >= H) continue;

    // Interior: only floor/roof slabs, air elsewhere (no interiors)
    if (!perimeter) {
      if (rel === 0) g.set(x, y, z, ROOF);
      else if (rel === 5) g.set(x, y, z, BAND);
      else if (rel === 10) g.set(x, y, z, ROOF);
      continue;
    }

    // Perimeter shell
    if (rel === 0) {
      g.set(x, y, z, BASE);
    } else if (rel >= 1 && rel <= 3) {
      if (face === "N" && isDoor) {
        if (rel === 1) {
          g.set(x, y, z, "dark_oak_door", {
            facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
          });
        } else if (rel === 2) {
          g.set(x, y, z, "dark_oak_door", {
            facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
          });
        } else {
          g.set(x, y, z, BAND); // lintel over entrance
        }
      } else if (idx % 4 === 0) {
        g.set(x, y, z, WALL); // shopfront piers
      } else {
        g.set(x, y, z, GLASS);
      }
    } else if (rel === 4) {
      g.set(x, y, z, WALL); // transom
    } else if (rel === 5) {
      g.set(x, y, z, BAND); // storey line
    } else if (rel === 6) {
      g.set(x, y, z, BAND); // upper sill
    } else if (rel === 7 || rel === 8) {
      if (idx % 3 === 0) g.set(x, y, z, WALL); // window mullions
      else g.set(x, y, z, GLASS);
    } else if (rel === 9) {
      g.set(x, y, z, WALL); // window head
    } else if (rel === 10) {
      g.set(x, y, z, BAND); // cornice
    } else if (rel === 11) {
      g.set(x, y, z, WALL); // parapet
    }
  }

  // Lamps behind selected upper-storey windows
  if (perimeter && face) {
    const yLamp = minG + 7;
    if (yLamp >= gr && yLamp < H && idx % 3 === 1 && idx % 6 === 1) {
      lampCells.push([x, z, face]);
    }
  }
}

// Glowstone one step inside the glass, only where that cell is interior
for (const [x, z, face] of lampCells) {
  const [dx, dz] = insideOffset[face];
  const ix = x + dx, iz = z + dz;
  const ik = key(ix, iz);
  if (!cellMap.has(ik)) continue;
  if (outwardFaces(ix, iz).length > 0) continue;
  const gr = cellMap.get(ik);
  const y = minG + 7;
  if (y >= gr && y < H) g.set(ix, y, iz, "glowstone");
}

// Rooftop plant room, set back from the parapet
for (const [x, z, gr] of cells) {
  if (outwardFaces(x, z).length > 0) continue;
  if (x < 6 || x > 14 || z < 4 || z > 8) continue;
  const y = minG + 11;
  if (y >= gr && y < H) g.set(x, y, z, BAND);
}

g.save(`${dir}/${id}.nbt`);
