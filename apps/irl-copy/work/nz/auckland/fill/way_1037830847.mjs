// Mt Eden / Eden Terrace: a two-storey brick shop-and-flat block of the 1910s-20s, built to the lidar record (a 7-block
// roof over flat ground on this 24 x 12 footprint). The street front faces south, toward the viewer on Maungawhau:
// glazed shopfront bays on the ground floor, one timber-hooded entrance, sash windows in cream-plaster frames above,
// cream quoins, a string course and a cornice, a flat roof with two brick chimney stacks. Only footprint cells are
// built; interiors are air behind the glass, with a floor slab per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_1037830847.cells.json`, "utf8"));   // [x, z, ground, roof]
const OUT = `${DIR}/way_1037830847.nbt`;
const SIZE = [24, 20, 12];

const BASE = "stone_bricks", BRICK = "bricks", TRIM = "smooth_quartz", FLOOR = "smooth_stone", ROOF = "gray_concrete";
const PANE = "glass_pane", TIMBER = "dark_oak_slab", CHIMNEY = "bricks", CHIMNEY_CAP = "brick_slab";
const LANTERN = "lantern", GLOW = "glowstone";

const key = (x, z) => `${x},${z}`;
const top = new Map(cells.map(([x, z, , roof]) => [key(x, z), roof]));   // block layers below this height
const has = (x, z) => top.has(key(x, z));
const exposed = (x, z) => ({ N: !has(x, z - 1), S: !has(x, z + 1), W: !has(x - 1, z), E: !has(x + 1, z) });
const nExposed = (x, z) => Object.values(exposed(x, z)).filter(Boolean).length;
// A convex corner: a cell open to two sides whose diagonal is outside too. The stepped faces of this outline are
// open to two sides only where they turn inward, so those stay ordinary wall with bays.
function isCorner(x, z) {
  const e = exposed(x, z), v = e.N ? -1 : e.S ? 1 : null, h = e.W ? -1 : e.E ? 1 : null;
  return v !== null && h !== null && !has(x + h, z + v);
}

// Per footprint cell: is it on the outside, a corner (quoin), which face, and its position along that face.
function plan(x, z) {
  const e = exposed(x, z);
  const face = e.S ? "S" : e.N ? "N" : e.E ? "E" : e.W ? "W" : null;
  const along = e.S || e.N ? x : z;   // bays run along x on the north and south faces, along z on the ends
  return { t: top.get(key(x, z)), per: nExposed(x, z) > 0, corner: isCorner(x, z), face, along };
}

// The entrance: the south-facing wall cell nearest x = 12 (the middle of the frontage).
const doorCell = cells.map(([x, z]) => [x, z]).filter(([x, z]) => exposed(x, z).S && nExposed(x, z) === 1)
  .sort((a, b) => Math.abs(a[0] - 12) - Math.abs(b[0] - 12))[0];
const doorAlong = doorCell[0];

// Bays of 3 cells on the outside: two glazed or sash bays, then a brick pier. The door bay and its neighbours are the
// shopfront (no pier by the door).
function isWindow(x, z) {
  const p = plan(x, z);
  if (!p.per || p.corner || !p.face || isDoor(x, z)) return false;
  return p.along % 3 !== 2;
}
const isDoor = (x, z) => x === doorCell[0] && z === doorCell[1];

// Warm light behind some glass: the interior cell just inside each window, a lantern at the shop floor and a
// glowstone upstairs.
const INWARD = { S: [0, -1], N: [0, 1], E: [-1, 0], W: [1, 0] };
const lights = new Map();
for (const [x, z] of cells) {
  if (!isWindow(x, z)) continue;
  const p = plan(x, z), [dx, dz] = INWARD[p.face];
  const ix = x + dx, iz = z + dz;
  if (!has(ix, iz) || nExposed(ix, iz) > 0) continue;
  if (p.along % 6 === 1) lights.set(`${ix},${iz},1`, { b: LANTERN, s: { hanging: "false", waterlogged: "false" } });
  if (p.along % 6 === 4) lights.set(`${ix},${iz},4`, { b: GLOW });
}

const paneState = (face) => (face === "S" || face === "N"
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });

// What a footprint cell holds at height y (null = air): the storeys, the floor slabs, the cornice and roof.
function layer(x, z, y) {
  const p = plan(x, z);
  if (y >= p.t) return null;
  const perim = p.per;
  if (y === 0) return { b: perim ? BASE : FLOOR };
  if (y === 3) {
    if (!perim) return { b: FLOOR };
    if (p.face === "S" && Math.abs(p.along - doorAlong) <= 1 && !p.corner) return { b: TIMBER, s: { type: "bottom", waterlogged: "false" } };
    return { b: TRIM };
  }
  if (y === p.t - 1) return { b: perim ? TRIM : ROOF };   // the cornice / roof membrane on top
  if (!perim) {   // interior: air, except the lights set behind the glass
    return lights.get(`${x},${z},${y}`) ?? null;
  }
  if (p.corner) return { b: BRICK };   // a pier: this outline turns often, so cream quoins would swallow the bays
  if (y <= 2 && isDoor(x, z)) return { b: "dark_oak_door", s: { facing: "south", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" } };
  if (isWindow(x, z)) return { b: PANE, s: paneState(p.face) };
  return { b: BRICK };
}

const g = new Voxels(SIZE);
for (const [x, z] of cells) {
  for (let y = 0; y < SIZE[1]; y++) {
    const l = layer(x, z, y);
    if (l) g.set(x, y, z, l.b, l.s);
  }
}

// Two brick chimney stacks on the flat roof, each standing on the roof membrane.
for (const [x, z] of [[7, 4], [17, 6]]) {
  g.set(x, 7, z, CHIMNEY);
  g.set(x, 8, z, CHIMNEY_CAP, { type: "bottom", waterlogged: "false" });
}

const r = g.save(OUT);
console.log(`way_1037830847: ${r.blocks} blocks, palette ${r.palette} -> ${OUT}`);
