import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw643833872";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 23, H = 23, D = 25;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground
const at = new Map();
for (const [x, z, gr] of cells) at.set(`${x},${z}`, gr);
const has = (x, z) => at.has(`${x},${z}`);

// Outward normal of each face
const FACES = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const facesOf = (x, z) =>
  Object.keys(FACES).filter((f) => {
    const [dx, dz] = FACES[f];
    return !has(x + dx, z + dz);
  });

// Entrance: a single-face south-facing edge cell nearest the centre line
const southOnly = cells
  .filter(([x, z]) => {
    const f = facesOf(x, z);
    return f.length === 1 && f[0] === "south";
  })
  .sort((a, b) => Math.abs(a[0] - 11) - Math.abs(b[0] - 11));
const [entX, entZ] = southOnly.length ? southOnly[0] : [-1, -1];

const DOOR = (half) => ({
  facing: "south",
  half,
  hinge: "left",
  open: "false",
  powered: "false",
});

for (const [x, z, gr] of cells) {
  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  // Floor slabs: ground, first floor, roof
  g.set(x, gr, z, "smooth_stone");
  g.set(x, gr + 5, z, "smooth_stone");
  g.set(x, gr + 10, z, "light_gray_concrete");

  const fs = facesOf(x, z);

  // Interior cell: roof equipment only
  if (fs.length === 0) {
    if (x % 6 === 3 && z % 6 === 3) g.set(x, gr + 11, z, "iron_block");
    continue;
  }

  // Edge cell: full wall column with articulation
  const corner = fs.length > 1;
  const face = fs[0];
  const t = face === "north" || face === "south" ? x : z;
  const pier = corner || t % 3 === 0;
  const isEntrance = x === entX && z === entZ;

  // Base course
  g.set(x, gr + 1, z, "stone_bricks");

  // Ground storey: shopfront glass with transom spandrel
  if (isEntrance) {
    g.set(x, gr + 1, z, "oak_door", DOOR("lower"));
    g.set(x, gr + 2, z, "oak_door", DOOR("upper"));
    g.set(x, gr + 3, z, "glass");
  } else if (pier) {
    g.set(x, gr + 2, z, "smooth_quartz");
    g.set(x, gr + 3, z, "smooth_quartz");
  } else {
    g.set(x, gr + 2, z, "glass");
    g.set(x, gr + 3, z, "glass");
  }
  g.set(x, gr + 4, z, "smooth_quartz");

  // Storey line
  g.set(x, gr + 5, z, "smooth_quartz");

  // Upper storey: spandrel, window band, spandrel
  g.set(x, gr + 6, z, "smooth_quartz");
  if (pier) {
    g.set(x, gr + 7, z, "smooth_quartz");
    g.set(x, gr + 8, z, "smooth_quartz");
  } else {
    g.set(x, gr + 7, z, "glass");
    g.set(x, gr + 8, z, "glass");
  }
  g.set(x, gr + 9, z, "smooth_quartz");

  // Cornice and parapet
  g.set(x, gr + 10, z, "quartz_slab", { type: "bottom", waterlogged: "false" });
  g.set(x, gr + 11, z, "smooth_quartz");

  // Warm light behind some windows, placed in the interior cell inside the wall
  if (!pier && !isEntrance) {
    const [dx, dz] = FACES[face];
    const ix = x - dx, iz = z - dz;
    if (has(ix, iz) && facesOf(ix, iz).length === 0) {
      if (t % 6 === 2) g.set(ix, gr + 7, iz, "glowstone");
      if (t % 6 === 4) g.set(ix, gr + 2, iz, "glowstone");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
