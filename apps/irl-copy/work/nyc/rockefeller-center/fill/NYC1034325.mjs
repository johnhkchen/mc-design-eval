// 31 West 46th Street, 1920 mixed residential and commercial building: a 5 x 23 block (about 5.5 x 25 m) mid-block slab
// with its short ends on the street. Five to four storeys of brick over a limestone base, with calcite piers and belt
// courses framing glass windows, a shopfront and a recessed entrance on the 46th Street (low z) front, a stone cornice
// and a rooftop bulkhead at the rear. Lidar roof is read as three clean tiers (12, 15, 17 blocks), a 4-block lobby
// bay at the entrance, and the four-block gaps (roof 0) filled from their neighbours. Glass sits in the shell with air
// behind it and a floor slab per storey (no interiors). Warm glowstone sits behind some panes and in the shopfront.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1034325.cells.json`, "utf8"));
const X = 5, Y = 20, Z = 23;

const cell = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inFoot = (x, z) => cell.has(`${x},${z}`);

// Lidar roof with the gaps (roof 0: no return) filled from the mean of their footprint neighbours, then snapped to clean tiers.
const tier = (r) => (r >= 16 ? 17 : r >= 14 ? 15 : r >= 10 ? 12 : r);
const raw = (x, z) => (inFoot(x, z) ? cell.get(`${x},${z}`).roof : 0);
const roofOf = new Map();
for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
  if (!inFoot(x, z)) continue;
  let r = raw(x, z);
  if (r === 0) {
    const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dz]) => raw(x + dx, z + dz)).filter((v) => v > 0);
    r = nb.length ? Math.round(nb.reduce((a, b) => a + b, 0) / nb.length) : 12;
  }
  roofOf.set(`${x},${z}`, tier(r));
}
const R = (x, z) => roofOf.get(`${x},${z}`);
const ground = (x, z) => cell.get(`${x},${z}`).ground;

const g = new Voxels([X, Y, Z]);
const shell = (x, z) => x === 0 || x === X - 1 || z === 0 || z === Z - 1;
const frontDoor = (x) => x === 3;                      // the lobby bay with the entrance door, low roof 4
const glowAt = (x, y, z) => ((x * 7 + z * 3 + y * 5) % 9 === 0);   // about one pane in nine

// Per footprint cell: the exterior skin (shell) or the air-and-floors interior, with a fill from y 0 to ground.
for (const [key, { ground: gnd }] of cell) {
  const [x, z] = key.split(",").map(Number);
  const r = R(x, z);
  const top = r >= 7 ? r - 2 : r - 1;                  // first cornice course
  const storeys = Math.max(1, Math.floor((r - 2) / 3));
  for (let y = 0; y < gnd; y++) g.set(x, y, z, "polished_andesite");

  if (!shell(x, z)) {
    // Interior: floor slab at each storey line, roof slab on top, air between (no rooms, no stairs).
    for (let k = 0; k < storeys; k++) g.set(x, 3 * k, z, "smooth_stone");
    g.set(x, r - 1, z, "stone");
    continue;
  }

  // Exterior: which face this cell is on (the street front is z 0; corners take the end face).
  const face = z === 0 ? "N" : z === Z - 1 ? "S" : x === 0 ? "W" : "E";
  const p = face === "N" || face === "S" ? x : z;
  // Brick wall body with 2-wide window bays (glass), limestone pilasters at the bay edges and at the street corners.
  const window = face === "N" || face === "S" ? p === 1 || p === 2 : p % 4 === 1 || p % 4 === 2;
  const pilaster = face === "N" || face === "S" ? p === 0 || p === 4 : p % 4 === 0;

  for (let y = 0; y < r; y++) {
    const k = Math.floor(y / 3), row = y % 3;
    if (y === 0) { g.set(x, y, z, "polished_andesite"); continue; }   // granite base course
    if (y === r - 1) { g.set(x, y, z, "calcite"); continue; }         // coping
    if (r >= 7 && y === r - 2) { g.set(x, y, z, "stone_bricks"); continue; }   // cornice course
    if (y >= top) { g.set(x, y, z, "stone_bricks"); continue; }
    if (row === 0) {                                                  // limestone storey belt course (sills and heads)
      g.set(x, y, z, face === "N" && y === 3 && window ? "dark_oak_planks" : "calcite");
      continue;
    }
    // Window rows (the storey's upper two blocks).
    if (face === "N" && frontDoor(x) && k === 0) {
      g.set(x, y, z, "dark_oak_door", { facing: "north", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (window) { g.set(x, y, z, "glass"); continue; }
    g.set(x, y, z, pilaster ? "calcite" : "bricks");
  }

  // Warm light: glowstone on the air side of some panes (behind the glass, on the interior floor slab).
  for (let y = 1; y < r - 2; y++) {
    if (y % 3 === 0) continue;
    const k = Math.floor(y / 3);
    let ix = x, iz = z;
    if (face === "W") ix = 1; else if (face === "E") ix = X - 2; else if (face === "N") iz = 1; else iz = Z - 2;
    if (!inFoot(ix, iz) || shell(ix, iz)) continue;
    if (!window || !glowAt(x, y, z) || y >= R(ix, iz) - 1) continue;
    if (face === "N" && frontDoor(x) && k === 0) continue;
    g.set(ix, y, iz, "glowstone");
  }
}

// Shopfront: two warm lamps inside the street windows.
g.set(1, 1, 1, "glowstone");
g.set(2, 2, 1, "glowstone");

// Rooftop bulkhead at the rear: a brick box on the 15 and 17 tiers, capped in calcite at 18.
for (let x = 1; x <= 3; x++) for (let z = 18; z <= 20; z++) {
  for (let y = R(x, z); y <= 17; y++) g.set(x, y, z, "bricks");
  g.set(x, 18, z, "calcite");
}

const stats = g.save(`${DIR}/NYC1034325.nbt`);
console.log(JSON.stringify(stats));
