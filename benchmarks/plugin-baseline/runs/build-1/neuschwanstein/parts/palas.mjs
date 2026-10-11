// The Palas: tall white-limestone block, steep dark-slate gable roof, cross-gabled front wing, stepped gables.
import { P, shell, roof, note, B, archWindow, corniceRing, stepGable, finialAt } from "./shared.mjs";
export const PALAS = { x0: 60, z0: 31, x1: 104, z1: 46, y0: 17, top: 44 };
export const WING = { x0: 79, z0: 22, x1: 87, z1: 31 };
export function palas(g, { level }) {
  const { x0, z0, x1, z1, y0, top } = PALAS;
  // podium under the wing, down to the lower terrace
  g.fill([WING.x0, 11, WING.z0], [WING.x1, 16, WING.z1], P.base);
  shell(g, [x0, y0, z0], [x1, top, z1], P.wall, { floor: false, ceiling: true });
  shell(g, [WING.x0, y0, WING.z0], [WING.x1, top, WING.z1 - 1], P.wall, { floor: false, ceiling: true });
  g.fill([x0 + 1, y0, 38], [x1 - 1, top - 1, 39], P.wall);   // interior partition: windows never see through to the sky
  // open the wing into the hall: remove the shared wall
  g.fill([WING.x0 + 1, y0, WING.z1], [WING.x1 - 1, top - 1, WING.z1], "minecraft:air");
  // roof: preset civic overridden to a steep slate gable (a palace hall, cross-gabled)
  const rects = [[x0, z0, x1, z1], [WING.x0, WING.z0, WING.x1, WING.z1]];
  const opts = { y: top + 1, style: "gable", pitch: "steep", material: P.slate, ridge: "crest", ridgeAxis: "x", overhang: 1, eave: "cornice", trim: "smooth_sandstone", gable: P.wall, pediment: undefined, preset: "civic", dormers: { face: ["north", "south"], count: 4, style: "gable", width: 3, height: 3 }, chimneys: [{ at: [70, 39], size: 2 }, { at: [96, 39], size: 2 }] };
  const dry = roof(g, rects, "gable", { ...opts, dryRun: true });
  for (const w of dry.warnings ?? []) note(`palas roof WARN ${w.code}: ${w.message ?? ""}`);
  const r = roof(g, rects, "gable", opts);
  note(`palas roof top ${r.top} notes: ${(r.notes ?? []).join(" | ")}`);
  if (level < 2) return;
  // pilasters between the window pairs on the south (garden) face, capped with sandstone stairs
  for (const pos of [69, 74, 79, 84, 89, 94, 99]) for (const x of [pos - 2, pos - 1]) {
    for (let y = y0; y < top; y++) g.set(x, y, z1 + 1, P.wall);
    g.set(x, top, z1 + 1, ...B.stairs("smooth_sandstone", "north", "top"));
  }
  // rows of arched windows on every face (one window vocabulary: archWindow)
  const win = (face, plane, poses, rows) => { for (const pos of poses) for (const [y, h] of rows) archWindow(g, face, plane, pos, y, { w: 3, h, frame: "stone_bricks" }); };
  const rows = [[19, 5], [26, 6], [34, 6]];
  win("north", z0, [71, 75, 90, 94, 98], rows);
  win("south", z1, [64, 69, 74, 79, 84, 89, 94, 99], rows);
  win("east", x1, [34, 38, 42], rows);
  win("west", x0, [41, 44], rows);
  // wing (north gable) windows
  for (const [y, h] of [[19, 5], [26, 6], [34, 4]]) archWindow(g, "north", WING.z0, 82, y, { w: 3, h, frame: "stone_bricks" });
  // balcony on the north face between the stair turret and the wing: corbels, slab floor, balustrade
  const bx0 = 70, bx1 = 78, by = 26;
  for (let x = bx0; x <= bx1; x++) for (const z of [29, 30]) {
    g.set(x, by, z, ...B.slab("smooth_sandstone", "bottom"));
    if (z === 29) g.set(x, by - 1, z, ...B.stairs("smooth_sandstone", "south", "top"));
  }
  for (let x = bx0; x <= bx1; x++) g.set(x, by + 1, 29, ...B.wall("diorite"));
  for (const z of [29, 30]) { g.set(bx0, by + 1, z, ...B.wall("diorite")); g.set(bx1, by + 1, z, ...B.wall("diorite")); }
  for (const x of [bx0, bx1]) g.set(x, by + 2, 29, ...B.lantern(false));
  // stepped gables on the end walls: a quartz coping line along the rake
  corniceRing(g, [x0, z0, x1, z1], top);
  // crow-stepped gables: the Palas ends and the wing's north face (stepped, coped with sandstone slabs)
  const step = { y: top + 1, rise: 2, run: 1, block: P.wall, coping: { block: "smooth_sandstone_slab" } };
  stepGable(g, { face: "east", plane: x1 + 1, from: z0 - 1, to: z1 + 1, ...step });
  stepGable(g, { face: "west", plane: x0 - 1, from: z0 - 1, to: z1 + 1, ...step });
  stepGable(g, { face: "north", plane: WING.z0 - 1, from: WING.x0 - 1, to: WING.x1 + 1, ...step });
  for (const [x, z] of [[x1 + 1, Math.round((z0 + z1) / 2)], [x0 - 1, Math.round((z0 + z1) / 2)], [Math.round((WING.x0 + WING.x1) / 2), WING.z0 - 1]]) finialAt(g, x, z, 2);
}
