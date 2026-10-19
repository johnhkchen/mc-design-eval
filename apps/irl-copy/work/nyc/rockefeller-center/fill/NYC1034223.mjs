// 27 West 44th Street, the Harvard Club (1894, McKim, Mead & White): an NYC individual landmark, a Renaissance Revival
// palazzo of brick over a stone base, with buff sandstone string courses, quoins and cornice. Footprint 33 x 37 cells
// as an L (open to the north-west, x 0..3 only south of z 25). Lidar roof tiers, flattened to clean storey-multiple tops:
// 18 (the low wings, 6 storeys), 22 (the main block, 7), 30 (the 10-storey hall), 34 and a 39-block block at the
// centre rising over the rest, with a small penthouse on it. Open lidar (roof 0-3) stays paved court. Every built
// column is solid from y 0 to its top, so nothing floats. The facade is a 3-block storey module: a sandstone string
// course at each storey's floor line, two rows of tall glass in each 2-wide bay with a brick pier between, a stone base
// at street level and a sandstone entrance surround on the 44th Street front (north, low z). Glass sits one block out
// with air behind it, a warm glowstone behind some panes; the core is solid stone (no interiors).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1034223.cells.json`, "utf8"));
const X = 33, Y = 45, Z = 37;

const cell = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inFoot = (x, z) => cell.has(`${x},${z}`);

// Lidar roof -> flat tier top (block height above y 0). 0 = open paved court.
const tierOf = (r) => (r <= 3 ? 0 : r <= 14 ? 15 : r <= 19 ? 18 : r <= 27 ? 22 : r <= 31 ? 30 : r <= 34 ? 34 : 39);
// A lone 39-block cell (lidar noise, or a one-cell sliver) reads as a stray spike: it drops to the 34 tier unless two
// of its neighbours also rise to 39.
const tiers = new Map(cells.map(([x, z, , roof]) => [`${x},${z}`, tierOf(roof)]));
for (const [k, t] of tiers) {
  if (t !== 39) continue;
  const [x, z] = k.split(",").map(Number);
  const n39 = [[0, -1], [0, 1], [-1, 0], [1, 0]].filter(([dx, dz]) => tiers.get(`${x + dx},${z + dz}`) === 39).length;
  if (n39 < 2) tiers.set(k, 34);
}
const roofAt = (x, z) => (inFoot(x, z) ? tiers.get(`${x},${z}`) : 0);

// Outward directions: N = low z (44th Street front), S = rear, W/E = the side walls.
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const open = (x, y, z) => roofAt(x, z) <= y;                          // outside the footprint, paved, or below y
const facesAt = (x, y, z) => Object.keys(DIRS).filter((d) => open(x + DIRS[d][0], y, z + DIRS[d][1]));

// Glass in a face: a pane on a face along x links east/west, on a face along z links north/south.
const PANE_X = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };
const PANE_Z = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const lit = (u, y, k) => (u * 5 + y * 7 + k * 3) % 11 === 0;         // sparse, deterministic warm windows

const cols = [...cell.keys()].map((k) => k.split(",").map(Number));
const g = new Voxels([X, Y, Z]);
const niches = [];                                                    // [x, y, z, warm, force] air (or glowstone) behind a pane

// Entrance on the 44th Street front: a two-block door at x 15, with sandstone jambs at x 14 and 16.
const DOOR = { x: 15, z: 0 };

for (const [x, z] of cols) {
  const { ground } = cell.get(`${x},${z}`), top = roofAt(x, z);

  // Foundation from y 0 to the street ground; open court gets a paved top.
  for (let y = 0; y < ground; y++) g.set(x, y, z, y === ground - 1 && !top ? "smooth_stone" : "stone_bricks");
  if (!top) continue;

  for (let y = ground; y < top; y++) {
    const faces = facesAt(x, y, z);
    const perim = faces.length > 0;

    // Cap: sandstone parapet on the edge, flat roof covering inside.
    if (y === top - 1) { g.set(x, y, z, perim ? "smooth_sandstone" : "smooth_stone"); continue; }
    if (!perim) { g.set(x, y, z, "stone"); continue; }                // solid core, no interior

    // Door: lower two blocks of the entrance cell, with air in the vestibule behind.
    if (x === DOOR.x && z === DOOR.z && y <= ground + 1) {
      g.set(x, y, z, "dark_oak_door", { facing: "north", half: y === ground ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      if (y === ground) for (let k = 0; k < 2; k++) niches.push([x, ground + k, z + 1, false, true]);  // vestibule
      continue;
    }
    if (x >= DOOR.x - 1 && x <= DOOR.x + 1 && z === DOOR.z && y <= ground + 1) {
      g.set(x, y, z, "smooth_sandstone");                             // jambs either side of the door
      continue;
    }

    if (y % 3 === 0) { g.set(x, y, z, "smooth_sandstone"); continue; } // string course at each floor line
    if (faces.length >= 2) { g.set(x, y, z, "smooth_sandstone"); continue; } // quoins at the corners

    const d = faces[0], [dx, dz] = DIRS[d];
    const u = dx ? z : x;                                             // position along the face
    const street = y < 3;
    if (u % 3 === 0) { g.set(x, y, z, street ? "stone_bricks" : "bricks"); continue; } // brick or stone pier
    g.set(x, y, z, "glass_pane", dx ? PANE_Z : PANE_X);               // the window, one block out
    niches.push([x - dx, y, z - dz, lit(u, y, "NSWE".indexOf(d[0])), false]);
  }
}

// Air behind each pane (a warm glowstone in some) and in the vestibule; a niche on the skin itself is left alone.
for (const [x, y, z, warm, force] of niches) {
  if (!force && (!inFoot(x, z) || roofAt(x, z) <= y || facesAt(x, y, z).length)) continue;
  g.set(x, y, z, warm ? "glowstone" : "air");
}

// Penthouse: the 3 x 3 block of the 39 tier nearest the middle of that tier, a brick box with glass at y 40 and a sandstone cap.
const tier39 = cols.filter(([x, z]) => roofAt(x, z) === 39);
const solid3 = ([x, z]) => [-1, 0, 1].every((i) => [-1, 0, 1].every((j) => roofAt(x + i, z + j) === 39));
const cands = tier39.filter(solid3);
if (cands.length) {
  const mx = cands.reduce((s, [x]) => s + x, 0) / cands.length, mz = cands.reduce((s, [, z]) => s + z, 0) / cands.length;
  const [px, pz] = cands.reduce((best, c) => (Math.hypot(c[0] - mx, c[1] - mz) < Math.hypot(best[0] - mx, best[1] - mz) ? c : best));
  for (let x = px - 1; x <= px + 1; x++) for (let z = pz - 1; z <= pz + 1; z++) {
    const inner = x === px && z === pz;
    for (let y = 39; y < 42; y++) {
      if (inner) { if (y === 41) g.set(x, y, z, "smooth_sandstone"); continue; }   // a room in the middle
      if (y === 41) g.set(x, y, z, "smooth_sandstone");
      else if (y === 40) g.set(x, y, z, "glass_pane", z !== pz ? PANE_X : PANE_Z);
      else g.set(x, y, z, "bricks");
    }
  }
}

g.save(`${DIR}/NYC1034223.nbt`);
console.log(`built NYC1034223: ${g.count()} blocks, palette ${g.palette.length}`);
