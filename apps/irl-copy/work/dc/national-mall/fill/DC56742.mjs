import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 1630 R St NW: a 1920s brick apartment block with limestone trim (Dupont Circle). Lidar roofs snap to four clean tiers:
// 4 = one storey, 6 = two, 8 = two plus an attic course, 12 = the four-storey corner tower. Storeys are 3 blocks:
// plinth (y0), window row, string course, window row, string course, ... cap on the top layer.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC56742.cells.json`, "utf8"));
const tier = (v) => (v <= 4 ? 4 : v <= 6 ? 6 : v <= 10 ? 8 : 12);
const fp = new Map();
for (const [x, z, ground, roof] of cells) fp.set(`${x},${z}`, { ground, roof: tier(roof) });
const at = (x, z) => fp.get(`${x},${z}`);

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
// the sides of a cell that face outside the building (no footprint beside it, or a lower roof beside it at this layer)
const exposed = (x, z, y) => Object.keys(DIRS).filter((k) => { const [dx, dz] = DIRS[k]; const n = at(x + dx, z + dz); return !n || n.roof <= y; });
// pier columns every third block along a face (absolute, so the bays line up from face to face)
const pier = (k, x, z) => ((k === "N" || k === "S" ? x : z) % 3 === 0);

const g = new Voxels([15, 24, 12]);
const windows = new Set();
const key = (x, y, z) => `${x},${y},${z}`;

for (const [k, c] of fp) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < c.ground; y++) g.set(x, y, z, "stone_bricks");       // foundation under a sloping lot (none here: ground is 0)
  for (let y = c.ground; y < c.roof; y++) {
    const sides = exposed(x, z, y);
    if (sides.length) {
      if (y === 0) g.set(x, y, z, "stone_bricks");                        // base course
      else if (y === c.roof - 1 || y % 3 === 2) g.set(x, y, z, "calcite"); // string courses and the cornice cap
      else if (sides.some((s) => pier(s, x, z))) g.set(x, y, z, "bricks"); // brick piers between the bays
      else { g.set(x, y, z, "glass_pane"); windows.add(key(x, y, z)); }     // glass in the bays
    } else if (y === 0 || y === c.roof - 1 || y % 3 === 2) {
      g.set(x, y, z, "stone");                                             // floor slabs and the roof deck; the air between is the gap behind the glass
    }
  }
}

// entrance on the north face: dark oak door, stone pilasters, calcite lintel (a projecting canopy would sit outside the footprint)
g.set(6, 1, 0, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(6, 2, 0, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
for (const x of [5, 7]) for (const y of [1, 2]) g.set(x, y, 0, "stone_bricks");
for (const x of [5, 6, 7]) { g.set(x, 3, 0, "calcite"); windows.delete(key(x, 3, 0)); }

// penthouse on the corner tower roof (layers 12-13), with two glass panes facing south
for (let x = 9; x <= 12; x++) for (let z = 0; z <= 1; z++) { g.set(x, 12, z, "bricks"); g.set(x, 13, z, "calcite"); }
for (const x of [10, 11]) { g.set(x, 12, 1, "glass_pane"); windows.add(key(x, 12, 1)); }

// roof plant on the lower wing
g.set(1, 4, 9, "iron_block"); g.set(2, 4, 9, "iron_block");

// warm lanterns standing on the floor behind some ground-storey-row windows (one in four)
for (const k of windows) {
  const [x, y, z] = k.split(",").map(Number);
  if (y !== 1 && y % 3 !== 0) continue;               // lowest window row of each storey (floors at 0, 2, 5, 8)
  const fp1 = fp.get(`${x},${z}`); if (!fp1) continue;
  const sides = exposed(x, z, y); if (sides.length !== 1) continue;
  const [dx, dz] = DIRS[sides[0]];
  const ix = x - dx, iz = z - dz;                     // the cell inside, behind the glass
  if (!at(ix, iz) || exposed(ix, iz, y).length) continue;
  if ((x + z + y) % 4 !== 0) continue;
  g.set(ix, y, iz, "lantern", { hanging: "false", waterlogged: "false" });
}

// glass panes connect to the pane or wall beside them, so each bay reads as a framed window
for (const k of windows) {
  const [x, y, z] = k.split(",").map(Number);
  const conn = (dx, dz) => g.get(x + dx, y, z + dz) !== null;
  g.set(x, y, z, "glass_pane", {
    north: String(conn(0, -1)), south: String(conn(0, 1)), west: String(conn(-1, 0)), east: String(conn(1, 0)), waterlogged: "false",
  });
}

const stats = g.save(`${DIR}/DC56742.nbt`);
console.log(JSON.stringify(stats));
