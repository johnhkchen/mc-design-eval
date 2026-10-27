// Way 446478798: a four-storey interwar brick commercial block with a cream plaster band system, a basalt plinth and a
// shopfront at street level. Auckland's 1920s-30s CBD and Eden Terrace frontages were built this way: brick walls on
// bluestone (basalt) foundations, plaster string courses and cornices, timber or steel shopfronts. The footprint is
// solid from its own ground up to its tier top, so nothing floats on the slope; windows are glass set on the wall line
// with a one-block air gap behind (a lit glowstone in some), and each storey's string course is a floor slab.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_446478798.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_446478798.nbt";

const key = (x, z) => `${x},${z}`;
const col = new Map();                       // "x,z" -> { g, r, top }
for (const [x, z, g, r] of cells) col.set(key(x, z), { g, r });

// the lidar roof, smoothed into three flat tiers: a 4-storey core (17), a 3-storey wing (14), a 2-storey wing (12)
const tierOf = (r) => (r >= 16 ? 17 : r >= 14 ? 14 : 12);

// distance (in cells) from the footprint's edge, so the top tier steps back from the street face
const dist = new Map();
{
  const q = [];
  for (const [k] of col) {
    const [x, z] = k.split(",").map(Number);
    const edge = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => !col.has(key(x + dx, z + dz)));
    if (edge) { dist.set(k, 1); q.push(k); }
  }
  for (let i = 0; i < q.length; i++) {
    const [x, z] = q[i].split(",").map(Number), d = dist.get(q[i]);
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const n = key(x + dx, z + dz);
      if (col.has(n) && !dist.has(n)) { dist.set(n, d + 1); q.push(n); }
    }
  }
}

for (const [k, c] of col) {
  let top = tierOf(c.r);
  if (top === 17 && dist.get(k) === 1) top = 14;   // the top storey sets back one cell from the facade
  c.top = top;
}

const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const topOf = (x, z) => (col.get(key(x, z)) ?? { top: 0 }).top;
const inFoot = (x, z) => col.has(key(x, z));

// a face is seen at height y when its neighbour is outside the footprint or stands lower than y
const exposed = (x, z, y) => Object.entries(DIRS).filter(([, [dx, dz]]) => !inFoot(x + dx, z + dz) || topOf(x + dx, z + dz) <= y).map(([d]) => d);

// the bay along a face: x for north/south walls, z for east/west walls
const bayU = (dir, x, z) => (dir === "north" || dir === "south" ? x : z);
const isWindowBay = (u, y) => u % 4 === 1 || u % 4 === 2;

// the front door: on the south (or north) face, at the lowest ground, nearest the middle of the face
let door = null;
{
  let best = Infinity;
  for (const [k, c] of col) {
    const [x, z] = k.split(",").map(Number);
    for (const dir of ["south", "north"]) {
      const [dx, dz] = DIRS[dir];
      if (inFoot(x + dx, z + dz)) continue;
      const score = c.g * 100 + Math.abs(x - 14);
      if (score < best) { best = score; door = { x, z, dir, g: c.g }; }
    }
  }
}

const g = new Voxels([29, 30, 14]);
const set = (x, y, z, b, s) => g.set(x, y, z, b, s);

// the wall: body brick, quartz string courses on each storey line, a basalt plinth at ground level
for (const [k, c] of col) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < c.top; y++) {
    if (y < c.g) { set(x, y, z, "polished_andesite"); continue; }          // foundation under the slope
    const ex = exposed(x, z, y);
    if (!ex.length) {                                                        // interior: body and roof
      set(x, y, z, y === c.top - 1 ? "smooth_stone" : "bricks");
      continue;
    }
    if (y === c.top - 1) { set(x, y, z, "smooth_stone"); continue; }         // parapet cap
    if (y === c.top - 2) { set(x, y, z, "smooth_quartz"); continue; }        // cornice
    if (y === c.g) { set(x, y, z, "polished_andesite"); continue; }          // base course
    if (y <= 2) { set(x, y, z, ex.some((d) => isWindowBay(bayU(d, x, z), y)) ? "glass" : "bricks"); continue; }  // shopfront
    if (y % 4 === 0 || y % 4 === 3) { set(x, y, z, "smooth_quartz"); continue; }                             // storey line, window head
    set(x, y, z, ex.some((d) => isWindowBay(bayU(d, x, z), y)) ? "glass" : "bricks");                         // window band
  }
}

// a one-block air gap behind each window (the glass sits on the wall line, the cell behind it is air or a warm light)
for (const [k, c] of col) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < c.top; y++) {
    if (y < c.g) continue;
    for (const d of exposed(x, z, y)) {
      const [dx, dz] = DIRS[d];
      const winHere = (y <= 2 && y > c.g && isWindowBay(bayU(d, x, z), y)) || (y > 2 && y % 4 !== 0 && y % 4 !== 3 && isWindowBay(bayU(d, x, z), y));
      if (!winHere) continue;
      const ix = x - dx, iz = z - dz;
      if (!inFoot(ix, iz) || topOf(ix, iz) <= y) continue;
      const lit = (x * 31 + y * 17 + z * 7) % 9 === 0;
      if (lit) set(ix, y, iz, "glowstone");
      else if ((x * 13 + y * 5 + z * 3) % 37 === 0) set(ix, y, iz, "shroomlight");
      else set(ix, y, iz, "air");
    }
  }
}

// the entrance: a dark oak door on the chosen face, a canopy over it, with a step of plinth in front
if (door) {
  const { x, z, dir, g: dg } = door;
  const facing = dir;
  set(x, dg, z, "dark_oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  set(x, dg + 1, z, "dark_oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
  const yc = Math.max(3, dg + 2);
  const [dx, dz] = DIRS[dir];
  const along = dir === "north" || dir === "south" ? [1, 0] : [0, 1];
  for (let s = -2; s <= 2; s++) {
    const cx = x + along[0] * s + dx, cz = z + along[1] * s + dz;   // one block out from the wall line
    if (!inFoot(cx, cz)) set(cx, yc, cz, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

// roof plant on the top storey's interior: two concrete plant boxes and a terrace of planters
for (const [k, c] of col) {
  if (c.top !== 17) continue;
  const [x, z] = k.split(",").map(Number);
  if (dist.get(k) < 3) continue;
  // a 2x2 plant box, only where all four cells are roof of the top tier (so it stands on the roof, not in air)
  const four = [[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]];
  if ((x === 9 || x === 16) && z === 7 && four.every(([a, b]) => topOf(a, b) === 17 && dist.get(key(a, b)) >= 3)) {
    for (const [a, b] of four) for (const y of [17, 18]) set(a, y, b, "light_gray_concrete");
  }
}

g.save(OUT);
console.log("cells", cells.length, "built", g.count(), "top tiers", [...new Set([...col.values()].map((c) => c.top))].join("/"));
