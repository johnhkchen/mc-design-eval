import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// TPE109-0043-5F: 2020 five-storey mid-rise office/retail block, Xinyi district.
// Five storeys: a 6-block ground floor with a stone base, lintel and storefront
// glazing, then four 5-block office storeys. Warm white and light grey concrete
// with light blue glass in mullions, a smooth quartz cornice and parapet, a
// framed entrance on the north face, and a rooftop plant box with an antenna.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE109-0043-5F";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 8, H = 38, D = 23;
const ROOF = 26;          // roof surface (top of the last storey) in blocks above y0
const PARAPET_TOP = 27;   // parapet course sits on the roof surface
const GROUND_BAND = 6;    // ground floor height from its base course
const STOREY = 5;         // upper storey height
const FLOOR_LINES = [6, 11, 16, 21];

const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

const ground = new Map();
for (const [x, z, gr] of cells) {
  ground.set(key(x, z), clamp(Math.round(gr), 0, ROOF - 1));
}
const inFP = (x, z) => ground.has(key(x, z));
const gAt = (x, z) => ground.get(key(x, z));

const DV = {
  north: [0, -1],
  south: [0, 1],
  east: [1, 0],
  west: [-1, 0],
};

// Outward-facing directions of a footprint cell (empty for interior cells).
function normalsOf(x, z) {
  const n = [];
  if (!inFP(x - 1, z)) n.push("west");
  if (!inFP(x + 1, z)) n.push("east");
  if (!inFP(x, z - 1)) n.push("north");
  if (!inFP(x, z + 1)) n.push("south");
  return n;
}
const isEdge = (x, z) => normalsOf(x, z).length > 0;
const edgeHas = (x, z, n) => inFP(x, z) && normalsOf(x, z).includes(n);

function put(x, y, z, name, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, name, props);
  else g.set(x, y, z, name);
}

// Entrance: centred on the north face (short side). Door is cells x=3..4,
// flanked by quartz jambs at x=2 and x=5.
const isEntranceDoor = (x, z, n) => n === "north" && (x === 3 || x === 4);
const isEntranceJamb = (x, z, n) => n === "north" && (x === 2 || x === 5);

function paneProps(x, z, n) {
  const tangents = n === "west" || n === "east" ? ["north", "south"] : ["east", "west"];
  const props = { north: "false", south: "false", east: "false", west: "false" };
  for (const d of tangents) {
    const [dx, dz] = DV[d];
    if (edgeHas(x + dx, z + dz, n)) props[d] = "true";
  }
  return props;
}

// Pass 1: foundation, base course, walls, floors.
for (const [x, z] of ground.keys().map((k) => k.split(",").map(Number))) {
  const gc = gAt(x, z);
  const nrm = normalsOf(x, z);
  const edge = nrm.length > 0;
  const corner = nrm.length >= 2;
  const n = nrm[0];
  const tAxis = n === "west" || n === "east" ? z : x;

  // Foundation solid from y0 up to this cell's ground.
  for (let y = 0; y < gc; y++) put(x, y, z, "minecraft:stone");

  // Base course at ground level.
  put(x, gc, z, edge ? "minecraft:stone_bricks" : "minecraft:smooth_stone");

  // Body from just above the base up to the roof surface.
  for (let y = gc + 1; y < ROOF; y++) {
    if (!edge) {
      if (FLOOR_LINES.includes(y)) put(x, y, z, "minecraft:light_gray_concrete");
      continue;
    }
    if (corner) {
      put(x, y, z, "minecraft:white_concrete");
      continue;
    }

    const mullion = tAxis % 4 === 0;

    if (y < GROUND_BAND) {
      // Ground floor storefront and entrance.
      if (y === GROUND_BAND - 1) {
        put(x, y, z, "minecraft:smooth_quartz");                // lintel band
      } else if (isEntranceJamb(x, z, n)) {
        put(x, y, z, "minecraft:smooth_quartz");                // entrance jambs
      } else if (isEntranceDoor(x, z, n)) {
        if (y === GROUND_BAND - 2) put(x, y, z, "minecraft:glass");          // transom
        else put(x, y, z, "minecraft:tinted_glass");                          // door glazing
      } else if (mullion) {
        put(x, y, z, "minecraft:light_gray_concrete");
      } else {
        put(x, y, z, "minecraft:light_blue_stained_glass_pane", paneProps(x, z, n));
      }
      // Warm light just inside the shopfront glazing.
      if (y === 3 && !mullion && tAxis % 8 === 2) {
        const [ix, iz] = [x - DV[n][0], z - DV[n][1]];
        if (inFP(ix, iz) && !isEdge(ix, iz)) put(ix, y, iz, "minecraft:glowstone");
      }
    } else {
      // Upper office storeys.
      const fb = GROUND_BAND + STOREY * Math.floor((y - GROUND_BAND) / STOREY);
      const r = y - fb;
      if (r === 0 || r === STOREY - 1) {
        put(x, y, z, "minecraft:white_concrete");               // spandrel
      } else if (mullion) {
        put(x, y, z, "minecraft:light_gray_concrete");
      } else {
        put(x, y, z, "minecraft:light_blue_stained_glass_pane", paneProps(x, z, n));
      }
      if (r === 2 && !mullion && tAxis % 8 === 2) {
        const [ix, iz] = [x - DV[n][0], z - DV[n][1]];
        if (inFP(ix, iz) && !isEdge(ix, iz)) put(ix, y, iz, "minecraft:glowstone");
      }
    }
  }
}

// Pass 2: roof, cornice and parapet.
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (isEdge(x, z)) {
    put(x, ROOF, z, "minecraft:smooth_quartz");                 // cornice
    put(x, PARAPET_TOP, z, "minecraft:white_concrete");         // parapet
  } else {
    put(x, ROOF, z, "minecraft:light_gray_concrete");           // roof deck
  }
}

// Pass 3: entrance hall light, behind the door glazing (interior cell only).
if (inFP(3, 1) && !isEdge(3, 1)) {
  const gc = gAt(3, 1);
  if (gc + 2 < GROUND_BAND - 1) put(3, gc + 2, 1, "minecraft:glowstone");
}

// Pass 4: rooftop plant box and antenna, on interior cells only.
const midZ = Math.floor(D / 2);
for (let x = 2; x <= 5; x++) {
  for (let z = midZ - 3; z <= midZ + 3; z++) {
    if (!inFP(x, z) || isEdge(x, z)) continue;
    put(x, PARAPET_TOP, z, "minecraft:gray_concrete");
    put(x, PARAPET_TOP + 1, z, "minecraft:gray_concrete");
  }
}
if (inFP(3, midZ) && !isEdge(3, midZ)) {
  for (let y = PARAPET_TOP + 2; y <= PARAPET_TOP + 4; y++) {
    put(3, y, midZ, "minecraft:iron_bars");
  }
}

g.save(`${DIR}/${ID}.nbt`);
