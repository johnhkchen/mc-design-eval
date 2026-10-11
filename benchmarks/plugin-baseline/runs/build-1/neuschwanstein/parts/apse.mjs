// South (back) facade work on the Palas: the semicircular throne-hall apse with its own conical roof and gold finial,
// the three-storey oriel on corbels, and string courses tying the bays together. Castle coordinates (y lifted later).
import { P, B, roof, note, turretCap } from "./shared.mjs";
const put = (g, x, y, z, ...b) => { if (g.inBounds(x, y, z)) g.set(x, y, z, ...b); };
const AX = 97, AZ = 46, AR = 4.4, AI = 3.4;            // apse centre on the south wall plane, outer / inner radius
export function apse(g, { level }) {
  if (level < 2) return;
  const d = (x, z) => Math.hypot(x - AX, z - AZ);
  // clear pilaster and window bits the apse swallows, open the hall into it
  for (let x = AX - 5; x <= AX + 5; x++) for (let z = 47; z <= 51; z++) if (d(x, z) <= AR + 0.6) for (let y = 17; y <= 52; y++) g.unset(x, y, z);
  for (let x = AX - 3; x <= AX + 3; x++) for (let y = 25; y <= 36; y++) g.unset(x, y, 46);
  // base (rusticated), walls, raised gold platform, cornice
  for (let x = AX - 5; x <= AX + 5; x++) for (let z = 47; z <= 51; z++) {
    const r = d(x, z);
    if (r > AR) continue;
    const ring = r > AI;
    for (let y = 0; y <= 38; y++) {
      if (y < 24) { if (ring || y >= 17) g.set(x, y, z, P.base); else if (y >= 0) g.set(x, y, z, P.base); continue; }
      if (ring) g.set(x, y, z, y < 26 ? P.base : P.wall);
      else if (y === 24 || y === 25) g.set(x, y, z, "gold_block");   // the raised throne platform in the curved end
    }
  }
  for (let x = AX - 6; x <= AX + 6; x++) for (let z = 47; z <= 52; z++) { const r = d(x, z); if (r > AR && r <= AR + 1.1 && g.isAir(x, 38, z)) { const f = Math.abs(x - AX) > Math.abs(z - AZ) ? (x > AX ? "west" : "east") : "north"; put(g, x, 38, z, ...B.stairs("smooth_sandstone", f, "top")); } }
  // tall round-arched windows around the curve (5 of them), quartz mullion between
  for (const deg of [18, 54, 90, 126, 162]) {
    const a = (deg * Math.PI) / 180, x = Math.round(AX + 3.9 * Math.cos(a)), z = Math.round(AZ + 3.9 * Math.sin(a));
    for (let y = 28; y <= 34; y++) put(g, x, y, z, y === 34 ? "air" : "glass_pane", {});
    put(g, x, 34, z, ...B.stairs("calcite", "north", "bottom"));
    put(g, x, 27, z, ...B.slab("smooth_sandstone", "top"));
  }
  for (const deg of [36, 72, 108, 144]) {
    const a = (deg * Math.PI) / 180, x = Math.round(AX + 4 * Math.cos(a)), z = Math.round(AZ + 4 * Math.sin(a));
    for (let y = 26; y <= 37; y++) if (!g.isAir(x, y, z)) g.set(x, y, z, "quartz_pillar");
  }
  // inside: the gold throne in the curved end
  for (let y = 26; y <= 30; y++) put(g, AX, y, AZ + 3, y < 28 ? "gold_block" : "light_blue_concrete");
  put(g, AX, 26, AZ + 2, ...B.stairs("smooth_quartz", "south", "bottom"));
  put(g, AX, 31, AZ + 3, "gold_block");
  for (const x of [AX - 2, AX + 2]) put(g, x, 26, AZ + 2, ...B.lantern(false));
  // conical slate roof, offset to the wall plane, with a gold finial
  for (let k = 0; k <= 9; k++) {
    const r = AR + 0.8 - k * 0.55;
    for (let x = AX - 6; x <= AX + 6; x++) for (let z = 47; z <= 52; z++) {
      if (Math.hypot(x - AX, z - 46.5) <= r && g.isAir(x, 39 + k, z)) g.set(x, 39 + k, z, (x + z + k) % 2 ? "deepslate_tiles" : "polished_deepslate");
    }
  }
  put(g, AX, 49, 47, P.gold); put(g, AX, 50, 47, P.gold); put(g, AX, 51, 47, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  // ---- oriel: three storeys on corbels, x75..79, projecting to z49 ------------------------------------------------
  const walls = [[76, 49], [77, 49], [78, 49], [75, 48], [79, 48], [75, 47], [79, 47]];
  for (let x = 76; x <= 78; x++) for (let y = 25; y <= 43; y++) g.unset(x, y, 46);
  for (const [x, z] of [[76, 47], [77, 47], [78, 47], [76, 48], [77, 48], [78, 48]]) { g.set(x, 24, z, "smooth_sandstone"); g.set(x, 44, z, "smooth_sandstone"); }
  for (const [x, z] of walls) {
    g.set(x, 24, z, "smooth_sandstone");
    for (let y = 25; y <= 43; y++) {
      const s = Math.floor((y - 25) / 7), j = (y - 25) % 7;
      const corner = x === 75 || x === 79;
      if (j <= 4 && !(corner && z === 47)) g.set(x, y, z, "glass_pane", {});
      else g.set(x, y, z, corner && z === 47 ? "quartz_pillar" : P.wall);
      if (j === 5 || j === 6) g.set(x, y, z, j === 6 && (x + z) % 2 ? "smooth_sandstone" : P.wall);
    }
    g.set(x, 44, z, "smooth_sandstone");
  }
  for (const x of [75, 79]) for (let y = 25; y <= 43; y++) if (y % 7 !== 6) g.set(x, y, 48, "quartz_pillar");
  for (const x of [76, 78]) for (let y = 25; y <= 43; y++) if ((y - 25) % 7 <= 4 && g.blockAt(x, y, 49).includes("pane")) { /* glazed bays */ }
  for (let x = 76; x <= 78; x += 2) for (const y of [25, 32, 39]) g.set(x, y + 2, 49, "quartz_pillar");
  // corbels: inverted stairs stepping out under the sill course
  for (let x = 75; x <= 79; x++) { put(g, x, 23, 47, ...B.stairs("smooth_sandstone", "north", "top")); put(g, x, 23, 48, ...B.stairs("smooth_sandstone", "north", "top")); put(g, x, 22, 47, ...B.stairs("smooth_sandstone", "north", "top")); }
  for (let x = 76; x <= 78; x++) put(g, x, 23, 49, ...B.stairs("smooth_sandstone", "north", "top"));
  const cap = turretCap(g, [75, 47, 79, 49], 45, { pitch: 2.4, material: P.slate2 });
  note(`oriel cap top ${cap.top}`);
  // string courses across the back elevation between the storeys (where the face is free)
  for (const y of [23, 31, 38, 45]) for (let x = 61; x <= 103; x++) if (g.isAir(x, y, 47) && !g.isAir(x, y, 46)) g.set(x, y, 47, ...B.stairs("smooth_sandstone", "north", "top"));
}
