import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Mid-rise 1980s-90s Taipei office block: white tiled concrete frame, blue-tinted
// glazing in bays, light grey storey belts, a stone shopfront base, and a
// roof parapet with a central plant room. Seven storeys of 5 blocks, roof slab at y 35.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw453245230";
const W = 33, H = 47, D = 18;
const STOREYS = 7;
const TOP = STOREYS * 5;          // 35: roof slab
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.max(0, Math.round(gr || 0)));
const has = (x, z) => ground.has(`${x},${z}`);

const put = (x, y, z, b, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

const WALL = "white_concrete";
const BELT = "light_gray_concrete";
const SLAB = "smooth_stone";
const BASE = "stone_bricks";
const PIER_GROUND = "polished_andesite";
const GLASS = "light_blue_stained_glass_pane";
const SHROOM = "shroomlight";

for (const [x, z, gr] of cells.map(([a, b]) => [a, b, ground.get(`${a},${b}`)])) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, BASE);

  // Floor slabs at each storey base and the roof slab, only where not already foundation.
  for (let k = 0; k < STOREYS; k++) {
    const yb = 5 * k;
    if (yb >= gr) put(x, yb, z, SLAB);
  }
  if (TOP >= gr) put(x, TOP, z, SLAB);

  const nb = { N: has(x, z - 1), S: has(x, z + 1), W: has(x - 1, z), E: has(x + 1, z) };
  const missing = [];
  if (!nb.N) missing.push("N");
  if (!nb.S) missing.push("S");
  if (!nb.W) missing.push("W");
  if (!nb.E) missing.push("E");
  const perim = missing.length > 0;
  const corner = missing.length >= 2;

  if (perim) {
    const face = missing[0];
    const along = (face === "N" || face === "S") ? x : z;
    const pier = corner || along % 3 === 0;
    const glassPanes = (face === "N" || face === "S")
      ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
      : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

    for (let k = 0; k < STOREYS; k++) {
      const yb = 5 * k;
      // Storey line / spandrel at the slab edge and below the glass band.
      put(x, yb, z, BELT);
      put(x, yb + 4, z, BELT);

      for (let y = yb + 1; y <= yb + 3; y++) {
        if (k === 0) {
          // Ground storey: stone piers and shopfront glazing with one entrance.
          const isEntrance = face === "N" && !corner && along === 16 && y <= 2;
          if (pier) put(x, y, z, PIER_GROUND);
          else if (isEntrance && gr <= 1) {
            const half = y === 1 ? "lower" : "upper";
            put(x, y, z, "dark_oak_door", { facing: "north", half, hinge: "left", open: "false", powered: "false" });
          } else put(x, y, z, GLASS, glassPanes);
        } else {
          if (pier) put(x, y, z, WALL);
          else put(x, y, z, GLASS, glassPanes);
        }
      }
    }
  }

  // Interior cells: warm shroomlights behind the glazing on a few storeys.
  if (!perim) {
    for (let k = 0; k < STOREYS; k++) {
      const yb = 5 * k;
      if (yb < gr) continue;
      if (k % 2 === 0 && x % 6 === 3 && (z === 2 || z === 15)) put(x, yb + 2, z, SHROOM);
    }
  }

  // Roof: cornice, parapet, cap on the perimeter.
  if (perim) {
    put(x, TOP, z, BELT);
    put(x, TOP + 1, z, WALL);
    put(x, TOP + 2, z, WALL);
    put(x, TOP + 3, z, BELT);
  } else if (x >= 10 && x <= 22 && z >= 5 && z <= 12) {
    // Central plant room on the roof.
    for (let y = TOP + 1; y <= TOP + 3; y++) put(x, y, z, BELT);
    put(x, TOP + 4, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
