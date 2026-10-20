import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 遠雄國際中心 (Xinyi, Taipei): a 2000s-era glass office tower on a granite-and-quartz
// podium, with two setbacks, a roof penthouse and a mast. About 29 storeys of 5 blocks.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw366760051";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 48, H = 159, D = 58;
const g = new Voxels([W, H, D]);

const GLASS = "light_blue_stained_glass";
const SPANDREL = "light_gray_concrete";
const MULLION = "white_concrete";
const ROOF = "smooth_quartz";

const gnd = new Map();
for (const [x, z, gy] of cells) gnd.set(`${x},${z}`, gy);
const has = (x, z) => gnd.has(`${x},${z}`);

function put(x, y, z, b, p) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
}

// 1. Foundation: solid from y 0 up to each footprint cell's ground.
for (const [x, z, gy] of cells) {
  for (let y = 0; y < gy; y++) put(x, y, z, "stone_bricks");
}

// Lit windows: sparse warm shroomlight behind a pane-sized opening at dusk.
const isLit = (x, y, z) => ((x * 7 + y * 3 + z * 11) % 17) === 0;

// 2. Tier builder. Each tier is a rectangle of footprint cells, with its own
//    base and top (absolute y, or per-cell relative to the podium ground).
function tier(rect, baseFn, topFn, opt) {
  const { x0, x1, z0, z1 } = rect;
  for (let x = x0; x <= x1; x++) {
    for (let z = z0; z <= z1; z++) {
      const gy = gnd.get(`${x},${z}`);
      if (gy === undefined) continue;
      const b = baseFn(gy);
      const t = topFn(gy);
      if (t <= b) continue;
      const edgeX = x === x0 || x === x1;
      const edgeZ = z === z0 || z === z1;
      const edge = edgeX || edgeZ;
      const corner = edgeX && edgeZ;
      const along = edgeX ? z : x;

      for (let y = b; y < t; y++) {
        if (y === t - 1) {
          // roof slab / cornice course
          put(x, y, z, edge ? ROOF : SPANDREL);
        } else if (y === b) {
          // base course
          put(x, y, z, opt.base);
        } else if (y % 5 === 0) {
          // floor slab (interior) / spandrel band (facade)
          put(x, y, z, SPANDREL);
        } else if (!edge) {
          // interior air behind the glass
          continue;
        } else if (corner) {
          put(x, y, z, MULLION);
        } else if (opt.shop && y - b < 5) {
          // storefront: glass with stone frames
          put(x, y, z, along % 4 === 0 ? "smooth_stone" : "cyan_stained_glass");
        } else if (along % 4 === 0) {
          put(x, y, z, MULLION);
        } else if (isLit(x, y, z)) {
          put(x, y, z, "shroomlight");
        } else {
          put(x, y, z, GLASS);
        }
      }
    }
  }
}

// Podium: whole footprint, 20 blocks above each cell's own ground.
tier(
  { x0: 0, x1: 47, z0: 0, z1: 57 },
  (gy) => gy,
  (gy) => gy + 20,
  { base: "polished_granite", shop: true }
);

// Tower tier 1: first setback, up to y 100.
tier(
  { x0: 9, x1: 38, z0: 9, z1: 48 },
  (gy) => gy + 20,
  () => 100,
  { base: "white_concrete" }
);

// Tower tier 2: second setback, up to y 128.
tier(
  { x0: 12, x1: 35, z0: 12, z1: 45 },
  () => 100,
  () => 128,
  { base: "white_concrete" }
);

// Tower tier 3: crown shaft, up to y 147 (roof).
tier(
  { x0: 15, x1: 32, z0: 15, z1: 42 },
  () => 128,
  () => 147,
  { base: "white_concrete" }
);

// Roof penthouse / plant room, y 147..151.
tier(
  { x0: 19, x1: 28, z0: 20, z1: 36 },
  () => 147,
  () => 152,
  { base: "light_gray_concrete" }
);

// 3. Entrance on the street (z = 0 face): glass bay, double-height door, lintel.
for (let x = 20; x <= 27; x++) {
  const gy = gnd.get(`0,0`) ?? 0;
  const gyHere = gnd.get(`${x},0`);
  if (gyHere === undefined) continue;
  for (let y = gyHere + 1; y <= gyHere + 3; y++) {
    if (x === 20 || x === 27) put(x, y, 0, MULLION);
    else if (x === 23) {
      if (y <= gyHere + 2) continue; // door handled below
      put(x, y, 0, "cyan_stained_glass");
    } else put(x, y, 0, "cyan_stained_glass");
  }
  put(x, gyHere + 4, 0, ROOF); // lintel / canopy edge
}
for (const x of [23]) {
  const gyHere = gnd.get(`${x},0`);
  if (gyHere !== undefined) {
    put(x, gyHere + 1, 0, "iron_door", {
      facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
    });
    put(x, gyHere + 2, 0, "iron_door", {
      facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
    });
  }
}

// 4. Ledge and terrace details: warm lanterns on the setback corners.
const lanternAt = [
  [9, 9, 100], [38, 9, 100], [9, 48, 100], [38, 48, 100],
  [12, 12, 128], [35, 12, 128], [12, 45, 128], [35, 45, 128],
];
for (const [x, z, y] of lanternAt) {
  if (has(x, z)) put(x, y, z, "lantern", { hanging: "false", waterlogged: "false" });
}

// 5. Roof mast with a rod tip; the top of the grid is y 158.
const mx = 23, mz = 28;
if (has(mx, mz)) {
  for (let y = 152; y <= 157; y++) put(mx, y, mz, MULLION);
  put(mx, 158, mz, "end_rod", { facing: "up" });
}

g.save(`${DIR}/${ID}.nbt`);
