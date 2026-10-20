import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542020148";
const W = 9, H = 23, D = 16;

// Record: no tags. Read as a 2-storey, mid-century reinforced-concrete commercial
// block with tiled walls, a shopfront ground floor, a quartz cornice and a parapet.
// Storey height ~5 blocks, roof ~11 blocks above lowest ground.
const WALL = "white_concrete";
const BAND = "smooth_quartz";
const CANOPY = "light_gray_concrete";
const BASE = "polished_andesite";
const FOUND = "stone_bricks";
const GLASS = "light_blue_stained_glass_pane";
const FLOOR = "smooth_stone";
const ROOF = "smooth_quartz";
const PARAPET = "white_concrete";
const EQUIP = "gray_concrete";
const DOOR = "dark_oak_door";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
let minG = Infinity;
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, gr);
  if (gr < minG) minG = gr;
}
if (!Number.isFinite(minG)) minG = 0;

const has = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => ground.get(`${x},${z}`);

// Global levels: storey line at minG+5, roof surface at minG+11.
const L = minG + 5;
const R = minG + 11;

const put = (x, y, z, b, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

// Perimeter test: a footprint cell with a missing neighbour.
const isPerim = (x, z) => !(has(x - 1, z) && has(x + 1, z) && has(x, z - 1) && has(x, z + 1));

// Outward face for a perimeter cell; z-faces take priority at corners.
const outward = (x, z) => {
  if (!has(x, z - 1)) return { dx: 0, dz: -1 };
  if (!has(x, z + 1)) return { dx: 0, dz: 1 };
  if (!has(x - 1, z)) return { dx: -1, dz: 0 };
  if (!has(x + 1, z)) return { dx: 1, dz: 0 };
  return null;
};

// Bay position along the facade and facade length.
const bayPos = (x, z, o) => (o.dz !== 0 ? x : z);
const bayLen = (o) => (o.dz !== 0 ? W : D);

const paneProps = (o) =>
  o.dz !== 0
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Pass 1: foundations, floors, roof, parapet and footprint cells.
for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to the cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, FOUND);

  const perim = isPerim(x, z);

  // Roof slab over every footprint cell.
  put(x, R, z, ROOF);

  if (perim) {
    // Parapet with merlons on the outer ring.
    const o = outward(x, z);
    const pos = o ? bayPos(x, z, o) : x + z;
    if (pos % 2 === 0) put(x, R + 1, z, PARAPET);
  } else {
    // Interior: storey floor slab, air above (no interiors).
    if (L > gr) put(x, L, z, FLOOR);
  }
}

// Pass 2: perimeter walls, bands, shopfronts, windows, doors, lights.
for (const [x, z, gr] of cells) {
  if (!isPerim(x, z)) continue;
  const o = outward(x, z);
  if (!o) continue;

  const pos = bayPos(x, z, o);
  const len = bayLen(o);
  const isFront = o.dz === -1 && z === 0;
  const isDoor = isFront && (pos === 2 || pos === 6);
  const winBay = pos % 2 === 1 && pos > 0 && pos < len - 1;

  for (let y = gr; y <= R - 1; y++) {
    // Base course at the ground line.
    if (y === gr) {
      put(x, y, z, BASE);
      continue;
    }
    // Storey line band and cornice band.
    if (y === L) {
      put(x, y, z, BAND);
      continue;
    }
    if (y === R - 1) {
      put(x, y, z, BAND);
      continue;
    }

    // Ground storey: shopfront on the street face.
    if (y <= L - 2 && y >= gr + 1) {
      if (isFront) {
        if (isDoor && y === gr + 1) {
          put(x, y, z, DOOR, { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
        } else if (isDoor && y === gr + 2) {
          put(x, y, z, DOOR, { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
        } else {
          put(x, y, z, GLASS, paneProps(o));
        }
        continue;
      }
      if (winBay) {
        put(x, y, z, GLASS, paneProps(o));
        continue;
      }
    }

    // Canopy ledge over the shopfront.
    if (isFront && y === L - 1) {
      put(x, y, z, CANOPY);
      continue;
    }

    // Upper storey windows.
    if (y >= L + 2 && y <= R - 2 && winBay) {
      put(x, y, z, GLASS, paneProps(o));
      // Warm light behind some upper windows, in the air gap.
      if (pos % 4 === 1 && y === L + 3) {
        const ix = o.dx !== 0 ? x - o.dx : x;
        const iz = o.dz !== 0 ? z - o.dz : z;
        if (has(ix, iz) && !isPerim(ix, iz)) put(ix, y, iz, "glowstone");
      }
      continue;
    }

    // Default wall.
    put(x, y, z, WALL);
  }
}

// Hanging lanterns under the canopy, in the air behind the shopfront.
for (const xi of [2, 6]) {
  if (has(xi, 1) && !isPerim(xi, 1)) {
    put(xi, gnd(xi, 0) + 3, 1, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

// Roof equipment standing on the roof slab.
for (let x = 2; x <= 3; x++) {
  for (let z = 6; z <= 9; z++) {
    if (has(x, z) && !isPerim(x, z)) {
      put(x, R + 1, z, EQUIP);
      if (z === 7 || z === 8) put(x, R + 2, z, "light_gray_concrete");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
