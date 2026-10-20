import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise 1970s-80s Xinyi shophouse: two storeys over a shopfront ground floor,
// white-tiled concrete with a grey glazed street face, a stone base, a belt course,
// a fascia, a flat roof with a parapet, and rooftop plant and stair housing.
// Front (street) face is z = 0.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw667261339";
const W = 21, H = 23, D = 6;
const ROOF = 11;     // roof deck, measured above the lowest ground
const PARAPET = ROOF + 1;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const base = Math.min(...cells.map((c) => c[2]));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr - base);

const has = (x, z) => ground.has(`${x},${z}`);
const g = new Voxels([W, H, D]);

const put = (x, y, z, name, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, name, props);
  else g.set(x, y, z, name);
};

const PANE = { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" };
const GLASS = "gray_stained_glass_pane";
const WALL = "white_concrete";

for (const [x, z, raw] of cells) {
  const gr = raw - base;

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const front = !has(x, z - 1);
  const back = !has(x, z + 1);
  const left = !has(x - 1, z);
  const right = !has(x + 1, z);
  const perim = front || back || left || right;
  const faceBig = front || back;

  // Floor/base course at ground level.
  put(x, gr, z, perim ? "stone_bricks" : "smooth_stone");

  for (let y = gr + 1; y <= ROOF; y++) {
    if (!perim) {
      // Interior: floor slabs only, air between them (no interiors).
      if (y === 6 || y === ROOF) put(x, y, z, "smooth_stone");
      continue;
    }

    let b = WALL, p;

    if (y === ROOF) {
      b = "smooth_stone";                       // roof deck
    } else if (y === 6) {
      b = "smooth_stone";                       // belt course / floor line
    } else if (y === 5) {
      b = front ? "light_gray_concrete" : WALL; // fascia over shopfront
    } else if (y <= 4) {
      // Ground storey.
      if (front) {
        if (x % 4 === 0) b = "stone_bricks";    // shopfront piers
        else { b = GLASS; p = PANE; }           // shopfront glazing
      } else if (back) {
        if (x % 3 === 1) { b = GLASS; p = PANE; }
      } else {
        if (z === 2 || z === 3) { b = GLASS; p = PANE; }
      }
    } else {
      // Upper storey, y 7..10.
      if (y === 7 || y === 10) {
        b = WALL;                               // spandrels
      } else if (faceBig) {
        if (x % 3 !== 0) { b = GLASS; p = PANE; }
      } else {
        if (z === 2 || z === 3) { b = GLASS; p = PANE; }
      }
    }

    put(x, y, z, b, p);
  }

  // Parapet on the perimeter.
  if (perim) put(x, PARAPET, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// Entrance door on the street face, with a lit transom behind the glass.
if (has(10, 0)) {
  const dg = ground.get("10,0");
  const dyLow = dg + 1, dyUp = dg + 2;
  if (dyUp <= 4) {
    put(10, dyLow, 0, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(10, dyUp, 0, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  }
}

// Warm lights behind the glass, in the air gap at z = 1.
for (const x of [3, 7, 13, 17]) {
  if (!has(x, 1) || !has(x, 0)) continue;
  const gr = ground.get(`${x},1`);
  const y = gr + 2;
  if (y > gr && y <= 4) put(x, y, 1, "glowstone");
}
for (const x of [2, 8, 14, 18]) {
  if (!has(x, 1) || !has(x, 0)) continue;
  const gr = ground.get(`${x},1`);
  if (gr < 7) put(x, 8, 1, "shroomlight");
}

// Rooftop plant (AC units) and stair housing, standing on the roof deck.
const onRoof = (x, z) => has(x, z);
for (const x of [5, 6]) for (const z of [2, 3]) {
  if (!onRoof(x, z)) continue;
  const gr = ground.get(`${x},${z}`);
  if (gr + 1 <= ROOF) put(x, ROOF + 1, z, "iron_block");
}
for (const z of [2, 3]) {
  if (!onRoof(19, z)) continue;
  const gr = ground.get(`19,${z}`);
  put(19, ROOF + 1, z, WALL);
  put(19, ROOF + 2, z, WALL);
  put(19, ROOF + 3, z, "smooth_stone");
}

g.save(`${DIR}/${ID}.nbt`);
