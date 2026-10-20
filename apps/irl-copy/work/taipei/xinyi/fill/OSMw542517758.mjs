import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542517758";
const W = 18, H = 23, D = 12;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Footprint lookup: key "x,z" -> ground height (absolute y of the cell's ground block)
const ground = new Map();
for (const c of cells) {
  const [x, z, gr] = c;
  ground.set(`${x},${z}`, Math.max(0, Math.round(gr)));
}
const inFp = (x, z) => ground.has(`${x},${z}`);
const groundAt = (x, z) => ground.get(`${x},${z}`);
const isEdge = (x, z) => !inFp(x - 1, z) || !inFp(x + 1, z) || !inFp(x, z - 1) || !inFp(x, z + 1);

// Outward facing direction for an edge cell, street (south, +z) first, then north, east, west.
const FACES = [
  { name: "S", dx: 0, dz: 1 },
  { name: "N", dx: 0, dz: -1 },
  { name: "E", dx: 1, dz: 0 },
  { name: "W", dx: -1, dz: 0 },
];
function outwardFace(x, z) {
  for (const f of FACES) {
    if (!inFp(x + f.dx, z + f.dz)) return f;
  }
  return null;
}
// Index along the facade: x for north/south faces, z for east/west faces.
const alongIndex = (f, x, z) => (f.name === "S" || f.name === "N" ? x : z);

// Foundation: solid from y 0 up to and including each cell's ground.
for (const [x, z, gr0] of cells) {
  const gr = groundAt(x, z);
  for (let y = 0; y <= gr; y++) g.set(x, y, z, "stone_bricks");
}

// Entrance: front (south) edge cell nearest the middle of the street frontage.
const frontCells = [];
for (const [x, z] of cells) {
  if (!isEdge(x, z)) continue;
  const f = outwardFace(x, z);
  if (f && f.name === "S") frontCells.push([x, z]);
}
let doorKey = null;
if (frontCells.length) {
  const xs = frontCells.map(([x]) => x);
  const mid = (Math.min(...xs) + Math.max(...xs)) / 2;
  frontCells.sort((a, b) => Math.abs(a[0] - mid) - Math.abs(b[0] - mid));
  doorKey = `${frontCells[0][0]},${frontCells[0][1]}`;
}

const DOOR_STATE = { facing: "north", hinge: "left", open: "false", powered: "false" };

// Building shell
for (const [x, z] of cells) {
  const gr = groundAt(x, z);
  const edge = isEdge(x, z);

  // Roof deck (interior top slab) and floor deck at the storey line y=5
  if (10 > gr) g.set(x, 10, z, "gray_concrete");
  if (5 > gr) g.set(x, 5, z, "smooth_stone");

  if (!edge) {
    // Roof equipment on the open roof: a few AC units spaced across the deck
    if (((x * 7 + z * 5) % 13) === 0 && x >= 2 && x <= W - 3 && z >= 2 && z <= D - 3) {
      g.set(x, 11, z, "iron_block");
    }
    continue;
  }

  const face = outwardFace(x, z);
  const i = alongIndex(face, x, z);
  const pillar = i % 3 === 0;
  const isFront = face.name === "S";
  const isDoor = doorKey === `${x},${z}`;

  for (let y = gr + 1; y <= 11; y++) {
    let block = null;
    let props = undefined;

    if (y === 11) {
      block = "white_concrete"; // parapet
    } else if (y === 10) {
      block = "light_gray_concrete"; // cornice
    } else if (y === 9) {
      block = "white_concrete"; // upper lintel
    } else if (y === 8 || y === 7) {
      block = pillar ? "white_concrete" : (isFront ? "light_blue_stained_glass" : "light_blue_stained_glass");
    } else if (y === 6) {
      block = "white_concrete"; // upper sill
    } else if (y === 5) {
      block = "light_gray_concrete"; // storey string course
    } else if (y === 4) {
      block = "white_concrete"; // ground storey lintel
    } else if (y === 3 || y === 2) {
      if (isDoor) {
        if (y === 2) {
          block = "dark_oak_door";
          props = { ...DOOR_STATE, half: "upper" };
        } else {
          block = "dark_oak_door";
          props = { ...DOOR_STATE, half: "lower" };
        }
      } else if (isDoor === false && y === 2 && false) {
        block = null;
      } else {
        block = pillar ? "white_concrete" : (isFront ? "glass" : "light_blue_stained_glass");
      }
    } else if (y === 1) {
      if (isDoor) {
        block = "dark_oak_door";
        props = { ...DOOR_STATE, half: "lower" };
      } else {
        block = "stone_bricks"; // base course
      }
    }

    if (block) {
      if (props) g.set(x, y, z, block, props);
      else g.set(x, y, z, block);
    }
  }

  // Door's upper half needs to be at y=2 and the lower at y=1; handled above.
  // Warm lights: glowstone on the inside of some window bays.
  if (!pillar && !isDoor) {
    for (const ly of [2, 7]) {
      if (ly <= gr) continue;
      if (i % 6 !== 1) continue;
      const ix = x - face.dx;
      const iz = z - face.dz;
      if (inFp(ix, iz) && !isEdge(ix, iz)) {
        g.set(ix, ly, iz, "glowstone");
      }
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
