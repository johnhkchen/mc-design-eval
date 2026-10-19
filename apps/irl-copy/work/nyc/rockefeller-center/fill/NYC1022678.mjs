// 1211 Avenue of the Americas, the Celanese Building, 1973: a commercial office tower of the 1970s Midtown kind, a
// grey-glass curtain wall on a black metal grid (spandrels in grey concrete, iron mullions every third column) over a
// precast-and-stone podium along the street. Footprint 120 x 52 (x runs along the street, low z = north = the street
// frontage). The lidar roof is smoothed into five clean tiers: open paving where the lidar reads 0-2, a 4-storey shoulder
// (tier 12), a 14-storey low wing along the street (42), a 30-storey shoulder (90), a setback (135) and the tower (165),
// with a plant screen on the roof. Each tier stands on the one below, the core is solid to its cap, and the glass sits
// one block out from a recessed air gap, with a floor slab in each storey (no interiors). A stone lobby with a canopy
// faces the street; warm glowstone sits behind some panes.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1022678.cells.json`, "utf8"));
const X = 120, Y = 178, Z = 52;

const cell = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inFoot = (x, z) => cell.has(`${x},${z}`);
const lidar = (x, z) => (inFoot(x, z) ? cell.get(`${x},${z}`).roof : 0);

// Lidar roof -> tier (block height above y 0). The thresholds are the lidar's own breaks; 0 = open paving, no volume.
const tierOf = (l) => (l <= 2 ? 0 : l < 30 ? 12 : l < 60 ? 42 : l < 120 ? 90 : l < 160 ? 135 : 165);

// A 3 x 3 median over the footprint's own cells (outside cells do not vote), so the tier edges come out straight and
// the lidar's speckle does not leave single-cell notches in the setbacks.
const topMap = new Map();
for (const key of cell.keys()) {
  const [x, z] = key.split(",").map(Number);
  const vals = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inFoot(x + dx, z + dz)) vals.push(tierOf(lidar(x + dx, z + dz)));
  vals.sort((a, b) => a - b);
  topMap.set(key, vals[vals.length >> 1]);
}
const top = (x, z) => (inFoot(x, z) ? topMap.get(`${x},${z}`) : 0);
const open = (x, y, z) => top(x, z) <= y;          // outside the footprint, paving, or below this height
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const faceOf = (x, y, z) => {
  for (const d of ["N", "S", "W", "E"]) { const [dx, dz] = DIRS[d]; if (open(x + dx, y, z + dz)) return d; }
  return null;
};
const edgeAt = (x, z, t) => [[0, -1], [0, 1], [-1, 0], [1, 0]].some(([dx, dz]) => top(x + dx, z + dz) < t);

// Pane states: a pane on a face along x connects east-west, one on a face along z connects north-south.
const NS = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };
const EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const lit = (u, y, k) => (u * 5 + y * 7 + k * 3) % 11 === 0;   // sparse, deterministic warm windows

const g = new Voxels([X, Y, Z]);
const columns = [...cell.keys()].map((k) => k.split(",").map(Number));

// 1. Solid mass: foundation from y 0 up to each cell's ground, the core to its tier, a roof on each top, and paving on
// the open ground so the lot reads as a court. Nothing is set above a tier, so every block sits on the one below.
for (const [x, z] of columns) {
  const { ground } = cell.get(`${x},${z}`), t = top(x, z);
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone_bricks");
  if (!t) { g.set(x, ground, z, "smooth_stone"); continue; }
  const core = t >= 90 ? "gray_concrete" : "stone_bricks";
  for (let y = ground; y < t; y++) g.set(x, y, z, y === t - 1 ? "gray_concrete" : core);
}

// 2. Faces. A base course at y 0, a polished-andesite storey band every third block, and a cornice course at each
// roof's edge. The podium has a shopfront band (clear glass between black piers) at y 1-2, and above it smooth-stone
// piers with grey glass. The tower is grey-glass bays between grey-concrete spandrels and iron mullions every third column.
const recesses = [];
for (const [x, z] of columns) {
  const t = top(x, z);
  if (!t) continue;
  const podium = t <= 42;
  for (let y = 0; y < t; y++) {
    const d = faceOf(x, y, z);
    if (!d) continue;
    const [dx, dz] = DIRS[d];
    const u = dx === 0 ? x : z;                       // position along the face
    const ix = x - dx, iz = z - dz;                   // one block in, behind the face
    const pane = dx === 0 ? NS : EW;
    if (y === 0 || y === t - 1) { g.set(x, y, z, "polished_andesite"); continue; }
    if (podium) {
      if (y <= 2) {
        if (u % 3 === 0) { g.set(x, y, z, "black_concrete"); continue; }
        g.set(x, y, z, "glass_pane", pane);
      } else if (y % 3 === 0) { g.set(x, y, z, "polished_andesite"); continue; }
      else if (u % 3 === 0) { g.set(x, y, z, "smooth_stone"); continue; }
      else g.set(x, y, z, "gray_stained_glass_pane", pane);
    } else {
      if (y % 3 === 0) { g.set(x, y, z, "gray_concrete"); continue; }
      if (u % 3 === 0) { g.set(x, y, z, "iron_block"); continue; }
      g.set(x, y, z, "gray_stained_glass_pane", pane);
    }
    // Solid behind the pane, one block in and not itself a face: an air gap (a recess), not a hole through the wall.
    const deep = inFoot(ix, iz) && top(ix, iz) > y && !faceOf(ix, y, iz);
    if (deep) recesses.push([ix, y, iz, lit(u, y, d === "N" ? 1 : d === "S" ? 2 : 3)]);
  }
}
for (const [x, y, z, warm] of recesses) g.set(x, y, z, warm ? "glowstone" : "air");

// 3. Street lobby (x 36-37, low z): a double iron door under a black canopy, a vestibule behind it, and two hanging
// lanterns. The canopy stands on the solid wall behind it, so it does not float.
g.set(36, 1, 0, "iron_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(36, 2, 0, "iron_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
g.set(37, 1, 0, "iron_door", { facing: "north", half: "lower", hinge: "right", open: "false", powered: "false" });
g.set(37, 2, 0, "iron_door", { facing: "north", half: "upper", hinge: "right", open: "false", powered: "false" });
for (const x of [36, 37]) for (const y of [1, 2]) g.set(x, y, 1, "air");
for (let x = 34; x <= 39; x++) { g.set(x, 4, 0, "black_concrete"); g.set(x, 4, 1, "smooth_stone"); }
for (const x of [35, 38]) g.set(x, 3, 0, "lantern", { hanging: "true", waterlogged: "false" });

// 4. Parapets: a bottom slab on the roof edge of each tier, standing on its cap.
for (const [x, z] of columns) {
  const t = top(x, z);
  if (t && edgeAt(x, z, t)) g.set(x, t, z, "polished_andesite_slab", { type: "bottom", waterlogged: "false" });
}

// 5. Roof plant: a screen of light-grey concrete on the tower roof and a shorter one on the setback, each on its own
// tier only, and a mechanical box on the podium roofs.
const plant = (x0, x1, z0, z1, tier, h) => {
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    if (top(x, z) !== tier) continue;
    for (let y = tier; y < tier + h; y++) g.set(x, y, z, "light_gray_concrete");
  }
};
plant(46, 50, 20, 24, 165, 2);
plant(30, 33, 14, 16, 135, 2);
plant(14, 17, 4, 6, 42, 1);

// Lidar check (not used for the massing): how far the tiers sit from the measured roof, on the cells that have one.
let dev = 0, n = 0;
for (const [x, z, , roof] of cells) if (roof > 2) { dev += Math.abs(top(x, z) - roof); n++; }

const stats = g.save(`${DIR}/NYC1022678.nbt`);
console.log(JSON.stringify({ cells: columns.length, roofMaxBlock: Math.max(...columns.map(([x, z]) => top(x, z))), meanTierDevFromLidar: +(dev / n).toFixed(2), ...stats }));
