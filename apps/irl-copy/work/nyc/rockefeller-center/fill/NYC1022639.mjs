// Big Apple Hostel, 119 West 45th Street: a 1920 Midtown brick office loft, six storeys over a granite plinth,
// calcite string courses and cornice, a shopfront with a door and dark awning on the 45th Street (z = 0) front,
// a taller centre (lidar 23) over the body (21) and a lower south wing (20). Light courts open on the west at z 8-9, 12-13.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const footprint = JSON.parse(readFileSync(`${dir}/NYC1022639.cells.json`, "utf8"));   // [x, z, ground, roof]

// The lidar roof is noisy at the edges (14s and 16s on the west column); the massing reads as three flat tiers by depth.
// Ground stays as measured: each cell's foundation runs down to its own ground.
const tierRoof = (z) => (z <= 9 ? 21 : z <= 19 ? 23 : 20);
const cells = new Map(footprint.map(([x, z, g]) => [`${x},${z}`, { g, R: tierRoof(z) }]));
const cell = (x, z) => cells.get(`${x},${z}`);

const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];          // west, east, north (z = 0, the 45th Street front), south
const SLAB = new Set([1, 4, 7, 10, 13, 16, 19]);          // storey lines: floor slabs inside, calcite string courses outside
const STRING = new Set([4, 7, 10, 13, 16, 19]);
const LOWER_WINDOW = new Set([2, 5, 8, 11, 14, 17]);      // the lower glass row of each storey, sits on the floor slab
const EXTRAS = new Map([                                  // roof equipment and vents, on the interior roof membrane
  ["3,22,14", "equip"], ["4,22,14", "equip"], ["3,22,15", "equip"], ["4,22,15", "equip"],
  ["2,20,3", "rod"], ["4,20,7", "rod"], ["2,19,20", "equip"], ["5,19,20", "rod"],
]);
const PANE = {
  x: { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" },   // on a west/east face
  z: { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" },   // on a north/south face
};

// Which sides of a cell at this height are open to the air (a neighbour absent, or lower than this row).
const exposed = (x, y, z) => DIRS.filter(([dx, dz]) => { const n = cell(x + dx, z + dz); return !n || y >= n.R; });
// A cell beside a lower tier is a solid mass, so the step wall above the lower roof stands on something.
const mass = (x, z) => DIRS.some(([dx, dz]) => { const n = cell(x + dx, z + dz); return n && n.R < cell(x, z).R; });

// A warm light behind some lower-row windows: an air cell inside, on a floor slab, beside a glass window.
function lit(x, y, z) {
  if (!LOWER_WINDOW.has(y)) return false;
  return DIRS.some(([dx, dz]) => {
    const nx = x + dx, nz = z + dz;
    if (!cell(nx, nz) || !exposed(nx, y, nz).some(([ex, ez]) => ex === -dx && ez === -dz)) return false;
    return ["window", "shop"].includes(kind(nx, y, nz)) && (nx * 5 + y * 3 + nz * 7) % 3 === 0;
  });
}

function kind(x, y, z) {
  const c = cell(x, z);
  if (!c || y < 0 || y >= c.R) return "air";
  if (y < Math.max(c.g, 1)) return "foundation";
  const ex = exposed(x, y, z);
  if (!ex.length) {                                        // inside: a solid mass, the roof, a floor slab, or air
    if (mass(x, z)) return "mass";
    if (y === c.R - 1) return EXTRAS.get(`${x},${y},${z}`) ?? "membrane";
    if (SLAB.has(y)) return "slab";
    return lit(x, y, z) ? "glow" : "air";
  }
  if (y === c.R - 1) return "coping";
  if (y === c.R - 2) return "cornice";
  if (y === 1) return "plinth";
  if (ex.length > 1) return "quoin";                       // corners: limestone quoins
  if (y === 4 && ex[0][1] === -1 && x >= 1 && x <= 5) return "awning";
  if (STRING.has(y)) return "string";
  const [dx, dz] = ex[0];
  if (dz === -1 && x === 3 && y <= 3) return "door";
  if (dz === 0) return z % 3 === 0 ? "pier" : "window";  // west/east faces: brick piers every third cell
  if (x === 3) return "pier";
  return dz === -1 && y <= 3 ? "shop" : "window";
}

function spec(x, y, z) {
  const k = kind(x, y, z);
  switch (k) {
    case "air": return null;
    case "foundation": case "plinth": return ["polished_granite"];
    case "mass": return ["stone_bricks"];
    case "membrane": return ["stone"];
    case "slab": return ["smooth_stone"];
    case "glow": return ["glowstone"];
    case "equip": return ["iron_block"];
    case "rod": return ["lightning_rod", { facing: "up", powered: "false", waterlogged: "false" }];
    case "coping": return ["stone_brick_slab", { type: "top", waterlogged: "false" }];
    case "cornice": case "string": case "quoin": return ["calcite"];
    case "awning": return ["black_concrete"];
    case "pier": return ["bricks"];
    case "shop": return ["glass"];
    case "window": return ["glass_pane", PANE[exposed(x, y, z)[0][0] !== 0 ? "x" : "z"]];
    case "door": {
      const half = y === 2 ? "lower" : "upper";
      return ["oak_door", { facing: "north", half, hinge: "left", open: "false", powered: "false" }];
    }
  }
  throw new Error(`unknown kind ${k} at ${x},${y},${z}`);
}

const g = new Voxels([7, 34, 22]);
for (let z = 0; z < 22; z++) for (let y = 0; y < 34; y++) for (let x = 0; x < 7; x++) {
  const s = spec(x, y, z);
  if (s) g.set(x, y, z, s[0], s[1]);
}
const out = g.save(`${dir}/NYC1022639.nbt`);
console.log(JSON.stringify(out));
