import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw839833635";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 18, H = 23, D = 23;
const g = new Voxels([W, H, D]);

// Two-storey commercial block, c. 1990s: granite shopfront, tinted glass
// upper storey in white-clad piers, quartz cornice, roof plant.
const TOP = 11;     // parapet block (roof surface sits just above)
const BAND = 5;     // storey line between ground and upper floor
const CORNICE = 10;

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const has = (x, z) => ground.has(key(x, z));

const DIRS = {
  north: [0, -1],
  south: [0, 1],
  west: [-1, 0],
  east: [1, 0],
};
const OPP = { north: "south", south: "north", west: "east", east: "west" };
const FACE_ORDER = ["south", "north", "east", "west"];

function exteriorFaces(x, z) {
  return FACE_ORDER.filter(d => !has(x + DIRS[d][0], z + DIRS[d][1]));
}

// Pick the entrance: on the longest street-facing run, nearest the middle.
let door = null;
{
  let best = Infinity;
  for (const [x, z] of cells) {
    for (const d of exteriorFaces(x, z)) {
      const t = d === "north" || d === "south" ? x : z;
      const mid = d === "north" || d === "south" ? W / 2 : D / 2;
      const score = (d === "south" ? 0 : 100) + Math.abs(t - mid);
      if (score < best) {
        best = score;
        door = { x, z, face: d };
      }
    }
  }
}

function facadeBlocks(y, gr, t, isDoorCell) {
  const odd = t % 2 === 1;
  if (y === TOP) return ["white_concrete"];
  if (y === CORNICE) return ["smooth_quartz"];
  if (y === 9) return ["light_gray_concrete"];
  if (y >= 6 && y <= 8) return odd ? ["light_blue_stained_glass"] : ["white_concrete"];
  if (y === BAND) return ["smooth_quartz"];
  // ground storey
  if (y === gr) return ["polished_granite"];
  if (isDoorCell && (y === gr + 1)) return ["dark_oak_door", "upper"];
  if (isDoorCell && (y === gr)) return ["dark_oak_door", "lower"];
  return odd ? ["glass"] : ["polished_granite"];
}

// 1. Foundations and interior slabs; facade on exterior cells.
for (const [x, z, gr] of cells) {
  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const faces = exteriorFaces(x, z);

  if (faces.length === 0) {
    // interior: floor slabs per storey and a roof deck; air between
    if (gr <= 4) g.set(x, gr, z, "smooth_stone");
    if (BAND >= gr) g.set(x, BAND, z, "smooth_stone");
    g.set(x, TOP, z, "light_gray_concrete");
    // roof plant on a sparse grid
    if ((x * 3 + z * 5) % 11 === 0) {
      g.set(x, TOP + 1, z, "smooth_stone");
      g.set(x, TOP + 2, z, "light_gray_concrete");
    }
    continue;
  }

  const face = faces[0];
  const t = face === "north" || face === "south" ? x : z;
  const isDoorCell = door && door.x === x && door.z === z && faces.includes(door.face);
  const doorFace = isDoorCell ? door.face : null;

  for (let y = gr; y <= TOP; y++) {
    const onDoorFace = isDoorCell && doorFace === face;
    const [id, half] = facadeBlocks(y, gr, t, onDoorFace);
    if (id === "dark_oak_door") {
      g.set(x, y, z, id, {
        facing: doorFace,
        half,
        hinge: "left",
        open: "false",
        powered: "false",
      });
    } else {
      g.set(x, y, z, id);
    }
  }

  // Warm light: glowstone on the interior side of some upper windows.
  if (t % 4 === 1 && gr <= 7) {
    const [dx, dz] = DIRS[OPP[face]];
    const ix = x + dx, iz = z + dz;
    if (has(ix, iz) && exteriorFaces(ix, iz).length === 0) {
      g.set(ix, 7, iz, "glowstone");
    }
  }

  // Corner cells: second exposed face gets piers so the corner reads solid.
  if (faces.length > 1) {
    for (let y = gr; y <= TOP; y++) {
      if (y >= 6 && y <= 8) g.set(x, y, z, "white_concrete");
    }
  }
}

// 2. Entrance canopy: a slab-topped recess is left open; stone surround already set by piers.
// Add a small planter-free forecourt marker: quartz base step at the door cell's ground.
if (door) {
  const cell = cells.find(([x, z]) => x === door.x && z === door.z);
  if (cell) {
    const gr = cell[2];
    g.set(door.x, gr, door.z, "polished_granite");
  }
}

g.save(`${DIR}/${ID}.nbt`);
