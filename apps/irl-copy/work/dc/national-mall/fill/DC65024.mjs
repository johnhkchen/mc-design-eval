// DC65024: a 1960s-70s Commercial-Office block on the Mall's south side (500 E St SW), read from the lidar record. A
// six-storey precast-concrete office podium (the lidar's 13-block roof) with a seven-storey central tower (15), a
// one-storey-lower wing (4) on the downhill east end, and a plant bump (5) on that wing. Precast light-grey spandrels
// and white piers frame tinted blue glass; a stone-brick plinth carries the storeys; a bronze-trimmed (dark oak) door
// sits in the 19-23 entrance bay under a polished-andesite hood on the north face (z 0).
//
// Storeys are two blocks: a floor/spandrel row, then a glass row, counted from the top of each cell's own ground, so
// every column stands on its own foundation and nothing hangs. Piers every third cell on each face; interior cells
// one step behind a glass bay are air at the glass row (with a floor slab per storey above and below), so the glass
// shows a room; some of those rooms carry a glowstone. Deeper interior is solid. Glass panes connect to their
// neighbours in the same wall.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC65024.cells.json`, "utf8"));
const g = new Voxels([50, 27, 18]);

const key = (x, z) => `${x},${z}`;
const byXZ = new Map(cells.map(([x, z, G, r]) => [key(x, z), { g: G, r }]));
const inside = (x, z) => byXZ.has(key(x, z));
const FACES = [["N", 0, -1], ["S", 0, 1], ["W", -1, 0], ["E", 1, 0]];

// Lidar roof: the 3x3 median kills single-cell noise, then three flat tiers. A raw 5 on the wing is a plant bump. The
// central tower is one rectangle (its lidar edge is ragged), so its setback is a clean block rather than a sawtooth.
const TOWER = { x0: 9, x1: 34, z0: 2, z1: 8 };
const tierOf = (x, z) => {
  if (byXZ.get(key(x, z)).r === 5) return 5;
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) v.push(byXZ.get(key(x + dx, z + dz)).r);
  v.sort((a, b) => a - b);
  const m = v[v.length >> 1];
  const inTower = x >= TOWER.x0 && x <= TOWER.x1 && z >= TOWER.z0 && z <= TOWER.z1;
  return m >= 8 ? (inTower && m >= 14 ? 15 : 13) : 4;
};

const DOOR = "dark_oak_door", BASE = "stone_bricks", FOUND = "stone", SLAB = "light_gray_concrete";
const SPANDREL = "light_gray_concrete", PIER = "white_concrete", CAP = "smooth_stone", HOOD = "polished_andesite";
const PANE = "light_blue_stained_glass_pane", LAMP = "glowstone";
const DOOR_X = 21;
const hash = (x, y, z) => (x * 7 + y * 13 + z * 31) % 5;

const info = new Map();
for (const [x, z, G] of cells) {
  const fs = FACES.filter(([, dx, dz]) => !inside(x + dx, z + dz)).map(([f]) => f);
  const facade = fs.length > 0;
  const door = x === DOOR_X && z === 0;
  const pier = facade && fs.some((f) => ((f === "N" || f === "S") ? x : z) % 3 === 0);
  info.set(key(x, z), { x, z, g: G, T: tierOf(x, z), facade, door, pier });
}
const at = (x, z) => info.get(key(x, z));
// An open cell is a glass bay (a facade cell that is not a pier) or the entrance door; a room is an interior cell behind one.
const open = (x, z) => { const c = at(x, z); return !!c && c.facade && (!c.pier || c.door); };
for (const c of info.values()) c.room = !c.facade && [[0, -1], [0, 1], [-1, 0], [1, 0]].some(([dx, dz]) => open(c.x + dx, c.z + dz));

// The block for one cell at height y: [id, state] or null for air.
const blockAt = (c, y) => {
  const { x, z, g: G, T } = c;
  if (y < G) return [FOUND];
  if (y === G) return [c.facade ? BASE : SLAB];
  if (y === T - 1) return [c.facade ? CAP : SLAB];
  if (c.door && (y === G + 1 || y === G + 2)) {
    const half = y === G + 1 ? "lower" : "upper";
    return [DOOR, { facing: "north", half, hinge: "left", open: "false", powered: "false" }];
  }
  if (c.facade && z === 0 && x >= 19 && x <= 23 && y === G + 3) return [HOOD];   // lintel hood over the entrance
  const k = y - (G + 1);
  if (k % 2 === 0) return [c.facade ? SPANDREL : SLAB];                           // storey floor / spandrel row
  if (c.facade) return [c.pier ? PIER : PANE];                                    // glass row: pane or pier
  if (c.room) return hash(x, y, z) === 0 ? [LAMP] : null;                         // room behind glass: lit or air
  return [SLAB];
};

for (const c of info.values()) {
  for (let y = 0; y < c.T; y++) {
    const b = blockAt(c, y);
    if (b) g.set(c.x, y, c.z, b[0], b[1]);
  }
}

// Roof plant on the podium (13) and a penthouse on the central tower (15): stacked on each cell's parapet, so supported.
for (const c of info.values()) {
  if (c.T === 13 && !c.facade && c.x >= 18 && c.x <= 23 && c.z >= 9 && c.z <= 10) {
    g.set(c.x, 13, c.z, SLAB); g.set(c.x, 14, c.z, CAP);
  }
  if (c.T === 15 && c.x >= 16 && c.x <= 27 && c.z >= 3 && c.z <= 6) {
    const wall = c.facade ? PIER : SLAB;
    g.set(c.x, 15, c.z, wall); g.set(c.x, 16, c.z, CAP);
  }
}

// Panes join their neighbours in the same wall (panes, piers, solid); open air leaves the arm off.
for (let z = 0; z < 18; z++) for (let x = 0; x < 50; x++) {
  if (!inside(x, z)) continue;
  for (let y = 0; y < 27; y++) {
    const here = g.get(x, y, z);
    if (!here || here.block !== `minecraft:${PANE}`) continue;
    const arm = (dx, dz) => (g.get(x + dx, y, z + dz) ? "true" : "false");
    g.set(x, y, z, PANE, { north: arm(0, -1), south: arm(0, 1), east: arm(1, 0), west: arm(-1, 0), waterlogged: "false" });
  }
}

console.log(g.save(`${DIR}/DC65024.nbt`));
