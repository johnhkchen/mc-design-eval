import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542683426";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 25, D = 7, H = 23;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground y
const gr = new Map();
for (const [x, z, ground] of cells) gr.set(`${x},${z}`, ground);
const has = (x, z) => gr.has(`${x},${z}`);

// Perimeter cell: bounding-box edge or a neighbour outside the footprint
const isEdge = (x, z) =>
  x === 0 || x === W - 1 || z === 0 || z === D - 1 ||
  !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

const put = (x, y, z, id, props) => {
  if (y < 0 || y >= H || x < 0 || x >= W || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Pane orientation: along x-facing facades connect east/west, end walls connect north/south
const PANE_X = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const PANE_Z = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

for (const [x, z, G] of cells) {
  const edge = isEdge(x, z);

  // Foundation fill up to this cell's ground
  for (let y = 0; y < G; y++) put(x, y, z, "stone_bricks");

  // Base course at ground level
  put(x, G, z, edge ? "stone_bricks" : "smooth_stone");

  // Floor slab at storey line (r=5) and roof deck (r=10), full footprint
  put(x, G + 5, z, "smooth_stone");
  put(x, G + 10, z, "smooth_stone");

  if (edge) {
    const alongX = z === 0 || z === D - 1;     // facade runs along the 25-block length
    const corner = (x === 0 || x === W - 1) && (z === 0 || z === D - 1);
    const shop = z === 0;                       // Songgao-side frontage with shopfront
    const pier = alongX
      ? (x % 4 === 0 || x === 0 || x === W - 1)
      : (z === 0 || z === D - 1);
    const paneProps = alongX ? PANE_X : PANE_Z;

    for (let r = 1; r <= 9; r++) {
      const y = G + r;
      if (r === 5) { put(x, y, z, "smooth_stone"); continue; }     // belt course
      if (r === 9) { put(x, y, z, "smooth_stone"); continue; }     // cornice band
      if (pier) { put(x, y, z, "white_concrete"); continue; }
      if (shop && r === 1 && x === 10) {
        // Entrance door, lower half (r=1,2 handled below)
      }
      if (shop && x === 10 && (r === 1 || r === 2)) {
        put(x, y, z, "dark_oak_door", {
          facing: "north",
          half: r === 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
        continue;
      }
      if (r === 4 || r === 6) { put(x, y, z, "light_gray_concrete"); continue; } // spandrels
      if (shop && r <= 3) { put(x, y, z, "glass"); continue; }                  // shopfront glazing
      put(x, y, z, "light_blue_stained_glass_pane", paneProps);                 // window glazing
    }

    // Parapet on the roof deck
    put(x, G + 10, z, "smooth_stone");
    put(x, G + 11, z, corner ? "white_concrete" : "white_concrete");

    // Warm light behind the upper-floor windows, inside the air gap
    if (alongX && z === 0 && x % 8 === 2 && x % 4 !== 0) {
      put(x, G + 7, 1, "shroomlight");
    }
    if (alongX && z === D - 1 && x % 8 === 6 && x % 4 !== 0) {
      put(x, G + 7, D - 2, "glowstone");
    }

    // Hanging lantern over the entrance, hung from the first-floor slab
    if (shop && x === 10) {
      put(x, G + 4, 1, "lantern", { hanging: "true", waterlogged: "false" });
    }
  } else {
    // Interior: air gap, floor slabs only (already placed above)
  }
}

// Roof equipment: a plant box and a small stair penthouse, one block high
for (const [x, z, G] of cells) {
  if (isEdge(x, z)) continue;
  if (x >= 5 && x <= 7 && z >= 2 && z <= 4) put(x, G + 11, z, "light_gray_concrete");
  if (x >= 19 && x <= 20 && z >= 2 && z <= 3) put(x, G + 11, z, "stone_bricks");
}

g.save(`${DIR}/${ID}.nbt`);
