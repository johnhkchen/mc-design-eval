import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Way 332241898: a three-storey brick commercial block (Edwardian / interwar main-street type, central Auckland):
// glass shopfront on the ground storey, brick piers between pairs of panes, cream plaster string courses and
// cornices, basalt-grey stone base, flat roof with a plant box. Lidar roofs are massed into three flat
// tiers: single-storey wings, a two-storey podium, and a three-storey tower. Every column is solid from its ground
// to its roof, so each tier stands on the one below; the rooms are a one-cell air gap behind the glass, with a floor
// slab per storey.
const FILE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_332241898";
const cells = JSON.parse(readFileSync(`${FILE}.cells.json`, "utf8"));

const X = 27, Y = 24, Z = 22;
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// lidar roof height -> flat tier top: wings (1 storey + parapet), podium (2 storeys + parapet), tower (3 storeys)
const tierTop = (r) => (r <= 6 ? 6 : r <= 8 ? 10 : 12);

// the lidar roof is noisy cell to cell (a sawtooth on every step), so take each roof's median over its 3 x 3 neighbourhood
const roofAt = new Map(cells.map(([x, z, , r]) => [`${x},${z}`, r]));
const median = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const r = roofAt.get(`${x + dx},${z + dz}`); if (r !== undefined) v.push(r); }
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const foot = new Map();
for (const [x, z, g] of cells) foot.set(`${x},${z}`, { g, top: tierTop(median(x, z)) });
// a two-storey dip wholly inside the tower would only leave stray parapet islands on the roof: it stays tower height
for (const [x, z] of cells) {
  const c = foot.get(`${x},${z}`);
  if (c.top === 10 && NB.every(([dx, dz]) => foot.has(`${x + dx},${z + dz}`))) c.top = 12;
}
const cell = (x, z) => foot.get(`${x},${z}`);

// the sides of (x, z) at height y that face outside: off the footprint, or onto a roof that has stopped below y
function openSides(x, z, y) {
  return NB.filter(([dx, dz]) => { const n = cell(x + dx, z + dz); return !n || n.top <= y; });
}
function isWall(x, z, y) {
  const c = cell(x, z);
  return !!c && y >= c.g && y < c.top && openSides(x, z, y).length > 0;
}
// the side toward the inside of the building at height y (a non-wall neighbour): the air behind the glass
function inwardOf(x, z, y) {
  return NB.find(([dx, dz]) => { const n = cell(x + dx, z + dz); return n && y >= n.g && y < n.top && !isWall(x + dx, z + dz, y); });
}

function wallBlock(x, z, y, c) {
  const sides = openSides(x, z, y);
  const alongX = sides.some(([, dz]) => dz !== 0);      // a north or south face: the wall runs east-west
  const storey = Math.floor(y / 4), band = y % 4;
  if (y === 0) return ["stone_bricks"];                  // base course
  if (y === c.top - 1) return ["white_concrete"];        // cornice on the parapet
  if (band === 0) return ["white_concrete"];             // string course at each floor
  if (band === 3) return storey === 0 ? ["dark_oak_planks"] : ["bricks"]; // shopfront fascia / brick head course
  // band 1-2: a bay of pane, pane, brick pier; a pane needs air behind it
  const idx = alongX ? x : z;
  if (idx % 3 === 0 || !inwardOf(x, z, y)) return ["bricks"];
  return alongX
    ? ["glass_pane", { north: "false", south: "false", east: "true", west: "true" }]
    : ["glass_pane", { north: "true", south: "true", east: "false", west: "false" }];
}

// the entrance: a ground-storey wall on the south side, nearest the middle of the footprint
const entrance = cells
  .filter(([x, z]) => isWall(x, z, 1) && openSides(x, z, 1).some(([, dz]) => dz === 1) && inwardOf(x, z, 1))
  .sort((a, b) => Math.abs(a[0] - 13) - Math.abs(b[0] - 13))[0];
const [ex, ez] = entrance;
const [edx, edz] = inwardOf(ex, ez, 1);
const doorKey = `${ex},${ez}`;

const g = new Voxels([X, Y, Z]);
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const c = cell(x, z);
  for (let y = 0; y < c.top; y++) {
    if (y < c.g) { g.set(x, y, z, "stone_bricks"); continue; }                  // foundation under a higher cell
    if (isWall(x, z, y)) { const [b, st] = wallBlock(x, z, y, c); g.set(x, y, z, b, st); continue; }
    if (y === c.top - 1) { g.set(x, y, z, "gray_concrete"); continue; }        // flat roof
    if (NB.some(([dx, dz]) => isWall(x + dx, z + dz, y))) {                    // air gap behind the wall, floored per storey
      if (y % 4 === 0) g.set(x, y, z, "smooth_stone");
      continue;
    }
    g.set(x, y, z, "stone");                                                   // solid core, never seen
  }
}

// the door, two halves, with a hanging lantern in the air behind it
g.set(ex, 1, ez, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(ex, 2, ez, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
g.set(ex + edx, 3, ez + edz, "lantern", { hanging: "true" });

// warm light behind some panes: shroomlights and glowstone in the air gap
let lights = 0;
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const c = cell(x, z);
  for (let y = 1; y < c.top - 1; y++) {
    const band = y % 4, storey = Math.floor(y / 4);
    if (band !== 1 && band !== 2) continue;
    if (`${x},${z}` === doorKey && y <= 2) continue;
    if (!isWall(x, z, y)) continue;
    const idx = openSides(x, z, y).some(([, dz]) => dz !== 0) ? x : z;
    const inward = inwardOf(x, z, y);
    if (!inward || idx % 3 === 0 || openSides(x, z, y).length > 1) continue;
    if ((x * 5 + z * 3 + storey * 2 + band) % 7 !== 0) continue;
    const [dx, dz] = inward;
    g.set(x + dx, y, z + dz, (x + z) % 2 ? "shroomlight" : "glowstone");
    lights++;
  }
}

// roof plant: a light-grey box on the tower roof, in the middle where no wall is near
let plant = 0;
for (let x = 17; x <= 20; x++) for (let z = 7; z <= 10; z++) {
  const c = cell(x, z);
  if (!c || c.top !== 12 || isWall(x, z, 11) || NB.some(([dx, dz]) => isWall(x + dx, z + dz, 11))) continue;
  g.set(x, 12, z, "light_gray_concrete"); g.set(x, 13, z, "light_gray_concrete");
  plant++;
}

const out = g.save(`${FILE}.nbt`);
console.log(JSON.stringify({ footprint: cells.length, entrance: [ex, ez], lights, plant, ...out }));
