// FR245184530: a residential block, built 1961, eight storeys in the lidar's 28 blocks (20 m): storeys alternate
// 4 and 3 blocks (2.9 m and 2.1 m, averaging 2.5 m), so the eight fit where the record's roof sits. Pale stone walls,
// a one-block ring with its windows cut from it and air behind the glass, a floor slab per storey, a flat roof with
// a cornice, two lower wings where the lidar drops, a door on the south face, and warm glowstone behind some windows.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill";
const cells = JSON.parse(readFileSync(`${DIR}/FR245184530.cells.json`, "utf8"));
const g = new Voxels([22, 44, 14]);

const foot = new Map();
for (const [x, z, ground, roof] of cells) foot.set(`${x},${z}`, { ground, roof });
const inFoot = (x, z) => foot.has(`${x},${z}`);
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];
// a ring cell has a neighbour off the footprint: its walls are the facade, the rest is interior
const ring = (x, z) => NB.some(([dx, dz]) => !inFoot(x + dx, z + dz));
const exposedZ = (x, z) => !inFoot(x, z - 1) || !inFoot(x, z + 1);

// the lidar's roof, smoothed into three flat tiers of whole storeys (8, 7 and 6 storeys)
const tierTop = (roof) => (roof >= 26 ? 28 : roof >= 24 ? 25 : 21);
// eight storeys: each a floor line (its base row) then window rows; storey tops 4,7,11,14,18,21,25,28
const PITCH = [4, 3, 4, 3, 4, 3, 4, 3];
const bases = [], tops = [];
{ let y = 0; for (const p of PITCH) { bases.push(y); y += p; tops.push(y); } }
const storeyOf = (y) => bases.findIndex((b, i) => y >= b && y < tops[i]);

const WALL = "calcite", STRING = "stone_bricks", FLOOR = "smooth_stone", GLASS = "light_blue_stained_glass";
const ROOF = "gray_concrete", LIGHT = "glowstone", PLANT = "iron_block";
const CANOPY = { name: "stone_brick_slab", state: { type: "bottom", waterlogged: "false" } };

// the entrance: south face (z = 13), ground cell
const DOOR = [4, 13];
const isDoor = (x, z) => x === DOOR[0] && z === DOOR[1];

const topOf = new Map();
for (const [key, { roof }] of foot) topOf.set(key, tierTop(roof));

// the interior cell next to a ring cell (where a window's light sits behind the glass)
const inward = (x, z) => NB.map(([dx, dz]) => [x + dx, z + dz]).find(([a, b]) => inFoot(a, b) && !ring(a, b));

const roofCells = [];
for (const key of foot.keys()) {
  const [x, z] = key.split(",").map(Number);
  const T = topOf.get(key);
  const edge = ring(x, z);
  for (let y = 0; y < T; y++) {
    const s = storeyOf(y);
    const r = y - bases[s];
    if (y === 0 || r === 0) {
      // foundation and base course at y 0, then the floor line at each storey's base
      g.set(x, y, z, edge ? STRING : FLOOR);
      continue;
    }
    if (y === T - 1) {
      // the top row: a cornice on the ring, roof covering inside it
      g.set(x, y, z, edge ? STRING : ROOF);
      continue;
    }
    if (!edge) continue;               // interior: air behind the glass
    if (isDoor(x, z)) {
      if (y <= 2) g.set(x, y, z, "dark_oak_door", { facing: "south", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      else if (y === 3) g.set(x, y, z, CANOPY.name, CANOPY.state);
      continue;
    }
    // window grid: piers every third cell along the facade (x on a south or north face, z on east or west)
    const idx = exposedZ(x, z) ? x : z;
    if (idx % 3 === 0) { g.set(x, y, z, WALL); continue; }
    g.set(x, y, z, GLASS);
    // a warm light behind some windows, on the storeys with the odd index, scattered by cell
    const inn = inward(x, z);
    if (inn && s % 2 === 1 && (x * 3 + z * 5 + y) % 7 === 0) g.set(inn[0], y, inn[1], LIGHT);
  }
  if (T === 28 && !edge) roofCells.push([x, z]);
}

// roof plant: a few units on the top tier's flat roof, standing on the roof covering
const plant = roofCells.filter(([x, z]) => (x + 2 * z) % 9 === 4).slice(0, 5);
for (const [x, z] of plant) g.set(x, 28, z, PLANT);

const out = `${DIR}/FR245184530.nbt`;
const info = g.save(out);
console.log(`wrote ${out}: ${info.blocks} blocks, palette ${info.palette}`);
