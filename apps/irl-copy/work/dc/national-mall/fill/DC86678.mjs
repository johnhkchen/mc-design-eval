// The University Club of Washington, D.C. (1135 16th St NW): a 17 x 17 masonry clubhouse in the Classical Revival
// manner of downtown Washington, about 13 blocks to the roof of its tower. Walls are pale calcite (limestone), the
// base course and foundation dark stone brick, the storey lines and cornice smooth quartz, and the parapet stone brick
// wall. Lidar roof heights are median-smoothed, then snapped to four flat tiers (4, 7, 11, 13) so the massing steps
// back as it rises: a low portico on the 16th Street side, a main body, and a tower in the middle of the plan.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC86678.cells.json`, "utf8"));
const OUT = `${DIR}/DC86678.nbt`;

const W = 17, H = 25;
const FLOORS = [0, 4, 7, 10];                     // storey slabs (interior floors and exterior storey lines)
const key = (x, z) => `${x},${z}`;
const base = new Map();                           // footprint cell -> { g, r }
for (const [x, z, g, r] of cells) base.set(key(x, z), { g, r });
const has = (x, z) => base.has(key(x, z));

// Roof: 3x3 median of the lidar heights, then snapped to the nearest flat tier.
const tierOf = (r) => (r <= 5 ? 4 : r <= 9 ? 7 : r <= 12 ? 11 : 13);
const T = new Map(), G = new Map();
for (const [k, { g, r }] of base) {
  const [x, z] = k.split(",").map(Number);
  const vals = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (has(x + dx, z + dz)) vals.push(base.get(key(x + dx, z + dz)).r);
  vals.sort((a, b) => a - b);
  T.set(k, tierOf(vals[Math.floor(vals.length / 2)]));
  G.set(k, g);
}
const tAt = (x, z) => T.get(key(x, z));
const gAt = (x, z) => G.get(key(x, z));

// Outward directions: the neighbour that is missing from the footprint, or lower, leaves this cell's face exposed.
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const exposed = (x, z) => Object.entries(DIRS).filter(([, [dx, dz]]) => !has(x + dx, z + dz) || tAt(x + dx, z + dz) < tAt(x, z)).map(([d]) => d);
const shell = new Map();
for (const k of T.keys()) { const [x, z] = k.split(",").map(Number); shell.set(k, exposed(x, z)); }

// The output: a map of "x,y,z" -> { block, state, face } so panes can read their neighbours before the file is written.
const out = new Map();
const put = (x, y, z, block, state, face) => out.set(`${x},${y},${z}`, { block, state, face });
const get = (x, y, z) => out.get(`${x},${y},${z}`);

// Which cell's face a window goes in: a cell with a single exposed face, not a corner, and a room behind it.
const WINDOW_BAND = (f, t) => [f + 1, f + 2].filter((y) => y < t - 2);
const PIER = 3;                                    // a pier every third cell along a face

for (const [k, t] of T) {
  const [x, z] = k.split(",").map(Number), g = gAt(x, z);
  for (let y = 0; y < g; y++) put(x, y, z, "stone_bricks");          // foundation: nothing floats on a slope
  const faces = shell.get(k);
  if (faces.length) {
    // Exterior shell: a solid column from its ground to its tier top.
    for (let y = g; y < t; y++) {
      let block = "calcite";
      if (y === g) block = "stone_bricks";                             // base course
      else if (y === t - 1) block = "stone_brick_wall";                // parapet
      else if (y === t - 2 || FLOORS.includes(y)) block = "smooth_quartz";  // cornice and storey lines
      put(x, y, z, block);
    }
    // Window grid: an exposed face with a room behind it (an interior, non-shell cell), off the piers.
    const d = faces.find((f) => {
      const [dx, dz] = DIRS[f], ix = x - dx, iz = z - dz;
      return has(ix, iz) && !shell.get(key(ix, iz)).length && tAt(ix, iz) > g;
    });
    if (d) {
      const [dx, dz] = DIRS[d];
      const along = d === "N" || d === "S" ? x : z;
      if (along % PIER !== 0) {
        for (const f of FLOORS) {
          if (f >= t - 1) continue;
          for (const y of WINDOW_BAND(f, t)) {
            if (y <= g) continue;
            put(x, y, z, "glass_pane", null, d);
          }
        }
      }
    }
  } else {
    // Interior: a floor slab per storey, a roof slab on top, air between; no fill behind the glass.
    for (const f of FLOORS) if (f < t - 1) put(x, f, z, "smooth_stone");
    put(x, t - 1, z, "smooth_stone");
  }
}

// Doors on the 16th Street side: the portico's centre cell, with its room behind.
const [dxk, dzk] = [9, 0];
put(dxk, 1, dzk, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
put(dxk, 2, dzk, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
put(dxk, 3, dzk, "stone_brick_wall");
put(8, 3, 0, "smooth_quartz"); put(10, 3, 0, "smooth_quartz");

// Warm light: glowstone standing on a floor slab just behind some windows; one hanging lantern in the entrance hall.
for (const [k, v] of [...out]) {
  if (v.block !== "glass_pane") continue;
  const [x, y, z] = k.split(",").map(Number);
  const [dx, dz] = DIRS[v.face];
  const ix = x - dx, iz = z - dz, fl = FLOORS.filter((f) => f < y).pop();
  if (fl !== undefined && y === fl + 1 && (x * 7 + y * 3 + z * 5) % 11 === 0 && !get(ix, y, iz)) put(ix, y, iz, "glowstone");
}
put(9, 3, 1, "lantern", { hanging: "true", waterlogged: "false" });

// Roof plant: a penthouse on the tower's centre, standing on its roof slab.
const tower = [...T].filter(([, t]) => t === 13).map(([k]) => k.split(",").map(Number));
const cx = Math.round(tower.reduce((s, [x]) => s + x, 0) / tower.length), cz = Math.round(tower.reduce((s, [, z]) => s + z, 0) / tower.length);
for (let dz = -1; dz <= 0; dz++) for (let dx = -1; dx <= 0; dx++) {
  const x = cx + dx, z = cz + dz;
  if (!has(x, z) || tAt(x, z) !== 13) continue;
  put(x, 13, z, "calcite"); put(x, 14, z, "smooth_quartz");
}

// Glass panes: each connects to its in-plane neighbours that are not air, as a pane does to a wall.
const blockAt = (x, y, z) => out.get(`${x},${y},${z}`);
const g3 = new Voxels([W, H, W]);
for (const [k, v] of out) {
  const [x, y, z] = k.split(",").map(Number);
  let state = v.state;
  if (v.block === "glass_pane") {
    const inPlane = v.face === "N" || v.face === "S" ? ["W", "E"] : ["N", "S"];
    const c = {};
    for (const d of ["N", "S", "E", "W"]) c[d] = inPlane.includes(d) && blockAt(x + DIRS[d][0], y, z + DIRS[d][1]) ? "true" : "false";
    state = { north: c.N, south: c.S, east: c.E, west: c.W, waterlogged: "false" };
  }
  if (v.block) g3.set(x, y, z, v.block, state);
}
const stats = g3.save(OUT);
console.log(JSON.stringify(stats));
