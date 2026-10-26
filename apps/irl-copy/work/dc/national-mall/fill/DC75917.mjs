// DC75917, 429 O Street NW: a 1920s Classical-Revival brick office block. Three storeys over a stone plinth,
// calcite bands and cornice; a northern ell at four storeys' worth of roof (two storeys) and a one-storey NE wing;
// a recessed south front with a central double door under a canopy. Lidar roof heights are followed cell by cell,
// with each tier standing on the ground and built up in full.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const FILL = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${FILL}/DC75917.cells.json`, "utf8"));   // [x, z, ground, roof] per footprint cell

const W = 22, D = 16, H = 19;
const top = Array.from({ length: W }, () => Array(D).fill(0));      // lidar roof height above y 0 (0 = outside the footprint)
const ground = Array.from({ length: W }, () => Array(D).fill(0));
for (const [x, z, g, r] of cells) { ground[x][z] = g; top[x][z] = r; }

const BRICK = "bricks", STONE = "calcite", BASE = "stone_bricks", ROOF = "gray_concrete", FLOOR = "stone", CAP = "smooth_stone";
const DIRS = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] };
const inF = (x, z) => x >= 0 && z >= 0 && x < W && z < D && top[x][z] > 0;
const outward = (x, z) => Object.keys(DIRS).filter((d) => !inF(x + DIRS[d][0], z + DIRS[d][1]));
// a shell cell faces the street or a neighbour at another roof height (a tier seam): solid walls, never open air
const shell = (x, z) => outward(x, z).length > 0
  || Object.values(DIRS).some(([dx, dz]) => inF(x + dx, z + dz) && top[x + dx][z + dz] !== top[x][z]);

const DOOR = [9, 10];
const v = new Voxels([W, H, D]);

for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  const T = top[x][z]; if (!T) continue;
  for (let y = 0; y < ground[x][z]; y++) v.set(x, y, z, BASE);       // foundation up to the ground (none here: the lot is level)
  if (shell(x, z)) wall(x, z, T); else room(x, z, T);
}

// The south entrance: a double door under a canopy on two columns, with lanterns hanging beneath it.
for (const x of [8, 11]) { v.set(x, 0, 15, STONE); v.set(x, 1, 15, STONE); }
for (const x of [8, 9, 10, 11]) v.set(x, 2, 15, CAP);
v.set(9, 1, 15, "lantern", { hanging: "true", waterlogged: "false" });
v.set(10, 1, 15, "lantern", { hanging: "true", waterlogged: "false" });

// Roof plant on the main roof, one block high on the roof slab.
for (const [x, z] of [[16, 9], [17, 9], [16, 10], [17, 10], [3, 10], [4, 10]]) v.set(x, 7, z, "stone_bricks");

// Interior: no furniture, an air gap behind each window, a floor slab per storey, and the roof slab on top.
function room(x, z, T) {
  if (T >= 6) v.set(x, 2, z, FLOOR);
  if (T === 7) v.set(x, 4, z, FLOOR);
  v.set(x, T === 2 || T === 7 ? T - 1 : T - 2, z, ROOF);
}

// Walls: plinth, storey bands, cornice, quoins at corners, glass in window bays on the outside faces.
function wall(x, z, T) {
  const out = outward(x, z), seam = out.length === 0, corner = out.length > 1, face = out[0];
  const winRows = { 2: [0], 4: [1], 6: [1, 3], 7: [1, 3, 5] }[T];
  const [dx, dz] = face ? DIRS[face] : [0, 0];
  const c = face === "N" || face === "S" ? x : z;                    // position along the facade: piers every third cell
  const [ix, iz] = [x - dx, z - dz];
  const windowed = !seam && !corner && face && c % 3 !== 0 && inF(ix, iz) && !shell(ix, iz);
  const glass = face === "N" || face === "S"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

  for (let y = 0; y < T; y++) {
    if (face === "S" && z === 14 && DOOR.includes(x) && y < 2) {
      v.set(x, y, z, "dark_oak_door", { facing: "south", half: y ? "upper" : "lower", hinge: x === 9 ? "left" : "right", open: "false", powered: "false" });
      continue;
    }
    if (windowed && winRows.includes(y)) {
      v.set(x, y, z, "glass_pane", glass);
      // a warm light behind a few panes (about one in six)
      if ((x + z + y) % 6 === 0) v.set(ix, y, iz, "glowstone");
      continue;
    }
    let b = BRICK;
    if (y === T - 1) b = STONE;                                         // cornice / parapet course
    else if (T >= 4 && y === 0) b = BASE;                               // plinth
    else if (T >= 4 && (y === 2 || y === 4)) b = STONE;                 // storey bands
    if (corner) b = STONE;                                              // quoins
    v.set(x, y, z, b);
  }
}

v.save(`${FILL}/DC75917.nbt`);
