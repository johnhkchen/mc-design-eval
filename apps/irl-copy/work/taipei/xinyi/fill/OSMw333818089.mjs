import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise Xinyi commercial block, c. 1990s: two-storey glazed podium with a
// stone base, light concrete bands, a mullioned curtain wall, recessed
// entrances with doors, a stepped cornice and a flat roof with parapet and plant.
const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const cells = JSON.parse(readFileSync(`${dir}/OSMw333818089.cells.json`, "utf8"));

const W = 113, H = 23, D = 46;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));
const has = (x, z) => ground.has(`${x},${z}`);

const put = (x, y, z, id, st) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (st) g.set(x, y, z, id, st);
  else g.set(x, y, z, id);
};

// Facing name for a horizontal unit vector (direction the front faces).
const FACE = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };

// Storey levels relative to each cell's ground (r):
// 0 base, 1-4 ground floor (shopfront), 5 storey line, 6-9 upper floor,
// 10 cornice, 11 parapet, 12 plant.
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);

  // Foundation up to the cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const edge = !has(x + 1, z) || !has(x - 1, z) || !has(x, z + 1) || !has(x, z - 1);
  const Y = (r) => gr + r;

  if (!edge) {
    // Interior: floor slabs and roof deck, air between.
    put(x, Y(0), z, "smooth_stone");
    put(x, Y(5), z, "smooth_stone");
    put(x, Y(10), z, "gray_concrete");
    continue;
  }

  // ----- Edge (facade) cells -----
  // Inward neighbour direction (toward the footprint interior).
  let dx = 0, dz = 0;
  if (has(x + 1, z)) dx = 1;
  else if (has(x - 1, z)) dx = -1;
  else if (has(x, z + 1)) dz = 1;
  else if (has(x, z - 1)) dz = -1;
  const ix = x + dx, iz = z + dz;
  // Outward direction is the opposite.
  const ox = -dx, oz = -dz;
  const outFace = FACE[`${ox},${oz}`];

  put(x, Y(0), z, "polished_andesite");          // base course
  put(x, Y(5), z, "light_gray_concrete");        // storey line
  put(x, Y(11), z, "white_concrete");            // parapet

  // Stepped cornice: stairs whose low front faces outward.
  if (outFace) {
    put(x, Y(10), z, "smooth_stone_stairs", {
      facing: outFace, half: "bottom", shape: "straight", waterlogged: "false",
    });
  } else {
    put(x, Y(10), z, "light_gray_concrete");
  }

  const along = x + z;
  const entrance = along % 24 < 3;

  // Ground floor: shopfront, mullions, entrance bays with doors.
  for (let r = 1; r <= 4; r++) {
    if (r === 4) {
      put(x, Y(r), z, "light_gray_concrete");   // lintel / canopy band
      continue;
    }
    if (entrance) {
      if (along % 24 === 1 && outFace) {
        if (r === 1) {
          put(x, Y(1), z, "dark_oak_door", {
            facing: outFace, half: "lower", hinge: "left", open: "false",
            powered: "false",
          });
        } else if (r === 2) {
          put(x, Y(2), z, "dark_oak_door", {
            facing: outFace, half: "upper", hinge: "left", open: "false",
            powered: "false",
          });
        } else if (r === 3) {
          put(x, Y(3), z, "lantern", { hanging: "true", waterlogged: "false" });
        }
      }
      continue;
    }
    if (along % 4 === 0) put(x, Y(r), z, "smooth_quartz");   // pier
    else put(x, Y(r), z, "light_blue_stained_glass");
  }

  // Upper floor: curtain wall with light mullions every 3 blocks.
  for (let r = 6; r <= 9; r++) {
    if (along % 3 === 0) put(x, Y(r), z, "light_gray_concrete");
    else put(x, Y(r), z, "light_blue_stained_glass");
  }

  // Warm lights behind some upper-floor windows (air gap inside).
  if ((x * 5 + z * 7) % 29 === 0 && has(ix, iz) && along % 3 !== 0) {
    put(ix, Y(7), iz, "shroomlight");
  }
}

// Roof plant: small units on the deck, a little denser for reading from above.
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const edge = !has(x + 1, z) || !has(x - 1, z) || !has(x, z + 1) || !has(x, z - 1);
  if (!edge && ((x % 13 === 6 && z % 9 === 4) || (x % 17 === 3 && z % 11 === 8))) {
    put(x, gr + 11, z, "iron_block");
    put(x, gr + 12, z, "light_gray_concrete");
  }
}

g.save(`${dir}/OSMw333818089.nbt`);
