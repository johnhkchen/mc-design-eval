import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Mid-rise Xinyi commercial block, c. 1990s-2000s: four storeys of 5 blocks,
// white concrete frame, blue-tinted glazing, quartz belt courses, parapet roof.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw587174717";
const W = 54, D = 16, H = 33;
const ROOF = 21;   // roof height above lowest ground (lidar)
const BAY = 3;     // mullion spacing in blocks
const DOOR_X = 26;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const ground = new Map();
for (const [x, z, gy] of cells) {
  if (x >= 0 && x < W && z >= 0 && z < D) ground.set(`${x},${z}`, gy);
}
let minG = Infinity;
for (const gy of ground.values()) minG = Math.min(minG, gy);
if (!Number.isFinite(minG)) minG = 0;

const g = new Voxels([W, H, D]);

const inFp = (x, z) => ground.has(`${x},${z}`);

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Facade material for a perimeter cell at local height h (0 = base course).
function facade(x, z, h) {
  const r = h % 5;
  if (h === 0) return "polished_andesite";          // base course
  if (h === ROOF) return "white_concrete";          // parapet
  if (r === 0) return "smooth_quartz";              // storey belts and cornice
  if (r === 4) return "white_concrete";             // spandrel
  // window rows (r = 1..3)
  const onX = x === 0 || x === W - 1;
  const onZ = z === 0 || z === D - 1;
  let mullion;
  if (onX && onZ) mullion = true;
  else if (onZ) mullion = x % BAY === 0;
  else if (onX) mullion = z % BAY === 0;
  else mullion = true;
  return mullion ? "white_concrete" : "light_blue_stained_glass";
}

for (const [key, gy] of ground) {
  const [x, z] = key.split(",").map(Number);
  const base = gy - minG;   // building floor level for this cell
  const top = base + ROOF;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < base; y++) put(x, y, z, "stone_bricks");

  const perimeter = !inFp(x - 1, z) || !inFp(x + 1, z) || !inFp(x, z - 1) || !inFp(x, z + 1);

  if (perimeter) {
    const onX = x === 0 || x === W - 1;
    const onZ = z === 0 || z === D - 1;
    for (let h = 0; h <= ROOF; h++) {
      const y = base + h;
      if (y >= H) break;

      // Entrance on the front (z = 0) ground floor.
      if (z === 0 && x === DOOR_X && (h === 1 || h === 2)) {
        put(x, y, z, "dark_oak_door", {
          facing: "north",
          half: h === 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
        continue;
      }

      const id = facade(x, z, h);
      put(x, y, z, id);

      // Warm lights set back behind some glass windows.
      if (id === "light_blue_stained_glass" && h % 5 === 2) {
        const f = Math.floor(h / 5);
        const sel = (x + f * 7 + (onZ ? 0 : z)) % 4 === 0;
        if (sel) {
          if (z === 0) put(x, y, 1, "glowstone");
          else if (z === D - 1) put(x, y, D - 2, "glowstone");
          else if (x === 0) put(1, y, z, "glowstone");
          else if (x === W - 1) put(W - 2, y, z, "glowstone");
        }
      }
    }
    // Parapet cap line sits on top of the parapet course.
    if (top < H) put(x, top, z, "smooth_quartz_slab", { type: "top", waterlogged: "false" });
  } else {
    // Interior: floor slabs per storey and roof deck; air between them (no interiors).
    for (const h of [0, 5, 10, 15, 20]) {
      const y = base + h;
      const id = h === 0 ? "smooth_stone" : h === 20 ? "light_gray_concrete" : "white_concrete";
      put(x, y, z, id);
    }
    // Rooftop plant penthouse on the roof deck.
    if (x >= 18 && x <= 30 && z >= 4 && z <= 11) {
      put(x, base + ROOF, z, "light_gray_concrete");
      if (x >= 20 && x <= 24 && z >= 5 && z <= 9) put(x, base + ROOF + 1, z, "smooth_stone");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
