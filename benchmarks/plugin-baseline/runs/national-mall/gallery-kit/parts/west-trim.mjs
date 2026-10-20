// Part 3, West trim and lights (plan.md PARTS 3): the pilasters on the spine, pavilion and end faces, the cornice ring
// at y 12 round the outline of the wings and pavilions (skipping the porticos, whose cornices the roof part builds),
// the coping course on top of the wall, and the lights under the porticos. Writes go only into air: a cell an earlier
// part built is refused and counted, never overwritten.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { pilaster, hangLamp } from "../vocab.mjs";
import { WEST } from "../vocab/base.mjs";

// the wings and end pavilions (the shell's footprint: the central block lies inside the spine)
const masses = [WEST.spine, WEST.pavilionW, WEST.pavilionE];
// the porticos: their cornices and pediments are the roof part's, so the ring leaves them alone
const porticos = [WEST.porticoN, WEST.porticoS];

const inBox = (b, x, z) => x >= b.x0 && x <= b.x1 && z >= b.z0 && z <= b.z1;
const inF = (x, z) => masses.some((b) => inBox(b, x, z));
const inG = (x, z) => porticos.some((b) => inBox(b, x, z));
// the central block's north and south faces are raised to the attic top (plan FACADES)
const centralTall = (x, z) => x >= WEST.central.x0 && x <= WEST.central.x1 && (z === WEST.central.z0 || z === WEST.central.z1);

// write one block into air; report what was refused
function put(g, out, x, y, z, entry) {
  if (!g.inBounds(x, y, z) || !g.isAir(x, y, z)) { out.refused.push([x, y, z]); return 0; }
  g.set(x, y, z, ...entry);
  out.placed++;
  return 1;
}

// Pilasters (plan FACADES): each call names the wall cell; the helper steps out one cell to the face. The helper
// writes into air only, so a pilaster on a cell the shell took is dropped without a report: the count shows it.
function pilasters(g, out) {
  const spineX = [4, 30, 34, 38, 62, 66, 70, 96];
  const pavX = [10, 13, 23, 26, 74, 77, 87, 90];
  const add = (n) => { out.n += n; };
  for (const x of spineX) { add(pilaster(g, x, 9, "north")); add(pilaster(g, x, 30, "south")); }
  for (const x of pavX) { add(pilaster(g, x, 1, "north")); add(pilaster(g, x, 38, "south")); }
  for (const z of [10, 14, 25, 29]) { add(pilaster(g, 1, z, "west")); add(pilaster(g, 99, z, "east")); }
}

// The cornice ring (plan W4): smooth_quartz_stairs upside down at y 12, each facing back into the wall it stands
// off. Cells that touch the outline of the masses on one side; corners are left as gaps (one cell each).
function cornice(g, out, y = 12) {
  const dirs = [[1, 0, "east"], [-1, 0, "west"], [0, 1, "south"], [0, -1, "north"]];
  for (let x = 0; x <= 100; x++) for (let z = 0; z <= 39; z++) {
    if (inF(x, z) || inG(x, z)) continue;
    for (const [dx, dz, facing] of dirs) {
      if (!inF(x + dx, z + dz)) continue;
      put(g, out, x, y, z, B.stairs("smooth_quartz", facing, "top"));
      break;
    }
  }
}

// The coping (plan W4): a bottom smooth_quartz slab on the top of each outer wall cell, y 15 on the wings and
// pavilions, y 17 on the central block's raised faces.
function coping(g, out) {
  for (let x = 0; x <= 100; x++) for (let z = 0; z <= 39; z++) {
    if (!inF(x, z)) continue;
    const edge = !inF(x - 1, z) || !inF(x + 1, z) || !inF(x, z - 1) || !inF(x, z + 1);
    if (!edge) continue;
    // the portico gables stand against the central attic's faces: no coping there (the roof's slab would float it)
    if (centralTall(x, z) && (inG(x, z - 1) || inG(x, z + 1) || g.isAir(x, 16, z))) continue;
    const y = centralTall(x, z) ? 17 : 15;
    put(g, out, x, y, z, B.slab("smooth_quartz", "bottom"));
  }
}

// Lights under the porticos (plan W12): the shroomlight floods are in the podium top, which the shell filled, so
// a standing lantern on the portico floor stands in at the front edge; hanging lanterns under the pediment soffit.
function porticoLights(g, out) {
  for (const z of [3, 36]) for (const x of [44, 48, 52, 56]) {
    put(g, out, x, 4, z, B.lantern(false));
  }
  // the gable's underside sits at y 14 beside the axis and at y 16 on it, so the centre lamp hangs lower
  for (const z of [6, 33]) for (const [x, y] of [[46, 13], [50, 15], [54, 13]]) {
    out.refused.push(...hangLamp(g, x, y, z).refused);
  }
}

export function build(g) {
  const out = { placed: 0, refused: [], n: 0 };
  pilasters(g, out);
  cornice(g, out);
  coping(g, out);
  porticoLights(g, out);
  console.log(`west-trim: ${out.placed} blocks, ${out.n} pilaster cells, ${out.refused.length} refused ${JSON.stringify(out.refused.slice(0, 12))}`);
  return out;
}
