import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Two-storey Taipei shophouse-style commercial block, c. 1980s–90s:
// white concrete frame, quartz belt courses, stone-brick plinth,
// shopfront glass on the ground storey, tinted glass above, flat roof
// with parapet and rooftop plant. Roof top at 11 blocks above lowest ground.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538459499";
const W = 16, H = 23, D = 25;

const FLOOR2_Y = 5;   // upper floor slab / belt course
const WIN_LO_1 = 1, WIN_HI_1 = 3;   // ground storey glazing band
const WIN_LO_2 = 6, WIN_HI_2 = 8;   // upper storey glazing band
const LINTEL_Y = 9;
const ROOF_Y = 10;    // roof slab (top surface at 11)
const PARAPET_Y = 11; // parapet course on the perimeter

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const lowest = Math.min(...raw.map(([, , gy]) => gy));
const ground = new Map();
for (const [x, z, gy] of raw) ground.set(`${x},${z}`, gy - lowest);

const has = (x, z) => ground.has(`${x},${z}`);
const DIRS = { west: [-1, 0], east: [1, 0], north: [0, -1], south: [0, 1] };
const OPP = { west: "east", east: "west", north: "south", south: "north" };

const outwardOf = (x, z) =>
  Object.entries(DIRS)
    .filter(([, [dx, dz]]) => !has(x + dx, z + dz))
    .map(([n]) => n);

// Facade axis coordinate: x along north/south faces, z along east/west faces.
const uOf = (x, z, face) => (face === "north" || face === "south" ? x : z);

const vox = new Voxels([W, H, D]);

// Pick a single front entrance: centre cell of the south face (fallbacks follow).
const entrance = new Map(); // key -> face
let entranceKey = null;
for (const face of ["south", "north", "east", "west"]) {
  const list = [];
  for (const [key] of ground) {
    const [x, z] = key.split(",").map(Number);
    const out = outwardOf(x, z);
    if (out.length === 1 && out[0] === face) list.push({ x, z, u: uOf(x, z, face) });
  }
  if (list.length) {
    list.sort((a, b) => a.u - b.u);
    const mid = list[Math.floor(list.length / 2)];
    entranceKey = `${mid.x},${mid.z}`;
    break;
  }
}

for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const out = outwardOf(x, z);
  const isEdge = out.length > 0;
  const isCorner = out.length > 1;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) vox.set(x, y, z, "stone_bricks");

  if (!isEdge) {
    // Interior: no interior fit-out, only floor slabs and the roof deck.
    if (gr <= FLOOR2_Y) vox.set(x, FLOOR2_Y, z, "stone");
    if (gr <= ROOF_Y) vox.set(x, ROOF_Y, z, "stone");
    // Rooftop plant: a few condenser blocks on the roof.
    if (x % 5 === 2 && z % 6 === 3 && gr <= ROOF_Y) {
      vox.set(x, PARAPET_Y, z, "iron_block");
    }
    // Warm light behind the upper-storey window of an adjacent facade (below).
    continue;
  }

  const face = out[0];
  const u = uOf(x, z, face);
  const inward = OPP[face];
  const [idx, idz] = [x + DIRS[inward][0], z + DIRS[inward][1]];
  const hasInner = has(idx, idz);
  const isEntrance = key === entranceKey;
  const winCol = !isCorner && u % 3 === 1;

  for (let y = gr; y <= PARAPET_Y; y++) {
    let mat = "white_concrete";
    let glass = null;

    if (y === gr) {
      mat = "stone_bricks";                        // plinth / base course
    } else if (y === PARAPET_Y) {
      mat = "white_concrete";                      // parapet
    } else if (y === ROOF_Y) {
      mat = "quartz_slab";                         // cornice
    } else if (y === FLOOR2_Y) {
      mat = "quartz_slab";                         // storey belt course
    } else if (y === LINTEL_Y) {
      mat = "white_concrete";
    } else if (y >= WIN_LO_1 && y <= WIN_HI_1 && y > gr) {
      if (isEntrance) continue;                    // open entrance
      if (winCol) glass = "light_blue_stained_glass_pane";
    } else if (y >= WIN_LO_2 && y <= WIN_HI_2) {
      if (winCol) glass = "cyan_stained_glass_pane";
    }

    if (glass) vox.set(x, y, z, glass);
    else vox.set(x, y, z, mat);
  }

  // Warm lights behind glass on the inward side (inside the air gap).
  if (hasInner && winCol && u % 6 === 1) {
    const inGr = ground.get(`${idx},${idz}`);
    if (inGr <= 2 && 2 >= inGr) vox.set(idx, 2, idz, "glowstone");
    if (inGr <= WIN_LO_2) vox.set(idx, WIN_LO_2, idz, "shroomlight");
  }

  // Entrance lantern hanging under the upper slab, just inside the door.
  if (isEntrance && hasInner) {
    const inGr = ground.get(`${idx},${idz}`);
    if (inGr <= 4 && inGr <= FLOOR2_Y) {
      vox.set(idx, 4, idz, "lantern", { hanging: "true" });
    }
  }
}

vox.save(`${DIR}/${ID}.nbt`);
