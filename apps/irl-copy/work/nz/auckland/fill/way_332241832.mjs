// A 1930s stripped-classical commercial block on the Eden Terrace side: a basalt plinth, cream concrete piers and
// ribbon glazing in four-block storeys on a common datum (y 10 = the street), a cornice, a two-block terrace ring
// under the main tower's setback, a lower wing to the south, a plant room on the roof. The walls are solid; each
// window has a one-block air gap behind it (some lit), and nothing stands without something under it.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_332241832.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_332241832.nbt";
const cells = JSON.parse(readFileSync(CELLS, "utf8"));

const X = 40, Y = 41, Z = 76;
const g = new Voxels([X, Y, Z]);
const at = (x, y, z) => (z * Y + y) * X + x;
const grid = new Array(X * Y * Z).fill(null);           // [block, state] or null (air)
const put = (x, y, z, block, state) => { grid[at(x, y, z)] = [block, state]; };

const key = (x, z) => `${x},${z}`;
const FACES = [[0, -1, "north"], [0, 1, "south"], [1, 0, "east"], [-1, 0, "west"]];
const foot = new Map(cells.map(([x, z, gr, roof]) => [key(x, z), { x, z, g: gr, roof, d: 0, top: 0, faces: [] }]));
const list = [...foot.values()];

// d = distance in cells from the footprint's edge (1 = edge ring)
for (const c of list) if (FACES.some(([dx, dz]) => !foot.has(key(c.x + dx, c.z + dz)))) c.d = 1;
const queue = list.filter((c) => c.d === 1);
for (let i = 0; i < queue.length; i++) for (const [dx, dz] of FACES) {
  const n = foot.get(key(queue[i].x + dx, queue[i].z + dz));
  if (n && !n.d) { n.d = queue[i].d + 1; queue.push(n); }
}

// Three roof tiers from the lidar: annex (<=18), wing (<=24), main (25+). The main's two outer rings step down
// to the wing's line as a terrace; the tower inside them rises to the cornice at 26 (top surface 27).
const tierTop = (c) => (c.roof <= 18 ? 18 : c.roof <= 24 ? 22 : c.d >= 3 ? 26 : 22);
for (const c of list) c.top = tierTop(c);

// Exposed faces: the outside of the footprint, or a lower tier's wall (a setback face above the lower roof).
for (const c of list) for (const [dx, dz, name] of FACES) {
  const n = foot.get(key(c.x + dx, c.z + dz));
  if (!n) c.faces.push({ dx, dz, name, lo: c.g, out: true });
  else if (n.top < c.top) c.faces.push({ dx, dz, name, lo: n.top + 1, out: false });
}

// Solid core from the foundation up to each tier's roof; the roof membrane, cornice and parapet on top.
for (const c of list) {
  for (let y = 0; y <= c.top; y++) put(c.x, y, c.z, y < c.g ? "polished_andesite" : y < c.top ? "stone" : "gray_concrete");
  if (c.faces.length) put(c.x, c.top, c.z, "smooth_quartz");
  if (c.faces.some((f) => f.out)) put(c.x, c.top + 1, c.z, "smooth_quartz");
}

// Entrances: two single-face street cells on the common datum (ground 9+), in a glass bay (t % 4 == 1).
const along = (c, f) => (f.dx !== 0 ? c.z : c.x);
const doorCand = list.filter((c) => c.faces.length === 1 && c.faces[0].out && c.g >= 9 && along(c, c.faces[0]) % 4 === 1);
const doorKeys = new Map([doorCand[Math.floor(doorCand.length / 3)], doorCand[Math.floor((2 * doorCand.length) / 3)]]
  .filter(Boolean).map((c) => [key(c.x, c.z), c]));

// Facade: storey lines every 4 from the datum (2, 6, 10 = street, 14, 18, 22; cornice at each tier's top).
// Street storey: plinth at 10, glass at 11-12 (door in the bay), fascia at 13. Window bays: pier at t%4==0, mullion
// at t%4==2, glass otherwise. Rows under the grade stay stone.
const STRINGS = new Set([2, 6, 14, 18, 22]);
const facadeBlock = (c, f, y, t, door) => {
  if (y < 2 || y === 10) return ["polished_andesite"];
  if (y === 13) return t % 4 === 0 ? ["smooth_quartz"] : door ? ["dark_oak_slab", { type: "bottom" }] : ["gray_concrete"];
  if (y === 11 || y === 12) {
    if (t % 4 === 0) return ["smooth_quartz"];
    if (door) {
      const facing = FACES.find(([dx, dz]) => dx === -f.dx && dz === -f.dz)[2];
      return ["dark_oak_door", { facing, half: y === 11 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }];
    }
    return ["light_blue_stained_glass"];
  }
  if (STRINGS.has(y)) return ["smooth_quartz"];
  if (y < c.g + 1) return ["polished_andesite"];                 // a window sill under the grade is stone
  if (t % 4 === 0) return ["smooth_quartz"];
  if (t % 4 === 2) return ["light_gray_concrete"];
  return ["light_blue_stained_glass"];
};

// Every exposed face takes its own bays (a ragged outline's steps keep their windows, no pier at each step); setback
// faces are written first so a street face wins a cell it shares.
for (const c of list) {
  for (const f of c.faces.slice().sort((a, b) => Number(a.out) - Number(b.out))) {
    const t = along(c, f);
    const door = f.out && doorKeys.has(key(c.x, c.z));
    for (let y = f.lo; y < c.top; y++) {
      const b = facadeBlock(c, f, y, t, door);
      put(c.x, y, c.z, b[0], b[1]);
    }
  }
}

// Air gap behind each window (or the door's lobby): clear the cell inside it, or put a light there (some windows
// are lit). Only solid core cells behind the glass are opened; an exposed cell is a wall and stays one.
for (const c of list) for (const f of c.faces) {
  for (let y = f.lo; y < c.top; y++) {
    const b = grid[at(c.x, y, c.z)];
    if (!b || (b[0] !== "light_blue_stained_glass" && b[0] !== "dark_oak_door")) continue;
    const ic = foot.get(key(c.x - f.dx, c.z - f.dz));
    if (!ic || ic.faces.length || y >= ic.top || y <= ic.g) continue;
    const lit = y <= 12 ? (c.x + c.z) % 3 === 0 : (c.x * 3 + y * 5 + c.z * 7) % 9 === 0;
    if (lit && b[0] === "light_blue_stained_glass") put(ic.x, y, ic.z, "glowstone");
    else grid[at(ic.x, y, ic.z)] = null;
  }
}

// Plant room on the main roof: a two-block box with a capping course, set in from the tower's edge.
let plant = 0;
for (const c of list) if (c.top === 26 && c.d >= 6 && c.x >= 14 && c.x <= 25) {
  put(c.x, 27, c.z, "light_gray_concrete"); put(c.x, 28, c.z, "light_gray_concrete"); put(c.x, 29, c.z, "smooth_quartz"); plant++;
}

let blocks = 0;
for (let z = 0; z < Z; z++) for (let y = 0; y < Y; y++) for (let x = 0; x < X; x++) {
  const b = grid[at(x, y, z)];
  if (b) { g.set(x, y, z, b[0], b[1]); blocks++; }
}
const res = g.save(OUT);
console.log(JSON.stringify({ cells: list.length, doors: doorKeys.size, plantCells: plant, blocks, ...res }));
