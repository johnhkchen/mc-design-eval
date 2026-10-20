import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no record. Footprint 6 x 17, roof about 11 blocks above lowest ground.
// Read as a two-storey Taipei shophouse with a tiled white concrete frame
// (1970s-80s): shopfront at street level, a red fascia band, a storey line,
// aluminium-framed windows on a 4-block bay rhythm, a parapet with stone cap,
// and a roof deck with a stair housing and a water tank.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542020160";
const W = 6, H = 23, D = 17;
const ROOF = 11;      // roof deck (top of storey 2)
const PARAPET = 12;   // parapet course on the perimeter

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gy] of cells) ground.set(`${x},${z}`, gy);
const has = (x, z) => ground.has(`${x},${z}`);

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

for (const [x, z, G] of cells) {
  const faces = {
    w: !has(x - 1, z),
    e: !has(x + 1, z),
    n: !has(x, z - 1), // street (front) face
    s: !has(x, z + 1),
  };
  const perimeter = faces.w || faces.e || faces.n || faces.s;
  const F1 = G + 5; // storey line between the two storeys

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < G; y++) put(x, y, z, "stone_bricks");

  // Floor slab at ground, storey line, and roof deck (interior and perimeter)
  put(x, G, z, "smooth_stone");
  if (F1 < ROOF) put(x, F1, z, "smooth_stone");
  put(x, ROOF, z, "light_gray_concrete");

  if (!perimeter) continue;

  const onX = faces.w || faces.e;
  const onZ = faces.n || faces.s;

  // Wall body from ground to the roof deck
  for (let y = G + 1; y <= ROOF; y++) {
    if (y === F1 || y === ROOF) {
      if (y === F1) continue; // storey line stays smooth stone
      put(x, y, z, "white_concrete");
      continue;
    }

    const glassRow = (y >= G + 2 && y <= G + 3) || (y >= F1 + 2 && y <= F1 + 3);
    const groundFront = faces.n && y >= G + 1 && y <= G + 3;

    if (groundFront && x >= 1 && x <= W - 2) {
      if (x === 2 && (y === G + 1 || y === G + 2)) continue; // door set below
      put(x, y, z, "glass");                                    // shopfront glazing
      continue;
    }
    if (faces.n && y === G + 4 && x >= 1 && x <= W - 2) {
      put(x, y, z, "red_terracotta");                           // fascia band
      continue;
    }

    const winX = onX && z % 4 !== 0 && z > 0 && z < D - 1;
    const winZ = onZ && x >= 1 && x <= W - 2 && !faces.n;
    if (glassRow && (winX || winZ)) {
      put(x, y, z, "glass_pane");
    } else {
      put(x, y, z, "white_concrete");
    }
  }

  // Parapet and stone cap on the perimeter
  put(x, PARAPET, z, "white_concrete");
  put(x, PARAPET + 1, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// Entrance on the street face (door at x=2, ground floor)
if (has(2, 0) && ground.get("2,0") !== undefined) {
  const G = ground.get("2,0");
  put(2, G + 1, 0, "oak_door", {
    facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
  });
  put(2, G + 2, 0, "oak_door", {
    facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
  });
  // Canopy over the entrance: a stone slab cap above the door transom
  put(2, G + 3, 0, "glass");
}

// Warm lights behind the glass on the west bay (interior column x=1)
for (let z = 1; z < D - 1; z++) {
  if (!(has(1, z) && has(0, z) && has(2, z))) continue;
  const G = ground.get(`1,${z}`);
  if (z % 8 === 2) {
    put(1, G + 2, z, "glowstone");
  }
  if (z % 8 === 6 && G + 7 < ROOF) {
    put(1, G + 7, z, "shroomlight");
  }
}

// Roof equipment: stair housing and water tank, standing on the roof deck
for (const [x, z, G] of cells) {
  if (x >= 3 && z >= 12 && z <= 14) {
    put(x, PARAPET, z, "white_concrete");
    put(x, PARAPET + 1, z, "white_concrete");
    put(x, PARAPET + 2, z, "smooth_stone");
  }
  if (x >= 1 && x <= 2 && z >= 4 && z <= 5) {
    put(x, PARAPET, z, "light_gray_concrete");
    put(x, PARAPET + 1, z, "light_gray_concrete");
    put(x, PARAPET + 2, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
