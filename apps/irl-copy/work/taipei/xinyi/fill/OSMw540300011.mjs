import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Mid-rise Xinyi-style commercial block, two storeys of 5 blocks plus a parapet.
// Pale tiled concrete, stone plinth, dark glass shopfronts, a central entrance on
// the north (z-min) face, rooftop plant. Warm glowstone sits behind some windows.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540300011";
const W = 19, H = 23, D = 13;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);
const has = (x, z) => G.has(`${x},${z}`);

const minG = Math.min(...cells.map(c => c[2]));
const xs = cells.map(c => c[0]), zs = cells.map(c => c[1]);
const xmin = Math.min(...xs), xmax = Math.max(...xs);
const zmin = Math.min(...zs);
const midX = Math.floor((xmin + xmax) / 2);
const roofTop = minG + 11; // absolute y of the parapet cap

const g = new Voxels([W, H, D]);

function missingDirs(x, z) {
  const m = [];
  if (!has(x - 1, z)) m.push("west");
  if (!has(x + 1, z)) m.push("east");
  if (!has(x, z - 1)) m.push("north");
  if (!has(x, z + 1)) m.push("south");
  return m;
}

function glassFor(face) {
  const axisX = face === "west" || face === "east"; // wall runs along z
  return axisX
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };
}

for (const [x, z, ground] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone_bricks");

  const miss = missingDirs(x, z);
  const perim = miss.length > 0;
  const corner = miss.length >= 2;
  const face = miss[0];
  const idx = (face === "west" || face === "east") ? z - zmin : x - xmin;
  const pier = corner || idx % 3 === 0;
  const frontRow = has(x, z) && miss.includes("north");

  for (let y = ground; y <= roofTop; y++) {
    const rel = y - minG;

    if (!perim) {
      // Interior: floor slabs, storey air gaps, roof deck. No interiors beyond that.
      if (rel === 0) { g.set(x, y, z, "smooth_stone"); continue; }
      if (rel === 5 || rel === 10) { g.set(x, y, z, "light_gray_concrete"); continue; }
      if (rel === 11) { g.set(x, y, z, "gray_concrete"); continue; }
      // Warm lights behind the front glazing.
      if (frontRow && (x % 4 === 1) && (rel === 2 || rel === 7)) {
        g.set(x, y, z, "glowstone");
      }
      continue;
    }

    // Perimeter shell.
    if (rel === 0) { g.set(x, y, z, "stone_bricks"); continue; }
    if (rel === 11) { g.set(x, y, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" }); continue; }
    if (rel === 4 || rel === 9) {
      // Lintels; black canopy over the entrance on the front.
      if (rel === 4 && frontRow && Math.abs(x - midX) <= 1) {
        g.set(x, y, z, "black_concrete");
      } else {
        g.set(x, y, z, "light_gray_concrete");
      }
      continue;
    }
    if (rel === 5 || rel === 10) { g.set(x, y, z, "white_concrete"); continue; }

    // Window / shopfront bands: rel 1-3 (ground) and 6-8 (upper).
    const band = (rel >= 1 && rel <= 3) || (rel >= 6 && rel <= 8);
    if (band) {
      // Entrance door in the centre of the front face.
      if (frontRow && x === midX && (rel === 1 || rel === 2)) {
        g.set(x, y, z, "oak_door", {
          facing: "north",
          half: rel === 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
        continue;
      }
      if (pier) {
        g.set(x, y, z, "gray_concrete");
      } else {
        g.set(x, y, z, "light_blue_stained_glass_pane", glassFor(face));
      }
      continue;
    }
    g.set(x, y, z, "white_concrete");
  }
}

// Rooftop plant on the roof deck, set back from the parapet.
for (const [x, z] of cells) {
  if (missingDirs(x, z).length > 0) continue;
  if (x % 6 === 2 && z % 5 === 2) {
    g.set(x, roofTop + 1, z, "light_gray_concrete");
    g.set(x, roofTop + 2, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
