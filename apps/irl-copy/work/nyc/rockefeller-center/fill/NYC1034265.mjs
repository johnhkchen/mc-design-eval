// 44 West 46th Street, 1985 commercial and office building: a 17-block (about 19 m) brick and granite office block of
// five storeys over a street-level shopfront. Footprint 5 x 28; z runs along the avenue, the street front is the high-z
// end (south), and a two-storey shop wing (lidar roof 6-7) sits there while the tower (lidar roof 16-17) rises to the
// north. Downhill cells (the south-west corner) start their storeys at y 0, so the shopfront steps down with the ground.
// Tower: granite base course, smooth-stone storey lines every 3 blocks, brick piers between cyan reflective glass,
// a granite cornice, a stone roof deck and a small mechanical penthouse at the north end. Shopfront: granite piers,
// tinted glass, a centre door under a dark awning. Glass sits in the wall plane with air and a floor slab behind
// (no interiors); warm glowstone sits behind some panes and in the shop.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1034265.cells.json`, "utf8"));
const X = 5, Y = 29, Z = 28;

const GRANITE = "polished_granite", STONE = "smooth_stone", BRICK = "bricks", CORNICE = "stone_bricks";
const GLASS = "cyan_stained_glass", SHOP = "gray_stained_glass", AWNING = "dark_oak_planks", LAMP = "glowstone";

const cell = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const at = (x, z) => cell.get(`${x},${z}`);
// Lidar roofs flatten into two tops: the tower (16-17) and the shop wing (6-7).
const top = (x, z) => (at(x, z).roof >= 12 ? 17 : 7);
const solid = (x, y, z) => { const c = at(x, z); return !!c && y >= 0 && y < top(x, z); };
const interior = (x, y, z) => solid(x - 1, y, z) && solid(x + 1, y, z) && solid(x, y, z - 1) && solid(x, y, z + 1);
// Floor slabs: one per storey, spanning the box (the storey lines of the facade).
const slabRows = (T) => (T === 17 ? [4, 7, 10, 13] : [4]);

const lamps = [];

function shopfront(x, y, z, gr) {
  if (x === 2 && y <= gr + 1) return { name: "dark_oak_door", state: { facing: "south", half: y === gr ? "lower" : "upper", hinge: "left", open: "false", powered: "false" } };
  if (y === 3) return { name: x === 0 || x === 4 ? STONE : AWNING };
  if (x === 0 || x === 4 || y === gr) return { name: GRANITE };
  if ((x === 1 || x === 3) && y === 2) lamps.push([x, y, z - 1]);      // a warm lamp just inside the shop glass
  return { name: SHOP };
}

function facade(x, y, z, face, p) {
  const pier = face === "e" || face === "w" ? p % 3 === 0 : p % 2 === 0;
  if (pier) return { name: BRICK };
  const [ix, iz] = face === "s" ? [x, z - 1] : face === "n" ? [x, z + 1] : face === "e" ? [x - 1, z] : [x + 1, z];
  if (interior(ix, y, iz) && (x + 2 * z + 3 * y) % 9 === 0) lamps.push([ix, y, iz]);   // warm glow behind a few panes
  return { name: GLASS };
}

function block(x, y, z) {
  const { ground: gr } = at(x, z), T = top(x, z);
  if (y < gr) return { name: GRANITE };                         // foundation up to this cell's ground
  if (y === T - 1) return { name: STONE };                      // roof deck
  if (slabRows(T).includes(y)) return { name: STONE };          // floor slab per storey
  const out = { s: !solid(x, y, z + 1), n: !solid(x, y, z - 1), e: !solid(x + 1, y, z), w: !solid(x - 1, y, z) };
  if (!out.s && !out.n && !out.e && !out.w) return null;        // interior: air
  const face = out.s ? "s" : out.n ? "n" : out.e ? "e" : "w";   // the street front wins at a corner
  const p = face === "s" || face === "n" ? x : z;               // position along that face
  if (T >= 12 && y === T - 2) return { name: CORNICE };         // cornice course under the roof
  if (y < 4) {                                                  // ground band: base, glass, head
    if (face === "s") return shopfront(x, y, z, gr);
    if (y === gr) return { name: GRANITE };
    if (y === 3) return { name: STONE };
  }
  return facade(x, y, z, face, p);
}

const g = new Voxels([X, Y, Z]);
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  for (let y = 0; y < top(x, z); y++) {
    const b = block(x, y, z);
    if (b) g.set(x, y, z, b.name, b.state);
  }
}

// Mechanical penthouse on the north end of the tower roof (stands on the roof deck).
for (let x = 1; x <= 3; x++) for (let z = 1; z <= 3; z++) for (let y = 17; y <= 18; y++) g.set(x, y, z, y === 18 ? STONE : BRICK);
for (let z = 1; z <= 3; z++) g.set(1, 17, z, GLASS);

for (const [x, y, z] of lamps) g.set(x, y, z, LAMP);

console.log(g.save(`${DIR}/NYC1034265.nbt`));
