// Hôtel Mont Blanc: a Haussmann-style commercial block, 19 x 18 blocks. Lidar roofs are binned into five flat tiers
// (parapets at 10, 15, 20, 25, and a slate mansard to 29), so the noisy north wing reads as stepped setbacks. Ground
// floor is a shopfront band with a dark sign fascia and one door; four upper storeys are 5 blocks each (string course,
// three rows of windows, head course); the mansard has dormers and two chimney stacks. Walls are solid, with an air gap
// one cell deep behind each window; some windows carry a glowstone for warm light.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill";
const cells = JSON.parse(readFileSync(`${DIR}/FR241937483.cells.json`, "utf8"));

const SIZE = [19, 45, 18];
const DOOR = { x: 15, z: 0 };                       // the north front, on the ground floor
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const INWARD = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };

// roof height above y 0 (lidar, noisy) to one of five flat tiers
const tier = (r) => (r >= 26 ? 29 : r >= 21 ? 25 : r >= 16 ? 20 : r >= 11 ? 15 : 10);
const cols = new Map();
for (const [x, z, g, roof] of cells) cols.set(`${x},${z}`, { g, H: tier(roof) });
const colAt = (x, z) => cols.get(`${x},${z}`);
const heightAt = (x, z) => colAt(x, z)?.H ?? 0;     // 0 outside the footprint

// faces of a cell that look out of the footprint (or over a lower tier) at height y
const exposed = (x, y, z) => Object.keys(DIRS).filter((d) => heightAt(x + DIRS[d][0], z + DIRS[d][1]) <= y);

const paneOn = (face) => (face === "N" || face === "S"
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });

const doorOn = (y) => ({ b: "dark_oak_door", s: { facing: "north", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" } });

// what a solid cell in the wall or the roof is made of; null = left open (the mansard's inset top)
function blockAt(x, y, z) {
  const { H } = colAt(x, z);
  const ex = exposed(x, y, z);
  const face = ex[0];
  const u = face === "N" || face === "S" ? x : z;   // position along the facade
  if (y === 0) return { b: "stone_bricks" };         // foundation and plinth
  if (H === 29 && y >= 26) {                         // slate mansard with dormers and an inset top
    if (y === 28) return ex.length ? null : { b: "deepslate_tiles" };
    if (ex.length && u % 4 === 2) return { b: "glass_pane", s: paneOn(face), win: face };
    return { b: "deepslate_tiles" };
  }
  if (y === H - 1) return { b: ex.length ? "stone_bricks" : "smooth_stone" };   // parapet and flat roof
  if (!ex.length) return { b: "calcite" };
  if (y === 1) return { b: "polished_andesite" };     // base course
  if (x === DOOR.x && z === DOOR.z && (y === 1 || y === 2)) return doorOn(y);
  if (y <= 4) {                                       // shopfronts
    if (y === 4) return { b: "dark_oak_planks" };     // fascia
    if (u % 3 === 0) return { b: "calcite" };
    return { b: "glass_pane", s: paneOn(face), win: face };
  }
  const rel = (y - 5) % 5;                             // upper storeys: string, three window rows, head
  if (rel === 0) return { b: "smooth_stone" };
  if (rel === 4) return { b: "stone_bricks" };
  if (u % 3 === 0) return { b: "calcite" };            // piers
  return { b: "glass_pane", s: paneOn(face), win: face };
}

const dec = new Map();
const windows = [];
for (const [key, { H }] of cols) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < H; y++) {
    const d = blockAt(x, y, z);
    if (!d) continue;
    dec.set(`${x},${y},${z}`, d);
    if (d.win) windows.push([x, y, z, d.win]);
  }
}

// one cell of air behind each window (and the door), with a glowstone in some of them; skipped where the wall is too thin
const air = new Set(), glow = new Set();
for (const [x, y, z, face] of windows) {
  const [dx, dz] = INWARD[face];
  const ix = x + dx, iz = z + dz;
  if (heightAt(ix, iz) <= y || heightAt(ix + dx, iz + dz) <= y) continue;
  air.add(`${ix},${y},${iz}`);
  if ((x * 7 + z * 13 + y * 5) % 9 === 0) glow.add(`${ix},${y},${iz}`);
}
air.add(`${DOOR.x},1,${DOOR.z + 1}`); air.add(`${DOOR.x},2,${DOOR.z + 1}`);   // the hall behind the door

// two chimney stacks on the mansard, rising above its inset top
const CHIMNEYS = [[6, 8], [12, 8]];

const g = new Voxels(SIZE);
for (const [key, d] of dec) {
  if (air.has(key)) continue;
  const [x, y, z] = key.split(",").map(Number);
  if (glow.has(key)) g.set(x, y, z, "glowstone");
  else g.set(x, y, z, d.b, d.s);
}
for (const [x, z] of CHIMNEYS) for (let y = 29; y <= 31; y++) g.set(x, y, z, "bricks");

const out = `${DIR}/FR241937483.nbt`;
const { blocks, palette } = g.save(out);
console.log(`saved ${out}: ${blocks} blocks, ${palette} palette entries`);
