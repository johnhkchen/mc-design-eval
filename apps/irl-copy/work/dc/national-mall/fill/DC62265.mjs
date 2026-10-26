// DC62265: 1701 6th St NW, Store-Misc. A brick commercial block with stone trim, c. 1910: a shopfront at the
// street (z=0), two storeys of windows above it, a cornice, and a massing of three flat tiers stepping down to the
// east (x=6). The lidar roof heights are smoothed into clean tiers; the ground is flat (every cell's ground is 0).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC62265.cells.json`, "utf8"));
const [W, D, Y] = [7, 4, 20];

// roof height per footprint cell; (2,2) reads 7 between 8s on the lidar, so it joins the 8 tier
const SMOOTH = { "2,2": 8 };
const roof = new Map();
for (const [x, z, , r] of cells) roof.set(`${x},${z}`, SMOOTH[`${x},${z}`] ?? r);
const inFp = (x, z) => roof.has(`${x},${z}`);
const R = (x, z) => roof.get(`${x},${z}`) ?? 0;          // off the footprint counts as 0: an open side
// a wall cell: a side open to the outside, or onto a lower tier, so its faces show
const boundary = (x, z) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => R(x + dx, z + dz) < R(x, z));
// the outward face a wall shows: street (z=0) first, then back, west, east
const outDir = (x, z) => {
  if (R(x, z - 1) < R(x, z)) return "street";
  if (R(x, z + 1) < R(x, z)) return "back";
  if (R(x - 1, z) < R(x, z)) return "west";
  if (R(x + 1, z) < R(x, z)) return "east";
  return null;
};
const INWARD = { street: [0, 1], back: [0, -1], west: [1, 0], east: [-1, 0] };

// solid: the plinth (y 0), each storey's floor (y 3, 5), a ceiling under each cap, the cap, and every wall cell
const solid = (x, y, z) => {
  const r = R(x, z);
  if (!inFp(x, z) || y >= r) return false;
  return y === 0 || y === 3 || y === 5 || y === r - 2 || y === r - 1 || boundary(x, z);
};

// the facade skin: plinth, shopfront (y 1-2), string course (3), window rows (4, 6), spandrel (5), cornice (cap)
const skin = (x, y, z, out) => {
  const r = R(x, z);
  if (y === 0 || y === r - 1) return "stone_bricks";
  if (y === 3) return out === "street" && x >= 1 && x <= 3 ? "green_wool" : "stone_bricks";   // canvas awning over the shop
  if (y === 1 || y === 2) {
    if (out !== "street") return "bricks";
    return x % 2 === 0 ? "dark_oak_planks" : "glass";     // pilasters at even x, shop glass at odd x
  }
  if (y === 5) return "bricks";
  const along = out === "street" || out === "back" ? x : z;   // position along the face
  return along % 2 === 1 ? "glass" : "bricks";            // window bays on the odd bays, brick piers between
};

const g = new Voxels([W, Y, D]);
const windows = [];
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inFp(x, z)) continue;
  const out = outDir(x, z);
  for (let y = 0; y < R(x, z); y++) {
    if (!solid(x, y, z)) continue;
    if (out && boundary(x, z)) {
      const m = skin(x, y, z, out);
      g.set(x, y, z, m);
      if (m === "glass") windows.push([x, y, z, out]);
    } else {
      g.set(x, y, z, y === R(x, z) - 1 ? "stone_bricks" : "oak_planks");   // roof caps stay stone; floors and ceilings, hidden
    }
  }
}

// an air gap behind each glass pane, and warm light in a few of them
for (const [x, y, z, out] of windows) {
  const [dx, dz] = INWARD[out];
  if (inFp(x + dx, z + dz)) g.set(x + dx, y, z + dz, "air");
}
const lit = [[1, 1, 0], [5, 1, 0], [3, 4, 0], [1, 6, 0], [5, 4, 0]];
for (const [x, y, z] of lit) {
  const w = windows.find(([wx, wy, wz]) => wx === x && wy === y && wz === z);
  if (!w) continue;
  const [dx, dz] = INWARD[w[3]];
  g.set(x + dx, y, z + dz, "glowstone");
}

// the entrance: a dark oak door on the shop's pier-free bay at x=2, under the awning
g.set(2, 1, 0, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(2, 2, 0, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
g.set(2, 1, 1, "air"); g.set(2, 2, 1, "air");          // the door opens into the air gap, not a wall

// roof equipment: a brick chimney on the back shoulder (cap 6, so it starts at 7), and an air unit on the top tier
g.set(4, 7, 3, "bricks"); g.set(4, 8, 3, "bricks");
g.set(3, 8, 3, "iron_block");

const stats = g.save(`${DIR}/DC62265.nbt`);
console.log(JSON.stringify(stats));
