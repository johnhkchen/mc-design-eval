import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: none. Read as a 1980s-90s low-rise commercial block in Xinyi:
// white tiled concrete walls, quartz-faced pilasters, a glazed shopfront
// on the street face, two storeys of ribbon windows, a parapet, and roof plant.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542431043";
const W = 26, H = 23, D = 14;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const minG = Math.min(...cells.map(c => c[2]));
const maxX = Math.max(...cells.map(c => c[0]));
const maxZ = Math.max(...cells.map(c => c[1]));
const ROOF = minG + 11; // top block of parapet and roof deck

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Which exterior face a cell sits on (street side first: N = z min).
function faceOf(x, z) {
  if (!has(x, z - 1)) return "N";
  if (!has(x, z + 1)) return "S";
  if (!has(x - 1, z)) return "W";
  if (!has(x + 1, z)) return "E";
  return null;
}

const INWARD = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };

for (const [x, z, gr] of cells) {
  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const face = faceOf(x, z);
  const perim = face !== null;

  for (let y = gr; y <= ROOF; y++) {
    const k = y - minG;

    if (!perim) {
      // Interior: floor slabs and roof deck only, air between (no interiors).
      if (k === 11) put(x, y, z, "gray_concrete");
      else if (k === 5 || k === 0) put(x, y, z, "smooth_stone");
      continue;
    }

    // Base course at the ground line.
    if (y === gr) { put(x, y, z, "polished_granite"); continue; }
    // Parapet cap.
    if (k === 11) { put(x, y, z, "smooth_stone"); continue; }
    // Cornice course under the parapet.
    if (k === 10) { put(x, y, z, "white_concrete"); continue; }
    // Storey line between floors.
    if (k === 5) { put(x, y, z, "smooth_stone"); continue; }
    // Ground-level wall course.
    if (k === 0) { put(x, y, z, "white_concrete"); continue; }

    const alongX = face === "N" || face === "S";
    const pillar = alongX ? (x % 3 === 0 || x === maxX) : (z % 3 === 0 || z === maxZ);
    const glass = alongX
      ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
      : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

    // Storey 1 (k 1..4)
    if (k >= 1 && k <= 4) {
      if (k === 4) {
        if (face === "N" && x >= 11 && x <= 14) {
          // Entrance canopy projecting over the door.
          put(x, y, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
          put(x, y, z + 1, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
        } else {
          put(x, y, z, "smooth_quartz");
        }
        continue;
      }
      if (face === "N") {
        // Shopfront: glazed bays with quartz pilasters; door at x = 12.
        if (x === 12 && k <= 2) {
          const half = k === 1 ? "lower" : "upper";
          put(x, y, z, "dark_oak_door", { facing: "north", half, hinge: "left", open: "false", powered: "false" });
          continue;
        }
        if (pillar) put(x, y, z, "smooth_quartz");
        else put(x, y, z, "glass_pane", glass);
        continue;
      }
      // Other storey-1 faces
      if (k === 1) { put(x, y, z, "white_concrete"); continue; }
      if (pillar) put(x, y, z, "smooth_quartz");
      else put(x, y, z, "glass_pane", glass);
      continue;
    }

    // Storey 2 (k 6..9)
    if (k === 6 || k === 9) { put(x, y, z, "smooth_quartz"); continue; }
    if (k === 7 || k === 8) {
      if (pillar) { put(x, y, z, "smooth_quartz"); continue; }
      put(x, y, z, "glass_pane", glass);
      // Warm light behind some windows.
      if (k === 7 && ((x * 7 + z * 3) % 5 === 0)) {
        const [dx, dz] = INWARD[face];
        if (has(x + dx, z + dz)) put(x + dx, y, z + dz, "glowstone");
      }
    }
  }
}

// Roof plant: an air-handling plinth and a smaller unit on the roof deck.
for (let y = ROOF + 1; y <= ROOF + 2; y++) {
  for (let x = 4; x <= 8; x++) for (let z = 4; z <= 8; z++) {
    if (has(x, z)) put(x, y, z, "light_gray_concrete");
  }
}
for (let x = 17; x <= 20; x++) for (let z = 3; z <= 5; z++) {
  if (has(x, z)) put(x, ROOF + 1, z, "gray_concrete");
}

g.save(`${DIR}/${ID}.nbt`);
