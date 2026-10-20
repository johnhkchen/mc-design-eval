import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const cells = JSON.parse(readFileSync(`${dir}/OSMw538461848.cells.json`, "utf8"));

const W = 8, H = 23, D = 27;
const g = new Voxels([W, H, D]);

// Ground per footprint cell, clamped so the roof stays inside the 23-high volume.
const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) {
  ground.set(key(x, z), Math.max(0, Math.min(gr, 10)));
}
const has = (x, z) => ground.has(key(x, z));
const exposed = (x, z) =>
  !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Entrance: on the exposed cell nearest the middle of the long street face.
let entrance = null;
{
  let best = Infinity;
  for (const [x, z] of ground.keys().map(k => k.split(",").map(Number))) {
    if (!exposed(x, z)) continue;
    const score = Math.abs(z - 13) + (x === 0 ? 0 : 0.5);
    if (score < best) { best = score; entrance = [x, z]; }
  }
}

// Storey plan, relative to each cell's ground g (roof cap at g+10, about 11 blocks):
//   g      base course (smooth stone)
//   g+1..3 ground-floor shopfront (glass, piers) ; g+4 red canopy band
//   g+5    floor line ; g+6..8 upper storey windows ; g+9 sill ; g+10 cornice
for (const [key_, gr] of ground) {
  const [x, z] = key_.split(",").map(Number);
  const top = gr + 10;

  // Foundation from y=0 up to the cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  if (!exposed(x, z)) {
    // Interior massing: solid core with a quartz roof cap.
    for (let y = gr; y < top; y++) g.set(x, y, z, "white_concrete");
    g.set(x, top, z, "smooth_quartz");
    continue;
  }

  const pier = (x + z) % 2 === 0;

  // Base course.
  g.set(x, gr, z, "smooth_stone");

  // Ground floor shopfront.
  const isEntrance = entrance && entrance[0] === x && entrance[1] === z;
  for (let y = gr + 1; y <= gr + 3; y++) {
    if (isEntrance) {
      if (y < gr + 3) g.set(x, y, z, "air");
      else g.set(x, y, z, "lantern", { hanging: "true" });
    } else if (pier) {
      g.set(x, y, z, "white_concrete");
    } else {
      g.set(x, y, z, "light_blue_stained_glass_pane");
    }
  }

  // Red canopy / transom band.
  g.set(x, gr + 4, z, "red_terracotta");

  // Floor line.
  g.set(x, gr + 5, z, "white_concrete");

  // Upper storey windows, with occasional lit rooms.
  for (let y = gr + 6; y <= gr + 8; y++) {
    if (pier) {
      g.set(x, y, z, "white_concrete");
    } else if ((3 * x + 5 * z + y) % 7 === 0) {
      g.set(x, y, z, "glowstone");
    } else {
      g.set(x, y, z, "light_blue_stained_glass_pane");
    }
  }

  // Sill band and cornice.
  g.set(x, gr + 9, z, "smooth_quartz");
  g.set(x, top, z, "quartz_block");
}

// Roof equipment: two water tanks on the centre of the roof.
for (let x = 2; x <= 3; x++) {
  for (let z = 10; z <= 11; z++) {
    if (!has(x, z)) continue;
    const gr = ground.get(key(x, z));
    g.set(x, gr + 11, z, "light_gray_concrete");
    g.set(x, gr + 12, z, "light_gray_concrete");
  }
}

g.save(`${dir}/OSMw538461848.nbt`);
