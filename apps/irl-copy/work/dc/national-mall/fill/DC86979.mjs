// DC86979: 110 Maryland Ave NE, a 1960s-70s precast-clad office block on the Capitol's east side, read from the lidar record.
// A stepped massing: the lidar roof is median-smoothed over each 3x3 footprint neighbourhood and snapped to four setback
// tiers (4, 7, 10, 12 blocks above y 0), so the taller core steps down in two or three flat tiers to the wings.
// Storeys run on an absolute 3-block rhythm (a spandrel course, then two glass rows), so neighbouring columns line up
// even where the ground steps. The ground storey is a dark andesite base with a shopfront of glass to the top of the
// second course. Piers are pale smooth quartz, one every third cell along each exposed face, with corner piers; the
// spandrels are light grey concrete and the glass tinted grey. Every column fills from y 0 to its ground as foundation,
// then its walls up to its own tier, so each storey and setback stands on what is below it.
//
// Exposure is per height: a cell's side is a facade wherever the neighbour beside it is outside the footprint or
// lower than that height, so the sides of a tower above a wing read as walls, not as solid blocks. Interior cells one
// step behind a glass row are air at the window rows, with a floor slab per storey; deeper cells are solid core.
// The entrance is a flush andesite-and-quartz hood over a bronze-coloured door, with two hanging lanterns. A protruding
// canopy would need cells outside the footprint, so the hood is set into the wall line.
// Roof equipment: a few light grey mechanical boxes on the top tier.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC86979.cells.json`, "utf8"));
const X = 38, Y = 24, Z = 27;

const key = (x, z) => `${x},${z}`;
const byXZ = new Map(cells.map(([x, z, g, r]) => [key(x, z), { x, z, g, r }]));
const inside = (x, z) => byXZ.has(key(x, z));
const NB = [[0, -1, "N"], [0, 1, "S"], [-1, 0, "W"], [1, 0, "E"]];

// Lidar roof: median of the 3x3 footprint neighbourhood (kills single-cell noise), then the nearest of four setback tiers.
const TIERS = [4, 7, 10, 12];
const snap = (v) => TIERS.reduce((a, b) => (Math.abs(b - v) < Math.abs(a - v) || (Math.abs(b - v) === Math.abs(a - v) && b > a) ? b : a));
const medianRoof = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) v.push(byXZ.get(key(x + dx, z + dz)).r);
  v.sort((a, b) => a - b);
  return v[v.length >> 1];
};

const info = new Map();
for (const { x, z, g } of byXZ.values()) info.set(key(x, z), { x, z, g, T: Math.max(snap(medianRoof(x, z)), g + 3) });
const at = (x, z) => info.get(key(x, z));

// Entrance: the middle of the lowest footprint row (the first of the north-most cells), door in the centre of its span.
const minZ = Math.min(...cells.map(([, z]) => z));
const rowXs = cells.filter(([, z]) => z === minZ).map(([x]) => x).sort((a, b) => a - b);
const DOOR_X = rowXs[rowXs.length >> 1];
const DOOR = { x: DOOR_X, z: minZ };

// Which sides of (x, z) are open air at height y: outside the footprint, or the neighbour's tier is below y.
const openSides = (c, y) => NB.filter(([dx, dz]) => { const n = at(c.x + dx, c.z + dz); return !n || y >= n.T; });

// The facade block of an exposed cell at height y, or null when this cell is not exposed there.
const facadeKind = (c, y) => {
  const open = openSides(c, y);
  if (!open.length) return null;
  const { x, z, g } = c;
  const onX = open.some(([dx]) => dx !== 0), onZ = open.some(([, dz]) => dz !== 0);
  const onNS = open.some(([, dz]) => dz !== 0), onEW = open.some(([dx]) => dx !== 0);
  const pier = (onX && onZ) || (onNS && x % 3 === 0) || (onEW && z % 3 === 0);
  const sameRow = z === minZ && Math.abs(x - DOOR_X) <= 1;
  if (sameRow && y === g + 2) return { id: "smooth_quartz" };               // hood over the entrance
  if (x === DOOR.x && z === DOOR.z && y === g) return { id: "iron_door", state: { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" } };
  if (x === DOOR.x && z === DOOR.z && y === g + 1) return { id: "iron_door", state: { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" } };
  if (sameRow && Math.abs(x - DOOR_X) === 1 && y === g + 1) return { id: "lantern", state: { hanging: "true", waterlogged: "false" } };
  if (y === g) return { id: "polished_andesite" };                           // base course
  if (pier) return { id: "smooth_quartz" };
  if (y <= g + 2) return { id: "gray_stained_glass" };                          // shopfront to the top of the second course
  return y % 3 === 0 ? { id: "light_gray_concrete" } : { id: "gray_stained_glass" };
};

const hash = (x, y, z) => Math.abs(((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0);

// The block for one cell at height y: [id, state] or null for air.
const blockAt = (c, y) => {
  const { x, z, g, T } = c;
  if (y < 0 || y >= T) return null;
  if (y < g) return { id: "stone_bricks" };                                    // foundation
  if (y === T - 1) return { id: "smooth_quartz" };                             // parapet course and roof deck
  const f = facadeKind(c, y);
  if (f) return f;
  // Interior: floor slabs at y == g and every 3rd row; deep cells solid; rooms one step behind a glass row are air.
  if (y === g || y % 3 === 0) return { id: "light_gray_concrete" };
  const behindGlass = openSides(c, y).length === 0 && NB.some(([dx, dz]) => {
    const n = at(c.x + dx, c.z + dz);
    if (!n) return false;
    const k = facadeKind(n, y);
    return k && k.id === "gray_stained_glass";
  });
  if (!behindGlass || y >= T - 1) return { id: "stone" };
  const h = hash(x, y, z);
  if (y % 3 === 1 && h % 6 === 0) return { id: "lantern", state: { hanging: "false", waterlogged: "false" } };  // stands on the floor slab
  if (y % 3 === 1 && h % 17 === 0) return { id: "glowstone" };
  return null;
};

const g3 = new Voxels([X, Y, Z]);
let maxT = 0;
for (const c of info.values()) {
  maxT = Math.max(maxT, c.T);
  for (let y = 0; y < c.T; y++) {
    const b = blockAt(c, y);
    if (b) g3.set(c.x, y, c.z, b.id, b.state);
  }
}

// Roof plant: light grey mechanical boxes on the top tier, two blocks tall with a quartz slab cap, on cells well inside it.
const top = [...info.values()].filter((c) => c.T === maxT);
const deep = (c) => NB.every(([dx, dz]) => at(c.x + dx, c.z + dz)?.T === maxT) && [[1, 1], [1, -1], [-1, 1], [-1, -1]].every(([dx, dz]) => at(c.x + dx, c.z + dz)?.T === maxT);
for (const c of top) {
  if (!deep(c) || c.x % 5 !== 2 || c.z % 5 !== 2) continue;
  g3.set(c.x, maxT, c.z, "light_gray_concrete");
  g3.set(c.x, maxT + 1, c.z, "light_gray_concrete");
  g3.set(c.x, maxT + 2, c.z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
}

console.log(`DC86979: ${cells.length} cells, door at (${DOOR.x}, 0, ${DOOR.z}), max tier ${maxT}`);
console.log(g3.save(`${DIR}/DC86979.nbt`));
