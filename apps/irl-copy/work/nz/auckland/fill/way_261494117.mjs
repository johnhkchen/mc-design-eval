// Number 6 Khyber Reservoir, Mt Eden: a 1910s civic service block of the Khyber Pass water works (a reinforced-concrete
// cover with red brick and cement-rendered bays, the period's look for Auckland's council buildings). The lidar roof is
// one flat plate at about 10 blocks (median over the footprint), so the massing is one flat tier with a cornice and a
// stone parapet, plus a roof plant house. Two storeys of 4 blocks each, counted from each cell's own ground, so the
// downhill side shows its extra course. Cement pilasters every 6 blocks, a white string course per storey, glass in
// steel-framed bays with a one-block air gap behind (warm glowstone in some), a timber door in the middle of the main
// face. The body is solid, so every course stands on the one below it; no interiors.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_261494117.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_261494117.nbt";

const W = 64, D = 73, H = 23, STOREY = 4, PIER = 6;
const cells = JSON.parse(readFileSync(CELLS, "utf8"));

const idx = (x, z) => z * W + x;
const ground = new Int16Array(W * D).fill(-1);       // -1 = outside the footprint
const roofs = [];
for (const [x, z, g, r] of cells) { ground[idx(x, z)] = g; roofs.push(r); }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && ground[idx(x, z)] >= 0;
const TOP = roofs.sort((a, b) => a - b)[roofs.length >> 1];   // the lidar roof plate: median 10, one flat tier

// The sides: E = +x, S = +z. `facing` is what a door's state takes (the way it faces, out of the wall).
const SIDES = [
  { dx: 1, dz: 0, name: "E", facing: "east" },
  { dx: -1, dz: 0, name: "W", facing: "west" },
  { dx: 0, dz: 1, name: "S", facing: "south" },
  { dx: 0, dz: -1, name: "N", facing: "north" },
];
const outward = (x, z) => SIDES.filter((s) => !inside(x + s.dx, z + s.dz));

const B = {
  body: "bricks", base: "stone_bricks", trim: "white_concrete", roof: "smooth_stone", parapet: "stone_brick_wall",
  found: "stone_bricks", glass: "glass_pane", light: "glowstone", plant: "bricks", door: "dark_oak_door",
};

const g = new Voxels([W, H, D]);

// Pass 1: the massing. Foundation below grade, brick body from grade to the roof plate, the roof plate on top.
const facades = [];                                    // { x, z, gr, out }
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inside(x, z)) continue;
  const gr = ground[idx(x, z)], out = outward(x, z);
  for (let y = 0; y < gr; y++) g.set(x, y, z, B.found);
  for (let y = gr; y <= TOP - 2; y++) g.set(x, y, z, B.body);
  g.set(x, TOP - 1, z, B.roof);
  if (out.length) facades.push({ x, z, gr, out });
}

// The entrance: the facade side with the most single-face cells; on it, the lowest ground nearest the side's middle,
// on a bay centre (along % 6 === 3) when there is one.
const single = facades.filter((f) => f.out.length === 1);
const counts = {};
for (const f of single) counts[f.out[0].name] = (counts[f.out[0].name] || 0) + 1;
const mainName = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
const onMain = single.filter((f) => f.out[0].name === mainName);
const along = (f) => (f.out[0].dz !== 0 ? f.x : f.z);
const minG = Math.min(...onMain.map((f) => f.gr));
let cand = onMain.filter((f) => f.gr === minG);
const centre = onMain.reduce((a, f) => [a[0] + f.x, a[1] + f.z], [0, 0]).map((v) => v / onMain.length);
const centred = cand.filter((f) => along(f) % PIER === 3);
if (centred.length) cand = centred;
const door = cand.reduce((best, f) => (Math.hypot(f.x - centre[0], f.z - centre[1]) < Math.hypot(best.x - centre[0], best.z - centre[1]) ? f : best));

// Pass 2: the facade. Each wall course is (relative to its own grade r): base course (r 0), two window rows in each
// four-course storey (r % 4 in 1, 2), a white string course (r % 4 === 3), brick spandrel otherwise. Cement pilasters
// every 6 blocks along the face, and at corners; a steel-look mullion at the middle of each bay.
const gapCells = [];                                   // { x, y, z, lit } for the air behind each glazed bay
for (const f of facades) {
  const s = f.out[0], corner = f.out.length > 1, a = along(f);
  const pier = corner || a % PIER === 0, mullion = a % PIER === 3;
  const isDoor = f === door;
  const paneStates = s.dz !== 0
    ? { north: "false", south: "false", east: "true", west: "true" }      // a wall along x: panes join east-west
    : { north: "true", south: "true", east: "false", west: "false" };     // a wall along z: panes join north-south
  for (let y = f.gr; y <= TOP - 2; y++) {
    const r = y - f.gr;
    let blk = B.body, state;
    if (r === 0) blk = B.base;
    else if (isDoor && (r === 1 || r === 2)) {
      blk = B.door;
      state = { facing: s.facing, half: r === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" };
    }
    else if (pier) blk = B.trim;
    else if (r % 4 === 1 || r % 4 === 2) {
      if (mullion) blk = B.trim;
      else { blk = B.glass; state = paneStates; }
    }
    else if (r % 4 === 3) blk = B.trim;
    g.set(f.x, y, f.z, blk, state);
  }
  g.set(f.x, TOP - 1, f.z, B.trim);                    // cornice course
  // Parapet: a stone wall on the perimeter, joined to its perimeter neighbours.
  const conn = (dx, dz) => (facades.some((q) => q.x === f.x + dx && q.z === f.z + dz) ? "low" : "none");
  g.set(f.x, TOP, f.z, B.parapet, { north: conn(0, -1), south: conn(0, 1), east: conn(1, 0), west: conn(-1, 0), up: "true", waterlogged: "false" });
  // The air gap behind each glazed bay: one block in from the glass, in the window rows only, with a warm light in some.
  if (!corner && !pier && !mullion && !(isDoor)) {
    const gx = f.x - s.dx, gz = f.z - s.dz;
    if (inside(gx, gz) && !outward(gx, gz).length) gapCells.push({ x: gx, z: gz, gr: f.gr, bay: Math.floor(a / PIER) });
  }
  if (isDoor) {
    const gx = f.x - s.dx, gz = f.z - s.dz;
    if (inside(gx, gz)) gapCells.push({ x: gx, z: gz, gr: f.gr, bay: -1, door: true });
  }
}
for (const c of gapCells) {
  for (let r = 1; r <= TOP - 2 - c.gr; r++) {
    if (c.door ? r > 2 : r % 4 === 0 || r % 4 === 3) continue;   // door: its two rows; windows: the glazed rows only
    g.set(c.x, c.gr + r, c.z, "air");                 // the air gap behind the pane (a 1-block void, no interior)
  }
  if (!c.door) {
    // warm light behind the lower glass in every third bay, and the upper glass in the others
    const lit1 = c.bay % 3 === 1, lit2 = c.bay % 3 === 0;
    if (lit1) g.set(c.x, c.gr + 1, c.z, B.light);
    if (lit2) g.set(c.x, c.gr + 5, c.z, B.light);
  }
}

// Pass 3: the roof plant house, a brick box with a white cap, set in from the parapet on the roof.
let sx = 0, sz = 0, n = 0;
for (const [x, z] of cells.map((c) => [c[0], c[1]])) { sx += x; sz += z; n++; }
const cx = Math.round(sx / n), cz = Math.round(sz / n);
const plantOk = (x, z) => inside(x, z) && !outward(x, z).length && inside(x + 1, z) && inside(x - 1, z) && inside(x, z + 1) && inside(x, z - 1);
for (let z = cz - 2; z <= cz + 2; z++) for (let x = cx - 4; x <= cx + 4; x++) {
  if (!plantOk(x, z)) continue;
  g.set(x, TOP, z, B.plant);
  g.set(x, TOP + 1, z, B.plant);
  g.set(x, TOP + 2, z, B.trim);
}

const info = g.save(OUT);
console.log(JSON.stringify({ size: g.size, top: TOP, cells: cells.length, door: { x: door.x, z: door.z, gr: door.gr, face: door.out[0].name }, gaps: gapCells.length, ...info }));
