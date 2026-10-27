// Way 448579570, Eden Terrace side of Maungawhau: a 1930s stripped-classical commercial block in cream render,
// basalt plinth and quoins (Auckland's own volcanic stone), five storeys on its north tower, stepping down
// through setbacks to one-storey wings. Hollow shell: 1-block walls, an air gap behind every glass pane,
// a floor slab per storey, flat roofs with a coping and small plant units.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_448579570.cells.json`, "utf8"));

const W = 13, D = 9, H = 36;

// lidar roof height -> a flat tier top: 6 = one storey + coping, 10 = two, 18 = four, 23 = five + parapet
const tierOf = (r) => (r >= 20 ? 23 : r >= 15 ? 18 : r >= 8 ? 10 : 6);

const plan = new Map();
for (const [x, z, g, r] of cells) plan.set(`${x},${z}`, { g, t: tierOf(r) });
// lidar noise: a tall group of fewer than three cells (touching, 8-way) is a stray spike, not a tower; it steps down to two storeys
const tall = new Set([...plan].filter(([, c]) => c.t >= 18).map(([k]) => k));
const seen = new Set();
for (const k of tall) {
  if (seen.has(k)) continue;
  const comp = [k], stack = [k]; seen.add(k);
  while (stack.length) {
    const [x, z] = stack.pop().split(",").map(Number);
    for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
      const n = `${x + dx},${z + dz}`;
      if (tall.has(n) && !seen.has(n)) { seen.add(n); comp.push(n); stack.push(n); }
    }
  }
  if (comp.length < 3) for (const n of comp) plan.get(n).t = 10;
}
const inFP = (x, z) => plan.has(`${x},${z}`);
const top = (x, z) => plan.get(`${x},${z}`).t;
// solid at height y: on the footprint and under the cell's top (foundation included)
const occ = (x, y, z) => inFP(x, z) && y < top(x, z);

const v = new Voxels([W, H, D]);
const GLASS = "light_blue_stained_glass_pane";
const glassState = (exX) => (exX
  ? { north: "true", south: "true", east: "false", west: "false" }
  : { north: "false", south: "false", east: "true", west: "true" });
const DOOR = (half) => ({ facing: "south", half, hinge: "left", open: "false", powered: "false" });
const lights = [];

for (const [key, { g, t }] of plan) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < g; y++) v.set(x, y, z, "polished_basalt");           // foundation: nothing floats on a slope
  for (let y = g; y < t; y++) {
    const ex = { xp: !occ(x + 1, y, z), xm: !occ(x - 1, y, z), zp: !occ(x, y, z + 1), zm: !occ(x, y, z - 1) };
    const exX = ex.xp || ex.xm, exZ = ex.zp || ex.zm, exterior = exX || exZ;
    if (!exterior) {                                                       // inside: floor slabs, air between
      if (y === t - 1) v.set(x, y, z, "gray_concrete");                   // roof membrane
      else if (y === g || (y - 1) % 4 === 0) v.set(x, y, z, "smooth_stone");
      continue;
    }
    if (y === t - 1) { v.set(x, y, z, "stone_bricks"); continue; }        // coping
    // entrance: a recessed door on the south face of the tip cell
    if (x === 2 && z === 8 && ex.zp && (y === g || y === g + 1)) {
      v.set(x, y, z, "dark_oak_door", DOOR(y === g ? "lower" : "upper")); continue;
    }
    if (y === g) { v.set(x, y, z, "polished_basalt"); continue; }         // plinth course
    if ((y - 1) % 4 === 0) { v.set(x, y, z, "polished_andesite"); continue; } // storey line
    if (exX && exZ) { v.set(x, y, z, "stone_bricks"); continue; }         // quoin
    if ((y - 2) % 4 === 0) { v.set(x, y, z, "smooth_quartz"); continue; }   // window sill, in the cream render
    const c = exX ? z : x;                       // column along the face
    const storey = Math.floor((y - 1) / 4);
    const ground = y < 5;
    if (ground || c % 2 === 1) {                 // shopfront glass on the ground floor, else alternate bays
      v.set(x, y, z, GLASS, glassState(exX));
      if (y % 4 === 3) lights.push({ x, y, z, exX, xp: ex.xp, zp: ex.zp, c, storey });
    } else {
      v.set(x, y, z, "smooth_quartz");           // pier
    }
  }
  // roof plant on the two tall tiers: a few iron units standing on the interior roof
  if (t >= 18 && !(!occ(x + 1, t - 1, z) || !occ(x - 1, t - 1, z) || !occ(x, t - 1, z + 1) || !occ(x, t - 1, z - 1))) {
    if (x % 3 === 1 && z % 3 === 1) v.set(x, t, z, "iron_block");
  }
}

// warm light behind some glass: a glowstone or shroomlight in the air gap just inside the pane
for (const { x, y, z, exX, xp, zp, c, storey } of lights) {
  const ix = exX ? (xp ? x - 1 : x + 1) : x;
  const iz = exX ? z : (zp ? z - 1 : z + 1);
  if (!inFP(ix, iz) || v.val(ix, y, iz) !== 0) continue;
  if ((c + storey) % 3 === 0) v.set(ix, y, iz, "glowstone");
  else if (storey >= 2 && (c + storey) % 5 === 1) v.set(ix, y, iz, "shroomlight");
}

// the entrance tip cell's glass row above the door is a lintel band, and the door's upper half stays in place
v.save(`${DIR}/way_448579570.nbt`);
console.log("saved", v.count(), "blocks,", v.palette.length - 1, "palette entries");
