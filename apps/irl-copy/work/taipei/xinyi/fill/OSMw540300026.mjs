import { writeFileSync, readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540300026";
const W = 20, H = 23, D = 10;
const ROOF = 10; // top course; roof sits 11 blocks above lowest ground

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// footprint map: (x,z) -> ground level (clamped)
const gmap = new Map();
for (const [x, z, gr] of cells) {
  gmap.set(`${x},${z}`, Math.max(0, Math.min(ROOF, Math.round(gr))));
}
const has = (x, z) => gmap.has(`${x},${z}`);
const groundAt = (x, z) => gmap.get(`${x},${z}`);

// exterior face of a cell (null = interior); priority north > south > west > east
const faceOf = (x, z) => {
  if (!has(x, z - 1)) return "north";
  if (!has(x, z + 1)) return "south";
  if (!has(x - 1, z)) return "west";
  if (!has(x + 1, z)) return "east";
  return null;
};

// glass pane connections: pane runs along the face it sits in
const pane = (face) => {
  const ns = face === "east" || face === "west";
  return {
    north: ns ? "true" : "false",
    south: ns ? "true" : "false",
    east: ns ? "false" : "true",
    west: ns ? "false" : "true",
    waterlogged: "false",
  };
};

// front door: north-facing cell closest to the middle of the frontage
const northCells = cells.filter(([x, z]) => faceOf(x, z) === "north");
let doorX = 10;
if (northCells.length) {
  doorX = northCells.reduce((best, [x]) => (Math.abs(x - 10) < Math.abs(best - 10) ? x : best), northCells[0][0]);
}

const glows = [];

for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const gr = groundAt(x, z);
  const face = faceOf(x, z);
  const edge = face !== null;

  // foundation below ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
  // ground slab / plinth
  g.set(x, gr, z, edge ? "stone_bricks" : "smooth_stone");

  for (let y = gr + 1; y <= ROOF; y++) {
    const rel = y - gr;

    // roof deck
    if (y === ROOF) {
      g.set(x, y, z, edge ? "light_gray_concrete" : "smooth_stone");
      continue;
    }

    // interior: only floor slab at storey line, air elsewhere
    if (!edge) {
      if (rel === 5) g.set(x, y, z, "smooth_stone");
      continue;
    }

    const idx = face === "north" || face === "south" ? x : z;
    let b = "white_concrete";
    let props = null;

    if (rel === 5) {
      // storey line / cornice band
      b = "light_gray_concrete";
    } else if (rel <= 3) {
      // shopfront
      if (idx % 4 === 0) {
        b = "light_gray_concrete";
      } else if (face === "north" && idx === doorX && rel <= 2) {
        b = "oak_door";
        props = {
          facing: "north",
          half: rel === 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        };
      } else {
        b = "glass_pane";
        props = pane(face);
      }
    } else if (rel === 4) {
      // signband: red on the street front, white elsewhere
      b = face === "north" ? "red_terracotta" : "white_concrete";
    } else {
      // upper storey windows
      if (rel === 6 || rel === 9) {
        b = "white_concrete";
      } else if (idx % 4 === 0 || idx % 4 === 3) {
        b = "light_gray_concrete";
      } else {
        b = "glass_pane";
        props = pane(face);
      }
    }

    if (props) g.set(x, y, z, b, props);
    else g.set(x, y, z, b);

    // warm light behind some upper-floor windows on the street front
    if (face === "north" && rel === 7 && b === "glass_pane" && (idx * 7) % 3 === 0) {
      if (has(x, z + 1) && !faceOf(x, z + 1)) glows.push([x, y, z + 1]);
    }
  }
}

// lights set after the shell so they sit in the air gap behind the glass
for (const [x, y, z] of glows) g.set(x, y, z, "glowstone");

// roof plant: AC boxes and an antenna, only on footprint cells
for (const [x, z] of cells) {
  if (x >= 4 && x <= 6 && z >= 3 && z <= 6) {
    g.set(x, ROOF + 1, z, "light_gray_concrete");
    if (x !== 5) g.set(x, ROOF + 2, z, "white_concrete");
  }
}
if (has(16, 5)) {
  g.set(16, ROOF + 1, 5, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}
if (has(16, 5) || has(15, 5)) {
  g.set(15, ROOF + 1, 5, "light_gray_concrete");
}

g.save(`${DIR}/${ID}.nbt`);
