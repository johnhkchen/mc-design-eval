import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE94-0295-15F";
const W = 47, H = 95, D = 28;
const TOP = 83;          // roof slab level (about 83 blocks above lowest ground)
const CORNICE = TOP + 1; // brown terracotta band on the parapet line

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];
const exposures = (x, z) => DIRS.filter(([dx, dz]) => !has(x + dx, z + dz));

const g = new Voxels([W, H, D]);
const put = (x, y, z, id) => { if (y >= 0 && y < H) g.set(x, y, z, id); };

// ---- main shell, floors, foundation ----
for (const [x, z, G] of cells) {
  const ex = exposures(x, z);
  const shell = ex.length > 0;

  // foundation under the cell up to its ground
  for (let y = 0; y < G; y++) put(x, y, z, "stone_bricks");
  // ground slab
  put(x, G, z, "polished_granite");

  if (shell) {
    // quartz wall core from ground to roof (lighter, less flat than white concrete)
    for (let y = G + 1; y < TOP; y++) put(x, y, z, "quartz_block");
    // dark granite base course in the lowest storey
    for (let y = G + 1; y <= 4 && y < TOP; y++) put(x, y, z, "polished_granite");
  }

  // ground storey entrance on the north (z-min) face: lit lobby glass, quartz frame, lintel
  if (shell && ex.some(([dx, dz]) => dx === 0 && dz === -1) && x >= 20 && x <= 26) {
    for (let y = G; y <= Math.min(G + 2, 4); y++) {
      for (let xx = 21; xx <= 25; xx++) put(xx, y, z, "light_blue_stained_glass");
    }
    for (let y = G; y <= Math.min(G + 3, 4); y++) {
      if (x === 20 || x === 26) put(x, y, z, "quartz_pillar");
    }
    if (G + 3 <= 4 && x >= 21 && x <= 25) put(x, G + 3, z, "smooth_quartz");
  }

  // upper storeys: spandrel band every 5 blocks, glazed bays between
  for (let k = 1; k <= 16; k++) {
    const Y = 5 * k;
    if (Y <= G) continue;
    if (Y < TOP) put(x, Y, z, "smooth_quartz");   // floor slab / spandrel band
    if (!shell) continue;

    const face = ex[0];
    const t = face[0] !== 0 ? z : x; // tangential coordinate along the exposed face
    for (let off = 1; off <= 3; off++) {
      const y = Y + off;
      if (y >= TOP) continue;
      if (t % 4 === 0) {
        put(x, y, z, "quartz_pillar");                 // mullions read as frames
      } else if (off === 1) {
        put(x, y, z, "smooth_quartz");                 // window sill course
      } else {
        put(x, y, z, "light_blue_stained_glass");      // full glazed bay, no see-through holes
      }
    }

    // warm lanterns just inside some bays, sitting on the floor slab
    if (((x * 7 + z * 5 + k * 3) % 9) === 0) {
      const [fdx, fdz] = face;
      const ix = x - fdx, iz = z - fdz;
      if (has(ix, iz) && exposures(ix, iz).length === 0 && Y + 1 < TOP) {
        put(ix, Y + 1, iz, "lantern");
      }
    }
  }

  // roof slab, cornice on the shell
  put(x, TOP, z, "smooth_quartz");
  if (shell) put(x, CORNICE, z, "brown_terracotta");
}

// ---- rooftop mechanical penthouse, centred, on the roof slab ----
for (let x = 15; x <= 31; x++) {
  for (let z = 8; z <= 19; z++) {
    if (!has(x, z)) continue;
    const perim = x === 15 || x === 31 || z === 8 || z === 19;
    if (perim) {
      put(x, TOP + 1, z, "brown_terracotta");
      put(x, TOP + 2, z, "iron_bars");
      put(x, TOP + 3, z, "quartz_block");
    }
    put(x, TOP + 4, z, "smooth_quartz");
  }
}

g.save(`${DIR}/${ID}.nbt`);
