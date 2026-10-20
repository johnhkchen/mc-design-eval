import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw434899241";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// 70 x 82 footprint, roof about 11 blocks above lowest ground.
// Two storeys of about 5 blocks each, cream tiled civic block with a
// quartz base, storey lines, a cornice and a parapet. Flat roof with plant boxes.
const W = 70, H = 23, D = 82;
const g = new Voxels([W, H, D]);

const ROOF_Y = 10;      // roof slab / cornice level
const PARAPET_Y = 11;   // parapet top ~11 above lowest ground
const key = (x, z) => x + "," + z;

const map = new Map();
for (const c of cells) {
  const [x, z, gr] = c;
  map.set(key(x, z), Math.max(0, Math.min(9, gr)));
}

const DIRS = [
  { dx: 0, dz: -1, name: "N" },
  { dx: 0, dz: 1, name: "S" },
  { dx: -1, dz: 0, name: "W" },
  { dx: 1, dz: 0, name: "E" },
];

for (const [k, gr] of map) {
  const [x, z] = k.split(",").map(Number);

  // Outward direction = first side with no footprint neighbour
  let outward = null;
  for (const d of DIRS) {
    if (!map.has(key(x + d.dx, z + d.dz))) { outward = d; break; }
  }
  const perimeter = outward !== null;

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) {
    g.set(x, y, z, "stone_bricks");
  }

  if (perimeter) {
    const along = (outward.name === "N" || outward.name === "S") ? x : z;

    for (let y = gr; y <= ROOF_Y; y++) {
      let b;
      if (y === gr) {
        b = "stone_bricks";                 // base course
      } else if (y === 4 || y === 9) {
        b = "quartz_bricks";                // storey lines / spandrels
      } else if (y === ROOF_Y) {
        b = "quartz_bricks";                // cornice
      } else if (y === 5) {
        b = "smooth_quartz";                // floor line wall band
      } else if ((y >= 1 && y <= 3) || (y >= 6 && y <= 8)) {
        // window zone
        const entrance = outward.name === "N" && along >= 32 && along <= 36 && y <= 3;
        if (entrance) {
          b = null;                         // entrance opening
        } else if (along % 3 === 0) {
          b = "quartz_pillar";              // mullion / frame
        } else {
          b = "light_blue_stained_glass";   // glazing
        }
      } else {
        b = "smooth_quartz";
      }
      if (b) g.set(x, y, z, b);
    }

    // Parapet on the roof edge
    g.set(x, PARAPET_Y, z, "smooth_quartz");

    // Lanterns at the entrance canopy line
    if (outward.name === "N" && along === 34 && gr <= 3) {
      g.set(x, 3, z, "lantern", { hanging: "true", waterlogged: "false" });
    }

    // Warm light behind some upper-storey windows
    if (along % 6 === 1 && gr <= 7) {
      const ix = x - outward.dx, iz = z - outward.dz;
      const inKey = key(ix, iz);
      if (map.has(inKey)) {
        const [ax, az] = [ix, iz];
        const inwardPerimeter = DIRS.some(d => !map.has(key(ax + d.dx, az + d.dz)));
        if (!inwardPerimeter) {
          g.set(ix, 7, iz, "glowstone");
        }
      }
    }
  } else {
    // Interior: floor slab per storey and roof slab, air gap otherwise
    if (5 >= gr) g.set(x, 5, z, "light_gray_concrete");
    g.set(x, ROOF_Y, z, "light_gray_concrete");
  }

  // Roof equipment on interior roof cells
  if (!perimeter && x % 10 === 5 && z % 10 === 5) {
    g.set(x, PARAPET_Y, z, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);
