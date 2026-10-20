import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw542682884.cells.json", "utf8"));

const W = 14, D = 18, H = 23;
const key = (x, z) => x + "," + z;
const foot = new Set(cells.map(([x, z]) => key(x, z)));
const inside = (x, z) => foot.has(key(x, z));
const isEdge = (x, z) => !inside(x - 1, z) || !inside(x + 1, z) || !inside(x, z - 1) || !inside(x, z + 1);

// Lowest ground under the footprint: floors and roof are referenced to it.
const F0 = Math.min(...cells.map(c => c[2]));

const g = new Voxels([W, H, D]);

// 2-storey concrete commercial block, c. 1980s Xinyi-area mid-rise.
// Storey 1 (r 1..4) is a glazed shopfront; storey 2 (r 6..9) is windowed;
// r5 and r10 are floor/roof slabs; r11 is the parapet; r11-12 hold roof plant.
function facade(x, z, r) {
  const xe = x === 0 || x === W - 1;
  const ze = z === 0 || z === D - 1;
  if (xe && ze) return "gray_concrete";              // corner columns
  const p = xe ? z : x;                              // position along the face
  if (r === 4 || r === 9) return "white_concrete";   // lintel bands
  if (r === 6) return "white_concrete";              // upper sill band
  if (r === 5) return "gray_concrete";               // string course
  if (p % 3 === 0) return "gray_concrete";           // mullions
  return "glass";
}

for (const [x, z, gr] of cells) {
  const edge = isEdge(x, z);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr && y < H; y++) {
    g.set(x, y, z, "stone_bricks");
  }

  // Building stack from the common floor level F0 up to the parapet (F0+11).
  for (let r = 0; r <= 11; r++) {
    const y = F0 + r;
    if (y >= H) break;
    if (y < gr) continue; // already foundation

    if (r === 0) {
      g.set(x, y, z, edge ? "stone_bricks" : "smooth_stone");   // base course / ground slab
    } else if (r === 5 || r === 10) {
      g.set(x, y, z, edge ? "gray_concrete" : "light_gray_concrete"); // floor and roof slabs
    } else if (r === 11) {
      if (edge) g.set(x, y, z, "white_concrete");                  // parapet
    } else if (edge) {
      // Storey walls (r 1..4 and 6..9)
      const storeyRow = (r >= 1 && r <= 4) || (r >= 6 && r <= 9);
      if (storeyRow) {
        // Main entrance on the south-facing (z=0) wall.
        if (z === 0 && x === 6 && (r === 1 || r === 2)) {
          g.set(x, y, z, "oak_door", {
            facing: "north",
            half: r === 1 ? "lower" : "upper",
            hinge: "left",
            open: "false",
            powered: "false",
          });
        } else {
          g.set(x, y, z, facade(x, z, r));
        }
      }
    } else {
      // Interior: air, apart from a few warm lights set just inside the glazing.
      const nearEdge = x === 1 || x === W - 2 || z === 1 || z === D - 2;
      if (nearEdge && (x + z) % 4 === 0 && (r === 2 || r === 7)) {
        g.set(x, y, z, "shroomlight");
      }
    }
  }
}

// Roof plant: a small central plant room with a lower cooling unit on top.
for (let x = 5; x <= 8; x++) {
  for (let z = 6; z <= 11; z++) {
    if (!inside(x, z)) continue;
    const y11 = F0 + 11;
    const y12 = F0 + 12;
    if (y11 < H) g.set(x, y11, z, "light_gray_concrete");
    if (y12 < H && x >= 6 && x <= 7 && z >= 7 && z <= 10) {
      g.set(x, y12, z, "iron_block");
    }
  }
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw542682884.nbt");
