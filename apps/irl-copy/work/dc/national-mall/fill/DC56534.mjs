// 725 12th St NW: a Stripped-Classical office block, calcite-clad with blue-tinted glass bays, on a stone plinth.
// The lidar roof heights are smoothed into three tiers (15 low wing, 18 body, 20 setback core), each tier's
// skin and rings are recomputed from its own footprint so every storey stands on the one below it.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC56534.cells.json", "utf8"));
const W = 17, D = 27, H = 32;
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// lidar roof height per footprint cell; 0 = outside the footprint
const lidar = Array.from({ length: W }, () => Array(D).fill(0));
for (const [x, z, , r] of cells) lidar[x][z] = r;
const inF = (x, z) => x >= 0 && z >= 0 && x < W && z < D && lidar[x][z] > 0;

// rings of a mask: 0 = its outer skin, 1 = the cell behind it, and so on inward
function ringsOf(m) {
  const d = Array.from({ length: W }, () => Array(D).fill(-1)), q = [];
  for (let x = 0; x < W; x++) for (let z = 0; z < D; z++)
    if (m(x, z) && NB.some(([dx, dz]) => !m(x + dx, z + dz))) { d[x][z] = 0; q.push([x, z]); }
  for (let i = 0; i < q.length; i++) {
    const [x, z] = q[i];
    for (const [dx, dz] of NB) { const a = x + dx, b = z + dz; if (m(a, b) && d[a][b] < 0) { d[a][b] = d[x][z] + 1; q.push([a, b]); } }
  }
  return d;
}
const ringF = ringsOf(inF);

// the top of each column: the core is set back two cells in from the skin, the body rises to 18, the east wing stops at 15
const top = Array.from({ length: W }, () => Array(D).fill(0));
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inF(x, z)) continue;
  const r = lidar[x][z];
  top[x][z] = r >= 19 && ringF[x][z] >= 2 ? 20 : r >= 17 ? 18 : 15;
}
const topOf = (x, z) => (inF(x, z) ? top[x][z] : 0);
const maskAt = (y) => (x, z) => inF(x, z) && top[x][z] > y;
const rings = Array.from({ length: 20 }, (_, y) => ringsOf(maskAt(y)));

// the skin of a cell on the outer ring: which face, its position along that face, and whether it is a pier
function skin(x, z, y) {
  const m = maskAt(y);
  const zFace = !m(x, z - 1) || !m(x, z + 1), xFace = !m(x - 1, z) || !m(x + 1, z);
  if (zFace && xFace) return { corner: true, pier: true };
  if (zFace) return { face: "z", idx: x, pier: x % 3 === 0 };
  return { face: "x", idx: z, pier: z % 3 === 0 };
}

const LIGHT = "light_blue_stained_glass", STONE = "calcite", BAND = "smooth_stone", BASE = "stone_bricks", ROOF = "light_gray_concrete";
const isEntry = (x, y, z) => z === 0 && (x === 7 || x === 8) && (y === 1 || y === 2);

// what stands at x, y, z: a block name and state, "air" for the gap behind the glass, or null for nothing
function at(x, y, z) {
  if (!inF(x, z) || y >= top[x][z]) return null;
  const d = rings[y][x][z], t = top[x][z], r = y % 3, k = Math.floor(y / 3);
  if (y === 0) return { b: BASE };
  if (y === t - 1) return { b: d === 0 ? BAND : ROOF };          // cornice on the skin, roof surface inside
  if (d >= 2) return { b: STONE };
  if (d === 0) {
    if (isEntry(x, y, z)) return { door: true, lower: y === 1, hinge: x === 7 ? "left" : "right" };
    const s = skin(x, z, y);
    if (s.pier) return { b: r === 0 ? BAND : STONE };
    return { b: r === 0 ? BAND : LIGHT };
  }
  // the cell behind the skin: an air gap behind the glass bays, floor slabs and piers solid
  if (r === 0) return { b: STONE };
  const m = maskAt(y);
  const out = NB.map(([dx, dz]) => [x + dx, z + dz]).find(([a, b]) => m(a, b) && rings[y][a][b] === 0);
  if (!out) return { b: STONE };
  const [a, b] = out, s = skin(a, b, y);
  if (s.pier) return { b: STONE };
  if (r === 1 && Math.floor(y / 3) % 2 === 1 && s.idx % 6 === 4) return { b: "glowstone" };   // warm lamps in some offices
  return { air: true };
}

// roof plant: a 2 x 2 gray box, two blocks high, on the body roof away from the skin and the core
const plant = [];
outer: for (let x = 1; x < W - 2; x++) for (let z = 3; z < D - 3; z++) {
  const ok = [[0, 0], [1, 0], [0, 1], [1, 1]].every(([dx, dz]) => topOf(x + dx, z + dz) === 18 && ringF[x + dx][z + dz] >= 3);
  if (ok) { for (const [dx, dz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) for (let y = 18; y < 20; y++) plant.push([x + dx, y, z + dz]); break outer; }
}

const g = new Voxels([W, H, D]);
const names = { [BASE]: BASE, [STONE]: STONE, [BAND]: BAND, [LIGHT]: LIGHT, [ROOF]: ROOF };
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) for (let y = 0; y < 20; y++) {
  const c = at(x, y, z);
  if (!c || c.air) continue;
  if (c.door) {
    const st = { facing: "north", half: c.lower ? "lower" : "upper", hinge: c.hinge, open: "false", powered: "false" };
    g.set(x, y, z, "dark_oak_door", st);
  } else g.set(x, y, z, names[c.b] ?? c.b);
}
// the lamp behind the entrance doors, and the roof plant
g.set(7, 1, 1, "glowstone");
for (const [x, y, z] of plant) g.set(x, y, z, "gray_concrete");

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC56534.nbt";
const info = g.save(out);
console.log(JSON.stringify({ file: out, ...info }));
