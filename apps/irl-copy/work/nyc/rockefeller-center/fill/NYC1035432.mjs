// 3 East 48 Street, 1920 mixed residential and commercial building: a seven-storey (21-block) red-brick block with
// limestone bands and quoins on a polished-granite base. The 48th Street face (low z = north) has a shopfront with a
// central door, the rear (high z) has windows and a service door. Roof: the main tier is 21 blocks; the lidar's 25-block
// tier is read as two clean volumes, a mechanical penthouse set in at the rear-west (x 1-4, z 6-8) and a stair bulkhead on
// the west party wall (x 0, z 14-16); lidar noise (roof under 12, the front row and the west edge) takes the main height.
// A wooden water tank stands on iron posts on the east roof. Walls are one block thick with air behind the glass and a
// floor slab at each storey line and under the roof (no interiors). Warm glowstone sits behind some panes.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1035432.cells.json`, "utf8"));
const X = 7, Y = 26, Z = 19;
const MAIN = 21, TOP = 25;     // roof tiers (block heights above y 0): the main block and the penthouse/bulkhead
const CAP = MAIN - 1;          // the parapet course and the roof deck under it
const FLOORS = [3, 6, 9, 12, 15, 18];   // storey lines: a limestone band on the outside, a floor slab inside

const cell = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const cols = cells.map(([x, z]) => [x, z]);
const inFoot = (x, z) => cell.has(`${x},${z}`);
const inRect = (x, z, x0, x1, z0, z1) => x >= x0 && x <= x1 && z >= z0 && z <= z1;
// Tiers from the lidar: its 23-25 block returns are the penthouse rectangle (x 1-4, z 6-8, whose (1, 8) return is a gap)
// and the three-cell bulkhead on the west edge; everything else reads as the main roof.
const roofAt = (x, z) => {
  if (!inFoot(x, z)) return 0;
  return inRect(x, z, 1, 4, 6, 8) || (x === 0 && z >= 14 && z <= 16) ? TOP : MAIN;
};
const perimeter = (x, z) => x === 0 || x === 6 || z === 0 || z === 18;

// Panes: along x on the street and rear faces, along z on the side walls. Each pane meets its neighbours and frame.
const PANE_X = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };
const PANE_Z = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const paneFor = (axisX) => ({ block: "glass_pane", state: axisX ? PANE_X : PANE_Z });
const lit = (x, y, z) => g.set(x, y, z, "glowstone");

const g = new Voxels([X, Y, Z]);

// 1. Interior: foundation from y 0 under every cell, then a floor slab at each storey line and the roof deck, air between.
for (const [x, z] of cols) {
  g.set(x, 0, z, "stone_bricks");
  if (perimeter(x, z)) continue;
  for (const f of FLOORS) g.set(x, f, z, "smooth_stone");
  g.set(x, CAP, z, "smooth_stone");
}

// 2. Outer shell, one block thick on the footprint's edge: polished-granite base, a limestone band at every storey line,
// a calcite parapet on top. Window rows are the other rows; the 7-block faces get four window bays, piers at the corners
// and a brick mullion in the middle. The street face has a shopfront and a door, the rear a service door.
const shell = (x, y, z) => {
  if (y === 0) return { block: "polished_granite" };
  if (y === CAP) return { block: "calcite" };
  if (y % 3 === 0) return { block: "calcite" };
  const front = z === 0, rear = z === 18, ground = y < 3;
  if (front || rear) {
    const bay = [1, 2, 4, 5].includes(x);
    if (front && ground) {
      if (x === 3) return { block: "dark_oak_door", state: { facing: "north", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" } };
      if (x === 1 || x === 5) return { block: "dark_oak_planks" };
      if (x === 0 || x === 6) return { block: "polished_granite" };
      return paneFor(true);                                   // shop glass at x 2 and 4
    }
    if (rear && ground && x === 3) return { block: "oak_door", state: { facing: "south", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" } };
    if (x === 0 || x === 6) return { block: front ? "calcite" : "bricks" };   // limestone quoins on the street face
    if (bay) return paneFor(true);
    return { block: "bricks" };                                  // the mullion
  }
  // Side walls: brick (the neighbours stand close), with window pairs down the length, lit-court style, so they don't read as blank.
  if (ground || ![3, 4, 7, 8, 11, 12, 15, 16].includes(z)) return { block: "bricks" };
  return paneFor(false);
};
for (const [x, z] of cols) {
  if (!perimeter(x, z)) continue;
  for (let y = 0; y <= CAP; y++) {
    const el = shell(x, y, z);
    g.set(x, y, z, el.block, el.state);
  }
}

// 3. Warm light behind some panes (inside, one block back, resting on the floor slab): the shop, then a few upper windows
// on the street face and the rear.
lit(2, 1, 1); lit(4, 1, 1);
FLOORS.forEach((f, i) => {
  const s = i + 1;
  for (const x of [1, 2, 4, 5]) {
    if ((s * 2 + x) % 4 === 0) lit(x, f + 1, 1);
    if ((s + x) % 3 === 0) lit(x, f + 1, 17);
  }
});

// 4. Penthouse, set in from the street at the rear-west: a brick box with a band at its foot and a calcite cap, panes on
// its four faces, air inside with the roof deck under it.
for (let x = 1; x <= 4; x++) for (let z = 6; z <= 8; z++) {
  const edge = x === 1 || x === 4 || z === 6 || z === 8;
  g.set(x, 24, z, edge ? "calcite" : "smooth_stone");
  if (!edge) continue;
  g.set(x, 21, z, "calcite");
  for (const y of [22, 23]) {
    const pane = (z === 6 || z === 8) ? (x === 2 || x === 3) : (z === 7);
    if (!pane) { g.set(x, y, z, "bricks"); continue; }
    const p = paneFor(z === 6 || z === 8);
    g.set(x, y, z, p.block, p.state);
  }
}

// 5. Stair bulkhead on the west party wall: a solid brick block with a calcite band and cap.
for (let z = 14; z <= 16; z++) {
  g.set(0, 21, z, "calcite");
  g.set(0, 22, z, "bricks");
  g.set(0, 23, z, "bricks");
  g.set(0, 24, z, "calcite");
}

// 6. Water tank on iron posts on the east roof (the wooden tanks that sit on most of these roofs).
for (const [x, z] of [[5, 10], [6, 10], [5, 11], [6, 11]]) g.set(x, 21, z, "iron_bars", { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" });
for (let y = 22; y <= 24; y++) for (const [x, z] of [[5, 10], [6, 10], [5, 11], [6, 11]]) g.set(x, y, z, "spruce_planks");
for (const [x, z] of [[5, 10], [6, 10], [5, 11], [6, 11]]) g.set(x, 25, z, "spruce_slab", { type: "bottom", waterlogged: "false" });

g.save(`${DIR}/NYC1035432.nbt`);
console.log("wrote", `${DIR}/NYC1035432.nbt`, "blocks", g.count());
