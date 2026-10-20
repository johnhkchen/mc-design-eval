import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw538401861";
const W = 21, H = 23, D = 14;

// Footprint cells: [x, z, ground]
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const inF = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => ground.get(`${x},${z}`);

const minG = Math.min(...ground.values());
const maxG = Math.max(...ground.values());

// Two-storey 1970s-80s commercial block: roof about 11 blocks above lowest ground.
const L = minG;
const R = Math.min(Math.max(L + 11, maxG + 6), H - 3); // roof slab level
const S1 = L + 5;                                       // first floor / storey line

const g = new Voxels([W, H, D]);
const set = (x, y, z, b, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p); else g.set(x, y, z, b);
};

// Outward faces: [dx, dz, facing name]
const FACES = {
  n: [0, -1, "north"],
  s: [0, 1, "south"],
  w: [-1, 0, "west"],
  e: [1, 0, "east"],
};
const exteriorFaces = (x, z) =>
  Object.entries(FACES)
    .filter(([, [dx, dz]]) => !inF(x + dx, z + dz))
    .map(([k]) => k);

// Pass 1: foundations, floor slabs, roof, parapet, walls
for (const [x, z, gr] of cells) {
  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) set(x, y, z, "stone_bricks");

  // Interior floor slab at the storey line
  if (S1 >= gr && S1 < R) set(x, S1, z, "smooth_stone");

  // Roof deck
  set(x, R, z, "smooth_stone");

  const fs = exteriorFaces(x, z);
  if (fs.length === 0) continue;

  // Parapet on the perimeter
  set(x, R + 1, z, "light_gray_concrete");

  const corner = fs.length > 1;
  const f = fs[0];
  const [dx, dz] = FACES[f];
  const along = f === "n" || f === "s" ? x : z;
  const inX = x - dx, inZ = z - dz; // interior neighbour

  for (let y = gr; y < R; y++) {
    let b = null, p = null;

    if (corner) {
      // Corner piers run full height
      b = y < S1 ? "smooth_stone" : "light_gray_concrete";
      if (y === R - 1) b = "smooth_stone";
    } else if (y < S1) {
      // Ground floor: shopfront or entrance
      const isDoorCol = f === "n" && along === 10;
      if (y === gr) {
        b = "smooth_stone"; // base course
      } else if (y === S1 - 1) {
        b = "red_concrete"; // shop awning band
      } else if (isDoorCol) {
        if (y <= gr + 1) {
          b = "dark_oak_door";
          p = {
            facing: FACES[f][2],
            half: y === gr ? "lower" : "upper",
            hinge: "left",
            open: "false",
            powered: "false",
          };
        } else {
          b = "light_blue_stained_glass";
        }
      } else if (along % 3 === 0) {
        b = "smooth_stone"; // pier
      } else {
        b = "light_blue_stained_glass";
        // warm light behind some shopfront glass
        if (y === gr + 1 && along % 4 === 1 && inF(inX, inZ)) {
          set(inX, y, inZ, "glowstone");
        }
      }
    } else {
      // Upper storeys
      if (y === S1) {
        b = "white_concrete"; // spandrel at storey line
      } else if (y === R - 1) {
        b = "smooth_stone"; // cornice
      } else if (along % 3 === 0) {
        b = "light_gray_concrete"; // pier / mullion
      } else {
        b = "light_blue_stained_glass_pane"; // window
        if (y === S1 + 2 && along % 3 === 2 && inF(inX, inZ)) {
          set(inX, y, inZ, "glowstone"); // lit room behind glass
        }
      }
    }

    if (b) set(x, y, z, b, p);
  }
}

// Pass 2: roof equipment (plant room and AC units), set after walls
for (let x = 6; x <= 9; x++) {
  for (let z = 5; z <= 8; z++) {
    if (!inF(x, z)) continue;
    set(x, R + 1, z, "light_gray_concrete");
    if (x >= 7 && x <= 8 && z >= 6 && z <= 7) set(x, R + 2, z, "light_gray_concrete");
  }
}
for (const [x, z] of [[14, 3], [15, 3]]) {
  if (inF(x, z)) set(x, R + 1, z, "iron_block");
}

g.save(`${dir}/${id}.nbt`);
