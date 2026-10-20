import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no name. Lidar roof ~11 blocks above lowest ground, so two storeys of
// about 5 blocks, a flat concrete commercial/office block of the 1980s-90s
// Taipei type: white concrete piers, glazed bays, light concrete bands,
// shopfront at street level, rooftop plant.

const id = "OSMw538403762";
const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

const W = 20, H = 23, D = 19;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const cellMap = new Map();
for (const [x, z, gr] of cells) cellMap.set(key(x, z), gr);
const inFoot = (x, z) => cellMap.has(key(x, z));

const L0 = Math.min(...cells.map((c) => c[2])); // lowest ground under the footprint
const TOP = Math.min(L0 + 11, H - 1);           // roof / parapet top

const put = (x, y, z, b, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

// Facade material for one edge cell at height y. `bay` is the along-edge index.
function facadeBlock(y, bay) {
  const pier = bay % 3 === 0;
  if (y === L0 + 1) return "polished_granite";                    // plinth
  if (y >= L0 + 2 && y <= L0 + 5) {                               // storey 1 (shopfront)
    if (y === L0 + 2) return "white_concrete";                    // spandrel
    if (y === L0 + 5) return "light_gray_concrete";               // lintel band
    if (pier) return "white_concrete";
    if (bay % 6 === 4 && y === L0 + 4) return "shroomlight";      // warm lit window
    return "glass";
  }
  if (y === L0 + 6) return "light_gray_concrete";                 // floor line
  if (y >= L0 + 7 && y <= L0 + 9) {                               // storey 2
    if (y === L0 + 7) return "white_concrete";
    if (y === L0 + 9) return "light_gray_concrete";               // cornice band
    if (pier) return "white_concrete";
    if (bay % 6 === 1 && y === L0 + 8) return "shroomlight";
    return "glass";
  }
  if (y === L0 + 10) return "white_concrete";                     // parapet course
  if (y === L0 + 11) return "smooth_stone";                       // parapet cap
  return "white_concrete";
}

// Find the entrance cell on the north (-z) street face nearest the middle.
let door = null;
for (const [x, z] of cellMap.keys().map((k) => k.split(",").map(Number))) {
  if (inFoot(x, z - 1)) continue;
  if (!door || Math.abs(x - 10) < Math.abs(door.x - 10)) door = { x, z };
}

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y <= gr; y++) put(x, y, z, "smooth_stone");

  // Floor slabs and roof slab across the whole footprint (no interiors).
  for (const y of [L0 + 1, L0 + 6, L0 + 10]) {
    put(x, y, z, "light_gray_concrete");
  }

  // Facade on exposed sides.
  const sides = [];
  if (!inFoot(x, z - 1)) sides.push("n");
  if (!inFoot(x, z + 1)) sides.push("s");
  if (!inFoot(x - 1, z)) sides.push("w");
  if (!inFoot(x + 1, z)) sides.push("e");

  if (sides.length) {
    const corner = sides.length > 1;
    for (let y = Math.max(L0 + 1, gr + 1); y <= TOP; y++) {
      const bay = sides.includes("n") || sides.includes("s") ? x : z;
      let b = facadeBlock(y, bay);
      if (corner && y >= L0 + 2 && y <= L0 + 9 && b === "glass") b = "white_concrete";
      put(x, y, z, b);
    }
  }
}

// Entrance on the north face: door, canopy-style hanging lantern.
if (door) {
  const { x, z } = door;
  put(x, L0 + 2, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(x, L0 + 3, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  put(x, L0 + 4, z, "lantern", { hanging: "true", waterlogged: "false" });
  // Keep the entrance flanks clear of glazing right beside the door.
  for (const dx of [-1, 1]) {
    if (inFoot(x + dx, z)) put(x + dx, L0 + 2, z, "white_concrete");
  }
}

// Rooftop plant: a few small service boxes on interior roof cells.
for (const [x, z, gr] of cells) {
  const interior = inFoot(x, z - 1) && inFoot(x, z + 1) && inFoot(x - 1, z) && inFoot(x + 1, z);
  if (interior && x % 6 === 3 && z % 6 === 3) {
    put(x, L0 + 11, z, "light_gray_concrete");
    put(x, L0 + 12, z, "white_concrete");
  }
}

g.save(`${dir}/${id}.nbt`);
