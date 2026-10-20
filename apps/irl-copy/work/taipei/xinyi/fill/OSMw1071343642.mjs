import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise two-storey commercial block (c. 1980s Xinyi-style street building):
// stone plinth, white-concrete piers, blue glass bays, grey storey band,
// stone cornice and parapet, red awning over a central street entrance.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1071343642";
const W = 25, H = 23, D = 16;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, b] of cells) ground.set(key(x, z), b);
const has = (x, z) => ground.has(key(x, z));

// Exposed faces of a footprint cell: N = -z (street side), S = +z, W = -x, E = +x
function exposedFaces(x, z) {
  const f = [];
  if (!has(x, z - 1)) f.push("N");
  if (!has(x, z + 1)) f.push("S");
  if (!has(x - 1, z)) f.push("W");
  if (!has(x + 1, z)) f.push("E");
  return f;
}
const isEdge = (x, z) => exposedFaces(x, z).length > 0;

const GLASS = "light_blue_stained_glass";
const PIER = "white_concrete";
const DOOR_X = 13; // entrance on the north (street) face

for (const [x, z, b] of cells) {
  const faces = exposedFaces(x, z);
  const edge = faces.length > 0;

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < b; y++) g.set(x, y, z, "stone_bricks");

  if (!edge) {
    // Interior: floor slabs per storey and roof deck, no interior fit-out
    g.set(x, b, z, "smooth_stone");
    g.set(x, b + 5, z, "light_gray_concrete");
    g.set(x, b + 10, z, "gray_concrete");
    // Roof plant: a few small equipment boxes standing on the roof deck
    if (x % 7 === 3 && z % 5 === 2) g.set(x, b + 11, z, "light_gray_concrete");
    continue;
  }

  const corner = faces.length >= 2;
  const face = faces[0];
  const u = face === "N" || face === "S" ? x : z;
  const pier = corner || u % 3 === 0;

  // Plinth / base course
  g.set(x, b, z, "polished_andesite");

  // Ground storey shopfront (b+1..b+4)
  const isDoorCell = face === "N" && z === 0 && x === DOOR_X && !corner;
  for (let y = b + 1; y <= b + 4; y++) {
    if (pier) {
      g.set(x, y, z, PIER);
    } else if (isDoorCell && y <= b + 2) {
      const half = y === b + 1 ? "lower" : "upper";
      g.set(x, y, z, "dark_oak_door", {
        facing: "south", half, hinge: "left", open: "false", powered: "false",
      });
    } else {
      g.set(x, y, z, GLASS);
    }
  }

  // Red awning over the entrance bay
  if (face === "N" && z === 0 && !corner && x >= DOOR_X - 1 && x <= DOOR_X + 1) {
    g.set(x, b + 4, z, "red_concrete");
  }

  // Storey line between floors
  g.set(x, b + 5, z, "light_gray_concrete");

  // Upper storey windows (b+6..b+9)
  for (let y = b + 6; y <= b + 9; y++) {
    g.set(x, y, z, pier ? PIER : GLASS);
  }

  // Warm light behind some upper windows, in the interior cell just inside
  if (!pier && !corner) {
    const inward = { N: [x, z + 1], S: [x, z - 1], W: [x + 1, z], E: [x - 1, z] }[face];
    const [ix, iz] = inward;
    if ((x + z) % 4 === 0 && has(ix, iz) && !isEdge(ix, iz)) {
      g.set(ix, b + 7, iz, "glowstone");
    }
  }

  // Cornice and parapet
  g.set(x, b + 10, z, "smooth_stone");
  g.set(x, b + 11, z, PIER);
}

g.save(`${DIR}/${ID}.nbt`);
