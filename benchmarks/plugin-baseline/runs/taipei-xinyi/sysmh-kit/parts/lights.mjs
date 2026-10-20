// P5 dusk lighting (plan.md PARTS P5): lobby chandeliers, floodlight wells at every column, gallery lanterns under the
// eave beam, roof lights set into the tiles on the 8-grid plus the ridge feet, lamp posts on the cheeks and podium
// corners, and a floodlight under each fin tip. Every write goes through a vocab helper or g.set into air.
import { COLUMN_CENTRES, OCHRE_FROGLIGHT, PORTAL, SHROOMLIGHT, chandelier, flood_well, gallery_lantern, lamp_post } from "../vocab.mjs";

const EDGE_LO = COLUMN_CENTRES[0];                 // 17: first column line
const EDGE_HI = COLUMN_CENTRES[COLUMN_CENTRES.length - 1]; // 134: last column line

// The 52 perimeter columns: every centre pair where either axis sits on an outer line.
function perimeterColumns() {
  const out = [];
  for (const cx of COLUMN_CENTRES) for (const cz of COLUMN_CENTRES) {
    if (cx === EDGE_LO || cx === EDGE_HI || cz === EDGE_LO || cz === EDGE_HI) out.push([cx, cz]);
  }
  return out;
}

// The gallery lantern spots: midway between neighbouring column centres on each side.
function midSpans() {
  const mids = [];
  for (let i = 0; i + 1 < COLUMN_CENTRES.length; i++) mids.push(Math.floor((COLUMN_CENTRES[i] + COLUMN_CENTRES[i + 1]) / 2));
  return mids;
}

// Roof-light grid: x and z = 4 + 8k from the roof origin 10 (plan.md ROOFS).
function roofGrid() {
  const pts = [];
  for (let u = 14; u <= 134; u += 8) pts.push(u);
  return pts;
}

// Roof light at (x, z): the roof part owns every roof tile, so the lock refuses a froglight set into one (roof_light
// does exactly that). The light goes on the air cell one block above the topmost roof tile instead. A cell that is not
// air there (a ridge, a flick) takes no light.
function roofLightProud(g, x, z) {
  for (let y = 42; y >= 23; y--) {
    const here = g.blockAt(x, y, z).replace(/^minecraft:/, "");
    if (here !== "yellow_concrete" && here !== "yellow_terracotta") continue;
    if (g.isAir(x, y + 1, z)) g.set(x, y + 1, z, OCHRE_FROGLIGHT, { axis: "y" });
    return;
  }
}

export function build(g) {
  // Lobby: a lid over the lobby at y 37 (the chain anchors; plan.md has no lobby ceiling, the portal lintel underside is
  // only over z 130..141), then three chandeliers (plan.md LOBBY, x 66, 75, 85 on z 125).
  g.fill([55, 37, 122], [96, 37, 129], "minecraft:smooth_stone");
  for (const x of [66, 75, 85]) chandelier(g, x, 125);

  // Floodlight wells: one cell outboard of every perimeter column. The deck cells at y 2 belong to the shell, so each
  // well stands on the deck at y 3 (flood_well refuses a deck cell without o.over, and o.over would be a locked write).
  const wells = new Set();
  for (const [cx, cz] of perimeterColumns()) {
    if (cz === EDGE_LO) wells.add(`${cx},15`);
    if (cz === EDGE_HI) wells.add(`${cx},137`);
    if (cx === EDGE_LO) wells.add(`15,${cz}`);
    if (cx === EDGE_HI) wells.add(`137,${cz}`);
  }
  for (const key of wells) {
    const [x, z] = key.split(",").map(Number);
    flood_well(g, [x, 3, z], {});
  }

  // Gallery lanterns under the eave beam, between columns, on all four gallery lines.
  // South: skip the portal span (x 49..102), where the portal's own lighting is.
  const mids = midSpans();
  for (const m of mids) {
    gallery_lantern(g, m, 17);
    if (m < PORTAL.x0 || m > PORTAL.x1) gallery_lantern(g, m, 134);
    gallery_lantern(g, 17, m);
    gallery_lantern(g, 134, m);
  }

  // Roof lights: ochre_froglight on the 8-grid just above the topmost roof tile, skipping the portal cut-out, plus a
  // light at each ridge foot on the diagonals (the ridge runs x = z and x + z = 151).
  const grid = roofGrid();
  for (const x of grid) for (const z of grid) {
    if (x >= PORTAL.x0 - 1 && x <= PORTAL.x1 + 1 && z >= PORTAL.z0 - 1) continue;
    roofLightProud(g, x, z);
  }
  for (const [x, z] of [[38, 38], [113, 38], [38, 113], [113, 113]]) roofLightProud(g, x, z);

  // Lamp posts: on the south step cheeks (x 53 and 98, z 145, 150, 155) and at the four podium corners. The base sits
  // on the cheek or deck top (y 2), so it starts at y 3.
  for (const x of [53, 98]) for (const z of [145, 150, 155]) lamp_post(g, [x, 3, z], {});
  for (const [x, z] of [[9, 9], [142, 9], [9, 142], [142, 142]]) lamp_post(g, [x, 3, z], {});

  // Fin-tip floodlights: a shroomlight under each fin's flick, against the fin top, lighting the gold tip at z 143.
  for (const x of [50, 101]) g.set(x, 45, 142, SHROOMLIGHT);
}
