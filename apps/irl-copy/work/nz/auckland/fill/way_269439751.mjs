// Way 269439751, Mt Eden: a three-part interwar brick flats block (1930s, Auckland's walk-up apartment type). The lidar
// roof is one flat tier at 10 blocks over the lowest ground, so the block is a red-brick shell on a stone plinth with
// cream Art Deco bands (sill, head, cornice), two storeys of glazed bays and a brick parapet on a flat roof. The
// slope runs down to +z, so the downhill side shows the plinth and the ground storey and the uphill side starts at
// the second storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_269439751.cells.json", "utf8"));   // [x, z, ground, roof] per footprint cell, x 0..24, z 0..46

const key = (x, z) => `${x},${z}`;
const foot = new Map(cells.map(([x, z, ground, roof]) => [key(x, z), { ground, roof }]));
const inF = (x, z) => foot.has(key(x, z));
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
// the faces of a footprint cell that look out (its neighbour is not footprint)
const faces = (x, z) => Object.entries(DIRS).filter(([, [dx, dz]]) => !inF(x + dx, z + dz)).map(([d]) => d);
const isRing = (x, z) => faces(x, z).length > 0;
const isInt = (x, z) => inF(x, z) && !isRing(x, z);

// the lidar roof reads 10 over most of the footprint, 9 along the eaves and a few noise cells (1, 6): one flat tier
const roofs = cells.map(([, , , r]) => r).sort((a, b) => a - b);
const TOP = roofs[roofs.length >> 1];

const FOUND = "stone_bricks", WALL = "bricks", TRIM = "smooth_quartz", FLOOR = "smooth_stone", ROOF = "gray_concrete";

const xs = cells.map(([x]) => x), zs = cells.map(([, z]) => z);
const minX = Math.min(...xs), maxX = Math.max(...xs), minZ = Math.min(...zs), zMax = Math.max(...zs);
// the entrance: the middle of the outer cells on the downhill (+z) face at the lowest edge
const southRing = cells.filter(([x, z]) => z === zMax && faces(x, z).includes("S")).map(([x]) => x).sort((a, b) => a - b);
const DOOR = [southRing[southRing.length >> 1], zMax];

const g = new Voxels([25, 23, 47]);
const panes = new Map();     // "x,y,z" -> the face the pane looks out of
const glows = [];

for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const { ground } = foot.get(key(x, z));
  // quoins mark the bounding-box corners only: on the stepped diagonal every cell has two faces, and quoining them all
  // would leave the diagonal walls blank
  const f = faces(x, z), edge = f.length > 0;
  const quoin = f.length >= 2 && (x === minX || x === maxX) && (z === minZ || z === zMax);
  for (let y = 0; y < TOP; y++) {
    if (y < ground) { g.set(x, y, z, FOUND); continue; }                       // foundation: solid from y 0 up to the ground
    if (!edge) {                                                               // no interiors: floor slabs and the roof deck only
      if (y === 0 || y === 4) g.set(x, y, z, FLOOR);
      else if (y === TOP - 2) g.set(x, y, z, ROOF);
      continue;
    }
    if (DOOR[0] === x && DOOR[1] === z && (y === 1 || y === 2)) continue;     // the door is set below
    if (y === 0) { g.set(x, y, z, FOUND); continue; }                          // base course
    if (y === 3 || y === 4 || y === 7 || y === 8) { g.set(x, y, z, TRIM); continue; }   // head, sill, string course, cornice
    if (y === TOP - 1) { g.set(x, y, z, quoin ? TRIM : WALL); continue; }      // parapet cap
    if (quoin) { g.set(x, y, z, TRIM); continue; }                             // corner quoins
    const face = f[0], bay = face === "N" || face === "S" ? x : z;
    if ([1, 2].includes(bay % 4)) {                                            // glazed bay: two panes, two brick piers
      g.set(x, y, z, "glass_pane", { east: "false", north: "false", south: "false", west: "false", waterlogged: "false" });
      panes.set(`${x},${y},${z}`, face);
      if (y === 5 && bay % 8 === 1) {                                          // a warm light in the air gap behind some glass
        const [dx, dz] = DIRS[face], ix = x - dx, iz = z - dz;
        if (isInt(ix, iz)) glows.push([ix, 5, iz]);
      }
    } else g.set(x, y, z, WALL);
  }
}

// the door, with a stone surround on the sides and a lintel above
g.set(DOOR[0], 1, DOOR[1], "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(DOOR[0], 2, DOOR[1], "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
for (const y of [1, 2]) for (const dx of [-1, 1]) g.set(DOOR[0] + dx, y, DOOR[1], TRIM);

for (const [x, y, z] of glows) g.set(x, y, z, "glowstone");

// glass panes connect to their neighbours in their plane, as a frame of panes does
for (const [k, face] of panes) {
  const [x, y, z] = k.split(",").map(Number);
  const side = face === "N" || face === "S";      // a pane on a z-facing wall runs along x
  const a = side ? [x - 1, y, z] : [x, y, z - 1], b = side ? [x + 1, y, z] : [x, y, z + 1];
  const ca = g.get(...a) !== null, cb = g.get(...b) !== null;
  const st = side
    ? { east: String(cb), west: String(ca), north: "false", south: "false" }
    : { north: String(ca), south: String(cb), east: "false", west: "false" };
  g.set(x, y, z, "glass_pane", { ...st, waterlogged: "false" });
}

// roof: a stair head near the middle of the roof and two plant units, all on the roof deck
const interior = cells.filter(([x, z]) => isInt(x, z));
const cx = xs.reduce((a, b) => a + b, 0) / xs.length, cz = zs.reduce((a, b) => a + b, 0) / zs.length;
const block3 = (x, z) => [-1, 0, 1].every((i) => [-1, 0, 1].every((j) => isInt(x + i, z + j)));
const block2 = (x, z) => [0, 1].every((i) => [0, 1].every((j) => isInt(x + i, z + j)));
const dist = (x, z) => Math.hypot(x - cx, z - cz);
const head = interior.filter(([x, z]) => block3(x, z)).sort((a, b) => dist(a[0], a[1]) - dist(b[0], b[1]))[0];
if (head) {
  for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) {
    g.set(head[0] + i, TOP - 1, head[1] + j, WALL);
    g.set(head[0] + i, TOP, head[1] + j, TRIM);
  }
}
const plant = interior.filter(([x, z]) => block2(x, z) && (!head || Math.abs(x - head[0]) + Math.abs(z - head[1]) > 5))
  .sort((a, b) => dist(a[0], a[1]) - dist(b[0], b[1]));
const units = [];
for (const [x, z] of plant) {
  if (units.length === 2) break;
  if (units.some(([ux, uz]) => Math.abs(ux - x) + Math.abs(uz - z) < 6)) continue;
  units.push([x, z]);
  for (const [i, j] of [[0, 0], [1, 0], [0, 1], [1, 1]]) g.set(x + i, TOP - 1, z + j, FLOOR);
}

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_269439751.nbt";
const { blocks, palette } = g.save(out);
console.log(JSON.stringify({ top: TOP, door: DOOR, panes: panes.size, glowstone: glows.length, stairHead: head ? [head[0], head[1]] : null, plantUnits: units, blocks, palette }));
