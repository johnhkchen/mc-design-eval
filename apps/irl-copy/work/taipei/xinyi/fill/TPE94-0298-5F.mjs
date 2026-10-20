import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Oral Medicine Building (口腔醫學大樓), Xinyi, Taipei. Built 2005.
// Reading: 2 storeys of ~5 blocks on a white-tiled concrete frame with a
// light-blue glass band, stone plinth, light-grey spandrels, white parapet.
// Roof slab at y=11 above the lowest ground (ROOF), parapet at 12, plant at 13-14.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE94-0298-5F";
const W = 16, H = 23, D = 15;
const ROOF = 11;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const map = new Map();
for (const [x, z, gr] of cells) map.set(`${x},${z}`, gr);
const has = (x, z) => map.has(`${x},${z}`);

const xs = cells.map((c) => c[0]);
const zs = cells.map((c) => c[1]);
const minX = Math.min(...xs), maxX = Math.max(...xs);
const minZ = Math.min(...zs), maxZ = Math.max(...zs);
const midX = minX + Math.floor((maxX - minX) / 2);

function put(x, y, z, id, props) {
  if (x < 0 || z < 0 || y < 0 || x >= W || z >= D || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

const PANE_NS = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const PANE_EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Exterior face of a perimeter cell.
function faceOf(x, z) {
  if (!has(x, z - 1)) return "N";
  if (!has(x, z + 1)) return "S";
  if (!has(x + 1, z)) return "E";
  if (!has(x - 1, z)) return "W";
  return null;
}

for (const [x, z, gr] of cells) {
  const face = faceOf(x, z);
  const top = Math.max(ROOF, gr + 1);

  // Foundation under every footprint cell, so nothing floats on the slope.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (face) {
    const nsFace = face === "N" || face === "S";
    const idx = nsFace ? x - minX : z - minZ;
    const len = nsFace ? maxX - minX : maxZ - minZ;
    const pier = idx % 3 === 0 || idx === len;
    const isEntrance = face === "S" && z === maxZ && x === midX;
    const pane = nsFace ? PANE_NS : PANE_EW;

    for (let y = gr; y < top; y++) {
      const rel = y - gr;
      // Plinth course.
      if (rel === 0) { put(x, y, z, "stone_bricks"); continue; }
      // Storey lines as projecting cornice: top slab gives a shadow line.
      if (rel % 5 === 0) { put(x, y, z, "stone_brick_slab", { type: "top", waterlogged: "false" }); continue; }
      // Entrance: door at rel 1-2, lantern hanging under the spandrel at rel 3.
      if (isEntrance && (rel === 1 || rel === 2)) {
        put(x, y, z, "iron_door", {
          facing: "south",
          half: rel === 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
        continue;
      }
      if (isEntrance && rel === 3) {
        put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
        continue;
      }
      // Tiled piers, quartz-banded so the walls are not one flat colour.
      if (pier) { put(x, y, z, rel % 5 === 2 ? "quartz_block" : "white_concrete"); continue; }
      // Spandrels above and below each window band.
      if (rel % 5 === 1 || rel % 5 === 4) { put(x, y, z, "light_gray_concrete"); continue; }
      // Glass band; only a sparse few windows are lit from behind.
      const lit = ((idx * 7 + x * 5 + z * 3) % 11 === 0) && (rel === 2 || rel === 7);
      if (lit) put(x, y, z, "glowstone");
      else put(x, y, z, "light_blue_stained_glass_pane", pane);
    }

    // Parapet ring on the roof edge.
    put(x, top, z, "light_gray_concrete");
    put(x, top + 1, z, "white_concrete");
  } else {
    // Interior footprint cells: floor slabs per storey, air between, hanging lanterns.
    for (let y = gr; y < top; y++) {
      const rel = y - gr;
      if (rel % 5 === 0) {
        put(x, y, z, "smooth_stone");
      } else if (rel % 5 === 4 && ((x * 5 + z * 3) % 7 === 0)) {
        put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
      }
    }
    put(x, top, z, "light_gray_concrete");

    // Roof plant room near the centre of the footprint.
    if (x >= minX + 5 && x <= minX + 8 && z >= minZ + 4 && z <= minZ + 7) {
      put(x, top + 1, z, "gray_concrete");
      put(x, top + 2, z, "white_concrete");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
