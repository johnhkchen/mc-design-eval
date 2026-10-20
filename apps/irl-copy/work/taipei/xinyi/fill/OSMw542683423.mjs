import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw542683423.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw542683423.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 26, H = 23, D = 13;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground y
const ground = new Map();
let B = Infinity;
for (const [x, z, gy] of cells) {
  ground.set(`${x},${z}`, gy);
  if (gy < B) B = gy;
}
const has = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => ground.get(`${x},${z}`);

function put(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Two-storey (about 5 blocks per storey) commercial block, white tiled
// concrete with dark-tinted glazing, quartz cornice and parapet.
// Storey lines: B+5 (floor), cornice B+10, parapet cap B+11.
const FLOOR = B + 5;
const CORNICE = B + 10;
const CAP = B + 11;
const DOOR_T = Math.floor(W / 2);

const dirs = [
  { name: "south", dx: 0, dz: 1 },   // street frontage (Xinyi side)
  { name: "north", dx: 0, dz: -1 },
  { name: "east", dx: 1, dz: 0 },
  { name: "west", dx: -1, dz: 0 },
];

for (const [x, z, gy] of cells) {
  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gy; y++) put(x, y, z, "stone_bricks");

  const outs = dirs.filter(d => !has(x + d.dx, z + d.dz));

  if (outs.length === 0) {
    // Interior: floor slab at storey line, roof deck, air elsewhere (no interiors)
    if (FLOOR >= gy) put(x, FLOOR, z, "white_concrete");
    put(x, CORNICE, z, "light_gray_concrete");
    continue;
  }

  // Edge cell: choose facade, preferring the street (south) face
  const f = outs[0];
  const alongX = f.name === "north" || f.name === "south";
  const t = alongX ? x : z;
  const paneProps = alongX
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
  const isPier = t % 3 === 0;
  const isDoorCol = f.name === "south" && t === DOOR_T;

  // Base course
  if (gy >= 0) put(x, gy, z, "polished_granite");

  // Ground storey: shopfront glazing with white piers, door on the street face
  for (let y = gy + 1; y <= FLOOR - 1; y++) {
    if (y > B + 4) break;
    if (isDoorCol && f.name === "south" && (y === gy + 1 || y === gy + 2)) {
      const half = y === gy + 1 ? "lower" : "upper";
      put(x, y, z, "dark_oak_door", {
        facing: "south", half, hinge: "left", open: "false", powered: "false",
      });
      continue;
    }
    if (isPier || isDoorCol) put(x, y, z, "white_concrete");
    else put(x, y, z, "glass_pane", paneProps);
  }

  // Storey line
  put(x, FLOOR, z, "white_concrete");

  // Upper storey: window bands with piers, warm glow behind selected windows
  for (let y = B + 6; y <= B + 9; y++) {
    if (isPier) {
      put(x, y, z, "white_concrete");
    } else {
      put(x, y, z, "glass_pane", paneProps);
    }
  }
  if (!isPier && t % 6 === 2) {
    // Glowstone just inside the glass, one per window pair
    const ix = x - f.dx, iz = z - f.dz;
    if (has(ix, iz)) put(ix, B + 7, iz, "glowstone");
  }

  // Cornice and parapet cap
  put(x, CORNICE, z, "smooth_quartz");
  put(x, CAP, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
}

// Rooftop plant: a few AC/mechanical boxes on the roof deck, inboard of the parapet
const plant = [[5, 4], [6, 4], [5, 5], [6, 5], [19, 7], [20, 7], [19, 8], [20, 8]];
for (const [x, z] of plant) {
  if (has(x, z) && gnd(x, z) <= CORNICE) put(x, CORNICE + 1, z, "iron_block");
}

g.save(OUT);
