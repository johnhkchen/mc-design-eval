import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1016280207";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// 19 x 18 footprint, roof about 21 blocks above the lowest ground.
// Reads as a 1980s-90s Taipei mid-rise office block: four storeys of 5 blocks,
// white concrete piers and storey lines, tinted glass bands, a cyan shopfront,
// a parapet cornice, a plant penthouse and a short antenna.
const W = 19, H = 33, D = 18;
const ROOF = 21;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), Math.min(Math.max(Math.round(gr), 0), ROOF - 2));
const has = (x, z) => ground.has(key(x, z));
const gOf = (x, z) => ground.get(key(x, z));

// Exposed faces of a footprint cell
const faces = (x, z) => ({
  xm: !has(x - 1, z),
  xp: !has(x + 1, z),
  zm: !has(x, z - 1),
  zp: !has(x, z + 1),
});

// Facade block for a perimeter cell at height y
function wallBlock(x, y, z, f) {
  const corner = (f.xm || f.xp) && (f.zm || f.zp);
  const along = (f.xm || f.xp) ? z : x;     // position along the exposed wall
  if (y === 0) return "stone_bricks";        // base course
  if (y % 5 === 0) return "white_concrete";  // storey line
  if (y % 5 === 4) return "light_gray_concrete"; // spandrel under each window band
  // window band rows 1..3
  if (corner || along % 3 === 0) return "white_concrete"; // piers and corner columns
  if (y < 5) return "cyan_stained_glass";    // shopfront glazing
  if (((x * 7 + z * 13 + y * 3) % 11) === 0) return "glowstone"; // a few lit offices
  return "light_blue_stained_glass";
}

const interiorCells = [];

// Build the body
for (const [x, z] of cells.map(([cx, cz]) => [cx, cz])) {
  const gr = gOf(x, z);
  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone");

  const f = faces(x, z);
  const perimeter = f.xm || f.xp || f.zm || f.zp;

  if (perimeter) {
    for (let y = gr; y < ROOF; y++) {
      g.set(x, y, z, wallBlock(x, y, z, f));
    }
    g.set(x, ROOF, z, "light_gray_concrete"); // parapet cornice
  } else {
    interiorCells.push([x, z, gr]);
    // Floor slabs at each storey line (hidden behind the glass)
    for (const L of [5, 10, 15, 20]) {
      if (L >= gr) g.set(x, L, z, "smooth_stone");
    }
  }
}

// Main entrance on the lowest-ground perimeter cell facing north or south,
// nearest the centre of the footprint
const cx = cells.reduce((s, c) => s + c[0], 0) / cells.length;
const cz = cells.reduce((s, c) => s + c[1], 0) / cells.length;
const minGround = Math.min(...cells.map(([x, z]) => gOf(x, z)));
let door = null;
for (const [x, z] of cells) {
  const gr = gOf(x, z);
  const f = faces(x, z);
  if (gr !== minGround) continue;
  if (!(f.zm || f.zp || f.xm || f.xp)) continue;
  const d = Math.hypot(x - cx, z - cz);
  if (!door || d < door.d) door = { x, z, gr, f, d };
}
if (door) {
  const facing = door.f.zm ? "north" : door.f.zp ? "south" : door.f.xm ? "west" : "east";
  const { x, z, gr } = door;
  g.set(x, gr, z, "oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(x, gr + 1, z, "oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
  g.set(x, gr + 2, z, "white_concrete"); // lintel over the door
}

// Roof plant penthouse over the central interior cells, with a short antenna
const pent = interiorCells.filter(([x, z]) => Math.abs(x - cx) <= 3.5 && Math.abs(z - cz) <= 3.5);
const pentSet = new Set(pent.map(([x, z]) => key(x, z)));
for (const [x, z] of pent) {
  const ring = !pentSet.has(key(x - 1, z)) || !pentSet.has(key(x + 1, z)) ||
               !pentSet.has(key(x, z - 1)) || !pentSet.has(key(x, z + 1));
  for (let y = ROOF; y <= 23; y++) {
    g.set(x, y, z, ring ? "white_concrete" : "smooth_stone");
  }
  g.set(x, 24, z, "light_gray_concrete");
}
if (pent.length) {
  let best = pent[0];
  for (const c of pent) {
    if (Math.hypot(c[0] - cx, c[1] - cz) < Math.hypot(best[0] - cx, best[1] - cz)) best = c;
  }
  const [mx, mz] = best;
  for (let y = 25; y <= 30; y++) g.set(mx, y, mz, "iron_bars");
  g.set(mx, 31, mz, "lightning_rod");
}

g.save(`${DIR}/${ID}.nbt`);
