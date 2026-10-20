import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1071343765";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 41, H = 23, D = 27;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground height
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

// Bounds-checked setter; props optional
function put(x, y, z, block, props) {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (!has(x, z)) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
}

// Edge cell: some side neighbour lies outside the footprint
const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Mid-century-style 2-storey commercial block: stone plinth, quartz facade,
// pillared glass band, flat roof with parapet and a central plant room.
// Storey lines (relative to each cell's ground gr):
//   gr+1      plinth course
//   gr+2..3   ground-storey glazing band
//   gr+4      spandrel
//   gr+5      floor slab (storey line)
//   gr+6      spandrel
//   gr+7..8   upper glazing band
//   gr+9      spandrel
//   gr+10     roof slab / cornice
//   gr+11     parapet (edge only)
//   gr+11..12 plant room (centre)
for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to ground
  for (let y = 0; y <= gr; y++) put(x, y, z, "stone_bricks");

  // Floor slab at the storey line, and the roof slab, across the whole footprint
  put(x, gr + 5, z, "light_gray_concrete");
  put(x, gr + 10, z, "gray_concrete");

  if (!isEdge(x, z)) continue;

  // Orientation of the wall this cell belongs to
  const wallAlongZ = !has(x - 1, z) || !has(x + 1, z);
  const paneProps = wallAlongZ
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

  // Entrance on the south (max z) edge, central bay of the long frontage
  const isEntrance = !has(x, z + 1) && x >= 19 && x <= 21;

  // Ground storey
  put(x, gr + 1, z, "polished_andesite");
  for (const y of [gr + 2, gr + 3]) {
    const pillar = (x + z) % 3 === 0;
    if (isEntrance) {
      if (y === gr + 2) {
        // doorway opening, lantern hung just inside the lintel
        put(x, y, z, "air");
        continue;
      }
      put(x, y, z, "smooth_quartz");
      continue;
    }
    if (pillar) put(x, y, z, "white_concrete");
    else if ((x * 7 + z * 3 + y) % 11 === 0) put(x, y, z, "glowstone");
    else put(x, y, z, "light_blue_stained_glass_pane", paneProps);
  }
  if (isEntrance) {
    // lintel row above the doorway, with a hanging lantern under it
    put(x, gr + 3, z, "smooth_quartz");
    if (x === 20) put(x, gr + 2, z, "lantern", { hanging: "true", waterlogged: "false" });
  }
  put(x, gr + 4, z, "smooth_quartz");

  // Upper storey
  put(x, gr + 6, z, "smooth_quartz");
  for (const y of [gr + 7, gr + 8]) {
    const pillar = (x + z) % 3 === 0;
    if (pillar) put(x, y, z, "white_concrete");
    else if ((x * 5 + z * 7 + y) % 13 === 0) put(x, y, z, "shroomlight");
    else put(x, y, z, "light_blue_stained_glass_pane", paneProps);
  }
  put(x, gr + 9, z, "smooth_quartz");

  // Cornice and parapet
  put(x, gr + 10, z, "smooth_quartz_slab", { type: "top", waterlogged: "false" });
  put(x, gr + 11, z, "white_concrete");
}

// Roof plant room in the centre of the roof, standing on the roof slab
for (const [x, z, gr] of cells) {
  if (isEdge(x, z)) continue;
  if (x >= 14 && x <= 20 && z >= 9 && z <= 15) {
    put(x, gr + 11, z, "iron_block");
    if (x >= 15 && x <= 19 && z >= 10 && z <= 14) put(x, gr + 12, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
