// mad-heart: a mad scientist's home inside an anatomically realistic human heart.
// Authored in screen coordinates (u = viewer's left->right, y up, z front->back); world x = 29 - u.
import { Grid, B } from "../../../../../../minecraft-design/tools/src/build.mjs";
import { NU, NY, NZ, idx, R } from "./anat.mjs";
import { buildHull } from "./hull.mjs";
import { carveRooms, carveLumens, addStructure, RM } from "./interior.mjs";
import { extBlock, wallBlock, floorBlock } from "./mats.mjs";
import { ridge, fat } from "./surface.mjs";
import { makeKit } from "./kit.mjs";
import { smooth } from "./smooth.mjs";
import { despeckle } from "./cleanup.mjs";
import { exteriorShape, exterior, bands, courtyard } from "./exterior.mjs";
import { porthole } from "./openings.mjs";
import { entrance, entranceShape } from "./entrance.mjs";
import { connectShape, connect } from "./connect.mjs";
import { furnishRA } from "./furnish-ra.mjs";
import { furnishLV } from "./furnish-lv.mjs";
import { furnishRV, furnishPT, furnishLA, furnishAorta } from "./furnish-rest.mjs";

const OUT = new URL("./build.nbt", import.meta.url).pathname;
const g = new Grid([NU, NY, NZ], { dataVersion: 4189 });   // 1.21.4: the version the toolkit renders and banners/signs are written for
const X = (u) => NU - 1 - u;
const put = (u, y, z, block, state, nbt) => g.set(X(u), y, z, block, state, nbt);

// ---- 1. anatomy: hull, chambers, vessel lumens ------------------------------------------------------------------
const F = buildHull();
carveRooms(F);
carveLumens(F);
const S = addStructure(F);
// tricuspid valve: RA | RV bulkhead (2 thick) with a doorway at floor level
S.wall(7, 8, 3, 8, 24, 9);
S.open(5, 8, 6, 6, 11, 8, RM.RA);
S.open(7, 8, 6, 8, 10, 7, RM.RV);
S.open(9, 8, 5, 9, 10, 7, RM.RV);
// mitral valve: LV | LA bulkhead (2 thick) with a doorway on the balcony level; balcony floor top y=16
S.wall(8, 15, 16, 21, 24, 17);
S.open(14, 16, 16, 16, 18, 17, RM.LA);
S.slab(11, 15, 13, 19, 15, 15);
connectShape(F, S);

entranceShape(F);
exteriorShape(F);

// ---- 1b. surface relief: fat in the grooves, coronary arteries and veins proud of the muscle -------------------------
const LAD = [[16.0, 22.0], [17.2, 17.5], [18.4, 13.2], [19.4, 9.0], [20.2, 5.8], [20.6, 3.4]];
const GCV = [[18.2, 22.2], [19.8, 18.0], [21.2, 14.0], [22.4, 10.0], [22.2, 7.0]];
const CIRC = [[17.0, 22.4], [20.8, 23.6], [24.4, 22.6], [26.4, 19.6], [27.0, 16.5]];
const RCA = [[9.6, 20.2], [8.6, 16.6], [8.6, 12.0], [9.2, 8.5], [10.6, 5.4], [13.0, 3.2], [16.6, 2.2]];
const SCV = [[7.2, 18.6], [6.8, 14.0], [7.2, 10.0], [8.2, 6.6]];
fat(F, LAD, (t) => 1.9 - 1.0 * t, { seed: 3 });
fat(F, RCA, (t) => 1.7 - 0.5 * t, { seed: 4 });
fat(F, CIRC, (t) => 1.6 - 0.5 * t, { seed: 5 });
fat(F, [[7, 20.5], [11, 21.8], [15, 22.4], [18, 22.6]], () => 1.3, { seed: 6 });      // the coronary groove at the base
ridge(F, LAD, R.ART); ridge(F, CIRC, R.ART); ridge(F, RCA, R.ART);
ridge(F, GCV, R.VEIN); ridge(F, SCV, R.VEIN);
// posterior: coronary sinus, posterior descending artery and middle cardiac vein
const CS = [[8.0, 17.4], [11, 16.6], [14.5, 16.2], [18, 16.6], [21.4, 17.6]];
const PDA = [[15.2, 15.2], [16.4, 11.4], [17.8, 7.4], [19.4, 4]];
const MCV = [[13.4, 15.2], [14.4, 11.4], [16.0, 7.4], [17.4, 4.2]];
fat(F, PDA, () => 1.9, { side: "back", seed: 7 });
fat(F, CS, () => 1.8, { side: "back", seed: 8 });
ridge(F, CS, R.VEIN, { side: "back" }); ridge(F, PDA, R.ART, { side: "back" }); ridge(F, MCV, R.VEIN, { side: "back" });

const nSpeckles = despeckle(F);

// ---- 2. emit exterior and lining -------------------------------------------------------------------------------
const roomAt = (u, y, z) => (u < 0 || u >= NU || y < 0 || y >= NY || z < 0 || z >= NZ ? 0 : F.room[idx(u, y, z)]);
const solidAt = (u, y, z) => (u < 0 || u >= NU || y < 0 || y >= NY || z < 0 || z >= NZ ? 0 : F.a[idx(u, y, z)]);
const NB = [[1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1], [0, 1, 0], [0, -1, 0]];
for (let u = 0; u < NU; u++) for (let y = 0; y < NY; y++) for (let z = 0; z < NZ; z++) {
  const v = F.get(u, y, z);
  if (!v) continue;
  const above = roomAt(u, y + 1, z);
  const VESSEL_ROOM = (r) => r >= 5;
  const exposed = NB.some(([a, b, c]) => !roomAt(u + a, y + b, z + c) && !solidAt(u + a, y + b, z + c));
  if (above && !(VESSEL_ROOM(above) && exposed)) { put(u, y, z, floorBlock(above, u, y, z)); continue; }
  let outside = false, cav = 0;
  for (const [a, b, c] of NB) {
    const nu = u + a, ny = y + b, nz = z + c;
    if (roomAt(nu, ny, nz)) cav = cav || roomAt(nu, ny, nz);
    else if (!solidAt(nu, ny, nz)) outside = true;
  }
  if (outside || !cav) put(u, y, z, extBlock(v === R.FLOOR ? R.VM : v, u, y, z));
  else put(u, y, z, wallBlock(cav, u, y, z));
}

const nSmooth = smooth(F, put, { share: Number(process.env.SMOOTH ?? 1) });

// ---- 3. overlays: the way in, then rooms ------------------------------------------------------------------------------
const K = makeKit(g, F);
entrance(K, F);
connect(K);
furnishRA(K);
furnishLV(K);
furnishRV(K);
furnishPT(K);
furnishLA(K);
furnishAorta(K);
exterior(K, F);
// portholes: the vats glow through the front, the library looks out to the left, the lab to the right, the loft to the back
porthole(K, F, { side: "front", a: 11, b: 10, glass: "light_blue_stained_glass" });
porthole(K, F, { side: "front", a: 15, b: 10, glass: "light_blue_stained_glass" });
porthole(K, F, { side: "right", a: 10, b: 15 });
porthole(K, F, { side: "left", a: 9, b: 14 });
porthole(K, F, { side: "back", a: 14, b: 18 });
bands(K, F);
courtyard(K, F);

if (!process.env.NOSAVE) {
  g.save(OUT);
  console.log(JSON.stringify({ saved: OUT, solids: g.solids().length }));
}
export { F, g, K };
