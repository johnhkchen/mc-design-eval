import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${dir}/DC58266.cells.json`, "utf8"));

// 1301 New York Ave NW: a mid-rise Class A office block (c. 1980s-90s).
// Stone-faced base, limestone-clad shafts, blue-glass curtain wall with white
// spandrels, a cornice, a stone parapet and a rooftop plant room.
const W = 12, H = 32, D = 21;
const g = new Voxels([W, H, D]);

const C = new Map();
let maxR = 0;
let minZ = Infinity;
let maxZ = -Infinity;
for (const [x, z, gr, roof] of cells) {
  const ground = Math.round(gr);
  const R = Math.min(Math.round(roof), H - 6); // keep room for the plant room
  C.set(`${x},${z}`, { ground, roof: R });
  if (R > maxR) maxR = R;
  if (z < minZ) minZ = z;
  if (z > maxZ) maxZ = z;
}

const has = (x, z) => C.has(`${x},${z}`);
const isPerim = (x, z) => !(has(x - 1, z) && has(x + 1, z) && has(x, z - 1) && has(x, z + 1));
const STOREY = 4;

for (const [x, z] of [...C.keys()].map(k => k.split(",").map(Number))) {
  const { ground, roof: R } = C.get(`${x},${z}`);
  const perim = isPerim(x, z);

  // Foundation: solid stone from y0 up to this cell's ground.
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone_bricks");

  for (let y = ground; y < R; y++) {
    const s = Math.floor((y - ground) / STOREY);
    const r = (y - ground) % STOREY;

    if (!perim) {
      // Interior: air behind the glass, with floor slabs and a roof slab.
      if (y === R - 1) g.set(x, y, z, "smooth_stone");
      else if (s >= 1 && r === 0) g.set(x, y, z, "smooth_stone");
      continue;
    }

    // Perimeter shell.
    if (y === R - 1) {
      g.set(x, y, z, "calcite"); // cornice course
      continue;
    }
    if (s === 0 && r === 0) {
      g.set(x, y, z, "stone_bricks"); // base course
      continue;
    }
    if (r === 0) {
      // Spandrel band; the ground-floor line is a stone course, upper lines white.
      g.set(x, y, z, s === 0 ? "smooth_stone" : "white_concrete");
      continue;
    }

    // Entrance on the street (minimum z) face, ground floor.
    const onStreetFace = z === minZ;
    const isEntrance = onStreetFace && (x === 5 || x === 6) && s === 0;
    if (isEntrance && (r === 1 || r === 2)) {
      g.set(x, y, z, "dark_oak_door", {
        facing: "north",
        half: r === 1 ? "lower" : "upper",
        hinge: x === 5 ? "left" : "right",
        open: "false",
        powered: "false",
      });
      continue;
    }
    if (isEntrance && r === 3) {
      g.set(x, y, z, "calcite"); // lintel over the door
      continue;
    }
    // Pilasters framing the entrance bay, so the door reads from the street.
    if (onStreetFace && s === 0 && (x === 4 || x === 7)) {
      g.set(x, y, z, "calcite");
      continue;
    }

    // Curtain wall: mullions every third bay along the face, glass between.
    // Index along the face only, so corners do not produce diagonal artifacts.
    const onZFace = z === minZ || z === maxZ;
    const idx = onZFace ? x : z;
    if (idx % 3 === 0) {
      g.set(x, y, z, "calcite");
    } else if (r === 2 && s >= 1 && (x * 5 + z * 3 + s) % 13 === 0) {
      // Sparse lit offices, one window in a dozen or so.
      g.set(x, y, z, "glowstone");
    } else {
      g.set(x, y, z, "light_blue_stained_glass");
    }
  }

  // Parapet ring on the perimeter, one block above the cornice.
  if (perim && R < H) g.set(x, R, z, "stone_bricks");

  // Rooftop plant room on the tallest cells, set back from the parapet.
  if (R === maxR && x >= 3 && x <= 8 && z >= 5 && z <= 15 && R + 3 < H) {
    const edge = x === 3 || x === 8 || z === 5 || z === 15;
    for (let y = R; y <= R + 2; y++) {
      g.set(x, y, z, edge ? "calcite" : "light_blue_stained_glass");
    }
    g.set(x, R + 3, z, "smooth_stone");
  }
}

g.save(`${dir}/DC58266.nbt`);
