// DC77376: a 6 x 4 block corner brick commercial block, late 19th century: red brick walls, quartz strings and
// quoins, a 3-storey corner tower (x 5) over a 2-storey street front, a one-storey lower wing at the back (z 3).
// Footprint cells only; each cell's ground is its own foundation, roofs step to the lidar heights.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC77376.cells.json`, "utf8"));

const W = 6, D = 4, H = 19;
const col = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inF = (x, z) => col.has(`${x},${z}`);

const WALL = "bricks", BASE = "stone_bricks", TRIM = "smooth_quartz", ROOF = "smooth_stone", PANE = "glass_pane";
const plan = new Map();                                 // "x,y,z" -> { block, state }
const key = (x, y, z) => `${x},${y},${z}`;
const put = (x, y, z, block, state) => plan.set(key(x, y, z), { block, state });
const nonAir = (x, y, z) => plan.has(key(x, y, z));
const paneState = (n, e, s, w) => ({ north: String(n), east: String(e), south: String(s), west: String(w), waterlogged: "false" });

for (const [k, { ground: b, roof }] of col) {
  const [x, z] = k.split(",").map(Number);
  const t = roof - 1;                                   // the top course: the lidar roof surface is roof
  const missX = !inF(x - 1, z) || !inF(x + 1, z);
  const missZ = !inF(x, z - 1) || !inF(x, z + 1);
  const perim = missX || missZ, corner = missX && missZ;

  for (let y = 0; y <= t; y++) {
    if (y === 0 || y < b) { put(x, y, z, BASE); continue; }       // foundation under every cell
    if (!perim) {                                                // interior: floors and roof, air between
      if (y === t) put(x, y, z, ROOF);
      else if (y === 2 && (z === 1 || (z === 2 && x === 1))) put(x, y, z, ROOF);
      else if (y === 3 && z === 2) put(x, y, z, ROOF);           // deck under the back wing's roof
      continue;
    }
    if (y === b) { put(x, y, z, BASE); continue; }              // base course
    if (y === t) { put(x, y, z, TRIM); continue; }              // cornice
    if (z === 0 && x === 2 && (y === 1 || y === 2)) {           // entrance
      put(x, y, z, "dark_oak_door", { facing: "south", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (corner) { put(x, y, z, TRIM); continue; }               // quoins
    if ((y - b) % 2 === 1) put(x, y, z, PANE, paneState(0, 0, 0, 0));   // window
    else put(x, y, z, WALL);                                    // brick between the window rows
  }
}

// Panes join their neighbours in the plane of their wall (brick, quartz or pane), so a window grid reads as glazing.
for (const [k, p] of [...plan]) {
  if (p.block !== PANE) continue;
  const [x, y, z] = k.split(",").map(Number);
  const frontBack = !inF(x, z - 1) || !inF(x, z + 1);   // a front or back wall runs along x
  plan.set(k, { block: PANE, state: frontBack
    ? paneState(0, nonAir(x + 1, y, z), 0, nonAir(x - 1, y, z))
    : paneState(nonAir(x, y, z - 1), 0, nonAir(x, y, z + 1), 0) });
}

// Warm light behind some glass, in the air gap inside the wall.
const lamps = [[1, 1, 1, "glowstone"], [4, 1, 1, "glowstone"], [4, 1, 2, "shroomlight"], [2, 3, 1, "glowstone"], [3, 3, 1, "glowstone"]];
for (const [x, y, z, block] of lamps) put(x, y, z, block);

// Roof plant: a brick flue on the wing roof.
put(2, 5, 2, WALL); put(2, 6, 2, WALL);

const g = new Voxels([W, H, D]);
for (const [k, { block, state }] of plan) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, block, state);
}
console.log(g.save(`${DIR}/DC77376.nbt`));
