// Stair turret, slender corner turrets with cone caps, and the square main tower with its gallery.
import { P, B, shell, roof, note, turretCap, roundTower, rectOf, hash, archWindow, spiralSlits, octagon, finialAt, GOLD } from "./shared.mjs";
import { cylinder } from "./shared.mjs";
import { PALAS, WING } from "./palas.mjs";

const setIfAir = (g, x, y, z, ...b) => { if (g.inBounds(x, y, z) && g.isAir(x, y, z)) g.set(x, y, z, ...b); };

/** A corbelled ring of upside-down stairs round a round shaft (the turret's overhanging neck). */
export function corbelRing(g, cx, cz, r, y, mat = "smooth_sandstone") {
  for (let dx = -r - 1; dx <= r + 1; dx++) for (let dz = -r - 1; dz <= r + 1; dz++) {
    const d = Math.hypot(dx, dz);
    if (d <= r + 1.5 && d > r - 0.3) {
      const f = Math.abs(dx) > Math.abs(dz) ? (dx > 0 ? "west" : "east") : (dz > 0 ? "north" : "south");
      setIfAir(g, cx + dx, y, cz + dz, ...B.stairs(mat, f, "top"));
    }
  }
}
export const STAIR = { cx: 65, cz: 29, r: 2 };
export const TURRETS = [[104, 31], [104, 46], [60, 46], [77, 24], [89, 24], [20, 32], [38, 32], [8, 38], [18, 38]];
export function towers(g, { level }) {
  // ---- the stair turret: tall, slender, round, far above everything -------------------------------------------
  const { cx, cz, r } = STAIR;
  g.fill([cx - r, 11, cz - r], [cx + r, 16, cz + r], P.base);        // foundation on the lower terrace
  roundTower(g, cx, cz, r, 17, 50);                                  // thin shaft y17..66
  corbelRing(g, cx, cz, r, 66);
  // octagonal belfry stage y67..73: calcite octagon with arched openings on the four flats, deck, then the needle spire
  for (let y = 67; y <= 72; y++) octagon(g, cx, cz, y);
  octagon(g, cx, cz, 73, P.wall, true);
  for (const [face, plane, pos] of [["east", cx + 3, cz - 1], ["west", cx - 3, cz - 1], ["south", cz + 3, cx - 1], ["north", cz - 3, cx - 1]]) archWindow(g, face, plane, pos, 68, { w: 3, h: 5, frame: false, pane: "glass_pane" });
  for (let dx = -3; dx <= 3; dx++) for (let dz = -3; dz <= 3; dz++) if (Math.abs(dx) + Math.abs(dz) === 4 && Math.max(Math.abs(dx), Math.abs(dz)) < 4) for (let y = 67; y <= 72; y++) g.set(cx + dx, y, cz + dz, "quartz_pillar");
  corbelRing(g, cx, cz, 3, 67, "smooth_sandstone");
  const sp = turretCap(g, rectOf(cx, cz, 3), 74, { pitch: 6, maxHeight: 25, dormer: false, material: P.slate2 });
  note(`stair spire top ${sp.top}`);
  // ---- slender round turrets with pointed slate caps -----------------------------------------------------------
  for (const [tx, tz] of TURRETS) {
    const base = tz < 30 ? 17 : 17;
    if (tz < 30) g.fill([tx - 2, 11, tz - 2], [tx + 2, 16, tz + 2], P.base);
    const top = tz < 30 ? 59 : tx < 40 ? 38 : 59;                       // wing turrets stay lower
    roundTower(g, tx, tz, 2, base, top - base + 1);
    corbelRing(g, tx, tz, 2, top - 1);
    turretCap(g, rectOf(tx, tz, 2), top + 1, { pitch: 4.6, material: tx < 40 ? P.slate : P.slate2 });
  }
  if (level >= 2) {
    spiralSlits(g, cx, cz, r, 22, 64, 4);
    for (const [tx, tz] of TURRETS) spiralSlits(g, tx, tz, 2, 24, 50, 5, 110);
  }
  // ---- main tower: square shaft, gallery, upper stage, pyramid cap ------------------------------------------
  const T = [51, 31, 59, 39];
  shell(g, [T[0], 17, T[1]], [T[2], 47, T[3]], P.wall, { floor: false, ceiling: true });
  g.fill([T[0] + 1, 17, 35], [T[2] - 1, 46, 35], P.wall);
  // gallery: slab ring one out, on corbels, quartz railing
  for (let x = T[0] - 1; x <= T[2] + 1; x++) for (let z = T[1] - 1; z <= T[3] + 1; z++) {
    const edge = x === T[0] - 1 || x === T[2] + 1 || z === T[1] - 1 || z === T[3] + 1;
    if (!edge) continue;
    const f = z === T[1] - 1 ? "south" : z === T[3] + 1 ? "north" : x === T[0] - 1 ? "east" : "west";
    setIfAir(g, x, 46, z, ...B.stairs("smooth_sandstone", f, "top"));
    setIfAir(g, x, 47, z, ...B.slab("smooth_sandstone", "top"));
    setIfAir(g, x, 48, z, ...B.wall("diorite"));                      // placeholder, replaced by pillar balustrade
  }
  shell(g, [T[0] + 1, 48, T[1] + 1], [T[2] - 1, 54, T[3] - 1], P.wall, { floor: false, ceiling: true });
  g.fill([T[0] + 2, 48, 35], [T[2] - 2, 53, 35], P.wall);
  const r2 = roof(g, [[T[0] + 1, T[1] + 1, T[2] - 1, T[3] - 1]], "tower-cap", { y: 55, style: "pyramid", material: P.slate2, pitch: "very-steep", overhang: 1, edges: false, dryRun: true });
  for (const w of r2.warnings ?? []) note(`main tower roof WARN ${w.code}: ${w.message ?? ""}`);
  const rr = roof(g, [[T[0] + 1, T[1] + 1, T[2] - 1, T[3] - 1]], "tower-cap", { y: 55, style: "pyramid", material: P.slate2, pitch: "very-steep", overhang: 1, edges: false, finial: GOLD, dormer: false });
  note(`main tower top ${rr.top}`);
  finialAt(g, 55, 35, 1, true);
  if (level >= 2) {
    for (const y of [22, 30, 38]) for (const [face, plane, pos] of [["north", T[1], 54], ["south", T[3], 54]]) archWindow(g, face, plane, pos, y, { w: 3, h: 5, frame: "stone_bricks" });
    archWindow(g, "north", T[1] + 1, 54, 49, { w: 3, h: 4, frame: "stone_bricks" });
  }
}
