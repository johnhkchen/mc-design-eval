// DC65587: a 1930s Classical Revival office block of pale limestone on a granite base, the Federal Triangle's idiom:
// an H-plan of two full-width wings joined by a narrower spine, three storeys of tall sashes in calcite bays with
// quartz framing bands, and a flat roof at 11 blocks (lidar 10, with scattered 11s smoothed to one tier). Entrances
// sit in the two 2-cell end pavilions. Every storey stands on a solid floor slab, the roof on the deck; interior is
// air behind the glass, lit by lanterns and glowstone in some bays.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC65587.cells.json`, "utf8"));

const TOP = 10;                                  // roof deck: one flat tier (lidar 10, noise 11 smoothed away)
const PLINTH = 1;                                // y0 plinth + y1 base course
const BANDS = [4, 8];                            // string courses = storey lines (solid across the footprint)
const WINDOWS = [[2, 3], [5, 7], [9, 9]];        // sash rows of the three storeys
const STONE = "calcite", TRIM = "smooth_quartz", BASE = "polished_granite", GLASS = "glass_pane", FLOOR = "smooth_stone";

const foot = new Set(cells.map(([x, z]) => `${x},${z}`));
const inF = (x, z) => foot.has(`${x},${z}`);
// the faces of a footprint cell that look outside (a neighbour missing from the footprint)
const faces = (x, z) => ({ w: !inF(x - 1, z), e: !inF(x + 1, z), n: !inF(x, z - 1), s: !inF(x, z + 1) });
const isRing = (x, z) => inF(x, z) && Object.values(faces(x, z)).some(Boolean);
const isCorner = (f) => (f.w || f.e) && (f.n || f.s);
const inWindowRow = (y) => WINDOWS.some(([a, b]) => y >= a && y <= b);
// the cell's position along its exterior face: x for north/south faces, z for east/west faces
const along = (x, z, f) => (f.n || f.s ? x : z);
// the air cell just inside a ring cell, for lights behind the glass
const inside = (x, z, f) => (f.w ? [x + 1, z] : f.e ? [x - 1, z] : f.n ? [x, z + 1] : [x, z - 1]);

const g = new Voxels([15, 23, 17]);
const put = (x, y, z, b, s) => g.set(x, y, z, b, s);

// the wall of a ring cell at height y (before the entrances and lights)
function wall(x, z, y) {
  const f = faces(x, z);
  if (y <= PLINTH) return [BASE];
  if (y === TOP || BANDS.includes(y)) return [TRIM];
  if (isCorner(f)) return [TRIM, { axis: "y" }];                  // quoins: quartz columns
  if (!inWindowRow(y)) return [STONE];
  if (along(x, z, f) % 3 === 0) return [STONE];                    // calcite piers between the sashes
  // a glass pane in the wall's plane: connects along the face
  const ns = f.n || f.s;
  return [GLASS, { east: String(ns), west: String(ns), north: String(!ns), south: String(!ns), waterlogged: "false" }];
}

const ENTRANCES = [{ x: 1, z: 0, facing: "north" }, { x: 1, z: 16, facing: "south" }];
const entranceAt = (x, z) => ENTRANCES.find((d) => d.x === x && d.z === z);

for (const cell of cells) {
  const [x, z, ground] = cell;
  for (let y = 0; y < ground; y++) put(x, y, z, FLOOR);            // foundation up to the lidar ground (none here: ground 0)
  const ring = isRing(x, z), f = faces(x, z);
  for (let y = 0; y <= TOP; y++) {
    if (!ring) {                                                    // interior: floor slabs only, the rest is air
      if (y === 0) put(x, y, z, BASE);
      else if (y === PLINTH || BANDS.includes(y) || y === TOP) put(x, y, z, FLOOR);
      continue;
    }
    const e = entranceAt(x, z);
    if (e && (y === 1 || y === 2)) {                                // the door, set on the plinth
      put(x, y, z, "dark_oak_door", { facing: e.facing, half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (e && y === 3) { put(x, y, z, TRIM); continue; }            // lintel over the door
    const [b, s] = wall(x, z, y);
    put(x, y, z, b, s);
  }
}

// the roof plant: two stone-brick penthouses on the deck, set on the deck (y 10) and capped by a slab
for (const [x0, z0, x1, z1] of [[6, 11, 8, 12], [2, 3, 3, 4]]) {
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    put(x, 11, z, "stone_bricks"); put(x, 12, z, "stone_bricks");
    put(x, 13, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

// warm light behind some glass: a lantern in each storey's first sash, glowstone in the others, on the floor slab
const lightY = [2, 5, 9];
let n = 0;
for (const [x, z] of cells) {
  const f = faces(x, z);
  if (!isRing(x, z) || isCorner(f) || entranceAt(x, z)) continue;
  for (const [i, y] of lightY.entries()) {
    if (wall(x, z, y)[0] !== GLASS) continue;
    if (++n % 3 !== 0) continue;
    const [ix, iz] = inside(x, z, f);
    if (!inF(ix, iz) || isRing(ix, iz)) continue;
    if (i === 0) put(ix, y, iz, "lantern", { hanging: "false", waterlogged: "false" });
    else put(ix, y, iz, "glowstone");
  }
}

console.log(g.save(`${DIR}/DC65587.nbt`));
