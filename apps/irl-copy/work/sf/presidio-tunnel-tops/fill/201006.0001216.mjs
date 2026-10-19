// 3550 West Pacific Av (Miscellaneous / Mixed-Use), Presidio Tunnel Tops.
// Read from the record: a 1930s stucco mixed-use block (Spanish Colonial Revival): cream stucco walls, a dark wood
// shopfront on the street side with a red awning over the entrance, three storeys of gray-glazed sash windows between
// quartz belt courses, a smooth cornice, a red-tile parapet and a terracotta-tiled flat roof with a rooftop penthouse
// and two HVAC boxes. Stone base course on a foundation fill down to each cell's ground.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/sf/presidio-tunnel-tops/fill";
const cells = JSON.parse(readFileSync(`${DIR}/201006.0001216.cells.json`, "utf8"));   // [x, z, ground]

const SIZE = [39, 20, 47];
const ROOF = 8;            // cornice course on the walls, terracotta roof over the rest
const PARAPET = 9;         // red-tile cap on the wall tops
const BELTS = [4, 6];      // quartz floor lines between the storeys (the ground storey sits below 4)
const UPPER_WINDOW_ROWS = [5, 7];
const GROUND_TOP = 3;      // last air row of the ground storey

const key = (x, z) => `${x},${z}`;
const ground = new Map(cells.map(([x, z, g]) => [key(x, z), g]));
const inside = (x, z) => ground.has(key(x, z));
const NORMALS = [[-1, 0], [1, 0], [0, -1], [0, 1]];
const DIRS = { "-1,0": "west", "1,0": "east", "0,-1": "north", "0,1": "south" };
const faces = (x, z) => NORMALS.filter(([dx, dz]) => !inside(x + dx, z + dz));
const shell = (x, z) => inside(x, z) && faces(x, z).length > 0;

// The street side is the south-west edge (faces to -x or +z): shopfronts there, residential windows elsewhere.
function facadeOf(x, z) {
  const fs = faces(x, z);
  const f = fs.find(([nx, nz]) => nx === -1 || nz === 1) ?? fs[0];
  const commercial = f[0] === -1 || f[1] === 1;
  return { n: f, commercial, along: f[0] !== 0 ? z : x };
}

// Pick one door bay per street facade: anchor on the shopfront's along-coordinate, 12 blocks apart.
const doorKeys = new Set();
const canopyKeys = new Set();
for (const [x, z] of cells) {
  if (!shell(x, z)) continue;
  const { n, commercial, along } = facadeOf(x, z);
  if (!commercial || along % 12 !== 6) continue;
  doorKeys.add(`${key(n)}:${along}`);
  for (const d of [-1, 0, 1]) canopyKeys.add(`${n}:${along + d}`);
}

const glassState = (n) => (n[0] !== 0
  ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
  : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" });

const g = new Voxels(SIZE);
const counts = { walls: 0, glass: 0, doors: 0 };

// Walls and foundations, cell by cell.
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");          // foundation fill: nothing floats on a slope
  if (!shell(x, z)) {
    // Interior: a floor slab per storey and the roof, then air.
    for (const y of [gr, ...BELTS]) g.set(x, y, z, "smooth_stone");
    g.set(x, ROOF, z, z % 2 === 0 ? "terracotta" : "red_terracotta");  // tile courses read from the air
    continue;
  }
  const { n, commercial, along } = facadeOf(x, z);
  const fk = key(n);
  const isDoorCell = commercial && doorKeys.has(`${fk}:${along}`);
  const isCanopy = commercial && canopyKeys.has(`${fk}:${along}`);
  const door = DIRS[fk];
  for (let y = gr; y <= PARAPET; y++) {
    if (y === gr) { g.set(x, y, z, "stone_bricks"); counts.walls++; continue; }          // base course
    if (y === PARAPET) { g.set(x, y, z, "red_terracotta"); counts.walls++; continue; }
    if (y === ROOF || BELTS.includes(y)) { g.set(x, y, z, "smooth_quartz"); counts.walls++; continue; }
    if (isCanopy && y === gr + 3) { g.set(x, y, z, "red_wool"); counts.walls++; continue; }  // awning over the entrance
    const groundRow = y >= gr + 1 && y <= GROUND_TOP;
    const upperRow = UPPER_WINDOW_ROWS.includes(y);
    if (commercial && groundRow) {
      if (isDoorCell && y <= gr + 2) {
        g.set(x, y, z, "dark_oak_door", { facing: door, half: y === gr + 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
        counts.doors++; continue;
      }
      if (isDoorCell) { g.set(x, y, z, "smooth_quartz"); counts.walls++; continue; }   // transom
      if (along % 4 === 0) { g.set(x, y, z, "dark_oak_planks"); counts.walls++; continue; }  // shopfront frame
      g.set(x, y, z, "glass_pane", glassState(n)); counts.glass++; continue;
    }
    if (groundRow || upperRow) {
      if (along % 4 === 0) { g.set(x, y, z, "quartz_pillar"); counts.walls++; continue; }    // pier between bays
      if (along % 4 === 3) { g.set(x, y, z, "quartz_block"); counts.walls++; continue; }
      g.set(x, y, z, "gray_stained_glass_pane", glassState(n)); counts.glass++; continue;   // sash window
    }
    g.set(x, y, z, "quartz_block"); counts.walls++;                                           // stucco
  }
}

// Warm light: glowstone behind some upper sash windows, shroomlight behind some shopfront glass.
for (const [x, z, gr] of cells) {
  if (!shell(x, z)) continue;
  const { n, commercial, along } = facadeOf(x, z);
  const ix = x - n[0], iz = z - n[1];
  if (!inside(ix, iz) || shell(ix, iz)) continue;
  const h = (x * 31 + z * 17) % 7;
  for (const y of UPPER_WINDOW_ROWS) {
    if (commercial || along % 4 === 0 || along % 4 === 3) continue;
    if (h === 0 && y === 5 || h === 3 && y === 7) g.set(ix, y, iz, "glowstone");
  }
  if (commercial && along % 4 !== 0 && h < 3 && !doorKeys.has(`${key(n)}:${along}`)) g.set(ix, gr + 1, iz, "shroomlight");
}

// Rooftop penthouse: a 5 x 5 box on the roof, as near the middle of the footprint as it fits.
const xs = cells.map((c) => c[0]), zs = cells.map((c) => c[1]);
const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cz = (Math.min(...zs) + Math.max(...zs)) / 2;
let best = null;
for (let x0 = 0; x0 + 4 < SIZE[0]; x0++) for (let z0 = 0; z0 + 4 < SIZE[2]; z0++) {
  let ok = true;
  for (let x = x0; x < x0 + 5 && ok; x++) for (let z = z0; z < z0 + 5 && ok; z++) ok = inside(x, z) && !shell(x, z);
  if (!ok) continue;
  const d = Math.hypot(x0 + 2 - cx, z0 + 2 - cz);
  if (!best || d < best.d) best = { x0, z0, d };
}
if (best) {
  const { x0, z0 } = best;
  for (let x = x0; x < x0 + 5; x++) for (let z = z0; z < z0 + 5; z++) {
    const edge = x === x0 || x === x0 + 4 || z === z0 || z === z0 + 4;
    const corner = (x === x0 || x === x0 + 4) && (z === z0 || z === z0 + 4);
    for (let y = ROOF + 1; y <= ROOF + 3; y++) {
      if (!edge) continue;   // hollow inside
      if (corner) g.set(x, y, z, "quartz_pillar");
      else if (y === ROOF + 2 && !(x === x0 + 2 || z === z0 + 2)) g.set(x, y, z, "gray_stained_glass_pane", x === x0 || x === x0 + 4 ? glassState([1, 0]) : glassState([0, 1]));
      else g.set(x, y, z, "quartz_block");
    }
    g.set(x, ROOF + 4, z, "red_terracotta");   // penthouse cap
  }
}

// Two HVAC boxes on the roof, clear of the penthouse.
let placed = 0;
for (let x = 0; x + 1 < SIZE[0] && placed < 2; x++) for (let z = 0; z + 1 < SIZE[2] && placed < 2; z++) {
  const all = [[0, 0], [1, 0], [0, 1], [1, 1]].every(([dx, dz]) => inside(x + dx, z + dz) && !shell(x + dx, z + dz));
  const clear = best ? !(x + 1 >= best.x0 - 1 && x <= best.x0 + 5 && z + 1 >= best.z0 - 1 && z <= best.z0 + 5) : true;
  const far = placed === 0 || x > 20;
  if (!all || !clear || !far) continue;
  for (const [dx, dz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) g.set(x + dx, ROOF + 1, z + dz, "light_gray_concrete");
  placed++;
}

const out = g.save(`${DIR}/201006.0001216.nbt`);
console.log(JSON.stringify({ ...counts, shell: cells.filter(([x, z]) => shell(x, z)).length, penthouse: best, doorBays: doorKeys.size, ...out }));
