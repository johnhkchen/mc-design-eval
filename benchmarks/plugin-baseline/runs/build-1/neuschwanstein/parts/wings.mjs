// The Knights' House (gabled, west) and the square Bower, with their windows and doors.
import { P, B, shell, roof, note, archWindow, stepGable, finialAt } from "./shared.mjs";
export const KNIGHTS = { x0: 20, z0: 32, x1: 38, z1: 44, y0: 17, top: 31 };
export const BOWER = { x0: 8, z0: 38, x1: 18, z1: 48, y0: 17, top: 38 };
const door = (g, x, y, z, facing) => { g.set(x, y, z, ...B.door("spruce", facing, "lower")); g.set(x, y + 1, z, ...B.door("spruce", facing, "upper")); };
export function wings(g, { level }) {
  const K = KNIGHTS, Bw = BOWER;
  shell(g, [K.x0, K.y0, K.z0], [K.x1, K.top, K.z1], P.wall, { floor: false, ceiling: true });
  g.fill([K.x0 + 1, K.y0, 38], [K.x1 - 1, K.top - 1, 38], P.wall);          // partition: no see-through windows
  const kr = { y: K.top + 1, material: P.slate, ridgeAxis: "z", gable: P.wall, ridge: "crest", edges: false, verge: "polished_blackstone_brick" };
  let r = roof(g, [[K.x0, K.z0, K.x1, K.z1]], "cottage", { ...kr, dryRun: true });
  for (const w of r.warnings ?? []) note(`knights roof WARN ${w.code}: ${w.message ?? ""}`);
  roof(g, [[K.x0, K.z0, K.x1, K.z1]], "cottage", kr);
  shell(g, [Bw.x0, Bw.y0, Bw.z0], [Bw.x1, Bw.top, Bw.z1], P.wall, { floor: false, ceiling: true });
  g.fill([Bw.x0 + 1, Bw.y0, 43], [Bw.x1 - 1, Bw.top - 1, 43], P.wall);
  const rr = [[Bw.x0, Bw.z0, Bw.x1, Bw.z1]];
  const bo = { y: Bw.top + 1, style: "pyramid", material: P.slate, pitch: "very-steep", edges: false, dormers: { face: "all", count: 1, style: "gable", width: 3, height: 3 } };
  r = roof(g, rr, "tower-cap", { ...bo, dryRun: true });
  for (const w of r.warnings ?? []) note(`bower roof WARN ${w.code}: ${w.message ?? ""}`);
  roof(g, rr, "tower-cap", bo);
  stepGable(g, { face: "north", plane: K.z0 - 1, from: K.x0 - 1, to: K.x1 + 1, y: K.top + 1, rise: 2, run: 1, block: P.wall, coping: { block: "smooth_sandstone_slab" } });
  if (level >= 2) finialAt(g, Math.round((K.x0 + K.x1) / 2), K.z0 - 1, 2);
  if (level < 2) return;
  const win = (face, plane, poses, rows) => { for (const pos of poses) for (const [y, h] of rows) archWindow(g, face, plane, pos, y, { w: 3, h }); };
  win("north", K.z0, [22, 26, 30, 34], [[19, 5], [26, 5]]);
  win("south", K.z1, [22, 26, 30, 34], [[19, 5], [26, 5]]);
  win("west", K.x0, [34, 40], [[19, 5], [26, 5]]);
  win("east", K.x1, [34, 40], [[19, 5], [26, 5]]);
  win("north", Bw.z0, [9, 14], [[20, 6], [28, 6]]);
  win("west", Bw.x0, [40, 44], [[20, 6], [28, 6]]);
  win("east", Bw.x1, [40, 44], [[20, 6], [28, 6]]);
  win("south", Bw.z1, [9, 14], [[20, 6], [28, 6]]);
  // doors onto the upper courtyard
  door(g, K.x1, K.y0, 36, "east");
  for (const [x, y] of [[K.x1, K.y0], [K.x1, K.y0 + 1]]) g.set(x, y, 35, "stone_bricks");
}
