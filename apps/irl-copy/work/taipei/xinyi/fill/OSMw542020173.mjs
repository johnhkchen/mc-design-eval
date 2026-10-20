import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542020173";

// Record: no record. Read as a two-storey commercial/office block (~11 blocks to roof)
// in Xinyi: stone plinth, pale concrete piers, glass bands per storey, light
// spandrel and floor lines, a cornice and parapet, a shopfront entrance on the
// front (lowest-z) edge, warm lights in some interior spaces, and rooftop plant.

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const W = 20, H = 23, D = 15;

const minG = Math.min(...cells.map((c) => c[2]));
const gnd = new Map();
for (const [x, z, gr] of cells) gnd.set(`${x},${z}`, gr - minG);

const has = (x, z) => gnd.has(`${x},${z}`);
const isEdge = (x, z) => has(x, z) && (!has(x + 1, z) || !has(x - 1, z) || !has(x, z + 1) || !has(x, z - 1));
const isCorner = (x, z) =>
  has(x, z) && (!has(x - 1, z) || !has(x + 1, z)) && (!has(x, z - 1) || !has(x, z + 1));
const isPier = (x, z) => isCorner(x, z) || x % 4 === 0 || z % 4 === 0;

// Front = lowest-z edge; entrance is the middle cell of that edge.
let frontZ = Infinity;
for (const [x, z] of cells) if (!has(x, z - 1)) frontZ = Math.min(frontZ, z);
const frontXs = cells.filter(([x, z]) => z === frontZ && !has(x, z - 1)).map((c) => c[0]).sort((a, b) => a - b);
const entranceX = frontXs[Math.floor(frontXs.length / 2)];
const isEntrance = (x, z) => z === frontZ && x === entranceX && !has(x, z - 1);

const paneProps = (x, z) => ({
  north: isEdge(x, z - 1) ? "true" : "false",
  south: isEdge(x, z + 1) ? "true" : "false",
  east: isEdge(x + 1, z) ? "true" : "false",
  west: isEdge(x - 1, z) ? "true" : "false",
  waterlogged: "false",
});

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, p) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

for (const [x, z] of cells) {
  const b = gnd.get(`${x},${z}`);
  const edge = isEdge(x, z);

  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < b; y++) put(x, y, z, "stone_bricks");

  if (!edge) {
    // Interior: ground slab, storey slab, roof slab, no room fit-out
    put(x, b, z, "smooth_stone");
    put(x, b + 5, z, "light_gray_concrete");
    put(x, b + 10, z, "gray_concrete");

    // Warm lights set back behind the glass of the perimeter
    const nearEdge = isEdge(x + 1, z) || isEdge(x - 1, z) || isEdge(x, z + 1) || isEdge(x, z - 1);
    if (nearEdge && (x * 3 + z * 5) % 9 === 0) put(x, b + 2, z, "glowstone");
    if (nearEdge && (x * 5 + z * 7) % 11 === 0) put(x, b + 7, z, "shroomlight");

    // Rooftop plant boxes
    if ((x * 5 + z * 3) % 13 === 0) put(x, b + 11, z, "light_gray_concrete");
    continue;
  }

  // Perimeter: plinth, storeys, cornice, parapet
  put(x, b, z, "polished_andesite");

  if (isEntrance(x, z)) {
    // Shopfront entrance: door on the front edge, canopy above
    put(x, b + 1, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, b + 2, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    put(x, b + 3, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  } else if (isPier(x, z)) {
    for (let y = b + 1; y <= b + 9; y++) put(x, y, z, "white_concrete");
  } else {
    // Glazed bays: storey 1 (shopfront) and storey 2
    const p = paneProps(x, z);
    for (let y = b + 1; y <= b + 3; y++) put(x, y, z, "glass_pane", p);
    for (let y = b + 6; y <= b + 8; y++) put(x, y, z, "glass_pane", p);
  }

  // Spandrel and floor lines (applied to all perimeter cells; doors keep their own cell)
  if (!isEntrance(x, z)) {
    put(x, b + 4, z, "light_gray_concrete");
    put(x, b + 5, z, "light_gray_concrete");
    put(x, b + 9, z, "light_gray_concrete");
  } else {
    put(x, b + 4, z, "light_gray_concrete");
    put(x, b + 5, z, "light_gray_concrete");
    put(x, b + 9, z, "light_gray_concrete");
  }

  // Cornice and parapet
  put(x, b + 10, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  put(x, b + 11, z, "white_concrete");
}

g.save(`${DIR}/${ID}.nbt`);
