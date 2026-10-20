import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1174690447";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Footprint 19 x 23, roof about 11 above lowest ground.
// Reads as a two-storey, early-1980s Xinyi-district commercial block:
// white tiled concrete walls, light grey storey bands, dark aluminium-look
// window frames, a red-tiled shop awning, a stone-brick parapet, and a
// central roof plant box. Dusk lighting comes from shroomlights and
// glowstone placed behind some of the glass.
const W = 19, H = 23, D = 23;
const v = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const has = (x, z) => ground.has(key(x, z));
const gOf = (x, z) => ground.get(key(x, z));

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) v.set(x, y, z, id, props);
  else v.set(x, y, z, id);
};

// Outward normals for each face, in the facing vocabulary the game uses.
const FACES = [
  { name: "north", dx: 0, dz: -1 },
  { name: "south", dx: 0, dz: 1 },
  { name: "west", dx: -1, dz: 0 },
  { name: "east", dx: 1, dz: 0 },
];

const missingFaces = (x, z) => FACES.filter(f => !has(x + f.dx, z + f.dz));

// Centre of footprint, used to place the entrance.
let sx = 0, sz = 0;
for (const [x, z] of cells) { sx += x; sz += z; }
const cx = sx / cells.length;
const cz = sz / cells.length;

// Pass 1: solid body for every footprint cell.
for (const [x, z, gr] of cells) {
  // Foundation from y 0 up to the cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");
  // Base course.
  put(x, gr, z, "stone_bricks");
  // Walls, ground storey and upper storey.
  for (let y = gr + 1; y <= gr + 9; y++) put(x, y, z, "white_concrete");
  // Storey floor slabs (light grey bands) and roof deck.
  put(x, gr + 5, z, "light_gray_concrete");
  put(x, gr + 10, z, "light_gray_concrete");

  if (missingFaces(x, z).length > 0) {
    // Cornice and parapet on the perimeter.
    put(x, gr + 10, z, "smooth_stone");
    put(x, gr + 11, z, "stone_bricks");
  }
}

// Pass 2: facade articulation on edge cells, one face at a time.
// Entrance: on the south face, the cell nearest the footprint centre.
let doorCell = null;
for (const [x, z, gr] of cells) {
  const south = missingFaces(x, z).some(f => f.name === "south");
  if (!south) continue;
  if (!doorCell || Math.abs(x - cx) < Math.abs(doorCell.x - cx)) {
    doorCell = { x, z, gr };
  }
}

for (const [x, z, gr] of cells) {
  for (const f of missingFaces(x, z)) {
    const along = (f.name === "north" || f.name === "south") ? x : z;
    const pier = along % 4 === 0;
    const bx = x - f.dx; // inward neighbour (behind the glass)
    const bz = z - f.dz;
    const inwardOk = has(bx, bz);

    // Pier cells keep solid white wall as a column between bays.
    if (pier) continue;

    // Ground storey: shopfront glass with an awning band on top.
    for (let y = gr + 1; y <= gr + 3; y++) {
      put(x, y, z, "light_blue_stained_glass");
      if (inwardOk) put(bx, y, bz, "air");
    }
    put(x, gr + 4, z, "red_terracotta");

    // Upper storey: windows between sill and head courses.
    for (let y = gr + 7; y <= gr + 8; y++) {
      put(x, y, z, "light_blue_stained_glass");
      if (inwardOk) put(bx, y, bz, "air");
    }

    // Warm light behind some windows.
    if (inwardOk) {
      if (along % 8 === 2) {
        put(bx, gr + 7, bz, "shroomlight");
      }
      if (along % 12 === 5) {
        put(bx, gr + 2, bz, "glowstone");
      }
    }
  }
}

// Entrance door on the chosen south-facing cell (overrides glass at ground).
if (doorCell) {
  const { x, z, gr } = doorCell;
  const inwardZ = z - 1;
  put(x, gr + 1, z, "dark_oak_door", {
    facing: "south", half: "lower", hinge: "left", open: "false", powered: "false",
  });
  put(x, gr + 2, z, "dark_oak_door", {
    facing: "south", half: "upper", hinge: "left", open: "false", powered: "false",
  });
  if (has(x, inwardZ)) {
    put(x, gr + 1, inwardZ, "air");
    put(x, gr + 2, inwardZ, "air");
  }
}

// Pass 3: roof plant box on the interior cells near the centre.
for (const [x, z, gr] of cells) {
  const interior = FACES.every(f => has(x + f.dx, z + f.dz));
  if (!interior) continue;
  if (Math.abs(x - cx) <= 1.5 && Math.abs(z - cz) <= 1.5) {
    put(x, gr + 11, z, "light_gray_concrete");
    if (Math.abs(x - Math.round(cx)) === 0 && Math.abs(z - Math.round(cz)) === 0) {
      put(x, gr + 12, z, "smooth_stone");
    }
  }
}

v.save(`${DIR}/${ID}.nbt`);
