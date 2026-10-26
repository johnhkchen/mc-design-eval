// DC54814: a 1930s Neoclassical office block on the Mall, the Federal Triangle idiom: a granite plinth, pale limestone
// walls with quartz pilasters on a 3-bay rhythm, sills and belt courses, a recessed bronze entrance, and a 4-storey tower
// stepping up from a 3-storey body and 2-storey wings (the lidar's 14 / 12 / 11 tiers). Solid core, 1-deep air pockets
// behind each window and the door, so every tier stands on solid below and nothing floats.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC54814.cells.json", "utf8"));
const W = 13, D = 18, H = 26;
const key = (x, z) => x + "," + z;
const roofAt = new Map(cells.map(([x, z, , r]) => [key(x, z), r]));
const inF = (x, z) => roofAt.has(key(x, z));

// Smooth the lidar: the median of each cell and its footprint neighbours, then three flat tiers (tower 14, body 12, wing 11).
const tierTop = new Map();
for (const [x, z] of cells) {
  const a = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const v = roofAt.get(key(x + dx, z + dz)); if (v !== undefined) a.push(v); }
  a.sort((p, q) => p - q);
  const med = a[a.length >> 1];
  const top = med >= 13 && z >= 11 ? 14 : med <= 11 ? 11 : 12;
  tierTop.set(key(x, z), top);
}
const topOf = (x, z) => tierTop.get(key(x, z));
const L = (x, z) => topOf(x, z) - 1;                           // top solid layer of a column (its roof / cap)

// Exposed faces: the outward normal of each side with no footprint cell beyond it.
const NORMALS = [[0, -1, "north"], [0, 1, "south"], [1, 0, "east"], [-1, 0, "west"]];
const OPP = { north: "south", south: "north", east: "west", west: "east" };
const faces = (x, z) => NORMALS.filter(([dx, dz]) => !inF(x + dx, z + dz));
const perimeter = (x, z) => faces(x, z).length > 0;

// Storeys: sills at 1, 4, 7, 10; glass in the two layers above each sill, belt course at the next sill.
const STOREYS = [1, 4, 7, 10];
const hasWindowBand = (b, x, z) => b + 2 <= L(x, z) - 1;     // glass only where a cap (belt or cornice) sits above it

// The entrance: the single-exposed face with the most non-corner cells; its middle cell.
const counts = new Map();
for (const [x, z] of cells) { const f = faces(x, z); if (f.length === 1) counts.set(f[0][2], (counts.get(f[0][2]) || 0) + 1); }
const mainFace = [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
const onMain = cells.filter(([x, z]) => { const f = faces(x, z); return f.length === 1 && f[0][2] === mainFace; });
onMain.sort((a, b) => (mainFace === "north" || mainFace === "south" ? a[0] - b[0] : a[1] - b[1]));
const [doorX, doorZ] = onMain[onMain.length >> 1];
const doorN = NORMALS.find(([, , n]) => n === mainFace);

// Which face a perimeter cell's window/pier sits on, and whether it is a pilaster (corners and every third bay).
// A corner or a pilaster bay (every third column or row, counted from the origin) is a pier; the rest are glass bays.
const bayIsPier = (x, z, n) => {
  if (faces(x, z).length !== 1) return true;
  const p = n[1] !== 0 ? x : z;
  return p % 3 === 0;
};

// Air pockets: the cell just inside each window or door, for the layers the glass (or door) opens onto.
const pockets = new Set();
const windowAt = new Map();                                     // "x,z,y" -> the outward normal of the glass there
for (const [x, z] of cells) {
  if (!perimeter(x, z)) continue;
  const f = faces(x, z);
  if (f.length !== 1) continue;
  const [dx, dz, name] = f[0];
  const ix = x - dx, iz = z - dz;                              // the inward cell
  if (!inF(ix, iz) || perimeter(ix, iz)) continue;
  const isDoor = x === doorX && z === doorZ && name === mainFace;
  if (isDoor) { pockets.add(`${x},${z},1`); pockets.add(`${x},${z},2`); pockets.add(`${ix},${iz},1`); pockets.add(`${ix},${iz},2`); continue; }
  if (bayIsPier(x, z, f[0])) continue;
  for (const b of STOREYS) {
    if (!hasWindowBand(b, x, z)) continue;
    for (const y of [b + 1, b + 2]) { windowAt.set(`${x},${z},${y}`, f[0]); pockets.add(`${ix},${iz},${y}`); }
  }
}

// Lamps: warm shroomlights on the floor of some pockets (the sill layer), seen through the glass.
const lamps = new Set();
for (const k of pockets) {
  const [x, z, y] = k.split(",").map(Number);
  if (y % 3 === 2 && y > 2 && (x + z) % 4 === 1) lamps.add(k);   // the lower glass layer of the upper storeys
}

// Roof plant: small stone-brick boxes on the body roof, set back from the edge.
const plant = new Set();
for (const [x, z] of cells) {
  if (perimeter(x, z) || topOf(x, z) !== 12) continue;
  if ((x * 7 + z * 3) % 11 === 0 && L(x, z) >= 10) plant.add(`${x},${z}`);
}

const v = new Voxels([W, H, D]);
const door = (half) => ({ facing: OPP[mainFace], half, hinge: "left", open: "false", powered: "false" });
const pane = (n) => (n[0] !== 0
  ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
  : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" });

for (const [x, z] of cells) {
  const top = L(x, z), per = perimeter(x, z), f = faces(x, z);
  for (let y = 0; y <= top; y++) {
    const kp = `${x},${z},${y}`;
    if (pockets.has(kp)) continue;                             // air behind the glass and the door
    let block = "calcite", state;
    if (y === top) block = "smooth_stone";                     // the roof covering inside the walls
    if (per) {
      if (y === 0) block = "polished_granite";                 // plinth course
      else if (y === top) block = "smooth_quartz";             // cornice on the wall top
      else if (STOREYS.includes(y)) block = "smooth_quartz";   // sills and belt courses
      else block = "calcite";
      const wk = windowAt.get(kp);
      if (wk) { block = "glass_pane"; state = pane(wk); }
      if (f.length > 0 && bayIsPier(x, z, f[0])) { block = "quartz_pillar"; state = { axis: "y" }; }
      if (x === doorX && z === doorZ && (y === 1 || y === 2)) { block = "iron_door"; state = door(y === 1 ? "lower" : "upper"); }
      if (x === doorX && z === doorZ && y === 3) block = "smooth_quartz";  // the lintel over the door
    }
    v.set(x, y, z, block, state);
  }
}

// Lamps sit in the carved pockets, on the solid sill below (set after the core, which skips pockets).
for (const k of lamps) { const [x, z, y] = k.split(",").map(Number); v.set(x, y, z, "shroomlight"); }
// Roof plant: two stacked boxes on the body roof.
for (const k of plant) { const [x, z] = k.split(",").map(Number); const t = L(x, z) + 1; v.set(x, t, z, "stone_bricks"); v.set(x, t + 1, z, "stone_bricks"); }

const info = v.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC54814.nbt");
console.log(JSON.stringify({ ...info, mainFace, door: [doorX, doorZ], lamps: lamps.size, pockets: pockets.size, plant: plant.size }));
