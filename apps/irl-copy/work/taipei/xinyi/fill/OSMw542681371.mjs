import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542681371";
const W = 12, H = 23, D = 6;

// Footprint: [x, z, ground] per cell. Ground is made relative to the lowest cell.
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const minG = Math.min(...cells.map(c => c[2]));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr - minG);

const has = (x, z) => ground.has(`${x},${z}`);
// Exterior cell: at least one footprint neighbour is missing.
const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (y < 0 || y >= H || x < 0 || x >= W || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Materials: 1980s Taipei commercial block, white tiled concrete, tinted glass, quartz storey lines.
const WALL = "white_concrete";
const GLASS = "light_blue_stained_glass";
const LINE = "smooth_quartz";
const BASE = "polished_andesite";
const FLOOR = "smooth_stone";
const FOUND = "stone_bricks";
const ROOF = "gray_concrete";
const PARAPET = "white_concrete";
const EQUIP = "light_gray_concrete";

// Storey levels relative to a cell's ground b:
// b: floor slab / base course, b+1..b+3 ground-floor shopfront, b+4 shop fascia,
// b+5 storey line, b+6..b+8 upper windows, b+9 cornice, b+10 roof deck and parapet,
// b+11 roof plant (on the deck).
for (const [key, b] of ground) {
  const [x, z] = key.split(",").map(Number);
  const edge = isEdge(x, z);
  const zFace = !has(x, z - 1) || !has(x, z + 1);
  const xFace = !has(x - 1, z) || !has(x + 1, z);
  const corner = zFace && xFace;
  const pillar = x % 3 === 0 && x > 0 && x < W - 1; // bay mullions on the long faces

  // Foundation under the whole footprint, up to just below the floor.
  for (let y = 0; y < b; y++) put(x, y, z, FOUND);

  // Ground floor slab / base course.
  put(x, b, z, edge ? BASE : FLOOR);

  // Ground-floor shopfront and upper windows share the same wall logic.
  const wallRows = (rows, isGround) => {
    for (const y of rows) {
      if (!edge) continue;
      if (corner) { put(x, y, z, WALL); continue; }
      if (zFace) {
        if (pillar) { put(x, y, z, WALL); continue; }
        // Entrance door at x=6 on the street face.
        if (isGround && z === 0 && x === 6 && (y === b + 1 || y === b + 2)) {
          put(x, y, z, "dark_oak_door", {
            facing: "north",
            half: y === b + 1 ? "lower" : "upper",
            hinge: "left",
            open: "false",
            powered: "false",
          });
          continue;
        }
        put(x, y, z, GLASS);
        continue;
      }
      if (xFace) {
        // Side walls: glass for z 1..4, solid at the ends.
        put(x, y, z, z >= 1 && z <= D - 2 ? GLASS : WALL);
      }
    }
  };

  wallRows([b + 1, b + 2, b + 3], true);
  // Shop fascia.
  if (edge) put(x, b + 4, z, LINE);
  // Storey line across the whole plate.
  put(x, b + 5, z, LINE);
  wallRows([b + 6, b + 7, b + 8], false);
  // Cornice and parapet.
  if (edge) {
    put(x, b + 9, z, LINE);
    put(x, b + 10, z, PARAPET);
  } else {
    put(x, b + 10, z, ROOF);
  }
}

// Interior warm lights and roof plant, placed only on cells that exist and are interior.
for (const [key, b] of ground) {
  const [x, z] = key.split(",").map(Number);
  if (isEdge(x, z)) continue;
  // Ground-floor lanterns in the shop, behind the glass.
  if (z === 1 && (x === 2 || x === 9)) {
    put(x, b + 1, z, "lantern", { hanging: "false", waterlogged: "false" });
  }
  // Upper-floor glowstone behind selected windows.
  if (z === 1 && (x === 4 || x === 8)) {
    put(x, b + 7, z, "glowstone");
  }
  // Roof plant box on the deck.
  if (x >= 8 && x <= 9 && z >= 2 && z <= 3) {
    put(x, b + 11, z, EQUIP);
  }
}

g.save(`${DIR}/${ID}.nbt`);
