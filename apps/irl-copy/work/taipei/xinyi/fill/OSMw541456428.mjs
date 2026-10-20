import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw541456428";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

const W = 19, H = 23, D = 19;
const g = new Voxels([W, H, D]);

// Footprint lookup: key "x,z" -> ground y
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

// A cell is an edge cell if any 4-neighbour is outside the footprint
const isEdge = (x, z) => !(has(x - 1, z) && has(x + 1, z) && has(x, z - 1) && has(x, z + 1));
// Interior cell next to an edge cell (lit room behind a window)
const nearEdge = (x, z) => [[1,0],[-1,0],[0,1],[0,-1]].some(([dx, dz]) => has(x + dx, z + dz) && isEdge(x + dx, z + dz));

// Entrance: edge cell on the north face (no neighbour at z-1), lowest z then lowest x
let door = null;
for (const [x, z] of cells) {
  if (!isEdge(x, z) || has(x, z - 1)) continue;
  if (!door || z < door.z || (z === door.z && x < door.x)) door = { x, z };
}
if (!door) {
  for (const [x, z] of cells) if (isEdge(x, z)) { door = { x, z }; break; }
}

for (const [x, z, G] of cells) {
  const e = isEdge(x, z);
  const u = x + z;
  const top = G + 11;
  if (top >= H) throw new Error(`roof above canvas at ${x},${z}`);

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < G; y++) g.set(x, y, z, "stone_bricks");

  // Ground floor slab
  g.set(x, G, z, "smooth_stone");

  // ---- Ground storey (G+1 .. G+4) ----
  if (e) {
    const isDoor = door && door.x === x && door.z === z;
    if (isDoor) {
      g.set(x, G + 1, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      g.set(x, G + 2, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    } else {
      g.set(x, G + 1, z, "polished_granite");           // base course
    }
    for (const y of [G + 2, G + 3]) {
      if (isDoor && y === G + 2) continue;
      if (u % 3 === 0) g.set(x, y, z, "white_concrete"); // mullion
      else g.set(x, y, z, "light_blue_stained_glass_pane");
    }
    if (!(isDoor)) g.set(x, G + 3, z, u % 3 === 0 ? "white_concrete" : "light_blue_stained_glass_pane");
    g.set(x, G + 4, z, "light_gray_concrete");          // lintel belt
  } else if (nearEdge(x, z) && (x * 3 + z * 5) % 4 === 0) {
    g.set(x, G + 2, z, "glowstone");                    // warm light behind glass
  }

  // Floor slab between storeys
  g.set(x, G + 5, z, "smooth_stone");

  // ---- Upper storey (G+6 .. G+9) ----
  if (e) {
    g.set(x, G + 6, z, "white_concrete");
    for (const y of [G + 7, G + 8]) {
      if (u % 3 === 0) g.set(x, y, z, "white_concrete");
      else g.set(x, y, z, "light_blue_stained_glass_pane");
    }
    g.set(x, G + 9, z, "light_gray_concrete");
  } else if (nearEdge(x, z) && (x * 5 + z * 2) % 4 === 1) {
    g.set(x, G + 7, z, "shroomlight");
  }

  // Roof deck and cornice
  g.set(x, G + 10, z, e ? "stone_bricks" : "smooth_stone");

  // Parapet and roof equipment
  if (e) {
    g.set(x, G + 11, z, "white_concrete");
  } else if (x % 6 === 3 && z % 6 === 3) {
    g.set(x, G + 11, z, "iron_block");                  // roof plant unit
  }
}

g.save(`${dir}/${id}.nbt`);
