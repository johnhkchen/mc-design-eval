// 1221 Avenue of the Americas (McGraw-Hill Building, 1971): a precast-and-green-glass slab tower on a low
// wing. The lidar gives a flat crown at about 187 blocks over the tower core and 20-33 block wings around it.
// Massing: the wings stop at 21 or 33 (seven or eleven storeys); the tower rises from a four-storey podium
// (36) and steps in twice, to 150 on a ring 4 deep and 187 on a core 8 deep. Each storey is 3 blocks: a
// spandrel course on the floor line, then two rows of tinted glass with white mullions every third bay. The
// shell is one block thick with air behind the glass and a floor slab per storey, so nothing is solid inside.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1022693.cells.json`, "utf8"));   // [x, z, ground, roof]
const SIZE = [107, 199, 54];
const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];

const FOUNDATION = "stone_bricks";
const PAVING = "smooth_stone";
const ROOF = "smooth_stone";
const BASE = "polished_granite";
const SPANDREL = "white_concrete";
const SLAB = "white_concrete";
const MULLION = "white_concrete";
const GLASS = "cyan_stained_glass";
const PLANT = "light_gray_concrete";

const key = (x, z) => `${x},${z}`;
const cell = new Map();
for (const [x, z, g, r] of cells) cell.set(key(x, z), { g, r, kind: "open", H: 0 });

// Kinds from the lidar roof: tower >= 100, wing 10..99, open below 10 (plaza, courtyards).
for (const c of cell.values()) {
  if (c.r >= 100) c.kind = "tower";
  else if (c.r >= 10) { c.kind = "wing"; c.H = c.r < 27 ? 21 : 33; }
}

// Tower depth: distance in from the tower's edge (1 on the edge). The setbacks are cut from it.
const depth = new Map();
let queue = [];
for (const [k, c] of cell) {
  if (c.kind !== "tower") continue;
  const [x, z] = k.split(",").map(Number);
  if (N4.some(([dx, dz]) => cell.get(key(x + dx, z + dz))?.kind !== "tower")) { depth.set(k, 1); queue.push(k); }
}
for (let i = 0; i < queue.length; i++) {
  const k = queue[i], d = depth.get(k), [x, z] = k.split(",").map(Number);
  for (const [dx, dz] of N4) {
    const nk = key(x + dx, z + dz);
    if (cell.get(nk)?.kind === "tower" && !depth.has(nk)) { depth.set(nk, d + 1); queue.push(nk); }
  }
}
for (const [k, c] of cell) if (c.kind === "tower") {
  const d = depth.get(k);
  c.H = d >= 8 ? 187 : d >= 4 ? 150 : 36;
}

// Lidar dropouts (open cells walled in by building on three or more sides) become building at the tallest neighbour.
for (const [k, c] of cell) {
  if (c.kind !== "open") continue;
  const [x, z] = k.split(",").map(Number);
  const nb = N4.map(([dx, dz]) => cell.get(key(x + dx, z + dz))).filter((n) => n && n.kind !== "open");
  if (nb.length >= 3) { c.kind = "hole"; c.H = Math.max(...nb.map((n) => n.H)); }
}

// Solid by structure: the foundation, paving and every building band. Glass rows are judged by facade below.
const solidAt = (x, z, y) => {
  const c = cell.get(key(x, z));
  if (!c) return false;
  if (c.kind === "open") return y <= c.g;
  return y < c.H;
};
const exposed = (x, z, y) => N4.some(([dx, dz]) => !solidAt(x + dx, z + dz, y));

// The main entrance: the tower's south face, onto the plaza.
const towerCells = [...cell.entries()].filter(([, c]) => c.kind === "tower");
const rowCount = new Map();   // ignore one-cell lidar nubs past the face: the face is the last row with a real run of tower cells
for (const [k] of towerCells) { const z = Number(k.split(",")[1]); rowCount.set(z, (rowCount.get(z) ?? 0) + 1); }
const southZ = Math.max(...[...rowCount].filter(([, n]) => n >= 10).map(([z]) => z));
const southRow = towerCells.map(([k]) => k.split(",").map(Number)).filter(([, z]) => z === southZ).map(([x]) => x);
const doorX = Math.round(southRow.reduce((a, b) => a + b, 0) / southRow.length);
const bayX = (x) => Math.abs(x - doorX) <= 3;

const g = new Voxels(SIZE);
let lamps = 0;

for (const [k, c] of cell) {
  const [x, z] = k.split(",").map(Number);
  if (c.kind === "open") {
    for (let y = 0; y < c.g; y++) g.set(x, y, z, FOUNDATION);
    g.set(x, c.g, z, PAVING);
    continue;
  }
  for (let y = 0; y < c.g; y++) g.set(x, y, z, FOUNDATION);
  for (let y = c.g; y < c.H; y++) {
    if (y === c.H - 1) { g.set(x, y, z, ROOF); continue; }
    const facade = exposed(x, z, y);
    const door = facade && z === southZ && bayX(x);
    if (door && y >= 1 && y <= 2) {   // the lobby bay: a door on the centre line, glass either side
      g.set(x, y, z, x === doorX ? "iron_door" : GLASS,
        x === doorX ? { facing: "south", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" } : undefined);
      continue;
    }
    if (y % 3 === 0) {
      if (!facade) g.set(x, y, z, SLAB);
      else g.set(x, y, z, y < 3 || (door && y === 3) ? BASE : SPANDREL);   // base course, and the canopy over the lobby
      continue;
    }
    if (facade) {
      if (y < 3) { g.set(x, y, z, BASE); continue; }
      g.set(x, y, z, (x + z) % 3 === 0 ? MULLION : GLASS);
    } else if (y % 3 === 1 && N4.some(([dx, dz]) => exposed(x + dx, z + dz, y)) && (x * 73 + z * 151 + y * 37) % 11 === 0) {
      g.set(x, y, z, "glowstone"); lamps++;   // a lamp just behind the glass, standing on the floor slab
    }
  }
}

// Mechanical boxes on the crown roof, two blocks high, set well inside the core.
for (const [k, c] of cell) {
  if (c.kind !== "tower" || c.H !== 187) continue;
  const [x, z] = k.split(",").map(Number);
  if (depth.get(k) >= 12 && x % 12 === 6 && z % 8 === 4) for (let y = 187; y <= 188; y++) g.set(x, y, z, PLANT);
}

const r = g.save(`${DIR}/NYC1022693.nbt`);
console.log(`built NYC1022693: ${r.blocks} blocks, ${r.palette} palette entries, ${lamps} lamps, door at x=${doorX} z=${southZ}`);
