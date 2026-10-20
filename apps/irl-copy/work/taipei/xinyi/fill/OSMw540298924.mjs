import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw540298924.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw540298924.nbt";

const W = 9, H = 23, D = 21;
const ROOF_DECK = 10;   // top of the last storey, roof slab level
const PARAPET = 11;     // roof surface / parapet course
const TOP_STORAGE = 13; // rooftop water tank top

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const key = (x, z) => x + "," + z;
const ground = new Map();
for (const [x, z, gr] of cells) {
  ground.set(key(x, z), Math.max(0, Math.min(10, Math.round(gr))));
}
const has = (x, z) => ground.has(key(x, z));
const groundAt = (x, z) => ground.get(key(x, z));

const PANE_X = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const PANE_Z = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

// Exterior face of a cell: W/E/N/S, or null if interior.
function faceOf(x, z) {
  if (!has(x - 1, z)) return "W";
  if (!has(x + 1, z)) return "E";
  if (!has(x, z - 1)) return "N";
  if (!has(x, z + 1)) return "S";
  return null;
}

// Exterior wall block for a given height on a given face.
// Returns [id, props?] or null.
function exteriorBlock(y, b, x, z, face) {
  const alongZ = face === "W" || face === "E";
  const u = alongZ ? z : x;
  const pane = alongZ ? PANE_X : PANE_Z;
  const pillar = u % 3 === 0;

  if (y < b) return null;
  if (y === b) return ["stone_bricks"];               // base course

  // Ground storey: shopfront with entrance
  if (y <= 4) {
    if (face === "W" && u === 10 && b + 2 <= 4 && (y === b + 1 || y === b + 2)) {
      return ["dark_oak_door", {
        facing: "west",
        half: y === b + 1 ? "lower" : "upper",
        hinge: "left", open: "false", powered: "false"
      }];
    }
    if (y === 4) return ["white_concrete"];           // signage band
    if (pillar) return ["light_gray_concrete"];       // shopfront mullions
    return ["glass_pane", pane];
  }

  if (y === 5) return ["light_gray_concrete"];        // string course between storeys

  // Upper storey: window grid
  if (y <= 9) {
    if (y === 6 || y === 9) return ["white_concrete"]; // spandrels
    if (pillar) return ["light_gray_concrete"];
    return ["glass_pane", pane];
  }

  if (y === ROOF_DECK) return ["smooth_stone"];       // cornice
  if (y === PARAPET) return ["white_concrete"];       // parapet
  return null;
}

// Interior: floor slabs and roof deck only; air elsewhere (behind glass).
function interiorBlock(y, b) {
  if (y < b) return null;
  if (y === b) return ["smooth_stone"];
  if (y === 5) return ["smooth_stone"];
  if (y === ROOF_DECK) return ["gray_concrete"];
  return null;
}

const g = new Voxels([W, H, D]);

// Pass 1: foundations, floors, walls, roof deck
for (const [x, z] of [...ground.keys()].map(k => k.split(",").map(Number))) {
  const b = groundAt(x, z);
  const face = faceOf(x, z);

  for (let y = 0; y < H; y++) {
    if (y < b) {
      g.set(x, y, z, "gray_concrete");   // foundation up to ground
      continue;
    }
    if (y > PARAPET) continue;

    let blk = null;
    if (face) {
      blk = exteriorBlock(y, b, x, z, face);
    } else {
      blk = interiorBlock(y, b);
    }
    if (!blk) continue;
    if (blk[1]) g.set(x, y, z, blk[0], blk[1]);
    else g.set(x, y, z, blk[0]);
  }
}

// Pass 2: warm lights behind glass (shroomlight upstairs, glowstone in the shopfront)
for (const [x, z] of [...ground.keys()].map(k => k.split(",").map(Number))) {
  const b = groundAt(x, z);
  const face = faceOf(x, z);
  if (!face) continue;
  const alongZ = face === "W" || face === "E";
  const u = alongZ ? z : x;
  let ix = x, iz = z;
  if (face === "W") ix = x + 1;
  else if (face === "E") ix = x - 1;
  else if (face === "N") iz = z + 1;
  else if (face === "S") iz = z - 1;
  if (!has(ix, iz)) continue;
  const ib = groundAt(ix, iz);

  // Upper-storey lights
  for (const y of [7, 8]) {
    if (u % 3 === 0) continue;
    if ((u + y) % 4 !== 0) continue;
    if (y <= ib) continue;
    g.set(ix, y, iz, "shroomlight");
  }

  // Shopfront glow
  const gy = b + 2;
  if (gy <= 3 && gy > ib && u % 3 === 1 && (u + gy) % 2 === 0) {
    g.set(ix, gy, iz, "glowstone");
  }
}

// Rooftop water tank (chamfered box) with a slab cap
for (let x = 3; x <= 5; x++) {
  for (let z = 8; z <= 12; z++) {
    if (!has(x, z) || faceOf(x, z)) continue;
    if ((x === 3 || x === 5) && (z === 8 || z === 12)) continue;
    for (let y = PARAPET; y <= TOP_STORAGE; y++) {
      g.set(x, y, z, "stone_bricks");
    }
    g.set(x, TOP_STORAGE + 1, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(OUT);
