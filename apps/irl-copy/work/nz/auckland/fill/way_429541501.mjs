// way 429541501: a 1980s concrete-and-tinted-glass tower-slab on a basalt podium. The footprint is a thin diagonal ribbon
// (about 4 cells across, from (0,0) to (265,200)), so the massing is a long stepped wall. Storey lines sit on absolute
// y (multiples of 4) so every floor reads level along the ribbon; the top follows the lidar roof, averaged along the
// ribbon and quantised to whole storeys, which gives the setbacks. Glazing is carved out of the outer skin with air behind it.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const SRC = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${SRC}/way_429541501.cells.json`, "utf8"));
const OUT = `${SRC}/way_429541501.nbt`;

const g = new Voxels([266, 74, 201]);
const K = (x, z) => `${x},${z}`;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const FACING = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };
const along = (x, z) => 0.8 * x + 0.6 * z;                       // unit vector along the ribbon

const cell = new Map(cells.map(([x, z, gr, rf]) => [K(x, z), { x, z, gr, rf }]));
const inFp = (x, z) => cell.has(K(x, z));

// the outward direction of each cell: the first 4-neighbour outside the footprint (null for an inside cell)
const ext = new Map([...cell.values()].map((c) => [K(c.x, c.z), DIRS.find(([dx, dz]) => !inFp(c.x + dx, c.z + dz)) ?? null]));

// per-cell plan: the ground-up podium line, a roof averaged along the ribbon (lidar noise out), quantised to storeys
const list = [...cell.values()].map((c) => ({ ...c, t: along(c.x, c.z), e: ext.get(K(c.x, c.z)) }));
for (const c of list) {
  let s = 0, n = 0;
  for (const o of list) if (Math.abs(o.t - c.t) <= 8) { s += o.rf; n++; }
  c.L0 = 4 * Math.ceil(c.gr / 4);                                    // first storey line at or above the ground
  c.top = Math.max(c.L0 + 8, Math.round(s / n / 4) * 4);             // roof on a storey line, at least two storeys
  c.bay = Math.round(c.t / 2);                                       // 2-block bays along the ribbon
}
const byKey = new Map(list.map((c) => [K(c.x, c.z), c]));

const storeyZero = (c, y) => y < c.L0 + 4;
const isWindowRow = (y) => y % 4 === 1 || y % 4 === 2;
const doorAt = (c, y) => c.e && c.bay % 15 === 7 && storeyZero(c, y) && y >= c.L0 + 1 && y <= c.L0 + 2;
// an opening is a glazed exterior cell or a door cell; the cell inside it is air (an air gap behind the glass)
const opening = (c, y) => {
  if (!c.e || y < c.L0 || y >= c.top - 1 || !isWindowRow(y)) return false;
  if (doorAt(c, y)) return true;
  return storeyZero(c, y) || c.bay % 3 !== 0;                        // ground storey is shopfront; upper storeys have piers every third bay
};
const glazed = (c, y) => opening(c, y) && !doorAt(c, y);
const carved = (c, y) => {
  for (const [dx, dz] of DIRS) {
    const o = byKey.get(K(c.x + dx, c.z + dz));
    if (!o || !opening(o, y)) continue;
    const [ox, oz] = o.e;
    if (o.x - ox === c.x && o.z - oz === c.z) return true;            // o's inward neighbour is c
  }
  return false;
};

function cellBlock(c, y) {
  if (y === c.top - 1) return ["smooth_stone"];                       // cornice course
  if (y % 4 === 0) return ["light_gray_concrete"];                    // floor slab every storey
  if (y % 4 === 3) return ["white_concrete"];                         // spandrel under each window band
  if (doorAt(c, y)) return ["oak_door", {
    facing: FACING[c.e.join(",")], half: y === c.L0 + 1 ? "lower" : "upper",
    hinge: "left", open: "false", powered: "false",
  }];
  if (glazed(c, y)) return [(c.bay + y) % 4 === 0 ? "gray_stained_glass" : "light_blue_stained_glass"];
  if (carved(c, y)) {                                                 // lit room behind some panes, else air
    const h = (c.bay * 5 + y * 3 + c.x) % 9;
    if (!storeyZero(c, y) && h === 0) return ["glowstone"];
    if (!storeyZero(c, y) && h === 4) return ["shroomlight"];
    return null;
  }
  return ["white_concrete"];                                          // piers and solid wall
}

for (const c of list) {
  for (let y = 0; y < c.gr; y++) {                                    // foundation, 0 up to the ground: rusticated basalt-like masonry
    const rough = (c.x * 7 + c.z * 3 + y * 5) % 9 === 0;
    g.set(c.x, y, c.z, y % 4 === 3 ? "polished_andesite" : rough ? "cracked_stone_bricks" : "stone_bricks");
  }
  for (let y = c.gr; y < c.L0; y++) g.set(c.x, y, c.z, "polished_andesite"); // basalt podium course to the first storey line
  for (let y = c.L0; y < c.top; y++) {
    const b = cellBlock(c, y);
    if (b) g.set(c.x, y, c.z, b[0], b[1]);
  }
  if (c.e && c.bay % 7 === 3) for (let y = c.top; y < c.top + 3; y++) g.set(c.x, y, c.z, "gray_concrete"); // plant pods on the roof
}

const stats = g.save(OUT);
console.log("saved", OUT, stats);
