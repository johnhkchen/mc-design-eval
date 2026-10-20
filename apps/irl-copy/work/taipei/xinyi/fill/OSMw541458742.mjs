import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541458742";
const W = 11, H = 23, D = 16;
const ROOF_TOP = 11;            // parapet top, ~11 blocks above lowest ground
const DECK = 10;                // roof deck / second-floor ceiling
const FLOOR1 = 5;               // storey line between storeys

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));
const has = (x, z) => ground.has(`${x},${z}`);
const G = (x, z) => ground.get(`${x},${z}`);

const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const edgeFaces = (x, z) =>
  Object.keys(DIRS).filter((k) => {
    const [dx, dz] = DIRS[k];
    return !has(x + dx, z + dz);
  });

const g = new Voxels([W, H, D]);

const put = (x, y, z, id, p) => {
  if (!has(x, z)) return;
  if (y < G(x, z) || y > ROOF_TOP || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// ---- pass 1: foundations, floors, deck, facade ----
for (const [x, z] of [...ground.keys()].map((k) => k.split(",").map(Number))) {
  const gr = G(x, z);
  const faces = edgeFaces(x, z);

  // foundation solid up to this cell's ground
  for (let y = 0; y < gr && y < H; y++) g.set(x, y, z, "stone_bricks");

  // interior floor slabs and roof deck (stand on what is below)
  put(x, gr, z, "light_gray_concrete");
  put(x, FLOOR1, z, "light_gray_concrete");
  put(x, DECK, z, "light_gray_concrete");

  if (faces.length === 0) continue;

  const corner = faces.length > 1;
  const face = faces[0];
  const along = face === "north" || face === "south" ? x : z;
  const pier = corner || along % 3 === 0;
  const zFace = face === "north" || face === "south";

  for (let y = gr; y <= ROOF_TOP; y++) {
    let id = "smooth_quartz";
    let p;

    if (y === ROOF_TOP) {
      id = "smooth_quartz"; // parapet
    } else if (y === DECK) {
      id = "light_gray_concrete"; // cornice band
    } else if (pier) {
      id = "quartz_pillar";
      p = { axis: "y" };
    } else if (y === gr) {
      id = "polished_andesite"; // base course
    } else if (y === FLOOR1) {
      id = "light_gray_concrete"; // storey line
    } else if (y === 4 || y === 6 || y === 9) {
      id = "light_gray_concrete"; // lintels and sills
    } else if ((y >= gr + 1 && y <= 3) || y === 7 || y === 8) {
      // window glass, some lit warm from behind
      const lit = (y === 7 && (along * 2 + 3) % 7 === 0) || (y <= 3 && (along + y) % 4 === 0 && y > gr);
      if (lit) {
        id = "shroomlight";
      } else {
        id = "light_blue_stained_glass_pane";
        p = zFace
          ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
          : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
      }
    }

    if (p) g.set(x, y, z, id, p);
    else g.set(x, y, z, id);
  }
}

// ---- pass 2: entrance on the street (north) face ----
const frontCells = [...ground.keys()]
  .map((k) => k.split(",").map(Number))
  .filter(([x, z]) => {
    const f = edgeFaces(x, z);
    return f.length === 1 && f[0] === "north";
  })
  .sort((a, b) => a[0] - b[0]);

if (frontCells.length) {
  const [dx, dz] = frontCells[Math.floor(frontCells.length / 2)];
  const gr = G(dx, dz);
  if (gr + 2 <= 4) {
    g.set(dx, gr + 1, dz, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    g.set(dx, gr + 2, dz, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  }
}

// ---- pass 3: roof equipment on the deck ----
const eqBoxes = [[3, 4, 4, 5], [6, 7, 9, 10]];
for (const [x0, x1, z0, z1] of eqBoxes) {
  for (let x = x0; x <= x1; x++) {
    for (let z = z0; z <= z1; z++) {
      if (!has(x, z)) continue;
      if (edgeFaces(x, z).length) continue;
      if (G(x, z) > DECK) continue;
      g.set(x, ROOF_TOP, z, "iron_block");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
