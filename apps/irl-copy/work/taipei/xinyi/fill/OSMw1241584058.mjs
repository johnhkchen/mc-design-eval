import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low two-storey Xinyi-style commercial/civic block: 1990s-2000s,
// pale concrete frame, light-blue glass bays, quartz parapet, rooftop plant room.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1241584058";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 45, H = 23, D = 15;
const ROOF = 11;                 // roof level above the lowest ground (y 0)
const g = new Voxels([W, H, D]);

// ---- footprint lookup -------------------------------------------------------
const lo = Math.min(...cells.map(c => Math.round(c[2])));
const ground = new Map();
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, Math.min(Math.round(gr) - lo, ROOF - 1));
}
const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

// exterior face of a cell: z-faces take priority so the long sides read as fronts
function faceOf(x, z) {
  if (!has(x, z - 1)) return "N";
  if (!has(x, z + 1)) return "S";
  if (!has(x - 1, z)) return "W";
  if (!has(x + 1, z)) return "E";
  return null;
}

// main entrance: median cell along the north (z-min) exterior run
const northXs = cells
  .filter(([x, z]) => faceOf(x, z) === "N")
  .map(([x]) => x)
  .sort((a, b) => a - b);
const doorX = northXs.length ? northXs[Math.floor(northXs.length / 2)] : Math.floor(W / 2);
const doorKey = `${doorX},${northXs.length ? cells.find(([x, z]) => x === doorX && faceOf(x, z) === "N")?.[1] ?? 0 : 0}`;

// ---- facade vocabulary -------------------------------------------------------
function wallId(t, y, gg) {
  if (y === ROOF) return "smooth_quartz";                 // parapet cap
  if (y === 5 || y === 10) return "light_gray_concrete";  // storey spandrels
  if (y === gg + 1) return "polished_andesite";           // base course
  if (t % 3 === 0) return "quartz_pillar";                // mullions
  const upper = y >= 6;
  if (upper && y === 7 && t % 6 === 4) return "glowstone"; // warm light behind glass
  if (!upper && y === 3 && t % 6 === 4) return "glowstone";
  return "light_blue_stained_glass";
}

// ---- build columns -------------------------------------------------------
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  const gg = gAt(x, z);

  // foundation: solid from y 0 up to the cell's ground
  for (let y = 0; y < gg; y++) g.set(x, y, z, "stone_bricks");
  g.set(x, gg, z, "smooth_stone");

  const f = faceOf(x, z);
  const t = (f === "N" || f === "S") ? x : z;
  const isDoorCell = `${x},${z}` === doorKey;

  for (let y = gg + 1; y <= ROOF; y++) {
    if (f) {
      // entrance: door, glass flanks and a quartz canopy over the door
      if (f === "N" && isDoorCell && (y === gg + 1 || y === gg + 2)) {
        g.set(x, y, z, "dark_oak_door", {
          facing: "north",
          half: y === gg + 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
        continue;
      }
      if (f === "N" && Math.abs(x - doorX) <= 1 && y === gg + 4 && z === 0) {
        g.set(x, y, z, "smooth_quartz");
        continue;
      }
      g.set(x, y, z, wallId(t, y, gg));
    } else {
      // interior: no rooms, only storey slabs, a roof deck and an air gap
      if (y === 5 || y === 10) g.set(x, y, z, "smooth_stone");
      else if (y === ROOF) g.set(x, y, z, "stone");
    }
  }
}

// ---- rooftop plant room -----------------------------------------------------
for (let x = 30; x <= 35; x++) {
  for (let z = 4; z <= 10; z++) {
    if (!has(x, z) || gAt(x, z) >= ROOF) continue;
    const edge = x === 30 || x === 35 || z === 4 || z === 10;
    for (let y = ROOF + 1; y <= ROOF + 2; y++) {
      if (edge) g.set(x, y, z, "light_gray_concrete");
    }
    g.set(x, ROOF + 3, z, "smooth_quartz");
  }
}

g.save(`${DIR}/${ID}.nbt`);
