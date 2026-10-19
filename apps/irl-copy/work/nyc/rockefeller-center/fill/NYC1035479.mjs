// 649 Fifth Avenue, the Cartier Building (NYC individual landmark, 1905): a Beaux-Arts commercial palazzo of seven storeys
// over a granite base, cream limestone (smooth quartz) above it, with piers and paired window bays, a shopfront at street
// level and a double entrance on the Fifth Avenue face (x 0). The lidar roof is smoothed into five flat tiers (top 19, 22,
// 25, 28, 31); each tier stands on the one under it, a setback core rises to 31, and a small penthouse sits on the core.
// Hollow: a floor slab per storey, air behind the glass, a one-cell skin, a deck and roof cover under a parapet. Each
// column is solid from y 0 up to its grade (the foundation) and to a common datum at y 2 (the granite base course).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${dir}/NYC1035479.cells.json`, "utf8"));

const W = 36, D = 24, Y = 44;
const key = (x, z) => `${x},${z}`;
const foot = new Map(cells.map(([x, z, g, r]) => [key(x, z), { g, r }]));
const inF = (x, z) => foot.has(key(x, z));
const tierOf = (r) => (r <= 20 ? 19 : r <= 23 ? 22 : r <= 26 ? 25 : r <= 29 ? 28 : 31);
const top = (x, z) => tierOf(foot.get(key(x, z)).r);          // exclusive: the parapet row is top, the deck top-2
const DIRS = [
  { f: "W", dx: -1, dz: 0, u: (x, z) => z },
  { f: "N", dx: 0, dz: -1, u: (x) => x },
  { f: "S", dx: 0, dz: 1, u: (x) => x },
  { f: "E", dx: 1, dz: 0, u: (x, z) => z },
];
// The faces of a cell that look out at height y: toward off the footprint, or toward a neighbour lower than y.
const faces = (x, z, y) => DIRS.filter((d) => !inF(x + d.dx, z + d.dz) || top(x + d.dx, z + d.dz) <= y);

const GRANITE = "polished_granite", LIMESTONE = "smooth_quartz", STRING = "quartz_bricks";
const g = new Voxels([W, Y, D]);

// Facade of an exposed cell in a storey's air rows: ground storey = shopfront and entrance, upper storeys = piers and bays.
function facade(x, z, y, f) {
  const u = f.u(x, z);
  const lights = y % 3 === 0 && (x * 5 + z * 3 + y) % 4 === 0;      // bottom row of a storey, behind some windows
  let block, state;
  if (y < 5) {
    if (f.f === "W" && (z === 11 || z === 12)) {
      block = "dark_oak_door";
      state = { facing: "west", half: y === 3 ? "lower" : "upper", hinge: z === 11 ? "left" : "right", open: "false", powered: "false" };
    } else if (f.f === "W" && z >= 10 && z <= 13) block = GRANITE;      // door surround
    else if (u % 3 === 0) block = GRANITE;                               // shopfront pilasters
    else block = "glass";
  } else if (u % 3 === 0) {
    block = "quartz_pillar"; state = { axis: "y" };
  } else {
    block = "glass_pane";
    state = f.f === "N" || f.f === "S" ? { north: "false", south: "false", east: "true", west: "true" } : { north: "true", south: "true", east: "false", west: "false" };
  }
  g.set(x, y, z, block, state);
  if (lights && (block === "glass" || block === "glass_pane")) {
    const ix = x - f.dx, iz = z - f.dz;                                  // the cell just inside the glass
    if (inF(ix, iz) && top(ix, iz) > y && faces(ix, iz, y).length === 0) {
      if ((x + z + y) % 2) g.set(ix, y, iz, "lantern", { hanging: "false", waterlogged: "false" });
      else g.set(ix, y, iz, "glowstone");
    }
  }
}

for (const [x, z] of cells) {
  const T = top(x, z);
  for (let y = 0; y < 2; y++) g.set(x, y, z, GRANITE);                 // foundation to grade, base course to the datum
  for (let y = 2; y < T; y++) {
    const fs = faces(x, z, y);
    if (y === T - 1) g.set(x, y, z, fs.length ? LIMESTONE : "smooth_stone");          // roof cover
    else if (y === T - 2) g.set(x, y, z, fs.length ? "chiseled_quartz_block" : LIMESTONE); // deck; cornice at the edge
    else if ((y - 2) % 3 === 0) {                                                       // storey slab / string course
      const lintel = fs.some((f) => f.f === "W") && y === 5 && z >= 10 && z <= 13;
      g.set(x, y, z, fs.length ? (lintel ? GRANITE : STRING) : LIMESTONE);
    } else if (fs.length) facade(x, z, y, fs[0]);                        // air rows: glass behind the wall skin
  }
  if (faces(x, z, T).length) g.set(x, T, z, LIMESTONE);                 // parapet
}

// A small penthouse on the setback core: the 4 x 4 box of tier-31 cells nearest the middle.
let box = null;
for (let x0 = 0; x0 <= W - 4; x0++) for (let z0 = 0; z0 <= D - 4; z0++) {
  let ok = true;
  for (let x = x0; x <= x0 + 3 && ok; x++) for (let z = z0; z <= z0 + 3 && ok; z++) ok = inF(x, z) && top(x, z) === 31;
  if (!ok) continue;
  const d = Math.abs(x0 + 1.5 - W / 2) + Math.abs(z0 + 1.5 - D / 2);
  if (!box || d < box.d) box = { x0, z0, d };
}
if (box) {
  const { x0, z0 } = box;
  for (let y = 31; y <= 33; y++) for (let x = x0; x <= x0 + 3; x++) for (let z = z0; z <= z0 + 3; z++) {
    const edge = x === x0 || x === x0 + 3 || z === z0 || z === z0 + 3;
    if (!edge) continue;
    if (y === 32 && (x === x0 + 1 || x === x0 + 2 || z === z0 + 1 || z === z0 + 2)) {
      const ns = z === z0 || z === z0 + 3;
      g.set(x, y, z, "glass_pane", ns ? { north: "false", south: "false", east: "true", west: "true" } : { north: "true", south: "true", east: "false", west: "false" });
    } else g.set(x, y, z, LIMESTONE);
  }
  for (let x = x0; x <= x0 + 3; x++) for (let z = z0; z <= z0 + 3; z++) g.set(x, 34, z, "smooth_stone");  // roof
}

const out = `${dir}/NYC1035479.nbt`;
const { blocks, palette } = g.save(out);
console.log(`${out}: ${blocks} blocks, ${palette} palette entries; penthouse ${box ? `at x ${box.x0}, z ${box.z0}` : "none"}`);
