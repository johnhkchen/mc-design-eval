// Architecture West, Mt Eden side of the CBD: a late-1980s concrete-frame office block, a 36 x 41 footprint on a
// slope (lidar ground 0 to 10 blocks). Massing is three flat tiers snapped from the lidar roofs: a low wing (y 23), a
// main block (y 29) and a tower (y 37) with a roof plant box and lantern. Storey lines sit on absolute 4-block rows,
// so floor slabs run unbroken across the footprint; each column stands on its own foundation from y 0 to its ground.
// The facade is the exposed outer ring: white spandrels, blue glass panes in black/light-grey frames, a base course at
// each column's ground, a shopfront and a recessed-lintel entrance with doors on the lowest street face, and a
// glowstone behind some panes. The inside is air with floor slabs per storey, and a parapet on the outer rim.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_918249416.cells.json`, "utf8"));   // [x, z, ground, roof]
const OUT = `${DIR}/way_918249416.nbt`;

const W = 36, D = 41, Y = 50;
const FOUND = "stone_bricks", BASE = "polished_andesite", SLAB = "smooth_stone", SPAN = "white_concrete";
const GLASS = "light_blue_stained_glass", MULL = "light_gray_concrete", FRAME = "black_concrete";
const ROOF = "gray_concrete", CORNER = "light_gray_concrete", PLANT = "light_gray_concrete";

// the lidar roof, smoothed over a 5 x 5 patch of footprint, snapped to three flat tiers
const DIRS = { W: [-1, 0], E: [1, 0], N: [0, -1], S: [0, 1] };
const col = new Map();
for (const [x, z, g, r] of cells) col.set(`${x},${z}`, { x, z, g, r });
const at = (x, z) => col.get(`${x},${z}`);
for (const c of col.values()) {
  let s = 0, n = 0;
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) { const o = at(c.x + dx, c.z + dz); if (o) { s += o.r; n++; } }
  c.s = s / n;
  c.H = c.s < 26 ? 23 : c.s < 33 ? 29 : 37;
}

// the faces a column shows: outer (off the footprint) and setback (a neighbour is lower)
const outerFaces = (c) => Object.keys(DIRS).filter((d) => !at(c.x + DIRS[d][0], c.z + DIRS[d][1]));
const lowerFaces = (c) => Object.keys(DIRS).filter((d) => { const n = at(c.x + DIRS[d][0], c.z + DIRS[d][1]); return n && n.H < c.H; });
for (const c of col.values()) {
  c.outer = outerFaces(c); c.faces = [...c.outer, ...lowerFaces(c)];
  c.shell = c.faces.length > 0;
  // a corner shows two outer faces on different axes
  c.corner = c.outer.includes("N") + c.outer.includes("S") > 0 && c.outer.includes("W") + c.outer.includes("E") > 0;
  c.face = c.outer[0] ?? c.faces[0] ?? null;
}

// the entrance: two door leaves on the lowest plain outer face (one outer face, not a corner) at ground level, the
// lintel band above; the second leaf sits on the next footprint cell along that same face
const FACING = { W: "west", E: "east", N: "north", S: "south" };
const plain = [...col.values()].filter((c) => c.outer.length === 1 && !c.corner);
const pick = plain.sort((a, b) => a.g - b.g || a.x - b.x || a.z - b.z)[0];
const pdir = pick.outer[0];
const along = pdir === "N" || pdir === "S" ? [1, 0] : [0, 1];
const second = at(pick.x + along[0], pick.z + along[1]);
const doorCells = [pick, second && second.outer.includes(pdir) ? second : null].filter(Boolean)
  .sort((a, b) => a.x - b.x || a.z - b.z);
for (const c of doorCells) { c.door = true; c.doorFacing = FACING[pdir]; }
const doorHinge = (c) => (c === doorCells[0] ? "left" : "right");

// the tower's roof plant: a 3 x 3 box at the centre of the top tier, standing on the roof slab, with a lantern
const towerCells = [...col.values()].filter((c) => c.H === 37 && !c.shell);
let plant = null;
{
  let best = Infinity;
  const cx = towerCells.reduce((a, c) => a + c.x, 0) / (towerCells.length || 1);
  const cz = towerCells.reduce((a, c) => a + c.z, 0) / (towerCells.length || 1);
  for (const c of towerCells) {
    let ok = true;
    for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const o = at(c.x + dx, c.z + dz); if (!o || o.H !== 37 || o.shell) ok = false; }
    const d = Math.abs(c.x - cx) + Math.abs(c.z - cz);
    if (ok && d < best) { best = d; plant = c; }
  }
}

const g = new Voxels([W, Y, D]);
const isDoorBlock = (c, y) => c.door && y >= c.g && y <= c.g + 1;
const hash = (c, y, k) => (c.x * 7 + c.z * 13 + y * 5 + k) % 9;

// the facade block at a shell column's row y, on its outward face (dir)
function facadeBlock(c, dir, y) {
  if (c.corner) return y === c.g ? BASE : CORNER;
  if (y === c.g) return BASE;
  if (y === c.H - 1) return SPAN;                       // cornice band under the roof slab
  const rel = y % 4;
  if (rel === 0 || rel === 3) return SPAN;             // floor line and head band of each storey
  const along = dir === "N" || dir === "S" ? c.x : c.z;
  const ground = Math.floor(y / 4) === Math.floor(c.g / 4);
  if (along % 3 === 0) return ground ? FRAME : MULL;   // a mullion every third cell (black frame on the shopfront)
  return GLASS;
}

for (const c of col.values()) {
  const dir = c.face;
  // foundation: solid from y 0 up to the column's ground
  for (let y = 0; y < c.g; y++) g.set(c.x, y, c.z, FOUND);
  for (let y = c.g; y < c.H; y++) {
    if (c.shell) {
      if (c.door && isDoorBlock(c, y)) {
        const half = y === c.g ? "lower" : "upper";
        const hinge = doorHinge(c);
        g.set(c.x, y, c.z, "dark_oak_door", { facing: c.doorFacing, half, hinge, open: "false", powered: "false" });
        continue;
      }
      g.set(c.x, y, c.z, facadeBlock(c, dir, y));
    } else if (y === c.H - 1) {
      g.set(c.x, y, c.z, ROOF);                         // the roof slab of an interior column
    } else if (y % 4 === 0) {
      g.set(c.x, y, c.z, SLAB);                         // an interior floor slab
    }
  }
  // parapet on the outer rim, one block above the roof slab
  if (c.outer.length) g.set(c.x, c.H, c.z, SPAN);
  // a warm glowstone behind some panes: one cell inside the glass, in the air gap
  if (c.shell && dir && !c.corner) {
    for (let y = c.g; y < c.H - 1; y++) {
      const rel = y % 4;
      if (rel !== 1 && rel !== 2) continue;
      if (Math.floor(y / 4) === Math.floor(c.g / 4)) continue;     // no lamps on the shopfront
      const along = dir === "N" || dir === "S" ? c.x : c.z;
      if (along % 3 === 0 || hash(c, y, 0) > 2) continue;
      const [dx, dz] = DIRS[dir];
      const inner = at(c.x - dx, c.z - dz);
      if (inner && !inner.shell) g.set(inner.x, y, inner.z, "glowstone");
    }
  }
}

// the rooftop: a lift-and-plant box on the tower, a lantern on its roof
if (plant) {
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) g.set(plant.x + dx, 37, plant.z + dz, PLANT);
  g.set(plant.x, 38, plant.z, PLANT);
  g.set(plant.x, 39, plant.z, "lantern", { hanging: "false", waterlogged: "false" });
}

g.save(OUT);
console.log("saved", OUT, "blocks", g.count(), "palette", g.palette.length - 1);
