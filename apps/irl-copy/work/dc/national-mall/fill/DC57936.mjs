// DC57936: the Euram Building, 21 Dupont Circle NW (Commercial-Office-Large). A 1920s limestone office block: a dark
// granite base, storey lines and bays of glass in a stone frame, a cornice and parapet, and a 15-block core (six
// storeys) rising above 12-block wings with a 13-block setback between them. Lanterns glow behind some windows.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC57936.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC57936.nbt";
const SIZE = [12, 27, 14];

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const raw = new Map(cells.map(([x, z, , r]) => [`${x},${z}`, r]));

// Lidar roofs to clean tiers: 14-15 is the core (15), 13 is a setback only where it touches the core (else 12), 12 is a
// wing. A roof under 12 is a no-data hole inside the core, so it takes the core's height.
const tier = new Map();
for (const [x, z, , r] of cells) {
  let R = 12;
  if (r >= 14 || r < 12) R = 15;
  else if (r === 13) {
    let nearCore = false;
    for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (raw.get(`${x + dx},${z + dz}`) >= 14) nearCore = true;
    if (nearCore) R = 13;
  }
  tier.set(`${x},${z}`, R);
}
const R = (x, z) => tier.get(`${x},${z}`) ?? 0;     // 0 outside the footprint, so every outside neighbour is open air
const DIRS = [{ dx: 0, dz: -1 }, { dx: 0, dz: 1 }, { dx: -1, dz: 0 }, { dx: 1, dz: 0 }];   // N, S, W, E (z grows south)
const exposed = (x, z, y) => DIRS.filter(({ dx, dz }) => R(x + dx, z + dz) <= y);

// Every block goes into one plan first; null is an air cell (a window opening, a gap, the roof void).
const plan = new Map();
const key = (x, y, z) => `${x},${y},${z}`;
const put = (x, y, z, b, s) => plan.set(key(x, y, z), b ? { b, s } : null);
const at = (x, y, z) => plan.get(key(x, y, z)) ?? null;

// Storey rows: ground floor 0-2 (base, then shopfront at 1-2), then a spandrel line every 2 blocks from 3 up, with the
// glass on the row between. The top two rows of each tier are cornice (stone bricks) and parapet (smooth quartz).
const windowRow = (y, top) => (y === 1 || y === 2 || (y >= 4 && (y - 3) % 2 === 1)) && y < top - 2;
const wins = [];

// Pass 1: the mass, the facade skin, the door and canopy, and the roof deck with the roof void above it.
for (const [x, z] of cells) {
  const top = R(x, z);
  for (let y = 0; y < top; y++) {
    const ex = exposed(x, z, y);
    if (!ex.length) {                       // interior: stone mass, a roof deck at top-2, the void above it
      if (y === top - 2) put(x, y, z, "smooth_stone");
      else if (y < top - 2) put(x, y, z, "stone");
      continue;
    }
    if (y === 0) put(x, y, z, "polished_deepslate");                  // base course
    else if (y === top - 1) put(x, y, z, "smooth_quartz");            // parapet
    else if (y === top - 2) put(x, y, z, "stone_bricks");             // cornice
    else if (ex.length > 1) put(x, y, z, "smooth_quartz");            // corner pier
    else if (x === 7 && z === 0 && (y === 1 || y === 2))              // the entrance door, on the north front
      put(x, y, z, "dark_oak_door", { facing: "north", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
    else if (y === 3 && z === 0 && x >= 6 && x <= 8)                  // canopy over the entrance
      put(x, y, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
    else if (windowRow(y, top) && ex.length === 1 && (ex[0].dz !== 0 ? x : z) % 3 !== 0) {
      wins.push({ x, y, z, d: ex[0] });                               // a bay of glass (the piers are every third column)
      put(x, y, z, y <= 2 ? "polished_deepslate" : "smooth_quartz");
    }
    else if (y <= 2) put(x, y, z, "polished_deepslate");              // shopfront piers
    else if ((y - 3) % 2 === 0 || windowRow(y, top)) put(x, y, z, "smooth_quartz");   // storey line; piers on window rows
    else put(x, y, z, "calcite");                                     // limestone wall
  }
}

// Pass 2: each window is set back one block into the wall: the opening is air, the glass sits one block in, and the
// cell behind it is air, so the glass has an air gap behind and solid mass on either side. A bay without the depth to
// hold that stays solid.
const glass = [];
for (const w of wins) {
  const { x, y, z, d } = w;
  const d1 = { x: x - d.dx, z: z - d.dz }, d2 = { x: x - 2 * d.dx, z: z - 2 * d.dz };
  if (R(d1.x, d1.z) <= y || R(d2.x, d2.z) <= y) continue;
  put(x, y, z, null);
  put(d1.x, y, d1.z, "light_blue_stained_glass_pane");
  put(d2.x, y, d2.z, null);
  glass.push({ x: d1.x, y, z: d1.z, d, gapX: d2.x, gapZ: d2.z });
}

// Pass 3: warm lanterns standing in the gap behind some of the glass (one window in five; the gap floor is solid).
for (const g of glass) {
  if ((g.x + g.y + g.z) % 5 !== 0) continue;
  put(g.gapX, g.y, g.gapZ, "lantern", { hanging: "false", waterlogged: "false" });
}

// Pass 4: roof equipment on the core's open roof: a 2 x 2 air-handling unit, its top level with the parapet.
for (const [x, z] of [[3, 10], [4, 10], [3, 11], [4, 11]]) put(x, 14, z, "iron_block");

// Pass 5: the panes join their neighbours in their own wall plane (a neighbouring pane or any solid block).
const joined = (x, y, z) => (at(x, y, z) ? "true" : "false");
for (const g of glass) {
  const s = g.d.dz !== 0
    ? { north: "false", south: "false", east: joined(g.x + 1, g.y, g.z), west: joined(g.x - 1, g.y, g.z) }
    : { east: "false", west: "false", north: joined(g.x, g.y, g.z - 1), south: joined(g.x, g.y, g.z + 1) };
  put(g.x, g.y, g.z, "light_blue_stained_glass_pane", s);
}

const vox = new Voxels(SIZE);
let n = 0;
for (const [k, v] of plan) {
  if (!v) continue;
  const [x, y, z] = k.split(",").map(Number);
  vox.set(x, y, z, v.b, v.s); n++;
}
const saved = vox.save(OUT);
console.log(`DC57936: ${n} planned blocks, ${glass.length} panes, ${saved.blocks} saved, palette ${saved.palette}`);
