// Air New Zealand House: a 1970s-80s Auckland office block on the CBD ridge, read from the lidar. Its footprint is 104 x 84
// blocks, and most of it is one flat plate at 29-31 blocks above y 0, so the main body is seven storeys of 4 blocks to a
// roof slab at y 28, with a parapet and cornice up to the lidar's roof. Lower wings step down on the lidar's own roof
// heights (a 5x5 median, whole storeys), and the roof-level lidar of about 1 is a sunken court at ground, left open to the
// sky. Each storey's floor slab stands on the one below, and every outline block carries the facade: a white concrete
// frame with piers every 3 blocks, light grey spandrels at each floor line, and blue-tinted glass between. A polished
// andesite base course sits on a stone foundation down to each cell's ground. Two entrances on the face with the most
// ground-floor frontage sit under a slab canopy, with a standing lantern inside, and some windows show a glowstone or
// shroomlight a block behind the glass. Interiors are air, with floor slabs and no fittings; plant boxes stand on the roof.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_24146543.cells.json", "utf8"));
const W = 104, D = 84, H = 44;
const STOREY = 4, BODY = 28;                       // a storey is 4 blocks; the main body's roof slab is at y 28 (surface 29 to 31 in the lidar)

const ground = Array.from({ length: W }, () => Array(D).fill(-1));
const roofH = Array.from({ length: W }, () => Array(D).fill(-1));
for (const [x, z, gr, r] of cells) { ground[x][z] = gr; roofH[x][z] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && ground[x][z] >= 0;
const DIRS = [["east", 1, 0], ["west", -1, 0], ["south", 0, 1], ["north", 0, -1]];
const FACING = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };

// the roof slab index of each cell: a sunken court (lidar roof under 4) has none; the body is one plate at BODY; the
// lower wings take their 5x5-median roof, rounded to whole storeys
const court = (x, z) => inside(x, z) && roofH[x][z] < 4;
const median = (a) => { a.sort((p, q) => p - q); return a[a.length >> 1]; };
const top = Array.from({ length: W }, () => Array(D).fill(-1));
for (const [x, z] of cells) {
  if (court(x, z)) continue;
  const v = [];
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) if (inside(x + dx, z + dz)) v.push(roofH[x + dx][z + dz]);
  const rs = median(v);
  top[x][z] = rs >= 26 ? BODY : Math.max(STOREY, STOREY * Math.round(rs / STOREY));
}

// a storey k exists over a cell when the cell's roof is above it; the court and anything off the footprint do not
const exists = (x, z, k) => inside(x, z) && top[x][z] >= STOREY * (k + 1);
// the faces of a storey's cell that are outside: off the footprint, or next to a cell with no such storey
const outward = (x, z, k) => DIRS.filter(([, dx, dz]) => !exists(x + dx, z + dz, k));
const isWall = (x, z, k) => exists(x, z, k) && outward(x, z, k).length > 0;
const idxAlong = (x, z, outs) => (outs.some(([, , dz]) => dz !== 0) ? x : z);   // a north/south face runs along x, else along z
const isPier = (x, z, outs) => idxAlong(x, z, outs) % 3 === 0;

const FOUND = "stone_bricks", BASE = "polished_andesite", FRAME = "white_concrete", BAND = "light_gray_concrete";
const GLASS = "light_blue_stained_glass", FLOOR = "light_gray_concrete", PAVE = "smooth_stone";

const g = new Voxels([W, H, D]);

// foundation, floors, walls, roof and parapet for every cell
for (const [x, z, gr, r] of cells) {
  for (let y = 0; y < gr; y++) g.set(x, y, z, FOUND);
  if (court(x, z)) { g.set(x, 0, z, PAVE); continue; }
  const t = top[x][z];
  for (let k = 0; k < t / STOREY; k++) {
    const b = STOREY * k, outs = outward(x, z, k);
    if (outs.length) {
      const pier = isPier(x, z, outs);
      for (let o = 0; o < STOREY; o++) {
        const y = b + o;
        let blk;
        if (o === 0) blk = k === 0 ? BASE : BAND;                  // base course, then the floor-line spandrel
        else if (o === 3) blk = BAND;                              // lintel under the next floor
        else blk = pier ? FRAME : GLASS;                           // window band between piers
        g.set(x, y, z, blk);
      }
    } else {
      g.set(x, b, z, FLOOR);                                       // interior floor slab; air above it
    }
  }
  // roof slab at t: a cornice on the outline, a roof deck inside
  g.set(x, t, z, outward(x, z, t / STOREY - 1).length ? BAND : FLOOR);
  // parapet on the body's outline, up to the lidar's roof (29 to 31)
  if (t === BODY && outward(x, z, t / STOREY - 1).length) {
    const p = Math.min(30, r - 1);
    for (let y = BODY + 1; y < p; y++) g.set(x, y, z, FRAME);
    if (p > BODY) g.set(x, p, z, BAND);
  }
}

// the entrance face: the side with the most ground-floor faces; two entrances a third and two thirds along it
const counts = {};
for (const [x, z] of cells) if (isWall(x, z, 0)) for (const [, dx, dz] of outward(x, z, 0)) counts[`${dx},${dz}`] = (counts[`${dx},${dz}`] || 0) + 1;
const [bestKey] = Object.entries(counts).sort((p, q) => q[1] - p[1])[0];
const [bdx, bdz] = bestKey.split(",").map(Number);
const face = cells
  .filter(([x, z]) => isWall(x, z, 0) && outward(x, z, 0).some(([, dx, dz]) => dx === bdx && dz === bdz))
  .map(([x, z]) => ({ x, z, a: bdx !== 0 ? z : x }))
  .sort((p, q) => p.a - q.a);
const lo = face[0].a, hi = face[face.length - 1].a;
const doorAt = [];
for (const f of [1 / 3, 2 / 3]) {
  const want = lo + (hi - lo) * f;
  const pick = face.filter((c) => !doorAt.includes(c)).sort((p, q) => Math.abs(p.a - want) - Math.abs(q.a - want))[0];
  if (pick) doorAt.push(pick);
}
const FACE = FACING[`${-bdx},${-bdz}`];                              // a door faces the street, the way its player stands
for (const d of doorAt) {
  const { x, z } = d;
  g.set(x, 1, z, "dark_oak_door", { facing: FACE, half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(x, 2, z, "dark_oak_door", { facing: FACE, half: "upper", hinge: "left", open: "false", powered: "false" });
  // canopy: a slab across the door and the two bays either side, on the storey-1 spandrel line
  for (const c of face) if (Math.abs(c.a - d.a) <= 1) g.set(c.x, 3, c.z, "polished_andesite_slab", { type: "bottom", waterlogged: "false" });
  // a standing lantern on the floor just inside the door
  const ix = x - bdx, iz = z - bdz;
  if (inside(ix, iz)) g.set(ix, 1, iz, "lantern", { hanging: "false", waterlogged: "false" });
}

// warm windows: a glowstone or shroomlight a block behind some glass, on the inside cell of the face
const sealed = (x, z, k) => !exists(x, z, k) || isWall(x, z, k);
let lamps = 0;
for (const [x, z] of cells) {
  if (court(x, z)) continue;
  for (let k = 0; k < top[x][z] / STOREY; k++) {
    const outs = outward(x, z, k);
    if (!outs.length || k === 0) continue;
    const [, dx, dz] = outs[0];
    if (isPier(x, z, outs) || (idxAlong(x, z, outs) + 5 * k) % 9 !== 4) continue;
    const ix = x - dx, iz = z - dz;
    if (sealed(ix, iz, k)) continue;
    const y = STOREY * k + 2;
    g.set(ix, y, iz, (x + z + k) % 2 ? "glowstone" : "shroomlight");
    lamps++;
  }
}

// plant boxes on the body's roof, a 2-block box with a slab lid where the roof is flat and clear of the parapet
let plant = 0;
for (const [x, z] of cells) {
  if (court(x, z) || top[x][z] !== BODY || outward(x, z, BODY / STOREY - 1).length) continue;
  const inBox = x >= 38 && x <= 50 && z >= 16 && z <= 26 && (x - 38) % 6 < 4 && (z - 16) % 6 < 4;
  if (!inBox) continue;
  g.set(x, BODY + 1, z, "light_gray_concrete"); g.set(x, BODY + 2, z, "light_gray_concrete");
  g.set(x, BODY + 3, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  plant++;
}

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_24146543.nbt";
const info = g.save(out);
console.log(JSON.stringify({ ...info, doors: doorAt.length, lamps, plant, face: bestKey, cells: cells.length }));
