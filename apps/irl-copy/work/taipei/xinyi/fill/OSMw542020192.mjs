import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise 1980s Taipei commercial block: stone plinth, two glazed storeys
// over a shopfront, quartz string course and cornice, white concrete walls,
// parapet, rooftop water tank and plant box.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542020192";
const W = 11;   // x 0..10
const D = 31;   // z 0..30
const H = 23;

const FLOOR2 = 5;    // ground storey top / second floor level (storey ~5 blocks)
const CORNICE = 10;  // top of second storey, cornice and roof deck
const TOP = 11;      // parapet top, ~11 blocks above lowest ground

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const GROUND = new Map();
for (const [x, z, gr] of cells) GROUND.set(`${x},${z}`, gr);
const groundAt = (x, z) => GROUND.get(`${x},${z}`);

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Facade block for a perimeter cell.
// t = position along the face, len = length of that face in blocks.
function facade(t, len, y) {
  const glassCol = t >= 1 && t <= len - 2 && (t % 4 === 1 || t % 4 === 2);
  if (y < FLOOR2) return glassCol ? "glass" : "light_gray_concrete";      // shopfront band
  if (y === FLOOR2 || y === CORNICE) return "smooth_quartz";              // string course, cornice
  if (y === TOP) return "white_concrete";                                 // parapet
  return glassCol ? "glass" : "white_concrete";                           // upper storey
}

for (const [x, z, ground] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < ground; y++) put(x, y, z, "stone_bricks");

  const perimeter = x === 0 || x === W - 1 || z === 0 || z === D - 1;

  if (perimeter) {
    // Long faces (x = 0 / x = 10) run along z; end faces (z = 0 / z = 30) run along x.
    const longFace = x === 0 || x === W - 1;
    const t = longFace ? z : x;
    const len = longFace ? D : W;

    for (let y = ground; y <= TOP; y++) {
      // Entrance on the z = 0 end, centred at x = 5.
      if (z === 0 && x === 5 && (y === ground || y === ground + 1)) {
        put(x, y, z, "oak_door", {
          facing: "north",
          half: y === ground ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
        continue;
      }
      // Entrance canopy/lintel over the door bays.
      if (z === 0 && x >= 4 && x <= 6 && y === FLOOR2 - 1 && ground <= FLOOR2 - 1) {
        put(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
        continue;
      }
      put(x, y, z, facade(t, len, y));
    }
  } else {
    // Interior: floor slabs per storey and roof deck; air between them (no interiors).
    for (let y = ground; y <= TOP; y++) {
      if (y === ground || y === FLOOR2 || y === CORNICE) {
        put(x, y, z, "smooth_stone");
      }
    }

    // Warm lights behind the glass.
    if (x === 1 && z % 8 === 1) put(x, FLOOR2 + 2, z, "glowstone");
    if (x === 9 && z % 8 === 5) put(x, FLOOR2 + 2, z, "glowstone");
    if (x === 1 && z % 8 === 5 && ground + 1 < FLOOR2) put(x, ground + 1, z, "glowstone");
    if (x === 9 && z % 8 === 1 && ground + 1 < FLOOR2) put(x, ground + 1, z, "glowstone");
  }
}

// Rooftop water tank (3x3, corners cut) on the roof deck at y = 10.
if (groundAt(8, 7) !== undefined && groundAt(8, 7) <= CORNICE) {
  for (let y = CORNICE + 1; y <= CORNICE + 3; y++) {
    for (let x = 7; x <= 9; x++) {
      for (let z = 6; z <= 8; z++) {
        const corner = (x !== 8) && (z !== 7);
        if (!corner) put(x, y, z, "light_gray_concrete");
      }
    }
  }
  for (let x = 7; x <= 9; x++) {
    for (let z = 6; z <= 8; z++) {
      put(x, CORNICE + 4, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    }
  }
  put(8, CORNICE + 5, 7, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

// Plant/mechanical box (3x3 footprint, two high, slab cap) on the roof deck.
if (groundAt(3, 23) !== undefined && groundAt(3, 23) <= CORNICE) {
  for (let y = CORNICE + 1; y <= CORNICE + 2; y++) {
    for (let x = 2; x <= 4; x++) {
      for (let z = 22; z <= 24; z++) put(x, y, z, "light_gray_concrete");
    }
  }
  for (let x = 2; x <= 4; x++) {
    for (let z = 22; z <= 24; z++) {
      put(x, CORNICE + 3, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
