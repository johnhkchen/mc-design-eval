import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1560544325";
const W = 23, H = 23, D = 17;
const ROOF = 11;          // roof sits 11 blocks above lowest ground
const STOREY = 5;         // storey height in blocks

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, g] of cells) ground.set(key(x, z), g);
const has = (x, z) => ground.has(key(x, z));
const base = Math.min(...ground.values());

// Missing cardinal neighbours = exterior faces
const DIRS = [[0, -1, "north"], [0, 1, "south"], [-1, 0, "west"], [1, 0, "east"]];
const missing = (x, z) => DIRS.filter(([dx, dz]) => !has(x + dx, z + dz)).map(d => d[2]);

// Front (street) face = south edge; entrance on the centre column of that edge
const frontCells = cells.filter(([x, z]) => !has(x, z + 1)).map(([x, z]) => [x, z]);
let entranceKey = null;
if (frontCells.length) {
  const avgX = frontCells.reduce((s, [x]) => s + x, 0) / frontCells.length;
  const ex = Math.round(avgX);
  const hit = frontCells.find(([x]) => x === ex) ?? frontCells[Math.floor(frontCells.length / 2)];
  entranceKey = key(hit[0], hit[1]);
}

// Materials: 1980s–90s Taipei commercial block: white tiled concrete, grey bands,
// stone base, red shop fascia, glazed bays.
const WALL = "white_concrete";
const BAND = "light_gray_concrete";
const BASE = "stone_bricks";
const CORNICE = "smooth_stone";
const FLOOR = "smooth_stone";
const ROOFTOP = "gray_concrete";
const FOUND = "stone_bricks";
const GLASS = "glass_pane";
const SIGN = "red_concrete";
const EQUIP = "light_gray_concrete";

const g = new Voxels([W, H, D]);

// Block for a footprint cell at height rel above base (or null = air)
function blockAt(x, z, rel) {
  const faces = missing(x, z);
  const edge = faces.length > 0;
  const isFront = faces.includes("south");
  const i = x + z;
  const pier = i % 3 === 0;

  if (!edge) {
    if (rel === 0) return { id: FLOOR };
    if (rel === STOREY) return { id: FLOOR };
    if (rel === ROOF) return { id: ROOFTOP };
    return null;
  }

  if (rel === 0) return { id: BASE };
  if (rel === ROOF) return { id: WALL };                // parapet cap
  if (rel === 10) return { id: CORNICE };               // cornice
  if (rel === 4 || rel === 9 || rel === STOREY) return { id: BAND }; // storey lines

  // Ground storey (rel 1..3)
  if (rel >= 1 && rel <= 3) {
    if (isFront && key(x, z) === entranceKey) {
      if (rel === 1) return { id: "dark_oak_door", props: { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" } };
      if (rel === 2) return { id: "dark_oak_door", props: { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" } };
      return { id: SIGN };                              // fascia over entrance
    }
    if (pier) return { id: WALL };
    if (isFront && rel === 3) return { id: SIGN };      // red shop fascia
    return { id: GLASS };
  }

  // Upper storey (rel 6..8)
  if (rel >= 6 && rel <= 8) {
    if (pier) return { id: WALL };
    return { id: GLASS };
  }

  return { id: WALL };
}

// Build each footprint cell
for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, FOUND);

  // Walls, floors, roof above ground
  for (let y = gr; y <= base + ROOF && y < H; y++) {
    const rel = y - base;
    const b = blockAt(x, z, rel);
    if (!b) continue;
    if (b.props) g.set(x, y, z, b.id, b.props);
    else g.set(x, y, z, b.id);
  }

  // Warm lights: shroomlight in interior cell behind selected upper windows
  const faces = missing(x, z);
  if (faces.length && ((x * 3 + z * 5) % 7 === 0)) {
    const opp = { north: [0, 1], south: [0, -1], west: [1, 0], east: [-1, 0] };
    const f = faces[0];
    const [dx, dz] = opp[f];
    const ix = x + dx, iz = z + dz;
    const inner = has(ix, iz) && missing(ix, iz).length === 0;
    const yl = base + 7;
    if (inner && yl >= ground.get(key(ix, iz)) && yl < H) {
      g.set(ix, yl, iz, "shroomlight");
    }
  }

  // Rooftop plant room, central cells only
  if (x >= 7 && x <= 15 && z >= 6 && z <= 10 && base + ROOF + 2 < H) {
    g.set(x, base + ROOF + 1, z, EQUIP);
    g.set(x, base + ROOF + 2, z, EQUIP);
  }
}

g.save(`${DIR}/${ID}.nbt`);
