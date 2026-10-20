import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const base = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw540300010";
const cells = JSON.parse(readFileSync(`${base}.cells.json`, "utf8"));

// 23 x 13 footprint, two-storey 1970s-80s Xinyi commercial block with a flat roof,
// tiled white facade, red sign band on the street (south) front, glass shopfront,
// central entrance, mechanical penthouse. Roof slab sits at y 10, parapet at y 11.
const W = 23, H = 23, D = 13;
const ROOF = 11;

const ground = new Map();
const cellList = [];
for (const [x, z, gr] of cells) {
  const gg = Math.round(gr);
  ground.set(`${x},${z}`, gg);
  cellList.push([x, z, gg]);
}
const has = (x, z) => ground.has(`${x},${z}`);

const g = new Voxels([W, H, D]);

const put = (x, y, z, v) => {
  if (!v) return;
  if (Array.isArray(v)) g.set(x, y, z, v[0], v[1]);
  else g.set(x, y, z, v);
};

const LG = "light_gray_concrete";

function outwardDirs(x, z) {
  const dirs = [];
  if (!has(x, z - 1)) dirs.push("north");
  if (!has(x, z + 1)) dirs.push("south");
  if (!has(x - 1, z)) dirs.push("west");
  if (!has(x + 1, z)) dirs.push("east");
  return dirs;
}

// Facade block for a perimeter cell at height y, given its ground gg.
function faceBlock(x, z, y, gg, dirs) {
  const r = y - gg;
  const corner = dirs.length > 1;
  const alongX = dirs.includes("north") || dirs.includes("south");
  const idx = alongX ? x : z;
  const pier = corner || idx % 3 === 0;
  const front = dirs.includes("south");

  // Ground storey (r 1..3): shopfront glass, piers, entrance door on front
  if (r >= 1 && r <= 3) {
    if (front && x === 11 && (r === 1 || r === 2)) {
      return [
        "dark_oak_door",
        {
          facing: "south",
          half: r === 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        },
      ];
    }
    if (pier) return LG;
    return "glass";
  }

  // Sign / storey band (r 4)
  if (r === 4) {
    if (front && !pier) return "red_terracotta";
    return LG;
  }

  // Upper storey (r 6..9): framed window bands between piers
  if (r === 6) {
    if (pier) return LG;
    if (dirs.length === 1 && idx % 6 === 1) return "glowstone"; // warm light in lintel
    return "gray_concrete";
  }
  if (r === 7 || r === 8) {
    return pier ? LG : "glass_pane";
  }
  if (r === 9) {
    return pier ? LG : "gray_concrete";
  }
  return null;
}

// Main body, cell by cell
for (const [x, z, gg] of cellList) {
  const dirs = outwardDirs(x, z);
  const perim = dirs.length > 0;

  for (let y = 0; y <= ROOF - 1; y++) {
    if (y < gg) {
      // foundation under cell
      put(x, y, z, "stone_bricks");
    } else if (y === gg) {
      // base course / ground floor slab
      put(x, y, z, perim ? "stone_bricks" : "smooth_stone");
    } else if (y === ROOF - 1) {
      // roof slab
      put(x, y, z, LG);
    } else if (y === gg + 5) {
      // storey line between floors
      put(x, y, z, perim ? LG : "smooth_stone");
    } else if (perim) {
      put(x, y, z, faceBlock(x, z, y, gg, dirs));
    }
  }

  // Parapet with cornice on the roof edge
  if (perim && gg < ROOF) {
    put(x, ROOF, z, "stone_brick_wall");
  }
}

// Mechanical penthouse on the roof (centre block)
for (let x = 8; x <= 14; x++) {
  for (let z = 4; z <= 8; z++) {
    if (!has(x, z)) continue;
    const gg = ground.get(`${x},${z}`);
    if (gg > ROOF - 1) continue;
    const rim = x === 8 || x === 14 || z === 4 || z === 8;
    for (let y = ROOF; y <= ROOF + 1; y++) {
      if (y === ROOF + 1) {
        put(x, y, z, LG); // penthouse roof
      } else if (rim) {
        put(x, y, z, LG);
      }
    }
  }
}

g.save(`${base}.nbt`);
