import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538121668";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// 11 x 23 x 12: x 0..10, y 0..22, z 0..11
const W = 11, H = 23, D = 12;
const g = new Voxels([W, H, D]);

// Era: 1970s-80s Taipei mid-rise commercial block. Concrete frame, white
// tiled walls, aluminium-framed glass, shopfront on the street (south) face,
// two storeys of offices/shops above a shopfront storey, plain parapet and
// a rooftop plant room.
const FLOOR_BELT = 5;     // storey line between the two upper storeys
const ROOF_DECK = 10;     // roof deck / cornice band
const PARAPET = 11;       // parapet course (top of building)
const WALL_TOP = 9;

const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);
const has = (x, z) => G.has(`${x},${z}`);
const groundAt = (x, z) => G.get(`${x},${z}`);

// Exterior faces of a footprint cell. t = position along that face (used for bay rhythm).
function faces(x, z) {
  const f = [];
  if (!has(x, z - 1)) f.push({ d: "n", t: x });
  if (!has(x, z + 1)) f.push({ d: "s", t: x });
  if (!has(x - 1, z)) f.push({ d: "w", t: z });
  if (!has(x + 1, z)) f.push({ d: "e", t: z });
  return f;
}
// Step from a face cell toward the building interior.
const inward = { n: [0, 1], s: [0, -1], w: [1, 0], e: [-1, 0] };

// Pass 1: foundations, floors, walls, shopfront, windows, roof.
for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  // Cells at or above the roof line get no body.
  if (gr >= ROOF_DECK) continue;

  const f = faces(x, z);

  // Interior cell: floor slab at storey line, roof deck on top, air between.
  if (f.length === 0) {
    if (gr <= FLOOR_BELT) g.set(x, FLOOR_BELT, z, "white_concrete");
    g.set(x, ROOF_DECK, z, "light_gray_concrete");
    continue;
  }

  // Perimeter cell.
  const sFace = f.find((q) => q.d === "s");
  const allOdd = f.every((q) => q.t % 2 === 1); // bay centre -> window, else pier
  // Perimeter cells carry the cornice and parapet.
  for (let y = gr; y <= PARAPET; y++) {
    let b = "white_concrete";
    let props;

    if (y <= 4) {
      // Ground storey: shopfront on the street face, plain windows elsewhere.
      if (sFace && x >= 1 && x <= 9) {
        if (x === 5 && y <= gr + 1) {
          // Entrance door, centred on the street face.
          b = "iron_door";
          props = {
            facing: "south",
            half: y === gr ? "lower" : "upper",
            hinge: "left",
            open: "false",
            powered: "false",
          };
        } else if (y <= gr + 2) {
          b = "light_blue_stained_glass";
        } else {
          b = "black_concrete"; // canopy / lintel band over the shopfront
        }
      } else if (y >= gr + 1 && y <= gr + 2 && allOdd) {
        b = "light_blue_stained_glass_pane";
      }
    } else if (y === FLOOR_BELT) {
      b = "light_gray_concrete"; // belt course
    } else if (y >= 6 && y <= 8) {
      if (allOdd) b = "light_blue_stained_glass_pane";
    } else if (y === ROOF_DECK) {
      b = "smooth_stone"; // cornice
    } else if (y === PARAPET) {
      b = "white_concrete";
    }

    if (b === "white_concrete" && y === FLOOR_BELT) b = "light_gray_concrete";
    g.set(x, y, z, b, props);
  }
  // Perimeter cells also need their own roof deck cap so the parapet stands on it.
  // (The cornice at ROOF_DECK already closes the ring.)
}

// Pass 2: warm lights behind some upper-storey windows (in the air gap).
for (const [x, z, gr] of cells) {
  const f = faces(x, z);
  if (f.length === 0 || gr >= ROOF_DECK) continue;
  if (!f.every((q) => q.t % 2 === 1)) continue;
  if (!f.some((q) => q.t % 4 === 1)) continue;
  const q = f[0];
  const [dx, dz] = inward[q.d];
  const ix = x + dx, iz = z + dz;
  if (has(ix, iz) && groundAt(ix, iz) <= 6 && faces(ix, iz).length === 0) {
    g.set(ix, 7, iz, "glowstone");
  }
}

// Pass 3: rooftop plant room, water tank, and a lightning rod.
for (const [x, z, gr] of cells) {
  if (gr > ROOF_DECK - 1) continue;
  if (faces(x, z).length !== 0) continue; // roof equipment sits on interior cells only
  if (x >= 2 && x <= 4 && z >= 2 && z <= 5) {
    g.set(x, 11, z, "smooth_quartz");
    g.set(x, 12, z, "smooth_quartz");
  }
  if (x >= 7 && x <= 8 && z >= 1 && z <= 2) {
    for (let y = 11; y <= 13; y++) g.set(x, y, z, "iron_block");
  }
  if (x === 5 && z === 4) {
    for (let y = 11; y <= 14; y++) g.set(x, y, z, "lightning_rod");
  }
}

g.save(`${DIR}/${ID}.nbt`);
