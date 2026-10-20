import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw980871924";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const W = 23, H = 23, D = 37;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground level
const ground = new Map();
for (const [x, z, gz] of cells) ground.set(`${x},${z}`, gz);
const has = (x, z) => ground.has(`${x},${z}`);
const perim = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Street frontage: minimum z (north edge of the footprint). Door sits at the cell
// nearest the mean x of that edge.
const minZ = Math.min(...cells.map(([, z]) => z));
const frontXs = cells.filter(([, z]) => z === minZ).map(([x]) => x);
const meanX = frontXs.reduce((a, b) => a + b, 0) / frontXs.length;
const doorX = frontXs.reduce((best, x) => (Math.abs(x - meanX) < Math.abs(best - meanX) ? x : best), frontXs[0]);
const isDoor = (x, z) => x === doorX && z === minZ;

// Pass 1: decide which cells carry glass panes (for connection props)
const paneKeys = new Set();
const paneList = [];
for (const [x, z, b] of cells) {
  if (!perim(x, z) || isDoor(x, z)) continue;
  const addPane = (y) => { paneKeys.add(`${x},${y},${z}`); paneList.push([x, y, z]); };
  // shopfront glass, skipping pilasters
  if ((x + z) % 4 !== 0) { addPane(b + 2); addPane(b + 3); }
  // upper storey windows, one bay in three
  if ((x + z) % 3 === 1) { addPane(b + 7); addPane(b + 8); }
}
const paneProps = (x, y, z) => ({
  north: paneKeys.has(`${x},${y},${z - 1}`) ? "true" : "false",
  south: paneKeys.has(`${x},${y},${z + 1}`) ? "true" : "false",
  east: paneKeys.has(`${x + 1},${y},${z}`) ? "true" : "false",
  west: paneKeys.has(`${x - 1},${y},${z}`) ? "true" : "false",
  waterlogged: "false",
});

// Pass 2: build
for (const [x, z, b] of cells) {
  const edge = perim(x, z);

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < b; y++) put(x, y, z, "stone_bricks");

  // Floor slabs: ground floor, storey 2 ceiling/floor, roof deck
  put(x, b, z, edge ? "stone_bricks" : "smooth_stone");
  put(x, b + 5, z, edge ? "smooth_quartz" : "smooth_stone");
  put(x, b + 10, z, edge ? "smooth_quartz" : "smooth_stone");

  if (!edge) {
    // Warm interior light behind upper windows and shopfronts
    if ((x + z) % 4 === 0) put(x, b + 7, z, "shroomlight");
    if ((x + z) % 5 === 0) put(x, b + 2, z, "glowstone");
    // Roof plant: small AC blocks on the deck
    if (x % 5 === 2 && z % 6 === 3) put(x, b + 11, z, "light_gray_concrete");
    continue;
  }

  // Facade (perimeter cells)
  put(x, b + 1, z, "polished_andesite");                 // base course / plinth
  put(x, b + 4, z, "light_gray_concrete");               // shopfront lintel band
  put(x, b + 6, z, "white_concrete");                    // spandrel
  put(x, b + 9, z, "white_concrete");                    // spandrel
  put(x, b + 10, z, "smooth_quartz");                    // cornice
  put(x, b + 11, z, "white_concrete");                   // parapet

  // Ground floor: glass shopfront with pilasters, entrance door
  if (isDoor(x, z)) {
    put(x, b + 1, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, b + 2, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    put(x, b + 3, z, "smooth_quartz");
  } else {
    for (const y of [b + 2, b + 3]) {
      if ((x + z) % 4 === 0) put(x, y, z, "smooth_quartz");
      else put(x, y, z, "glass_pane", paneProps(x, y, z));
    }
  }

  // Upper storey: windows in bays, white concrete piers between
  if (paneKeys.has(`${x},${b + 7},${z}`)) {
    put(x, b + 7, z, "glass_pane", paneProps(x, b + 7, z));
    put(x, b + 8, z, "glass_pane", paneProps(x, b + 8, z));
  } else {
    put(x, b + 7, z, "smooth_quartz");
    put(x, b + 8, z, "smooth_quartz");
  }
}

// Entrance canopy: a short lintel-height strip of quartz slab across the door bay
for (let dx = -1; dx <= 1; dx++) {
  const x = doorX + dx;
  if (has(x, minZ) && !isDoor(x, minZ)) {
    const b = ground.get(`${x},${minZ}`);
    put(x, b + 4, minZ, "smooth_quartz");
  }
}

g.save(`${DIR}/${ID}.nbt`);
