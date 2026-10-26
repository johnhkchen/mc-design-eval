import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// A 3 x 9 narrow commercial block: a 9-block brick tower at the north end, an 8-block street-wall
// along the south and west, and a one-storey wing with a penthouse behind. Red brick walls, Beaux-Arts
// calcite trim, glazed shopfronts at the ground floor, a dark plinth, and a flat roof with a parapet.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC54068.cells.json`, "utf8"));

const W = 3, H = 21, D = 9;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
// Lidar roof heights smoothed into flat tiers: tower 9, street-wall 8, one-storey wing 3, penthouse 6.
const tierOf = (x, z, lidar) => {
  if (z <= 4) return 9;
  if (z === 5 || x === 0) return 8;
  if (x === 1 && z >= 7 && lidar >= 5) return 6;
  return 3;
};
const HT = new Map(cells.map(([x, z, , r]) => [key(x, z), tierOf(x, z, r)]));
const Hof = (x, z) => HT.get(key(x, z)) ?? 0;

const WALL = "bricks", STONE = "calcite", PLINTH = "polished_granite", ROOF = "smooth_stone", GLASS = "glass_pane";
const FLOOR_ROWS = new Set([2, 5]);              // storey lines: a slab across each storey
const LIT = {                                    // warm lights behind some glass
  "2,1,4": "glowstone", "0,1,7": "glowstone", "2,4,1": "shroomlight", "0,6,7": "shroomlight",
};

// The solid faces a cell shows: E, W, N, S (outward, to air or to a lower or missing neighbour).
const faces = (x, y, z) => {
  const f = [];
  if (!(y < Hof(x + 1, z))) f.push("E");
  if (!(y < Hof(x - 1, z))) f.push("W");
  if (!(y < Hof(x, z - 1))) f.push("N");
  if (!(y < Hof(x, z + 1))) f.push("S");
  return f;
};
// Long faces, bay by bay along the run: a calcite pier every third bay and at the corner, a window bay, then
// brick. The ground floor is all shopfront glass between the piers. End faces (N, S) take the same pattern.
const isPier = (u) => u % 3 === 0 || u === 8;

// What a cell is: { b, s } for a block (and its state), or null for air (interior void behind the glass).
function decide(x, y, z) {
  const h = Hof(x, z);
  if (!(y < h)) return null;
  const top = y === h - 1;
  if (y === 0) return { b: PLINTH };
  const ex = faces(x, y, z);
  if (top) return { b: ex.length ? STONE : ROOF };
  if (!ex.length) return FLOOR_ROWS.has(y) ? { b: WALL } : null;
  const f = ex[0], u = f === "E" || f === "W" ? z : x;
  if (x === 2 && z === 1 && f === "E") {                      // the street door, with its calcite head
    if (y === 3) return { b: STONE };
    const door = { facing: "east", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" };
    if (y === 1 || y === 2) return { b: "dark_oak_door", s: door };
  }
  if (LIT[`${x},${y},${z}`]) return { b: LIT[`${x},${y},${z}`] };
  if (FLOOR_ROWS.has(y)) return { b: STONE };
  if (y === 1 || u % 3 === 1) return isPier(u) && y !== 1 ? { b: WALL } : { b: GLASS, face: f };
  return { b: WALL };
}

// Panes join their neighbours along the facade row, as a continuous glazing.
const isGlass = (x, y, z) => decide(x, y, z)?.b === GLASS;
const paneState = (x, y, z, f) => {
  if (f === "E" || f === "W") return { east: "false", west: "false", north: String(isGlass(x, y, z - 1)), south: String(isGlass(x, y, z + 1)) };
  return { north: "false", south: "false", east: String(isGlass(x + 1, y, z)), west: String(isGlass(x - 1, y, z)) };
};

for (const [x, z] of cells) {
  for (let y = 0; y < H; y++) {
    const d = decide(x, y, z);
    if (!d) continue;
    const s = d.b === GLASS ? paneState(x, y, z, d.face) : d.s;
    g.set(x, y, z, d.b, s);
  }
}

const out = `${DIR}/DC54068.nbt`;
const info = g.save(out);
console.log(JSON.stringify({ file: out, ...info }));
