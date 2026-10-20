import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542009178";
const W = 26, H = 23, D = 21;

// Record: roof about 11 blocks above lowest ground. Two storeys of about 5 blocks,
// 1990s-2000s Taipei office block: granite base, white concrete piers, blue-tinted
// glazing, quartz floor bands and a quartz parapet, with a lit ground-floor entrance
// and a central roof plant box.
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const key = (x, z) => `${x},${z}`;
const cellG = new Map();
for (const [x, z, gr] of cells) cellG.set(key(x, z), gr);

const minG = Math.min(...cells.map((c) => c[2]));
const T = minG + 11;          // roof surface sits at y = T (top block at T-1)
const top = T - 1;
const has = (x, z) => cellG.has(key(x, z));
const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

const xs = cells.map((c) => c[0]), zs = cells.map((c) => c[1]);
const minZ = Math.min(...zs);
const cx = Math.floor(W / 2), cz = Math.floor(D / 2);

const g = new Voxels([W, H, D]);
const GLASS = "light_blue_stained_glass_pane";

for (const [x, z, ground] of cells) {
  // Foundation: solid from y 0 up to this cell's ground, so nothing floats.
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone");

  // Ground above the roof line: cap it and move on.
  if (ground >= T) {
    g.set(x, ground, z, "smooth_quartz");
    continue;
  }

  const edge = isEdge(x, z);
  const entranceFace = z === minZ && Math.abs(x - cx) <= 1;

  for (let y = ground; y <= top; y++) {
    const r = y - ground;

    if (!edge) {
      // Interior: air with floor slabs per storey and a roof deck.
      if (r === 0) g.set(x, y, z, "stone_bricks");
      else if (r === 5) g.set(x, y, z, "smooth_quartz");
      else if (y === top) g.set(x, y, z, "light_gray_concrete");
      continue;
    }

    // Exterior shell.
    if (r === 0) {
      g.set(x, y, z, "polished_granite");                 // base course
    } else if (y === top) {
      g.set(x, y, z, "smooth_quartz");                    // parapet cap
    } else if (r === 5) {
      g.set(x, y, z, "smooth_quartz");                    // storey line
    } else if (r === 4 || r === 9) {
      g.set(x, y, z, "light_gray_concrete");              // spandrel
    } else if ((r >= 1 && r <= 3) || (r >= 6 && r <= 8)) {
      const pier = x % 3 === 0 || z % 3 === 0;
      if (entranceFace && r <= 2) {
        g.set(x, y, z, "glass");                          // lobby door
      } else if (entranceFace && r === 3) {
        g.set(x, y, z, "white_concrete");                 // entrance lintel
      } else if (pier) {
        g.set(x, y, z, "white_concrete");                 // window piers
      } else if (r === 2 && (x * 3 + z) % 11 === 0) {
        g.set(x, y, z, "shroomlight");                    // lit window
      } else {
        g.set(x, y, z, GLASS);
      }
    } else {
      g.set(x, y, z, "white_concrete");
    }
  }
}

// Roof plant: a central box two blocks tall on the roof deck.
for (const [x, z, ground] of cells) {
  if (ground >= T) continue;
  if (isEdge(x, z)) continue;
  if (Math.abs(x - cx) <= 3 && Math.abs(z - cz) <= 3) {
    for (let y = T; y <= Math.min(T + 1, H - 1); y++) {
      g.set(x, y, z, "light_gray_concrete");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
