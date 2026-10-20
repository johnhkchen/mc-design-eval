import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Era and type: an early-1990s Taipei office and retail tower, 11 storeys over a
// stone-clad shopfront base. White-tiled concrete piers, light-grey spandrels,
// blue-glass window bays, a stepped parapet, and a rooftop plant penthouse with a mast.
const W = 19, H = 67, D = 22;
const TOP = 55;            // roof deck, about 11 storeys of 5 blocks
const STOREY = 5;

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw587169536.cells.json", "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.max(0, Math.min(H - 1, Math.round(gr))));
const has = (x, z) => ground.has(`${x},${z}`);
const groundAt = (x, z) => ground.get(`${x},${z}`);

const put = (x, y, z, b, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p); else g.set(x, y, z, b);
};

// Pane connection props: axis "x" runs east-west along a north/south face, "z" runs north-south.
const pane = (axis, lit) => ({
  north: axis === "z" ? "true" : "false",
  south: axis === "z" ? "true" : "false",
  east: axis === "x" ? "true" : "false",
  west: axis === "x" ? "true" : "false",
  waterlogged: "false",
});

// Facade classification for a footprint cell.
const xEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z);   // faces east or west
const zEdge = (x, z) => !has(x, z - 1) || !has(x, z + 1);   // faces north or south
const perim = (x, z) => xEdge(x, z) || zEdge(x, z);
const pier = (x, z) => {
  const xe = xEdge(x, z), ze = zEdge(x, z);
  if (xe && ze) return true;
  if (xe) return z % 3 === 0;
  if (ze) return x % 3 === 0;
  return false;
};

// Find the entrance: the north-most footprint cell at x = 9 (or nearest column with cells).
let doorX = 9, doorZ = null;
for (let x = 9; x >= 0 && doorZ === null; x--) {
  for (let z = 0; z < D; z++) if (has(x, z) && zEdge(x, z) && z === Math.min(...[...Array(D).keys()].filter(k => has(x, k)))) { doorX = x; doorZ = z; break; }
}
const doorFace = doorZ !== null ? "north" : null;
let doorG = doorZ !== null ? groundAt(doorX, doorZ) : null;

for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  const gr = groundAt(x, z);
  const per = perim(x, z);
  const xe = xEdge(x, z), ze = zEdge(x, z);
  const pr = per && pier(x, z);
  const bay = xe ? z : x;

  for (let y = 0; y <= TOP + 2; y++) {
    // Foundation: solid from y 0 up to this cell's ground.
    if (y <= gr) { put(x, y, z, "stone_bricks"); continue; }

    // Parapet and roof cap above the roof deck.
    if (y === TOP + 1) { if (per) put(x, y, z, "white_concrete"); continue; }
    if (y === TOP + 2) { if (per) put(x, y, z, "smooth_quartz"); continue; }

    if (y > TOP) continue;

    const storey = Math.floor(y / STOREY);
    const rel = y % STOREY;

    if (storey === 0) {
      // Ground storey: stone-clad piers and tinted-glass shopfront.
      if (!per) continue;
      if (pr) put(x, y, z, "stone_bricks");
      else put(x, y, z, "tinted_glass");
      continue;
    }

    if (rel === 0) {
      // Storey line / floor slab.
      put(x, y, z, per ? "light_gray_concrete" : "smooth_stone");
      continue;
    }

    if (!per) continue; // interior air behind the glass

    if (pr) { put(x, y, z, "white_concrete"); continue; }

    if (rel === 4) { put(x, y, z, "light_gray_concrete"); continue; }

    // rel 1..3: window band. Some bays are warmly lit.
    const axis = xe ? "z" : "x";
    const lit = ((bay + storey * 3 + (rel === 2 ? 1 : 0)) % 7 === 0) && storey >= 2;
    put(x, y, z, lit ? "orange_stained_glass_pane" : "light_blue_stained_glass_pane", pane(axis, lit));
  }
}

// Entrance on the north face: a pair of doors centred on the bay with lanterns either side.
if (doorZ !== null) {
  const dg = doorG;
  put(doorX, dg + 1, doorZ, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(doorX, dg + 2, doorZ, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  for (const dx of [-1, 1]) {
    if (has(doorX + dx, doorZ)) put(doorX + dx, dg + 1, doorZ, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// Rooftop plant penthouse, stepped in from the parapet, with a lightning-rod mast.
const PH = { x0: 6, x1: 12, z0: 7, z1: 14 };
for (let x = PH.x0; x <= PH.x1; x++) {
  for (let z = PH.z0; z <= PH.z1; z++) {
    if (!has(x, z)) continue;
    const edge = x === PH.x0 || x === PH.x1 || z === PH.z0 || z === PH.z1;
    for (let y = TOP + 1; y <= TOP + 5; y++) {
      if (edge && y >= TOP + 2 && y <= TOP + 4 && (x + z + y) % 3 === 0) {
        put(x, y, z, "orange_stained_glass_pane", pane(x === PH.x0 || x === PH.x1 ? "z" : "x", true));
      } else {
        put(x, y, z, "light_gray_concrete");
      }
    }
    put(x, TOP + 6, z, "smooth_quartz");
  }
}
if (has(9, 10)) {
  for (let y = TOP + 7; y <= TOP + 10; y++) {
    put(9, y, 10, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  }
}

// Roof-corner shroomlights as warm beacons on the parapet.
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  if (xEdge(x, z) && zEdge(x, z) && (x + z) % 2 === 0) put(x, TOP + 3, z, "shroomlight");
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw587169536.nbt");
