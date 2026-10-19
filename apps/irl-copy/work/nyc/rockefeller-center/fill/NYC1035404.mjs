// 383 Madison Avenue (1999, commercial office), from the lidar record: a stepped curtain-wall tower on a granite
// base, with a 42-block podium and 56-block wing on the low side, an 80 and 188 setback, and the 202-block crown
// with a plant penthouse. Blue glass in light-grey frames, polished-granite base storeys with a lobby on the plaza
// (west) face, a canopy over the doors, lit offices behind some windows, and a plant room with an antenna.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1035404.cells.json`, "utf8"));   // [x, z, ground, roof]
const X = 57, Z = 54, H = 214;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const key = (x, z) => `${x},${z}`;

// Lidar roof: a 3x3 median over the footprint knocks out the spikes, then snap to the massing tiers
// (blocks above y 0; 0 = open ground, no building).
const TIERS = [42, 56, 80, 188, 202];
const snap = (r) => (r <= 2 ? 0 : TIERS.reduce((a, t) => (Math.abs(t - r) < Math.abs(a - r) ? t : a), TIERS[0]));
const raw = new Map(cells.map(([x, z, g, r]) => [key(x, z), { g, r }]));
const F = new Map();
for (const [k, v] of raw) {
  const [x, z] = k.split(",").map(Number);
  const vals = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const n = raw.get(key(x + dx, z + dz)); if (n) vals.push(n.r); }
  vals.sort((a, b) => a - b);
  F.set(k, { g: v.g, r: snap(vals[vals.length >> 1]) });
}
const cell = (x, z) => F.get(key(x, z));

// Air at (x, z, y) as a neighbour sees it: outside the footprint, or above the ground with no building in the way.
const isOpen = (x, z, y) => { const n = cell(x, z); return !n || (y >= n.g && (n.r === 0 || y >= n.r)); };
// Exterior wall: a building cell with open air beside it (the footprint's edge, or a lower tier's face).
const isRing = (x, z, y, c) => y < c.r - 2 && DIRS.some(([dx, dz]) => isOpen(x + dx, z + dz, y));
// Floor lines: the lobby's base course (y 0), then every third row, so each storey is a spandrel row and two window rows.
const isFloor = (y) => y === 0 || y % 3 === 1;

const plazaBlock = (x, z) => (x % 8 === 0 || z % 8 === 0 ? "stone_bricks" : "smooth_stone");
const lamps = [];
const facade = (x, z, y) => {
  const base = y < 7;                                        // the two base storeys: granite
  const corner = (isOpen(x - 1, z, y) || isOpen(x + 1, z, y)) && (isOpen(x, z - 1, y) || isOpen(x, z + 1, y));
  if (y === 0) return "polished_granite";
  if (corner) return base ? "polished_granite" : "gray_concrete";
  const frame = base ? "polished_granite" : "light_gray_concrete";
  if (y % 3 === 1) return frame;                             // spandrel band at each floor line
  if ((x + z) % 5 === 0) return frame;                       // mullion every fifth cell
  if (y % 3 === 2) lamps.push([x, y, z]);                    // the lower window row, where a lit office can sit
  return base && (y === 2 || y === 3) ? "glass" : "light_blue_stained_glass";
};

const g = new Voxels([X, H, Z]);
for (const [k, c] of F) {
  const [x, z] = k.split(",").map(Number);
  if (c.r === 0) {                                           // open plaza: paving on the ground
    for (let y = 0; y <= c.g; y++) g.set(x, y, z, y < c.g ? "stone" : plazaBlock(x, z));
    continue;
  }
  const edge = DIRS.some(([dx, dz]) => { const n = cell(x + dx, z + dz); return !n || n.r < c.r; });
  for (let y = 0; y < c.r; y++) {
    if (y < c.g) g.set(x, y, z, "stone");                    // foundation under the lower ground
    else if (y === c.r - 1) { if (edge) g.set(x, y, z, "light_gray_concrete"); }   // parapet on the roof edge
    else if (y === c.r - 2) g.set(x, y, z, "stone");         // roof deck
    else if (isRing(x, z, y, c)) g.set(x, y, z, facade(x, z, y));
    else if (isFloor(y)) g.set(x, y, z, "smooth_stone");     // floor slab, air between
  }
}

// Warm offices: a glowstone two cells back behind some lower-row windows (air between glass and light).
for (const [x, y, z] of lamps) {
  const inward = DIRS.find(([dx, dz]) => isOpen(x - dx, z - dz, y) && !isOpen(x + dx, z + dz, y));
  if (!inward || (x * 5 + z * 3 + y) % 11 !== 0) continue;
  g.set(x + 2 * inward[0], y, z + 2 * inward[1], "glowstone");
}

// Lobby on the west (plaza) face: two double doors under a glass storefront, with a canopy on posts.
const x0 = Math.min(...cells.filter(([x, z, , r]) => z === 25 && r > 0).map(([x]) => x));
g.set(x0, 2, 25, "iron_door", { facing: "west", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(x0, 3, 25, "iron_door", { facing: "west", half: "upper", hinge: "left", open: "false", powered: "false" });
g.set(x0, 2, 26, "iron_door", { facing: "west", half: "lower", hinge: "right", open: "false", powered: "false" });
g.set(x0, 3, 26, "iron_door", { facing: "west", half: "upper", hinge: "right", open: "false", powered: "false" });
for (let z = 23; z <= 29; z++) for (const dx of [1, 2]) if (cell(x0 - dx, z)) g.set(x0 - dx, 4, z, "gray_concrete");
for (const z of [23, 29]) {
  const G = cell(x0 - 2, z).g;
  for (let y = G + 1; y <= 3; y++) g.set(x0 - 2, y, z, "polished_granite");
}

// Crown: a plant penthouse over the 202 tier, lanterns on its corners, and an antenna mast.
const crown = [...F].filter(([, c]) => c.r === 202).map(([k]) => k.split(",").map(Number));
const cx = Math.round((Math.min(...crown.map(([x]) => x)) + Math.max(...crown.map(([x]) => x))) / 2);
const cz = Math.round((Math.min(...crown.map(([, z]) => z)) + Math.max(...crown.map(([, z]) => z))) / 2);
const R = 9;
for (let x = cx - R; x <= cx + R; x++) for (let z = cz - R; z <= cz + R; z++) {
  if (cell(x, z)?.r !== 202) continue;
  for (let y = 201; y <= 205; y++) g.set(x, y, z, y === 205 ? "gray_concrete" : "light_gray_concrete");
  g.set(x, 206, z, "stone");
}
for (const [dx, dz] of [[-R, -R], [R, -R], [-R, R], [R, R]]) g.set(cx + dx, 207, cz + dz, "lantern", { hanging: "false", waterlogged: "false" });
for (let y = 207; y <= 210; y++) g.set(cx, y, cz, "iron_bars");
g.set(cx, 211, cz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });

const out = g.save(`${DIR}/NYC1035404.nbt`);
console.log(`NYC1035404: ${out.blocks} blocks, ${out.palette} palette entries, crown centre (${cx}, ${cz}), entrance x ${x0}`);
