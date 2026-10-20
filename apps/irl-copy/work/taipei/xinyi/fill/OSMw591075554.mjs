import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise Xinyi shophouse-style block: 3 storeys, white-tiled concrete facade,
// red-brown tile band over a shopfront, flat roof with parapet and rooftop plant.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw591075554";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 15, H = 25, D = 3;
const g = new Voxels([W, H, D]);

const ROOF_Y = 13;
const PARAPET_Y = 14;
const FLOORS = [4, 8, 12];          // floor slab levels (absolute)

const WALL = "white_concrete";
const BASE = "stone_bricks";
const SLAB = "smooth_quartz";
const TRIM = "light_gray_concrete";
const DARK = "black_concrete";
const RED = "red_terracotta";
const GLASS = "glass_pane";
const GLOW = "glowstone";

const paneProps = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

const key = (x, z) => `${x},${z}`;
const gmap = new Map();
for (const [x, z, gr] of cells) {
  gmap.set(key(x, z), Math.max(0, Math.min(ROOF_Y - 2, Math.round(gr))));
}
const xs = cells.map((c) => c[0]);
const minX = Math.min(...xs);
const maxX = Math.max(...xs);
const has = (x, z) => gmap.has(key(x, z));

function put(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  const G = gmap.get(key(x, z));
  const end = x === minX || x === maxX;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < G; y++) put(x, y, z, BASE);

  // Body from ground to just below the roof.
  for (let y = G; y <= ROOF_Y - 1; y++) {
    if (FLOORS.includes(y)) {
      // Red-brown tile band at the shopfront lintel, slabs elsewhere.
      const band = y === 4 && z === 0 && !end;
      put(x, y, z, band ? RED : SLAB);
      continue;
    }
    if (z === 1 && !end) continue;   // air gap behind the facades
    if (end) { put(x, y, z, WALL); continue; }

    const storey = y < 4 ? 1 : y < 8 ? 2 : 3;
    let id = WALL;

    if (storey === 1) {
      if (z === 0 && y === G) id = BASE;                  // base course
      else if (z === 0 && y >= 1 && y <= 3) {
        if (x === 8 && G <= 1 && y <= 2) continue;        // door placed below
        id = x % 3 === 1 ? DARK : GLASS;                  // shopfront mullions
      }
    } else {
      const sill = storey === 2 ? 5 : 9;
      const top = storey === 2 ? 7 : 11;
      if (y === G && (z === 0 || z === 2)) id = BASE;
      else if (y === sill) id = TRIM;                     // window sill
      else if (y > sill && y <= top) id = x % 3 === 1 ? TRIM : GLASS;
    }

    if (id === GLASS) put(x, y, z, GLASS, paneProps);
    else put(x, y, z, id);
  }

  // Roof slab.
  if (G < ROOF_Y) put(x, ROOF_Y, z, SLAB);

  // Parapet on the front, back and end edges.
  if (z === 0 || z === 2 || end) put(x, PARAPET_Y, z, SLAB);
}

// Entrance door on the street (front, z=0) facade, in a glass bay.
if (has(8, 0) && gmap.get(key(8, 0)) <= 1) {
  put(8, 1, 0, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(8, 2, 0, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
}

// Warm lights behind some front glass (in the air gap at z=1).
const lights = [[5, 2], [3, 6], [9, 6], [6, 10], [12, 10]];
for (const [x, y] of lights) {
  if (has(x, 1) && y >= gmap.get(key(x, 1))) put(x, y, 1, GLOW);
}

// Rooftop plant room on the interior line of the roof.
for (let x = 9; x <= 12; x++) {
  if (has(x, 1)) put(x, PARAPET_Y, 1, TRIM);
}
for (let x = 10; x <= 11; x++) {
  if (has(x, 1)) put(x, PARAPET_Y + 1, 1, "iron_block");
}

g.save(`${DIR}/${ID}.nbt`);
