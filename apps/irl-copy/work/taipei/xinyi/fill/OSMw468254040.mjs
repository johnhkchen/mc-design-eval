import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw468254040";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Footprint 31 x 74. Height 23 leaves room for a sloped foundation plus the 11-block roof record.
const W = 31, H = 23, D = 74;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const has = (x, z) => ground.has(key(x, z));

const g0 = Math.min(...cells.map((c) => c[2])); // lowest ground under the building
const minX = Math.min(...cells.map((c) => c[0]));
const maxX = Math.max(...cells.map((c) => c[0]));
const mid = Math.round((minX + maxX) / 2);       // entrance centre on the north (z-min) street face

// Storey plan, relative to g0 (roof record is ~11 blocks above lowest ground):
//  n=1      floor slab / base course
//  n=2..4   storey 1 window zone (3 tall) ; n=5 spandrel
//  n=6      floor slab ; n=7..9 storey 2 window zone ; n=10 roof edge band
//  n=11     parapet (perimeter only); roof deck at n=10 inside
const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y <= gr; y++) {
    put(x, y, z, y < gr ? "stone_bricks" : "smooth_stone");
  }

  // Facade faces this cell exposes.
  const faces = [];
  if (!has(x, z - 1)) faces.push("north");
  if (!has(x, z + 1)) faces.push("south");
  if (!has(x - 1, z)) faces.push("west");
  if (!has(x + 1, z)) faces.push("east");
  const perimeter = faces.length > 0;
  const corner = faces.length >= 2;
  const face = faces[0];
  const along = face === "north" || face === "south" ? x : z;
  const paneProps = face === "north" || face === "south"
    ? { east: "true", west: "true", north: "false", south: "false" }
    : { north: "true", south: "true", east: "false", west: "false" };
  const inNorthBay = face === "north" && Math.abs(x - mid) <= 2;

  for (let yy = gr + 1; yy <= g0 + 11; yy++) {
    const n = yy - g0;

    // Parapet and roof edge
    if (n === 11) {
      if (perimeter) put(x, yy, z, "smooth_stone");
      else if ((x % 5 === 2) && (z % 7 === 3)) put(x, yy, z, "light_gray_concrete"); // roof plant
      continue;
    }
    if (n === 10) {
      if (perimeter) put(x, yy, z, "white_concrete");   // roof edge band
      else put(x, yy, z, "light_gray_concrete");        // roof deck
      continue;
    }
    if (n === 12) continue;

    // Floor slabs
    if (n === 1 || n === 6) {
      if (perimeter && n === 1) put(x, yy, z, "smooth_stone");          // base course
      else put(x, yy, z, "light_gray_concrete");
      continue;
    }

    // Spandrel band under storey 1
    if (n === 5) {
      if (perimeter) {
        if (inNorthBay) put(x, yy, z, "white_concrete");                 // entrance canopy
        else put(x, yy, z, "white_concrete");
      }
      continue;
    }

    // Warm light just inside the glass on each storey
    if (!perimeter && (n === 2 || n === 7) && ((x * 7 + z * 3) % 13 === 0)) {
      put(x, yy, z, "glowstone");
      continue;
    }

    // Window zones
    if ((n >= 2 && n <= 4) || (n >= 7 && n <= 9)) {
      if (!perimeter) continue; // interior air

      if (n <= 4 && inNorthBay) {
        const dx = x - mid;
        if (dx === 0 && n === 2) { put(x, yy, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" }); continue; }
        if (dx === 0 && n === 3) { put(x, yy, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" }); continue; }
        if (n === 4 && Math.abs(dx) === 2) { put(x, yy, z, "lantern", { hanging: "true" }); continue; }
        put(x, yy, z, "glass");
        continue;
      }

      if (corner || along % 3 === 0) {
        put(x, yy, z, "white_concrete");
      } else {
        put(x, yy, z, "light_blue_stained_glass_pane", paneProps);
      }
      continue;
    }
  }

  // Entrance canopy sits over the bay at storey-1 spandrel level (n=5)
  if (perimeter && inNorthBay) put(x, g0 + 5, z, "white_concrete");

  // Roof equipment: two-block plant boxes on the deck, away from the edge
  if (!perimeter && (x % 5 === 2) && (z % 7 === 3)) {
    put(x, g0 + 11, z, "light_gray_concrete");
    put(x, g0 + 12, z, "gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
