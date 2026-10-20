// Plot 3 Hirshhorn, complete: drum, piers, soffit lights, balcony band, deck, fountain, plaza, low walls, sculptures, lamps.
// Order matters: the plot's ground (grass at y0) is carved to air first so the basin, piers and sculptures can use the
// vocabulary helpers (which write only into air); the plaza paving goes last, over every air cell left at y0.
import { carve, B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import {
  balconyBand, drumRing, curvedPier, soffitLight, fountain, sculpture,
} from "../vocab.mjs";

const CX = 155;
const CZ = 15;
const R_OUT = 14.5;
const R_IN = 7.5;
const DECK_Y = 10;
const PLOT = { x0: 141, x1: 169, z0: 0, z1: 30 };
const WALL_GAPS_NS = [153, 157];
const WALL_GAPS_EW = [13, 17];
const PIER_ANGLES = [-45, 45, 135, -135];

const isAir = (g, x, y, z) => /(^|:)(cave_)?air$/.test(g.blockAt(x, y, z));
const put = (g, x, y, z, block, state) => {
  if (!isAir(g, x, y, z)) return false;
  g.set(x, y, z, block, state);
  return true;
};
const dist = (x, z) => Math.hypot(x - CX, z - CZ);
const inPlot = (x, z) => x >= PLOT.x0 && x <= PLOT.x1 && z >= PLOT.z0 && z <= PLOT.z1;

/** Low-wall cell on the plot edge, outside the drum, not in a gap. */
function isWallCell(x, z) {
  const onEdge = x === PLOT.x0 || x === PLOT.x1 || z === PLOT.z0 || z === PLOT.z1;
  if (!onEdge || dist(x, z) <= R_OUT) return false;
  if (z === PLOT.z0 || z === PLOT.z1) return !(x >= WALL_GAPS_NS[0] && x <= WALL_GAPS_NS[1]);
  return !(z >= WALL_GAPS_EW[0] && z <= WALL_GAPS_EW[1]);
}

export function build(g) {
  // 0. clear the plot's grass at y0 so every helper below finds air
  carve(g, [PLOT.x0, 0, PLOT.z0], [PLOT.x1, 0, PLOT.z1]);

  // 1. drum: balcony band first (glass stays), then the precast ring y3..9, the deck and coping at y10
  balconyBand(g, CX, CZ, R_IN, 8, { slot: { box: [150, 1, 160, 3], rOut: R_OUT } });
  drumRing(g, CX, CZ, R_OUT, R_IN, 3, 9);
  for (let x = CX - 15; x <= CX + 15; x++) for (let z = CZ - 15; z <= CZ + 15; z++) {
    const d = dist(x, z);
    if (d < R_IN || d > R_OUT) continue;
    const coping = d < R_IN + 1 || d > R_OUT - 1;
    if (coping) put(g, x, DECK_Y, z, ...B.block("smooth_stone"));
    else put(g, x, DECK_Y, z, ...B.slab("smooth_stone", "bottom"));
  }

  // 2. piers under the drum, and the undercroft soffit lights (over the drum's y3 course)
  for (const a of PIER_ANGLES) curvedPier(g, CX, CZ, 9, 12, a, 20, { y0: 0, y1: 2 });
  soffitLight(g, CX, CZ, 9, { y: 3, step: 4, over: true });
  soffitLight(g, CX, CZ, 12, { y: 3, step: 4, over: true });

  // 3. court fountain (basin cells are air from step 0)
  fountain(g, CX, CZ, 3, 0);

  // 4. uplights at the piers' feet: a ring at radius 13.5 past each pier, on the plaza
  for (const a of PIER_ANGLES) {
    const r = (a * Math.PI) / 180;
    const x = Math.round(CX + 13.5 * Math.cos(r));
    const z = Math.round(CZ + 13.5 * Math.sin(r));
    put(g, x, 0, z, "ochre_froglight");
  }

  // 5. deck lanterns every 6 cells along the ring at radius 11, standing on a full smooth stone block (not a slab)
  const deck = [];
  for (let x = CX - 12; x <= CX + 12; x++) for (let z = CZ - 12; z <= CZ + 12; z++) {
    const d = dist(x, z);
    if (d >= 10.5 && d < 11.5) {
      let a = Math.atan2(z - CZ, x - CX);
      if (a < 0) a += 2 * Math.PI;
      deck.push({ a, x, z });
    }
  }
  deck.sort((p, q) => p.a - q.a);
  for (let i = 0; i < deck.length; i += 6) {
    const { x, z } = deck[i];
    g.set(x, DECK_Y, z, ...B.block("smooth_stone"));
    put(g, x, DECK_Y + 1, z, ...B.lantern(false));
  }

  // 6. sculptures (dark blocks; basalt and polished blackstone)
  sculpture(g, 143, 0, 2, 3, { material: "polished_blackstone" });
  sculpture(g, 167, 0, 2, 2, { material: "basalt" });
  sculpture(g, 143, 0, 28, 2, { material: "basalt" });
  sculpture(g, 166, 0, 28, 3, { material: "polished_blackstone" });

  // 7. plaza lamp posts every 8 cells on an inset ring, two full blocks and a standing lantern (no wall blocks in palette)
  const lampRing = [];
  const L = { x0: 143, x1: 167, z0: 1, z1: 29 };
  for (let x = L.x0; x <= L.x1; x += 8) { lampRing.push([x, L.z0]); lampRing.push([x, L.z1]); }
  for (let z = L.z0 + 8; z < L.z1; z += 8) { lampRing.push([L.x0, z]); lampRing.push([L.x1, z]); }
  for (const [x, z] of lampRing) {
    if (dist(x, z) <= R_OUT + 1) continue;
    if (!isAir(g, x, 0, z) || !isAir(g, x, 1, z) || !isAir(g, x, 2, z)) continue;
    put(g, x, 0, z, "polished_blackstone");
    put(g, x, 1, z, "polished_blackstone");
    put(g, x, 2, z, ...B.lantern(false));
  }

  // 8. low walls on the plot edges: light grey concrete with a smooth stone slab coping, y0..1
  for (let x = PLOT.x0; x <= PLOT.x1; x++) for (let z = PLOT.z0; z <= PLOT.z1; z++) {
    if (!isWallCell(x, z)) continue;
    put(g, x, 0, z, "light_gray_concrete");
    put(g, x, 1, z, ...B.slab("smooth_stone", "bottom"));
  }

  // 9. light grey concrete rings at radius 16 in the corners of the plaza
  for (let x = PLOT.x0; x <= PLOT.x1; x++) for (let z = PLOT.z0; z <= PLOT.z1; z++) {
    const d = dist(x, z);
    if (d >= 15.5 && d < 16.5 && !isWallCell(x, z)) put(g, x, 0, z, "light_gray_concrete");
  }

  // 10. plaza paving: smooth stone at y0 over every air cell left in the plot (under and round the drum, in the court)
  for (let x = PLOT.x0; x <= PLOT.x1; x++) for (let z = PLOT.z0; z <= PLOT.z1; z++) {
    if (!inPlot(x, z)) continue;
    put(g, x, 0, z, "smooth_stone");
  }
}
