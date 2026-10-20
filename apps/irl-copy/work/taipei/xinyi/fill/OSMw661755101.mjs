import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw661755101";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

// 27 x 48 footprint, roof top at y = 11 (parapet tops out at y 10), 2 storeys of ~5 blocks.
const W = 27, H = 23, D = 48;
const g = new Voxels([W, H, D]);

const ROOF_Y = 10;      // roof deck / parapet level
const STOREY_Y = 5;     // storey line and upper floor slab
const LAST_FLOOR_Y = 9; // cornice course under the parapet

const DIRS = [
  { name: "north", dx: 0, dz: -1 },
  { name: "south", dx: 0, dz: 1 },
  { name: "west", dx: -1, dz: 0 },
  { name: "east", dx: 1, dz: 0 },
];

const key = (x, z) => `${x},${z}`;
const footprint = new Set(cells.map(([x, z]) => key(x, z)));
const ground = new Map(cells.map(([x, z, gy]) => [key(x, z), gy]));

// Outward faces for each cell (neighbour outside the footprint)
const facesOf = (x, z) =>
  DIRS.filter((d) => !footprint.has(key(x + d.dx, z + d.dz)));

// Pick the entrance: on the south face, closest to x = 13
let doorKey = null;
let bestDist = Infinity;
for (const [x, z] of cells) {
  const faces = facesOf(x, z);
  if (faces.some((f) => f.name === "south")) {
    const dist = Math.abs(x - 13);
    if (dist < bestDist) {
      bestDist = dist;
      doorKey = key(x, z);
    }
  }
}

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const faces = facesOf(x, z);
  const isExt = faces.length > 0;

  if (isExt) {
    const face = faces[0];
    // Bay index along the wall the face sits on
    const t = face.name === "north" || face.name === "south" ? x : z;
    const pillar = t % 3 === 0;

    for (let y = gr; y <= ROOF_Y; y++) {
      let b;
      if (y === gr) b = "polished_andesite";              // base course
      else if (y <= 3) b = pillar ? "white_concrete" : "glass"; // shopfront
      else if (y === 4) b = "smooth_stone";               // shopfront lintel
      else if (y === STOREY_Y) b = "smooth_quartz";       // storey line
      else if (y <= 8) b = pillar ? "white_concrete" : "light_blue_stained_glass";
      else if (y === LAST_FLOOR_Y) b = "smooth_stone";    // cornice
      else b = "stone_brick_wall";                        // parapet
      g.set(x, y, z, b);
    }

    // Entrance door on the chosen cell
    if (key(x, z) === doorKey) {
      const dp = { facing: "south", hinge: "left", open: "false", powered: "false" };
      g.set(x, gr + 1, z, "oak_door", { ...dp, half: "lower" });
      g.set(x, gr + 2, z, "oak_door", { ...dp, half: "upper" });
    }

    // Warm light just behind the upper glazing where an interior cell exists
    const bayIdx = t;
    for (const f of faces.slice(0, 1)) {
      const inx = x - f.dx, inz = z - f.dz;
      if (footprint.has(key(inx, inz)) && !facesOf(inx, inz).length && (bayIdx % 4 === 1)) {
        const inGr = ground.get(key(inx, inz));
        if (inGr <= 7) g.set(inx, 7, inz, "glowstone");
      }
    }
  } else {
    // Interior cell: floor slab per storey, roof deck above
    if (gr <= STOREY_Y - 1) g.set(x, STOREY_Y, z, "smooth_stone");
    if (gr <= ROOF_Y) {
      g.set(x, ROOF_Y, z, "light_gray_concrete");
      // Roof equipment on a sparse grid
      if (x % 7 === 3 && z % 9 === 4) g.set(x, ROOF_Y + 1, z, "iron_block");
    }
  }
}

// Shopfront warm lights behind ground-floor glass on the interior side
for (const [x, z, gr] of cells) {
  const faces = facesOf(x, z);
  if (!faces.length) continue;
  const f = faces[0];
  const t = f.name === "north" || f.name === "south" ? x : z;
  if (t % 3 === 1 && gr + 2 <= 3) {
    const inx = x - f.dx, inz = z - f.dz;
    if (footprint.has(key(inx, inz)) && !facesOf(inx, inz).length) {
      g.set(inx, gr + 2, inz, "shroomlight");
    }
  }
}

g.save(`${dir}/${id}.nbt`);
