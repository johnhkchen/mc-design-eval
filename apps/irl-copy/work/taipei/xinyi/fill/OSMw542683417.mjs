// Two-storey 1970s-80s Taipei commercial block: cream tile walls, concrete piers,
// a shopfront on the ground storey, two storeys of glazed bays, and a flat roof
// with a parapet and one rooftop plant box. Roof surface sits 11 blocks above the
// lowest ground.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw542683417";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

const W = 14, H = 23, D = 9;
const g = new Voxels([W, H, D]);

const gmap = new Map();
for (const [x, z, gy] of cells) gmap.set(`${x},${z}`, gy);
const has = (x, z) => gmap.has(`${x},${z}`);

const L0 = Math.min(...cells.map((c) => c[2]));   // lowest ground = y 0 reference for storeys
const TOP = L0 + 10;                              // roof deck block; roof surface at L0+11

// outward faces: dx/dz point out of the building, n is the facing name
const FACES = [
  { n: "north", dx: 0, dz: -1 },
  { n: "south", dx: 0, dz: 1 },
  { n: "west", dx: -1, dz: 0 },
  { n: "east", dx: 1, dz: 0 },
];
const exteriorFaces = (x, z) => FACES.filter((f) => !has(x + f.dx, z + f.dz));

const put = (x, y, z, b, p) => {
  if (y < 0 || y >= H || x < 0 || x >= W || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

// Pick the entrance: prefer an exterior south face, nearest the middle of the front.
const candidates = [];
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  for (const f of exteriorFaces(x, z)) {
    candidates.push({ x, z, f, u: f.dx !== 0 ? z : x });
  }
}
const midX = (W - 1) / 2;
let door = null;
if (candidates.length) {
  const south = candidates.filter((c) => c.f.dz === 1);
  const pool = south.length ? south : candidates;
  const ref = south.length ? midX : 0;
  pool.sort((a, b) => Math.abs(a.x - ref) - Math.abs(b.x - ref));
  door = pool[0];
}
const isDoor = (x, z) => door && door.x === x && door.z === z;

// 1. Foundation: solid from y 0 up to each cell's ground.
for (const [x, z, gy] of cells) {
  for (let y = 0; y < gy; y++) put(x, y, z, "stone_bricks");
}

// 2. Walls, storey lines, windows, roof deck and parapet.
for (const [x, z, gy] of cells) {
  const faces = exteriorFaces(x, z);
  const perim = faces.length > 0;
  const face = faces[0];

  for (let y = gy; y <= TOP; y++) {
    const off = y - L0;

    if (perim) {
      const u = face.dx !== 0 ? z : x;
      const inX = x - face.dx, inZ = z - face.dz;
      const inwardInterior = has(inX, inZ) && !exteriorFaces(inX, inZ).length;

      if (off === 0) {
        put(x, y, z, "polished_andesite");                     // base course
      } else if (off <= 4) {                                   // ground storey: shopfront
        if (isDoor(x, z) && (off === 1 || off === 2)) {
          put(x, y, z, "dark_oak_door", {
            facing: door.f.n,
            half: off === 1 ? "lower" : "upper",
            hinge: "left",
            open: "false",
            powered: "false",
          });
        } else if (off === 4) {
          put(x, y, z, "white_concrete");                      // transom band
        } else if (u % 3 === 0) {
          put(x, y, z, "white_concrete");                      // pier
        } else {
          put(x, y, z, "glass");                               // shop glazing
        }
      } else if (off === 5) {
        put(x, y, z, "polished_andesite");                     // storey line
      } else if (off >= 6 && off <= 8) {                       // upper storey: glazed bays
        const isWin = u % 3 === 1;
        put(x, y, z, isWin ? "light_blue_stained_glass" : "white_concrete");
        if (isWin && off === 7 && (u % 6 === 1) && inwardInterior) {
          put(inX, y, inZ, "glowstone");                       // warm light behind glass
        }
      } else if (off === 9) {
        put(x, y, z, "white_concrete");                        // window head
      } else if (off === 10) {
        put(x, y, z, "smooth_stone");                          // cornice / roof edge
      } else if (off === 11) {
        put(x, y, z, "white_concrete");                        // parapet
      }
    } else {
      // interior: floor slabs only, air elsewhere (no interiors)
      if (off === 0 || off === 5 || off === 10) put(x, y, z, "smooth_stone");
    }
  }
}

// 3. Rooftop plant box on the deck, in the middle of the roof.
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  if (exteriorFaces(x, z).length) continue;
  if (x >= 4 && x <= 6 && z >= 3 && z <= 5) {
    put(x, L0 + 11, z, "light_gray_concrete");
  }
}

g.save(`${dir}/${id}.nbt`);
