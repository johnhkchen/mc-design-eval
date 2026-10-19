// 21 West 53rd Street, Museum of Modern Art expansion (Public Facilities & Institutions, 1963).
// Read as a mid-century International Style block: a stone base and a street-level lobby of glass, over a flat curtain
// wall of light-blue glass in aluminium-look frames, white spandrels at each floor line, a stone coping, and a glazed
// mechanical penthouse on the tallest tier. The massing follows the lidar roof, smoothed into 3-block storeys and four
// flat tiers (2, 4, 7 and 9 storeys) so every tier stands on the storey below.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1081128.cells.json`, "utf8"));   // [x, z, ground, roof]

const W = 36, H = 44, D = 31;
const B = {
  plinth: "polished_andesite", base: "smooth_quartz", spandrel: "white_concrete", floor: "white_concrete",
  frame: "iron_block", glass: "light_blue_stained_glass_pane", coping: "smooth_quartz", roof: "light_gray_concrete",
  glow: "glowstone", lantern: "lantern", door: "iron_door",
};
const N = [0, -1], S = [0, 1], WEST = [-1, 0], EAST = [1, 0];   // north (low z, uptown), south (the street face), west, east
const DIRS = [N, S, WEST, EAST];
const k2 = (x, z) => `${x},${z}`;
const k3 = (x, y, z) => `${x},${y},${z}`;

// Footprint cells: [x, z, ground, roof].
const fp = new Map();
for (const [x, z, ground, roof] of cells) fp.set(k2(x, z), { ground, roof });
const has = (x, z) => fp.has(k2(x, z));
const median = (a) => a.sort((p, q) => p - q)[Math.floor(a.length / 2)];

// Tiers: the 3x3 median of the lidar roof, quantised to whole storeys, then grouped into four flat tiers.
const tierStoreys = (m) => (m < 12 ? 2 : m < 20 ? 4 : m < 26 ? 7 : 9);   // the lone 32 at the west edge is lidar noise, so it joins the 9-storey tier
const info = new Map();
for (const [k, { ground, roof }] of fp) {
  const [x, z] = k.split(",").map(Number);
  const near = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const n = fp.get(k2(x + dx, z + dz)); if (n) near.push(n.roof); }
  const n = tierStoreys(median(near));
  info.set(k, { g: ground, n, top: ground + 3 * n });                    // rows g .. top-1 are the solid envelope
}
const at = (x, z) => info.get(k2(x, z));

// A side is open when its neighbour is off the footprint or sits on a lower tier.
const faces = (x, z) => DIRS.filter(([dx, dz]) => !has(x + dx, z + dz) || at(x + dx, z + dz).top < at(x, z).top);

// Entrance: the two middle cells of the street (south, z = 30) frontage.
const street = [...fp.keys()].map((k) => k.split(",").map(Number)).filter(([, z]) => z === D - 1).map(([x]) => x).sort((a, b) => a - b);
const midX = street[Math.floor(street.length / 2)];
const doorX = new Set([midX, midX + 1]);
const isDoor = (x, z) => z === D - 1 && doorX.has(x);

// Penthouse: tallest-tier cells whose 5x5 neighbourhood is all tallest tier, so it sits well inside the roof.
const tallest = Math.max(...[...info.values()].map((v) => v.n));
const inTop = (x, z) => {
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) {
    const v = info.get(k2(x + dx, z + dz)); if (!v || v.n !== tallest) return false;
  }
  return true;
};

// The envelope is planned as blocks keyed by position; glazing keeps its face so the panes can be connected and lit.
const blk = new Map();
const put = (x, y, z, block, extra = {}) => blk.set(k3(x, y, z), { x, y, z, block, state: null, ...extra });
const has3 = (x, y, z) => blk.has(k3(x, y, z));

// Floor by floor. A footprint cell is a full column from y 0 (the plinth) up to its top.
for (const [k, v] of info) {
  const [x, z] = k.split(",").map(Number);
  const fs = faces(x, z);
  for (let y = 0; y < v.g; y++) put(x, y, z, B.plinth);                 // foundation up to this cell's ground
  for (let s = 0; s < v.n; s++) {
    const topStorey = s === v.n - 1;
    for (let r = 0; r < 3; r++) {
      const y = v.g + 3 * s + r;
      if (!fs.length) {                                                 // interior: floor plates and a roof, air between
        if (r === 0) put(x, y, z, B.floor);
        else if (r === 2 && topStorey) put(x, y, z, B.roof);
        continue;
      }
      if (isDoor(x, z) && s === 0 && r < 2) {                           // the entrance: a double pair of doors
        put(x, y, z, B.door, { state: { facing: "south", half: r === 0 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" } });
        continue;
      }
      if (isDoor(x, z) && s === 0 && r === 2) { put(x, y, z, B.coping); continue; }   // the lintel canopy over the doors
      if (r === 0) { put(x, y, z, s === 0 ? B.base : B.spandrel); continue; }        // base course or spandrel at the floor line
      if (topStorey && r === 2) { put(x, y, z, B.coping); continue; }               // stone coping on the roofline
      // Glazing: the corners are mullions, and along a face every third cell is a mullion; the rest is glass.
      const alongX = fs.every(([dx, dz]) => dx === 0 && dz !== 0);
      const alongZ = fs.every(([dx, dz]) => dz === 0 && dx !== 0);
      const corner = !alongX && !alongZ;
      const mullion = corner || (alongX ? x % 3 === 0 : z % 3 === 0);
      put(x, y, z, mullion ? B.frame : B.glass, { axis: alongX ? "x" : alongZ ? "z" : null, out: fs[0] });
    }
  }
}

// Penthouse on the tallest tier: glazed and light-concrete walls, a coping, and air inside.
for (const [k, v] of info) {
  const [x, z] = k.split(",").map(Number);
  if (v.n !== tallest || !inTop(x, z)) continue;
  const edge = DIRS.some(([dx, dz]) => !inTop(x + dx, z + dz));
  for (let r = 0; r < 3; r++) {
    const y = v.top + r;
    if (r === 2) { put(x, y, z, B.coping); continue; }
    if (!edge) continue;
    if (r === 0) put(x, y, z, B.roof);
    else put(x, y, z, (x + z) % 2 ? B.glass : B.frame, { axis: "x" });
  }
}

// Panes connect to neighbouring blocks in their own face only, as flush curtain-wall glass does.
for (const b of blk.values()) {
  if (b.block !== B.glass) continue;
  const side = (dx, dz) => (has3(b.x + dx, b.y, b.z + dz) ? "true" : "false");
  b.state = b.axis === "x"
    ? { east: side(1, 0), west: side(-1, 0), north: "false", south: "false", waterlogged: "false" }
    : { east: "false", west: "false", north: side(0, -1), south: side(0, 1), waterlogged: "false" };
}

// Warm light behind some windows: a glowstone just inside a pane, in the air gap.
for (const b of [...blk.values()]) {
  if (b.block !== B.glass || b.y % 3 !== 1 || !b.out) continue;
  if ((b.x * 5 + b.z * 3 + Math.floor(b.y / 3) * 7) % 9 !== 0) continue;
  const [dx, dz] = [-b.out[0], -b.out[1]];                               // inside is opposite the face
  if (has(b.x + dx, b.z + dz) && !has3(b.x + dx, b.y, b.z + dz)) put(b.x + dx, b.y, b.z + dz, B.glow);
}

// Lobby lanterns hanging from the first floor plate, either side of the entrance.
for (const x of [midX - 3, midX + 4]) {
  const z = D - 4;
  if (!has(x, z)) continue;
  const y = at(x, z).g + 2;                                              // the lowest air row, under the storey-1 floor plate
  if (!has3(x, y, z)) put(x, y, z, B.lantern, { state: { hanging: "true", waterlogged: "false" } });
}

const g = new Voxels([W, H, D]);
for (const b of blk.values()) g.set(b.x, b.y, b.z, b.block, b.state ?? undefined);
const { blocks, palette } = g.save(`${DIR}/NYC1081128.nbt`);
console.log(`NYC1081128: ${blocks} blocks, palette ${palette}, tallest tier ${tallest} storeys`);
