import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538121684";
const W = 22, H = 23, D = 20;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground y
const ground = new Map();
for (const [x, z, gy] of cells) ground.set(`${x},${z}`, gy);
const has = (x, z) => ground.has(`${x},${z}`);
const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Vertical scheme (absolute y, lowest ground = 0)
const FLOOR1 = 5;    // storey 1 ceiling / band
const FLOOR2 = 10;   // storey 2 ceiling / band
const ROOF = 11;     // roof deck
const PARAPET = 12;  // parapet course on edges

// Street side = smallest z (street-facing frontage)
const front = Math.min(...cells.map(c => c[1]));
const frontXs = cells.filter(c => c[1] === front).map(c => c[0]);
const doorX = frontXs.includes(10) ? 10 : frontXs[Math.floor(frontXs.length / 2)];

const WALL = "white_concrete";
const BAND = "smooth_quartz";
const FRAME = "light_gray_concrete";
const GLASS = "light_blue_stained_glass";
const BASE = "stone_bricks";
const AWNING = "red_concrete";
const ROOF_DECK = "smooth_stone";

function set(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

function wallBlock(x, y, z, gy, edge) {
  if (y === FLOOR1 || y === FLOOR2) return BAND;
  if (y === gy + 1) return BASE;
  const isFront = z === front;
  // Awning over the shopfront
  if (isFront && y === gy + 4 && y < FLOOR1) return AWNING;
  const groundZone = y >= gy + 2 && y <= FLOOR1 - 1;
  const upperZone = y >= FLOOR1 + 1 && y <= FLOOR2 - 1;
  if (!groundZone && !upperZone) return WALL;
  if (isFront && groundZone && y < FLOOR1 && groundZone) {
    // Shopfront: full-height glazing with frame mullions
    return (x % 4 === 0) ? FRAME : GLASS;
  }
  // Punched windows with mullions every third block
  return ((x + z) % 3 === 0) ? FRAME : GLASS;
}

// Pass 1: foundations, floors, walls, roof
for (const [x, z, gy] of cells) {
  // Foundation up to the ground surface, then ground-floor slab at the surface
  for (let y = 0; y < gy; y++) set(x, y, z, BASE);
  set(x, gy, z, "smooth_stone");

  if (gy >= ROOF) continue;

  const edge = isEdge(x, z);

  // Storey floor slabs over the full footprint (interior and edge)
  for (const fy of [FLOOR1, FLOOR2]) {
    if (fy > gy) set(x, fy, z, BAND);
  }

  // Walls on the perimeter from above the ground to the top floor
  if (edge) {
    for (let y = gy + 1; y <= FLOOR2; y++) {
      if (y === FLOOR1 || y === FLOOR2) continue; // already banded
      set(x, y, z, wallBlock(x, y, z, gy, edge));
    }
    // Fill the band cells explicitly on edges (ensures continuous storey lines)
    for (const fy of [FLOOR1, FLOOR2]) {
      if (fy > gy) set(x, fy, z, BAND);
    }
  }

  // Roof deck sits on the storey-2 floor / walls
  set(x, ROOF, z, ROOF_DECK);

  // Parapet on the perimeter
  if (edge) set(x, PARAPET, z, FRAME);
}

// Pass 2: warm lights behind glass in some interior bays
for (const [x, z, gy] of cells) {
  if (gy >= ROOF || isEdge(x, z)) continue;
  const k = (x * 3 + z * 5) % 7;
  if (k === 0 && gy < 3) set(x, 3, z, "glowstone");
  if (k === 3 && gy < 8) set(x, 8, z, "glowstone");
}

// Pass 3: entrance door on the street frontage, centred under the awning
for (const [x, z, gy] of cells) {
  if (z !== front || x !== doorX || gy + 2 >= FLOOR1) continue;
  set(x, gy + 1, z, "oak_door", {
    facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
  });
  set(x, gy + 2, z, "oak_door", {
    facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
  });
}

// Pass 4: roof equipment (water tank housing) and corner lanterns on the parapet
for (let x = 7; x <= 8; x++) {
  for (let z = 8; z <= 9; z++) {
    if (has(x, z) && !isEdge(x, z) && (ground.get(`${x},${z}`) < ROOF)) {
      set(x, PARAPET, z, "iron_block");
      set(x, PARAPET + 1, z, "iron_block");
    }
  }
}

// Lanterns standing on the parapet at perimeter corners
const corners = [[0, 0], [W - 1, 0], [0, D - 1], [W - 1, D - 1]];
for (const [cx, cz] of corners) {
  const pts = [[cx, cz]];
  for (const [px, pz] of pts) {
    if (has(px, pz) && ground.get(`${px},${pz}`) < ROOF) {
      set(px, PARAPET + 1, pz, "lantern", { hanging: "false", waterlogged: "false" });
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
