// Wilson Parking, Auckland (way 162814960): a multi-storey concrete car park. Wilson Parking is a car-park operator, so
// this reads as a deck building: a basalt plinth (Auckland's volcanic stone) on a two-block base, a light-grey concrete
// frame with piers at the corners and every third block along each face, dark glass slots for the decks (air behind
// them, lanterns hung there so they glow at dusk), smooth-stone storey belts, a parapet with lamp posts, a glazed
// shopfront and a door on the north face, and a lift overrun on the tallest uniform patch of roof. Lidar roofs are
// median-smoothed and snapped to 4-block storeys: 20 (the east wing), 24 (the plateau), 28 and 32 (the core), so the
// massing steps back as it rises. Interiors are solid concrete with a one-block air pocket behind each opening, so every
// slab and tier stands on the storey below.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_162814960.cells.json`, "utf8"));

const W = 54, D = 56, H = 44;
const FLOOR0 = 2;           // the ground floor's slab: the plinth fills y 0 and 1 under every cell
const STOREY = 4;           // slab, two rows of opening, a spandrel belt
const PLINTH = "deepslate_bricks", FRAME = "light_gray_concrete", BELT = "smooth_stone", GLAZE = "gray_stained_glass";
const SIDES = [[0, -1], [0, 1], [-1, 0], [1, 0]];   // north, south, west, east

const key = (x, z) => `${x},${z}`;
const ROOF = new Map();
for (const [x, z, , roof] of cells) ROOF.set(key(x, z), roof);
const inside = (x, z) => ROOF.has(key(x, z));
const footprint = [...ROOF.keys()].map((k) => k.split(",").map(Number));

// lower median of the 3x3 neighbourhood inside the footprint (the lower one keeps the ragged tip cells from spiking)
const smoothRoof = (x, z) => {
  const v = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (inside(x + dx, z + dz)) v.push(ROOF.get(key(x + dx, z + dz)));
  v.sort((a, b) => a - b);
  return v[(v.length - 1) >> 1];
};
const tierOf = (r) => (r <= 22 ? 20 : r <= 27 ? 24 : r <= 30 ? 28 : 32);

const T = new Map(), N = new Map();   // roof tier (top block + 1) and storey count per cell
for (const [x, z] of footprint) {
  const t = tierOf(smoothRoof(x, z));
  T.set(key(x, z), t);
  N.set(key(x, z), Math.floor((t - FLOOR0) / STOREY));
}
const tOf = (x, z) => T.get(key(x, z));
const hasStorey = (x, z, k) => inside(x, z) && k < N.get(key(x, z));
// the sides of a cell at storey k that need a wall: outside the footprint, or the neighbour has no storey k (a setback)
const wallSides = (x, z, k) => SIDES.filter(([dx, dz]) => !hasStorey(x + dx, z + dz, k));
// a cell whose air pocket cannot break a wall: it has storey k and so do all four neighbours
const plain = (x, z, k) => hasStorey(x, z, k) && SIDES.every(([dx, dz]) => hasStorey(x + dx, z + dz, k));
const along = (dx, z, x) => (dx !== 0 ? z : x);     // the index a face runs along: z on east/west faces, x on north/south

const g = new Voxels([W, H, D]);

// 1. the plinth and the solid core: every cell from y 0 up to its roof slab (T - 2), so nothing floats
for (const [x, z] of footprint) {
  const t = tOf(x, z);
  for (let y = 0; y < FLOOR0; y++) g.set(x, y, z, PLINTH);
  for (let y = FLOOR0; y <= t - 2; y++) g.set(x, y, z, FRAME);
}

// 2. the storeys: belts, piers, glazed slots, the air behind the glass and the lanterns
const maxN = Math.max(...N.values());
for (let k = 0; k < maxN; k++) {
  const b = FLOOR0 + STOREY * k;
  for (const [x, z] of footprint) {
    if (!hasStorey(x, z, k)) continue;
    const sides = wallSides(x, z, k);
    if (!sides.length) continue;
    const corner = sides.length >= 2;
    g.set(x, b + 3, z, BELT);                       // the spandrel belt runs round every exposed cell
    for (const [dx, dz] of sides) {
      if (corner || along(dx, z, x) % 3 === 0) continue;      // a pier: the concrete frame stays
      const glass = k === 0 ? "glass" : GLAZE;
      g.set(x, b + 1, z, glass);
      g.set(x, b + 2, z, glass);
      const ix = x - dx, iz = z - dz;               // the cell behind the glass
      if (!plain(ix, iz, k)) continue;
      g.set(ix, b + 1, iz, "air");
      g.set(ix, b + 2, iz, "air");
      if (along(dx, z, x) % 6 === 1) g.set(ix, b + 2, iz, "lantern", { hanging: "true", waterlogged: "false" });
    }
  }
}

// 3. the entrance: the north face's ground-floor glazing nearest the front's middle, a double iron door
let door = null;
for (const [x, z] of footprint) {
  if (!hasStorey(x, z, 0) || hasStorey(x, z - 1, 0)) continue;     // north face only
  if (wallSides(x, z, 0).length !== 1 || x % 3 === 0) continue;    // a glazed bay, not a corner or pier
  const score = [z, Math.abs(x - (W - 1) / 2)];
  if (!door || score[0] < door.score[0] || (score[0] === door.score[0] && score[1] < door.score[1])) door = { x, z, score };
}
if (door) {
  const state = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
  g.set(door.x, 3, door.z, "iron_door", state("lower"));
  g.set(door.x, 4, door.z, "iron_door", state("upper"));
}

// 4. the parapet: a smooth-stone course and coping round the outside, with a lamp post every twelfth cell
for (const [x, z] of footprint) {
  const outside = SIDES.some(([dx, dz]) => !inside(x + dx, z + dz));
  if (!outside) continue;
  const t = tOf(x, z);
  g.set(x, t - 2, z, BELT);
  g.set(x, t - 1, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  if ((x + z) % 12 === 0) {
    g.set(x, t - 1, z, "cobblestone_wall", { up: "true", north: "none", south: "none", east: "none", west: "none", waterlogged: "false" });
    g.set(x, t, z, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// 5. roof equipment: a 4x4 lift overrun on the tallest patch of roof that is one tier all over
const top = footprint.filter(([x, z]) => tOf(x, z) >= 28);
const cx = top.reduce((s, [x]) => s + x, 0) / top.length, cz = top.reduce((s, [, z]) => s + z, 0) / top.length;
let box = null;
for (const [x0, z0] of footprint) {
  const block = [];
  for (let dz = 0; dz < 4; dz++) for (let dx = 0; dx < 4; dx++) block.push([x0 + dx, z0 + dz]);
  if (!block.every(([x, z]) => inside(x, z))) continue;
  const t = tOf(x0, z0);
  if (!block.every(([x, z]) => tOf(x, z) === t)) continue;
  const score = t * 1000 - ((x0 + 1.5 - cx) ** 2 + (z0 + 1.5 - cz) ** 2);
  if (!box || score > box.score) box = { x0, z0, t, score };
}
if (box) {
  const { x0, z0, t } = box;
  for (let dz = 0; dz < 4; dz++) for (let dx = 0; dx < 4; dx++) {
    const x = x0 + dx, z = z0 + dz, ring = dx === 0 || dx === 3 || dz === 0 || dz === 3;
    const corner = (dx === 0 || dx === 3) && (dz === 0 || dz === 3);
    g.set(x, t - 1, z, ring ? FRAME : "air");
    g.set(x, t, z, ring && !corner ? GLAZE : ring ? FRAME : "air");   // glazed bands between concrete corners
    g.set(x, t + 1, z, ring ? FRAME : "air");
    g.set(x, t + 2, z, BELT);
  }
}

const res = g.save(`${DIR}/way_162814960.nbt`);
console.log(JSON.stringify({ footprint: footprint.length, tiers: Object.fromEntries([20, 24, 28, 32].map((t) => [t, [...T.values()].filter((v) => v === t).length])), ...res }));
