// Quest on Beaumont: a four-storey serviced-apartment block of the 2000s on a volcanic-basalt plinth, white
// render with quartz storey lines and a dark lobby entrance. Lidar roof is 17-18 blocks above the lowest ground
// (one tip cell at 14 is edge noise), so the massing is four 4-block storeys with a parapet to 19; the top two
// tiers step back 1 and 2 cells from the street edge, leaving terraces with railings.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_347103390.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_347103390.nbt";

// x 0..32 runs west to east, z 0..42 north to south; each cell is [x, z, ground, roof]
const key = (x, z) => `${x},${z}`;
const foot = new Map(cells.map(([x, z, g, r]) => [key(x, z), { g, r }]));
const inF = (x, z) => foot.has(key(x, z));
const DIR = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const outward = (x, z) => Object.keys(DIR).filter((n) => !inF(x + DIR[n][0], z + DIR[n][1]));

// distance in cells from the outside (1 = the outer skin); setbacks follow it
const dist = new Map(), queue = [];
for (const k of foot.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (outward(x, z).length) { dist.set(k, 1); queue.push([x, z]); }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i], d = dist.get(key(x, z));
  for (const [dx, dz] of Object.values(DIR)) {
    const nx = x + dx, nz = z + dz, k = key(nx, nz);
    if (inF(nx, nz) && !dist.has(k)) { dist.set(k, d + 1); queue.push([nx, nz]); }
  }
}
const D = (x, z) => dist.get(key(x, z));
const cellList = [...foot.keys()].map((k) => k.split(",").map(Number));

// storeys k = 0..3 are 4 blocks high (slab at row 4k, walls 4k+1..4k+3); setback per storey: skin at dist S[k]
const S = [1, 1, 2, 3];
const ROOF = 16;                                      // roof deck over the top tier, parapet 17-18

const M = {
  plinth: "polished_blackstone_bricks", base: "polished_blackstone_bricks", mass: "white_concrete",
  stringcourse: "smooth_quartz", glass: "light_blue_stained_glass", lit: "glowstone", deck: "smooth_stone",
  coping: "smooth_quartz", rail: "glass", canopy: "polished_blackstone_slab", plant: "light_gray_concrete",
};

// bay rhythm on each face: every third cell along it is a pier, the two between are windows
const faceCells = Object.fromEntries(Object.keys(DIR).map((n) => [n, []]));
for (const [x, z] of cellList) if (D(x, z) === 1) for (const n of outward(x, z)) faceCells[n].push([x, z]);
const along = (x, z, n) => (n === "north" || n === "south" ? x : z);
const faceMin = Object.fromEntries(Object.keys(DIR).map((n) => [n, Math.min(...faceCells[n].map(([x, z]) => along(x, z, n)))]));

// the entrance: the middle of the longest street-side face (the one with the most outer-skin cells)
const street = Object.keys(DIR).reduce((a, b) => (faceCells[b].length > faceCells[a].length ? b : a));
const streetCells = faceCells[street].slice().sort((a, b) => along(a[0], a[1], street) - along(b[0], b[1], street));
const ei = Math.floor(streetCells.length / 2);
const entranceZone = new Map(streetCells.slice(ei - 1, ei + 2).map(([x, z]) => [key(x, z), key(x, z) === key(...streetCells[ei]) ? "door" : "lobby"]));

const v = new Voxels([33, 31, 43]);
const put = (x, y, z, block, state) => v.set(x, y, z, block, state);
const doorState = (half) => ({ facing: street, half, hinge: "left", open: "false", powered: "false" });
const rail = (x, z) => {
  const c = (n) => (D(x + DIR[n][0], z + DIR[n][1]) === 1 && inF(x + DIR[n][0], z + DIR[n][1]) ? "true" : "false");
  return { north: c("north"), south: c("south"), east: c("east"), west: c("west"), waterlogged: "false" };
};

// plinth row 0 under every cell (the lowest ground is y 0; cells on higher ground fill up to their ground)
for (const [x, z] of cellList) {
  const { g } = foot.get(key(x, z));
  for (let y = 0; y < Math.max(1, g); y++) put(x, y, z, M.plinth);
}

for (let k = 0; k < 4; k++) {
  const b = 4 * k;
  for (const [x, z] of cellList) {
    const dd = D(x, z);
    // a floor slab per storey, on whatever the storey below stands on
    if (k >= 1 && dd >= S[k - 1]) put(x, b, z, M.stringcourse);
    if (dd < S[k]) continue;
    if (dd > S[k]) { for (let y = b + 1; y <= b + 3; y++) put(x, y, z, M.mass); continue; }
    const outs = outward(x, z), corner = outs.length > 1, face = outs[0];
    const pier = (along(x, z, face) - faceMin[face]) % 3 === 0;
    const bay = Math.floor((along(x, z, face) - faceMin[face]) / 3);
    const lit = !pier && !corner && (bay + 2 * k + (face === "north" || face === "south" ? 0 : 3)) % 5 === 0;
    const zone = entranceZone.get(key(x, z));
    for (let y = b + 1; y <= b + 3; y++) {
      let blk = M.glass, st;
      if (k === 0 && y === b + 1) blk = M.base;                       // base course
      else if (corner) blk = M.stringcourse;                            // quoins
      else if (y === b + 1 && k >= 1) blk = pier ? M.mass : M.stringcourse;  // sill row
      else if (pier) blk = M.mass;
      else if (lit && (y === b + 2 || y === b + 3)) blk = M.lit;       // warm-lit windows
      if (zone && k === 0) {
        if (zone === "door") {
          if (y === 1) { blk = "dark_oak_door"; st = doorState("lower"); }
          else if (y === 2) { blk = "dark_oak_door"; st = doorState("upper"); }
        }
        if (zone === "lobby" && y === 2) blk = M.glass;
        if (y === 3) { blk = M.canopy; st = { type: "bottom", waterlogged: "false" }; }
      }
      put(x, y, z, blk, st);
    }
  }
}

// roof deck, parapet with coping
for (const [x, z] of cellList) {
  const dd = D(x, z);
  if (dd >= S[3]) put(x, ROOF, z, M.deck);
  if (dd === S[3]) { put(x, ROOF + 1, z, M.mass); put(x, ROOF + 2, z, M.coping); }
}

// terrace balustrades on the two setback edges (the tier's outer ring): solid glass reads as a rail, bars read as spikes
for (const [x, z] of cellList) {
  const dd = D(x, z);
  if (dd === 1) put(x, 9, z, M.rail);
  if (dd === 2) put(x, 13, z, M.rail);
}

// roof plant: a 2x2 unit on the deck, clear of the parapet
let best = null;
const inner = (x, z) => [[0, 0], [1, 0], [0, 1], [1, 1]].every(([dx, dz]) => D(x + dx, z + dz) >= 5);
for (const [x, z] of cellList) if (inner(x, z)) {
  const score = Math.hypot(x - 16, z - 21);
  if (!best || score < best[2]) best = [x, z, score];
}
if (best) for (const [dx, dz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) put(best[0] + dx, ROOF + 1, best[1] + dz, M.plant);

const stats = v.save(OUT);
console.log(JSON.stringify({ cells: cellList.length, storeys: 4, roofTop: ROOF + 3, street, entrance: streetCells[ei], ...stats }));
