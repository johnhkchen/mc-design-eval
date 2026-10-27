// A two-storey 1920s shop block on a flat site: a red brick body with cream plaster quoins, string course and cornice
// (the Mt Eden village commercial type), a dark stone base, a shopfront with a dark-oak fascia and a timber door on
// the east face, and upper windows in 2-block bays between brick piers. The footprint is stepped, so the
// faces are read per cell: a cell with two open sides is a cream quoin, one open side a facade cell. The lidar gives a
// flat roof at y 9 (the top block is y 8), so the roof is a cream cornice over a smooth-stone membrane with a small
// plant box. Every window has a one-block air gap behind the glass (a floor slab per storey is the solid core); some gaps
// hold glowstone lamps. Nothing is built outside the footprint and every block stands on the one below it.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const NAME = "way_326736320";
const cells = JSON.parse(readFileSync(`${DIR}/${NAME}.cells.json`, "utf8"));

const X = 8, Y = 22, Z = 15;

const BODY = "bricks", CREAM = "smooth_sandstone", BASE = "stone_bricks", FASCIA = "dark_oak_planks";
const CORE = "stone", ROOF = "smooth_stone", PLANT = "stone_bricks", GLASS = "glass_pane", LAMP = "glowstone";

const DIRS = [[1, 0, "east"], [-1, 0, "west"], [0, 1, "south"], [0, -1, "north"]];
const key = (x, y, z) => `${x},${y},${z}`;
const cell2 = (x, z) => `${x},${z}`;

// ---- footprint: ground and roof per cell (the lidar gives a flat roof at y 9 on every cell) -----------
const G = new Map();
for (const [x, z, ground, roof] of cells) G.set(cell2(x, z), { ground, roof });
const inF = (x, z) => G.has(cell2(x, z));
const open = (x, z) => DIRS.filter(([dx, dz]) => !inF(x + dx, z + dz));
const interior = (x, z) => inF(x, z) && open(x, z).length === 0;
for (const { roof } of G.values()) if (roof !== 9) throw new Error("this script assumes the flat roof at y 9");

// ---- the massing: each block, by absolute position, filled before the faces are read -----------------
const out = new Map();   // "x,y,z" -> [block, state] or null for a cell left as air
const put = (x, y, z, block, state) => out.set(key(x, y, z), block ? [block, state] : null);

for (const [cx, cz] of G.keys().map((k) => k.split(",").map(Number))) {
  const { ground, roof } = G.get(cell2(cx, cz));
  for (let y = ground; y < roof; y++) put(cx, y, cz, y === roof - 1 ? ROOF : CORE);
}

// Window and door cells on a single-sided facade: the bay is idx 1 or 2 of every 4 blocks along the face, the jambs
// (0, 3) and the quoins (two open sides) are cream. The door takes the one bay on the east face, z 3.
const DOOR = { x: 7, z: 3 };
const WINDOW_ROWS = [1, 2, 5, 6];
const facades = [];   // { x, z, d, y } for each glazed or door cell, to cut the air gaps behind them
for (const [k, { ground, roof }] of G) {
  const [x, z] = k.split(",").map(Number);
  const ex = open(x, z);
  if (ex.length === 0) continue;
  if (ex.length >= 2) {   // quoin: a cream column from the base up
    for (let y = ground; y < roof; y++) put(x, y, z, y === 0 ? BASE : CREAM);
    continue;
  }
  const d = ex[0];
  const a = d[0] !== 0 ? z : x;
  const bay = ((a % 4) + 4) % 4;
  const isDoor = x === DOOR.x && z === DOOR.z;
  for (let y = ground; y < roof - 1; y++) {
    let block = BODY, state;
    if (y === 0) block = BASE;
    else if (y === 3) block = FASCIA;
    else if (y === 4) block = CREAM;
    else if (WINDOW_ROWS.includes(y) && (bay === 1 || bay === 2)) {
      block = GLASS;
      state = d[0] !== 0
        ? { north: "true", south: "true", east: "false", west: "false" }
        : { east: "true", west: "true", north: "false", south: "false" };
    }   // the rest of the wall stays brick; the cream is the quoins, string course and cornice
    if (isDoor && (y === 1 || y === 2)) {
      block = "oak_door";
      state = { facing: d[2], half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" };
    }
    put(x, y, z, block, state);
    if (WINDOW_ROWS.includes(y) && (bay === 1 || bay === 2 || isDoor)) facades.push({ x, z, d, y });
  }
  put(x, roof - 1, z, CREAM);   // cornice course over the facade
}

// ---- air gaps behind glass and the door: one block deep, into the solid core, with lamps in some ----------
for (const { x, z, d, y } of facades) {
  const ix = x - d[0], iz = z - d[1];
  if (!interior(ix, iz)) continue;
  const lamp = (y === 1 || y === 5) && ((x * 5 + z * 3 + y) % 3 === 0);
  put(ix, y, iz, lamp ? LAMP : null);
}

// ---- a flat roof plant box, two cells wide, set in from the edge -----------------------------------------
const deep = [];
for (const [k] of G) {
  const [x, z] = k.split(",").map(Number);
  if (interior(x, z) && [[1, 0], [-1, 0], [0, 1], [0, -1]].every(([dx, dz]) => interior(x + dx, z + dz))) deep.push([x, z]);
}
const near = (a, b) => Math.abs(a[0] - 3.5) + Math.abs(a[1] - 7) - (Math.abs(b[0] - 3.5) + Math.abs(b[1] - 7));
deep.sort(near);
const [p0] = deep;
const p1 = deep.find((c) => Math.abs(c[0] - p0[0]) + Math.abs(c[1] - p0[1]) === 1);
for (const [x, z] of [p0, p1]) put(x, 9, z, PLANT);

// ---- write -----------------------------------------------------------------------------------------------
const g = new Voxels([X, Y, Z]);
let n = 0;
for (const [k, v] of out) {
  if (!v) continue;
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, v[0], v[1]);
  n++;
}
const res = g.save(`${DIR}/${NAME}.nbt`);
console.log(`${NAME}.nbt: ${res.blocks} blocks, ${res.palette} palette entries`);
