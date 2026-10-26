import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// A 4 x 12 block of red brick and pale limestone on the Federal Triangle / Pennsylvania Avenue model: a 1900s-1930s
// commercial row with a granite-and-limestone base, a two-storey shopfront-and-office body (roof 5), a one-storey
// shop wing on the west (roof 4), a three-storey corner tower on the east (roof 6), and a low terrace at grade on the
// south-west (roof 1). Lidar tiers are kept; the two lone noise cells are smoothed (3,0) to 5 and (3,10) to 5.
// Shell and interior: walls are one block thick on every exposed face, glass panes sit in the wall with air behind,
// and floor slabs sit at each storey line. Brick is the wall; limestone is only the base course, quoins, lintel
// and cornice. The entrance is on the north face at x 1; warm lamps sit behind some glass.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC56511.cells.json`, "utf8"));

const W = 4, H = 17, D = 12;
const v = new Voxels([W, H, D]);

const SMOOTH = { "3,0": 5, "3,10": 5 };
const B = new Map();                                 // "x,z" -> { g: ground, t: roof top (solid below t) }
for (const [x, z, g, r] of cells) B.set(`${x},${z}`, { g, t: SMOOTH[`${x},${z}`] ?? r });
const cellAt = (x, z) => B.get(`${x},${z}`);
const OUT = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const IN = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };

// Air at (x, y, z): outside the footprint, or above that cell's roof top
const air = (x, z, y) => { const c = cellAt(x, z); return !c || y >= c.t; };
const exposed = (x, y, z) => Object.keys(OUT).filter((d) => air(x + OUT[d][0], z + OUT[d][1], y));

const FOUND = "stone_bricks", BRICK = "bricks", TRIM = "calcite", ROOF = "stone", FLOOR = "smooth_stone";
const doorState = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
const paneState = (d) => (d === "N" || d === "S"
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });

// Foundation: solid from y 0 up to each cell's ground, so nothing floats on the slope
for (const [key, { g }] of B) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < g; y++) v.set(x, y, z, FOUND);
}

// Walls, floors and roofs, storey by storey, from each cell's ground up to its roof top
for (const [key, { g, t }] of B) {
  const [x, z] = key.split(",").map(Number);
  for (let y = g; y < t; y++) {
    const top = y === t - 1, ex = exposed(x, y, z);
    if (!ex.length) {                                   // interior: air, with a floor slab at each storey line
      if (top) v.set(x, y, z, ROOF);
      else if ((y - g) % 2 === 1 || (g === 0 && y === 0)) v.set(x, y, z, FLOOR);
      continue;
    }
    if (top || g === 0 && y === 0) { v.set(x, y, z, TRIM); continue; }     // cornice; plinth on a downhill cell
    // a quoin is where two faces meet the open air beyond the footprint (not the terrace beside it)
    const beyond = (d) => !cellAt(x + OUT[d][0], z + OUT[d][1]);
    const corner = ex.some((d) => beyond(d) && (d === "N" || d === "S")) && ex.some((d) => beyond(d) && (d === "W" || d === "E"));
    if (corner) { v.set(x, y, z, TRIM); continue; }                          // quoins
    const d = ex[0], idx = d === "N" || d === "S" ? x : z;
    if (d === "N" && x === 1 && z === 0) {                                   // the entrance: door, then a lintel
      if (y === g) v.set(x, y, z, "dark_oak_door", doorState("lower"));
      else if (y === g + 1) v.set(x, y, z, "dark_oak_door", doorState("upper"));
      else v.set(x, y, z, TRIM);
      continue;
    }
    if (idx % 2 === 0) v.set(x, y, z, "glass_pane", paneState(d));          // a window bay
    else v.set(x, y, z, y === g ? TRIM : BRICK);                             // a pier: brick on a stone base course
  }
}

// Warm light: behind some ground-storey and upper windows, in the room inside the glass
for (const [key, { g, t }] of B) {
  const [x, z] = key.split(",").map(Number);
  for (let y = g; y < t - 1; y++) {
    const ex = exposed(x, y, z);
    if (ex.length !== 1 || (y - g) % 2 === 1) continue;
    const d = ex[0], idx = d === "N" || d === "S" ? x : z;
    if (idx % 2 !== 0 || (d === "N" && x === 1 && z === 0)) continue;     // windows only, not the door
    const ic = cellAt(x + IN[d][0], z + IN[d][1]);
    if (!ic || y < ic.g || y >= ic.t - 1 || (y - ic.g) % 2 !== 0 || (ic.g === 0 && y === 0)) continue;
    const ix = x + IN[d][0], iz = z + IN[d][1];
    if (((x + z + y) % 5) !== 0) continue;
    if (y === g) v.set(ix, y, iz, "lantern", { hanging: "false", waterlogged: "false" });
    else v.set(ix, y, iz, "glowstone");
  }
}

// Roof equipment: an HVAC box on the west wing, a lantern finial on the corner tower
v.set(0, 4, 5, "oxidized_copper");
v.set(3, 6, 3, "lantern", { hanging: "false", waterlogged: "false" });

const out = `${DIR}/DC56511.nbt`;
const r = v.save(out);
console.log(JSON.stringify({ out, ...r }));
