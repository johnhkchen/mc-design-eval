import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw587169560";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 24, H = 41, D = 19;
const TOP = 29;                 // roof slab level (lidar: roof ~29 above lowest ground)
const g = new Voxels([W, H, D]);

// footprint lookup: "x,z" -> ground
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

// direction -> [dx, dz]; N = -z, S = +z
const DIRS = { W: [-1, 0], E: [1, 0], N: [0, -1], S: [0, 1] };
const missingOf = (x, z) =>
  Object.entries(DIRS).filter(([, [dx, dz]]) => !has(x + dx, z + dz)).map(([k]) => k);
const isPerim = (x, z) => has(x, z) && missingOf(x, z).length > 0;

// ---- Shell: office/commercial tower block, 1990s-2000s Xinyi style ----
// Concrete frame, cyan glass curtain wall in white mullions, polished granite
// base, quartz cornice, parapet, mechanical penthouse with louvres, rod on top.
for (const [x, z, gr] of cells) {
  const miss = missingOf(x, z);
  const perim = miss.length > 0;
  const corner = miss.length >= 2;
  const mDir = miss[0];
  const [mdx, mdz] = mDir ? DIRS[mDir] : [0, 0];
  const alongX = mDir === "N" || mDir === "S";
  const along = alongX ? x : z;
  const entrance = perim && miss.includes("S") && (x === 11 || x === 12);

  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  for (let y = gr; y <= 31; y++) {
    if (y === TOP) {
      g.set(x, y, z, "smooth_quartz");           // roof slab / cornice line
      continue;
    }
    if (y > TOP) {
      if (!perim) continue;
      if (y === 30) g.set(x, y, z, "light_gray_concrete");   // parapet
      else g.set(x, y, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
      continue;
    }

    if (!perim) {
      // interior: only floor slabs; air behind the glass
      if (y === gr || y % 5 === 0) g.set(x, y, z, "light_gray_concrete");
      continue;
    }

    // entrance: double oak door, centred on the south face
    if (entrance && y >= gr + 1 && y <= gr + 2 && y < 5) {
      const half = y === gr + 1 ? "lower" : "upper";
      g.set(x, y, z, "oak_door", {
        facing: "north", half, hinge: "left", open: "false", powered: "false",
      });
      continue;
    }

    const rel = y % 5;
    const ground = y < 5;
    if (y === gr) {
      g.set(x, y, z, "polished_granite");                 // base course
    } else if (rel === 0) {
      g.set(x, y, z, "light_gray_concrete");              // storey line / spandrel
    } else if (rel === 4) {
      g.set(x, y, z, "white_concrete");                   // belt course
    } else {
      const pier = corner || along % 3 === 0;
      if (pier) {
        g.set(x, y, z, ground ? "polished_granite" : "white_concrete");
      } else {
        g.set(x, y, z, ground ? "light_blue_stained_glass" : "cyan_stained_glass");
        // warm glow behind some glass, placed in the interior air cell
        if (rel === 2 && along % 6 === 4 && mDir) {
          const ix = x - mdx, iz = z - mdz;
          if (has(ix, iz) && !isPerim(ix, iz)) g.set(ix, y, iz, "glowstone");
        }
      }
    }
  }

  // lantern hanging inside the entrance hall, under the first floor slab
  if (entrance && gr <= 4 && has(11, z - 1) && !isPerim(11, z - 1)) {
    g.set(11, 4, z - 1, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

// ---- Mechanical penthouse on the roof (rests on the TOP slab) ----
for (let x = 7; x <= 15; x++) {
  for (let z = 6; z <= 12; z++) {
    if (!has(x, z)) continue;
    const ring = x === 7 || x === 15 || z === 6 || z === 12;
    if (ring) {
      for (let y = 30; y <= 34; y++) {
        if (y >= 31 && y <= 33 && (x + z) % 3 === 0) g.set(x, y, z, "iron_bars");
        else g.set(x, y, z, "light_gray_concrete");
      }
    }
    g.set(x, 35, z, "smooth_quartz");                  // penthouse cap
  }
}

// ---- Roof antenna with a warm light at the tip ----
if (has(11, 9)) {
  for (let y = 36; y <= 39; y++) {
    g.set(11, y, 9, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  }
  g.set(11, 40, 9, "sea_lantern");
}

g.save(`${DIR}/${ID}.nbt`);
