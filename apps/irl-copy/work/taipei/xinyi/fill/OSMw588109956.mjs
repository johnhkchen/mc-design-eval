import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// OSMw588109956: unnamed mid-rise commercial block, Xinyi district.
// Read as a late-1990s/2000s four-storey office-over-shop block: white
// concrete skin, smooth quartz piers, light-blue glass in a 3-row window grid
// per storey, stone base and storey lines, cornice and parapet, one entrance
// with a dark oak door, and a plant penthouse with lanterns on the roof.
// Roof deck y=20, parapet top y=21, plant box to y=24, lanterns to y=25.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw588109956";
const W = 27, H = 33, D = 45;
const DECK = 20;   // roof deck (top of storey 4)
const ROOF = 21;   // parapet top
const PLANT_TOP = 24;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gy] of cells) ground.set(`${x},${z}`, gy);

const has = (x, z) => ground.has(`${x},${z}`);
const G = (x, z) => ground.get(`${x},${z}`);
const NB = [[1, 0, "east"], [-1, 0, "west"], [0, 1, "south"], [0, -1, "north"]];
const outward = (x, z) => NB.filter(([dx, dz]) => !has(x + dx, z + dz));

// Depth from the outside: 1 = facade skin, 2+ = behind the skin.
const depth = new Map();
const queue = [];
for (const key of ground.keys()) {
  const [x, z] = key.split(",").map(Number);
  if (outward(x, z).length) { depth.set(key, 1); queue.push([x, z]); }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  const d = depth.get(`${x},${z}`);
  for (const [dx, dz] of NB) {
    const k = `${x + dx},${z + dz}`;
    if (has(x + dx, z + dz) && !depth.has(k)) {
      depth.set(k, d + 1);
      queue.push([x + dx, z + dz]);
    }
  }
}
const D_OF = (x, z) => depth.get(`${x},${z}`) ?? 1;

// Bounding box of the footprint.
let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const key of ground.keys()) {
  const [x, z] = key.split(",").map(Number);
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}
const cx = (minX + maxX) / 2;

// Main entrance: on the south (+z) facade if there is one, nearest the centre.
let door = null;
{
  let best = Infinity;
  for (const key of ground.keys()) {
    const [x, z] = key.split(",").map(Number);
    if (D_OF(x, z) !== 1) continue;
    const out = outward(x, z);
    if (!out.length) continue;
    const pick = out.find((o) => o[1] === 1) ?? out[0];
    const score = (pick[1] === 1 ? 0 : 1000) + Math.abs(x - cx);
    if (score < best) { best = score; door = { x, z, facing: pick[2] }; }
  }
}
const doorKey = door ? `${door.x},${door.z}` : null;

const isPier = (x, z) => (x + z) % 3 === 0;
const isWindowRow = (y) => [1, 2, 3].includes(y % 5);

// Glass pane cells: facade, window row, above the plinth, not a pier, not the door.
function isGlass(x, y, z) {
  if (!has(x, z) || D_OF(x, z) !== 1) return false;
  if (!isWindowRow(y) || y <= G(x, z)) return false;
  if (y > DECK) return false;
  if (`${x},${z}` === doorKey) return false;
  return !isPier(x, z);
}

const g = new Voxels([W, H, D]);
const set = (x, y, z, id, props) => {
  if (y < 0 || y >= H || x < 0 || x >= W || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props); else g.set(x, y, z, id);
};

// Plant penthouse footprint: interior cells in the middle third of the box.
const w = maxX - minX + 1, l = maxZ - minZ + 1;
const inPlant = (x, z) =>
  D_OF(x, z) >= 4 &&
  x >= minX + Math.floor(w / 3) && x <= maxX - Math.floor(w / 3) &&
  z >= minZ + Math.floor(l / 3) && z <= maxZ - Math.floor(l / 3);

for (const key of ground.keys()) {
  const [x, z] = key.split(",").map(Number);
  const gy = G(x, z);
  const d = D_OF(x, z);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gy; y++) set(x, y, z, "stone_bricks");

  if (d === 1) {
    // ---- Facade skin, from ground to parapet ----
    for (let y = gy; y <= ROOF; y++) {
      if (y === gy) { set(x, y, z, "smooth_stone"); continue; }           // base course
      if (y === DECK) { set(x, y, z, "smooth_stone"); continue; }         // cornice
      if (y === ROOF) { set(x, y, z, "white_concrete"); continue; }       // parapet
      if (y % 5 === 0) { set(x, y, z, "smooth_stone"); continue; }        // storey line
      if (y % 5 === 4) { set(x, y, z, "light_gray_concrete"); continue; } // spandrel

      // Window rows (y % 5 in 1..3)
      if (door && x === door.x && z === door.z && (y === gy + 1 || y === gy + 2)) {
        set(x, y, z, "dark_oak_door", {
          facing: door.facing,
          half: y === gy + 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
          ...(y === gy + 1 ? {} : {}),
        });
        continue;
      }
      if (isPier(x, z)) { set(x, y, z, "smooth_quartz"); continue; }
      if (!isGlass(x, y, z)) { set(x, y, z, "white_concrete"); continue; }

      const props = {
        north: isGlass(x, y, z - 1) ? "true" : "false",
        south: isGlass(x, y, z + 1) ? "true" : "false",
        east: isGlass(x + 1, y, z) ? "true" : "false",
        west: isGlass(x - 1, y, z) ? "true" : "false",
        waterlogged: "false",
      };
      set(x, y, z, "light_blue_stained_glass_pane", props);
    }
  } else {
    // ---- Behind the skin: air gap, floor slabs, deck ----
    for (let y = gy; y <= DECK; y++) {
      if (y === DECK) { set(x, y, z, "light_gray_concrete"); continue; }
      if (y === gy || y % 5 === 0) { set(x, y, z, "light_gray_concrete"); continue; }
      // Warm light just behind some glass panes.
      if (isWindowRow(y)) {
        const lit = NB.some(([dx, dz]) => {
          const nx = x + dx, nz = z + dz;
          return has(nx, nz) && isGlass(nx, y, nz) &&
            ((nx * 7 + nz * 13 + y * 5) % 9 === 0);
        });
        if (lit) set(x, y, z, "glowstone");
      }
    }
  }

  // ---- Plant penthouse on the roof ----
  if (inPlant(x, z)) {
    for (let y = ROOF; y <= PLANT_TOP; y++) {
      set(x, y, z, y === PLANT_TOP ? "smooth_stone" : "light_gray_concrete");
    }
    if (x % 4 === 0 && z % 4 === 0) {
      set(x, PLANT_TOP + 1, z, "lantern", { hanging: "false", waterlogged: "false" });
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
