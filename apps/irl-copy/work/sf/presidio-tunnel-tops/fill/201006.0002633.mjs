// 3550 West Pacific Av: Miscellaneous/Mixed-Use, 25 x 29 footprint, roof ~7 blocks above its lowest ground.
// Read as a 1920s stucco mixed-use block: a shopfront on the street (north) face, three residential storeys of
// cream stucco with paired sash windows between quartz pilasters, a stone cornice and parapet, a flat roof with a
// penthouse, a roof terrace and two brick chimneys. Solid foundations down to each cell's ground; the walls are one
// cell thick around the perimeter, the interior is air with a floor slab per storey, so only the shell is built.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/sf/presidio-tunnel-tops/fill";
const cells = JSON.parse(readFileSync(`${DIR}/201006.0002633.cells.json`, "utf8"));   // [x, z, ground]

const ROOF = 7, PARAPET = 8;   // roof deck row, parapet row (roof surface ~7 blocks above lowest ground)
const key = (x, z) => `${x},${z}`;
const H = new Map(cells.map(([x, z, h]) => [key(x, z), h]));
const has = (x, z) => H.has(key(x, z));
const DIRS = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] };   // z grows south; N is the street face
const exposed = (x, z) => Object.keys(DIRS).filter((d) => !has(x + DIRS[d][0], z + DIRS[d][1]));
// How far a face runs along the wall: a stair-stepped diagonal edge gives 1-2 cell runs, a real facade 3+.
const runLen = (x, z, d) => {
  const [ax, az] = d === "N" || d === "S" ? [1, 0] : [0, 1];
  const open = (sx, sz) => has(x + sx, z + sz) && exposed(x + sx, z + sz).includes(d);
  let n = 1;
  for (let s = 1; open(ax * s, az * s); s++) n++;
  for (let s = 1; open(-ax * s, -az * s); s++) n++;
  return n;
};

// Depth from the outside edge: 1 = outer wall ring, 2+ = interior.
const depth = new Map();
let frontier = [];
for (const [x, z] of cells) if (exposed(x, z).length) { depth.set(key(x, z), 1); frontier.push([x, z]); }
while (frontier.length) {
  const next = [];
  for (const [x, z] of frontier) {
    const d = depth.get(key(x, z));
    for (const [dx, dz] of Object.values(DIRS)) {
      const k = key(x + dx, z + dz);
      if (H.has(k) && !depth.has(k)) { depth.set(k, d + 1); next.push([x + dx, z + dz]); }
    }
  }
  frontier = next;
}
const deep = (x, z, n = 2) => (depth.get(key(x, z)) ?? 0) >= n;

// Street (north) frontage at ground storey: the front run's middle cell takes the entrance.
const front = cells.filter(([x, z, h]) => h <= 2 && exposed(x, z).length === 1 && exposed(x, z)[0] === "N")
  .map(([x, z]) => x).sort((a, b) => a - b);
const doorX = front[Math.floor(front.length / 2)];
const doorZ = cells.find(([x, z, h]) => x === doorX && h <= 2 && exposed(x, z).includes("N"))?.[1];
const doorCell = (x, z) => x === doorX && z === doorZ;

// Penthouse: a 3 x 3 box of interior cells nearest the middle of the roof.
const all = cells.map(([x, z]) => [x, z]);
const cx = all.reduce((s, [x]) => s + x, 0) / all.length, cz = all.reduce((s, [, z]) => s + z, 0) / all.length;
let ph = null;
for (let x0 = 0; x0 <= 22; x0++) for (let z0 = 0; z0 <= 26; z0++) {
  const box = [];
  for (let dx = 0; dx < 3; dx++) for (let dz = 0; dz < 3; dz++) box.push([x0 + dx, z0 + dz]);
  if (!box.every(([x, z]) => deep(x, z, 2))) continue;
  const d = Math.hypot(x0 + 1 - cx, z0 + 1 - cz);
  if (!ph || d < ph.d) ph = { x0, z0, d };
}
const inPenthouse = (x, z) => ph && x >= ph.x0 && x < ph.x0 + 3 && z >= ph.z0 && z < ph.z0 + 3;
const inPenthouseEdge = (x, z) => inPenthouse(x, z) && (x === ph.x0 || x === ph.x0 + 2 || z === ph.z0 || z === ph.z0 + 2);

// Roof terrace: interior cells in the north-east, away from the penthouse.
const inTerrace = (x, z) => deep(x, z, 3) && x >= 14 && z <= 11 && !inPenthouse(x, z);

// Two chimneys on interior cells in the west and south-east.
const chimneys = [];
{
  const inner = cells.filter(([x, z]) => deep(x, z, 3) && !inPenthouse(x, z) && !inTerrace(x, z));
  const pick = (fx) => inner.reduce((best, c) => (Math.abs(c[0] - fx) + Math.abs(c[1] - 14) < (best ? Math.abs(best[0] - fx) + Math.abs(best[1] - 14) : 1e9) ? c : best), null);
  const a = pick(6), b = pick(20);
  if (a) chimneys.push(a);
  if (b && (!a || b[0] !== a[0] || b[1] !== a[1])) chimneys.push(b);
}
const isChimney = (x, z) => chimneys.some(([cx2, cz2]) => cx2 === x && cz2 === z);

const g = new Voxels([25, 19, 29]);
const pane = (axisX) => ({ east: String(axisX), west: String(axisX), north: String(!axisX), south: String(!axisX), waterlogged: "false" });

for (const [x, z, h] of cells) {
  // Solid foundation up to this cell's ground.
  for (let y = 0; y < h; y++) g.set(x, y, z, "stone_bricks");

  const ex = exposed(x, z);
  if (ex.length === 0) {
    // Interior: a floor slab per storey, air between, the roof deck on top.
    for (const F of [0, 2, 4, 6]) if (F >= h) g.set(x, F, z, "smooth_stone");
    g.set(x, ROOF, z, "gray_concrete");
    if (inTerrace(x, z)) g.set(x, PARAPET, z, "spruce_planks");
    if (isChimney(x, z)) {
      for (let y = PARAPET; y <= 9; y++) g.set(x, y, z, "bricks");
      g.set(x, 10, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    }
    if (inPenthouse(x, z)) {
      const edge = inPenthouseEdge(x, z);
      for (const y of [PARAPET, 9]) {
        if (edge) g.set(x, y, z, "smooth_quartz");
        else if (y === 9 && x === ph.x0 + 1 && z === ph.z0 + 1) g.set(x, y, z, "shroomlight");
      }
      g.set(x, 10, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    }
    continue;
  }

  // Outer wall ring. Corners (two exposed faces) are quartz pilasters; each other face is windowed.
  const byRun = [...ex].sort((a, b) => runLen(x, z, b) - runLen(x, z, a));
  const corner = ex.length >= 2 && runLen(x, z, byRun[0]) >= 3 && runLen(x, z, byRun[1]) >= 3;
  const face = byRun[0];
  const [dx, dz] = DIRS[face];
  const idx = face === "N" || face === "S" ? x : z;
  const isFront = face === "N" && !corner && h <= 2;
  const inward = [x - dx, z - dz];
  const innerOk = deep(...inward, 2);
  const onDoorSpan = isFront && Math.abs(x - doorX) <= 1 && z === doorZ;

  for (let y = h; y <= PARAPET; y++) {
    if (y === h) { g.set(x, y, z, "stone_bricks"); continue; }
    if (corner) { g.set(x, y, z, "quartz_pillar", { axis: "y" }); continue; }
    if (y === PARAPET) { g.set(x, y, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" }); continue; }
    if (y === ROOF) { g.set(x, y, z, "smooth_quartz"); continue; }
    if (y === 6) { g.set(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" }); continue; }
    if (isFront && (y === h + 1 || y === h + 2)) {
      if (doorCell(x, z)) {
        g.set(x, y, z, "dark_oak_door", {
          facing: "north", half: y === h + 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false",
        });
      } else if (idx % 4 === 0) g.set(x, y, z, "dark_oak_log", { axis: "y" });
      else g.set(x, y, z, "glass_pane", pane(true));
      continue;
    }
    if (isFront && y === h + 3) {
      if (onDoorSpan) g.set(x, y, z, "dark_oak_stairs", { facing: "north", half: "bottom", shape: "straight", waterlogged: "false" });
      else g.set(x, y, z, "dark_oak_planks");
      continue;
    }
    if (y % 2 === 0) { g.set(x, y, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" }); continue; }
    // Odd rows: sash windows between pilasters on upper storeys.
    const p = idx % 4;
    if (p === 0) g.set(x, y, z, "quartz_pillar", { axis: "y" });
    else if (p === 1 || p === 2) {
      g.set(x, y, z, "glass_pane", pane(face === "N" || face === "S"));
      if (innerOk && (x * 7 + z * 5 + y) % 3 === 0) g.set(inward[0], y, inward[1], "glowstone");
    } else g.set(x, y, z, "smooth_quartz");
  }
}

const stats = g.save(`${DIR}/201006.0002633.nbt`);
console.log(JSON.stringify({ cells: cells.length, door: [doorX, doorZ], penthouse: ph, chimneys, ...stats }));
