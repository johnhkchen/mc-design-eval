import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no source. Read as a c.1985 Xinyi mid-rise: five storeys of white
// concrete with grey spandrels, a stone-brick cornice, a shopfront with a
// dark-oak door and fascia on the street face, and a small roof penthouse.

const cells = JSON.parse(
  readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw709238586.cells.json", "utf8")
);

const W = 5, H = 38, D = 5;
const TOP = 25;               // roof/cornice row; roof top sits at 26
const g = new Voxels([W, H, D]);

const gmap = new Map();
for (const [x, z, ground] of cells) gmap.set(x + "," + z, Math.round(ground));
const has = (x, z) => gmap.has(x + "," + z);

const paneNS = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const paneEW = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

for (const [x, z, groundRaw] of cells) {
  const gg = Math.max(0, Math.round(groundRaw));
  const faces = {
    n: !has(x, z - 1),
    s: !has(x, z + 1),
    w: !has(x - 1, z),
    e: !has(x + 1, z),
  };
  const exposed = faces.n || faces.s || faces.w || faces.e;

  // Foundation up to this cell's ground so nothing floats on the slope.
  for (let y = 0; y < gg; y++) g.set(x, y, z, "stone_bricks");

  if (!exposed) {
    // Core: air between floor slabs, no interior fit-out.
    for (let y = 0; y <= TOP; y += 5) {
      if (y >= gg) g.set(x, y, z, "smooth_stone");
    }
    // Warm light in the core, seen through the glass on the middle floors.
    if (x === 2 && z === 2) {
      for (const k of [1, 3]) {
        const y = 5 * k + 2;
        if (y >= gg) g.set(x, y, z, "glowstone");
      }
    }
    continue;
  }

  // Exterior ring cell: full height from its ground to the roof.
  const exCount = (faces.n ? 1 : 0) + (faces.s ? 1 : 0) + (faces.w ? 1 : 0) + (faces.e ? 1 : 0);
  const isNS = faces.n || faces.s;
  const along = isNS ? x : z;
  const isStreet = faces.n;               // street frontage on the north face
  const isPier = exCount >= 2 || along === 0 || along === 4;

  for (let y = gg; y <= TOP; y++) {
    const r = y % 5;
    const k = Math.floor(y / 5);

    if (y === TOP) {
      g.set(x, y, z, "stone_bricks");                       // cornice
    } else if (r === 0) {
      g.set(x, y, z, "gray_concrete");                      // floor spandrel line
    } else if (r === 4) {
      if (k === 0 && isStreet && !isPier) g.set(x, y, z, "dark_oak_planks"); // shop fascia
      else g.set(x, y, z, "white_concrete");
    } else {
      // Window band rows 1..3 of each storey.
      if (isPier) {
        g.set(x, y, z, "white_concrete");
      } else if (k === 0 && isStreet && y <= 3) {
        g.set(x, y, z, "glass");                            // shopfront glazing
      } else {
        g.set(x, y, z, "glass_pane", isNS ? paneEW : paneNS);
      }
    }
  }
}

// Street door on the north face, centre bay.
if (has(2, 0)) {
  const gg = Math.max(0, Math.round(gmap.get("2,0")));
  g.set(2, gg, 0, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(2, gg + 1, 0, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
}

// Roof penthouse and lightning rod on the core.
if (has(1, 1) && has(2, 1) && has(3, 1) && has(1, 2) && has(2, 2) && has(3, 2) && has(1, 3) && has(2, 3) && has(3, 3)) {
  for (let x = 1; x <= 3; x++)
    for (let z = 1; z <= 3; z++)
      for (let y = TOP + 1; y <= TOP + 2; y++)
        if (x === 1 || x === 3 || z === 1 || z === 3)
          g.set(x, y, z, "light_gray_concrete");
  g.set(2, TOP + 1, 2, "lightning_rod");
  g.set(2, TOP + 2, 2, "lightning_rod");
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw709238586.nbt");
