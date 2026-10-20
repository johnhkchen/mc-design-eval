// Record: no name. Footprint 14 x 19, roof ~11 blocks above lowest ground.
// Read as a two-storey mid-century commercial block in Xinyi: a stone-base
// shopfront on the street (south) face, quartz-clad concrete walls with
// glass-pane window bands, a cornice and parapet, and a flat roof with AC plant.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542683428";
const W = 14, H = 23, D = 19;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const G = new Map();
let L = Infinity;
for (const [x, z, gr] of cells) {
  G.set(`${x},${z}`, gr);
  L = Math.min(L, gr);
}
const has = (x, z) => G.has(`${x},${z}`);
const gnd = (x, z) => G.get(`${x},${z}`);

const g = new Voxels([W, H, D]);

// Place a block only above that cell's ground (foundation is below it).
function put(x, y, z, id, props) {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (!has(x, z)) return;
  if (y <= gnd(x, z)) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Face directions: [dx, dz] of the outward neighbour
const FACES = [
  ["south", 0, 1],
  ["north", 0, -1],
  ["east", 1, 0],
  ["west", -1, 0],
];

// Levels (absolute y, with L = lowest ground)
const Y_BASE = L + 1;     // first storey starts
const Y_FLOOR = L + 5;    // floor slab between storeys
const Y_DECK = L + 10;    // roof deck
const Y_TOP = L + 11;     // parapet top

for (const [x, z, gc] of cells) {
  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y <= gc; y++) g.set(x, y, z, "stone_bricks");
}

for (const [x, z, gc] of cells) {
  // Floor slab and roof deck across the whole footprint (no interiors)
  put(x, Y_FLOOR, z, "smooth_quartz");
  put(x, Y_DECK, z, "smooth_stone");

  const missing = FACES.filter(([, dx, dz]) => !has(x + dx, z + dz));
  if (missing.length === 0) {
    // Interior cell: rooftop AC plant on a few spots
    if (x % 5 === 2 && z % 5 === 2) put(x, Y_DECK + 1, z, "iron_block");
    continue;
  }

  // Exterior wall column from the foundation to the parapet
  for (let y = gc + 1; y <= Y_TOP; y++) put(x, y, z, "quartz_block");

  const [face, dx, dz] = missing[0];
  const isSouth = face === "south";
  const i = face === "north" || face === "south" ? x : z; // index along the face
  const inX = x - dx, inZ = z - dz; // inward neighbour (behind the glass)

  if (isSouth) {
    // Street shopfront: full glass ground storey under a red awning band
    for (let y = Y_BASE; y <= Y_BASE + 2; y++) put(x, y, z, "glass");
    put(x, Y_BASE + 3, z, "red_terracotta");
    if (i % 5 === 2 && has(inX, inZ)) put(inX, Y_BASE + 1, inZ, "glowstone");
  } else {
    // Other ground-storey faces: stone base, window band with piers
    put(x, Y_BASE, z, "stone_bricks");
    for (let y = Y_BASE + 1; y <= Y_BASE + 2; y++) {
      put(x, y, z, i % 3 !== 0 ? "glass_pane" : "quartz_block");
    }
    put(x, Y_BASE + 3, z, "quartz_block");
  }

  // Upper storey: sill, window band, lintel
  put(x, Y_FLOOR + 1, z, "smooth_quartz");
  for (let y = Y_FLOOR + 2; y <= Y_FLOOR + 3; y++) {
    put(x, y, z, i % 3 !== 0 ? "glass_pane" : "quartz_block");
  }
  put(x, Y_FLOOR + 4, z, "quartz_block");

  // Lights behind some upper windows
  if (!isSouth && i % 6 === 1 && has(inX, inZ)) {
    put(inX, Y_FLOOR + 2, inZ, "shroomlight");
  }

  // Cornice and parapet cap
  put(x, Y_DECK, z, "smooth_stone");
  put(x, Y_TOP, z, "smooth_quartz");
}

// Entrance: middle of the street (south) face
const southCells = cells
  .filter(([x, z]) => !has(x, z + 1))
  .sort((a, b) => a[0] - b[0]);
if (southCells.length > 0) {
  const [dx0, dz0, dg] = southCells[Math.floor(southCells.length / 2)];
  const yd = Math.max(Y_BASE, dg + 1);
  g.set(dx0, yd, dz0, "dark_oak_door", {
    facing: "south", half: "lower", hinge: "left", open: "false", powered: "false",
  });
  g.set(dx0, yd + 1, dz0, "dark_oak_door", {
    facing: "south", half: "upper", hinge: "left", open: "false", powered: "false",
  });
  // Warm lights either side of the door, inside the glass
  for (const dxo of [-1, 1]) {
    const nx = dx0 + dxo;
    if (has(nx, dz0 - 1)) put(nx, yd + 2, dz0 - 1, "lantern", { hanging: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
