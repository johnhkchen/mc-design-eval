import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1339253355";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 9, H = 19, D = 13;
const ROOF_Y = 6;   // roof surface at y=6, top of building = 7 blocks above lowest ground
const BELT_Y = 3;   // storey line between ground and upper floor
const WIN_TOP = 5;  // top of upper-floor windows

const key = (x, z) => `${x},${z}`;
const G = new Map();
for (const [x, z, gr] of cells) G.set(key(x, z), gr);
const has = (x, z) => G.has(key(x, z));

// Exterior faces: direction vectors and their outward names
const FACES = [
  { dx: 0, dz: -1, name: "north", along: "x" },
  { dx: 0, dz: 1, name: "south", along: "x" },
  { dx: -1, dz: 0, name: "west", along: "z" },
  { dx: 1, dz: 0, name: "east", along: "z" },
];

const exteriorFaces = (x, z) => FACES.filter((f) => !has(x + f.dx, z + f.dz));
const isExterior = (x, z) => has(x, z) && exteriorFaces(x, z).length > 0;

const g = new Voxels([W, H, D]);

// Street frontage = north face (lowest z); pick the door cell nearest the middle of that frontage
const northCells = cells.filter(([x, z]) => !has(x, z - 1)).map(([x]) => x).sort((a, b) => a - b);
const doorX = northCells.length ? northCells[Math.floor(northCells.length / 2)] : null;
const doorZ = cells.filter(([x]) => x === doorX).map(([, z]) => z).sort((a, b) => a - b)[0];

const glassFor = (face) =>
  face.along === "x"
    ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Pass 1: foundations, floors, storey line, roof
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
  if (gr < H) g.set(x, gr, z, "smooth_stone");                      // ground floor slab
  if (gr < BELT_Y) g.set(x, BELT_Y, z, "smooth_stone");              // upper floor slab
  if (gr <= ROOF_Y) {
    if (isExterior(x, z)) {
      g.set(x, ROOF_Y, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" }); // cornice / parapet cap
    } else {
      g.set(x, ROOF_Y, z, "gray_concrete");                          // roof deck
    }
  }
}

// Pass 2: exterior shell with base course, belt course, shopfront, windows
for (const [x, z, gr] of cells) {
  if (!isExterior(x, z)) continue;
  const faces = exteriorFaces(x, z);
  const face = faces[0];
  for (let y = gr; y <= WIN_TOP; y++) {
    if (y === gr) {
      g.set(x, y, z, "stone_bricks");                                // base course
    } else if (y === BELT_Y) {
      g.set(x, y, z, "stone_bricks");                                // storey belt
    } else if (y < BELT_Y) {
      // ground floor: shopfront glass
      if (face.name === "north" && x === doorX && z === doorZ) continue; // door handled below
      g.set(x, y, z, "glass_pane", glassFor(face));
    } else {
      // upper floors: window grid alternating glass and wall
      const along = face.along === "x" ? x : z;
      if (along % 2 === 0) {
        g.set(x, y, z, "glass_pane", glassFor(face));
      } else {
        g.set(x, y, z, "white_concrete");
      }
    }
  }
  // Where the cell's wall is solid (not a pane), keep it white concrete
  for (let y = gr; y <= WIN_TOP; y++) {
    if (y === gr || y === BELT_Y) continue;
  }
}

// Warm light behind some upper windows (glowstone in the air gap just inside the shell)
for (const [x, z, gr] of cells) {
  if (!isExterior(x, z)) continue;
  const face = exteriorFaces(x, z)[0];
  const along = face.along === "x" ? x : z;
  if (along % 4 !== 0) continue;
  const ix = x - face.dx, iz = z - face.dz;
  if (!has(ix, iz) || isExterior(ix, iz)) continue;
  if (4 < gr) continue;
  g.set(ix, 4, iz, "glowstone");
}

// Lanterns in the ground-floor shopfront air gap for dusk glow
for (const [x, z, gr] of cells) {
  if (!isExterior(x, z)) continue;
  const face = exteriorFaces(x, z)[0];
  const along = face.along === "x" ? x : z;
  if (along % 3 !== 1) continue;
  const ix = x - face.dx, iz = z - face.dz;
  if (!has(ix, iz) || isExterior(ix, iz)) continue;
  const y = gr + 1;
  if (y < BELT_Y) g.set(ix, y, iz, "lantern", { hanging: "false", waterlogged: "false" });
}

// Entrance: dark oak door on the street frontage with a light above
if (doorX !== null && doorZ !== undefined) {
  const dg = G.get(key(doorX, doorZ));
  g.set(doorX, dg + 1, doorZ, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(doorX, dg + 2, doorZ, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  const li = doorX, lz = doorZ + 1;
  if (has(li, lz) && !isExterior(li, lz)) g.set(li, dg + 2, lz, "lantern", { hanging: "true", waterlogged: "false" });
}

// Roof equipment: one plant box and a small mechanical unit on the roof deck
const interior = cells.filter(([x, z]) => !isExterior(x, z));
if (interior.length) {
  const [mx, mz, mg] = interior[Math.floor(interior.length / 2)];
  if (mg <= ROOF_Y) g.set(mx, ROOF_Y + 1, mz, "iron_block");
}
const corner = cells.find(([x, z]) => !has(x - 1, z) && !has(x, z - 1));
if (corner && corner[2] <= ROOF_Y) g.set(corner[0], ROOF_Y + 1, corner[1], "light_gray_concrete");

g.save(`${DIR}/${ID}.nbt`);
