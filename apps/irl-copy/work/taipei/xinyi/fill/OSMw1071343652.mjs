// OSMw1071343652: no record, so this is a generic two-storey commercial block of the
// later 20th century in Xinyi style: a grey plinth, pale quartz piers and storey lines,
// cyan glass bays, a central glass entrance, and a flat roof with a parapet and rooftop plant.
// Roof edge sits 11 blocks above the lowest ground, giving two 5-block storeys plus a parapet.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1071343652";
const W = 36, H = 23, D = 30;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const key = (x, z) => `${x},${z}`;
const grounds = new Map();
for (const [x, z, g] of cells) grounds.set(key(x, z), g);

const G0 = Math.min(...cells.map((c) => c[2]));
const TOP = G0 + 11;       // roof surface (exclusive top of walls)
const L1 = G0 + 5;         // second-floor slab
const L2 = G0 + 10;        // roof deck / parapet course

const out = new Map();
const put = (x, y, z, b, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  out.set(`${x},${y},${z}`, [x, y, z, b, p]);
};

// Entrance: the south-facing, non-corner perimeter cell nearest the middle of the front.
let doorKey = null;
{
  let best = Infinity;
  for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
    const hasS = grounds.has(key(x, z + 1));
    const hasW = grounds.has(key(x - 1, z));
    const hasE = grounds.has(key(x + 1, z));
    const hasN = grounds.has(key(x, z - 1));
    const faces = [!hasN, !hasS, !hasW, !hasE].filter(Boolean).length;
    if (!hasS && faces === 1) {
      const d = Math.abs(x - 17.5);
      if (d < best) { best = d; doorKey = key(x, z); }
    }
  }
}

for (const [x, z, g] of cells) {
  const hasN = grounds.has(key(x, z - 1));
  const hasS = grounds.has(key(x, z + 1));
  const hasW = grounds.has(key(x - 1, z));
  const hasE = grounds.has(key(x + 1, z));
  const faces = [!hasN, !hasS, !hasW, !hasE].filter(Boolean).length;
  const perim = faces > 0;
  const corner = faces >= 2;
  // Along-wall coordinate: x on north/south faces, z on east/west faces.
  const t = (!hasN || !hasS) ? x : z;

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < g; y++) put(x, y, z, "stone_bricks");

  const T = Math.min(H, Math.max(TOP, g + 2));
  for (let y = g; y < T; y++) {
    if (!perim) {
      if (y === g || y === L1 || y === L2) put(x, y, z, "light_gray_concrete");
      continue;
    }
    if (corner) {
      if (y <= L2) put(x, y, z, "smooth_quartz");
      continue;
    }
    if (y === L2) { put(x, y, z, "smooth_quartz"); continue; }      // parapet cap
    if (y === L1) { put(x, y, z, "smooth_quartz"); continue; }      // storey line
    if (y < L1) {                                                   // ground floor shopfront
      if (y === g) { put(x, y, z, "polished_andesite"); continue; } // plinth
      if (y === L1 - 1) { put(x, y, z, "smooth_quartz"); continue; } // fascia
      if (t % 4 === 0) { put(x, y, z, "smooth_quartz"); continue; }
      if (y === g + 1 && t % 8 === 5) { put(x, y, z, "glowstone"); continue; }
      put(x, y, z, "cyan_stained_glass");
      continue;
    }
    // Upper storey: window bands between storey lines.
    if (y === L2 - 1) { put(x, y, z, "smooth_quartz"); continue; }  // cornice band
    if (t % 4 === 0) { put(x, y, z, "smooth_quartz"); continue; }
    if (y === L1 + 2 && t % 8 === 3) { put(x, y, z, "glowstone"); continue; }
    put(x, y, z, "cyan_stained_glass");
  }

  // Entrance door and lintel on the chosen south cell.
  if (perim && !corner && key(x, z) === doorKey && g + 2 < L1) {
    put(x, g, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, g + 1, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
    put(x, g + 2, z, "smooth_quartz");
  }

  // Rooftop plant room on a block of interior roof cells.
  if (!perim && x >= 6 && x <= 12 && z >= 6 && z <= 11) {
    put(x, TOP, z, "stone_bricks");
    if (x >= 8 && x <= 10 && z >= 8 && z <= 9) put(x, TOP + 1, z, "iron_block");
  }
}

const g3 = new Voxels([W, H, D]);
for (const [x, y, z, b, p] of out.values()) {
  if (p) g3.set(x, y, z, b, p);
  else g3.set(x, y, z, b);
}
g3.save(`${DIR}/${ID}.nbt`);
