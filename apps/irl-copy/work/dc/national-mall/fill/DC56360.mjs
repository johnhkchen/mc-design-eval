import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 1323 Naylor Ct NW (LeDroit Park, DC 20001): a brick industrial warehouse of the 1910s-20s, two storeys on a
// stone base with a three-storey tower in the south-east, a parapeted bay on the west and a one-storey lean-to.
// The lidar roof record read as clean flat tiers: 2 = lean-to, 4 = warehouse body, 5 = west bay with a coping,
// 6 = tower. A lone 5 on the east edge is noise and drops to 4. Storey lines every 2 blocks: glass in the odd rows,
// a stone string course in the even ones, piers of brick between the bays, a coping on top.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC56360.cells.json`, "utf8")); // [x, z, ground, roof] per footprint cell

const W = 15, Y = 18, D = 17;
const g = new Voxels([W, Y, D]);

const roof = new Map();
for (const [x, z, , r] of cells) roof.set(x * 100 + z, x > 5 && r === 5 ? 4 : r);
const H = (x, z) => roof.get(x * 100 + z) ?? -1; // -1 outside the footprint, so every outside face is exposed

// a cell's exposed faces: those whose neighbour is outside the footprint or lower (a setback or the street)
const DIRS = [["N", 0, -1], ["S", 0, 1], ["W", -1, 0], ["E", 1, 0]];
const faces = (x, z) => { const h = H(x, z); return DIRS.filter(([, dx, dz]) => H(x + dx, z + dz) < h).map(([f]) => f); };
const INWARD = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };

// glass panes join along their wall: east-west on a north or south face, north-south on an east or west face
const pane = (f) => (f === "N" || f === "S" ? { east: "true", west: "true", north: "false", south: "false" } : { north: "true", south: "true", east: "false", west: "false" });

// one cell of an exposed face: stone base, coping, string courses, brick piers and glass between; quoins at corners
function facade(x, y, z, hc, fs) {
  const corner = (x === 0 || x === 14) && (z === 0 || z === 16); // the footprint's own corners; notches get no quoins
  if (corner) return { id: "smooth_sandstone" };
  if (y === 0) return { id: "stone_bricks" };
  if (y === hc - 1) return { id: "smooth_stone" };
  if (y % 2 === 0) return { id: "smooth_stone" };
  const along = fs[0] === "N" || fs[0] === "S" ? x : z;
  if (along % 3 === 0) return { id: "bricks" };
  return { id: "glass_pane", state: pane(fs[0]), glass: true };
}

// the inside of a cell: a floor slab at each storey line, a roof deck on top, air between (the gap behind the glass)
function interior(y, hc) {
  if (y === hc - 1) return { id: "stone" };
  if (y % 2 === 0) return { id: "smooth_stone" };
  return null;
}

const windows = [];
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const hc = H(x, z);
  if (hc === 0) { g.set(x, 0, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" }); continue; } // the yard's paving
  const fs = faces(x, z);
  for (let y = 0; y < hc; y++) {
    const b = fs.length ? facade(x, y, z, hc, fs) : interior(y, hc);
    if (!b) continue;
    g.set(x, y, z, b.id, b.state);
    if (b.glass) windows.push([x, y, z, fs[0]]);
  }
}

// the entrance on the north face: sandstone jambs, a lintel, and a pair of doors in the middle bay
for (const [x, y] of [[9, 0], [9, 1], [11, 0], [11, 1]]) g.set(x, y, 0, "smooth_sandstone");
for (const x of [9, 10, 11]) g.set(x, 2, 0, "smooth_sandstone");
g.set(10, 0, 0, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(10, 1, 0, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
g.set(10, 1, 1, "lantern", { hanging: "true", waterlogged: "false" }); // hangs from the ground-floor ceiling slab

// warm light behind some of the glass: glowstone in the air cell just inside the pane, where it is still empty
for (const [x, y, z, f] of windows) {
  if ((x + y + z) % 4 !== 1) continue;
  const [dx, dz] = INWARD[f], ix = x + dx, iz = z + dz;
  if (H(ix, iz) > y && !g.get(ix, y, iz)) g.set(ix, y, iz, "glowstone");
}

// rooftop plant: two HVAC units on the body's deck and a pair on the tower's
for (const [x, z] of [[7, 4], [8, 4], [7, 5], [8, 5]]) g.set(x, 4, z, "gray_concrete");
for (const [x, z] of [[9, 12], [10, 12], [9, 13], [10, 13]]) g.set(x, 6, z, "gray_concrete");

// checks: the top of every cell follows its roof tier, and nothing hangs (floor slabs and the lantern are held up by the walls)
const hanging = [];
for (let y = 1; y < Y; y++) for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  const b = g.get(x, y, z);
  if (!b || g.get(x, y - 1, z) || b.block === "minecraft:lantern" || (b.block === "minecraft:smooth_stone" && y % 2 === 0)) continue;
  hanging.push([x, y, z, b.block]);
}
let worst = 0, mismatch = [];
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  let top = 0;
  for (let y = 0; y < Y; y++) if (g.get(x, y, z)) top = y + 1;
  const want = H(x, z);
  if (top !== want) mismatch.push([x, z, top, want]);
  worst = Math.max(worst, Math.abs(top - want));
}
const r = g.save(`${DIR}/DC56360.nbt`);
console.log({ ...r, windows: windows.length, hanging: hanging.length, hangingSample: hanging.slice(0, 5), mismatches: mismatch.length, mismatchSample: mismatch.slice(0, 12), worst });
