// 1301 15th St NW: a 1920s-style brick residential apartment block with an elevator, on the lidar footprint.
// Brick walls, stone plinth and string courses, a cornice; a hollow shell (air behind the glass, a floor slab per
// storey, no interior fit-out); a central entrance on the 15th Street (west) face; a stepped tower on the middle of
// the block with setbacks down to the wings; HVAC boxes on the roofs.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC86765.cells.json", "utf8"));   // [x, z, ground, roof] per footprint cell, x 0..16, z 0..26

const key = (x, z) => `${x},${z}`;
const fp = new Map();                                                    // "x,z" -> { g: ground, r: roof height above y 0 }
for (const [x, z, g, r] of cells) fp.set(key(x, z), { g, r });
const inside = (x, z) => fp.has(key(x, z));

// Lidar noise into flat tiers: a cell takes its neighbours' roof height when three of the five cells (itself and its four
// neighbours) agree on another height.
const roof = new Map();
for (const [k, c] of fp) {
  const [x, z] = k.split(",").map(Number), votes = new Map();
  for (const [dx, dz] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) { const n = fp.get(key(x + dx, z + dz)); if (n) votes.set(n.r, (votes.get(n.r) || 0) + 1); }
  let best = c.r, n = 0; for (const [r, v] of votes) if (v > n) { best = r; n = v; }
  roof.set(k, n >= 3 ? best : c.r);
}

// The street faces: which sides of a cell are open to the air (outside the footprint), in N, S, W, E order.
const faces = (x, z) => [["N", !inside(x, z - 1)], ["S", !inside(x, z + 1)], ["W", !inside(x - 1, z)], ["E", !inside(x + 1, z)]]
  .filter(([, open]) => open).map(([f]) => f);
const winIndex = (x, z, face) => (face === "N" || face === "S" ? x : z);   // position along the face
const winBay = (x, z, ex) => ex.length === 1 && winIndex(x, z, ex[0]) % 3 !== 0;   // two glass bays, then a brick pier
// The west (15th Street) entrance: one door cell with brick piers either side and a stone lintel over.
const DOOR = { x: 0, z: 14 }, inDoorZone = (x, z) => x === 0 && z >= 13 && z <= 15;

const g = new Voxels([17, 25, 27]);
const floorAt = (base, cap, y) => y === base || (y > base && (y - base) % 3 === 0 && y + 2 <= cap);   // floor slabs every 3 blocks
const perimeterCells = [];

// Pass 1: each footprint cell as a column: foundation below its ground, a plinth and floor slabs, brick walls with glass
// bays on the open faces (air behind the glass), a cornice at the roof. Corners get quoins.
for (const [k, c] of fp) {
  const [x, z] = k.split(",").map(Number), base = c.g, cap = roof.get(k) - 1;
  const ex = faces(x, z), per = ex.length > 0, corner = ex.length > 1;
  if (per) perimeterCells.push([x, z, base, cap, ex]);
  for (let y = 0; y < base; y++) g.set(x, y, z, "polished_granite");                // foundation: nothing floats on a slope
  for (let y = base; y <= cap; y++) {
    if (y === cap) { g.set(x, y, z, per ? "stone_bricks" : "stone"); continue; }     // cornice / flat roof
    if (y === base) { g.set(x, y, z, per ? "stone_bricks" : "smooth_stone"); continue; }   // plinth course / ground slab
    if (floorAt(base, cap, y)) { g.set(x, y, z, "smooth_stone"); continue; }         // storey string course and slab
    if (!per) continue;                                                              // interior air
    if (x === DOOR.x && inDoorZone(x, z) && y === base + 2) { g.set(x, y, z, "stone_bricks"); continue; }   // door lintel
    if (inDoorZone(x, z) && ex.length === 1 && ex[0] === "W") { g.set(x, y, z, "bricks"); continue; }   // pilasters
    if (corner) { g.set(x, y, z, (y - base) % 2 ? "bricks" : "stone_bricks"); continue; }   // quoins
    if (winBay(x, z, ex)) g.set(x, y, z, "glass_pane"); else g.set(x, y, z, "bricks");
  }
}

// The entrance: a dark oak door, lower and upper halves, in the 15th Street wall.
const dbase = fp.get(key(DOOR.x, DOOR.z)).g;
const door = { facing: "west", hinge: "left", open: "false", powered: "false" };
g.set(DOOR.x, dbase, DOOR.z, "dark_oak_door", { ...door, half: "lower" });
g.set(DOOR.x, dbase + 1, DOOR.z, "dark_oak_door", { ...door, half: "upper" });

// Pass 2: panes connect to their neighbours in the wall plane (glass or solid), so the bays read as continuous frames.
const solid = (x, y, z) => g.get(x, y, z) !== null;
for (const [x, z, base, cap, ex] of perimeterCells) {
  if (ex.length !== 1) continue;
  const face = ex[0];
  for (let y = base + 1; y < cap; y++) {
    if (g.get(x, y, z)?.block !== "glass_pane") continue;
    const along = face === "N" || face === "S"
      ? { east: solid(x + 1, y, z), west: solid(x - 1, y, z) }
      : { north: solid(x, y, z - 1), south: solid(x, y, z + 1) };
    const st = { north: "false", east: "false", south: "false", west: "false" };
    for (const [d, on] of Object.entries(along)) st[d] = on ? "true" : "false";
    g.set(x, y, z, "glass_pane", st);
  }
}

// Warm light in some windows: a glowstone just inside the glass, standing on the storey's floor slab.
for (const [x, z, base, cap, ex] of perimeterCells) {
  if (ex.length !== 1 || !winBay(x, z, ex) || winIndex(x, z, ex[0]) % 9 !== 1) continue;
  const [ix, iz] = { N: [x, z + 1], S: [x, z - 1], W: [x + 1, z], E: [x - 1, z] }[ex[0]];
  if (!inside(ix, iz) || faces(ix, iz).length) continue;                         // only a true interior cell
  for (let y = base + 1; y < cap; y++) if (floorAt(base, cap, y - 1) && !floorAt(base, cap, y)) g.set(ix, y, iz, "glowstone");
}

// Roof equipment: HVAC boxes standing on the roofs (on the cornice's level), a few on each tier.
for (const [k, c] of fp) {
  const [x, z] = k.split(",").map(Number), cap = roof.get(k) - 1;
  if (faces(x, z).length || cap < 10) continue;
  if ((x * 7 + z * 3) % 13 === 0) g.set(x, cap + 1, z, "stone_bricks");
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC86765.nbt");
