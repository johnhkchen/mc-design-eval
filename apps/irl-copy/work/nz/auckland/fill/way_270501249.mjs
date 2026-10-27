// Way 270501249: a four-storey plastered-concrete commercial block of the 1930s-50s, cream walls with quartz bands,
// shopfronts on the ground floor, a dark-oak fascia and a flat roof with a plant room. The lidar roof is flat at 17
// (972 of 979 cells; the rest are edge noise), so the massing is one flat-topped block on a plinth, not a tiered tower.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_270501249.cells.json`, "utf8"));
const g = new Voxels([45, 30, 39]);

// Storey rows: foundation 0-1, plinth 2 (ground-floor datum), then a 4-row module per storey: slab (2, 6, 10, 14),
// two window rows, a spandrel. The top row is the parapet / roof deck.
const TOP = 17;
const DIRS = [["+x", 1, 0], ["-x", -1, 0], ["+z", 0, 1], ["-z", 0, -1]];
const fp = new Map(cells.map(([x, z]) => [`${x},${z}`, true]));

// the lidar roof, smoothed to one flat tier (edge noise at 8-16 is folded into the roof)
const roofAt = () => TOP;

// exposed sides: a neighbour outside the footprint (the outer skin), so the walls are one cell thick and the rest is air
const exposed = (x, z) => DIRS.filter(([, dx, dz]) => !fp.has(`${x + dx},${z + dz}`)).map(([d]) => d);
const ring = new Map(cells.map(([x, z]) => [`${x},${z}`, exposed(x, z)]));

// the wall cell is a pier (a quartz mullion) on every third column of its face, and always at a corner
const isPier = (x, z, ex) => {
  const hasX = ex.some((d) => d.endsWith("x")), hasZ = ex.some((d) => d.endsWith("z"));
  if (hasX && hasZ) return true;
  return hasX ? z % 3 === 0 : x % 3 === 0;
};

const DOOR = { x: 1, z: 8 };       // the west face's middle, on the lower street side
const SHOP_BAND = 5;               // the ground-floor fascia row

// the wall of one ring cell at height y (null = air)
function wall(x, z, y, ex) {
  const R = roofAt(x, z);
  if (y <= 1) return ["stone_bricks"];                           // foundation under the footprint
  if (y === 2) return ["polished_andesite"];                     // plinth course: ground floor sits here
  if (y === R) return ex.length ? ["quartz_bricks"] : ["smooth_stone"]; // parapet on the ring, roof deck inside
  if (y > R) return null;
  if ((y - 2) % 4 === 0) return ex.length ? ["quartz_bricks"] : ["smooth_stone"]; // storey slab / string course
  if (!ex.length) return null;                                    // interior air behind the wall
  const rel = (y - 2) % 4;
  const ground = y <= SHOP_BAND;
  if (rel === 3) return ground ? ["dark_oak_planks"] : ["smooth_quartz"]; // fascia or spandrel
  if (isPier(x, z, ex)) return ground ? ["stone_bricks"] : ["quartz_pillar", { axis: "y" }];
  return ground ? ["glass"] : ["light_blue_stained_glass"];
}

for (const [x, z] of cells) {
  const ex = ring.get(`${x},${z}`);
  const R = roofAt(x, z);
  for (let y = 0; y <= R; y++) {
    if (y === 2) { g.set(x, y, z, "polished_andesite"); continue; }
    const b = wall(x, z, y, ex);
    if (b) g.set(x, y, z, b[0], b[1]);
  }
}

// the entrance: a door in the west face's middle, a lantern hung over it on the band
const dx = DOOR.x, dz = DOOR.z;
g.set(dx, 3, dz, "dark_oak_door", { facing: "east", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(dx, 4, dz, "dark_oak_door", { facing: "east", half: "upper", hinge: "left", open: "false", powered: "false" });
g.set(dx, SHOP_BAND, dz, "lantern", { hanging: "true", waterlogged: "false" });

// warm light: a glowstone or shroomlight in the air behind some upper windows, a lantern on the plinth behind the shopfront
let n = 0;
for (const [x, z] of cells) {
  const ex = ring.get(`${x},${z}`);
  if (ex.length !== 1) continue;
  const [, ox, oz] = DIRS.find(([d]) => d === ex[0]);   // outward step of the one exposed side
  const ix = x - ox, iz = z - oz;                              // the cell inward, behind this wall
  if (!fp.has(`${ix},${iz}`) || ring.get(`${ix},${iz}`).length) continue;
  for (let y = 3; y <= TOP - 1; y++) {
    const rel = (y - 2) % 4;
    if (rel === 0 || rel === 3) continue;
    if (y <= SHOP_BAND) {
      if (y === 3 && (x + z) % 4 === 0) { g.set(ix, 3, iz, "lantern", { hanging: "false", waterlogged: "false" }); n++; }
      continue;
    }
    if (isPier(x, z, ex)) continue;
    if ((x + z + y) % 7 === 0) { g.set(ix, y, iz, n % 2 ? "shroomlight" : "glowstone"); n++; }
  }
}

// roof: a plant room with a small lift overrun on the flat deck, set on the roof slab
for (const [x, z] of cells) {
  if (ring.get(`${x},${z}`).length) continue;
  if (x >= 19 && x <= 23 && z >= 15 && z <= 19) g.set(x, TOP + 1, z, "light_gray_concrete");
  if (x >= 20 && x <= 22 && z >= 16 && z <= 18) g.set(x, TOP + 2, z, "smooth_quartz");
}

const res = g.save(`${DIR}/way_270501249.nbt`);
console.log(JSON.stringify({ cells: cells.length, lights: n, ...res }));
