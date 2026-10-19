// DC77774: Hotel-Large at 415 New Jersey Ave NW, DC 20001, as a 1.21.1 module (0.42 blocks per metre).
// Read from the lidar record: a 1980s-style brick hotel block with a pale precast trim, a tall core on the south-west
// (roof 14-16) stepping down to 3 storeys (roof 10-13) east and north, and low 1-2 storey wings on the north edge and
// the south-east corner. Lidar roof heights are smoothed (3x3 median over the footprint) and snapped to storey tiers of
// 4 blocks (3 + a string course): 2 (plinth), 4, 8, 12, 16. Each column is solid from y 0 up to its tier, so nothing
// floats, and the downhill side shows its foundation courses down to the cell's ground.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC77774.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC77774.nbt";

const key = (x, z) => `${x},${z}`;
const F = new Map(cells.map(([x, z, g, r]) => [key(x, z), { x, z, g, r }]));
const inF = (x, z) => F.has(key(x, z));

// Smoothed roof: median of the footprint cells in the 3x3 around each cell (lidar noise and 1-block gaps drop out).
const smooth = new Map();
for (const c of F.values()) {
  const vals = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const n = F.get(key(c.x + dx, c.z + dz)); if (n) vals.push(n.r);
  }
  vals.sort((a, b) => a - b);
  smooth.set(key(c.x, c.z), vals[vals.length >> 1]);
}
// Storey tiers: 2 (plinth and single course), 4, 8, 12 or 16 blocks above y 0.
const tierOf = (h) => (h <= 3 ? 2 : h <= 6 ? 4 : h <= 9 ? 8 : h <= 13 ? 12 : 16);

// Palette
const BASE = "stone_bricks";                 // plinth and foundation courses
const WALL = "bricks";                       // the walls and the piers between windows
const TRIM = "white_concrete";               // pale precast: string courses, cornice, door surround
const GLASS = "light_blue_stained_glass_pane";
const LAMP = "glowstone";                    // warm lit windows
const ROOF = "smooth_stone";                 // roof membrane and interior floor slabs
const PARAPET = "stone_brick_wall";
const DOOR = "dark_oak_door";
const AC = "iron_block";

const g = new Voxels([54, 28, 40]);

// Which sides of a cell face the outside of the footprint.
const exposed = (x, z) => ({ N: !inF(x, z - 1), S: !inF(x, z + 1), W: !inF(x - 1, z), E: !inF(x + 1, z) });
const isShell = (x, z) => { const e = exposed(x, z); return e.N || e.S || e.W || e.E; };

// Column tops: the storey tier, never below one course above the ground under the cell.
const top = new Map();
for (const c of F.values()) top.set(key(c.x, c.z), Math.max(tierOf(smooth.get(key(c.x, c.z))), c.g + 1));

// Entrance: the south face (+z) cell in the middle of the south-facing run of tall (3+ storey) shell cells.
const southRun = [...F.values()]
  .filter((c) => exposed(c.x, c.z).S && !exposed(c.x, c.z).W && !exposed(c.x, c.z).E && top.get(key(c.x, c.z)) >= 8)
  .sort((a, b) => a.x - b.x);
const door = southRun.length ? southRun[Math.floor(southRun.length / 2)] : null;

for (const c of F.values()) {
  const T = top.get(key(c.x, c.z));
  const shell = isShell(c.x, c.z);
  const e = exposed(c.x, c.z);
  const corner = (e.N || e.S) && (e.W || e.E);
  // Along-face index: x on the north and south faces, z on the east and west faces. Every third is a brick pier.
  const along = (e.N || e.S) ? c.x : c.z;
  const pier = corner || along % 3 === 0;
  const isDoor = door && c.x === door.x && c.z === door.z;

  for (let y = 0; y < T; y++) {
    if (y < c.g || y === 0) { g.set(c.x, y, c.z, BASE); continue; }     // foundation under the cell's ground and the plinth
    if (y === T - 1) { g.set(c.x, y, c.z, shell ? TRIM : ROOF); continue; } // cornice, or roof membrane over the interior
    if (y % 4 === 0) { g.set(c.x, y, c.z, shell ? TRIM : ROOF); continue; }  // string course, or the floor slab per storey
    if (!shell) continue;                                                    // interior air behind the glass
    if (y % 4 === 3) { g.set(c.x, y, c.z, WALL); continue; }                 // spandrel between a window band and the string course above

    // Window band (y % 4 = 1 or 2). The ground storey is a glazed lobby with piers only at the corners.
    const ground = y < 4;
    if (isDoor && y <= 2) {
      // Door (lower and upper halves) with a pale surround on the flanking cells.
      if (y === 1) g.set(c.x, y, c.z, DOOR, { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
      else g.set(c.x, y, c.z, DOOR, { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (pier && !(ground && !corner)) { g.set(c.x, y, c.z, WALL); continue; }
    const lit = (c.x * 7 + c.z * 11 + y * 5) % 9 === 0 && y >= 5;
    g.set(c.x, y, c.z, lit ? LAMP : GLASS);
  }

  if (shell && T >= 8) g.set(c.x, T, c.z, PARAPET);                 // parapet on the roof edge of the taller tiers
  if (!shell && T >= 12 && c.x % 6 === 3 && c.z % 6 === 3) g.set(c.x, T, c.z, AC); // roof plant on the tall tops
}

// Door surround: the flanking shell cells beside the entrance get a pale pier so the entrance reads from the street.
if (door) {
  for (const dx of [-1, 1]) {
    const c = F.get(key(door.x + dx, door.z));
    if (!c || !isShell(c.x, c.z)) continue;
    for (const y of [1, 2]) g.set(c.x, y, c.z, TRIM);
  }
  // Lanterns hang from the spandrel over the door, flanking the door's upper half.
  for (const dx of [-1, 1]) {
    const c = F.get(key(door.x + dx, door.z));
    if (c && isShell(c.x, c.z)) g.set(c.x, 2, c.z, "lantern", { hanging: "true" });
  }
}

const res = g.save(OUT);
console.log(JSON.stringify({ cells: F.size, ...res, door: door ? [door.x, door.z] : null }));
