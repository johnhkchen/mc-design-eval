// Way 162152419: a five-storey reinforced-concrete office block of the 1960s-70s (the post-war commercial stock of
// Auckland's fringe, Eden Terrace and the CBD edge): a stone plinth on the sloping ground, a shopfront storey, four
// office storeys of glazed bays between white concrete piers, a stepped top storey with a roof terrace, and a plant
// room on the core. Lidar roof heights are snapped to storey lines; no interiors, an air gap behind the glass.
// Office glazing is tinted glass in full blocks: a see-through pane shows the empty far side of the air gap and reads
// as stray blocks from the street.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_162152419.cells.json`, "utf8"));

const STOREY = 4;                       // blocks per storey
const BASE = 4;                         // y of the shopfront floor, above the plinth (uniform, so storey lines run level)
const DIRS = [["west", -1, 0], ["east", 1, 0], ["north", 0, -1], ["south", 0, 1]];
const key = (x, z) => `${x},${z}`;

// --- columns: storeys from the lidar roof, then a 3x3 median against noise
const cols = new Map();
for (const [x, z, ground, roof] of cells) cols.set(key(x, z), { x, z, ground, roof, N: 0 });
const at = (x, z) => cols.get(key(x, z));
const nN = (x, z) => at(x, z)?.N ?? -1;                       // outside the footprint counts as below everything
const storeysFromRoof = (r) => (r < 6 ? 0 : Math.min(5, Math.max(0, Math.round((r - BASE) / STOREY))));
for (const c of cols.values()) c.N0 = storeysFromRoof(c.roof);
for (const c of cols.values()) {
  const vals = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const n = at(c.x + dx, c.z + dz); if (n) vals.push(n.N0); }
  vals.sort((a, b) => a - b); c.N = vals[vals.length >> 1];
}
const maxN = Math.max(...[...cols.values()].map((c) => c.N));

// distance in cells from the outer wall (1 = on the edge), to step the top storey back from the street
const dist = new Map();
let frontier = [];
for (const c of cols.values()) if (DIRS.some(([, dx, dz]) => !at(c.x + dx, c.z + dz))) { dist.set(c, 1); frontier.push(c); }
for (let d = 1; frontier.length; d++) {
  const next = [];
  for (const c of frontier) for (const [, dx, dz] of DIRS) { const n = at(c.x + dx, c.z + dz); if (n && !dist.has(n)) { dist.set(n, d + 1); next.push(n); } }
  frontier = next;
}
// the top storey is set back two cells from the perimeter: a roof terrace ring on the podium, the tower above it
for (const c of cols.values()) if (c.N === maxN && dist.get(c) <= 2) c.N = maxN - 1;

// the walls of storey k are on every side where the neighbour has fewer storeys (or is outside)
const wallDirs = (c, k) => DIRS.filter(([, dx, dz]) => nN(c.x + dx, c.z + dz) < k).map(([n]) => n);
const exterior = (c) => DIRS.some(([, dx, dz]) => nN(c.x + dx, c.z + dz) < c.N);
const cx = [...cols.values()].filter((c) => c.N === maxN);
const towerX = cx.reduce((s, c) => s + c.x, 0) / cx.length, towerZ = cx.reduce((s, c) => s + c.z, 0) / cx.length;

// the entrance: a ground-floor bay on the north face (the lowest z), middle of the run
const doorCands = [...cols.values()].filter((c) => c.N >= 1 && wallDirs(c, 1).length === 1 && c.x % 3 !== 0);
const northDoor = doorCands.filter((c) => wallDirs(c, 1)[0] === "north").sort((a, b) => a.x - b.x);
const pool = northDoor.length ? northDoor : doorCands.sort((a, b) => a.x - b.x);
const doorCol = pool[pool.length >> 1];

const g = new Voxels([30, 37, 40]);

for (const c of cols.values()) {
  const { x, z, N } = c, T = STOREY * N + BASE;
  // plinth on the slope: solid from y 0 up to the base course, so nothing floats and the downhill side shows its storeys
  for (let y = 0; y < BASE; y++) g.set(x, y, z, "stone");

  for (let k = 1; k <= N; k++) {
    const L = STOREY * k, wd = wallDirs(c, k), wall = wd.length > 0;
    // floor slab over the whole plate, so each storey stands on the one below
    g.set(x, L, z, wall && k === 1 ? "stone_bricks" : "white_concrete");
    if (!wall) continue;
    const xw = wd.filter((n) => n === "west" || n === "east").length, zw = wd.length - xw;
    const pier = (xw && zw) || (xw ? z : x) % 3 === 0;   // corners and every third bay are white concrete piers
    const isDoor = c === doorCol && k === 1;
    if (k === 1) {
      g.set(x, 5, z, pier ? "white_concrete" : "light_blue_stained_glass");
      g.set(x, 6, z, pier ? "white_concrete" : "light_blue_stained_glass");
      g.set(x, 7, z, pier ? "white_concrete" : "light_gray_concrete");
    } else {
      g.set(x, L + 1, z, pier ? "white_concrete" : "gray_stained_glass");
      g.set(x, L + 2, z, pier ? "white_concrete" : "gray_stained_glass");
      g.set(x, L + 3, z, pier ? "white_concrete" : "light_gray_concrete");
    }
    if (isDoor) {
      const facing = wd[0];
      g.set(x, 5, z, "oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
      g.set(x, 6, z, "oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
      const [ix, iz] = inward(c, wd);
      g.set(ix, 5, iz, "lantern", { hanging: "false", waterlogged: "false" });   // lobby lamp at the door
    } else if (!pier && (x * 31 + z * 17 + k * 13) % 5 === 0) {
      // warm light behind some glass: the air gap holds a glowstone (upper storeys) or a lantern (shopfront)
      const [ix, iz] = inward(c, wd);
      if (nN(ix, iz) >= k) {
        if (k === 1) { if ((x + z) % 2 === 0) g.set(ix, 5, iz, "lantern", { hanging: "false", waterlogged: "false" }); }
        else g.set(ix, L + 1, iz, "glowstone");
      }
    }
  }

  // roof deck at T, with a parapet on the outer edge (also where it drops to a lower neighbour)
  g.set(x, T, z, "light_gray_concrete");
  if (exterior(c)) g.set(x, T + 1, z, "white_concrete");
}

// roof: a plant room on the tower core, HVAC boxes on the lower roofs, planters on the terrace by the tower
const center = (c) => Math.abs(c.x - towerX) <= 4 && Math.abs(c.z - towerZ) <= 4;
for (const c of cols.values()) {
  const T = STOREY * c.N + BASE;
  if (c.N === maxN && dist.get(c) >= 7 && center(c)) {
    g.set(c.x, T + 1, c.z, "light_gray_concrete");
    g.set(c.x, T + 2, c.z, "light_gray_concrete");
    g.set(c.x, T + 3, c.z, "iron_block");
  } else if (c.N >= 1 && c.N < maxN && !exterior(c) && c.x % 6 === 2 && c.z % 6 === 3) {
    g.set(c.x, T + 1, c.z, "iron_block");
  } else if (c.N === maxN - 1 && !exterior(c) && c.x % 3 === 0 && DIRS.some(([, dx, dz]) => nN(c.x + dx, c.z + dz) === maxN)) {
    g.set(c.x, T + 1, c.z, "oak_leaves", { persistent: "true", waterlogged: "false" });
  }
}

function inward(c, wd) {
  const d = wd[0];
  return d === "west" ? [c.x + 1, c.z] : d === "east" ? [c.x - 1, c.z] : d === "north" ? [c.x, c.z + 1] : [c.x, c.z - 1];
}

const info = g.save(`${DIR}/way_162152419.nbt`);
console.log(JSON.stringify({ columns: cols.size, maxN, door: doorCol && [doorCol.x, doorCol.z], ...info }));
