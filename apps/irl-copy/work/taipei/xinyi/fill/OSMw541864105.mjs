import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw541864105.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw541864105.nbt";

const W = 16, H = 23, D = 14;
const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const ground = new Map();
for (const [x, z, gy] of cells) {
  if (x >= 0 && x < W && z >= 0 && z < D) ground.set(`${x},${z}`, Math.round(gy));
}
const has = (x, z) => ground.has(`${x},${z}`);
const G = (x, z) => ground.get(`${x},${z}`);

// Lowest ground under the footprint; storeys are cut from it.
const L = Math.min(...ground.values());
const ROOF_FLOOR = L + 10; // roof slab / cornice level
const CX = [...ground.keys()].map(k => +k.split(",")[0]).reduce((a, b) => a + b, 0) / ground.size;
const CZ = [...ground.keys()].map(k => +k.split(",")[1]).reduce((a, b) => a + b, 0) / ground.size;

// Faces that border the outside (street side is the north, z-minimum edge).
function facesOf(x, z) {
  const f = [];
  if (!has(x, z - 1)) f.push("north");
  if (!has(x, z + 1)) f.push("south");
  if (!has(x - 1, z)) f.push("west");
  if (!has(x + 1, z)) f.push("east");
  return f;
}

// Entrance: middle of the north (street) edge.
const northXs = [];
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (!has(x, z - 1)) northXs.push(x);
}
northXs.sort((a, b) => a - b);
const ENTRANCE_X = northXs.length ? northXs[Math.floor(northXs.length / 2)] : -1;

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

function facade(x, z, y, B, faces) {
  if (y === B) return ["stone_bricks"];                 // base course
  if (y === ROOF_FLOOR) return ["smooth_quartz"];       // cornice / parapet
  if (faces.length > 1) return ["white_concrete"];      // corner column
  const face = faces[0];
  const along = (face === "north" || face === "south") ? x : z;
  const bay = ((along % 4) + 4) % 4;
  const pillar = bay === 0 || bay === 3;

  if (y <= L + 4) {                                     // ground storey
    if (face === "north" && along === ENTRANCE_X) {
      if (y === B + 1) return ["dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" }];
      if (y === B + 2) return ["dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" }];
      if (y === B + 3) return ["light_gray_concrete"];  // canopy
    }
    if (y === L + 4) return ["light_gray_concrete"];    // lintel band
    if (y > B && y <= L + 3) return pillar ? ["gray_concrete"] : ["light_blue_stained_glass"];
    return ["white_concrete"];
  }
  if (y === L + 5) return ["smooth_stone"];             // storey line
  if (pillar) return ["white_concrete"];
  if (y === L + 6 || y === L + 9) return ["light_gray_concrete"]; // sill / lintel
  return ["light_blue_stained_glass"];
}

function inward(x, z, faces) {
  const f = faces[0];
  if (f === "north") return [x, z + 1];
  if (f === "south") return [x, z - 1];
  if (f === "west") return [x + 1, z];
  return [x - 1, z];
}

for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  const B = G(x, z);

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < B; y++) put(x, y, z, "stone_bricks");

  const faces = facesOf(x, z);
  if (faces.length === 0) {
    // Interior: floor slabs only, air between (no interiors).
    if (B < H) put(x, B, z, "smooth_stone");
    if (L + 5 >= B) put(x, L + 5, z, "smooth_stone");
    if (ROOF_FLOOR >= B) put(x, ROOF_FLOOR, z, "smooth_stone");
    continue;
  }

  // Facade column from the cell's ground up to the cornice.
  for (let y = B; y <= ROOF_FLOOR; y++) {
    const [id, props] = facade(x, z, y, B, faces);
    put(x, y, z, id, props);
  }

  // Warm light behind some upper-floor windows.
  if (faces.length === 1 && faces[0] !== undefined) {
    const along = (faces[0] === "north" || faces[0] === "south") ? x : z;
    for (const y of [L + 7, L + 8]) {
      if (y <= ROOF_FLOOR && y > B && (along + y) % 3 === 0 && !((along % 4 + 4) % 4 === 0 || (along % 4 + 4) % 4 === 3)) {
        const [ix, iz] = inward(x, z, faces);
        if (has(ix, iz) && facesOf(ix, iz).length === 0) put(ix, y, iz, "shroomlight");
      }
    }
  }
}

// Roof plant room, centred on the footprint.
const TOP_PLANT = L + 12;
if (TOP_PLANT < H) {
  for (const k of ground.keys()) {
    const [x, z] = k.split(",").map(Number);
    const B = G(x, z);
    if (facesOf(x, z).length) continue;
    if (ROOF_FLOOR < B) continue;
    if (Math.abs(x - CX) <= 3 && Math.abs(z - CZ) <= 2) {
      put(x, L + 11, z, "light_gray_concrete");
      if (Math.abs(x - CX) <= 1 && Math.abs(z - CZ) <= 1) {
        put(x, L + 12, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
      }
    }
  }
}

g.save(OUT);
